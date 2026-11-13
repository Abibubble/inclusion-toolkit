/**
 * Searching the Inclusion Toolkit. Every word is put into one standard spelling before it's
 * compared, so British and American spellings find each other (colour and color, organise and
 * organize, centre and center), and so do words written with or without a hyphen or space
 * (colour-blind, colour blind and colourblind)
 */

/** A folder or resource to search, with where it is */
export interface ToolkitSearchEntry {
  kind: 'folder' | 'item';
  title: string;
  description: string;
  path: string;
  /** The title of the folder a resource is in */
  folder?: string;
}

/**
 * Each resource's distinctive words, by its address, in their standard spelling, for searching
 * its full text (see searchIndex)
 */
export type ToolkitSearchIndex = Record<string, string>;

/** Where the index is, under the site's address. It's only fetched once someone starts searching */
export const SEARCH_INDEX_PATH = 'search.json';

/** Spellings with no rule to follow, as the American spelling they match */
const SPELLINGS: Record<string, string> = {
  ageing: 'aging',
  aluminium: 'aluminum',
  anaemia: 'anemia',
  cheque: 'check',
  draught: 'draft',
  encyclopaedia: 'encyclopedia',
  enrolment: 'enrollment',
  foetus: 'fetus',
  fulfil: 'fulfill',
  grey: 'gray',
  jewellery: 'jewelry',
  judgement: 'judgment',
  kerb: 'curb',
  learnt: 'learned',
  manoeuvre: 'maneuver',
  maths: 'math',
  mould: 'mold',
  orientated: 'oriented',
  paediatric: 'pediatric',
  plough: 'plow',
  practise: 'practice',
  practised: 'practiced',
  practising: 'practicing',
  programme: 'program',
  programmes: 'programs',
  pyjamas: 'pajamas',
  sceptical: 'skeptical',
  skilful: 'skillful',
  spelt: 'spelled',
  tyre: 'tire',
};

/** The start of words spelt "our" in British English and "or" in American, such as colour */
const OUR_WORDS =
  /(armo|behavio|clamo|colo|endeavo|favo|flavo|glamo|harbo|hono|humo|labo|neighbo|odo|parlo|rigo|rumo|savo|splendo|valo|vigo)ur/g;

/** Words spelt "ce" in British English and "se" in American, such as licence */
const CE_WORDS = /(defen|licen|offen|preten)ce/g;

/**
 * A word in its standard spelling: lowercase, with no hyphens or apostrophes, and the American
 * spelling where the two differ. Both what's searched for and what's searched are spelt this way,
 * so it only has to be consistent, not always a real word
 */
export function standardSpelling(word: string): string {
  const plain = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  const known = SPELLINGS[plain];
  if (known) return known;

  return (
    plain
      .replace(OUR_WORDS, '$1r')
      .replace(CE_WORDS, '$1se')
      // organise, organised, organisation
      .replace(/is(e|es|ed|ing|er|ers|ation|ations)$/, 'iz$1')
      // analyse, paralysed
      .replace(/ys(e|es|ed|ing|er|ers)$/, 'yz$1')
      // centre, theatres, but not are or where
      .replace(/([bcdfghjklmnpqrstvwxz])re(s?)$/, '$1er$2')
      // catalogue, dialogues
      .replace(/ogue(s?)$/, 'og$1')
      // travelled, labelling, modeller, but not shorter words such as telling
      .replace(/^(.{3,}[ea])ll(ed|ing|er|ers)$/, '$1l$2')
  );
}

/**
 * Every word in some text, in its standard spelling, once each, with hyphenated words both as one
 * and as their parts. The most used come first
 */
