"""
Makes everything else each Inclusion Toolkit resource needs, from its branded Word file:
- a tagged PDF that looks like the Word file, made by the browser the site's tests use
- if it has slides, a tagged PDF of them too, drawn from the PowerPoint file the same way
- a draft of its text for the site, in src/content/toolkit/, if it doesn't have one yet
Then it copies the files into public/files/, and adds any new resource to
src/content/toolkit.json. It never changes text, descriptions or to-dos already there, so
checked text stays checked.

Run it from the repo root, after rebrand.py, with the Node version from .nvmrc:

    /opt/homebrew/bin/python3 -I toolkit-sources/export.py
"""

import json
import re
import shutil
import subprocess
import sys
import zipfile
import xml.etree.ElementTree as ET
from base64 import b64encode
from html import escape, unescape
from pathlib import Path
from posixpath import normpath

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
BRANDED = ROOT / 'branded'
BUILD = ROOT / 'build'
TEXT = REPO / 'src' / 'content' / 'toolkit'
PUBLIC = REPO / 'public'
FILES = 'files'
RECORD = REPO / 'src' / 'content' / 'toolkit.json'


def site_path(relative: Path) -> Path:
    """
    Where a resource is on the site. The sources are grouped by format, then topic, such as
    highlights/accessibility/dark-mode, but the site is grouped by topic first, such as
    accessibility/highlights/dark-mode
    """
    parts = relative.parts
    if parts[0] in ('highlights', 'infographics') and len(parts) > 2:
        return Path(parts[1], parts[0], *parts[2:])
    return relative

NAME = 'Abi Harrison-Nye'
# The slides' version of each resource, and what's added to its files' names
SUMMARY = 'visual summary'
SUMMARY_SUFFIX = '-visual-summary'
SITE_DISPLAY = 'AbiHarrisonNye.dev'
FONT = 'Atkinson Hyperlegible Next'
MONO_FONT = 'Atkinson Hyperlegible Mono'
LINK = '#5B2A99'
FOOTER = '#4A3D5C'

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'
DC = 'http://purl.org/dc/elements/1.1/'
REL = 'http://schemas.openxmlformats.org/package/2006/relationships'


def w(tag: str) -> str:
    return f'{{{W}}}{tag}'


def on(element) -> bool:
    """Whether a setting such as <w:b/> is on. <w:b w:val="0"/> turns it off"""
    return element is not None and element.get(w('val'), '1') not in ('0', 'false')


# What I already know about resources, for adding them to toolkit.json the first time. Anything
# else gets a drafted description and a to-do to check it
DETAILS = {
    'email-signature-additions': {
        'description': 'Some template examples that can be added to an email signature to share '
        'information about accessibility, neurodiversity, and working differences.',
        'updated': '2026-06-01',
    },
    'meeting-invite-template': {
        'description': 'A meeting invite template, created so that no information gets missed when '
        'setting up meetings.',
        'updated': '2026-06-01',
    },
    'accessible-meeting-checklist': {
        'description': 'A checklist of things to ensure meetings are accessible to all attendees.',
        'updated': '2026-06-16',
    },
    # A draft, so it still gets a to-do to check it
    'accessibility-highlights': {
        'draft_description': 'Every accessibility highlight in one file, each with what it’s for, how '
        'to support it and useful links, plus a glossary of terms.',
        'first': True,
    },
    'neurodiversity-highlights': {
        'draft_description': 'Every neurodiversity highlight in one file, each explaining a topic '
        'and how to support people, with useful links.',
        'first': True,
    },
    'accessibility-infographics': {
        'draft_description': 'Every accessibility infographic in one file, each covering the '
        'symptoms, diagnosis, treatment and support for a condition.',
        'first': True,
    },
    'neurodiversity-infographics': {
        'draft_description': 'Every neurodiversity infographic in one file, each covering the '
        'symptoms, diagnosis, treatment and support for a condition.',
        'first': True,
    },
}
# The date for new highlights and infographics, when they're added to toolkit.json for the first time
HIGHLIGHTS_UPDATED = '2026-11-06'
INFOGRAPHICS_UPDATED = '2026-11-06'


# Reading Word files


class Docx:
    def __init__(self, path: Path):
        with zipfile.ZipFile(path) as z:
            self.parts = {name: z.read(name) for name in z.namelist()}
        self.document = ET.fromstring(self.parts['word/document.xml'])
        self.styles = ET.fromstring(self.parts['word/styles.xml'])
        self.numbering = (
            ET.fromstring(self.parts['word/numbering.xml']) if 'word/numbering.xml' in self.parts else None
        )
        self.rels = {
            rel.get('Id'): rel
            for rel in ET.fromstring(self.parts['word/_rels/document.xml.rels']).iter(f'{{{REL}}}Relationship')
        }
        core = ET.fromstring(self.parts['docProps/core.xml'])
        self.title = core.findtext(f'{{{DC}}}title')
        footer = self.parts.get('word/footer1.xml', b'').decode('utf-8')
        self.footer_has_site = SITE_DISPLAY in footer

    def list_format(self, num_id: str, level: int) -> tuple[str, str, int]:
        """The format of a list level, such as bullet or decimal, with its bullet and start number"""
        num = next(n for n in self.numbering.iter(w('num')) if n.get(w('numId')) == num_id)
        abstract_id = num.find(w('abstractNumId')).get(w('val'))
        abstract = next(
            a for a in self.numbering.iter(w('abstractNum')) if a.get(w('abstractNumId')) == abstract_id
        )
        lvl = next(lvl for lvl in abstract.iter(w('lvl')) if lvl.get(w('ilvl')) == str(level))
        return (
            lvl.find(w('numFmt')).get(w('val')),
            lvl.find(w('lvlText')).get(w('val'), ''),
            int(lvl.find(w('start')).get(w('val'), '1')) if lvl.find(w('start')) is not None else 1,
        )

    def style(self, style_id: str):
        return next(
            (s for s in self.styles.iter(w('style')) if s.get(w('styleId')) == style_id), None
        )


