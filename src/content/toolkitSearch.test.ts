import { describe, expect, it } from 'vitest';

import { loadToolkitSearchIndex } from './toolkitPage';
import {
  type ToolkitSearchEntry,
  searchIndex,
  searchToolkit,
  searchWords,
  standardSpelling,
} from './toolkitSearch';

const entry = (title: string, description = `About ${title}.`): ToolkitSearchEntry => ({
  kind: 'item',
  title,
  description,
  path: `/${title.toLowerCase().replace(/\W+/g, '-')}`,
});

const titles = (results: ToolkitSearchEntry[]) => results.map((result) => result.title);

/**
 * A search index of some resources' text, among 12 other resources, as words used in more than a
 * quarter of resources are left out of the full text
 */
const withOthers = (texts: Record<string, string>, othersText = 'Something else.') =>
  searchIndex({
    ...Object.fromEntries(
      Array.from({ length: 12 }, (_, number) => [`/other-${String(number)}`, othersText]),
    ),
    ...texts,
  });

describe('standardSpelling', () => {
  it('gives British and American spellings the same spelling', () => {
    const pairs = [
      ['colour', 'color'],
      ['colours', 'colors'],
      ['behaviour', 'behavior'],
      ['favourite', 'favorite'],
      ['honourable', 'honorable'],
      ['organise', 'organize'],
      ['organised', 'organized'],
      ['organisation', 'organization'],
      ['recognising', 'recognizing'],
      ['analyse', 'analyze'],
      ['centre', 'center'],
      ['theatres', 'theaters'],
      ['catalogue', 'catalog'],
      ['licence', 'license'],
      ['defence', 'defense'],
      ['travelled', 'traveled'],
      ['labelling', 'labeling'],
      ['grey', 'gray'],
      ['programme', 'program'],
      ['judgement', 'judgment'],
    ];

    for (const [british = '', american = ''] of pairs) {
      expect(standardSpelling(british), british).toBe(standardSpelling(american));
    }
  });

  it('ignores capitals, hyphens and apostrophes', () => {
    expect(standardSpelling('ADHD')).toBe('adhd');
    expect(standardSpelling('colour-blind')).toBe(standardSpelling('colorblind'));
    expect(standardSpelling('don’t')).toBe('dont');
  });

  it('leaves words that only look like British spellings alone', () => {
    for (const word of ['hour', 'your', 'four', 'are', 'where', 'telling']) {
      expect(standardSpelling(word), word).toBe(word);
    }
  });
});

describe('searchWords', () => {
  it('lists each word once, most used first, with hyphenated words both as one and as their parts', () => {
    expect(searchWords('Colour-blind users, colour blind users, users')).toEqual([
      'users',
      'color',
      'blind',
      'colorblind',
    ]);
  });

  it('leaves out where links go', () => {
    expect(searchWords('[WebAIM](https://webaim.org/techniques) and https://example.com')).toEqual([
      'webaim',
      'and',
    ]);
  });
});

describe('searchToolkit', () => {
  const ENTRIES = [
    entry('Colour-blind Series: Protanopia', 'A form of colour blindness.'),
    entry('Dark mode', 'A highlight about dark mode.'),
    entry('Highlights', 'Posts that highlight topics.'),
    entry('Meetings', 'Making meetings inclusive.'),
  ];

  it('finds nothing for a single character, as it would match nearly everything', () => {
    expect(searchToolkit(ENTRIES, 'd')).toEqual([]);
    expect(searchToolkit(ENTRIES, ' d ')).toEqual([]);
    expect(searchToolkit(ENTRIES, 'da').length).toBeGreaterThan(0);
  });

  it('finds entries with every word in their title or description, in any order', () => {
    expect(titles(searchToolkit(ENTRIES, 'MODE dark'))).toEqual(['Dark mode']);
  });

  it('puts entries with the words in their title before those with them in the description', () => {
    expect(titles(searchToolkit(ENTRIES, 'highlight'))).toEqual(['Highlights', 'Dark mode']);
  });

  it('finds colour-blind however it’s spelt or written', () => {
    for (const query of [
      'colourblind',
      'colorblind',
      'colour-blind',
      'color-blind',
      'colour blind',
    ]) {
      expect(titles(searchToolkit(ENTRIES, query)), query).toEqual([
        'Colour-blind Series: Protanopia',
      ]);
    }
  });

  it('finds words in the full text, after titles and descriptions, those using them most first', () => {
    const index = withOthers({
      '/highlights': 'Every highlight, and much, much more, including ADHD.',
      '/meetings': 'ADHD and meetings: ADHD makes long meetings hard.',
      '/dark-mode': 'Dark mode suits some people with ADHD.',
    });

    expect(titles(searchToolkit(ENTRIES, 'adhd'))).toEqual([]);
    expect(titles(searchToolkit(ENTRIES, 'adhd', index))).toEqual([
      'Meetings',
      'Dark mode',
      'Highlights',
    ]);
  });

  it('only finds words in the full text if no more than a quarter of resources use them', () => {
    const index = withOthers(
      {
        '/meetings': 'Accessibility in meetings, for people with dyslexia.',
        '/dark-mode': 'Accessibility of dark mode, for people with dyslexia.',
      },
      'Accessibility of other things.',
    );

    expect(titles(searchToolkit(ENTRIES, 'dyslexia', index))).toEqual(['Meetings', 'Dark mode']);
    expect(searchToolkit(ENTRIES, 'accessibility', index)).toEqual([]);
  });

  it('leaves out common words, such as "the"', () => {
    const index = withOthers({ '/meetings': 'The best meetings.' });

    expect(searchToolkit(ENTRIES, 'the', index)).toEqual([]);
    expect(titles(searchToolkit(ENTRIES, 'the dark mode', index))).toEqual(['Dark mode']);
  });

  it('matches the start of words, so "blind" finds blindness but "the" doesn’t find other', () => {
    expect(titles(searchToolkit(ENTRIES, 'blindness'))).toEqual([
      'Colour-blind Series: Protanopia',
    ]);
    expect(titles(searchToolkit(ENTRIES, 'lindness'))).toEqual([]);
    expect(titles(searchToolkit(ENTRIES, 'eetings'))).toEqual([]);
  });

  it('finds a word written as one when the text has it as 2 words', () => {
    const index = withOthers({ '/meetings': 'Share your screen and shot.' });

    expect(titles(searchToolkit(ENTRIES, 'screenshot', index))).toEqual(['Meetings']);
  });

  it('finds nothing until something is typed', () => {
    expect(searchToolkit(ENTRIES, '   ')).toEqual([]);
  });
});

describe('the real search index', () => {
  it('has the words of every ready resource’s full text', () => {
    const index = loadToolkitSearchIndex();

    expect(Object.keys(index).length).toBeGreaterThan(0);
    expect(
      Object.entries(index)
        .filter(([, words]) => words.includes('adhd'))
        .map(([path]) => path),
    ).toContain('/accessibility/highlights/neurodiversity-and-inclusive-design');
  });

  it('leaves out words too common to tell resources apart', () => {
    const allWords = Object.values(loadToolkitSearchIndex()).flatMap((words) => words.split(' '));

    for (const word of ['the', 'and', 'accessibility', 'screen']) {
      expect(allWords, word).not.toContain(word);
    }
  });
});
