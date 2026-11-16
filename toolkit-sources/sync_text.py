"""
Copies changes to the page text, in src/content/toolkit, into the Word and PowerPoint sources in
branded/, keeping their formatting. Run it after changing the page text, then run rebrand.py and
export.py. Without --write, it only shows what it would change.

    /opt/homebrew/bin/python3 -I toolkit-sources/sync_text.py [--write]

It:
- makes each Word source match its page, paragraph by paragraph
- makes the same wording changes on the highlight slides, where the same words are on a slide
- makes the infographic slides match their pages, paragraph by paragraph
- writes out each abbreviation in full the first time it's used on each slide, as the site does

It lists anything to do by hand, such as a paragraph with line breaks in it.
"""

import difflib
import re
import sys
from html import escape, unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
from rebrand import BLUE, BRANDED, REL_HYPERLINK, SITE_URL, Package  # noqa: E402

TEXT = ROOT.parent / 'src' / 'content' / 'toolkit'
ABBREVIATIONS_FILE = ROOT.parent / 'src' / 'content' / 'abbreviations.ts'
WRITE = '--write' in sys.argv

# Each Word source, and the page it matches
WORD_PAGES = [
    ('highlights/accessibility/accessibility-highlights.docx', 'accessibility/highlights/accessibility-highlights.md'),
    ('highlights/neurodiversity/neurodiversity-highlights.docx', 'neurodiversity/highlights/neurodiversity-highlights.md'),
    ('accessible-meeting-checklist.docx', 'accessible-meeting-checklist.md'),
    ('meeting-invite-template.docx', 'meeting-invite-template.md'),
    ('email-signature-additions.docx', 'email-signature-additions.md'),
]
# Each highlights deck, and the Word source its wording follows
HIGHLIGHT_DECKS = [
    ('highlights/accessibility/accessibility-highlights.pptx', 'highlights/accessibility/accessibility-highlights.docx'),
    ('highlights/neurodiversity/neurodiversity-highlights.pptx', 'highlights/neurodiversity/neurodiversity-highlights.docx'),
]
# Each infographics deck, and the page it matches
INFOGRAPHIC_DECKS = [
    ('infographics/accessibility/accessibility-infographics.pptx', 'accessibility/infographics/accessibility-infographics.md'),
    ('infographics/neurodiversity/neurodiversity-infographics.pptx', 'neurodiversity/infographics/neurodiversity-infographics.md'),
]
# Slide wording that's shorter than the page's on purpose, so it fits its box
KEEP_ON_SLIDES = {"Never put anything in their mouth, as people can't swallow their tongue."}

WORD_PARAGRAPH = re.compile(r'<w:p[ >].*?</w:p>', re.S)
WORD_TEXT = re.compile(r'(<w:t(?: [^>]*)?>)([^<]*)(</w:t>)')
SLIDE_PARAGRAPH = re.compile(r'<a:p>.*?</a:p>|<a:p .*?</a:p>', re.S)
SLIDE_TEXT = re.compile(r'(<a:t>)([^<]*)(</a:t>)')
# Words either side of a changed phrase, so a highlight slide only changes where its wording matches
CONTEXT = 3

problems: list[str] = []


def norm(text: str) -> str:
    return (
        text.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
        .replace('\xa0', ' ')
    )


# A line break inside a slide's paragraph reads as a space, as in the infographics' disclaimer
SLIDE_BREAK = re.compile(r'<a:br\b[^>]*/>|<a:br\b.*?</a:br>', re.S)


def text_of(paragraph: str, pattern: re.Pattern) -> str:
    if pattern is SLIDE_TEXT:
        paragraph = SLIDE_BREAK.sub('<a:t> </a:t>', paragraph)
    return unescape(''.join(m.group(2) for m in pattern.finditer(paragraph)))


