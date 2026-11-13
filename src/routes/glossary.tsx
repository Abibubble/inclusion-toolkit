import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router';

import { Button } from '../components/Button';
import { PageContents, PageContentsSection, type PageSection } from '../components/PageContents';
import { PageHeading } from '../components/PageHeading';
import { TitleBand } from '../components/TitleBand';
import { Stack } from '../components/Stack';
import { ABBREVIATIONS, type Abbreviation } from '../content/abbreviations';
import { GLOSSARY, glossaryId } from '../content/glossary';
import { GLOSSARY_PATH } from '../content/navigation';
import { MIN_SEARCH_LENGTH, isLongEnough } from '../content/toolkitSearch';
import { focusById } from '../hooks/useFocusOnNavigation';
import { pageTitle } from '../content/site';
import { pageMeta } from '../seo/pageMeta';
import type { Route } from './+types/glossary';
import styles from './glossary.module.css';

export function meta(): Route.MetaDescriptors {
  return pageMeta({
    title: pageTitle('Glossary'),
    description:
      'Technical words used on this site, explained in plain words, and what each abbreviation stands for.',
    path: GLOSSARY_PATH,
  });
}

const SECTIONS = {
  words: { id: 'words', title: 'Technical words' },
  abbreviations: { id: 'abbreviations', title: 'Abbreviations' },
} satisfies Record<string, PageSection>;

const ABBREVIATION_NAMES = Object.keys(ABBREVIATIONS) as Abbreviation[];

/** Screens narrower than this show the words as a list that opens one at a time, not a table */
const SMALL_SCREEN = '(width < 48rem)';

function watchScreen(onChange: () => void): () => void {
  const query = window.matchMedia(SMALL_SCREEN);
  query.addEventListener('change', onChange);
  return () => {
    query.removeEventListener('change', onChange);
  };
}

/**
 * Whether the screen is small. The prerendered page, and browsers without matchMedia, get the
 * table, which works at every size
 */
function useSmallScreen(): boolean {
  return useSyncExternalStore(
    (onChange) =>
      typeof window.matchMedia === 'function' ? watchScreen(onChange) : () => undefined,
    () => typeof window.matchMedia === 'function' && window.matchMedia(SMALL_SCREEN).matches,
    () => false,
  );
}

/** Lower case, with curly apostrophes straightened, so "doesn't" finds "doesn’t" */
function normalise(text: string): string {
  return text.toLowerCase().replace(/[‘’]/g, "'").trim();
}

function isSearch(query: string): boolean {
  return isLongEnough(normalise(query));
}

function matches(query: string, ...texts: string[]): boolean {
  return !isSearch(query) || texts.some((text) => normalise(text).includes(normalise(query)));
}

function count(number: number, one: string, many: string): string {
  return `${String(number)} ${number === 1 ? one : many}`;
}

function resultsMessage(query: string, words: number, abbreviations: number): string {
  if (query.trim() === '') return '';
  if (!isSearch(query)) return `Type at least ${String(MIN_SEARCH_LENGTH)} characters to search.`;
  if (words + abbreviations === 0) return `No words or abbreviations match “${query.trim()}”.`;
  return `${count(words, 'word', 'words')} and ${count(abbreviations, 'abbreviation', 'abbreviations')} match “${query.trim()}”.`;
}

/** Technical words (WCAG 3.1.3) and abbreviations (WCAG 3.1.4) used on the site, explained */
export default function Glossary() {
  const searchId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const smallScreen = useSmallScreen();
  const { hash } = useLocation();

  const words = GLOSSARY.filter(({ term, definition }) => matches(query, term, definition));
  const abbreviations = ABBREVIATION_NAMES.filter((name) =>
    matches(query, name, ABBREVIATIONS[name]),
  );

  // A link from a toolkit page to a word opens that word, on small screens where it's closed, and
  // moves focus to it. Links in the toolkit text load this page afresh, so the site's focus
  // handling for moving between pages doesn't do this. It runs again if the layout changes
  useEffect(() => {
    if (hash === '') return;
    const id = decodeURIComponent(hash.slice(1));
    const target = document.getElementById(id);
    if (smallScreen && target instanceof HTMLDetailsElement) {
      target.open = true;
      target.scrollIntoView();
    }
    focusById(id);
  }, [hash, smallScreen]);

  return (
    <Stack gap={6}>
      <TitleBand>
        <Stack gap={4}>
          <PageHeading>Glossary</PageHeading>
          <p>
            These are the technical words and abbreviations used on this site, explained in plain
            words.
          </p>
        </Stack>
      </TitleBand>

      {/* Search needs JavaScript, so without it the search box is hidden and everything shows */}
      <div role="search" className={styles.search}>
        <label htmlFor={searchId} className={styles.label}>
          Search the glossary
        </label>
        <div className={styles.searchRow}>
          <input
            ref={input}
            id={searchId}
            type="search"
            className={styles.input}
            value={query}
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
          {query !== '' && (
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('');
                input.current?.focus();
              }}
            >
              Clear search
            </Button>
          )}
        </div>
        <p role="status" className={styles.status}>
          {resultsMessage(query, words.length, abbreviations.length)}
        </p>
      </div>

      <PageContents sections={Object.values(SECTIONS)} />

      <PageContentsSection section={SECTIONS.words}>
        {words.length === 0 ? (
          <p>No words match your search.</p>
        ) : smallScreen ? (
          // On small screens, each word opens to show what it means, so the list stays short
          <ul className={styles.terms}>
            {words.map(({ term, definition }) => (
              <li key={term}>
                {/* Each toolkit page links its first use of the term here */}
                <details id={glossaryId(term)} className={styles.term}>
                  <summary>{term}</summary>
                  <p>{definition}</p>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Word</th>
                <th scope="col">What it means</th>
              </tr>
            </thead>
            <tbody>
              {words.map(({ term, definition }) => (
                <tr key={term}>
                  {/* Each toolkit page links its first use of the term here */}
                  <th scope="row" id={glossaryId(term)}>
                    {term}
                  </th>
                  <td>{definition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PageContentsSection>

      <PageContentsSection section={SECTIONS.abbreviations}>
        <p>These are the abbreviations used on this site, and what they stand for.</p>
        {abbreviations.length === 0 ? (
          <p>No abbreviations match your search.</p>
        ) : smallScreen ? (
          // On small screens, each abbreviation opens to show what it stands for
          <ul className={styles.terms}>
            {abbreviations.map((name) => (
              <li key={name}>
                <details className={styles.term}>
                  <summary>{name}</summary>
                  <p>{ABBREVIATIONS[name]}</p>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Abbreviation</th>
                <th scope="col">What it stands for</th>
              </tr>
            </thead>
            <tbody>
              {abbreviations.map((name) => (
                <tr key={name}>
                  <th scope="row">{name}</th>
                  <td>{ABBREVIATIONS[name]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PageContentsSection>
    </Stack>
  );
}
