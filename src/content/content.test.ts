// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ABBREVIATIONS } from './abbreviations';
import { GLOSSARY } from './glossary';
import { TOOLKIT_RECORD } from './toolkit';
import { TOOLKIT_TEXT } from './toolkitPage';

const SRC = join(import.meta.dirname, '..');

/** The site's own pages and components, apart from tests and stories */
const PAGE_SOURCES = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
  .filter((file) => /\.tsx?$/.test(file) && !/\.(test|stories)\.tsx?$/.test(file))
  .map((file) => readFileSync(join(SRC, file), 'utf8'));

/** Every piece of text on the site: the toolkit's text, its titles and descriptions, and the pages */
const ALL_TEXT = [
  ...Object.values(TOOLKIT_TEXT),
  JSON.stringify(TOOLKIT_RECORD),
  ...PAGE_SOURCES.filter((source) => !source.includes('export const ABBREVIATIONS')),
].join('\n');

describe('glossary', () => {
  it('explains each term once, in alphabetical order, in full sentences', () => {
    const terms = GLOSSARY.map((entry) => entry.term);

    expect(terms).toEqual([...terms].sort((a, b) => a.localeCompare(b, 'en-GB')));
    expect(new Set(terms).size).toBe(terms.length);
    for (const { term, definition } of GLOSSARY) {
      expect(definition, term).toMatch(/^[A-Z].*\.$/);
    }
  });

  it('writes definitions without abbreviations, so they need no explaining themselves', () => {
    for (const { term, definition } of GLOSSARY) {
      expect(definition, term).not.toMatch(/\b[A-Z]{2,}\b/);
    }
  });

  it('only explains words the site uses', () => {
    const text = ALL_TEXT.toLowerCase();

    for (const { term } of GLOSSARY) {
      expect(text.includes(term.toLowerCase()), term).toBe(true);
    }
  });
});

describe('abbreviations', () => {
  it('only lists abbreviations the site uses', () => {
    for (const name of Object.keys(ABBREVIATIONS)) {
      expect(new RegExp(`\\b${name}s?\\b`).test(ALL_TEXT), name).toBe(true);
    }
  });
});