def page_paragraphs(path: Path) -> list[dict]:
    """Each paragraph, list item and heading of a page, as plain text, with its links"""
    source = path.read_text(encoding='utf-8')
    source = re.sub(r'```[\s\S]*?```', lambda m: '\n'.join(m.group(0).splitlines()[1:-1]), source)
    found = []
    for line in source.splitlines():
        line = line.strip()
        if not line:
            continue
        heading = bool(re.match(r'#+\s', line))
        item = bool(re.match(r'[-*]\s+|\d+\.\s+', line))
        line = re.sub(r'^#+\s*', '', line)
        line = re.sub(r'^[-*]\s+|^\d+\.\s+', '', line)

        # Symbols that make a picture, which the page labels for screen readers, have the label
        # written after them, as Word and slides have no other way to describe them (WCAG 1.1.1)
        def described(m: re.Match) -> str:
            before, after = line[: m.start()], line[m.end() :]
            if after.startswith(' ('):
                return m.group(2)
            inside = before.count('(') > before.count(')')
            return f'{m.group(2)} [{m.group(1)}]' if inside else f'{m.group(2)} ({m.group(1)})'

        line = re.sub(r'<span role="img" aria-label="([^"]*)">([^<]*)</span>', described, line)
        line = re.sub(r'\*\*([^*]*)\*\*|`([^`]*)`', lambda m: m.group(1) or m.group(2), line)
        # Italics written with underscores, but not escaped ones, such as in the shrug
        line = re.sub(r'(?<![\w\\])_(\S[^_]*?)(?<!\\)_(?!\w)', r'\1', line)
        segments, position = [], 0
        for m in re.finditer(r'\[([^\]]*)\]\(([^)]*)\)', line):
            segments += [unescape_markdown(line[position : m.start()]), (unescape_markdown(m.group(1)), m.group(2))]
            position = m.end()
        segments.append(unescape_markdown(line[position:]))
        text = ''.join(s if isinstance(s, str) else s[0] for s in segments)
        found.append({
            'text': text,
            'links': [s[0] for s in segments if isinstance(s, tuple)],
            'segments': segments,
            'heading': heading,
            'item': item,
            'summary': bool(found) and found[-1]['text'] == 'In short',
        })
    return found


def unescape_markdown(text: str) -> str:
    return re.sub(r'\\(.)', r'\1', text)


def edit_runs(paragraph: str, new: str, pattern: re.Pattern) -> str:
    """Changes a paragraph's text to new, character by character, so each run keeps its formatting"""
    matches = list(pattern.finditer(paragraph))
    pieces = [unescape(m.group(2)) for m in matches]
    old = ''.join(pieces)
    owner = [i for i, piece in enumerate(pieces) for _ in piece]
    out = [''] * len(pieces)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, norm(old), norm(new), autojunk=False).get_opcodes():
        if tag == 'equal':
            for k in range(i1, i2):
                out[owner[k]] += old[k]
        else:
            # New text goes in the run of the text it replaces, or the run before it
            run = owner[i1] if i1 < i2 else owner[i1 - 1] if i1 > 0 else 0
            out[run] += new[j1:j2]
    rebuilt, position = [], 0
    for m, text in zip(matches, out):
        open_tag = m.group(1)
        if open_tag.startswith('<w:t') and 'xml:space' not in open_tag:
            open_tag = open_tag.replace('<w:t', '<w:t xml:space="preserve"', 1)
        rebuilt += [paragraph[position : m.start()], f'{open_tag}{escape(text, quote=False)}{m.group(3)}']
        position = m.end()
    rebuilt.append(paragraph[position:])
    return ''.join(rebuilt)


def pair(olds: list[str], news: list[str], fixed: set[str] = frozenset()) -> list[tuple[int | None, int | None]]:
    """Pairs old paragraphs with new ones, in order, by how alike they are"""

    def score(old: str, new: str) -> float:
        if old in fixed:
            return 0
        return difflib.SequenceMatcher(None, norm(old), norm(new)).ratio()

    n, k = len(olds), len(news)
    best = [[0.0] * (k + 1) for _ in range(n + 1)]
    for i in range(n - 1, -1, -1):
        for j in range(k - 1, -1, -1):
            s = score(olds[i], news[j])
            best[i][j] = max(best[i + 1][j], best[i][j + 1], (s + best[i + 1][j + 1]) if s > 0.5 else 0)
    pairs, i, j = [], 0, 0
    while i < n or j < k:
        if i < n and j < k:
            s = score(olds[i], news[j])
            if s > 0.5 and best[i][j] == s + best[i + 1][j + 1]:
                pairs.append((i, j))
                i += 1
                j += 1
                continue
        if i < n and (j == k or best[i][j] == best[i + 1][j]):
            pairs.append((i, None))
            i += 1
        else:
            pairs.append((None, j))
            j += 1
    return pairs


