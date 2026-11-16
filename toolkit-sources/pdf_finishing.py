"""Adds what the browser leaves out of the PDFs, such as titles, link text and artifact marks."""

import re
import sys
import zlib
from html import escape, unescape
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

sys.path.insert(0, str(Path(__file__).resolve().parent))

from shared import NAME


def pdf_text(value: str) -> bytes:
    return b'<FEFF' + value.encode('utf-16-be').hex().upper().encode('ascii') + b'>'


def literal_text(value: bytes) -> str:
    """A PDF string written in brackets, such as (What is it for?), as text"""
    escapes = {b'n': b'\n', b'r': b'\r', b't': b'\t', b'b': b'\b', b'f': b'\f'}
    raw = re.sub(
        rb'\\([0-7]{1,3}|.)',
        lambda m: bytes([int(m.group(1), 8)]) if m.group(1)[:1].isdigit() else escapes.get(m.group(1), m.group(1)),
        value,
        flags=re.S,
    )
    return raw[2:].decode('utf-16-be') if raw.startswith(b'\xfe\xff') else raw.decode('latin-1')


def heading_texts(html: str) -> list[str]:
    return [
        unescape(re.sub(r'<[^>]+>', '', heading)).strip()
        for heading in re.findall(r'<h[1-6][^>]*>(.*?)</h[1-6]>', html, re.S)
    ]


# Whether the PDFs say they meet PDF/UA, the standard for accessible PDFs. Only turn this on once a
# few of them pass a PDF/UA checker, such as PAC
CLAIM_PDF_UA = False

# Tokens in a page's drawing instructions. Strings in brackets can nest, so content_operations
# reads them
TOKEN = re.compile(rb'<<|>>|<[0-9A-Fa-f\s]*>|\[|\]|/[^\s/<>\[\]()%{}]*|[^\s/<>\[\]()%{}]+|%[^\r\n]*|\(')
TEXT_SHOWING = {b'Tj', b'TJ', b"'", b'"'}
PATH_BUILDING = {b'm', b'l', b'c', b'v', b'y', b'h', b're'}
PAINTING = {b'S', b's', b'f', b'F', b'f*', b'B', b'B*', b'b', b'b*'}
OPERATOR = re.compile(rb"[A-Za-z'\"][A-Za-z*'\"]*")


def content_operations(stream: bytes) -> list[tuple[int, int, bytes]]:
    """Each drawing instruction: where its operands start, where it ends, and its operator"""
    operations = []
    start = None
    position = 0
    while True:
        match = TOKEN.search(stream, position)
        if not match:
            break
        token = match.group(0)
        if token.startswith(b'%'):
            position = match.end()
            continue
        if start is None:
            start = match.start()
        if token == b'(':
            # A string, which can have brackets inside it, escaped or in pairs
            depth, i = 1, match.end()
            while depth:
                char = stream[i : i + 1]
                if char == b'\\':
                    i += 1
                elif char == b'(':
                    depth += 1
                elif char == b')':
                    depth -= 1
                elif not char:
                    raise ValueError('A string never ends')
                i += 1
            position = i
            continue
        position = match.end()
        if OPERATOR.fullmatch(token) and token not in (b'true', b'false', b'null'):
            if token == b'BI':
                raise ValueError('It has an inline picture, which this can\'t mark')
            operations.append((start, position, token))
            start = None
    return operations