export function searchWords(text: string): string[] {
  const words = new Map<string, number>();
  // Leave out where links go, which aren't words on the page
  const readable = text.replace(/\]\([^)]*\)/g, ']').replace(/https?:\/\/\S+/g, ' ');

  for (const word of readable.split(/[^\p{L}\p{N}'’-]+/u)) {
    const parts = word.split('-').filter(Boolean);
    for (const part of parts.length > 1 ? [...parts, word] : parts) {
      const spelt = standardSpelling(part);
      if (spelt) words.set(spelt, (words.get(spelt) ?? 0) + 1);
    }
  }
  // Most used first, so search can tell what a resource is mostly about
  return [...words.entries()].toSorted((a, b) => b[1] - a[1]).map(([word]) => word);
}

/**
 * Words too common to search for, in their standard spelling. They're left out of what's searched
 * for, so "the" doesn't find every resource
 */
const COMMON_WORDS = new Set(
  (
    'a an and are as at be but by can do for from has have how i if in into is it its me my no ' +
    'not of on or our so than that the their them then there these they this to us was we were ' +
    'what when where which who why will with you your'
  ).split(' '),
);

/**
 * The full text only counts for words that tell resources apart. A word used in more than this
 * share of resources, such as "accessibility", is only found in titles and descriptions
 */
const FULL_TEXT_MAX_SHARE = 0.25;

/**
 * The distinctive words of each resource's full text, most used first, by its address, for the
 * search index. Common words, and words used in more than a quarter of resources, are left out
 */
export function searchIndex(texts: Record<string, string>): ToolkitSearchIndex {
  const wordsOf = Object.entries(texts).map(([path, text]) => [path, searchWords(text)] as const);
  const resourcesUsing = new Map<string, number>();
  for (const [, words] of wordsOf) {
    for (const word of words) resourcesUsing.set(word, (resourcesUsing.get(word) ?? 0) + 1);
  }
  const most = wordsOf.length * FULL_TEXT_MAX_SHARE;

  return Object.fromEntries(
    wordsOf.map(([path, words]) => [
      path,
      words
        .filter((word) => !COMMON_WORDS.has(word) && (resourcesUsing.get(word) ?? 0) <= most)
        .join(' '),
    ]),
  );
}

/** The words searched for, in their standard spelling, without common words such as "the" */
export function searchableWords(query: string): string[] {
  return query
    .split(/\s+/)
    .map(standardSpelling)
    .filter((word) => word && !COMMON_WORDS.has(word));
}

/**
 * Where a word searched for is in some words, or -1. It has to be the start of a word, so "blind"
 * finds blindness, but "the" doesn't find other
 */
function findWord(words: string, word: string): number {
  return ` ${words}`.indexOf(` ${word}`);
}

/**
 * Whether a word searched for is in some words (see findWord). A word written as one, such as
 * colourblind, also finds the 2 words it's made of
 */
function hasWord(words: string, word: string): boolean {
  if (findWord(words, word) !== -1) return true;
  for (let split = 3; split <= word.length - 3; split += 1) {
    if (findWord(words, word.slice(0, split)) !== -1 && findWord(words, word.slice(split)) !== -1) {
      return true;
    }
  }
  return false;
}

/**
 * How far down a resource's words, most used first, the words searched for are, from 0 for the
 * most used to 1 for the least. A resource that uses the words a lot is mostly about them
 */
function usage(words: string, searched: readonly string[]): number {
  if (!words) return 1;
  const positions = searched.map((word) => {
    const found = findWord(words, word);
    return found === -1 ? 1 : found / words.length;
  });
  return Math.max(...positions);
}

/**
 * The folders and resources with every word searched for, in any order, in their title,
 * description or full text. Common words, such as "the", are left out. Those with every word in
 * the title come first, then the description, then the full text, where those that use the words
 * most come first
 */
export function searchToolkit(
  entries: readonly ToolkitSearchEntry[],
  query: string,
  index: ToolkitSearchIndex = {},
): ToolkitSearchEntry[] {
  const words = searchableWords(query);
  if (words.length === 0) return [];

  const ranked = entries.flatMap((entry) => {
    const title = searchWords(entry.title).join(' ');
    const summary = `${title} ${searchWords(entry.description).join(' ')}`;
    const fullText = `${summary} ${index[entry.path] ?? ''}`;
    const has = (text: string) => words.every((word) => hasWord(text, word));

    if (has(title)) return [{ entry, rank: 0, usage: 0 }];
    if (has(summary)) return [{ entry, rank: 1, usage: 0 }];
    if (has(fullText)) return [{ entry, rank: 2, usage: usage(index[entry.path] ?? '', words) }];
    return [];
  });

  return ranked.toSorted((a, b) => a.rank - b.rank || a.usage - b.usage).map(({ entry }) => entry);
}
