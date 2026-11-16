"""Reads PowerPoint files and turns them into HTML for the PDF and Markdown for the site."""

import sys
import zipfile
import xml.etree.ElementTree as ET
from base64 import b64encode
from html import escape
from pathlib import Path
from posixpath import normpath

sys.path.insert(0, str(Path(__file__).resolve().parent))

from shared import (
    A,
    DC,
    FONT,
    MONO_FONT,
    NAME,
    R,
    REL,
    align_css,
    css_text,
    escape_markdown,
    merge_links,
)

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
    """The parts of a PowerPoint file needed to draw its slides"""

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
    """The shape's text as headings, lists or code, so the PDF's tags match what it is"""
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
        inner = merge_links(''.join(run_html(r, context) for r in runs))
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


def is_decorative(props) -> bool:
    return any(e.get('val') == '1' for e in props.iter(DECORATIVE))


def picture_html(picture, context: SlideContext) -> str:
    """A picture, with its alt text, or marked as decorative so screen readers skip it"""
    props = picture.find(f'.//{p("cNvPr")}')
    alt = '' if is_decorative(props) else props.get('descr', '')
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


def has_alt_text(picture) -> bool:
    props = picture.find(f'.//{p("cNvPr")}')
    return not is_decorative(props) and bool(props.get('descr'))


def shapes_html(shapes, context: SlideContext, title_level: int) -> tuple[str, str]:
    """
    Returns the shapes that are only drawn, then the text in reading order: the title, then each
    box's text, with pictures that have alt text (WCAG 1.3.2)
    """
    drawn, title, text = '', '', ''
    for shape in shapes:
        if shape.tag == p('pic'):
            if has_alt_text(shape):
                text += picture_html(shape, context)
            else:
                drawn += picture_html(shape, context)
            continue
        if shape.tag != p('sp'):
            continue
        placeholder = shape.find(f'.//{p("nvPr")}/{p("ph")}')
        is_title = placeholder is not None and placeholder.get('type') in ('title', 'ctrTitle')
        heading = title_level if is_title else (title_level + 1 if shape_name(shape).endswith(' heading') else None)
        inner = text_html(shape, context, heading)
        css = {**shape_css(shape, context), **body_css(shape)}
        if inner and is_title:
            title += f'<div class="shape" style="{css_text(css)}">{inner}</div>'
        elif inner:
            text += f'<div class="shape" style="{css_text(css)}">{inner}</div>'
        else:
            drawn += f'<div class="shape" aria-hidden="true" style="{css_text(css)}"></div>'
    return drawn, title + text


def slides_html(path: Path, title: str) -> str:
    """Each slide as a page, drawn to look like PowerPoint shows it"""
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
        # The master's and layout's own shapes, such as the logo, but not their empty placeholders,
        # which the slide fills in
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
    Each box's heading and points, then the note. A file with every infographic has each one's
    title as a heading, and the note once, at the end
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