def runs(element, docx: Docx, url: str | None = None) -> list[dict]:
    """The text of a paragraph or link, as runs with their formatting"""
    found = []
    for child in element:
        if child.tag == w('hyperlink'):
            rid = child.get(f'{{{R}}}id')
            target = docx.rels[rid].get('Target') if rid else None
            found += runs(child, docx, target)
        elif child.tag == w('r'):
            rpr = child.find(w('rPr'))
            fonts = rpr.find(w('rFonts')) if rpr is not None else None
            style = {
                'bold': rpr is not None and on(rpr.find(w('b'))),
                'italic': rpr is not None and on(rpr.find(w('i'))),
                'code': fonts is not None and fonts.get(w('ascii')) == MONO_FONT,
                'url': url,
            }
            for item in child:
                if item.tag == w('t'):
                    found.append({**style, 'text': item.text or ''})
                elif item.tag == w('tab'):
                    found.append({**style, 'text': ' '})
                elif item.tag == w('noBreakHyphen'):
                    found.append({**style, 'text': '-'})
                elif item.tag == w('br') and item.get(w('type')) == 'page':
                    found.append({'page_break': True})
                elif item.tag == w('br'):
                    found.append({**style, 'text': '\n'})
                elif item.tag == w('drawing'):
                    found.append({'drawing': item})
    return found


def blocks(docx: Docx) -> list[dict]:
    """The document as headings, paragraphs, list items, pictures and page breaks"""
    found = []
    for p in docx.document.find(w('body')).iter(w('p')):
        ppr = p.find(w('pPr'))
        style = 'Normal'
        num = None
        spacing = jc = None
        if ppr is not None:
            if ppr.find(w('pStyle')) is not None:
                style = ppr.find(w('pStyle')).get(w('val'))
            numpr = ppr.find(w('numPr'))
            if numpr is not None and numpr.find(w('numId')) is not None:
                num = (numpr.find(w('numId')).get(w('val')), int(numpr.find(w('ilvl')).get(w('val'), '0')))
            spacing = ppr.find(w('spacing'))
            jc = ppr.find(w('jc'))
        parts = runs(p, docx)
        text_runs = [r for r in parts if 'text' in r]
        breaks = [i for i, r in enumerate(parts) if r.get('page_break')]
        before_break = breaks and not any('text' in r and r['text'].strip() for r in parts[: breaks[0]])
        if breaks and before_break:
            found.append({'kind': 'page_break'})
        for drawing in [r['drawing'] for r in parts if 'drawing' in r]:
            found.append(picture(drawing, docx))
        if ''.join(r['text'] for r in text_runs).strip():
            block = {
                'kind': 'item' if num and num[0] != '0' else 'paragraph',
                'style': style,
                'runs': text_runs,
                'spacing': spacing,
                'jc': jc.get(w('val')) if jc is not None else None,
            }
            if style == 'Title' or re.fullmatch(r'Heading[1-6]', style):
                block['kind'] = 'heading'
                block['level'] = 1 if style == 'Title' else int(style[-1])
            elif block['kind'] == 'paragraph' and all(r['code'] for r in text_runs if r['text'].strip()):
                # A line of a code example, which keeps its spaces
                block['kind'] = 'code'
            elif block['kind'] == 'item':
                block['num'] = num
            found.append(block)
        if breaks and not before_break:
            found.append({'kind': 'page_break'})
    return found


def picture(drawing, docx: Docx) -> dict:
    doc_pr = drawing.find(f'.//{{{WP}}}docPr')
    extent = drawing.find(f'.//{{{WP}}}extent')
    blip = drawing.find(f'.//{{{A}}}blip')
    target = docx.rels[blip.get(f'{{{R}}}embed')].get('Target')
    data = docx.parts[normpath(f'word/{target}')]
    return {
        'kind': 'picture',
        'alt': (doc_pr.get('descr') or '').strip(),
        'data': data,
        'type': 'image/png' if target.lower().endswith('.png') else 'image/jpeg',
        'width_in': int(extent.get('cx')) / 914400,
    }


def plain(block: dict) -> str:
    return ''.join(r['text'] for r in block['runs']).strip()


# The PDF, from HTML


def style_css(docx: Docx, style_id: str) -> dict[str, str]:
    """A paragraph style's look, following what it's based on, as CSS"""
    chain = []
    style = docx.style(style_id)
    while style is not None:
        chain.insert(0, style)
        based = style.find(w('basedOn'))
        style = docx.style(based.get(w('val'))) if based is not None else None
    css = {}
    for style in chain:
        ppr, rpr = style.find(w('pPr')), style.find(w('rPr'))
        if rpr is not None:
            if rpr.find(w('sz')) is not None:
                css['font-size'] = f'{int(rpr.find(w("sz")).get(w("val"))) / 2}pt'
            if rpr.find(w('color')) is not None:
                css['color'] = f'#{rpr.find(w("color")).get(w("val"))}'
            if rpr.find(w('b')) is not None:
                css['font-weight'] = 'bold' if on(rpr.find(w('b'))) else 'normal'
            if rpr.find(w('i')) is not None:
                css['font-style'] = 'italic' if on(rpr.find(w('i'))) else 'normal'
        if ppr is not None:
            css.update(spacing_css(ppr.find(w('spacing'))))
            if ppr.find(w('jc')) is not None:
                css.update(align_css(ppr.find(w('jc')).get(w('val'))))
            bottom = ppr.find(f'{w("pBdr")}/{w("bottom")}')
            if bottom is not None:
                css['border-bottom'] = (
                    f'{int(bottom.get(w("sz"))) / 8}pt solid #{bottom.get(w("color"))}'
                )
                css['padding-bottom'] = f'{int(bottom.get(w("space"), "0"))}pt'
            if ppr.find(w('keepNext')) is not None:
                css['break-after'] = 'avoid'
    return css


def spacing_css(spacing) -> dict[str, str]:
    if spacing is None:
        return {}
    css = {}
    if spacing.get(w('before')) is not None:
        css['margin-top'] = f'{int(spacing.get(w("before"))) / 20}pt'
    if spacing.get(w('after')) is not None:
        css['margin-bottom'] = f'{int(spacing.get(w("after"))) / 20}pt'
    if spacing.get(w('line')) is not None and spacing.get(w('lineRule'), 'auto') == 'auto':
        css['line-height'] = str(int(spacing.get(w('line'))) / 240)
    return css


def align_css(value: str) -> dict[str, str]:
    # Justified text leaves uneven gaps between words, which is harder to read, so it's left aligned
    return {'text-align': {'center': 'center', 'right': 'right', 'end': 'right'}.get(value, 'left')}


def css_text(css: dict[str, str]) -> str:
    return '; '.join(f'{k}: {v}' for k, v in css.items())


