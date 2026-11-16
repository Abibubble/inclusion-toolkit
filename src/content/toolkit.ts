import { SITE_NAME } from './site';
import { type Audience, type Topic, audienceNames, topicNames } from './tags';
import RECORD from './toolkit.json' with { type: 'json' };

/** Folders and resources sit under the home page, such as /accessibility */
export const TOOLKIT_PATH = '/';

/** Matches the home page's label in MAIN_NAV */
const TOOLKIT_HOME_TITLE = 'Home';

/** In public/ */
const TOOLKIT_FILES_FOLDER = 'files';

/** One format of a resource, such as its PDF, in public/ */
interface ToolkitFile {
  /** Always under files/, such as files/infographics/neurodiversity/adhd.pdf */
  path: string;
  /** Such as 1.2MB. Empty until the site is built */
  size: string;
}

type ToolkitVersionName = 'Full guide' | 'Visual summary' | 'Infographic';

export interface ToolkitVersion {
  name: ToolkitVersionName;
  files: ToolkitFile[];
}

/** A resource, with a page of its own showing everything in it as text */
export interface ToolkitItem {
  slug: string;
  title: string;
  description: string;
  /** Empty for the all-in-one resources, which cover everything in their folder */
  topics: Topic[];
  audiences: Audience[];
  /** YYYY-MM-DD */
  updated: string;
  /** The full guide, then the visual summary if it has slides */
  versions: ToolkitVersion[];
}

type ToolkitFileType = 'PDF' | 'Word document' | 'PowerPoint';

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
 * A resource in toolkit.json, with what's being tracked for it. Its text is in
 * src/content/toolkit/{folders}/{slug}.md, and its files are named the same way
 */
export interface ToolkitItemRecord extends Omit<ToolkitItem, 'versions'> {
  /** Slides need a PowerPoint file and PDF too, as the visual summary */
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
type ToolkitFormats = Pick<ToolkitItemRecord, 'slides' | 'infographic'>;

/**
 * Each version of a resource and its files in public/, named after its slugs, such as
 * files/accessibility/highlights/dark-mode.docx and dark-mode-visual-summary.pptx
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

function isReady(item: ToolkitItemRecord): boolean {
  return item.text === 'checked';
}

/**
 * Only what the site shows: ready resources, and folders with something in them. It lists what to
 * keep, not what to remove, so anything new added for tracking stays private
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
      .map(
        ({
          slug: itemSlug,
          title,
          description,
          topics,
          audiences,
          updated,
          slides,
          infographic,
        }) => ({
          slug: itemSlug,
          title,
          description,
          topics,
          audiences,
          updated,
          versions: toolkitVersions([...slugs, itemSlug], { slides, infographic }),
        }),
      ),
  };
}

function hasContent(folder: ToolkitFolder): boolean {
  return folder.items.length > 0 || folder.folders.length > 0;
}

/** The toolkit as the site shows it */
export const TOOLKIT: ToolkitFolder = publicToolkit(TOOLKIT_RECORD);

function fileName(path: string): string {
  return path.split('/').pop() ?? path;
}

function allFiles(folder: ToolkitFolder): ToolkitFile[] {
  return [
    ...folder.items.flatMap((item) => item.versions.flatMap((version) => version.files)),
    ...folder.folders.flatMap(allFiles),
  ];
}

/** File names used in more than one folder, such as meetings.docx */
export function sharedFileNames(folder: ToolkitFolder): Set<string> {
  const counts = new Map<string, number>();
  for (const { path } of allFiles(folder)) {
    counts.set(fileName(path), (counts.get(fileName(path)) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, count]) => count > 1).map(([name]) => name));
}

const SHARED_FILE_NAMES = sharedFileNames(TOOLKIT);

/**
 * The name a file is saved as when it's downloaded. A name used in more than one folder gets its
 * folders added, such as meetings-neurodiversity-highlights.docx, so 2 downloads can be told apart
 * and one doesn't become "meetings (1).docx". Its address stays the same
 */
export function downloadName(
  path: string,
  shared: ReadonlySet<string> = SHARED_FILE_NAMES,
): string {
  const name = fileName(path);
  if (!shared.has(name)) return name;
  // Leaves out files/ at the start, and the name at the end
  const folders = path.split('/').slice(1, -1);
  const dot = name.lastIndexOf('.');
  return `${name.slice(0, dot)}-${folders.join('-')}${name.slice(dot)}`;
}

/** The address of a folder or resource, from the slugs leading to it */
export function toolkitPath(slugs: readonly string[]): string {
  return `${TOOLKIT_PATH}${slugs.join('/')}`;
}

/** The key in src/content/toolkit/{key}.md, such as highlights/dark-mode */
export function toolkitTextKey(slugs: readonly string[]): string {
  return slugs.join('/');
}

export interface ToolkitEntry {
  kind: 'folder' | 'item';
  slugs: string[];
  title: string;
  description: string;
  /** Its folder's title, as resources in different folders can share a title */
  folder?: string;
  /** Its topics and who it's for, such as "Design, Designers", so they can be searched for */
  tags?: string;
}

/** Every folder and resource under a folder, with the slugs leading to each, in page order */
export function toolkitEntries(folder: ToolkitFolder, slugs: string[] = []): ToolkitEntry[] {
  return [
    ...folder.folders.flatMap((child) => [
      {
        kind: 'folder' as const,
        slugs: [...slugs, child.slug],
        title: child.title,
        description: child.description,
      },
      ...toolkitEntries(child, [...slugs, child.slug]),
    ]),
    ...folder.items.map((item) => ({
      kind: 'item' as const,
      slugs: [...slugs, item.slug],
      title: item.title,
      description: item.description,
      ...(slugs.length > 0 && { folder: folder.title }),
      ...(item.topics.length > 0 && {
        tags: [...topicNames(item.topics), ...audienceNames(item.audiences)].join(', '),
      }),
    })),
  ];
}

/** A step in the breadcrumbs, from the toolkit down to the current page */
export interface ToolkitCrumb {
  title: string;
  path: string;
}

type ToolkitLocation =
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

/** Files in public/ for resources that aren't on the site yet */
export function unpublishedToolkitFiles(record: ToolkitFolderRecord = TOOLKIT_RECORD): string[] {
  return toolkitItemRecords(record)
    .filter(({ item }) => !isReady(item))
    .flatMap(({ slugs, item }) => toolkitFilePaths(slugs, item));
}