def changed_blocks(olds: list[str], news: list[str]):
    """The parts of 2 lists of paragraphs that differ, as (start in olds, start in news, pairs)"""
    matcher = difflib.SequenceMatcher(None, [norm(o) for o in olds], [norm(n) for n in news], autojunk=False)
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag != 'equal':
            yield i1, i2, j1, olds[i1:i2], news[j1:j2]


# Word


def word_paragraphs(xml: str) -> list[tuple[re.Match, str, bool]]:
    """Each line of the document, with its paragraph, and whether that paragraph has line breaks"""
    lines = []
    for m in WORD_PARAGRAPH.finditer(xml):
        text = unescape(''.join(
            x.group(1) if x.group(1) is not None else '\n'
            for x in re.finditer(r'<w:t(?: [^>]*)?>([^<]*)</w:t>|<w:br[ />]', m.group(0))
        ))
        parts = [part.strip() for part in text.split('\n') if part.strip()]
        lines += [(m, part, len(parts) > 1) for part in parts]
    return lines


def style_of(paragraph: str) -> str | None:
    m = re.search(r'<w:pStyle w:val="([^"]+)"', paragraph)
    return m.group(1) if m else None


def with_links(pkg: Package, paragraph: str, segments: list) -> str:
    """The paragraph rewritten from scratch, for when its links changed"""
    start = re.match(r'<w:p[^>]*>', paragraph).group(0)
    properties = (re.search(r'<w:pPr>.*?</w:pPr>', paragraph, re.S) or [''])[0]
    first = re.search(r'<w:r[ >][^>]*?>?(<w:rPr>.*?</w:rPr>)', paragraph, re.S)
    plain = first.group(1) if first else ''
    linked = re.search(r'<w:hyperlink [^>]*><w:r[ >][^>]*?>?(<w:rPr>.*?</w:rPr>)', paragraph, re.S)
    link_format = linked.group(1) if linked else f'<w:rPr><w:color w:val="{BLUE}"/><w:u w:val="single"/></w:rPr>'
    runs = ''
    for segment in segments:
        if isinstance(segment, tuple):
            text, url = segment
            url = SITE_URL + url if url.startswith('/') else url
            rid = pkg.add_relationship('word/_rels/document.xml.rels', REL_HYPERLINK, url, True)
            runs += (
                f'<w:hyperlink r:id="{rid}"><w:r>{link_format}'
                f'<w:t xml:space="preserve">{escape(text, quote=False)}</w:t></w:r></w:hyperlink>'
            )
        elif segment:
            runs += f'<w:r>{plain}<w:t xml:space="preserve">{escape(segment, quote=False)}</w:t></w:r>'
    return f'{start}{properties}{runs}</w:p>'


def new_paragraph(text: str, properties: str) -> str:
    return f'<w:p>{properties}<w:r><w:t xml:space="preserve">{escape(text, quote=False)}</w:t></w:r></w:p>'


def added_paragraphs(page: list[dict], lines: list, at: int) -> str:
    """New paragraphs, styled like the nearest heading or list item before them"""
    before = [m.group(0) for m, _, _ in lines[:at]]
    heading = next((style_of(p) for p in reversed(before) if (style_of(p) or '').startswith('Heading')), 'Heading3')
    item = next((p for p in reversed(before) if '<w:numPr>' in p), None)
    xml = ''
    for paragraph in page:
        if paragraph['heading']:
            properties = f'<w:pPr><w:pStyle w:val="{heading}"/></w:pPr>'
        elif paragraph['item'] and item:
            properties = re.search(r'<w:pPr>.*?</w:pPr>', item, re.S).group(0)
        else:
            properties = ''
        xml += new_paragraph(paragraph['text'], properties)
        print(f'  ADD   {paragraph["text"]}')
    return xml


