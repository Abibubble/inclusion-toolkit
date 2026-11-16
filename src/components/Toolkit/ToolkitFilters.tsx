import { useId, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router';

import { AUDIENCES, TOPICS } from '../../content/tags';
import type { ToolkitFolder } from '../../content/toolkit';
import {
  NO_FILTERS,
  type ResourceFilters,
  type SectionResource,
  filterCount,
  filtersSearch,
  matchesFilters,
  readFilters,
  typeName,
  usedTags,
} from '../../content/toolkitFilters';
import { Button } from '../Button';
import { Heading } from '../Heading';
import { Stack } from '../Stack';
import styles from './Toolkit.module.css';
import { ToolkitFileCard } from './ToolkitCards';

/** False while the prerendered page hydrates, so its first render matches the HTML */
function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

interface CheckboxGroupProps<Value extends string> {
  legend: string;
  options: readonly { value: Value; label: string }[];
  ticked: readonly Value[];
  onChange: (ticked: Value[]) => void;
}

function CheckboxGroup<Value extends string>({
  legend,
  options,
  ticked,
  onChange,
}: CheckboxGroupProps<Value>) {
  return (
    <fieldset className={styles.filterGroup}>
      <legend className={styles.filterLegend}>{legend}</legend>
      <div className={styles.filterOptions}>
        {options.map(({ value, label }) => (
          <label key={value} className={styles.filterOption}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={ticked.includes(value)}
              onChange={(event) => {
                const { checked } = event.target;
                onChange(
                  options
                    .map((option) => option.value)
                    .filter((option) => (option === value ? checked : ticked.includes(option))),
                );
              }}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function statusMessage(shown: number, total: number, filtered: boolean): string {
  if (!filtered) return `Showing all ${String(total)} resources.`;
  if (shown === 0) return 'No resources match these filters. Untick some to see more.';
  return `Showing ${String(shown)} of ${String(total)} resources.`;
}

interface ToolkitFiltersProps {
  section: ToolkitFolder;
  resources: readonly SectionResource[];
}

/**
 * Filters a section's resources as boxes are ticked. The ticked boxes go in the address, so a list
 * can be shared, and Back returns to it. Without JavaScript, the filters are hidden and every
 * resource shows
 */
export function ToolkitFilters({ section, resources }: ToolkitFiltersProps) {
  const headingId = useId();
  const location = useLocation();
  const hydrated = useHydrated();
  const types = section.folders.map((folder) => ({
    value: folder.slug,
    label: typeName(section, folder),
  }));
  const [filters, setFilters] = useState(() =>
    readFilters(
      location.search,
      types.map(({ value }) => value),
    ),
  );
  const [openAtFirst] = useState(() => filterCount(filters) > 0);
  // Each message is new, so it's announced even when it's the same as the last (WCAG 4.1.3)
  const [messageKey, setMessageKey] = useState(0);

  const active = hydrated ? filters : NO_FILTERS;
  const ticked = filterCount(active);
  const shown = resources.filter((resource) => matchesFilters(resource, active));
  const tags = usedTags(resources);

  function update(next: ResourceFilters) {
    setFilters(next);
    setMessageKey((key) => key + 1);
    // Not a React Router navigation, which would move focus to the page heading
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${filtersSearch(next)}`,
    );
  }

  return (
    <Stack as="section" gap={4} aria-labelledby={headingId}>
      <Heading level={2} id={headingId}>
        All resources
      </Heading>
      {/* Open if the address has filters in it */}
      <details open={hydrated && openAtFirst} className={styles.disclosure}>
        <summary className={styles.disclosureSummary}>
          Filter by type, topic, or who it’s for
          {ticked > 0 && ` (${String(ticked)} ticked)`}
        </summary>
        <Stack gap={4} className={styles.filtersBody}>
          <p>Tick the boxes for what you need. The list changes as you tick them.</p>
          <CheckboxGroup
            legend="Type"
            options={types}
            ticked={active.types}
            onChange={(next) => {
              update({ ...filters, types: next });
            }}
          />
          <CheckboxGroup
            legend="Topic"
            options={tags.topics.map((topic) => ({ value: topic, label: TOPICS[topic] }))}
            ticked={active.topics}
            onChange={(next) => {
              update({ ...filters, topics: next });
            }}
          />
          <CheckboxGroup
            legend="Who it’s for"
            options={tags.audiences.map((audience) => ({
              value: audience,
              label: AUDIENCES[audience],
            }))}
            ticked={active.audiences}
            onChange={(next) => {
              update({ ...filters, audiences: next });
            }}
          />
          <div>
            <Button
              variant="secondary"
              onClick={() => {
                update(NO_FILTERS);
              }}
            >
              Clear filters
            </Button>
          </div>
        </Stack>
      </details>
      <p role="status" className={styles.filterStatus}>
        <span key={messageKey}>{statusMessage(shown.length, resources.length, ticked > 0)}</span>
      </p>
      {shown.length > 0 && (
        // Safari drops the list role without bullets
        <ul role="list" className={styles.cards}>
          {shown.map(({ item, path, type }) => (
            <li key={path}>
              <ToolkitFileCard
                item={item}
                path={path}
                type={types.find(({ value }) => value === type.slug)?.label}
              />
            </li>
          ))}
        </ul>
      )}
    </Stack>
  );
}
