import { useEffect, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router';

import { PageContents, PageContentsSection, type PageSection } from '../components/PageContents';
import { PageHeading } from '../components/PageHeading';
import { SearchBox } from '../components/SearchBox';
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

/** Below this width, words show as a list that opens, not a table */
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

interface GlossaryRow {
  term: string;
  definition: string;
  id?: string;
}

interface GlossaryListProps {
  rows: readonly GlossaryRow[];
  headings: readonly [term: string, definition: string];
  empty: string;
  smallScreen: boolean;
}

function GlossaryList({ rows, headings, empty, smallScreen }: GlossaryListProps) {
  if (rows.length === 0) return <p>{empty}</p>;

  if (smallScreen) {
    return (
      <ul className={styles.terms}>
        {rows.map(({ term, definition, id }) => (
          <li key={term}>
            {/* Each toolkit page links its first use of the term here */}
            <details id={id} className={styles.term}>
              <summary>{term}</summary>
              <p>{definition}</p>
            </details>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th scope="col">{headings[0]}</th>
          <th scope="col">{headings[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ term, definition, id }) => (
          <tr key={term}>
            <th scope="row" id={id}>
              {term}
            </th>
            <td>{definition}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Technical words (WCAG 3.1.3) and abbreviations (WCAG 3.1.4) used on the site, explained */
export default function Glossary() {
  const [query, setQuery] = useState('');
  const smallScreen = useSmallScreen();
  const { hash } = useLocation();

  const words = GLOSSARY.filter(({ term, definition }) => matches(query, term, definition));
  const abbreviations = ABBREVIATION_NAMES.filter((name) =>
    matches(query, name, ABBREVIATIONS[name]),
  );

  // Opens the linked word on small screens, and focuses it, including when the page first loads
  // with a hash
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

      <SearchBox
        label="Search the glossary"
        value={query}
        onChange={setQuery}
        status={resultsMessage(query, words.length, abbreviations.length)}
      />

      <PageContents sections={Object.values(SECTIONS)} />

      <PageContentsSection section={SECTIONS.words}>
        <GlossaryList
          rows={words.map(({ term, definition }) => ({ term, definition, id: glossaryId(term) }))}
          headings={['Word', 'What it means']}
          empty="No words match your search."
          smallScreen={smallScreen}
        />
      </PageContentsSection>

      <PageContentsSection section={SECTIONS.abbreviations}>
        <p>These are the abbreviations used on this site, and what they stand for.</p>
        <GlossaryList
          rows={abbreviations.map((name) => ({ term: name, definition: ABBREVIATIONS[name] }))}
          headings={['Abbreviation', 'What it stands for']}
          empty="No abbreviations match your search."
          smallScreen={smallScreen}
        />
      </PageContentsSection>
    </Stack>
  );
}
