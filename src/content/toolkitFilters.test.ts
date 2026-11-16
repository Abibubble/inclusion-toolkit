import { describe, expect, it } from 'vitest';

import type { Audience, Topic } from './tags';
import type { ToolkitFolder, ToolkitItem } from './toolkit';
import {
  NO_FILTERS,
  filterCount,
  filtersSearch,
  matchesFilters,
  readFilters,
  sectionResources,
  usedTags,
} from './toolkitFilters';

function item(slug: string, topics: Topic[] = [], audiences: Audience[] = []): ToolkitItem {
  return {
    slug,
    title: slug.replace(/^./, (letter) => letter.toUpperCase()),
    description: '',
    topics,
    audiences,
    updated: '2026-06-01',
    versions: [],
  };
}

const SECTION: ToolkitFolder = {
  slug: 'accessibility',
  title: 'Accessibility',
  description: '',
  items: [],
  folders: [
    {
      slug: 'highlights',
      title: 'Accessibility Highlights',
      description: '',
      folders: [],
      items: [
        item('accessibility-highlights'),
        item('dark-mode', ['design', 'colour-and-vision'], ['designers']),
        item('asthma', ['health-conditions'], ['everyone']),
      ],
    },
    {
      slug: 'infographics',
      title: 'Accessibility Infographics',
      description: '',
      folders: [],
      items: [
        item('accessibility-infographics'),
        item('asthma', ['health-conditions'], ['everyone', 'managers']),
      ],
    },
  ],
};

const TYPES = ['highlights', 'infographics'];

describe('sectionResources', () => {
  it('lists every resource in the section’s folders by title, with the all-in-ones apart', () => {
    const { resources, allInOne } = sectionResources(SECTION, ['accessibility']);

    expect(resources.map(({ path }) => path)).toEqual([
      '/accessibility/highlights/asthma',
      '/accessibility/infographics/asthma',
      '/accessibility/highlights/dark-mode',
    ]);
    expect(resources[1]?.type).toEqual({
      slug: 'infographics',
      title: 'Accessibility Infographics',
    });
    expect(allInOne.map(({ path }) => path)).toEqual([
      '/accessibility/highlights/accessibility-highlights',
      '/accessibility/infographics/accessibility-infographics',
    ]);
  });
});

describe('readFilters and filtersSearch', () => {
  it('reads the ticked boxes from the address, and writes them back', () => {
    const search = '?type=infographics&topic=design&topic=colour-and-vision&for=designers';
    const filters = readFilters(search, TYPES);

    expect(filters).toEqual({
      types: ['infographics'],
      topics: ['design', 'colour-and-vision'],
      audiences: ['designers'],
    });
    expect(filtersSearch(filters)).toBe(search);
    expect(filterCount(filters)).toBe(4);
  });

  it('ignores values that aren’t options, and repeats', () => {
    expect(readFilters('?type=posters&topic=design&topic=design&for=cats', TYPES)).toEqual({
      types: [],
      topics: ['design'],
      audiences: [],
    });
  });

  it('writes nothing when no boxes are ticked', () => {
    expect(filtersSearch(NO_FILTERS)).toBe('');
    expect(readFilters('', TYPES)).toEqual(NO_FILTERS);
  });
});

describe('matchesFilters', () => {
  const { resources } = sectionResources(SECTION, ['accessibility']);
  const titles = (filters: Partial<typeof NO_FILTERS>) =>
    resources
      .filter((resource) => matchesFilters(resource, { ...NO_FILTERS, ...filters }))
      .map(({ path }) => path);

  it('shows everything when no boxes are ticked', () => {
    expect(titles({})).toHaveLength(3);
  });

  it('shows resources with any of the ticked options in a group', () => {
    expect(titles({ topics: ['colour-and-vision', 'health-conditions'] })).toHaveLength(3);
    expect(titles({ topics: ['design'] })).toEqual(['/accessibility/highlights/dark-mode']);
  });

  it('only shows resources that match every group with a box ticked', () => {
    expect(titles({ types: ['infographics'], audiences: ['everyone'] })).toEqual([
      '/accessibility/infographics/asthma',
    ]);
    expect(titles({ topics: ['design'], audiences: ['everyone'] })).toEqual([]);
  });
});

describe('usedTags', () => {
  it('lists only the topics and audiences the resources have, in the filters’ order', () => {
    const { resources } = sectionResources(SECTION, ['accessibility']);

    expect(usedTags(resources)).toEqual({
      topics: ['design', 'colour-and-vision', 'health-conditions'],
      audiences: ['everyone', 'designers', 'managers'],
    });
  });
});
