"""
Makes and tidies the Inclusion Toolkit's branded files. Edit the Word files and slides in
toolkit-sources/branded/. Everything else is made from them.

It never remakes a branded file, so edits to them are kept. Each run only:
- sets each Word file's margins, paragraph spacing, title heading and footer
- takes link formatting off text that isn't a link
- puts the fonts inside each Word file, so they look the same for people who don't have them
- sets the file details, which Word can change when I save
- cuts the full highlights and infographics into one file each, and lists the abbreviations each
  highlight uses

Run it from the repo root, with Python 3.10 or newer and no extra packages:

    /opt/homebrew/bin/python3 -I toolkit-sources/rebrand.py

It stops with an error if any mention of giffgaff is left.
"""

import re
import sys
import uuid
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape, unescape

ROOT = Path(__file__).resolve().parent
BRANDED = ROOT / 'branded'

# SITE_DISPLAY has capitals so it's easier to read
SITE_URL = 'https://inclusiontoolkit.org'
SITE_DISPLAY = 'InclusionToolkit.org'
SITE_NAME = 'Inclusion Toolkit'


# The author, in each file's details
NAME = 'Abi Harrison-Nye'
FONT = 'Atkinson Hyperlegible Next'
MONO_FONT = 'Atkinson Hyperlegible Mono'

# Static fonts, installed on the Mac. The SIL Open Font License allows putting them in files
FONT_FOLDER = Path.home() / 'Library' / 'Fonts'
FONT_FILES = {FONT: 'AtkinsonHyperlegibleNext', MONO_FONT: 'AtkinsonHyperlegibleMono'}
FONT_STYLES = ('Regular', 'Bold', 'Italic', 'BoldItalic')

# From src/styles/tokens/primitives.css. Each pair passes WCAG AAA contrast (7:1 or more)
BLUE = '1C4882'  # Headings and links on white: 9.1:1
SLATE = '3A4A5E'  # Footer text on white: 9.1:1


# Side margins of 1.45 inches, so a line of text on A4 is under 80 characters (WCAG 1.4.8)
SIDE_MARGIN = 2088
# Space after each paragraph, so there's more between paragraphs than between lines (WCAG 1.4.8)
PARAGRAPH_AFTER = 280

ABBREVIATIONS_FILE = ROOT.parent / 'src' / 'content' / 'abbreviations.ts'

# Titles used in more than one folder. Their files' titles add the folder's name, so two open
# files, or two downloads, can be told apart (WCAG 2.4.2)
SHARED_TITLES = {'Meetings', 'Colour Blindness', "Tourette's Syndrome"}

# Each Word file edited by hand, and its title
EDITED_FILES = [
    ('email-signature-additions.docx', 'Email Signature Additions'),
    ('meeting-invite-template.docx', 'Meeting Invite Template'),
    ('accessible-meeting-checklist.docx', 'Accessible Meeting Checklist'),
    ('highlights/accessibility/accessibility-highlights.docx', 'All Accessibility Highlights'),
    ('highlights/neurodiversity/neurodiversity-highlights.docx', 'All Neurodiversity Highlights'),
]
# Each set of highlights: its Word file and slides, cut into one file for each highlight
HIGHLIGHT_SETS = [
    (
        'highlights/accessibility/accessibility-highlights.docx',
        'highlights/accessibility/accessibility-highlights.pptx',
        'All Accessibility Highlights',
    ),
    (
        'highlights/neurodiversity/neurodiversity-highlights.docx',
        'highlights/neurodiversity/neurodiversity-highlights.pptx',
        'All Neurodiversity Highlights',
    ),
]
# Each set of infographics, cut into one file for each infographic
INFOGRAPHIC_SETS = [
    ('infographics/accessibility/accessibility-infographics.pptx', 'All Accessibility Infographics'),
    ('infographics/neurodiversity/neurodiversity-infographics.pptx', 'All Neurodiversity Infographics'),
]

REL_HYPERLINK = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink'
REL_IMAGE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image'
REL_CORE = 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties'


