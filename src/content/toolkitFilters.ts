import { AUDIENCES, type Audience, TOPICS, type Topic } from './tags';
import { type ToolkitFolder, type ToolkitItem, isAllInOne, toolkitPath } from './toolkit';

export interface SectionResource {
  item: ToolkitItem;
  path: string;
  /** The folder it's in, such as Highlights */
  type: { slug: string; title: string };
}

export interface ResourceFilters {
  types: string[];
  topics: Topic[];
  audiences: Audience[];
}

export const NO_FILTERS: ResourceFilters = { types: [], topics: [], audiences: [] };

/** The names in the address, such as ?topic=design&for=designers */
const PARAMS = { types: 'type', topics: 'topic', audiences: 'for' } as const;

/** A folder's title without its section's, such as Highlights for Accessibility Highlights */
export function typeName(section: ToolkitFolder, folder: ToolkitFolder): string {
  const prefix = `${section.title} `;
  return folder.title.startsWith(prefix) ? folder.title.slice(prefix.length) : folder.title;
}

/** The address of a section's list with some boxes ticked, such as /accessibility?topic=design */
export function filteredPath(path: string, filters: Partial<ResourceFilters>): string {
  return `${path}${filtersSearch({ ...NO_FILTERS, ...filters })}`;
}

/**
 * Every resource in a section's folders, in one list by title. The all-in-one resources are kept
 * apart, as they cover everything in their folder
 */
export function sectionResources(
  section: ToolkitFolder,
  slugs: readonly string[],
): { resources: SectionResource[]; allInOne: SectionResource[] } {
  const resources: SectionResource[] = [];
  const allInOne: SectionResource[] = [];

  for (const folder of section.folders) {
    for (const item of folder.items) {
      const resource = {
        item,
        path: toolkitPath([...slugs, folder.slug, item.slug]),
        type: { slug: folder.slug, title: folder.title },
      };
      (isAllInOne([section.slug, folder.slug, item.slug]) ? allInOne : resources).push(resource);
    }
  }

  resources.sort(
    (a, b) =>
      a.item.title.localeCompare(b.item.title, 'en-GB') ||
      a.type.title.localeCompare(b.type.title, 'en-GB'),
  );
  return { resources, allInOne };
}

/** Only the values that are real options, once each, in the options' order */
function known<Value extends string>(
  values: readonly string[],
  options: readonly Value[],
): Value[] {
  return options.filter((option) => values.includes(option));
}

export function readFilters(search: string, types: readonly string[]): ResourceFilters {
  const params = new URLSearchParams(search);
  return {
    types: known(params.getAll(PARAMS.types), types),
    topics: known(params.getAll(PARAMS.topics), Object.keys(TOPICS) as Topic[]),
    audiences: known(params.getAll(PARAMS.audiences), Object.keys(AUDIENCES) as Audience[]),
  };
}

export function filtersSearch(filters: ResourceFilters): string {
  const params = new URLSearchParams();
  for (const key of ['types', 'topics', 'audiences'] as const) {
    for (const value of filters[key]) params.append(PARAMS[key], value);
  }
  const search = params.toString();
  return search ? `?${search}` : '';
}

export function filterCount(filters: ResourceFilters): number {
  return filters.types.length + filters.topics.length + filters.audiences.length;
}

/** A resource matches if it has any ticked option in every group that has one ticked */
export function matchesFilters({ item, type }: SectionResource, filters: ResourceFilters): boolean {
  const anyOf = <Value>(ticked: readonly Value[], has: (value: Value) => boolean) =>
    ticked.length === 0 || ticked.some(has);

  return (
    anyOf(filters.types, (slug) => slug === type.slug) &&
    anyOf(filters.topics, (topic) => item.topics.includes(topic)) &&
    anyOf(filters.audiences, (audience) => item.audiences.includes(audience))
  );
}

/** The topics and audiences the resources have, in the order the filters list them */
export function usedTags(resources: readonly SectionResource[]): {
  topics: Topic[];
  audiences: Audience[];
} {
  const topics = new Set(resources.flatMap(({ item }) => item.topics));
  const audiences = new Set(resources.flatMap(({ item }) => item.audiences));
  return {
    topics: (Object.keys(TOPICS) as Topic[]).filter((topic) => topics.has(topic)),
    audiences: (Object.keys(AUDIENCES) as Audience[]).filter((audience) => audiences.has(audience)),
  };
}

/** The home page's heading for the resources at the top level, such as checklists */
export const TEMPLATES_TITLE = 'Templates and checklists';

/** Every resource apart from the all-in-ones, with its folder's full title as its type */
function everyResource(folder: ToolkitFolder, slugs: string[] = []): SectionResource[] {
  return [
    ...folder.items
      .filter((item) => !isAllInOne([...slugs, item.slug]))
      .map((item) => ({
        item,
        path: toolkitPath([...slugs, item.slug]),
        type:
          slugs.length === 0
            ? { slug: '', title: TEMPLATES_TITLE }
            : { slug: folder.slug, title: folder.title },
      })),
    ...folder.folders.flatMap((child) => everyResource(child, [...slugs, child.slug])),
  ];
}

/**
 * How much 2 lists of tags overlap, from 0 for nothing shared to 1 for the same. Rarer tags count
 * for more, so sharing Colour and vision counts for more than sharing Design
 */
function overlap<Tag>(
  a: readonly Tag[],
  b: readonly Tag[],
  uses: ReadonlyMap<Tag, number>,
): number {
  const weight = (tags: Iterable<Tag>) =>
    [...tags].reduce((total, tag) => total + 1 / (uses.get(tag) ?? 1), 0);
  const all = weight(new Set([...a, ...b]));
  return all === 0 ? 0 : weight(a.filter((tag) => b.includes(tag))) / all;
}

function tagCounts<Tag>(lists: readonly (readonly Tag[])[]): Map<Tag, number> {
  const uses = new Map<Tag, number>();
  for (const tag of lists.flat()) uses.set(tag, (uses.get(tag) ?? 0) + 1);
  return uses;
}

/**
 * Resources to read after one, sharing at least one topic. A resource with the same title, such as
 * the 2 Meetings highlights, comes first. Then those with the closest topics and audiences. Ties go to the next ones along by title, so each page gets
 * different ones
 */
export function readNext(
  slugs: readonly string[],
  toolkit: ToolkitFolder,
  count = 3,
): SectionResource[] {
  const resources = everyResource(toolkit).toSorted((a, b) =>
    a.item.title.localeCompare(b.item.title, 'en-GB'),
  );
  const path = toolkitPath(slugs);
  const index = resources.findIndex((resource) => resource.path === path);
  const current = resources[index];
  if (!current) return [];
  const { item } = current;
  const topicUses = tagCounts(resources.map((resource) => resource.item.topics));
  const audienceUses = tagCounts(resources.map((resource) => resource.item.audiences));

  const ranked = resources.flatMap((other, position) => {
    if (other === current || !other.item.topics.some((topic) => item.topics.includes(topic))) {
      return [];
    }
    return [
      {
        other,
        sameTitle: other.item.title === item.title ? 1 : 0,
        closeness:
          overlap(item.topics, other.item.topics, topicUses) +
          overlap(item.audiences, other.item.audiences, audienceUses) / 2,
        along: (position - index + resources.length) % resources.length,
      },
    ];
  });

  return ranked
    .toSorted((a, b) => b.sameTitle - a.sameTitle || b.closeness - a.closeness || a.along - b.along)
    .slice(0, count)
    .map(({ other }) => other);
}