def inline_html(block_runs: list[dict]) -> str:
    out = ''
    for run in block_runs:
        text = escape(run['text']).replace('\n', '<br>')
        if run['code']:
            text = f'<code>{text}</code>'
        if run['italic']:
            text = f'<em>{text}</em>'
        if run['bold']:
            text = f'<strong>{text}</strong>'
        if run['url']:
            text = f'<a href="{escape(run["url"])}">{text}</a>'
        out += text
    return keep_name_together(merge_links(out))


def merge_links(html: str) -> str:
    """Links split into several runs become one link, so screen readers announce it once"""
    previous = None
    while previous != html:
        previous = html
        html = re.sub(r'<a href="([^"]*)">(.*?)</a><a href="\1">', r'<a href="\1">\2', html)
    return html


def keep_name_together(html: str) -> str:
    """My surname is never split at its hyphen"""
    return html.replace('Harrison-Nye', '<span class="nowrap">Harrison-Nye</span>')


BULLETS = {'●': 'disc', '•': 'disc', '○': 'circle', 'o': 'circle', '■': 'square', '▪': 'square'}
NUMBERS = {
    'decimal': 'decimal',
    'lowerLetter': 'lower-alpha',
    'upperLetter': 'upper-alpha',
    'lowerRoman': 'lower-roman',
    'upperRoman': 'upper-roman',
}


def list_html(items: list[dict], docx: Docx, counters: dict) -> str:
    """Nested lists, from list items in a row, keeping numbering going across interruptions"""
    out = ''
    open_lists: list[str] = []
    for item in items:
        num_id, level = item['num']
        fmt, bullet, start = docx.list_format(num_id, level)
        tag = 'ul' if fmt == 'bullet' else 'ol'
        while len(open_lists) > level + 1:
            out += f'</li></{open_lists.pop()}>'
        if len(open_lists) == level + 1:
            out += '</li>'
        while len(open_lists) < level + 1:
            marker = (
                BULLETS.get(bullet, f"'{bullet}  '") if tag == 'ul' else NUMBERS.get(fmt, 'decimal')
            )
            key = (num_id, len(open_lists))
            start_attr = f' start="{counters.get(key, start - 1) + 1}"' if tag == 'ol' else ''
            out += f'<{tag}{start_attr} style="list-style-type: {escape(marker, quote=False)}">'
            open_lists.append(tag)
        key = (num_id, level)
        counters[key] = counters.get(key, start - 1) + 1
        for deeper in [k for k in counters if k[0] == num_id and k[1] > level]:
            del counters[deeper]
        css = css_text({**spacing_css(item['spacing'])})
        out += f'<li{f" style={chr(34)}{css}{chr(34)}" if css else ""}>{inline_html(item["runs"])}'
    while open_lists:
        out += f'</li></{open_lists.pop()}>'
    return out


def document_html(docx: Docx, title: str) -> str:
    found = blocks(docx)
    style_ids = {b['style'] for b in found if 'style' in b} | {'Normal'}
    classes = '\n'.join(
        f'.s-{style_id} {{ {css_text(style_css(docx, style_id))} }}' for style_id in sorted(style_ids)
    )
    defaults = docx.styles.find(f'{w("docDefaults")}/{w("pPrDefault")}/{w("pPr")}')
    default_css = spacing_css(defaults.find(w('spacing')) if defaults is not None else None)

    body = ''
    counters: dict = {}
    pending: list[dict] = []
    code: list[str] = []
    for block in found + [{'kind': 'end'}]:
        if block['kind'] == 'code':
            code.append(escape(''.join(r['text'] for r in block['runs'])))
            continue
        if code:
            body += f'<pre><code>{chr(10).join(code)}</code></pre>\n'
            code = []
        if block['kind'] == 'item':
            pending.append(block)
            continue
        if pending:
            body += list_html(pending, docx, counters)
            pending = []
        if block['kind'] == 'heading':
            css = css_text({**spacing_css(block['spacing']), **align_css_or_empty(block['jc'])})
            body += (
                f'<h{block["level"]} class="s-{block["style"]}"{style_attr(css)}>'
                f'{inline_html(block["runs"])}</h{block["level"]}>\n'
            )
        elif block['kind'] == 'paragraph':
            css = css_text({**spacing_css(block['spacing']), **align_css_or_empty(block['jc'])})
            body += f'<p class="s-{block["style"]}"{style_attr(css)}>{inline_html(block["runs"])}</p>\n'
        elif block['kind'] == 'picture':
            data = b64encode(block['data']).decode('ascii')
            body += (
                f'<p><img src="data:{block["type"]};base64,{data}" alt="{escape(block["alt"])}" '
                f'style="width: {block["width_in"]:.2f}in; max-width: 100%"></p>\n'
            )
        elif block['kind'] == 'page_break':
            body += '<div class="page-break"></div>\n'

    return f'''<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<title>{escape(title)}</title>
<meta name="author" content="{NAME}">
<style>
body {{ margin: 0; font-family: '{FONT}', sans-serif; font-size: 12pt; color: #000; {css_text({'line-height': '1.5', **default_css})} }}
p, li, h1, h2, h3, h4, h5, h6 {{ margin: 0 0 {default_css.get('margin-bottom', '0')}; font-weight: normal; }}
h1, h2, h3, h4, h5, h6 {{ line-height: 1.2; break-after: avoid; break-inside: avoid; }}
ul, ol {{ margin: 0 0 {default_css.get('margin-bottom', '0')}; padding-left: 0.5in; }}
li ul, li ol {{ margin: 0; }}
li::marker {{ font-family: '{FONT}', sans-serif; }}
a {{ color: {LINK}; text-decoration: underline; }}
code {{ font-family: '{MONO_FONT}', monospace; font-size: 1em; }}
pre {{ margin: 0 0 {default_css.get('margin-bottom', '0')}; white-space: pre-wrap; line-height: 1.5; }}
img {{ height: auto; }}
.nowrap {{ white-space: nowrap; }}
.page-break {{ break-after: page; }}
{classes}
</style>
</head>
<body>
<main>
{body}</main>
</body>
</html>
'''


def align_css_or_empty(value: str | None) -> dict[str, str]:
    return align_css(value) if value else {}


def style_attr(css: str) -> str:
    return f' style="{css}"' if css else ''