def mark_artifacts(stream: bytes) -> tuple[bytes, int]:
    """
    Marks everything drawn outside the tags, such as the footer, as an artifact, which screen
    readers skip. PDF/UA doesn't allow untagged content. Each piece is marked on its own, so the
    marks never cross other instructions (PDF/UA 7.1)
    """
    wraps: list[tuple[int, int]] = []
    depth = 0
    path_start = None
    # A text object outside the tags is marked as a whole, unless part of it is tagged
    text_start = None
    text_wraps: list[tuple[int, int]] = []
    text_tagged = False
    for start, end, operator in content_operations(stream):
        if operator == b'BT':
            text_start, text_wraps, text_tagged = (start if depth == 0 else None), [], False
        elif operator == b'ET' and text_start is not None:
            wraps.extend([(text_start, end)] if text_wraps and not text_tagged else text_wraps)
            text_start = None
        if operator in (b'BDC', b'BMC'):
            depth += 1
            text_tagged = True
        elif operator == b'EMC':
            depth -= 1
        elif depth:
            path_start = None
        elif operator in PATH_BUILDING:
            path_start = start if path_start is None else path_start
        elif operator in PAINTING and path_start is not None:
            wraps.append((path_start, end))
            path_start = None
        elif operator == b'n':
            path_start = None
        elif operator in TEXT_SHOWING and text_start is not None:
            text_wraps.append((start, end))
        elif operator in TEXT_SHOWING or operator in (b'Do', b'sh'):
            wraps.append((start, end))
    out = b''
    position = 0
    for start, end in wraps:
        out += stream[position:start] + b'/Artifact BMC\n' + stream[start:end] + b'\nEMC'
        position = end
    return out + stream[position:], len(wraps)


def page_contents(data: bytes) -> list[int]:
    """The object numbers of every page's drawing instructions"""
    numbers = []
    for match in re.finditer(rb'\n\d+ 0 obj\s*(<<(?:(?!\bstream\r?\n|\bendobj\b).)*>>)\s*endobj', data, re.S):
        body = match.group(1)
        if not re.search(rb'/Type /Page\b', body):
            continue
        contents = re.search(rb'/Contents (?:(\d+) 0 R|\[([^\]]*)\])', body)
        if contents and contents.group(1):
            numbers.append(int(contents.group(1)))
        elif contents:
            numbers += [int(n) for n in re.findall(rb'(\d+) 0 R', contents.group(2))]
    return numbers


def stream_object(data: bytes, number: int) -> bytes:
    # The last copy, as an update to the file replaces any before it
    match = list(re.finditer(rb'\n%d 0 obj\s*<<(.*?)>>\s*stream\r?\n' % number, data, re.S))[-1]
    length = int(re.search(rb'/Length (\d+)', match.group(1)).group(1))
    raw = data[match.end() : match.end() + length]
    return zlib.decompress(raw) if b'/FlateDecode' in match.group(1) else raw


def new_stream(content: bytes, extra: bytes = b'', compress: bool = True) -> bytes:
    body = zlib.compress(content, 9) if compress else content
    filter_ = b' /Filter /FlateDecode' if compress else b''
    return b'<<%s%s /Length %d>>\nstream\n' % (extra, filter_, len(body)) + body + b'\nendstream'


def same_address(url: str) -> str:
    """An address as the browser writes it in a PDF, which adds a / to a site's address"""
    parts = urlsplit(url)
    return urlunsplit(parts._replace(path=parts.path or '/')) if parts.netloc else url


def link_texts(html: str) -> dict[str, list[str]]:
    """Each link's text, by its address, in the order they're on the page"""
    found: dict[str, list[str]] = {}
    for href, inner in re.findall(r'<a href="([^"]*)">(.*?)</a>', html, re.S):
        text = ' '.join(unescape(re.sub(r'<[^>]+>', '', inner)).split())
        if text:
            found.setdefault(same_address(unescape(href)), []).append(text)
    return found


