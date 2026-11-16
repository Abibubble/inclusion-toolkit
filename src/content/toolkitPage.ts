import { statSync } from 'node:fs';

import { data } from 'react-router';

import {
  TOOLKIT,
  type ToolkitCrumb,
  type ToolkitEntry,
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
    ? `${Math.round(bytes / 1000)}KB`
    : `${Math.round(bytes / 100_000) / 10}MB`;
}

/**
 * The size of a file in public/. If a ready resource is missing a file, this stops the build, so
 * it can't go live without it
 */
function publicFileSize(path: string): string {
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

/** Only loaders read these, at build time, so the Markdown never reaches the browser */
const TEXT_FILES = import.meta.glob<string>(['./toolkit/**/*.md', '!./toolkit/README.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** Each resource's Markdown, keyed by its path under ./toolkit without .md */
export const TOOLKIT_TEXT: Record<string, string> = Object.fromEntries(
  Object.entries(TEXT_FILES).map(([path, markdown]) => [
    path.replace(/^\.\/toolkit\//, '').replace(/\.md$/, ''),
    markdown,
  ]),
);

/**
 * Each resource's full-text words, by address. A separate file, fetched only when someone
 * searches, so the main page stays small
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

function toSearchEntry({
  kind,
  slugs,
  title,
  description,
  folder,
  tags,
}: ToolkitEntry): ToolkitSearchEntry {
  return {
    kind,
    title,
    description,
    path: toolkitPath(slugs),
    ...(folder && { folder }),
    ...(tags && { tags }),
  };
}

/** Good places to begin, first on the home page, by address */
export const START_HERE = [
  'accessible-meeting-checklist',
  'accessibility/highlights/inclusive-language',
  'accessibility/highlights/alt-text',
  'accessibility/highlights/basic-accessibility-testing',
  'neurodiversity/highlights/key-terminology',
  'neurodiversity/highlights/spoon-theory',
];

export interface ToolkitLink {
  item: ToolkitItem;
  path: string;
}

/** The resources at some addresses, leaving out any that aren't ready */
export function toolkitLinks(paths: readonly string[], toolkit: ToolkitFolder): ToolkitLink[] {
  return paths.flatMap((path) => {
    const found = findInToolkit(path.split('/'), toolkit);
    return found?.kind === 'item' ? [{ item: found.item, path: toolkitPath(found.slugs) }] : [];
  });
}

export type ToolkitPageData =
  | {
      kind: 'home';
      toolkit: ToolkitFolder;
      startHere: ToolkitLink[];
      search: ToolkitSearchEntry[];
    }
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
      startHere: toolkitLinks(START_HERE, toolkit),
      search: toolkitEntries(toolkit).map(toSearchEntry),
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