def footer_template(site_link: bool) -> str:
    """
    Like the Word file's footer: my name on the left, then my site's address if the Word file has
    it, and the page number on the right. The browser can't make links in footers, so the address
    is written out in full
    """
    site = (
        f' · <span style="color: {LINK}; text-decoration: underline">{SITE_DISPLAY}</span>'
        if site_link
        else ''
    )
    return (
        f'<div style="width: 100%; margin: 0 1in 0.45in; display: flex; justify-content: space-between; '
        f"font-family: '{FONT}', sans-serif; font-size: 10pt; color: {FOOTER};\">"
        f'<span>Inclusion Toolkit by Abi <span style="white-space: nowrap">Harrison-Nye</span>{site}</span>'
        '<span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>'
    )


# The visual summary's PDF, drawn from the PowerPoint file


P = 'http://schemas.openxmlformats.org/presentationml/2006/main'
EMU_PER_INCH = 914400
DECORATIVE = '{http://schemas.microsoft.com/office/drawing/2017/decorative}decorative'


def a(tag: str) -> str:
    return f'{{{A}}}{tag}'


def p(tag: str) -> str:
    return f'{{{P}}}{tag}'


def inches(emu: int | str) -> str:
    return f'{int(emu) / EMU_PER_INCH:.4f}in'


class Pptx:
    """The parts of a PowerPoint file needed to draw its slides: each slide, with its layout and master"""

    def __init__(self, path: Path):
        self.zip = zipfile.ZipFile(path)
        presentation = self.xml('ppt/presentation.xml')
        size = presentation.find(p('sldSz'))
        self.width, self.height = int(size.get('cx')), int(size.get('cy'))
        rels = self.rels('ppt/presentation.xml')
        self.slides = [
            rels[slide.get(f'{{{R}}}id')]
            for slide in presentation.find(p('sldIdLst')).findall(p('sldId'))
        ]

    def xml(self, part: str):
        return ET.fromstring(self.zip.read(part))

    def rels(self, part: str) -> dict[str, str]:
        """Each relationship of a part, by its id, as the part or address it points to"""
        folder, name = part.rsplit('/', 1)
        rels_part = f'{folder}/_rels/{name}.rels'
        if rels_part not in self.zip.namelist():
            return {}
        found = {}
        for rel in ET.fromstring(self.zip.read(rels_part)).iter(f'{{{REL}}}Relationship'):
            target = rel.get('Target')
            found[rel.get('Id')] = (
                target if rel.get('TargetMode') == 'External' else normpath(f'{folder}/{target}')
            )
        return found

    def related(self, part: str, kind: str) -> str:
        return next(target for target in self.rels(part).values() if f'/{kind}' in target)


class SlideContext:
    """What a slide's shapes need to look things up: its colours, and the files its part links to"""

    def __init__(self, pptx: Pptx, part: str, colours: dict[str, str]):
        self.pptx = pptx
        self.part = part
        self.rels = pptx.rels(part)
        self.colours = colours


def theme_colours(pptx: Pptx, master_part: str) -> dict[str, str]:
    """The theme's colours, by every name a shape can use for them, such as dk1 and tx1"""
    master = pptx.xml(master_part)
    theme = pptx.xml(pptx.related(master_part, 'theme'))
    scheme = theme.find(f'.//{a("clrScheme")}')
    colours = {}
    for slot in scheme:
        value = slot.find(a('srgbClr'))
        if value is None:
            value = slot.find(a('sysClr'))
            colours[slot.tag.split('}')[1]] = (value.get('lastClr') or '000000') if value is not None else '000000'
        else:
            colours[slot.tag.split('}')[1]] = value.get('val')
    mapping = master.find(p('clrMap'))
    for name, slot in (mapping.attrib.items() if mapping is not None else ()):
        colours.setdefault(name, colours.get(slot, '000000'))
    return colours


def colour(fill, context: SlideContext) -> str | None:
    """The colour of a solidFill, highlight or similar, as #RRGGBB"""
    if fill is None:
        return None
    value = fill.find(a('srgbClr'))
    if value is not None:
        return f'#{value.get("val")}'
    value = fill.find(a('schemeClr'))
    if value is not None:
        return f'#{context.colours.get(value.get("val"), "000000")}'
    return None


def background(pptx: Pptx, parts: list[str], contexts: list[SlideContext]) -> str:
    """The slide's background colour, from the slide, then its layout, then its master"""
    for part, context in zip(parts, contexts):
        fill = pptx.xml(part).find(f'{p("cSld")}/{p("bg")}/{p("bgPr")}/{a("solidFill")}')
        if fill is not None:
            return colour(fill, context) or '#FFFFFF'
    return '#FFFFFF'


def is_placeholder(shape) -> bool:
    return shape.find(f'.//{p("nvPr")}/{p("ph")}') is not None


def shape_name(shape) -> str:
    props = shape.find(f'.//{p("cNvPr")}')
    return props.get('name', '') if props is not None else ''


def box_css(shape) -> dict[str, str]:
    xfrm = shape.find(f'.//{a("xfrm")}')
    offset, extent = xfrm.find(a('off')), xfrm.find(a('ext'))
    return {
        'left': inches(offset.get('x')),
        'top': inches(offset.get('y')),
        'width': inches(extent.get('cx')),
        'height': inches(extent.get('cy')),
    }


def shape_css(shape, context: SlideContext) -> dict[str, str]:
    """Where the shape is, and its fill, outline and rounded corners"""
    css = box_css(shape)
    props = shape.find(p('spPr'))
    geometry = props.find(a('prstGeom')) if props is not None else None
    if geometry is not None and geometry.get('prst') == 'roundRect':
        guide = geometry.find(f'{a("avLst")}/{a("gd")}')
        adjust = int(guide.get('fmla').split()[1]) if guide is not None else 16667
        extent = shape.find(f'.//{a("xfrm")}/{a("ext")}')
        shortest = min(int(extent.get('cx')), int(extent.get('cy')))
        css['border-radius'] = inches(shortest * adjust / 100000)
    fill = props.find(a('solidFill')) if props is not None else None
    if fill is not None:
        css['background'] = colour(fill, context)
    line = props.find(a('ln')) if props is not None else None
    if line is not None and line.find(a('solidFill')) is not None:
        width = int(line.get('w', '12700'))
        css['outline'] = f'{inches(width)} solid {colour(line.find(a("solidFill")), context)}'
        css['outline-offset'] = f'-{inches(width / 2)}'
    return css