def list_bodies(data: bytes, first_number: int) -> list[tuple[int, bytes]]:
    """
    Wraps each list item's content after its Lbl in an LBody tag, which PDF/UA asks for and the
    browser leaves out. New objects are numbered from first_number
    """
    objects = {
        int(m.group(1)): m.group(2)
        for m in re.finditer(rb'\n(\d+) 0 obj\s*(<<.*?>>)\s*endobj', data, re.S)
    }
    changed: list[tuple[int, bytes]] = []
    number = first_number
    for item_number, item in objects.items():
        if not re.search(rb'/Type /StructElem\s*/S /LI\b', item):
            continue
        kids = re.search(rb'/K \[([^\]]*)\]', item)
        refs = [int(n) for n in re.findall(rb'(\d+) 0 R', kids.group(1))] if kids else []
        if len(refs) < 2 or not re.search(rb'/S /Lbl\b', objects.get(refs[0], b'')):
            continue
        content = refs[1:]
        if any(re.search(rb'/S /LBody\b', objects.get(n, b'')) for n in content):
            continue
        changed.append((
            number,
            b'<</Type /StructElem\n/S /LBody\n/P %d 0 R\n/K [%s]>>'
            % (item_number, b' '.join(b'%d 0 R' % n for n in content)),
        ))
        changed.append((item_number, item.replace(kids.group(0), b'/K [%d 0 R %d 0 R]' % (refs[0], number))))
        for n in content:
            changed.append((n, re.sub(rb'/P \d+ 0 R', b'/P %d 0 R' % number, objects[n], count=1)))
        number += 1
    return changed


def link_tags(data: bytes) -> dict[int, int]:
    """
    Each annotation's tag, by its /StructParent. Empty if the ParentTree is split into parts, which
    only happens in very large files
    """
    root = re.search(rb'/StructTreeRoot (\d+) 0 R', data)
    if not root:
        return {}
    tree_root = re.findall(rb'\n%d 0 obj\s*(<<.*?>>)\s*endobj' % int(root.group(1)), data, re.S)[-1]
    parent_tree = re.search(rb'/ParentTree (\d+) 0 R', tree_root)
    if not parent_tree:
        return {}
    tree = re.findall(rb'\n%d 0 obj\s*(<<.*?>>)\s*endobj' % int(parent_tree.group(1)), data, re.S)[-1]
    nums = re.search(rb'/Nums \[([^\]]*)\]', tree)
    if not nums or b'/Kids' in tree:
        return {}
    return {int(key): int(ref) for key, ref in re.findall(rb'(\d+) (\d+) 0 R', nums.group(1))}


def xmp(title: str) -> bytes:
    """The file's details in XMP, which PDF/UA asks for, matching the browser's own details"""
    ua = (
        '<rdf:Description rdf:about="" xmlns:pdfuaid="http://www.aiim.org/pdfua/ns/id/">'
        '<pdfuaid:part>1</pdfuaid:part></rdf:Description>'
        if CLAIM_PDF_UA
        else ''
    )
    return (
        '<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?>'
        '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
        '<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">'
        f'<dc:title><rdf:Alt><rdf:li xml:lang="x-default">{escape(title)}</rdf:li></rdf:Alt></dc:title>'
        f'<dc:creator><rdf:Seq><rdf:li>{escape(NAME)}</rdf:li></rdf:Seq></dc:creator>'
        '<dc:description><rdf:Alt><rdf:li xml:lang="x-default">Inclusion Toolkit</rdf:li></rdf:Alt></dc:description>'
        '<dc:language><rdf:Bag><rdf:li>en-GB</rdf:li></rdf:Bag></dc:language>'
        f'</rdf:Description>{ua}</rdf:RDF></x:xmpmeta><?xpacket end="w"?>'
    ).encode('utf-8')


