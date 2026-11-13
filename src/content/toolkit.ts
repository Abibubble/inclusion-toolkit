import { SITE_NAME } from './site';
import RECORD from './toolkit.json' with { type: 'json' };

/** The toolkit is the whole site, so folders and resources sit under the home page, such as /accessibility */
export const TOOLKIT_PATH = '/';

/** What the first step of the breadcrumbs is called. The same as the home page's name in the menu */
export const TOOLKIT_HOME_TITLE = 'Home';

/** Where the toolkit's files are, in public/ */
export const TOOLKIT_FILES_FOLDER = 'files';

/** One format of a resource, such as its PDF, in public/ */
export interface ToolkitFile {
  /** Always under files/, such as files/infographics/neurodiversity/adhd.pdf */
  path: string;
  /**
   * Such as 1.2MB, using 1000 bytes to a kilobyte, as computers show it. Worked out from the file
   * when the site is built, so it's empty until then
   */
  size: string;
}

export type ToolkitVersionName = 'Full guide' | 'Visual summary' | 'Infographic';

/**
 * A version of a resource, in each format it comes in. The full guide is the Word file and a PDF
 * of it. The visual summary is the slides, as a PowerPoint file and a PDF of it. An infographic
 * is a PowerPoint file and a PDF of it, with no Word file
 */
export interface ToolkitVersion {
  name: ToolkitVersionName;
  files: ToolkitFile[];
}

/** A resource, with a page of its own showing everything in it as text */
export interface ToolkitItem {
  slug: string;
  title: string;
  description: string;
  /** YYYY-MM-DD */
  updated: string;
  /** The full guide, then the visual summary if it has slides */
  versions: ToolkitVersion[];
}

export type ToolkitFileType = 'PDF' | 'Word document' | 'PowerPoint';

const FILE_TYPES: Record<string, ToolkitFileType> = {
  pdf: 'PDF',
  docx: 'Word document',
  pptx: 'PowerPoint',
};

/** What kind of file it is, from its extension, for saying so next to the link */
export function fileType(file: ToolkitFile): ToolkitFileType | undefined {
  return FILE_TYPES[file.path.split('.').pop()?.toLowerCase() ?? ''];
}

export interface ToolkitFolder {
  slug: string;
  title: string;
  description: string;
  folders: ToolkitFolder[];
  items: ToolkitItem[];
}

/**
 * A resource in toolkit.json, with what's being tracked for it. The text of everything in it is in
 * src/content/toolkit/{folders}/{slug}.md, and its files are named the same way (see toolkitFilePaths)
 */
export interface ToolkitItemRecord extends Omit<ToolkitItem, 'versions'> {
  /** Whether it has slides, which then need their PowerPoint file and PDF too, as the visual summary */
  slides: boolean;
  /** Whether it's an infographic, which is a PowerPoint file and PDF, with no Word file */
  infographic?: boolean;
  /** Checked and ready, a draft to check, or not written yet. Only checked ones are on the site */
  text: 'checked' | 'draft' | 'none';
  todo: string[];
}

export interface ToolkitFolderRecord extends Omit<ToolkitFolder, 'folders' | 'items'> {
  folders: ToolkitFolderRecord[];
  items: ToolkitItemRecord[];
}

/** Every folder and resource in toolkit.json, ready or not. Only read when the site is built */
export const TOOLKIT_RECORD: ToolkitFolderRecord = {
  slug: '',
  title: SITE_NAME,
  description: '',
  ...(RECORD as Pick<ToolkitFolderRecord, 'folders' | 'items'>),
};

/** What a resource comes as, from toolkit.json */
export type ToolkitFormats = Pick<ToolkitItemRecord, 'slides' | 'infographic'>;

/**
 * Each version of a resource, with where its files go in public/, named after the slugs leading to
 * it. Most resources have the full guide. So accessibility/highlights/dark-mode has
 * files/accessibility/highlights/dark-mode.docx and .pdf. If it has slides, it
 * also has the visual summary, dark-mode-visual-summary.pptx and .pdf. An infographic only has
 * its PowerPoint file and PDF, such as accessibility/infographics/asthma.pptx and .pdf. The sizes
 * are filled in when the site is built
 */
export function toolkitVersions(
  slugs: readonly string[],
  { slides, infographic = false }: ToolkitFormats,
): ToolkitVersion[] {
  const start = `${TOOLKIT_FILES_FOLDER}/${slugs.join('/')}`;
  const version = (name: ToolkitVersionName, path: string, extensions: string[]) => ({
    name,
    files: extensions.map((extension) => ({ path: `${path}.${extension}`, size: '' })),
  });

  if (infographic) return [version('Infographic', start, ['pptx', 'pdf'])];
  return [
    version('Full guide', start, ['docx', 'pdf']),
    ...(slides ? [version('Visual summary', `${start}-visual-summary`, ['pptx', 'pdf'])] : []),
  ];
}

/** Every file a resource needs in public/ (see toolkitVersions) */
export function toolkitFilePaths(slugs: readonly string[], formats: ToolkitFormats): string[] {
  return toolkitVersions(slugs, formats).flatMap(({ files }) => files.map(({ path }) => path));
}

