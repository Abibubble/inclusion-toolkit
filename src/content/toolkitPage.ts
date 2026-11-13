import { statSync } from 'node:fs';

import { data } from 'react-router';

import {
  TOOLKIT,
  type ToolkitCrumb,
  type ToolkitFolder,
  type ToolkitItem,
  findInToolkit,
  toolkitEntries,
  toolkitPath,
  toolkitTextKey,
} from './toolkit';
import { type ToolkitSearchEntry, type ToolkitSearchIndex, searchIndex } from './toolkitSearch';
import { renderMarkdown } from './markdown';

/** A size as computers show it, with 1000 bytes to a kilobyte, such as 307KB or 1.2MB */
export function formatFileSize(bytes: number): string {
  return bytes < 1_000_000
    ? `${String(Math.round(bytes / 1000))}KB`
    : `${String(Math.round(bytes / 100_000) / 10)}MB`;
}

/**
 * The size of a file in public/. If a ready resource is missing a file, this stops the build, so
 * it can't go live without it
 */
export function publicFileSize(path: string): string {
  return formatFileSize(statSync(`public/${path}`).size);
}

function itemWithSizes(item: ToolkitItem, sizeOf: (path: string) => string): ToolkitItem {
  return {
    ...item,
    versions: item.versions.map((version) => ({
      ...version,
      files: version.files.map((file) => ({ ...file, size: sizeOf(file.path) })),
    })),
  };
}

function folderWithSizes(folder: ToolkitFolder, sizeOf: (path: string) => string): ToolkitFolder {
  return {
    ...folder,
    folders: folder.folders.map((child) => folderWithSizes(child, sizeOf)),
    items: folder.items.map((item) => itemWithSizes(item, sizeOf)),
  };
}

/**
 * The text of each resource, in src/content/toolkit/{folders}/{slug}.md. Only loaders use it, and
 * loaders run when the site is built, so the Markdown is never sent to visitors' browsers
 */
const TEXT_FILES = import.meta.glob<string>(['./toolkit/**/*.md', '!./toolkit/README.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** Every resource's text, keyed by the slugs leading to it: ./toolkit/accessibility/highlights/dark-mode.md gives accessibility/highlights/dark-mode */
export const TOOLKIT_TEXT: Record<string, string> = Object.fromEntries(
  Object.entries(TEXT_FILES).map(([path, markdown]) => [
    path.replace(/^\.\/toolkit\//, '').replace(/\.md$/, ''),
    markdown,
  ]),
);

export type { ToolkitSearchEntry };

/**
 * The words of every resource's full text, by its address, so search can find words that aren't
 * in a title or description. It's a file of its own, only fetched once someone starts searching,
 * so the toolkit's main page stays small
 */
export function loadToolkitSearchIndex(
  toolkit: ToolkitFolder = TOOLKIT,
  texts: Record<string, string> = TOOLKIT_TEXT,
): ToolkitSearchIndex {
  return searchIndex(
    Object.fromEntries(
      toolkitEntries(toolkit)
        .filter(({ kind }) => kind === 'item')
        .map(({ slugs }) => [toolkitPath(slugs), texts[toolkitTextKey(slugs)] ?? '']),
    ),
  );
}

export type ToolkitPageData =
  | { kind: 'home'; toolkit: ToolkitFolder; search: ToolkitSearchEntry[] }
  | { kind: 'folder'; folder: ToolkitFolder; slugs: string[]; trail: ToolkitCrumb[] }
  | {
      kind: 'item';
      item: ToolkitItem;
      slugs: string[];
      trail: ToolkitCrumb[];
      textHtml: string;
    };

function notFound(): never {
  // eslint-disable-next-line @typescript-eslint/only-throw-error -- React Router expects a response
  throw data(null, { status: 404 });
}

/**
 * The toolkit's main page, a folder, or a resource with its text, from the slugs in its address,
 * or a 404. A resource can never show without its text, so everything in it is there as text too
 */
export function loadToolkitPage(
  slugs: readonly string[],
  toolkit: ToolkitFolder = TOOLKIT,
  texts: Record<string, string> = TOOLKIT_TEXT,
  sizeOf: (path: string) => string = publicFileSize,
): ToolkitPageData {
  if (slugs.length === 0) {
    return {
      kind: 'home',
      toolkit: folderWithSizes(toolkit, sizeOf),
      search: toolkitEntries(toolkit).map(
        ({ kind, slugs: entrySlugs, title, description, folder }) => ({
          kind,
          title,
          description,
          path: toolkitPath(entrySlugs),
          ...(folder && { folder }),
        }),
      ),
    };
  }

  const location = findInToolkit(slugs, toolkit);
  if (!location) notFound();
  if (location.kind === 'folder') {
    return { ...location, folder: folderWithSizes(location.folder, sizeOf) };
  }

  const markdown = texts[toolkitTextKey(slugs)];
  if (markdown === undefined) notFound();
  return {
    ...location,
    item: itemWithSizes(location.item, sizeOf),
    textHtml: renderMarkdown(markdown),
  };
}