def sync_word(path: Path, page_path: Path) -> list[tuple[str, str]]:
    """Makes a Word file match its page. Returns each edit, as old and new text"""
    pkg = Package(path)
    xml = pkg.text('word/document.xml')
    lines = word_paragraphs(xml)
    # The document's title isn't in the page text, which has its own heading
    titles = {text for m, text, _ in lines if style_of(m.group(0)) == 'Title'}
    if lines and style_of(lines[0][0].group(0)) == 'Heading1':
        titles.add(lines[0][1])
    page = page_paragraphs(page_path)
    edits: list[tuple[int, int, str]] = []
    pairs_found: list[tuple[str, str]] = []

    for i1, i2, j1, olds, new_texts in changed_blocks([t for _, t, _ in lines], [p['text'] for p in page]):
        news = page[j1 : j1 + len(new_texts)]
        waiting: list[dict] = []
        for wi, pj in pair(olds, [p['text'] for p in news], titles):
            if pj is not None:
                new = news[pj]
            if wi is None:
                waiting.append(new)
                continue
            m, old_text, has_breaks = lines[i1 + wi]
            if waiting:
                edits.append((m.start(), m.start(), added_paragraphs(waiting, lines, i1 + wi)))
                waiting = []
            if pj is None:
                if old_text not in titles:
                    problems.append(f'{path.name}: only in Word, left as it is: {old_text}')
                continue
            if old_text == new['text']:
                continue
            if has_breaks:
                problems.append(f'{path.name}: a paragraph with line breaks, change it by hand: {new["text"]}')
                continue
            edited = edit_runs(m.group(0), new['text'], WORD_TEXT)
            if [norm(text_of(h, WORD_TEXT)) for h in re.findall(r'<w:hyperlink[ >].*?</w:hyperlink>', edited, re.S)] != [norm(link) for link in new['links']]:
                edited = with_links(pkg, m.group(0), new['segments'])
            edits.append((m.start(), m.end(), edited))
            pairs_found.append((old_text, new['text']))
            print(f'  EDIT  {old_text}\n     -> {new["text"]}')
        if waiting:
            at = lines[i2][0].start() if i2 < len(lines) else lines[-1][0].end()
            edits.append((at, at, added_paragraphs(waiting, lines, i2)))

    if edits and WRITE:
        for start, end, text in sorted(edits, reverse=True):
            xml = xml[:start] + text + xml[end:]
        pkg.set_text('word/document.xml', xml)
        pkg.save(path)
    return pairs_found


# Slides


def slide_parts(pkg: Package) -> list[str]:
    """Each slide, in the order they're shown"""
    presentation = pkg.text('ppt/presentation.xml')
    rels = pkg.text('ppt/_rels/presentation.xml.rels')
    targets = dict(re.findall(r'<Relationship [^>]*Id="([^"]+)"[^>]*Target="([^"]+)"', rels))
    return ['ppt/' + targets[rid] for rid in re.findall(r'<p:sldId [^>]*r:id="([^"]+)"', presentation)]


def tokens(text: str) -> list[str]:
    return re.findall(r"\w[\w'’-]*|[^\w\s]|\s+", text)


def word_count(parts: list[str]) -> int:
    return sum(1 for part in parts if re.match(r'\w', part))


