"""Constants and small helpers that more than one of the export modules use."""

import re

NAME = 'Abi Harrison-Nye'
FONT = 'Atkinson Hyperlegible Next'
MONO_FONT = 'Atkinson Hyperlegible Mono'

R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
DC = 'http://purl.org/dc/elements/1.1/'
REL = 'http://schemas.openxmlformats.org/package/2006/relationships'


def align_css(value: str) -> dict[str, str]:
    # Justified text leaves uneven gaps between words, which is harder to read, so it's left aligned
    return {'text-align': {'center': 'center', 'right': 'right', 'end': 'right'}.get(value, 'left')}


def css_text(css: dict[str, str]) -> str:
    return '; '.join(f'{k}: {v}' for k, v in css.items())


def merge_links(html: str) -> str:
    """Links split into several runs become one link, so screen readers announce it once"""
    previous = None
    while previous != html:
        previous = html
        html = re.sub(r'<a href="([^"]*)">(.*?)</a><a href="\1">', r'<a href="\1">\2', html)
    return html


def escape_markdown(text: str) -> str:
    return re.sub(r'([\\`*_\[\]<>])', r'\\\1', text)