def run_html(run, context: SlideContext) -> str:
    """A run of text, with its own font, size, weight and colour, and its link if it has one"""
    if run.tag == a('br'):
        return '<br>'
    props = run.find(a('rPr'))
    text = escape(run.findtext(a('t')) or '')
    if props is None:
        return text
    css = {}
    if props.get('sz'):
        css['font-size'] = f'{int(props.get("sz")) / 100:g}pt'
    if props.get('b') == '1':
        css['font-weight'] = 'bold'
    if props.get('i') == '1':
        css['font-style'] = 'italic'
    if props.get('u') and props.get('u') != 'none':
        css['text-decoration'] = 'underline'
    fill = colour(props.find(a('solidFill')), context)
    if fill:
        css['color'] = fill
    highlight = colour(props.find(a('highlight')), context)
    if highlight:
        css['background'] = highlight
    latin = props.find(a('latin'))
    is_code = latin is not None and latin.get('typeface') == MONO_FONT
    if latin is not None:
        css['font-family'] = f"'{latin.get('typeface')}', {'monospace' if is_code else 'sans-serif'}"
    html = f'<span style="{css_text(css)}">{text}</span>' if css else text
    if is_code:
        html = f'<code>{html}</code>'
    link = props.find(a('hlinkClick'))
    if link is not None and link.get(f'{{{R}}}id') in context.rels:
        html = f'<a href="{escape(context.rels[link.get(f"{{{R}}}id")])}">{html}</a>'
    return html


def paragraph_css(paragraph) -> dict[str, str]:
    props = paragraph.find(a('pPr'))
    css: dict[str, str] = {}
    if props is None:
        return css
    css.update(align_css({'l': 'left', 'ctr': 'center', 'r': 'right', 'just': 'both'}.get(props.get('algn', 'l'), 'left')))
    if props.get('marR'):
        css['padding-right'] = inches(props.get('marR'))
    spacing = props.find(f'{a("lnSpc")}/{a("spcPts")}')
    if spacing is not None:
        css['line-height'] = f'{int(spacing.get("val")) / 100:g}pt'
    percent = props.find(f'{a("lnSpc")}/{a("spcPct")}')
    if percent is not None:
        css['line-height'] = f'{int(percent.get("val")) / 100000:g}'
    before = props.find(f'{a("spcBef")}/{a("spcPts")}')
    if before is not None and int(before.get('val')):
        css['margin-top'] = f'{int(before.get("val")) / 100:g}pt'
    after = props.find(f'{a("spcAft")}/{a("spcPts")}')
    if after is not None and int(after.get('val')):
        css['margin-bottom'] = f'{int(after.get("val")) / 100:g}pt'
    return css


def bullet(paragraph) -> str | None:
    props = paragraph.find(a('pPr'))
    char = props.find(a('buChar')) if props is not None else None
    return char.get('char') if char is not None else None


def text_html(shape, context: SlideContext, heading: int | None) -> str:
    """
    The shape's text, as the right kind of element, so the PDF's tags match what it is: headings,
    lists for bullet points, and code examples kept line by line
    """
    paragraphs = shape.findall(f'{p("txBody")}/{a("p")}')
    runs_of = [[r for r in paragraph if r.tag in (a('r'), a('br'))] for paragraph in paragraphs]
    if not any(r.tag == a('r') and (r.findtext(a('t')) or '').strip() for runs in runs_of for r in runs):
        return ''

    fonts = {
        latin.get('typeface')
        for runs in runs_of
        for r in runs
        if r.tag == a('r') and (latin := r.find(f'{a("rPr")}/{a("latin")}')) is not None
    }
    if fonts == {MONO_FONT}:
        lines = [''.join(escape(r.findtext(a('t')) or '') for r in runs if r.tag == a('r')) for runs in runs_of]
        first = next(r for runs in runs_of for r in runs if r.tag == a('r'))
        css = paragraph_css(paragraphs[0])
        size = first.find(a('rPr')).get('sz')
        colour_css = colour(first.find(f'{a("rPr")}/{a("solidFill")}'), context)
        style = {
            'margin': '0',
            'white-space': 'pre-wrap',
            'font-family': f"'{MONO_FONT}', monospace",
            **({'font-size': f'{int(size) / 100:g}pt'} if size else {}),
            **({'color': colour_css} if colour_css else {}),
            **({'line-height': css['line-height']} if 'line-height' in css else {}),
        }
        return f'<pre style="{css_text(style)}"><code>{chr(10).join(lines)}</code></pre>'

    html = ''
    items: list[str] = []
    item_css: dict[str, str] = {}
    for paragraph, runs in zip(paragraphs + [None], runs_of + [None]):
        char = bullet(paragraph) if paragraph is not None else None
        if items and char is None:
            html += f'<ul style="{css_text(item_css)}">{"".join(items)}</ul>'
            items = []
        if paragraph is None:
            break
        inner = ''.join(run_html(r, context) for r in runs)
        css = paragraph_css(paragraph)
        if char is not None:
            props = paragraph.find(a('pPr'))
            item_css = {'padding-left': inches(props.get('marL', '0')), 'list-style-type': f'"{char}\\2002"'}
            items.append(f'<li style="{css_text(css)}">{inner}</li>')
            continue
        if not inner.strip():
            html += f'<p aria-hidden="true" style="{css_text(css)}">&nbsp;</p>' if html else ''
            continue
        props = paragraph.find(a('pPr'))
        if props is not None and props.get('marL') and int(props.get('marL')):
            css['padding-left'] = inches(props.get('marL'))
        tag = f'h{heading}' if heading else 'p'
        html += f'<{tag} style="{css_text(css)}">{inner}</{tag}>'
    return html


def body_css(shape) -> dict[str, str]:
    """The space inside a text box, and where its text sits: top, middle or bottom"""
    body = shape.find(f'{p("txBody")}/{a("bodyPr")}')
    if body is None:
        return {}
    css = {
        'padding': ' '.join(
            inches(body.get(side, default))
            for side, default in (('tIns', 45720), ('rIns', 91440), ('bIns', 45720), ('lIns', 91440))
        ),
        'display': 'flex',
        'flex-direction': 'column',
        'justify-content': {'t': 'flex-start', 'ctr': 'center', 'b': 'flex-end'}.get(
            body.get('anchor', 't'), 'flex-start'
        ),
    }
    if body.get('wrap') == 'none':
        css['white-space'] = 'nowrap'
    return css


