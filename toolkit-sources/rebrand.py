"""
Makes and tidies the Inclusion Toolkit's branded files. The Word files and slides in
toolkit-sources/branded/ are the ones to edit. Everything else is made from them.

Each branded file was first made from the original I made at giffgaff, keeping every layout, and
changing the things below. The originals aren't in this repo, so the code that did this
(rebrand_docx and rebrand_pptx) no longer runs:
- the font, from Poppins to Atkinson Hyperlegible Next, which is the site's font
- the colours, to the site's colours
- the logos, from giffgaff and HAND to the site's logo, with the site's name and a link to it on
  each slide
- every example and link that went to giffgaff, so they go to the site instead
- the file details (title, author and language), and adds alt text that was missing

They were rebranded again on 11 November 2026, from my personal site's purple to the Inclusion
Toolkit's own blue, logo and address.

It never remakes a branded file, so edits to them are kept. Each run only:
- sets each Word file's footer, with the site's name, its address and the page number
- puts the fonts inside each Word file, so they look the same for people who don't have them
- sets the file details, which Word can change when I save
- cuts the full highlights into one Word file for each highlight

Run it from the repo root, with Python 3.10 or newer and no extra packages:

    /opt/homebrew/bin/python3 -I toolkit-sources/rebrand.py

It stops with an error if any mention of giffgaff is left.
"""

import re
import struct
import sys
import uuid
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape, unescape

ROOT = Path(__file__).resolve().parent
BRANDED = ROOT / 'branded'

# The site's address. SITE_DISPLAY is how it's written, with capitals so it's easier to read
SITE_URL = 'https://inclusiontoolkit.org'
SITE_DISPLAY = 'InclusionToolkit.org'
SITE_NAME = 'Inclusion Toolkit'

# The site's logo, at the top left of each slide, where the HAND logo was. `pnpm brand-images`
# draws it from src/brand/mark.ts
LOGO = ROOT.parent / 'public' / 'icon-512.png'

# The author, in each file's details
NAME = 'Abi Harrison-Nye'
FONT = 'Atkinson Hyperlegible Next'
MONO_FONT = 'Atkinson Hyperlegible Mono'

# The fonts are put inside each file, so people who don't have them see the same layout. These are
# the static fonts, installed on the Mac. The licence (SIL Open Font License) allows this
FONT_FOLDER = Path.home() / 'Library' / 'Fonts'
FONT_FILES = {FONT: 'AtkinsonHyperlegibleNext', MONO_FONT: 'AtkinsonHyperlegibleMono'}
FONT_STYLES = ('Regular', 'Bold', 'Italic', 'BoldItalic')

# From src/styles/tokens/primitives.css. Each pair passes WCAG AAA contrast (7:1 or more)
BLUE = '1C4882'  # Headings and links on white: 9.1:1
BLUE_DARK = '163A6B'  # The site's name and address on light blue: 7.6:1
LIGHT_BLUE = 'BCD6F5'  # Slide backgrounds and decoration only, never text
SLATE = '3A4A5E'  # Footer text on white: 9.1:1

TOOLKIT_URL = SITE_URL

# Each original, where its branded copy goes (the same path as in public/inclusion-toolkit/files),
# and its title. The branded copy is only made from the original if it isn't there
EDITED_FILES = [
    ('EmailSignatureAdditions.docx', 'email-signature-additions.docx', 'Email Signature Additions'),
    ('MeetingInviteTemplate.docx', 'meeting-invite-template.docx', 'Meeting Invite Template'),
    (
        'AccessibleMeetingChecklist.docx',
        'accessible-meeting-checklist.docx',
        'Accessible Meeting Checklist',
    ),
    (
        'AccessibilityHighlights (updated).docx',
        'highlights/accessibility/accessibility-highlights.docx',
        'Accessibility Highlights',
    ),
    (
        'NeurodiversityHighlights.docx',
        'highlights/neurodiversity/neurodiversity-highlights.docx',
        'Neurodiversity Highlights',
    ),
]
# Each set of highlights: its full Word file, which is cut into one Word file for each highlight,
# and its slides' original, branded copy and title, cut into one slide file for each highlight
HIGHLIGHT_SETS = [
    (
        'highlights/accessibility/accessibility-highlights.docx',
        'AccessibilityHighlights (updated).pptx',
        'highlights/accessibility/accessibility-highlights.pptx',
        'Accessibility Highlights',
    ),
    (
        'highlights/neurodiversity/neurodiversity-highlights.docx',
        'NeurodiversityHighlights.pptx',
        'highlights/neurodiversity/neurodiversity-highlights.pptx',
        'Neurodiversity Highlights',
    ),
]
# Each set of infographics: the original, its branded copy and its title. Each is cut into one
# file for each infographic. They have no Word file
INFOGRAPHIC_SETS = [
    (
        'Accessibility Infographics.pptx',
        'infographics/accessibility/accessibility-infographics.pptx',
        'Accessibility Infographics',
    ),
    (
        'NeurodiversityInfographics.pptx',
        'infographics/neurodiversity/neurodiversity-infographics.pptx',
        'Neurodiversity Infographics',
    ),
]

REL_HYPERLINK = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink'
REL_IMAGE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image'
REL_FOOTER = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer'
REL_CORE = 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties'


class Package:
    """A Word or PowerPoint file, which is a zip of XML parts"""

    def __init__(self, path: Path):
        with zipfile.ZipFile(path) as z:
            self.names = z.namelist()
            self.parts = {name: z.read(name) for name in self.names}

    def text(self, name: str) -> str:
        return self.parts[name].decode('utf-8')

    def set_text(self, name: str, value: str) -> None:
        if name not in self.parts:
            self.names.append(name)
        self.parts[name] = value.encode('utf-8')

    def remove(self, name: str) -> None:
        self.names.remove(name)
        del self.parts[name]

    def xml_names(self) -> list[str]:
        return [n for n in self.names if n.endswith('.xml') or n.endswith('.rels')]

    def add_content_type(self, part: str, content_type: str) -> None:
        types = self.text('[Content_Types].xml')
        if f'PartName="/{part}"' not in types:
            types = types.replace(
                '</Types>',
                f'<Override PartName="/{part}" ContentType="{content_type}"/></Types>',
            )
            self.set_text('[Content_Types].xml', types)

    def add_relationship(self, rels_part: str, rel_type: str, target: str, external=False) -> str:
        rels = self.text(rels_part)
        used = {int(n) for n in re.findall(r'Id="rId(\d+)"', rels)}
        rid = f'rId{max(used, default=0) + 1}'
        mode = ' TargetMode="External"' if external else ''
        rels = rels.replace(
            '</Relationships>',
            f'<Relationship Id="{rid}" Type="{rel_type}" Target="{escape(target)}"{mode}/>'
            '</Relationships>',
        )
        self.set_text(rels_part, rels)
        return rid

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
            for name in ['[Content_Types].xml'] + [n for n in self.names if n != '[Content_Types].xml']:
                z.writestr(name, self.parts[name])


def replace_once(xml: str, old: str, new: str, where: str) -> str:
    """Replaces text that must appear exactly once, so a changed original stops the script"""
    count = xml.count(old)
    if count != 1:
        sys.exit(f'Expected 1 of {old!r} in {where}, found {count}. Has the original changed?')
    return xml.replace(old, new)


def set_link_target(pkg: Package, rels_part: str, old_url: str, new_url: str) -> None:
    rels = pkg.text(rels_part)
    pkg.set_text(
        rels_part, replace_once(rels, f'Target="{escape(old_url)}"', f'Target="{new_url}"', rels_part)
    )


def set_link_targets(pkg: Package, rels_part: str, old_url: str, new_url: str) -> None:
    """Like set_link_target, for an address used more than once"""
    rels = pkg.text(rels_part)
    if f'Target="{escape(old_url)}"' not in rels:
        sys.exit(f'Expected a link to {old_url} in {rels_part}. Has the original changed?')
    pkg.set_text(rels_part, rels.replace(f'Target="{escape(old_url)}"', f'Target="{new_url}"'))


def remove_unused_links(pkg: Package, part: str, rels_part: str) -> None:
    """Removes links that nothing in the part uses, which can still name old addresses"""
    xml = pkg.text(part)
    rels = pkg.text(rels_part)
    for rel in re.findall(r'<Relationship [^>]*/>', rels):
        rid = re.search(r'Id="([^"]+)"', rel).group(1)
        if REL_HYPERLINK in rel and f'r:id="{rid}"' not in xml:
            rels = rels.replace(rel, '')
    pkg.set_text(rels_part, rels)


def core_properties(title: str) -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
        'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        f'<dc:title>{escape(title)}</dc:title><dc:subject>Inclusion Toolkit</dc:subject>'
        f'<dc:creator>{NAME}</dc:creator><cp:lastModifiedBy>{NAME}</cp:lastModifiedBy>'
        '<dc:language>en-GB</dc:language></cp:coreProperties>'
    )


def set_core_properties(pkg: Package, title: str) -> None:
    """Sets the title, author and language, which PDFs and screen readers use"""
    pkg.set_text('docProps/core.xml', core_properties(title))
    pkg.add_content_type(
        'docProps/core.xml', 'application/vnd.openxmlformats-package.core-properties+xml'
    )
    if 'docProps/core.xml' not in pkg.text('_rels/.rels'):
        pkg.add_relationship('_rels/.rels', REL_CORE, 'docProps/core.xml')


def swap_fonts(pkg: Package) -> None:
    """
    Uses my fonts for everything. Arial stays for slide bullets only, as it has the bullet
    characters, and in Word's list of fonts
    """
    for name in pkg.xml_names():
        xml = pkg.text(name)
        swapped = (
            xml.replace('Roboto Mono', MONO_FONT).replace('Consolas', MONO_FONT).replace('Poppins', FONT)
        )
        swapped = re.sub(r'(?<!<a:buFont )typeface="Arial"', f'typeface="{FONT}"', swapped)
        swapped = re.sub(r'w:(ascii|hAnsi|cs|eastAsia)="Arial"', rf'w:\1="{FONT}"', swapped)
        if swapped != xml:
            pkg.set_text(name, swapped)