def phrase_changes(old: str, new: str) -> list[tuple[str, str, bool]]:
    """
    Each changed phrase in a paragraph, with a few words either side, so a slide only changes where
    its wording is the same. A short paragraph, like a link, only matches a whole paragraph
    """
    a, b = tokens(old), tokens(new)
    if word_count(a) < 8:
        return [(old, new, True)]
    opcodes = difflib.SequenceMatcher(None, [norm(x) for x in a], [norm(x) for x in b], autojunk=False).get_opcodes()
    groups: list[list[int]] = []
    for n, op in enumerate(opcodes):
        if op[0] == 'equal':
            continue
        if groups and word_count(a[opcodes[groups[-1][-1]][2] : op[1]]) < CONTEXT:
            groups[-1].append(n)
        else:
            groups.append([n])
    changes = []
    for group in groups:
        first, last = opcodes[group[0]], opcodes[group[-1]]
        i, words = first[1], 0
        while i > 0 and words < CONTEXT:
            i -= 1
            words += bool(re.match(r'\w', a[i]))
        k, words = last[2], 0
        while k < len(a) and words < CONTEXT:
            words += bool(re.match(r'\w', a[k]))
            k += 1
        before, after = ''.join(a[i : first[1]]), ''.join(a[last[2] : k])
        old_phrase = before + ''.join(a[first[1] : last[2]]) + after
        new_phrase = before + ''.join(b[first[3] : last[4]]) + after
        if word_count(tokens(old_phrase)) >= 4:
            changes.append((old_phrase, new_phrase, False))
    return changes


def sync_highlight_slides(path: Path, word_edits: list[tuple[str, str]]) -> None:
    """Makes the same wording changes as the Word file's, where the same words are on a slide"""
    rules = {}
    for old, new in word_edits:
        if norm(old) != 'In short':
            for rule in phrase_changes(old, new):
                rules[rule[:2]] = rule
    # Longest first, so a longer phrase wins over a shorter one inside it
    ordered = sorted((r for r in rules.values() if r[0].strip() and norm(r[0]) != norm(r[1])), key=lambda r: -len(r[0]))
    if not ordered:
        return
    pkg = Package(path)
    changed = False
    for part in slide_parts(pkg):
        xml = pkg.text(part)
        edits = []
        for m in SLIDE_PARAGRAPH.finditer(xml):
            old_text = text_of(m.group(0), SLIDE_TEXT)
            new_text = old_text
            for old, new, whole in ordered:
                pattern = re.escape(norm(old)).replace("'", "['’‘]").replace('"', '["“”]')
                found = re.search(rf'^\s*{pattern}\s*$' if whole else pattern, norm(new_text))
                if found:
                    new_text = new_text[: found.start()] + new + new_text[found.end() :]
            if new_text != old_text:
                edits.append((m.start(), m.end(), edit_runs(m.group(0), new_text, SLIDE_TEXT)))
                print(f'  EDIT  {old_text}\n     -> {new_text}')
        if edits and WRITE:
            for start, end, new in sorted(edits, reverse=True):
                xml = xml[:start] + new + xml[end:]
            pkg.set_text(part, xml)
            changed = True
    if changed:
        pkg.save(path)


def abbreviations() -> tuple[dict[str, str], set[str]]:
    """The site's abbreviations and their full forms, and the ones most people know"""
    source = ABBREVIATIONS_FILE.read_text(encoding='utf-8')
    full = dict(re.findall(r"^  '?([A-Za-z0-9]+)'?: '((?:[^'\\]|\\.)*)',$", source, re.M))
    short = set(re.findall(r"^  '([A-Za-z0-9]+)',$", source[source.index('ALWAYS_SHORT') :], re.M))
    return {name: form.replace("\\'", "'") for name, form in full.items()}, short


def without_expansions(text: str, full: dict[str, str]) -> str:
    """Text with written out abbreviations, such as "intelligence quotients (IQs)", shortened"""
    for name, form in full.items():
        text = re.sub(rf'(?i:{re.escape(form)})(s?) \({re.escape(name)}(s?)\)', lambda m: name + m.group(2), text)
    return text