class Package:
    """A Word or PowerPoint file, which is a zip of XML parts"""

    def __init__(self, path: Path):
        with zipfile.ZipFile(path) as z:
            self.names = z.namelist()
            self.parts = {name: z.read(name) for name in self.names}

    def copy(self) -> 'Package':
        duplicate = Package.__new__(Package)
        duplicate.names = list(self.names)
        duplicate.parts = dict(self.parts)
        return duplicate

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
    """Swaps the old fonts (Poppins, Roboto Mono, Consolas and Arial) for the toolkit's fonts"""
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
    """A fixed GUID for each font, so files only change when their content does"""
    return '{' + str(uuid.uuid5(uuid.NAMESPACE_URL, f'{SITE_URL}/fonts/{family}/{style}')).upper() + '}'


def docx_paragraph(xml: str, marker: str) -> str:
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


def docx_remove_embedded_fonts(pkg: Package) -> None:
    """Removes the fonts inside the file, so they can be put back in fresh"""
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


def docx_footer_text(pkg: Package) -> None:
    """The site's name, a link to the site, and the page number on the right"""
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


def slugify(title: str) -> str:
    """Breadcrumbs & Wayfinding gives breadcrumbs-and-wayfinding, and Tourette's gives tourettes"""
    plain = title.lower().replace('&', 'and').replace("'", '').replace('’', '')
    return re.sub(r'[^a-z0-9]+', '-', plain).strip('-')


def remove_unused_parts(pkg: Package) -> None:
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


def site_abbreviations() -> dict[str, str]:
    found = re.findall(
        r"^  '?([A-Za-z0-9]+)'?: '((?:[^'\\]|\\.)*)',$",
        ABBREVIATIONS_FILE.read_text(encoding='utf-8'),
        re.M,
    )
    if not found:
        sys.exit(f'No abbreviations found in {ABBREVIATIONS_FILE}. Has its layout changed?')
    return {name: full.replace("\\'", "'") for name, full in found}


def abbreviations_section(text: str, abbreviations: dict[str, str]) -> str:
    """
    Lists each abbreviation the text uses, with its full form. A highlight's own file has no
    glossary, so this is how people find out what they mean (WCAG 3.1.4)
    """
    used = [
        name
        for name in sorted(abbreviations, key=str.lower)
        if re.search(rf'(?<![A-Za-z]){re.escape(name)}s?(?![A-Za-z])', text)
    ]
    if not used:
        return ''

    def paragraph(runs: str, style: str = '') -> str:
        ppr = f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>' if style else ''
        return f'<w:p>{ppr}{runs}</w:p>'

    def run(text: str, bold: bool = False) -> str:
        rpr = '<w:rPr><w:b/></w:rPr>' if bold else ''
        return f'<w:r>{rpr}<w:t xml:space="preserve">{escape(text)}</w:t></w:r>'

    entries = ''.join(
        paragraph(run(name, bold=True) + run(f': {abbreviations[name][0].upper()}{abbreviations[name][1:]}'))
        for name in used
    )
    return (
        paragraph(run('Abbreviations'), 'Heading2')
        + paragraph(run('The full form of each abbreviation used in this document.'))
        + entries
    )


def file_title(title: str, folder_title: str) -> str:
    plain = title.replace('’', "'")
    return f'{title} ({folder_title})' if plain in SHARED_TITLES else title


