"""
Makes everything else each Inclusion Toolkit resource needs, from its branded Word file:
- a tagged PDF that looks like the Word file
- if it has slides, a tagged PDF of them too
- a picture of its visual summary or infographic slide, for its page
- a draft of its text for the site, in src/content/toolkit/, if it doesn't have one yet
Then it copies the files into public/files/, and adds any new resource to
src/content/toolkit.json. It never changes text, descriptions or to-dos already there, so
checked text stays checked.

The parts are in these files, next to this one:
- word_files.py reads Word files, and makes their HTML and Markdown
- slide_files.py reads PowerPoint files, and makes their HTML and Markdown
- pdf_finishing.py adds what the browser leaves out of the PDFs
- shared.py has constants and helpers more than one of them use

Run it from the repo root, after rebrand.py, with the Node version from .nvmrc:

    /opt/homebrew/bin/python3 -I toolkit-sources/export.py
"""

import json
import re
import shutil
import subprocess
import sys
import zipfile
from collections.abc import Callable
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from pdf_finishing import finish_pdf
from slide_files import infographic_markdown, pptx_title, slides_html
from word_files import (
    SIDE_MARGIN,
    Docx,
    blocks,
    document_html,
    document_markdown,
    footer_template,
    plain,
)

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
BRANDED = ROOT / 'branded'
BUILD = ROOT / 'build'
TEXT = REPO / 'src' / 'content' / 'toolkit'
PUBLIC = REPO / 'public'
FILES = 'files'
RECORD = REPO / 'src' / 'content' / 'toolkit.json'

# The slides' version of each resource, and what's added to its files' names
SUMMARY = 'visual summary'
SUMMARY_SUFFIX = '-visual-summary'


def has_one_slide(html: str) -> bool:
    """Only single slides get a picture, so not the all-in-ones"""
    return html.count('<section class="slide"') == 1


def pictures(built: Path, site: str) -> dict[Path, str]:
    """The pictures pdf.mjs saved of a slide, such as adhd-960.png, with their names in public/files"""
    pattern = re.compile(rf'{re.escape(built.name)}(-\d+\.png)')
    return {
        png: f'{site}{match[1]}'
        for png in sorted(built.parent.glob('*.png'))
        if (match := pattern.fullmatch(png.name))
    }


def site_path(relative: Path) -> Path:
    """
    Sources are grouped by format first, such as highlights/accessibility/dark-mode, but the site
    by topic first, such as accessibility/highlights/dark-mode
    """
    parts = relative.parts
    if parts[0] in ('highlights', 'infographics') and len(parts) > 2:
        return Path(parts[1], parts[0], *parts[2:])
    return relative


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
    Whether 2 files match, ignoring the save time Office zips and PDFs store, so unchanged files
    aren't rewritten
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


def copy_if_changed(source: Path, public: Path) -> None:
    public.parent.mkdir(parents=True, exist_ok=True)
    if not same_content(source, public):
        shutil.copyfile(source, public)


def draft_text(text_file: Path, make_text: Callable[[], str]) -> None:
    if text_file.exists():
        return
    text_file.parent.mkdir(parents=True, exist_ok=True)
    text_file.write_text(make_text(), encoding='utf-8')
    print(f'Drafted {text_file.relative_to(REPO)}')