def sync_infographic_slides(path: Path, page_path: Path, full: dict[str, str]) -> None:
    """Makes an infographics deck's text match its page, paragraph by paragraph"""
    pkg = Package(path)
    # Abbreviations are compared short on both sides. Writing them out is expand_slide_abbreviations' job
    page = [
        without_expansions(p['text'], full)
        for p in page_paragraphs(page_path)
        if not p['summary'] and p['text'] != 'In short'
    ]
    found = []
    for part in slide_parts(pkg):
        xml = pkg.text(part)
        found += [(part, m) for m in SLIDE_PARAGRAPH.finditer(xml) if text_of(m.group(0), SLIDE_TEXT).strip()]
    slides = [without_expansions(text_of(m.group(0), SLIDE_TEXT).strip(), full) for _, m in found]
    edits: dict[str, list] = {}
    for i1, _, j1, olds, news in changed_blocks(slides, page):
        for si, pj in pair(olds, news, {s for s in olds if norm(s) in {norm(k) for k in KEEP_ON_SLIDES}}):
            if si is not None and pj is not None:
                part, m = found[i1 + si]
                edits.setdefault(part, []).append((m.start(), m.end(), edit_runs(m.group(0), news[pj], SLIDE_TEXT)))
                print(f'  EDIT  {olds[si]}\n     -> {news[pj]}')
    if edits and WRITE:
        for part, part_edits in edits.items():
            xml = pkg.text(part)
            for start, end, new in sorted(part_edits, reverse=True):
                xml = xml[:start] + new + xml[end:]
            pkg.set_text(part, xml)
        pkg.save(path)


def expand_slide_abbreviations(path: Path, full: dict[str, str], short: set[str]) -> None:
    """
    Writes out each abbreviation in full the first time it's used on each slide (WCAG 3.1.4), as
    the site does, apart from ones most people know. The glossary slides list them, so are left out
    """
    pkg = Package(path)
    changed = False
    for part in slide_parts(pkg):
        xml = pkg.text(part)
        slide_text = text_of(xml, SLIDE_TEXT)
        if 'Glossary' in slide_text:
            continue
        done: set[str] = set()
        edits = []
        for m in SLIDE_PARAGRAPH.finditer(xml):
            paragraph = m.group(0)
            runs = re.findall(r'<a:r>.*?</a:r>', paragraph, re.S)
            # Where each run outside a link starts and ends in the paragraph's text
            plain_spans, position = [], 0
            for run in runs:
                length = len(text_of(run, SLIDE_TEXT))
                if '<a:hlinkClick' not in run:
                    plain_spans.append((position, position + length))
                position += length
            text = text_of(paragraph, SLIDE_TEXT)
            new = text
            for name in [n for n in full if n not in short and n not in done]:
                if full[name].lower() in slide_text.lower():
                    done.add(name)
                    continue
                hit = re.search(rf'(?<![A-Za-z]){re.escape(name)}(s?)(?![A-Za-z])', text)
                if not hit:
                    continue
                done.add(name)
                # The name of a link says what it is already
                if not any(start <= hit.start() and hit.end() <= end for start, end in plain_spans):
                    continue
                starts_sentence = re.search(r'(^|[.!?:]\s+)$', text[: hit.start()]) is not None
                words = full[name][0].upper() + full[name][1:] if starts_sentence else full[name]
                new = new.replace(hit.group(0), f'{words}{hit.group(1)} ({name}{hit.group(1)})', 1)
            if new != text:
                edits.append((m.start(), m.end(), edit_runs(paragraph, new, SLIDE_TEXT)))
                print(f'  EDIT  {text}\n     -> {new}')
        if edits and WRITE:
            for start, end, new_xml in sorted(edits, reverse=True):
                xml = xml[:start] + new_xml + xml[end:]
            pkg.set_text(part, xml)
            changed = True
    if changed:
        pkg.save(path)


def main() -> None:
    full, short = abbreviations()
    word_edits = {}
    for docx, page in WORD_PAGES:
        print(docx)
        word_edits[docx] = sync_word(BRANDED / docx, TEXT / page)
    for deck, docx in HIGHLIGHT_DECKS:
        print(deck)
        sync_highlight_slides(BRANDED / deck, word_edits[docx])
    for deck, page in INFOGRAPHIC_DECKS:
        print(deck)
        sync_infographic_slides(BRANDED / deck, TEXT / page, full)
    for deck, _ in HIGHLIGHT_DECKS + INFOGRAPHIC_DECKS:
        expand_slide_abbreviations(BRANDED / deck, full, short)
    print('\n'.join(['', 'To do by hand:', *problems]) if problems else '\nNothing to do by hand')
    print('Saved the changes' if WRITE else 'Nothing saved. Run it with --write to save the changes')


if __name__ == '__main__':
    main()