def font_file(family: str, style: str) -> bytes:
    path = FONT_FOLDER / f'{FONT_FILES[family]}-{style}.ttf'
    if not path.exists():
        sys.exit(f'{path} is missing. Install the static {family} fonts first.')
    return path.read_bytes()


def fonts_used(pkg: Package, parts: list[str]) -> list[str]:
    text = ''.join(pkg.text(n) for n in parts if n in pkg.parts)
    return [family for family in FONT_FILES if f'"{family}"' in text]


def font_key(family: str, style: str) -> str:
    """A GUID for each font, the same every time, so files only change when their content does"""
    return '{' + str(uuid.uuid5(uuid.NAMESPACE_URL, f'{SITE_URL}/fonts/{family}/{style}')).upper() + '}'


def ttf_tables(data: bytes) -> dict[str, bytes]:
    count = struct.unpack('>H', data[4:6])[0]
    tables = {}
    for i in range(count):
        tag, _, offset, length = struct.unpack('>4sLLL', data[12 + 16 * i : 28 + 16 * i])
        tables[tag.decode('latin-1')] = data[offset : offset + length]
    return tables


def ttf_name(name_table: bytes, name_id: int) -> str:
    _, count, strings = struct.unpack('>HHH', name_table[:6])
    for i in range(count):
        platform, encoding, language, nid, length, offset = struct.unpack(
            '>6H', name_table[6 + 12 * i : 18 + 12 * i]
        )
        if (platform, encoding, language, nid) == (3, 1, 0x409, name_id):
            return name_table[strings + offset : strings + offset + length].decode('utf-16-be')
    return ''


def eot(data: bytes) -> bytes:
    """
    Wraps a font in the Embedded OpenType format, which is how PowerPoint stores embedded fonts.
    It's version 0x00020001, uncompressed
    """
    tables = ttf_tables(data)
    os2, head, names = tables['OS/2'], tables['head'], tables['name']
    weight, fs_type = struct.unpack('>H', os2[4:6])[0], struct.unpack('>H', os2[8:10])[0]
    unicode_ranges = struct.unpack('>4L', os2[42:58])
    italic = struct.unpack('>H', os2[62:64])[0] & 1
    code_pages = struct.unpack('>2L', os2[78:86])
    checksum = struct.unpack('>L', head[8:12])[0]

    def name(name_id: int) -> bytes:
        encoded = ttf_name(names, name_id).encode('utf-16-le')
        return struct.pack('<H', len(encoded)) + encoded

    padding = struct.pack('<H', 0)
    rest = (
        os2[32:42]
        + struct.pack('<BBLHH', 1, italic, weight, fs_type, 0x504C)
        + struct.pack('<4L', *unicode_ranges)
        + struct.pack('<2L', *code_pages)
        + struct.pack('<L', checksum)
        + struct.pack('<4L', 0, 0, 0, 0)
        + padding + name(1)
        + padding + name(2)
        + padding + name(5)
        + padding + name(4)
        + padding + struct.pack('<H', 0)
    )
    size = 16 + len(rest) + len(data)
    return struct.pack('<4L', size, len(data), 0x00020001, 0) + rest + data


# Word files


def docx_paragraph(xml: str, marker: str) -> str:
    """The one paragraph whose text includes the marker"""
    found = [
        p
        for p in re.findall(r'<w:p[ >](?:(?!<w:p[ >]).)*?</w:p>', xml, re.S)
        if marker in ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', p))
    ]
    if len(found) != 1:
        sys.exit(f'Expected 1 paragraph with {marker!r}, found {len(found)}. Has the original changed?')
    return found[0]


def docx_rewrite_paragraph(pkg: Package, marker: str, segments: list) -> None:
    """
    Rewrites a paragraph's text, keeping its formatting. Each segment is text, or a (text, address)
    pair for a link
    """
    xml = pkg.text('word/document.xml')
    old = docx_paragraph(xml, marker)
    start = re.match(r'<w:p[^>]*>', old).group(0)
    ppr = (re.search(r'<w:pPr>.*?</w:pPr>', old, re.S) or [''])[0]
    first_rpr = re.search(r'<w:r[ >][^>]*?>?(<w:rPr>.*?</w:rPr>)', old, re.S)
    plain = first_rpr.group(1) if first_rpr else '<w:rPr></w:rPr>'
    linked = re.search(r'<w:hyperlink [^>]*><w:r[ >][^>]*?>?(<w:rPr>.*?</w:rPr>)', old, re.S)
    link_rpr = linked.group(1) if linked else plain.replace(
        '</w:rPr>', f'<w:color w:val="{BLUE}"/><w:u w:val="single"/></w:rPr>'
    )
    runs = ''
    for segment in segments:
        if isinstance(segment, tuple):
            text, url = segment
            rid = pkg.add_relationship('word/_rels/document.xml.rels', REL_HYPERLINK, url, True)
            runs += (
                f'<w:hyperlink r:id="{rid}"><w:r>{link_rpr}'
                f'<w:t xml:space="preserve">{escape(text)}</w:t></w:r></w:hyperlink>'
            )
        else:
            runs += f'<w:r>{plain}<w:t xml:space="preserve">{escape(segment)}</w:t></w:r>'
    pkg.set_text('word/document.xml', xml.replace(old, f'{start}{ppr}{runs}</w:p>'))


def docx_styles(pkg: Package) -> None:
    """Purple headings, with a lilac line under the title, and UK English as the language"""
    styles = pkg.text('word/styles.xml')
    for style_id in ('Title', 'Heading1', 'Heading2', 'Heading3', 'Heading4'):
        match = re.search(rf'<w:style [^>]*w:styleId="{style_id}".*?</w:style>', styles, re.S)
        if not match:
            continue
        style = match.group(0)
        new = re.sub(r'<w:color [^>]*/>', '', style)
        new = (
            new.replace('<w:sz ', f'<w:color w:val="{BLUE}"/><w:sz ', 1)
            if '<w:sz ' in new
            else new.replace('</w:rPr>', f'<w:color w:val="{BLUE}"/></w:rPr>', 1)
        )
        if style_id in ('Title', 'Heading1'):
            new = new.replace(
                '<w:spacing ',
                f'<w:pBdr><w:bottom w:val="single" w:sz="36" w:space="8" w:color="{LIGHT_BLUE}"/></w:pBdr>'
                '<w:spacing ',
                1,
            ).replace('w:after="60"', 'w:after="240"', 1)
        styles = styles.replace(style, new)
    styles = re.sub(r'<w:lang [^>]*/>', '<w:lang w:val="en-GB"/>', styles)
    pkg.set_text('word/styles.xml', at_least_1_5_line_spacing(styles))

    xml = pkg.text('word/document.xml')
    xml = xml.replace('w:val="005f69"', f'w:val="{BLUE}"')
    pkg.set_text('word/document.xml', at_least_1_5_line_spacing(xml))


def at_least_1_5_line_spacing(xml: str) -> str:
    """
    Line spacing of at least 1.5, which WCAG AAA asks for (1.4.8). Some files used 1.15, which
    looked roomier in Poppins than it does in Atkinson Hyperlegible
    """
    return re.sub(
        r'(<w:spacing [^>]*?w:line=")(\d+)("[^>]*?w:lineRule="auto")',
        lambda m: f'{m.group(1)}{max(int(m.group(2)), 360)}{m.group(3)}',
        xml,
    )


def docx_remove_embedded_fonts(pkg: Package) -> None:
    """Removes the fonts inside the file, such as the copies of Poppins Google Docs put in"""
    for name in [n for n in pkg.names if n.startswith('word/fonts/')]:
        pkg.remove(name)
    if 'word/_rels/fontTable.xml.rels' in pkg.parts:
        pkg.remove('word/_rels/fontTable.xml.rels')
    fonts = re.sub(r'<w:embed(?:Regular|Bold|Italic|BoldItalic) [^>]*/>', '', pkg.text('word/fontTable.xml'))
    pkg.set_text('word/fontTable.xml', fonts)
    settings = re.sub(r'<w:(?:embedTrueTypeFonts|saveSubsetFonts)[^>]*/>', '', pkg.text('word/settings.xml'))
    pkg.set_text('word/settings.xml', settings)


def obfuscate(data: bytes, key: str) -> bytes:
    """Word's way of storing an embedded font: its first 32 bytes mixed with the font's key"""
    key_bytes = bytes.fromhex(key.strip('{}').replace('-', ''))[::-1]
    return bytes(b ^ key_bytes[i % 16] for i, b in enumerate(data[:32])) + data[32:]