def picture_html(picture, context: SlideContext) -> str:
    """A picture, with its alt text, or marked as decorative so screen readers skip it"""
    props = picture.find(f'.//{p("cNvPr")}')
    decorative = any(e.get('val') == '1' for e in props.iter(DECORATIVE))
    alt = '' if decorative else props.get('descr', '')
    blip = picture.find(f'.//{a("blip")}')
    part = context.rels[blip.get(f'{{{R}}}embed')]
    data = b64encode(context.pptx.zip.read(part)).decode('ascii')
    kind = 'image/png' if part.lower().endswith('.png') else 'image/jpeg'
    crop = picture.find(f'.//{a("srcRect")}')
    sides = {side: int(crop.get(side, 0)) / 100000 if crop is not None else 0 for side in 'ltrb'}
    width = 100 / (1 - sides['l'] - sides['r'])
    height = 100 / (1 - sides['t'] - sides['b'])
    image = (
        f'<img src="data:{kind};base64,{data}" alt="{escape(alt)}" style="position: absolute; '
        f'width: {width:.3f}%; height: {height:.3f}%; left: -{sides["l"] * width:.3f}%; '
        f'top: -{sides["t"] * height:.3f}%">'
    )
    return f'<div class="shape" style="{css_text({**box_css(picture), "overflow": "hidden"})}">{image}</div>'


def shapes_html(shapes, context: SlideContext, title_level: int) -> tuple[str, str]:
    """
    The shapes, in the order they're drawn. The text is given in reading order: the title first,
    then each box's heading and text. Shapes with no text are only drawn
    """
    drawn, text = '', ''
    for shape in shapes:
        if shape.tag == p('pic'):
            drawn += picture_html(shape, context)
            continue
        if shape.tag != p('sp'):
            continue
        placeholder = shape.find(f'.//{p("nvPr")}/{p("ph")}')
        is_title = placeholder is not None and placeholder.get('type') in ('title', 'ctrTitle')
        heading = title_level if is_title else (title_level + 1 if shape_name(shape).endswith(' heading') else None)
        inner = text_html(shape, context, heading)
        css = {**shape_css(shape, context), **body_css(shape)}
        if inner:
            text += f'<div class="shape" style="{css_text(css)}">{inner}</div>'
        else:
            drawn += f'<div class="shape" aria-hidden="true" style="{css_text(css)}"></div>'
    return drawn, text


def slides_html(path: Path, title: str) -> str:
    """
    Every slide of a PowerPoint file as a page, drawn to look like PowerPoint shows it. Each
    slide's title is a level 1 heading, and the headings in its boxes are level 2
    """
    pptx = Pptx(path)
    pages = ''
    for slide_part in pptx.slides:
        layout_part = pptx.related(slide_part, 'slideLayout')
        master_part = pptx.related(layout_part, 'slideMaster')
        colours = theme_colours(pptx, master_part)
        parts = [slide_part, layout_part, master_part]
        contexts = [SlideContext(pptx, part, colours) for part in parts]
        layout = pptx.xml(layout_part)

        drawn, text, last = '', '', ''
        # The master's and layout's own shapes, such as the logo, title box and my name, but not
        # their empty placeholders, which the slide fills in
        for part, context in zip(reversed(parts), reversed(contexts)):
            if part == master_part and layout.get('showMasterSp') == '0':
                continue
            if part == slide_part:
                continue
            tree = pptx.xml(part).find(f'{p("cSld")}/{p("spTree")}')
            shapes = [s for s in tree if not is_placeholder(s)]
            part_drawn, part_text = shapes_html(shapes, context, 1)
            drawn += part_drawn
            last += part_text
        tree = pptx.xml(slide_part).find(f'{p("cSld")}/{p("spTree")}')
        slide_drawn, slide_text = shapes_html(list(tree), contexts[0], 1)
        drawn += slide_drawn
        text += slide_text
        pages += (
            f'<section class="slide" style="background: {background(pptx, parts, contexts)}">'
            f'{drawn}{text}{last}</section>\n'
        )

    return f'''<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<title>{escape(title)}</title>
<meta name="author" content="{NAME}">
<style>
@page {{ size: {inches(pptx.width)} {inches(pptx.height)}; margin: 0; }}
body {{ margin: 0; font-family: '{FONT}', sans-serif; color: #000; }}
.slide {{ position: relative; width: {inches(pptx.width)}; height: {inches(pptx.height)}; overflow: hidden; break-after: page; }}
.shape {{ position: absolute; box-sizing: border-box; }}
h1, h2, p, ul, li, pre {{ margin: 0; font-size: inherit; font-weight: inherit; }}
ul {{ padding: 0; }}
a {{ color: inherit; }}
code {{ font-family: '{MONO_FONT}', monospace; font-size: 1em; }}
</style>
</head>
<body>
<main>
{pages}</main>
</body>
</html>
'''


def pptx_title(path: Path) -> str:
    """The title in a PowerPoint file's details, which rebrand.py sets"""
    with zipfile.ZipFile(path) as z:
        core = ET.fromstring(z.read('docProps/core.xml'))
    return (core.findtext(f'{{{DC}}}title') or path.stem).strip()


def infographic_markdown(path: Path) -> str:
    """
    The text of an infographic, for its page: each box's heading and points, then the note. A file
    with every infographic in it has each one's title as a heading, with its boxes under it, and
    the note once, at the end
    """
    pptx = Pptx(path)
    several = len(pptx.slides) > 1
    level = '####' if several else '###'
    out: list[str] = []
    note = ''
    for slide_part in pptx.slides:
        tree = pptx.xml(slide_part).find(f'{p("cSld")}/{p("spTree")}')
        for shape in tree.findall(p('sp')):
            name = shape_name(shape)
            paragraphs = [
                (
                    escape_markdown(''.join(t.text or '' for t in paragraph.iter(a('t')))).strip(),
                    bullet(paragraph) is not None,
                )
                for paragraph in shape.findall(f'{p("txBody")}/{a("p")}')
            ]
            paragraphs = [(text, is_bullet) for text, is_bullet in paragraphs if text]
            if not paragraphs:
                continue
            if name == 'Title':
                if several:
                    out.append(f'### {paragraphs[0][0]}')
            elif name.endswith(' heading'):
                out.append(f'{level} {paragraphs[0][0]}')
            elif name == 'Note':
                note = ' '.join(text for text, _ in paragraphs)
            elif name.endswith(' text'):
                out.append('\n'.join(f'- {text}' if is_bullet else text for text, is_bullet in paragraphs))
    if note:
        out.append(note)
    return '\n\n'.join(out) + '\n'


# Finishing the PDFs


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