def main() -> None:
    sources = sorted(BRANDED.glob('**/*.docx'))
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
                'footer': footer_template(),
                'sideMargin': SIDE_MARGIN,
            }
        )
        finishing.append((source.with_suffix('.pdf'), docx.title, html_path))

        slides = source.with_suffix('.pptx')
        if slides.exists():
            summary_title = f'{docx.title}: {SUMMARY.capitalize()}'
            slides_html_path = BUILD / f'{relative}{SUMMARY_SUFFIX}.html'
            summary_html = slides_html(slides, summary_title)
            slides_html_path.write_text(summary_html, encoding='utf-8')
            slides_pdf = BRANDED / f'{relative}{SUMMARY_SUFFIX}.pdf'
            job = {'html': str(slides_html_path), 'pdf': str(slides_pdf), 'slides': True}
            if has_one_slide(summary_html):
                job['picture'] = str(BUILD / f'{relative}{SUMMARY_SUFFIX}')
            jobs.append(job)
            finishing.append((slides_pdf, summary_title, slides_html_path))

    # Infographics have no Word file, so their PDF and page text come from the PowerPoint file
    infographics = {}
    for source in sorted((BRANDED / 'infographics').glob('**/*.pptx')):
        relative = source.relative_to(BRANDED).with_suffix('')
        title = pptx_title(source)
        infographics[relative] = (source, title)
        html_path = BUILD / relative.with_suffix('.html')
        html_path.parent.mkdir(parents=True, exist_ok=True)
        html = slides_html(source, title)
        html_path.write_text(html, encoding='utf-8')
        job = {'html': str(html_path), 'pdf': str(source.with_suffix('.pdf')), 'slides': True}
        if has_one_slide(html):
            job['picture'] = str(BUILD / relative)
        jobs.append(job)
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
        files |= pictures(BUILD / f'{relative}{SUMMARY_SUFFIX}', f'{site}{SUMMARY_SUFFIX}')
        for file, name in files.items():
            copy_if_changed(file, PUBLIC / FILES / name)
        slides = BRANDED / relative.with_suffix('.pptx') in files

        draft_text(TEXT / site.with_suffix('.md'), lambda: document_markdown(docx, docx.title))

        folder = find_folder(record, folders)
        item = next((i for i in folder['items'] if i['slug'] == slug), None)
        if item is None:
            item = {
                'slug': slug,
                # A shared title has its folder added for the files (see SHARED_TITLES in rebrand.py)
                'title': docx.title.removesuffix(f' ({folder["title"]})'),
                'description': first_sentence(docx),
                'topics': [],
                'audiences': [],
                'updated': date.today().isoformat(),
                'slides': slides,
                'text': 'draft',
                'todo': [
                    'Check the description',
                    'Add its topics and audiences, from src/content/tags.ts',
                    'Check the text drafted for its page',
                    'Check the Word file, PDF and slides' if slides else 'Check the Word file and PDF',
                ],
            }
            folder['items'].append(item)
        item['slides'] = slides
        print(f'Exported {relative.as_posix()}: {", ".join(Path(n).name for n in files.values())}')

    for relative, (source, title) in infographics.items():
        site = site_path(relative)
        *folders, slug = site.parts
        for suffix in ('.pptx', '.pdf'):
            copy_if_changed(source.with_suffix(suffix), PUBLIC / FILES / site.with_suffix(suffix))
        for png, name in pictures(BUILD / relative, str(site)).items():
            copy_if_changed(png, PUBLIC / FILES / name)

        draft_text(TEXT / site.with_suffix('.md'), lambda: infographic_markdown(source))

        folder = find_folder(record, folders)
        item = next((i for i in folder['items'] if i['slug'] == slug), None)
        if item is None:
            item = {
                'slug': slug,
                'title': title,
                'description': f'An infographic about {title}.',
                'topics': [],
                'audiences': [],
                'updated': date.today().isoformat(),
                'slides': False,
                'infographic': True,
                'text': 'draft',
                'todo': [
                    'Check the description',
                    'Add its topics and audiences, from src/content/tags.ts',
                    'Check the text drafted for its page',
                    'Check the PowerPoint file and PDF',
                ],
            }
            folder['items'].append(item)
        print(f'Exported {relative.as_posix()}: {slug}.pptx, {slug}.pdf')

    RECORD.write_text(json.dumps(record, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Updated {RECORD.relative_to(REPO)}. Run `pnpm exec prettier --write src/content/toolkit` next.')


if __name__ == '__main__':
    main()