def docx_embed_fonts(pkg: Package) -> None:
    """
    Puts the fonts the file uses inside it, whole rather than only the letters used, so people
    can still edit it. Word keeps them in when the file is saved again
    """
    docx_remove_embedded_fonts(pkg)
    parts = ['word/document.xml', 'word/styles.xml', 'word/numbering.xml', 'word/footer1.xml']
    fonts = pkg.text('word/fontTable.xml')
    if 'xmlns:r=' not in fonts:
        fonts = fonts.replace(
            '<w:fonts ',
            '<w:fonts xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ',
            1,
        )
    rels = []
    for family in fonts_used(pkg, parts):
        embeds = ''
        for style in FONT_STYLES:
            key = font_key(family, style)
            target = f'fonts/{FONT_FILES[family]}-{style}.odttf'
            pkg.parts[f'word/{target}'] = obfuscate(font_file(family, style), key)
            pkg.names.append(f'word/{target}')
            rid = f'rId{len(rels) + 1}'
            rels.append(
                f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/'
                f'relationships/font" Target="{target}"/>'
            )
            embeds += f'<w:embed{style} r:id="{rid}" w:fontKey="{key}"/>'
        entry = re.search(rf'<w:font w:name="{family}">.*?</w:font>|<w:font w:name="{family}"/>', fonts, re.S)
        if entry:
            old = entry.group(0)
            body = old.removesuffix('</w:font>') if old.endswith('</w:font>') else old.removesuffix('/>') + '>'
            fonts = fonts.replace(old, f'{body}{embeds}</w:font>')
        else:
            fonts = fonts.replace(
                '</w:fonts>',
                f'<w:font w:name="{family}"><w:charset w:val="00"/><w:family w:val="swiss"/>'
                f'<w:pitch w:val="variable"/>{embeds}</w:font></w:fonts>',
            )
    pkg.set_text('word/fontTable.xml', fonts)
    pkg.set_text(
        'word/_rels/fontTable.xml.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        f'{"".join(rels)}</Relationships>',
    )
    types = pkg.text('[Content_Types].xml')
    if 'Extension="odttf"' not in types:
        pkg.set_text(
            '[Content_Types].xml',
            types.replace(
                '<Default ',
                '<Default Extension="odttf" '
                'ContentType="application/vnd.openxmlformats-officedocument.obfuscatedFont"/><Default ',
                1,
            ),
        )
    # Word's rules say which settings come before this one, such as the zoom Word adds
    settings = pkg.text('word/settings.xml')
    earlier = (
        'writeProtection|view|zoom|removePersonalInformation|removeDateAndTime|'
        'doNotDisplayPageBoundaries|displayBackgroundShape|printPostScriptOverText|'
        'printFractionalCharacterWidth|printFormsData'
    )
    before = list(re.finditer(rf'<w:(?:{earlier})\b(?:[^>]*/>|[^>]*>.*?</w:(?:{earlier})>)', settings, re.S))
    at = before[-1].end() if before else re.search(r'<w:settings[^>]*>', settings).end()
    pkg.set_text('word/settings.xml', settings[:at] + '<w:embedTrueTypeFonts/>' + settings[at:])


def docx_footer_text(pkg: Package, site_link: bool) -> None:
    """
    The footer's text: the site's name on the left, then a link to the site if site_link is true,
    and the page number on the right
    """
    xml = pkg.text('word/document.xml')
    sect = re.findall(r'<w:sectPr[ >].*?</w:sectPr>', xml, re.S)[-1]
    width = int(re.search(r'<w:pgSz [^>]*w:w="(\d+)"', sect).group(1))
    left = int(re.search(r'<w:pgMar [^>]*w:left="(\d+)"', sect).group(1))
    right = int(re.search(r'<w:pgMar [^>]*w:right="(\d+)"', sect).group(1))
    rpr = f'<w:rPr><w:color w:val="{SLATE}"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>'
    link_rpr = (
        f'<w:rPr><w:color w:val="{BLUE}"/><w:sz w:val="20"/><w:szCs w:val="20"/>'
        '<w:u w:val="single"/></w:rPr>'
    )

    def run(text: str) -> str:
        return f'<w:r>{rpr}<w:t xml:space="preserve">{escape(text)}</w:t></w:r>'

    rels_part = 'word/_rels/footer1.xml.rels'
    pkg.set_text(
        rels_part,
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>',
    )
    link = ''
    if site_link:
        rid = pkg.add_relationship(rels_part, REL_HYPERLINK, SITE_URL, True)
        link = (
            f'{run(" · ")}<w:hyperlink r:id="{rid}"><w:r>{link_rpr}'
            f'<w:t xml:space="preserve">{SITE_DISPLAY}</w:t></w:r></w:hyperlink>'
        )

    def field(code: str) -> str:
        return (
            f'<w:r>{rpr}<w:fldChar w:fldCharType="begin"/></w:r>'
            f'<w:r>{rpr}<w:instrText xml:space="preserve"> {code} </w:instrText></w:r>'
            f'<w:r>{rpr}<w:fldChar w:fldCharType="separate"/></w:r>{run("1")}'
            f'<w:r>{rpr}<w:fldChar w:fldCharType="end"/></w:r>'
        )

    footer = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        f'<w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="{width - left - right}"/></w:tabs></w:pPr>'
        f'{run(SITE_NAME)}'
        f'{link}<w:r>{rpr}<w:tab/></w:r>'
        f'{run("Page ")}{field("PAGE")}{run(" of ")}{field("NUMPAGES")}</w:p></w:ftr>'
    )
    pkg.set_text('word/footer1.xml', footer)


def docx_footer(pkg: Package, site_link: bool = True) -> None:
    """Adds the footer to each page"""
    docx_footer_text(pkg, site_link)
    xml = pkg.text('word/document.xml')
    sect = re.findall(r'<w:sectPr[ >].*?</w:sectPr>', xml, re.S)[-1]
    pkg.add_content_type(
        'word/footer1.xml',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml',
    )
    rid = pkg.add_relationship('word/_rels/document.xml.rels', REL_FOOTER, 'footer1.xml')
    new_sect = re.sub(r'<w:footerReference [^>]*/>', '', sect)
    new_sect = re.sub(
        r'(<w:sectPr[^>]*>)',
        rf'\1<w:footerReference w:type="default" r:id="{rid}"/>',
        new_sect,
        count=1,
    )
    pkg.set_text('word/document.xml', xml.replace(sect, new_sect))


def docx_checklist_boxes(pkg: Package) -> None:
    """Shows the checklist's items with empty boxes, as the Google Docs PDF did, rather than dots"""
    numbering = pkg.text('word/numbering.xml')
    numbering = numbering.replace('w:lvlText w:val="●"', 'w:lvlText w:val="☐"')
    pkg.set_text('word/numbering.xml', numbering)


def docx_meeting_invite_text(pkg: Package) -> None:
    docx_rewrite_paragraph(
        pkg,
        'Anything in square brackets',
        ['Anything in square brackets, [like this], should be edited to be relevant to your meeting.'],
    )
    docx_rewrite_paragraph(
        pkg,
        'i.e. Key decisions',
        ['[What you want to happen by the end of the meeting, e.g. key decisions]'],
    )
    docx_rewrite_paragraph(
        pkg,
        'i.e. We’d love to see your faces',
        ['[e.g. We’d love to see your faces, but cameras are entirely optional]'],
    )


def docx_highlights_text(pkg: Package) -> None:
    """Swaps each giffgaff example and link for one on the site"""
    rels = 'word/_rels/document.xml.rels'
    long_url = f'{SITE_URL}/talks/a11y-series-buttons/transcript'

    # The PDF is now this full version, so only the slides are the short one
    docx_rewrite_paragraph(
        pkg,
        'condensed versions of this information',
        [
            'This section provides the comprehensive details, technical guidelines, and full context of '
            "the accessibility requirements in this toolkit. It's designed to give you a deep understanding "
            'of how to implement these changes effectively. If you need a quicker reference, a short, '
            'condensed version of this information is also available as slides, in the PowerPoint file.'
        ],
    )

    xml = pkg.text('word/document.xml')
    xml = replace_once(
        xml,
        'https://community.giffgaff.com/d/22269542-changes-and-new-features-helpers-updates-thread',
        long_url,
        'Accessible Links',
    )
    # Corrections: dark mode was described the wrong way round, and the shrug was missing its
    # backslash
    xml = replace_once(
        xml,
        "from the typical light text on dark background to dark text on a light background",
        'from the typical dark text on a light background to light text on a dark background',
        'Dark Mode',
    )
    xml = replace_once(xml, '¯_(ツ)_/¯', '¯\\_(ツ)_/¯', 'ASCII Art')
    pkg.set_text('word/document.xml', xml)

    docx_rewrite_paragraph(
        pkg,
        'the link above could direct people to',
        [
            'Link text should make it clear where the link takes you, even without any context. '
            'For instance, the link above could direct people to ',
            ('the transcript of my talk, A11y Series: Buttons', long_url),
            ". If it's in a sentence, make sure it makes sense, while also being clear where it goes to.",
        ],
    )

    set_link_target(
        pkg,
        rels,
        'https://www.giffgaff.com/inclusion-toolkit/files/MeetingInviteTemplate.pdf',
        f'{TOOLKIT_URL}/meeting-invite-template',
    )
    xml = pkg.text('word/document.xml')
    pkg.set_text(
        'word/document.xml',
        replace_once(
            xml, 'inclusive meeting invite template (PDF)', 'inclusive meeting invite template', 'Meetings'
        ),
    )

    docx_rewrite_paragraph(
        pkg,
        'Modals are manually triggered pop-ups',
        [
            'Modals are manually triggered pop-ups that provide extra information. For example, a shop '
            'might use a modal to explain what each condition grade of a refurbished phone means, opened '
            'from a link next to the grades.'
        ],
    )
    docx_rewrite_paragraph(
        pkg,
        'Modals can also be used for filtering and sorting options',
        [
            'Modals make it possible to include all the required information on a page, without '
            'presenting users with a giant page full of text. It means they can choose when to view more '
            'information about certain things. Modals can also be used for filtering and sorting '
            'options, allowing those to take up less space too.'
        ],
    )
    docx_rewrite_paragraph(
        pkg,
        'Always include a short, readable URL',
        [
            'Always include a short, readable URL (e.g., ',
            (f'{SITE_DISPLAY}/talks', f'{SITE_URL}/talks'),
            ") and a clear description of the link's purpose next to the code",
        ],
    )
    remove_unused_links(pkg, 'word/document.xml', rels)