def split_highlights(full: Package, folder: Path, folder_title: str) -> list[str]:
    """Makes a Word file for each highlight. The glossaries stay in the full file only"""
    abbreviations = site_abbreviations()
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
        pkg = full.copy()
        # A line break between paragraphs, so an abbreviation at the start or end of one isn't
        # joined to the next paragraph's first word
        section_text = unescape(
            '\n'.join(''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', p)) for p in section)
        )
        pkg.set_text(
            'word/document.xml',
            xml[: body.start(1)]
            + ''.join(promoted)
            + abbreviations_section(section_text, abbreviations)
            + sect
            + xml[body.end(1) :],
        )
        remove_unused_parts(pkg)
        docx_embed_fonts(pkg)
        set_core_properties(pkg, file_title(title, folder_title))
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


def split_slides(deck: Path, folder: Path, slugs: list[str] | None, folder_title: str) -> list[str]:
    """Makes a PowerPoint file for each highlight's slide, matched to it by its title"""
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

        pkg = full.copy()
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
        set_core_properties(pkg, file_title(title, folder_title))
        check_and_save(pkg, folder / f'{slug}.pptx')
        made.append(slug)
    return made


# The slides' corner size: the same as the title block's, in EMUs (914400 to an inch)
CORNER_RADIUS = 0.16 * 731520


def same_corners(path: Path) -> None:
    """
    Gives every rounded box the title block's corner size, whatever its size, including boxes added
    later. It also makes sure no slide is hidden
    """
    radius = CORNER_RADIUS
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
        # A slideshow skips hidden slides
        new = re.sub(r'(<p:sld\b[^>]*?) show="0"', r'\1', new)
        if new != xml:
            pkg.set_text(part, new)
            changed = True
    if changed:
        pkg.save(path)
        print(f'Made the corners match, and every slide shown, in {path.relative_to(ROOT.parent)}')


def check_and_save(pkg: Package, out: Path) -> None:
    left = [
        n
        for n in pkg.xml_names()
        if re.search('giffgaff|Poppins|Consolas|Abigail Harrison \\(UK\\)|abiharrisonnye', pkg.text(n), re.I)
    ]
    if left:
        sys.exit(f'{out.name} still mentions giffgaff, an old font or the old author in: {", ".join(left)}')
    # Markdown copied in from the page text, such as _Note:_ or `code`, which screen readers would
    # read out as underscores or other symbols
    for name in pkg.xml_names():
        text = ' '.join(re.findall(r'<(?:w|a):t(?: [^>]*)?>([^<]*)</(?:w|a):t>', pkg.text(name)))
        markdown = re.search(r'(?<!\w)_[A-Za-z][^_]*_(?!\w)|`|\*\*', text)
        if markdown:
            sys.exit(f'{out.name} has Markdown in its text, in {name}: {markdown.group(0)}')
    pkg.save(out)
    print(f'Made {out.relative_to(ROOT.parent)}')


def docx_link_text(pkg: Package, text: str, url: str) -> None:
    """Makes the text a link, unless its paragraph already has one"""
    paragraph = docx_paragraph(pkg.text('word/document.xml'), text)
    if '<w:hyperlink' in paragraph:
        return
    before, after = unescape(''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', paragraph))).split(text, 1)
    docx_rewrite_paragraph(pkg, text, [before, (text, url), after])


def docx_theme_fonts(pkg: Package) -> None:
    """Word puts Calibri and Cambria here, then copies of them in the file, which adds over 1MB"""
    theme = pkg.text('word/theme/theme1.xml')
    theme = re.sub(r'(<a:(?:major|minor)Font><a:latin typeface=")[^"]*"', rf'\1{FONT}"', theme)
    pkg.set_text('word/theme/theme1.xml', theme)


def docx_margins(pkg: Package) -> None:
    xml = pkg.text('word/document.xml')
    xml = re.sub(
        r'<w:pgMar [^>]*/>',
        lambda m: re.sub(r'w:(left|right)="\d+"', rf'w:\1="{SIDE_MARGIN}"', m.group(0)),
        xml,
    )
    pkg.set_text('word/document.xml', xml)


def docx_paragraph_spacing(pkg: Package) -> None:
    styles = pkg.text('word/styles.xml')
    default = re.search(r'<w:pPrDefault>.*?</w:pPrDefault>', styles, re.S).group(0)
    spacing = re.search(r'<w:spacing [^>]*/>', default)
    if spacing and 'w:after=' in spacing.group(0):
        return
    new = (
        default.replace('<w:spacing ', f'<w:spacing w:after="{PARAGRAPH_AFTER}" ', 1)
        if spacing
        else default.replace('<w:pPr>', f'<w:pPr><w:spacing w:after="{PARAGRAPH_AFTER}"/>', 1)
    )
    pkg.set_text('word/styles.xml', styles.replace(default, new))


def docx_title_heading(pkg: Package) -> None:
    """
    Makes the Title style a level 1 heading, so screen readers and Word's Navigation Pane list it
    as the main heading, rather than starting at level 2 (WCAG 1.3.1)
    """
    styles = pkg.text('word/styles.xml')
    match = re.search(r'<w:style [^>]*w:styleId="Title".*?</w:style>', styles, re.S)
    if not match or '<w:outlineLvl ' in match.group(0):
        return
    style = match.group(0)
    new = re.sub(r'(<w:pPr>.*?)(</w:pPr>)', r'\1<w:outlineLvl w:val="0"/>\2', style, count=1, flags=re.S)
    pkg.set_text('word/styles.xml', styles.replace(style, new))


def docx_no_fake_links(pkg: Package) -> None:
    """
    Takes the link colour and underline off text that isn't a link, so only real links look like
    links (WCAG 1.3.1)
    """
    xml = pkg.text('word/document.xml')
    pieces = re.split(r'(<w:hyperlink[ >].*?</w:hyperlink>)', xml, flags=re.S)
    for i in range(0, len(pieces), 2):
        pieces[i] = re.sub(
            r'<w:rPr>(?:(?!</w:rPr>).)*<w:u w:val="(?!none)[^"]*"/>(?:(?!</w:rPr>).)*</w:rPr>',
            lambda m: m.group(0)
            .replace(f'<w:color w:val="{BLUE}"/>', '')
            .replace(re.search(r'<w:u w:val="[^"]*"/>', m.group(0)).group(0), ''),
            pieces[i],
            flags=re.S,
        ).replace('<w:rPr></w:rPr>', '')
    pkg.set_text('word/document.xml', ''.join(pieces))


def finish_edited(path: Path, title: str) -> None:
    pkg = Package(path)
    docx_margins(pkg)
    docx_paragraph_spacing(pkg)
    docx_title_heading(pkg)
    docx_no_fake_links(pkg)
    # After the margins, as the page number lines up with the right margin
    docx_footer_text(pkg)
    if path.name == 'accessible-meeting-checklist.docx':
        docx_link_text(pkg, 'Meeting Invite Template', f'{SITE_URL}/meeting-invite-template')
    swap_fonts(pkg)
    docx_theme_fonts(pkg)
    docx_embed_fonts(pkg)
    set_core_properties(pkg, title)
    check_and_save(pkg, path)


def source(name: str) -> Path:
    path = BRANDED / name
    if not path.exists():
        sys.exit(f'{path.relative_to(ROOT.parent)} is missing. It is a source file, so restore it from git or a backup.')
    return path


def set_title(path: Path, title: str) -> None:
    pkg = Package(path)
    set_core_properties(pkg, title)
    check_and_save(pkg, path)


def main() -> None:
    for out_name, title in EDITED_FILES:
        finish_edited(source(out_name), title)

    for highlights, out_name, title in HIGHLIGHT_SETS:
        folder_title = title.removeprefix('All ')
        made = split_highlights(Package(source(highlights)), (BRANDED / highlights).parent, folder_title)
        print(f'Made {len(made)} files, one for each resource in {title}')

        same_corners(source(out_name))
        set_title(source(out_name), title)
        slides = split_slides(BRANDED / out_name, (BRANDED / out_name).parent, made, folder_title)
        print(f'Made {len(slides)} slides files, one for each resource in {title}')
        if len(slides) != len(made):
            sys.exit(f'No slide found for: {", ".join(sorted(set(made) - set(slides)))}')

    for out_name, title in INFOGRAPHIC_SETS:
        same_corners(source(out_name))
        set_title(source(out_name), title)
        made = split_slides(
            BRANDED / out_name, (BRANDED / out_name).parent, None, title.removeprefix('All ')
        )
        print(f'Made {len(made)} files, one for each resource in {title}')


if __name__ == '__main__':
    main()
