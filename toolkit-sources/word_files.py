"""Reads Word files and turns them into HTML for the PDF and Markdown for the site."""

import re
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

SITE_DISPLAY = 'InclusionToolkit.org'
LINK = '#1C4882'
FOOTER = '#3A4A5E'

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'


def w(tag: str) -> str:
    return f'{{{W}}}{tag}'


def on(element) -> bool:
    """Whether a setting such as <w:b/> is on. <w:b w:val="0"/> turns it off"""
    return element is not None and element.get(w('val'), '1') not in ('0', 'false')


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

    def list_format(self, num_id: str, level: int) -> tuple[str, str, int]:
        """A list level's format, such as bullet or decimal, with its bullet and start number"""
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


def keep_name_together(html: str) -> str:
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


# The same as the Word files' margins, so lines are under 80 characters (WCAG 1.4.8)
SIDE_MARGIN = '1.45in'


def footer_template() -> str:
    """
    Like the Word file's footer. The browser can't make links in footers, so the address is in the
    footer's colour, not the link colour
    """
    return (
        f'<div style="width: 100%; margin: 0 {SIDE_MARGIN} 0.45in; display: flex; justify-content: space-between; '
        f"font-family: '{FONT}', sans-serif; font-size: 10pt; color: {FOOTER};\">"
        f'<span>Inclusion Toolkit · {SITE_DISPLAY}</span>'
        '<span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>'
    )


# The site's text, as Markdown


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