def docx_neurodiversity_text(pkg: Package) -> None:
    """Swaps the giffgaff examples and links for general ones, or ones on the site"""
    rels = 'word/_rels/document.xml.rels'
    template = f'{TOOLKIT_URL}/meeting-invite-template'

    # The PDF is now this full version, so only the slides are the short one
    docx_rewrite_paragraph(
        pkg,
        'condensed versions of this information',
        [
            'This section provides the comprehensive details of all neurodiversity highlights. '
            "It's designed to give you a deep understanding of neurodiversity and the surrounding "
            'topics. If you need a quicker reference, a short, condensed version of this '
            'information is also available as slides, in the PowerPoint file.'
        ],
    )
    docx_rewrite_paragraph(
        pkg,
        'Neuroinclusive meeting guide',
        [
            'Consider making a neuroinclusive meeting guide, and putting a printed copy in every '
            'meeting room. It can give tips on how to make meetings fully inclusive, with a focus on '
            'people who are neurodivergent.'
        ],
    )
    docx_rewrite_paragraph(
        pkg,
        'which provides a full structure',
        [
            "There's also a ",
            ('meeting invite template', template),
            ', which provides a full structure to add to your meeting description. This makes it '
            'simple for you to add information to your meeting invites and ensure that no one is '
            'missing the clarity that they need. It also allows people to prepare for the meeting '
            "in advance, which is crucial (especially if you're asking people to have their cameras "
            'on).',
        ],
    )
    remove_unused_links(pkg, 'word/document.xml', rels)
    set_link_targets(
        pkg, rels, 'https://www.giffgaff.com/inclusion-toolkit/files/MeetingInviteTemplate.pdf', template
    )
    set_link_targets(pkg, rels, 'https://www.giffgaff.com/inclusion-toolkit', TOOLKIT_URL)

    # A tracking code Google added to the end of a link
    links = pkg.text(rels)
    pkg.set_text(rels, re.sub(r'\?srsltid=[^"]*"', '"', links))

    # An empty heading between Meetings and Neurospicy
    xml = pkg.text('word/document.xml')
    empty = [
        p
        for p in re.findall(r'<w:p[ >](?:(?!<w:p[ >]).)*?</w:p>', xml, re.S)
        if '<w:pStyle w:val="Heading2"/>' in p and not re.search(r'<w:t[^>]*>[^<]', p)
    ]
    for paragraph in empty:
        xml = xml.replace(paragraph, '', 1)
    pkg.set_text('word/document.xml', xml)


def slugify(title: str) -> str:
    """Breadcrumbs & Wayfinding gives breadcrumbs-and-wayfinding, and Tourette's gives tourettes"""
    plain = title.lower().replace('&', 'and').replace("'", '').replace('’', '')
    return re.sub(r'[^a-z0-9]+', '-', plain).strip('-')


def remove_unused_parts(pkg: Package) -> None:
    """Removes links and pictures the document no longer uses"""
    xml = pkg.text('word/document.xml')
    rels_part = 'word/_rels/document.xml.rels'
    rels = pkg.text(rels_part)
    for rel in re.findall(r'<Relationship [^>]*/>', rels):
        rid = re.search(r'Id="([^"]+)"', rel).group(1)
        if (REL_HYPERLINK in rel or REL_IMAGE in rel) and f'"{rid}"' not in xml:
            rels = rels.replace(rel, '')
            if REL_IMAGE in rel:
                pkg.remove('word/' + re.search(r'Target="([^"]+)"', rel).group(1))
    pkg.set_text(rels_part, rels)


# Shorter addresses for resources whose titles write out an abbreviation in full
SHORT_SLUGS = {
    'Accessible Rich Internet Applications (ARIA)': 'aria',
    'Multiple Sclerosis (MS)': 'multiple-sclerosis',
}

# Each heading moves up a level in a highlight's own file, as its name becomes the main heading
PROMOTE = {'Heading2': 'Heading1', 'Heading3': 'Heading2', 'Heading4': 'Heading3', 'Heading5': 'Heading4'}