def finish_pdf(path: Path, title: str, html: str = '') -> None:
    """
    Adds what the browser leaves out, as an update at the end, so nothing else in the file moves:
    - the title in the window, and the details in XMP, which checkers and screen readers read
    - spaces dropped from bookmarks for wrapped headings, and headings repeated at page breaks
    - a description of each link, which screen readers read out
    - artifact marks on untagged content, and LBody tags in lists
    """
    data = path.read_bytes()
    trailer = data[data.rindex(b'trailer') :]
    root = int(re.search(rb'/Root (\d+) 0 R', trailer).group(1))
    size = int(re.search(rb'/Size (\d+)', trailer).group(1))
    previous = int(re.search(rb'startxref\s+(\d+)', data[data.rindex(b'startxref') :]).group(1))
    catalog = re.search(rb'\n%d 0 obj\s*(<<.*?>>)\s*endobj' % root, data, re.S).group(1)
    if b'/Lang' not in catalog:
        sys.exit(f'{path.name} has no language set. Has the browser changed?')
    if b'/StructTreeRoot' not in catalog:
        sys.exit(f'{path.name} is not tagged. Has the browser changed?')
    if b'/Metadata' in catalog:
        sys.exit(f'{path.name} already has XMP details. Has the browser changed, or is it finished already?')
    info_number, metadata_number = size, size + 1
    changed: list[tuple[int, bytes]] = []
    additions = b' /Metadata %d 0 R' % metadata_number
    # Newer versions of the browser add this themselves
    if b'/DisplayDocTitle' not in catalog:
        additions += b' /ViewerPreferences << /DisplayDocTitle true >>'
    changed.append((root, catalog[:-2] + additions + b' >>'))

    headings = {}
    for heading in heading_texts(html):
        headings[heading.replace(' ', '')] = heading
        headings[heading.replace(' ', '') * 2] = heading
    for match in re.finditer(rb'\n(\d+) 0 obj\s*(<</Title \(((?:\\.|[^\\)])*)\)(.*?)>>)\s*endobj', data, re.S):
        if b'/Parent' not in match.group(4):
            continue
        shown = literal_text(match.group(3))
        heading = headings.get(shown.replace(' ', ''))
        if heading and heading != shown:
            changed.append((int(match.group(1)), b'<</Title ' + pdf_text(heading) + match.group(4) + b'>>'))

    texts = link_texts(html)
    # The browser makes a link annotation for each line a link is on, all tied to the same Link tag,
    # so the text is chosen once for each tag
    tags = link_tags(data)
    chosen: dict[int, str] = {}
    for match in re.finditer(rb'\n(\d+) 0 obj\s*(<</Type /Annot\s*/Subtype /Link.*?>>)\s*endobj', data, re.S):
        body = match.group(2)
        uri = re.search(rb'/URI \(((?:\\.|[^\\)])*)\)', body)
        if b'/Contents' in body or not uri:
            continue
        parent = re.search(rb'/StructParent (\d+)', body)
        tag = tags.get(int(parent.group(1))) if parent else None
        if tag is not None and tag in chosen:
            text = chosen[tag]
        else:
            options = texts.get(same_address(literal_text(uri.group(1))))
            if not options:
                sys.exit(f'{path.name} has a link to {literal_text(uri.group(1))} that isn\'t in its page.')
            text = options.pop(0) if len(options) > 1 else options[0]
            if tag is not None:
                chosen[tag] = text
        changed.append((int(match.group(1)), body[:-2] + b'\n/Contents ' + pdf_text(text) + b'>>'))

    lists = list_bodies(data, metadata_number + 1)
    changed += lists
    next_number = max([metadata_number + 1, *(n + 1 for n, _ in lists)])

    for number in page_contents(data):
        try:
            marked, count = mark_artifacts(stream_object(data, number))
        except ValueError as error:
            sys.exit(f'{path.name}: {error}')
        if count:
            changed.append((number, new_stream(marked)))

    changed.append((
        info_number,
        b'<< /Title ' + pdf_text(title) + b' /Author ' + pdf_text(NAME)
        + b' /Subject ' + pdf_text('Inclusion Toolkit') + b' >>',
    ))
    # Not compressed, so tools that read the details without opening the whole file can find them
    changed.append((metadata_number, new_stream(xmp(title), b' /Type /Metadata /Subtype /XML', compress=False)))
    update = b'\n'
    offsets = {}
    for number, body in changed:
        offsets[number] = len(data) + len(update)
        update += b'%d 0 obj\n' % number + body + b'\nendobj\n'
    xref = len(data) + len(update)
    update += b'xref\n'
    for number in sorted(offsets):
        update += b'%d 1\n%010d 00000 n \n' % (number, offsets[number])
    update += (
        b'trailer\n<< /Size %d /Root %d 0 R /Info %d 0 R /Prev %d >>\nstartxref\n%d\n%%%%EOF\n'
        % (next_number, root, info_number, previous, xref)
    )
    path.write_bytes(data + update)
