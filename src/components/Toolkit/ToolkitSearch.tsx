import { useId, useRef, useState } from 'react';

import {
  SEARCH_INDEX_PATH,
  type ToolkitSearchEntry,
  type ToolkitSearchIndex,
  searchToolkit,
  searchableWords,
} from '../../content/toolkitSearch';
import { Button } from '../Button';
import { Link } from '../Link';
import styles from './Toolkit.module.css';

const { BASE_URL } = import.meta.env;

/**
 * The words of every resource's full text, fetched the first time someone focuses the search box
 * or types in it, so the page itself stays small. Until it arrives, or if it can't be fetched,
 * search still finds titles and descriptions
 */
function useSearchIndex(): [ToolkitSearchIndex | undefined, () => void] {
  const [index, setIndex] = useState<ToolkitSearchIndex>();
  const requested = useRef(false);

  function load() {
    if (requested.current) return;
    requested.current = true;
    fetch(`${BASE_URL}${SEARCH_INDEX_PATH}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error())))
      .then((data: ToolkitSearchIndex) => {
        setIndex(data);
      })
      .catch(() => {
        // Try again next time, such as after a dropped connection
        requested.current = false;
      });
  }

  return [index, load];
}

function resultsMessage(query: string, count: number): string {
  if (query.trim() === '') return '';
  if (searchableWords(query).length === 0) {
    return `“${query.trim()}” is too common to search for. Try a more specific word.`;
  }
  if (count === 0) return `No results found for “${query.trim()}”.`;
  return count === 1 ? '1 result found.' : `${String(count)} results found.`;
}

/**
 * Finds folders and resources as you type, in their titles, descriptions and full text, with
 * British and American spellings finding each other (see src/content/toolkitSearch.ts). The
 * results are ordinary links in a list, so they work
 * with Tab, screen readers and voice control, and the number found is announced. Without
 * JavaScript, it's hidden, and the folders below lead to everything instead
 */
export function ToolkitSearch({ entries }: { entries: readonly ToolkitSearchEntry[] }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [index, loadIndex] = useSearchIndex();
  const results = searchToolkit(entries, query, index);

  return (
    <div role="search" className={styles.search}>
      <label htmlFor={id} className={styles.label}>
        Search resources
      </label>
      <div className={styles.searchRow}>
        <input
          ref={input}
          id={id}
          type="search"
          className={styles.input}
          value={query}
          autoComplete="off"
          onFocus={loadIndex}
          onChange={(event) => {
            loadIndex();
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
        {resultsMessage(query, results.length)}
      </p>
      {results.length > 0 && (
        <ul className={styles.results} aria-label="Search results">
          {results.map((result) => (
            <li key={result.path}>
              <Link to={result.path}>
                {result.title}
                {result.kind === 'folder' && ' (folder)'}
              </Link>
              <p>{result.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
