import { AUDIENCES, type Audience, TOPICS, type Topic } from './tags';
import { type ToolkitFolder, type ToolkitItem, toolkitPath } from './toolkit';

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
      const isAllInOne = item.slug === `${section.slug}-${folder.slug}`;
      (isAllInOne ? allInOne : resources).push(resource);
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