def split_highlights(full: Package, folder: Path) -> list[str]:
    """
    Makes a Word file for each highlight, from the full file, with the same formatting. The two
    glossaries stay in the full file only
    """
    xml = full.text('word/document.xml')
    body = re.search(r'<w:body>(.*)</w:body>', xml, re.S)
    sect = re.findall(r'<w:sectPr[ >].*?</w:sectPr>', body.group(1), re.S)[-1]
    # Word writes empty paragraphs as <w:p .../>, with no closing tag
    paragraphs = re.findall(r'<w:p\b[^>]*/>|<w:p[ >](?:(?!<w:p[ >]).)*?</w:p>', body.group(1), re.S)
    if ''.join(paragraphs) + sect != body.group(1):
        sys.exit('The highlights file has something other than paragraphs in it, so it cannot be split.')

    sections: list[tuple[str, list[str]]] = []
    for p in paragraphs:
        if '<w:pStyle w:val="Heading2"/>' in p:
            sections.append((unescape(''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', p))).strip(), []))
        if sections:
            sections[-1][1].append(p)

    made = []
    for title, section in sections:
        if title.startswith('Glossary'):
            continue
        promoted = [
            re.sub(
                r'<w:pStyle w:val="(Heading[2-5])"/>',
                lambda m: f'<w:pStyle w:val="{PROMOTE[m.group(1)]}"/>',
                p,
            )
            for p in section
        ]
        pkg = Package.__new__(Package)
        pkg.names = list(full.names)
        pkg.parts = dict(full.parts)
        pkg.set_text(
            'word/document.xml',
            xml[: body.start(1)] + ''.join(promoted) + sect + xml[body.end(1) :],
        )
        remove_unused_parts(pkg)
        docx_embed_fonts(pkg)
        set_core_properties(pkg, title)
        slug = SHORT_SLUGS.get(title, slugify(title))
        if slug in made:
            sys.exit(f'Two highlights would share the file name {slug}.docx')
        made.append(slug)
        check_and_save(pkg, folder / f'{slug}.docx')
    return made


def resolve(source: str, target: str) -> str:
    """A relationship's target as a part name, such as ../media/logo.png from a slide"""
    folder = source.rsplit('/', 1)[0] if '/' in source else ''
    parts = (folder.split('/') if folder else []) + target.split('/')
    resolved: list[str] = []
    for part in parts:
        if part == '..':
            resolved.pop()
        elif part and part != '.':
            resolved.append(part)
    return '/'.join(resolved)


def rels_part(part: str) -> str:
    folder, _, name = part.rpartition('/')
    return f'{folder}/_rels/{name}.rels' if folder else f'_rels/{name}.rels'


def remove_unreachable(pkg: Package) -> None:
    """Removes every part nothing links to any more, such as other slides' pictures and notes"""
    reachable, queue = set(), ['']
    while queue:
        part = queue.pop()
        rels = '_rels/.rels' if part == '' else rels_part(part)
        if rels not in pkg.parts:
            continue
        reachable.add(rels)
        for rel in re.findall(r'<Relationship [^>]*/>', pkg.text(rels)):
            if 'TargetMode="External"' in rel:
                continue
            target = resolve(part, unescape(re.search(r'Target="([^"]+)"', rel).group(1)).lstrip('/'))
            if target in pkg.parts and target not in reachable:
                reachable.add(target)
                queue.append(target)
    types = pkg.text('[Content_Types].xml')
    for name in list(pkg.names):
        if name != '[Content_Types].xml' and name not in reachable:
            pkg.remove(name)
            # The attributes can be in either order, depending on what saved the file
            types = re.sub(rf'<Override [^>]*PartName="/{re.escape(name)}"[^>]*/>', '', types)
    pkg.set_text('[Content_Types].xml', types)


def split_slides(deck: Path, folder: Path, slugs: list[str] | None) -> list[str]:
    """
    Makes a PowerPoint file for each highlight, with just its slide, from the full deck. Slides are
    matched to highlights by their titles. The glossary slides stay in the full deck only
    """
    full = Package(deck)
    presentation = full.text('ppt/presentation.xml')
    pres_rels = full.text('ppt/_rels/presentation.xml.rels')
    entries = re.findall(r'<p:sldId [^>]*/>', presentation)
    made = []
    for entry in entries:
        rid = re.search(r'r:id="([^"]+)"', entry).group(1)
        slide = 'ppt/' + re.search(rf'Id="{rid}"[^>]*Target="([^"]+)"', pres_rels).group(1)
        title_shape = [
            s for s in re.findall(r'<p:sp>.*?</p:sp>', full.text(slide), re.S) if 'name="Title"' in s
        ][0]
        title = unescape(''.join(re.findall(r'<a:t>([^<]*)</a:t>', title_shape))).strip()
        slug = SHORT_SLUGS.get(title, slugify(title))
        # With no list of highlights, such as for the infographics, every slide gets its own file
        if slugs is not None and slug not in slugs:
            continue
        if slug in made:
            sys.exit(f'Two slides would share the file name {slug}.pptx')

        pkg = Package.__new__(Package)
        pkg.names = list(full.names)
        pkg.parts = dict(full.parts)
        pkg.set_text('ppt/presentation.xml', presentation.replace(
            re.search(r'<p:sldIdLst>.*?</p:sldIdLst>', presentation, re.S).group(0),
            f'<p:sldIdLst>{entry}</p:sldIdLst>',
        ))
        kept = re.sub(
            r'<Relationship [^>]*Target="slides/slide\d+\.xml"[^>]*/>',
            lambda m: m.group(0) if f'Id="{rid}"' in m.group(0) else '',
            pres_rels,
        )
        pkg.set_text('ppt/_rels/presentation.xml.rels', kept)
        # The app details list every slide's title, so they're removed rather than left wrong
        if 'docProps/app.xml' in pkg.parts:
            pkg.remove('docProps/app.xml')
            pkg.set_text('_rels/.rels', re.sub(r'<Relationship [^>]*Target="docProps/app\.xml"[^>]*/>', '', pkg.text('_rels/.rels')))
            pkg.set_text(
                '[Content_Types].xml',
                re.sub(r'<Override [^>]*PartName="/docProps/app\.xml"[^>]*/>', '', pkg.text('[Content_Types].xml')),
            )
        remove_unreachable(pkg)
        set_core_properties(pkg, title)
        check_and_save(pkg, folder / f'{slug}.pptx')
        made.append(slug)
    return made


def rebrand_docx(src: Path, out: Path, title: str) -> Package:
    pkg = Package(src)
    if src.name.startswith('AccessibilityHighlights'):
        docx_highlights_text(pkg)
    if src.name.startswith('NeurodiversityHighlights'):
        docx_neurodiversity_text(pkg)
    if src.name == 'MeetingInviteTemplate.docx':
        docx_meeting_invite_text(pkg)
    if src.name == 'AccessibleMeetingChecklist.docx':
        docx_checklist_boxes(pkg)
    swap_fonts(pkg)
    docx_styles(pkg)
    docx_footer(pkg)
    # Google Docs leaves out the page margins' gutter, which Word's file rules require
    # and gives some indents in fractions of a twip, which have to be whole numbers
    xml = pkg.text('word/document.xml')
    xml = re.sub(r'<w:pgMar (?![^>]*w:gutter)', '<w:pgMar w:gutter="0" ', xml)
    xml = re.sub(
        r'(w:(?:left|right|start|end|hanging|firstLine))="(-?\d+\.\d+)"',
        lambda m: f'{m.group(1)}="{round(float(m.group(2)))}"',
        xml,
    )
    pkg.set_text('word/document.xml', xml)
    docx_embed_fonts(pkg)
    set_core_properties(pkg, title)
    check_and_save(pkg, out)
    return pkg


# PowerPoint files

# Where the logos and title box were in the giffgaff backgrounds, in EMUs (914400 to an inch)
TITLE_BOX = (1371600, 231683, 6400800, 731520)
# The logo is the same height as the title box and lines up with it, so it ends above the slides'
# white boxes rather than being hidden behind them
LOGO_BOX = (342900, 231683, 731520, 731520)
# Wide enough for "Harrison-Nye" on its own line, which is 1.19 inches
NAME_BOX = (7818120, 231683, 1188720, 731520)

# The slides' content moves up this much, to make room for the link to the site at the bottom
CONTENT_SHIFT = 114300
# The link's box, at the bottom right, in line with the right edge of the content
FOOTER_BOX = (6170850, 4914900, 2286000, 182880)


def pptx_layout_shapes(logo_rid: str) -> str:
    """The title box, logo and the site's name, drawn behind every slide's own content"""
    x, y, w, h = TITLE_BOX
    lx, ly, lw, lh = LOGO_BOX
    nx, ny, nw, nh = NAME_BOX
    name_rpr = (
        f'<a:rPr lang="en-GB" sz="1400" b="1"><a:solidFill><a:srgbClr val="{BLUE_DARK}"/></a:solidFill>'
        f'<a:latin typeface="{FONT}"/><a:cs typeface="{FONT}"/></a:rPr>'
    )
    first, last = SITE_NAME.split(' ', 1)
    return (
        '<p:sp><p:nvSpPr><p:cNvPr id="900" name="Title box">'
        '<a:extLst><a:ext uri="{C183D7F6-B498-43B3-948B-1728B52AA6E4}">'
        '<adec:decorative xmlns:adec="http://schemas.microsoft.com/office/drawing/2017/decorative" val="1"/>'
        '</a:ext></a:extLst></p:cNvPr><p:cNvSpPr/><p:nvPr userDrawn="1"/></p:nvSpPr>'
        f'<p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>'
        '<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 16000"/></a:avLst></a:prstGeom>'
        '<a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>'
        f'<a:ln w="28575"><a:solidFill><a:srgbClr val="{BLUE}"/></a:solidFill></a:ln></p:spPr>'
        '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="en-GB"/></a:p></p:txBody></p:sp>'
        '<p:pic><p:nvPicPr><p:cNvPr id="901" name="Logo" descr="">'
        '<a:extLst><a:ext uri="{C183D7F6-B498-43B3-948B-1728B52AA6E4}">'
        '<adec:decorative xmlns:adec="http://schemas.microsoft.com/office/drawing/2017/decorative" val="1"/>'
        '</a:ext></a:extLst></p:cNvPr><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>'
        '<p:nvPr userDrawn="1"/></p:nvPicPr>'
        f'<p:blipFill><a:blip r:embed="{logo_rid}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>'
        f'<p:spPr><a:xfrm><a:off x="{lx}" y="{ly}"/><a:ext cx="{lw}" cy="{lh}"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>'
        '<p:sp><p:nvSpPr><p:cNvPr id="902" name="Name"/><p:cNvSpPr txBox="1"/><p:nvPr userDrawn="1"/></p:nvSpPr>'
        f'<p:spPr><a:xfrm><a:off x="{nx}" y="{ny}"/><a:ext cx="{nw}" cy="{nh}"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>'
        '<p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr"><a:noAutofit/></a:bodyPr>'
        # A line break between the 2 words, so they always fit the box
        f'<a:lstStyle/><a:p><a:pPr algn="r"/><a:r>{name_rpr}<a:t>{first}</a:t></a:r>'
        f'<a:br>{name_rpr}</a:br><a:r>{name_rpr}<a:t>{last}</a:t></a:r></a:p></p:txBody></p:sp>'
    )


def pptx_footer_links(pkg: Package) -> None:
    """
    Moves each slide's content up a little, and puts a link to the site at the bottom right. It's
    on each slide, rather than the layout, so the link works and screen readers reach it last
    """
    x, y, w, h = FOOTER_BOX
    for slide in [n for n in pkg.names if re.fullmatch(r'ppt/slides/slide\d+\.xml', n)]:
        xml = re.sub(
            r'<a:off x="(-?\d+)" y="(\d+)"/>',
            lambda m: (
                f'<a:off x="{m.group(1)}" y="{int(m.group(2)) - CONTENT_SHIFT}"/>'
                if int(m.group(2)) >= 1000000
                else m.group(0)
            ),
            pkg.text(slide),
        )
        rid = pkg.add_relationship(
            slide.replace('slides/', 'slides/_rels/') + '.rels', REL_HYPERLINK, SITE_URL, True
        )
        shape_id = max(int(n) for n in re.findall(r'<p:cNvPr id="(\d+)"', xml)) + 1
        link = (
            f'<p:sp><p:nvSpPr><p:cNvPr id="{shape_id}" name="Site link"/><p:cNvSpPr txBox="1"/><p:nvPr/>'
            f'</p:nvSpPr><p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>'
            '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>'
            '<p:txBody><a:bodyPr wrap="none" lIns="0" tIns="0" rIns="0" bIns="0" anchor="b"><a:noAutofit/>'
            '</a:bodyPr><a:lstStyle/><a:p><a:pPr algn="r"/><a:r>'
            # The darker purple passes AAA contrast on lilac (7.3:1). hlinkClr="tx" keeps the link
            # in that colour, rather than the theme's link colour
            f'<a:rPr lang="en-GB" sz="1100" u="sng"><a:solidFill><a:srgbClr val="{BLUE_DARK}"/></a:solidFill>'
            f'<a:latin typeface="{FONT}"/><a:cs typeface="{FONT}"/><a:hlinkClick r:id="{rid}"><a:extLst>'
            '<a:ext uri="{A12FA001-AC4F-418D-AE19-62706E023703}"><ahyp:hlinkClr '
            'xmlns:ahyp="http://schemas.microsoft.com/office/drawing/2018/hyperlinkcolor" val="tx"/>'
            f'</a:ext></a:extLst></a:hlinkClick></a:rPr><a:t>{SITE_DISPLAY}</a:t></a:r></a:p></p:txBody></p:sp>'
        )
        pkg.set_text(slide, xml.replace('</p:spTree>', f'{link}</p:spTree>', 1))


def pptx_backgrounds(pkg: Package) -> None:
    """Swaps the giffgaff background pictures for plain lilac, and draws the rest in the layout"""
    slides = sorted(
        (n for n in pkg.names if re.fullmatch(r'ppt/slides/slide\d+\.xml', n)),
        key=lambda n: int(re.search(r'\d+', n).group(0)),
    )
    old_images = set()
    for slide in slides:
        rels_part = slide.replace('slides/', 'slides/_rels/') + '.rels'
        xml = pkg.text(slide)
        bg = re.search(r'<p:bg>.*?</p:bg>', xml, re.S)
        if bg:
            rid = re.search(r'r:embed="([^"]+)"', bg.group(0))
            xml = xml.replace(
                bg.group(0),
                f'<p:bg><p:bgPr><a:solidFill><a:srgbClr val="{LIGHT_BLUE}"/></a:solidFill>'
                '<a:effectLst/></p:bgPr></p:bg>',
            )
            pkg.set_text(slide, xml)
            if rid and f'r:embed="{rid.group(1)}"' not in xml:
                rels = pkg.text(rels_part)
                rel = re.search(rf'<Relationship [^>]*Id="{rid.group(1)}"[^>]*/>', rels).group(0)
                old_images.add(re.search(r'Target="\.\./([^"]+)"', rel).group(1))
                pkg.set_text(rels_part, rels.replace(rel, ''))

    # Removes the old pictures, unless something else still uses them
    still_used = ''.join(pkg.text(n) for n in pkg.names if n.endswith('.rels'))
    for image in old_images:
        if f'../{image}"' not in still_used:
            pkg.remove(f'ppt/{image}')

    pkg.parts['ppt/media/logo.png'] = LOGO.read_bytes()
    pkg.names.append('ppt/media/logo.png')
    layouts = {
        re.search(r'slideLayout\d+\.xml', pkg.text(s.replace('slides/', 'slides/_rels/') + '.rels')).group(0)
        for s in slides
    }
    for layout in layouts:
        part = f'ppt/slideLayouts/{layout}'
        logo_rid = pkg.add_relationship(
            f'ppt/slideLayouts/_rels/{layout}.rels', REL_IMAGE, '../media/logo.png'
        )
        xml = pkg.text(part)
        xml = re.sub(
            r'(<p:spTree>.*?</p:grpSpPr>)',
            lambda m: m.group(1) + pptx_layout_shapes(logo_rid),
            xml,
            count=1,
            flags=re.S,
        )
        pkg.set_text(part, xml)


def pptx_colours(pkg: Package) -> None:
    """
    Links in the theme's teal become my purple. Some decks use the theme's link and accent 5
    colours for links instead, which become my purple too
    """
    # Every theme, as a deck's slide master can use a different one from theme1
    for part in [n for n in pkg.names if re.fullmatch(r'ppt/theme/theme\d+\.xml', n)]:
        theme = pkg.text(part).replace('005F69', BLUE)
        theme = re.sub(
            r'<a:(hlink|folHlink|accent5)><a:srgbClr val="[0-9A-Fa-f]{6}"/>',
            rf'<a:\1><a:srgbClr val="{BLUE}"/>',
            theme,
        )
        pkg.set_text(part, theme)


def pptx_embed_fonts(pkg: Package) -> None:
    """
    Swaps the fonts inside the file (Poppins and Consolas) for mine, whole rather than only the
    letters used, so people can still edit it. PowerPoint keeps them in when it's saved again
    """
    presentation = pkg.text('ppt/presentation.xml')
    rels = pkg.text('ppt/_rels/presentation.xml.rels')
    for entry in re.findall(r'<p:embeddedFont>.*?</p:embeddedFont>', presentation, re.S):
        for rid in re.findall(r'r:id="([^"]+)"', entry):
            rel = re.search(rf'<Relationship [^>]*Id="{rid}"[^>]*/>', rels).group(0)
            rels = rels.replace(rel, '')
    pkg.set_text('ppt/_rels/presentation.xml.rels', rels)
    # The old fonts' files. Their names can't be taken from the links, as swap_fonts has already
    # changed Poppins in them
    for name in [n for n in pkg.names if n.startswith('ppt/fonts/')]:
        pkg.remove(name)

    parts = [n for n in pkg.names if re.match(r'ppt/(slides|slideLayouts|slideMasters|theme)/[^/]+\.xml$', n)]
    entries = ''
    for family in fonts_used(pkg, parts):
        styles = ''
        for style in FONT_STYLES:
            target = f'fonts/{FONT_FILES[family]}-{style}.fntdata'
            pkg.parts[f'ppt/{target}'] = eot(font_file(family, style))
            pkg.names.append(f'ppt/{target}')
            rid = pkg.add_relationship(
                'ppt/_rels/presentation.xml.rels',
                'http://schemas.openxmlformats.org/officeDocument/2006/relationships/font',
                target,
            )
            styles += f'<p:{style[0].lower() + style[1:]} r:id="{rid}"/>'
        entries += f'<p:embeddedFont><p:font typeface="{family}" pitchFamily="2" charset="0"/>{styles}</p:embeddedFont>'

    presentation = re.sub(r'<p:embeddedFontLst>.*?</p:embeddedFontLst>', '', presentation, flags=re.S)
    presentation = re.sub(
        r'(<p:notesSz [^>]*/>)', rf'\1<p:embeddedFontLst>{entries}</p:embeddedFontLst>', presentation, count=1
    )
    presentation = re.sub(r' (?:embedTrueTypeFonts|saveSubsetFonts)="[^"]*"', '', presentation)
    presentation = presentation.replace('<p:presentation ', '<p:presentation embedTrueTypeFonts="1" ', 1)
    pkg.set_text('ppt/presentation.xml', presentation)
    types = pkg.text('[Content_Types].xml')
    if 'Extension="fntdata"' not in types:
        pkg.set_text(
            '[Content_Types].xml',
            types.replace('<Default ', '<Default Extension="fntdata" ContentType="application/x-fontdata"/><Default ', 1),
        )


def pptx_rewrite_paragraph(pkg: Package, slide: str, marker: str, segments: list) -> None:
    """Like docx_rewrite_paragraph, for a slide"""
    part = f'ppt/slides/{slide}'
    xml = pkg.text(part)
    found = [
        p
        for p in re.findall(r'<a:p>.*?</a:p>', xml, re.S)
        if marker in ''.join(re.findall(r'<a:t>([^<]*)</a:t>', p))
    ]
    if len(found) != 1:
        sys.exit(f'Expected 1 paragraph with {marker!r} in {slide}, found {len(found)}.')
    old = found[0]
    ppr = (re.search(r'<a:pPr[^>]*/>|<a:pPr[^>]*[^/]>.*?</a:pPr>', old, re.S) or [''])[0]
    rpr = re.search(r'<a:r>(<a:rPr[^>]*[^/]>.*?</a:rPr>)', old, re.S).group(1)
    rpr = re.sub(r'<a:hlinkClick[^>]*/>|<a:hlinkClick[^>]*[^/]>.*?</a:hlinkClick>', '', rpr, flags=re.S)
    end = (re.search(r'<a:endParaRPr[^>]*/>|<a:endParaRPr[^>]*[^/]>.*?</a:endParaRPr>', old, re.S) or [''])[0]
    runs = ''
    for segment in segments:
        if isinstance(segment, tuple):
            text, url = segment
            rid = pkg.add_relationship(
                part.replace('slides/', 'slides/_rels/') + '.rels', REL_HYPERLINK, url, True
            )
            # Links are underlined, in the theme's link colour, which is my purple
            link_rpr = re.sub(r'<a:solidFill>.*?</a:solidFill>', '', rpr, flags=re.S)
            link_rpr = re.sub(r' u="[^"]*"', '', link_rpr).replace('<a:rPr', '<a:rPr u="sng"', 1)
            link_rpr = link_rpr.replace(
                '>', '><a:solidFill><a:schemeClr val="hlink"/></a:solidFill>', 1
            ).replace('</a:rPr>', f'<a:hlinkClick r:id="{rid}"/></a:rPr>')
            runs += f'<a:r>{link_rpr}<a:t>{escape(text)}</a:t></a:r>'
        else:
            runs += f'<a:r>{rpr}<a:t>{escape(segment)}</a:t></a:r>'
    pkg.set_text(part, xml.replace(old, f'<a:p>{ppr}{runs}{end}</a:p>'))


def pptx_alt_text(pkg: Package, slide: str, picture: str, alt: str) -> None:
    part = f'ppt/slides/{slide}'
    xml = pkg.text(part)
    tag = re.search(rf'<p:cNvPr id="\d+" name="{picture}"', xml).group(0)
    pkg.set_text(part, replace_once(xml, tag, f'{tag} descr="{escape(alt)}"', slide))


def pptx_highlights_text(pkg: Package) -> None:
    set_link_target(
        pkg,
        'ppt/slides/_rels/slide40.xml.rels',
        'https://www.giffgaff.com/inclusion-toolkit/files/MeetingInviteTemplate.pdf',
        f'{TOOLKIT_URL}/meeting-invite-template',
    )
    pptx_rewrite_paragraph(
        pkg,
        'slide41.xml',
        'Modals are manually triggered pop-ups',
        [
            'Modals are manually triggered pop-ups that provide extra information. For example, a shop '
            'might use a modal to explain what each condition grade of a refurbished phone means.'
        ],
    )
    remove_unused_links(pkg, 'ppt/slides/slide41.xml', 'ppt/slides/_rels/slide41.xml.rels')
    pptx_alt_text(pkg, 'slide9.xml', 'Picture 2', 'A shrugging face, made of text characters.')
    pptx_alt_text(
        pkg,
        'slide9.xml',
        'Picture 4',
        'A fish, drawn with text characters.',
    )


def pptx_neurodiversity_text(pkg: Package) -> None:
    """The Meetings slide links to my toolkit, and drops the giffgaff meeting guide"""
    template = f'{TOOLKIT_URL}/meeting-invite-template'
    pptx_rewrite_paragraph(
        pkg,
        'slide6.xml',
        'neuro-inclusive meeting guide',
        [
            'Use the ',
            ('meeting invite template', template),
            ' in the ',
            ('Inclusion Toolkit', TOOLKIT_URL),
            ', and consider making a neuroinclusive meeting guide.',
        ],
    )
    rels = 'ppt/slides/_rels/slide6.xml.rels'
    remove_unused_links(pkg, 'ppt/slides/slide6.xml', rels)
    set_link_targets(
        pkg, rels, 'https://www.giffgaff.com/inclusion-toolkit/files/MeetingInviteTemplate.pdf', template
    )
    set_link_targets(pkg, rels, 'https://www.giffgaff.com/inclusion-toolkit', TOOLKIT_URL)


# Where the rows of boxes go on the neurodiversity slides, matching the accessibility slides: the
# same gap under the title block as between the rows, and the same last row
ROW_GAP = 127166
FIRST_ROW_Y = TITLE_BOX[1] + TITLE_BOX[3] + ROW_GAP
LAST_ROW_Y = 4153900
FIRST_ROW_HEIGHT = LAST_ROW_Y - ROW_GAP - FIRST_ROW_Y
# The title text, in the same place as on the accessibility slides
TITLE_TEXT_BOX = (1365600, TITLE_BOX[1] + 6695, 6412800)
DECORATIVE = (
    '<a:extLst><a:ext uri="{C183D7F6-B498-43B3-948B-1728B52AA6E4}">'
    '<adec:decorative xmlns:adec="http://schemas.microsoft.com/office/drawing/2017/decorative" val="1"/>'
    '</a:ext></a:extLst>'
)


def set_box(shape: str, x=None, y=None, cx=None, cy=None) -> str:
    """Moves or resizes a shape, keeping whatever isn't given"""
    shape = re.sub(
        r'<a:off x="(-?\d+)" y="(-?\d+)"/>',
        lambda m: f'<a:off x="{m.group(1) if x is None else x}" y="{m.group(2) if y is None else y}"/>',
        shape,
        count=1,
    )
    return re.sub(
        r'<a:ext cx="(\d+)" cy="(\d+)"/>',
        lambda m: f'<a:ext cx="{m.group(1) if cx is None else cx}" cy="{m.group(2) if cy is None else cy}"/>',
        shape,
        count=1,
    )


def rename_shape(shape: str, name: str, decorative: bool = False) -> str:
    """Gives a shape a name that says what it is, and marks empty boxes as decorative"""
    tag = re.search(r'<p:cNvPr [^>]*?(/?)>', shape)
    # Escaped, as headings such as "Age & Gender" can have characters XML treats specially
    safe = escape(name, {'"': '&quot;'})
    new = re.sub(r'name="[^"]*"', lambda m: f'name="{safe}"', tag.group(0))
    if decorative and 'adec:decorative' not in shape:
        new = new[:-2] + f'>{DECORATIVE}</p:cNvPr>' if tag.group(1) else new + DECORATIVE
    return shape.replace(tag.group(0), new, 1)


def gap_before_bullets(shape: str) -> str:
    """A paragraph followed by bullet points gets a 6pt gap after it, as on the accessibility slides"""
    paras = list(re.finditer(r'<a:p>.*?</a:p>', shape, re.S))
    for this, following in reversed(list(zip(paras, paras[1:]))):
        p = this.group(0)
        if '<a:buChar' in following.group(0) and '<a:buChar' not in p and '<a:spcAft>' in p:
            p = re.sub(r'<a:spcAft>.*?</a:spcAft>', '<a:spcAft><a:spcPts val="600"/></a:spcAft>', p, count=1, flags=re.S)
            shape = shape[: this.start()] + p + shape[this.end() :]
    return shape


def same_corners(path: Path) -> None:
    """
    Gives every rounded box on the slides the same corner size as the title block, whatever its
    size, including boxes added by hand later, such as code examples. It also makes sure no slide
    is hidden
    """
    radius = 0.16 * TITLE_BOX[3]
    pkg = Package(path)
    changed = False
    for part in [n for n in pkg.names if re.fullmatch(r'ppt/(slides/slide|slideLayouts/slideLayout)\d+\.xml', n)]:
        xml = pkg.text(part)

        def fix(match: re.Match) -> str:
            shape = match.group(0)
            size = re.search(r'<a:ext cx="(\d+)" cy="(\d+)"/>', shape)
            if not size:
                return shape
            adj = round(radius / min(int(size.group(1)), int(size.group(2))) * 100000)
            return re.sub(
                r'<a:prstGeom prst="roundRect">.*?</a:prstGeom>',
                f'<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val {adj}"/></a:avLst></a:prstGeom>',
                shape,
                flags=re.S,
            )

        new = re.sub(r'<p:sp>(?:(?!</p:sp>).)*?prst="roundRect".*?</p:sp>', fix, xml, flags=re.S)
        # The original decks marked every slide as hidden, so a slideshow would skip them all
        new = re.sub(r'(<p:sld\b[^>]*?) show="0"', r'\1', new)
        if new != xml:
            pkg.set_text(part, new)
            changed = True
    if changed:
        pkg.save(path)
        print(f'Made the corners match, and every slide shown, in {path.relative_to(ROOT.parent)}')


def line_spacing(shape: str, points: int) -> str:
    """
    Gives each paragraph with none set the same line spacing as the accessibility slides, in
    hundredths of a point. Without it, the text takes the font's own spacing, which is too loose
    for some boxes
    """

    spacing = f'<a:lnSpc><a:spcPts val="{points}"/></a:lnSpc>'

    def add(match: re.Match) -> str:
        paragraph = match.group(0)
        # Only one line spacing is allowed, so paragraphs that have one keep it
        if '<a:lnSpc>' in paragraph:
            return paragraph
        ppr = re.match(r'<a:p><a:pPr\b[^>]*?(/?)>', paragraph)
        if not ppr:
            return paragraph.replace('<a:p>', f'<a:p><a:pPr>{spacing}</a:pPr>', 1)
        tag = ppr.group(0)
        new = tag[:-2] + f'>{spacing}</a:pPr>' if ppr.group(1) else tag + spacing
        return paragraph.replace(tag, new, 1)

    return re.sub(r'<a:p>.*?</a:p>', add, shape, flags=re.S)


def pptx_two_row_layout(pkg: Package) -> None:
    """
    Lays out slides with 2 rows of boxes (a big one, then useful links) the same way as the
    accessibility slides: the title in the same place, the rows evenly spaced, the same rounded
    corners, and shapes named for what they are, so the PDF made from them has the right headings
    """
    radius = 0.16 * TITLE_BOX[3]
    for slide in [n for n in pkg.names if re.fullmatch(r'ppt/slides/slide\d+\.xml', n)]:
        xml = pkg.text(slide)
        for shape in re.findall(r'<p:sp>.*?</p:sp>', xml, re.S):
            position = re.search(r'<a:off x="(-?\d+)" y="(-?\d+)"/><a:ext cx="(\d+)" cy="(\d+)"/>', shape)
            if not position or 'name="Site link"' in shape:
                continue
            x, y, cx, cy = (int(v) for v in position.groups())
            text = ''.join(re.findall(r'<a:t>([^<]*)</a:t>', shape)).strip()
            if re.search(r'<p:ph [^>]*?type="(?:ctr)?[tT]itle"', shape):
                new = rename_shape(set_box(shape, *TITLE_TEXT_BOX), 'Title')
            else:
                first_row = y < LAST_ROW_Y - ROW_GAP
                row = "Let's talk about it" if first_row else 'Useful links'
                new = set_box(
                    shape,
                    y=FIRST_ROW_Y if first_row else LAST_ROW_Y,
                    cy=FIRST_ROW_HEIGHT if first_row else cy,
                )
                if not text:
                    height = FIRST_ROW_HEIGHT if first_row else cy
                    adj = round(radius / min(cx, height) * 100000)
                    new = rename_shape(new, 'Decorative box', decorative=True)
                    new = re.sub(r'<a:gd name="adj" fmla="val \d+"/>', f'<a:gd name="adj" fmla="val {adj}"/>', new)
                    new = new.replace(
                        '<a:prstGeom prst="roundRect"><a:avLst/>',
                        f'<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val {adj}"/></a:avLst>',
                    )
                elif x < 1000000:
                    new = rename_shape(new, f'{row} heading')
                else:
                    new = gap_before_bullets(rename_shape(new, f'{row} text'))
                    # 11.5pt lines for 10pt text, and 14pt for the list of links
                    new = line_spacing(new, 1150 if first_row else 1400)
            xml = xml.replace(shape, new, 1)
        pkg.set_text(slide, xml)


# The infographics: 6 boxes in 2 rows of 3, each with a heading on a tab across its top edge, then
# a note at the bottom. The boxes were part of the giffgaff background picture, so they're drawn
# as shapes instead. The rows have the same gaps as the highlights
INFO_COLUMNS = (232575, 3189750, 6146925)
INFO_BOX_WIDTH = 2764500
INFO_TAB_WIDTH = 1967100
INFO_TAB_HEIGHT = 432000
INFO_TAB_TO_BOX = 186382
# The text starts right under the tab, and goes down to the bottom of the box
INFO_TAB_TO_TEXT = INFO_TAB_HEIGHT
INFO_ROW_HEIGHT = 1703707  # from the top of the tab to the bottom of the box
INFO_TEXT_HEIGHT = INFO_ROW_HEIGHT - INFO_TAB_TO_TEXT
# The space inside the text boxes, at the top and bottom
INFO_TEXT_INSET = 45720
INFO_ROWS = (FIRST_ROW_Y, FIRST_ROW_Y + INFO_ROW_HEIGHT + ROW_GAP)
INFO_RIGHT = INFO_COLUMNS[-1] + INFO_BOX_WIDTH
# The link to the site, lined up with the right edge of the boxes, and the note beside it
INFO_FOOTER_X = INFO_RIGHT - FOOTER_BOX[2]
INFO_NOTE_BOX = (
    INFO_COLUMNS[0],
    INFO_ROWS[1] + INFO_ROW_HEIGHT + ROW_GAP,
    INFO_FOOTER_X - ROW_GAP - INFO_COLUMNS[0],
    FOOTER_BOX[1] + FOOTER_BOX[3] - (INFO_ROWS[1] + INFO_ROW_HEIGHT + ROW_GAP),
)


def decorative_box(shape_id: int, box: tuple, outline: bool) -> str:
    """A white rounded box, marked as decorative, with a purple outline for heading tabs"""
    x, y, cx, cy = box
    adj = round(0.16 * TITLE_BOX[3] / min(cx, cy) * 100000)
    line = (
        f'<a:ln w="28575"><a:solidFill><a:srgbClr val="{BLUE}"/></a:solidFill></a:ln>'
        if outline
        else '<a:ln><a:noFill/></a:ln>'
    )
    return (
        f'<p:sp><p:nvSpPr><p:cNvPr id="{shape_id}" name="Decorative box">{DECORATIVE}</p:cNvPr>'
        '<p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
        f'<p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
        f'<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val {adj}"/></a:avLst></a:prstGeom>'
        f'<a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>{line}</p:spPr>'
        '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="en-GB"/></a:p></p:txBody></p:sp>'
    )


def even_bullets(shape: str) -> str:
    """The same 4pt gap between every bullet point, where the originals had 0, 4 or 8pt"""
    bullets = 0

    def space(match: re.Match) -> str:
        nonlocal bullets
        paragraph = match.group(0)
        if '<a:buChar' not in paragraph:
            return paragraph
        before = '0' if bullets == 0 else '400'
        bullets += 1
        paragraph = re.sub(r'<a:spcBef>.*?</a:spcBef>', f'<a:spcBef><a:spcPts val="{before}"/></a:spcBef>', paragraph, count=1, flags=re.S)
        return re.sub(r'<a:spcAft>.*?</a:spcAft>', '<a:spcAft><a:spcPts val="0"/></a:spcAft>', paragraph, count=1, flags=re.S)

    return re.sub(r'<a:p>.*?</a:p>', space, shape, flags=re.S)


def pptx_infographic_layout(pkg: Package) -> None:
    """
    Draws each infographic's boxes and heading tabs, puts the text in the same place on every
    slide, and names the shapes for what they are, so the PDF made from them has the right
    headings. The note at the bottom moves to the left, next to the link to the site, in 10pt
    rather than 8pt, so it's easier to read
    """
    for slide in [n for n in pkg.names if re.fullmatch(r'ppt/slides/slide\d+\.xml', n)]:
        xml = pkg.text(slide)
        shapes = re.findall(r'<p:sp>.*?</p:sp>', xml, re.S)
        headings: dict[tuple[int, int], str] = {}
        placed = []
        for shape in shapes:
            if re.search(r'<p:ph [^>]*?type="(?:ctr)?[tT]itle"', shape):
                # Some titles take their place from the layout, so they're given their own
                if '<a:xfrm>' not in shape:
                    xfrm = '<a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="704400"/></a:xfrm>'
                    shape_with = re.sub(r'<p:spPr\s*/>', f'<p:spPr>{xfrm}</p:spPr>', shape, count=1)
                    if shape_with == shape:
                        shape_with = re.sub(r'<p:spPr>', f'<p:spPr>{xfrm}', shape, count=1)
                else:
                    shape_with = shape
                placed.append((shape, rename_shape(set_box(shape_with, *TITLE_TEXT_BOX), 'Title')))
                continue
            position = re.search(r'<a:off x="(-?\d+)" y="(-?\d+)"/><a:ext cx="(\d+)" cy="(\d+)"/>', shape)
            if not position or 'name="Site link"' in shape:
                placed.append((shape, shape))
                continue
            x, y, cx, cy = (int(v) for v in position.groups())
            text = unescape(''.join(re.findall(r'<a:t>([^<]*)</a:t>', shape))).strip()
            if cx >= 9000000:
                note = rename_shape(set_box(shape, *INFO_NOTE_BOX), 'Note')
                note = re.sub(
                    r'<a:bodyPr\b[^>]*?(/?)>',
                    r'<a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="b"\1>',
                    note,
                    count=1,
                )
                note = re.sub(r'algn="ctr"', 'algn="l"', note).replace('sz="800"', 'sz="1000"')
                # 12pt lines, with no extra space, so 2 lines fit beside the link to the site
                note = re.sub(r'<a:lnSpc>.*?</a:lnSpc>', '', note, flags=re.S)
                note = re.sub(r'<a:(spcBef|spcAft)>.*?</a:\1>', r'<a:\1><a:spcPts val="0"/></a:\1>', note, flags=re.S)
                note = line_spacing(note, 1200)
                placed.append((shape, note))
                continue
            column = min(range(3), key=lambda c: abs(INFO_COLUMNS[c] + INFO_BOX_WIDTH / 2 - (x + cx / 2)))
            row = 0 if y < (INFO_ROWS[0] + INFO_ROWS[1]) / 2 else 1
            top = INFO_ROWS[row]
            if cy < INFO_TAB_HEIGHT * 1.5:
                headings[(row, column)] = text
                box = (INFO_COLUMNS[column] + (INFO_BOX_WIDTH - INFO_TAB_WIDTH) // 2, top, INFO_TAB_WIDTH, INFO_TAB_HEIGHT)
                placed.append((shape, rename_shape(set_box(shape, *box), f'{text} heading')))
            else:
                box = (INFO_COLUMNS[column], top + INFO_TAB_TO_TEXT, INFO_BOX_WIDTH, INFO_TEXT_HEIGHT)
                body = set_box(shape, *box)
                body = re.sub(r'\b(tIns|bIns)="\d+"', rf'\1="{INFO_TEXT_INSET}"', body)
                # The same line spacing everywhere, as on the highlights, where the originals varied
                body = line_spacing(re.sub(r'<a:lnSpc>.*?</a:lnSpc>', '', body, flags=re.S), 1150)
                placed.append((shape, even_bullets(body) + f'<!--text {row} {column}-->'))
        for old, new in placed:
            xml = xml.replace(old, new, 1)
        for (row, column), heading in headings.items():
            xml = re.sub(
                rf'(<p:sp>(?:(?!</p:sp>).)*?</p:sp>)<!--text {row} {column}-->',
                lambda m: rename_shape(m.group(1), f'{heading} text'),
                xml,
                count=1,
                flags=re.S,
            )
        xml = re.sub(r'<!--text \d \d-->', '', xml)

        # The boxes and tabs go first, so they're drawn behind the text
        drawn = ''
        shape_id = 2000
        for top in INFO_ROWS:
            for left in INFO_COLUMNS:
                box_top = top + INFO_TAB_TO_BOX
                drawn += decorative_box(shape_id, (left, box_top, INFO_BOX_WIDTH, top + INFO_ROW_HEIGHT - box_top), False)
                tab = (left + (INFO_BOX_WIDTH - INFO_TAB_WIDTH) // 2, top, INFO_TAB_WIDTH, INFO_TAB_HEIGHT)
                drawn += decorative_box(shape_id + 1, tab, True)
                shape_id += 2
        xml = xml.replace('</p:grpSpPr>', f'</p:grpSpPr>{drawn}', 1)
        # The link to the site lines up with the right edge of the boxes
        xml = re.sub(
            r'(name="Site link".*?<a:off x=")\d+(")',
            rf'\g<1>{INFO_FOOTER_X}\2',
            xml,
            count=1,
            flags=re.S,
        )
        pkg.set_text(slide, xml)


def rebrand_pptx(src: Path, out: Path, title: str) -> None:
    pkg = Package(src)
    neurodiversity = src.name.startswith('Neurodiversity') and 'Infographics' not in src.name
    infographics = 'Infographics' in src.name
    if neurodiversity:
        pptx_neurodiversity_text(pkg)
    elif not infographics:
        pptx_highlights_text(pkg)
    swap_fonts(pkg)
    pptx_backgrounds(pkg)
    pptx_footer_links(pkg)
    if neurodiversity:
        pptx_two_row_layout(pkg)
    if infographics:
        pptx_infographic_layout(pkg)
    pptx_colours(pkg)
    pptx_embed_fonts(pkg)
    set_core_properties(pkg, title)
    check_and_save(pkg, out)


def check_and_save(pkg: Package, out: Path) -> None:
    left = [
        n
        for n in pkg.xml_names()
        if re.search('giffgaff|Poppins|Consolas|Abigail Harrison \\(UK\\)|abiharrisonnye', pkg.text(n), re.I)
    ]
    if left:
        sys.exit(f'{out.name} still mentions giffgaff, an old font or the old author in: {", ".join(left)}')
    pkg.save(out)
    print(f'Made {out.relative_to(ROOT.parent)}')


def docx_link_text(pkg: Package, text: str, url: str) -> None:
    """Makes some words in a paragraph a link, unless the paragraph already has one"""
    paragraph = docx_paragraph(pkg.text('word/document.xml'), text)
    if '<w:hyperlink' in paragraph:
        return
    before, after = unescape(''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', paragraph))).split(text, 1)
    docx_rewrite_paragraph(pkg, text, [before, (text, url), after])


def docx_theme_fonts(pkg: Package) -> None:
    """
    Uses my font as the theme's heading and body fonts. Word puts Calibri and Cambria there, and
    then puts copies of them in the file, which makes it over 1MB bigger
    """
    theme = pkg.text('word/theme/theme1.xml')
    theme = re.sub(r'(<a:(?:major|minor)Font><a:latin typeface=")[^"]*"', rf'\1{FONT}"', theme)
    pkg.set_text('word/theme/theme1.xml', theme)


def finish_edited(path: Path, title: str) -> None:
    """Updates a file I've edited by hand, keeping everything I wrote"""
    pkg = Package(path)
    docx_footer_text(pkg, site_link=True)
    if path.name == 'accessible-meeting-checklist.docx':
        docx_link_text(pkg, 'Meeting Invite Template', f'{TOOLKIT_URL}/meeting-invite-template')
    swap_fonts(pkg)
    docx_theme_fonts(pkg)
    docx_embed_fonts(pkg)
    set_core_properties(pkg, title)
    check_and_save(pkg, path)


def source(name: str) -> Path:
    """
    A source file in branded/. The giffgaff originals they were first made from aren't in this
    repo, so a missing one stops the script
    """
    path = BRANDED / name
    if not path.exists():
        sys.exit(f'{path.relative_to(ROOT.parent)} is missing. It is a source file, so restore it from git or a backup.')
    return path


def main() -> None:
    for _, out_name, title in EDITED_FILES:
        finish_edited(source(out_name), title)

    for highlights, _, out_name, title in HIGHLIGHT_SETS:
        made = split_highlights(Package(source(highlights)), (BRANDED / highlights).parent)
        print(f'Made {len(made)} files, one for each of the {title}')

        same_corners(source(out_name))
        slides = split_slides(BRANDED / out_name, (BRANDED / out_name).parent, made)
        print(f'Made {len(slides)} slides files, one for each of the {title}')
        if len(slides) != len(made):
            sys.exit(f'No slide found for: {", ".join(sorted(set(made) - set(slides)))}')

    for _, out_name, title in INFOGRAPHIC_SETS:
        same_corners(source(out_name))
        made = split_slides(BRANDED / out_name, (BRANDED / out_name).parent, None)
        print(f'Made {len(made)} files, one for each of the {title}')


if __name__ == '__main__':
    main()