def finish_pdf(path: Path, title: str, html: str = '') -> None:
    """
    Adds what the browser leaves out: showing the title, rather than the file name, in the
    window, and the author. It also puts back the spaces the browser drops from a bookmark when
    its heading wraps onto 2 lines, such as "What is itfor?". It's added as an update at the
    end, so nothing else in the file moves
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
    changed: list[tuple[int, bytes]] = []
    # Newer versions of the browser add this themselves
    if b'/DisplayDocTitle' not in catalog:
        changed.append((root, catalog[:-2] + b' /ViewerPreferences << /DisplayDocTitle true >> >>'))

    headings = {heading.replace(' ', ''): heading for heading in heading_texts(html)}
    for match in re.finditer(rb'\n(\d+) 0 obj\s*(<</Title \(((?:\\.|[^\\)])*)\)(.*?)>>)\s*endobj', data, re.S):
        if b'/Parent' not in match.group(4):
            continue
        shown = literal_text(match.group(3))
        heading = headings.get(shown.replace(' ', ''))
        if heading and heading != shown:
            changed.append((int(match.group(1)), b'<</Title ' + pdf_text(heading) + match.group(4) + b'>>'))

    info = (
        b'<< /Title ' + pdf_text(title) + b' /Author ' + pdf_text(NAME)
        + b' /Subject ' + pdf_text('Inclusion Toolkit') + b' >>'
    )
    changed.append((size, info))
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
        % (size + 1, root, size, previous, xref)
    )
    path.write_bytes(data + update)


# The site's text, as Markdown


def escape_markdown(text: str) -> str:
    text = re.sub(r'([\\`*_\[\]<>])', r'\\\1', text)
    return text


def inline_markdown(block_runs: list[dict]) -> str:
    # Joins runs with the same formatting first, so formatting marks aren't repeated
    merged: list[dict] = []
    for run in block_runs:
        key = (run['bold'], run['italic'], run['code'], run['url'])
        if merged and merged[-1]['key'] == key:
            merged[-1]['text'] += run['text']
        else:
            merged.append({'key': key, 'text': run['text']})

    out = ''
    for run in merged:
        bold, italic, code, url = run['key']
        text = run['text']
        lead = text[: len(text) - len(text.lstrip(' '))]
        trail = text[len(text.rstrip(' ')) :]
        core = text.strip(' ')
        if not core:
            out += text if not url else ''
            continue
        if code:
            ticks = '``' if '`' in core else '`'
            core = f'{ticks}{core}{ticks}'
        else:
            core = escape_markdown(core).replace('\n', '\\\n')
        if italic:
            core = f'_{core}_'
        if bold:
            core = f'**{core}**'
        if url:
            core = f'[{core}](<{url}>)' if re.search(r'[\s()]', url) else f'[{core}]({url})'
        out += lead + core + trail
    out = out.strip()
    # A line starting with these would become a heading or list in Markdown
    return re.sub(r'^(#|[-+] |\d+\. )', r'\\\1', out)


def document_markdown(docx: Docx, title: str) -> str:
    lines: list[str] = []
    counters: dict = {}
    previous = None
    for block in blocks(docx):
        if block['kind'] == 'heading':
            if block['level'] == 1 and plain(block) == title:
                continue
            level = max(block['level'], 2) + 1
            lines += ['', f'{"#" * level} {inline_markdown(block["runs"])}', '']
        elif block['kind'] == 'paragraph':
            lines += ['', inline_markdown(block['runs']), '']
        elif block['kind'] == 'code':
            line = ''.join(r['text'] for r in block['runs'])
            if previous == 'code':
                lines.insert(len(lines) - 1, line)
            else:
                lines += ['', '```', line, '```', '']
                lines.pop()
        elif block['kind'] == 'picture':
            alt = block['alt'] or '[check: describe this picture]'
            lines += ['', f'_Picture: {escape_markdown(alt)}_', '']
        elif block['kind'] == 'item':
            num_id, level = block['num']
            fmt, _, start = docx.list_format(num_id, level)
            if previous != 'item':
                lines.append('')
            key = (num_id, level)
            counters[key] = counters.get(key, start - 1) + 1
            marker = '-' if fmt == 'bullet' else f'{counters[key]}.'
            lines.append(f'{"   " * level}{marker} {inline_markdown(block["runs"])}')
        previous = block['kind']
    text = '\n'.join(lines)
    return re.sub(r'\n{3,}', '\n\n', text).strip() + '\n'


# Putting it all together


def first_sentence(docx: Docx) -> str:
    """A draft description: the first sentence after the first heading under the title"""
    found = blocks(docx)
    for index, block in enumerate(found):
        if block['kind'] == 'heading' and block['level'] > 1:
            for after in found[index + 1 :]:
                if after['kind'] in ('paragraph', 'item'):
                    sentence = re.split(r'(?<=[.!?])\s', plain(after), maxsplit=1)[0]
                    return sentence if sentence.endswith(('.', '!', '?')) else f'{sentence}.'
    return f'About {docx.title}.'


def find_folder(record: dict, slugs: list[str]) -> dict:
    for slug in slugs:
        record = next(folder for folder in record['folders'] if folder['slug'] == slug)
    return record


def same_content(new: Path, old: Path) -> bool:
    """
    Whether 2 files have the same content, ignoring when they were made. Word and PowerPoint files
    store the time in their zip, and PDFs in their details, so every run would otherwise change
    every file, and they'd all need committing again
    """
    if not old.exists():
        return False
    if new.suffix in ('.docx', '.pptx'):
        with zipfile.ZipFile(new) as a, zipfile.ZipFile(old) as b:
            return a.namelist() == b.namelist() and all(a.read(n) == b.read(n) for n in a.namelist())
    if new.suffix == '.pdf':

        def without_dates(data: bytes) -> bytes:
            data = re.sub(rb'/(?:CreationDate|ModDate) \([^)]*\)', b'', data)
            # The cross-reference table and the update's offsets move with the dates' length
            return re.sub(rb'\d{10} \d{5} [nf] |startxref\s+\d+|/Prev \d+', b'', data)

        return without_dates(new.read_bytes()) == without_dates(old.read_bytes())
    return new.read_bytes() == old.read_bytes()


def main() -> None:
    sources = sorted(BRANDED.glob('**/*.docx'))
    sources = [s for s in sources if 'test' not in s.relative_to(BRANDED).parts]
    if not sources:
        sys.exit('There are no Word files in toolkit-sources/branded/. Run rebrand.py first.')

    jobs = []
    documents = {}
    # Each PDF to finish, with its title and the page it was made from
    finishing: list[tuple[Path, str, Path]] = []
    for source in sources:
        relative = source.relative_to(BRANDED).with_suffix('')
        docx = Docx(source)
        documents[relative] = docx
        html_path = BUILD / relative.with_suffix('.html')
        html_path.parent.mkdir(parents=True, exist_ok=True)
        html_path.write_text(document_html(docx, docx.title), encoding='utf-8')
        jobs.append(
            {
                'html': str(html_path),
                'pdf': str(source.with_suffix('.pdf')),
                'footer': footer_template(docx.footer_has_site),
            }
        )
        finishing.append((source.with_suffix('.pdf'), docx.title, html_path))

        slides = source.with_suffix('.pptx')
        if slides.exists():
            summary_title = f'{docx.title}: {SUMMARY.capitalize()}'
            slides_html_path = BUILD / f'{relative}{SUMMARY_SUFFIX}.html'
            slides_html_path.write_text(slides_html(slides, summary_title), encoding='utf-8')
            slides_pdf = BRANDED / f'{relative}{SUMMARY_SUFFIX}.pdf'
            jobs.append({'html': str(slides_html_path), 'pdf': str(slides_pdf), 'slides': True})
            finishing.append((slides_pdf, summary_title, slides_html_path))

    # Infographics have no Word file, so their PDF and page text come from the PowerPoint file
    infographics = {}
    for source in sorted((BRANDED / 'infographics').glob('**/*.pptx')):
        relative = source.relative_to(BRANDED).with_suffix('')
        title = pptx_title(source)
        infographics[relative] = (source, title)
        html_path = BUILD / relative.with_suffix('.html')
        html_path.parent.mkdir(parents=True, exist_ok=True)
        html_path.write_text(slides_html(source, title), encoding='utf-8')
        jobs.append({'html': str(html_path), 'pdf': str(source.with_suffix('.pdf')), 'slides': True})
        finishing.append((source.with_suffix('.pdf'), title, html_path))

    jobs_file = BUILD / 'jobs.json'
    jobs_file.write_text(json.dumps({'jobs': jobs}), encoding='utf-8')
    subprocess.run(['node', str(ROOT / 'pdf.mjs'), str(jobs_file)], check=True, cwd=REPO)
    for pdf, title, html_path in finishing:
        finish_pdf(pdf, title, html_path.read_text(encoding='utf-8'))

    record = json.loads(RECORD.read_text(encoding='utf-8'))
    for relative, docx in documents.items():
        site = site_path(relative)
        *folders, slug = site.parts
        # The full guide keeps the Word file's name. The visual summary's files have
        # -visual-summary added, as src/content/toolkit.ts expects
        files = {
            BRANDED / relative.with_suffix('.docx'): f'{site}.docx',
            BRANDED / relative.with_suffix('.pdf'): f'{site}.pdf',
            BRANDED / relative.with_suffix('.pptx'): f'{site}{SUMMARY_SUFFIX}.pptx',
            BRANDED / f'{relative}{SUMMARY_SUFFIX}.pdf': f'{site}{SUMMARY_SUFFIX}.pdf',
        }
        files = {source: name for source, name in files.items() if source.exists()}
        for file, name in files.items():
            public = PUBLIC / FILES / name
            public.parent.mkdir(parents=True, exist_ok=True)
            if not same_content(file, public):
                shutil.copyfile(file, public)
        slides = BRANDED / relative.with_suffix('.pptx') in files

        text_file = TEXT / site.with_suffix('.md')
        if not text_file.exists():
            text_file.parent.mkdir(parents=True, exist_ok=True)
            text_file.write_text(document_markdown(docx, docx.title), encoding='utf-8')
            print(f'Drafted {text_file.relative_to(REPO)}')

        folder = find_folder(record, folders)
        item = next((i for i in folder['items'] if i['slug'] == slug), None)
        if item is None:
            known = DETAILS.get(slug, {})
            todo = [
                'Check the text drafted for its page',
                'Check the Word file, PDF and slides' if slides else 'Check the Word file and PDF',
            ]
            if 'description' not in known:
                todo.insert(0, 'Check the description')
            if 'updated' not in known:
                todo.insert(0, 'Check the last updated date')
            item = {
                'slug': slug,
                'title': docx.title,
                'description': known.get('description')
                or known.get('draft_description')
                or first_sentence(docx),
                'updated': known.get('updated', HIGHLIGHTS_UPDATED),
                'slides': slides,
                'text': 'draft',
                'todo': todo,
            }
            folder['items'].insert(0 if known.get('first') else len(folder['items']), item)
        item['slides'] = slides
        print(f'Exported {relative.as_posix()}: {", ".join(Path(n).name for n in files.values())}')

    for relative, (source, title) in infographics.items():
        site = site_path(relative)
        *folders, slug = site.parts
        for suffix in ('.pptx', '.pdf'):
            public = PUBLIC / FILES / site.with_suffix(suffix)
            public.parent.mkdir(parents=True, exist_ok=True)
            if not same_content(source.with_suffix(suffix), public):
                shutil.copyfile(source.with_suffix(suffix), public)

        text_file = TEXT / site.with_suffix('.md')
        if not text_file.exists():
            text_file.parent.mkdir(parents=True, exist_ok=True)
            text_file.write_text(infographic_markdown(source), encoding='utf-8')
            print(f'Drafted {text_file.relative_to(REPO)}')

        folder = find_folder(record, folders)
        item = next((i for i in folder['items'] if i['slug'] == slug), None)
        if item is None:
            known = DETAILS.get(slug, {})
            item = {
                'slug': slug,
                'title': title,
                'description': known.get('draft_description') or f'An infographic about {title}.',
                'updated': INFOGRAPHICS_UPDATED,
                'slides': False,
                'infographic': True,
                'text': 'draft',
                'todo': [
                    'Check the description',
                    'Check the text drafted for its page',
                    'Check the PowerPoint file and PDF',
                ],
            }
            folder['items'].insert(0 if known.get('first') else len(folder['items']), item)
        print(f'Exported {relative.as_posix()}: {slug}.pptx, {slug}.pdf')

    RECORD.write_text(json.dumps(record, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Updated {RECORD.relative_to(REPO)}. Run `pnpm exec prettier --write src/content/toolkit` next.')


if __name__ == '__main__':
    main()
