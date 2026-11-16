# Inclusion Toolkit

The Inclusion Toolkit is the whole site, starting at the home page, `/`. Its folders and resources are listed in
`src/content/toolkit.json`, with what I have for each one and what's still to do.

## Folders

Each folder has a `slug` for its address, a `title`, a `description`, and its own `folders` and
`items`. A folder only appears once something in it is ready. The address comes from the slugs, so
`accessibility`, then `highlights`, is `/accessibility/highlights`. Folders are by topic first,
then by kind of resource, so a new topic is one new folder at the top.

## Resources

Each resource in a folder's `items` has:

- `slug`, `title` and `description`, ending in a full stop
- `topics` and `audiences`: what it's about and who it's for, from the lists in
  `src/content/tags.ts`. The site shows them on its card and page, and uses them for the filters
  and search. The all-in-one resources have none, as they cover everything in their folder
- `updated`, the date it was last updated, as YYYY-MM-DD
- `slides`: `true` if it has slides, which are its visual summary
- `infographic`: `true` if it's an infographic, which has a PowerPoint file and PDF, but no Word
  file
- `text`: `"draft"` while its text needs checking, then `"checked"`
- `todo`: what's still to do for it

## Files

Each resource comes in up to 2 versions, each as an editable file and a PDF of it, so people can
choose the format that works for them:

- **Full guide**: the Word file and a PDF of it. Every resource has this.
- **Visual summary**: the slides, as a PowerPoint file and a PDF of it. Only resources with
  `"slides": true` have this.

The files go in `public/files/`, named after the resource's address. The visual
summary's files have `-visual-summary` added. So the resource at
`/accessibility/highlights/dark-mode` has:

- `accessibility/highlights/dark-mode.docx`
- `accessibility/highlights/dark-mode.pdf`
- `accessibility/highlights/dark-mode-visual-summary.pptx`
- `accessibility/highlights/dark-mode-visual-summary.pdf`

An infographic has `"infographic": true`, and only its PowerPoint file and a PDF of it, named
after its address. So `/accessibility/infographics/asthma` has:

- `accessibility/infographics/asthma.pptx`
- `accessibility/infographics/asthma.pdf`

They aren't listed in `toolkit.json`. The site finds them by their names, and works out their sizes
when it's built. Each PDF's View link opens it in a new tab.

## When a resource goes live

A resource only goes on the site once its text is marked `"checked"`. It must then have every file
above, or the tests and the build fail, so it can never go live without them and nobody is left
out. Until then, the build removes its files, so they never go live.

## Making the files

The files are made from 9 source files in `toolkit-sources/branded/`: the 3 small resources' Word
files, each set of highlights as one Word file and one PowerPoint file, and each set of
infographics as one PowerPoint file. Edit those, never the files in `public/files`. The scripts cut
them into one file for each resource, and make every PDF.

Run the scripts from the repo root, with Python 3.10 or newer and the Node version from `.nvmrc`.

To change the text, starting from the pages:

1. Change the page's text in this folder. If it's a highlight or infographic, change it in its
   all-in-one page too, word for word.
2. Copy the changes into the source files. Without `--write`, it shows what it would change, and
   lists anything to do by hand:

   ```sh
   /opt/homebrew/bin/python3 -I toolkit-sources/sync_text.py --write
   ```

3. Make the files, as below.

To change the files, starting from Word or PowerPoint:

1. Edit the source file in Word or PowerPoint, and save it.
2. Make the files:

   ```sh
   /opt/homebrew/bin/python3 -I toolkit-sources/rebrand.py
   /opt/homebrew/bin/python3 -I toolkit-sources/export.py
   ```

3. Update the page's text in this folder, so it matches. The Word files and their PDFs have the
   "In short" summaries. The slides don't.

## Text

Every resource has a page with everything in it as text, so it meets WCAG AAA even for people who
can't use the files. The text goes in this folder, at the same path as the address, such as
`accessibility/highlights/dark-mode.md`.

- Start headings at `###`, as the page already has a "What’s in it" heading above them.
- Describe every picture, chart and diagram in words, the same way as the slide descriptions.
- Mark anything to check with `[check: ...]`. The tests stop a resource being marked checked while
  any are left.

## Accessible files

The files themselves should be fully accessible too: a title, the language set, headings, real text
rather than pictures of text, alt text on pictures, and a reading order that makes sense. For PDFs,
that means tagged PDFs. The tests can't check inside the files, so check them with a tool such as
Acrobat's accessibility checker or PAC, and with a screen reader.