/**
 * Ready once its text is checked. The tests and the build then make sure it has every file it
 * needs, so nobody is left out
 */
function isReady(item: ToolkitItemRecord): boolean {
  return item.text === 'checked';
}

/**
 * Only what the site shows: ready resources, and folders with something in them.
 * It lists what to keep, rather than what to remove, so anything new added for tracking stays private
 */
export function publicToolkit(record: ToolkitFolderRecord, slugs: string[] = []): ToolkitFolder {
  const { slug, title, description } = record;

  return {
    slug,
    title,
    description,
    folders: record.folders
      .map((child) => publicToolkit(child, [...slugs, child.slug]))
      .filter(hasContent),
    items: record.items
      .filter(isReady)
      .map(({ slug: itemSlug, title, description, updated, slides, infographic }) => ({
        slug: itemSlug,
        title,
        description,
        updated,
        versions: toolkitVersions([...slugs, itemSlug], { slides, infographic }),
      })),
  };
}

function hasContent(folder: ToolkitFolder): boolean {
  return folder.items.length > 0 || folder.folders.length > 0;
}

/** The toolkit as the site shows it */
export const TOOLKIT: ToolkitFolder = publicToolkit(TOOLKIT_RECORD);

/** The address of a folder or resource, from the slugs leading to it */
export function toolkitPath(slugs: readonly string[]): string {
  return `${TOOLKIT_PATH}${slugs.join('/')}`;
}

/** The key for a resource's text file, src/content/toolkit/{key}.md, such as highlights/dark-mode */
export function toolkitTextKey(slugs: readonly string[]): string {
  return slugs.join('/');
}

export interface ToolkitEntry {
  kind: 'folder' | 'item';
  slugs: string[];
  title: string;
  description: string;
  /** The title of the folder a resource is in, as some resources in different folders share a title */
  folder?: string;
}

/** Every folder and resource under a folder, with the slugs leading to each, in page order */
export function toolkitEntries(folder: ToolkitFolder, slugs: string[] = []): ToolkitEntry[] {
  return [
    ...folder.folders.flatMap((child) => [
      { kind: 'folder' as const, slugs: [...slugs, child.slug], ...describe(child) },
      ...toolkitEntries(child, [...slugs, child.slug]),
    ]),
    ...folder.items.map((item) => ({
      kind: 'item' as const,
      slugs: [...slugs, item.slug],
      ...describe(item),
      ...(slugs.length > 0 && { folder: folder.title }),
    })),
  ];
}

function describe({ title, description }: { title: string; description: string }) {
  return { title, description };
}

/** A step in the breadcrumbs, from the toolkit down to the current page */
export interface ToolkitCrumb {
  title: string;
  path: string;
}

export type ToolkitLocation =
  | { kind: 'folder'; folder: ToolkitFolder; slugs: string[]; trail: ToolkitCrumb[] }
  | { kind: 'item'; item: ToolkitItem; slugs: string[]; trail: ToolkitCrumb[] };

/** The folder or resource at the end of some slugs, with the folders above it, or nothing */
export function findInToolkit(
  slugs: readonly string[],
  root: ToolkitFolder = TOOLKIT,
): ToolkitLocation | undefined {
  const trail: ToolkitCrumb[] = [{ title: TOOLKIT_HOME_TITLE, path: TOOLKIT_PATH }];
  let folder = root;

  for (const [index, slug] of slugs.entries()) {
    const path = toolkitPath(slugs.slice(0, index + 1));
    const isLast = index === slugs.length - 1;
    const child = folder.folders.find((candidate) => candidate.slug === slug);

    if (child) {
      if (isLast) return { kind: 'folder', folder: child, slugs: [...slugs], trail };
      trail.push({ title: child.title, path });
      folder = child;
      continue;
    }

    const item = isLast ? folder.items.find((candidate) => candidate.slug === slug) : undefined;
    return item ? { kind: 'item', item, slugs: [...slugs], trail } : undefined;
  }

  return { kind: 'folder', folder: root, slugs: [], trail: [] };
}

/** Every resource in toolkit.json, ready or not, with the slugs leading to it */
export function toolkitItemRecords(
  record: ToolkitFolderRecord = TOOLKIT_RECORD,
  slugs: string[] = [],
): { slugs: string[]; item: ToolkitItemRecord }[] {
  return [
    ...record.items.map((item) => ({ slugs: [...slugs, item.slug], item })),
    ...record.folders.flatMap((child) => toolkitItemRecords(child, [...slugs, child.slug])),
  ];
}

/**
 * The files in public/ of resources that aren't on the site yet. Everything in public/ is copied
 * into the built site, so the build removes these
 */
export function unpublishedToolkitFiles(record: ToolkitFolderRecord = TOOLKIT_RECORD): string[] {
  return toolkitItemRecords(record)
    .filter(({ item }) => !isReady(item))
    .flatMap(({ slugs, item }) => toolkitFilePaths(slugs, item));
}
