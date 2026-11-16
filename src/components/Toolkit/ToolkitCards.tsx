import { useId } from 'react';

import {
  type ToolkitFolder,
  type ToolkitItem,
  type ToolkitVersion,
  downloadName,
  fileType,
} from '../../content/toolkit';
import {
  NO_FILTERS,
  type ResourceFilters,
  type SectionResource,
  filteredPath,
  matchesFilters,
  sectionResources,
  typeName,
  usedTags,
} from '../../content/toolkitFilters';
import { AUDIENCES, TOPICS, audienceNames, topicNames } from '../../content/tags';
import { cx } from '../../utils/cx';
import { Abbr } from '../Abbr';
import { Card } from '../Card';
import { Heading } from '../Heading';
import { Link } from '../Link';
import { ScreenReaderOnly } from '../ScreenReaderOnly';
import { Stack } from '../Stack';
import styles from './Toolkit.module.css';

const { BASE_URL } = import.meta.env;

/**
 * A resource's files. Hidden text says which resource, version and file each link is for
 * (WCAG 2.4.9), after the visible words so speech control users can say what they see (WCAG 2.5.3)
 */
export function ToolkitFileLinks({ item }: { item: ToolkitItem }) {
  const named = item.versions.length > 1;

  return (
    <div className={styles.versions}>
      {item.versions.map((version) => (
        <Card key={version.name} className={styles.versionCard}>
          {named ? (
            <ToolkitVersionSection title={item.title} version={version} />
          ) : (
            <ToolkitVersionFiles title={item.title} version={version} />
          )}
        </Card>
      ))}
    </div>
  );
}

/** A few words under each version's heading, so it's clear which one to choose */
const VERSION_SUMMARIES: Partial<Record<ToolkitVersion['name'], string>> = {
  'Full guide': 'Everything, in detail.',
  'Visual summary': 'The main points, as slides.',
};

function ToolkitVersionSection({ title, version }: { title: string; version: ToolkitVersion }) {
  const headingId = useId();
  const summary = VERSION_SUMMARIES[version.name];

  return (
    <Stack as="section" gap={2} aria-labelledby={headingId}>
      <div className={styles.versionTitle}>
        <Heading level={3} id={headingId}>
          {version.name}
        </Heading>
        {summary && <p className={styles.meta}>{summary}</p>}
      </div>
      <ToolkitVersionFiles title={title} version={version} named />
    </Stack>
  );
}

interface VersionFilesProps {
  title: string;
  version: ToolkitVersion;
  named?: boolean;
}

/** KB and MB are marked up as abbreviations (WCAG 3.1.4) */
function FileSize({ size }: { size: string }) {
  const match = /^([\d.]+)(KB|MB)$/.exec(size);
  if (!match) return size;
  return (
    <>
      {match[1]}
      <Abbr name={match[2] === 'MB' ? 'MB' : 'KB'} />
    </>
  );
}

function ToolkitVersionFiles({ title, version, named = false }: VersionFilesProps) {
  const about = named ? `${title}, ${version.name.toLowerCase()}` : title;

  return (
    // Safari drops the list role without bullets
    <ul role="list" className={styles.files}>
      {version.files.map((file) => {
        const type = fileType(file) ?? 'File';
        const href = `${BASE_URL}${file.path}`;

        // Plain text, not flex, so the spaces stay when copied or in reader view
        return (
          <li key={file.path} className={styles.file}>
            {type}{' '}
            <span className={styles.meta}>
              (<FileSize size={file.size} />)
            </span>
            :{' '}
            {type === 'PDF' && (
              <>
                {/* Same tab, so Back returns here (WCAG 3.2.5) */}
                <a href={href}>
                  View<ScreenReaderOnly>: {about}, PDF</ScreenReaderOnly>
                </a>{' '}
                or{' '}
              </>
            )}
            <a href={href} download={downloadName(file.path)}>
              Download
              {/* The size is already read just before the link */}
              <ScreenReaderOnly>
                : {about}, {type}
              </ScreenReaderOnly>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/** What each kind of resource is, by its folder's slug */
const TYPE_SUMMARIES: Partial<Record<string, string>> = {
  highlights: 'each covers one topic, with a full guide and slides.',
  infographics: 'each is one page about a condition.',
};

/** Such as "1 infographic" or "2 infographics" */
function kindName(type: string, count: number): string {
  const name = type.toLowerCase();
  return count === 1 ? name.replace(/s$/, '') : name;
}

interface BrowseLink {
  label: string;
  filters: Partial<ResourceFilters>;
}

interface BrowseListProps {
  summary: string;
  sectionTitle: string;
  path: string;
  resources: readonly SectionResource[];
  links: readonly BrowseLink[];
}

/** Links to a section's list with one box ticked. Hidden without JavaScript, like the filters */
function BrowseList({ summary, sectionTitle, path, resources, links }: BrowseListProps) {
  return (
    <details className={styles.disclosure}>
      <summary className={styles.disclosureSummary}>{summary}</summary>
      {/* Safari drops the list role without bullets */}
      <ul role="list" className={styles.browseLinks}>
        {links.map(({ label, filters }) => {
          const count = resources.filter((resource) =>
            matchesFilters(resource, { ...NO_FILTERS, ...filters }),
          ).length;

          return (
            <li key={label}>
              <Link to={filteredPath(path, filters)}>
                {label} ({count}){/* Both sections have links with these names (WCAG 2.4.9) */}
                <ScreenReaderOnly>, {sectionTitle}</ScreenReaderOnly>
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

interface SectionCardProps {
  section: ToolkitFolder;
  path: string;
}

/** A section on the home page, with how many of each kind of resource it has, and ways in */
export function ToolkitSectionCard({ section, path }: SectionCardProps) {
  const { resources } = sectionResources(section, [section.slug]);
  const tags = usedTags(resources);

  return (
    <Card as="article">
      <Stack gap={4}>
        <Heading level={3}>{section.title}</Heading>
        <p>{section.description}</p>
        <ul className={styles.kinds}>
          {section.folders.map((folder) => {
            const count = resources.filter(({ type }) => type.slug === folder.slug).length;
            return (
              <li key={folder.slug}>
                <strong>
                  {count} {kindName(typeName(section, folder), count)}:
                </strong>{' '}
                {TYPE_SUMMARIES[folder.slug] ?? folder.description}
              </li>
            );
          })}
        </ul>
        <p className={styles.standalone}>
          <Link to={path}>
            Browse all {resources.length} {section.title.toLowerCase()} resources
          </Link>
        </p>
        <BrowseList
          summary="Browse by topic"
          sectionTitle={section.title}
          path={path}
          resources={resources}
          links={tags.topics.map((topic) => ({
            label: TOPICS[topic],
            filters: { topics: [topic] },
          }))}
        />
        <BrowseList
          summary="Browse by who it’s for"
          sectionTitle={section.title}
          path={path}
          resources={resources}
          links={tags.audiences.map((audience) => ({
            label: AUDIENCES[audience],
            filters: { audiences: [audience] },
          }))}
        />
      </Stack>
    </Card>
  );
}

interface FileCardProps {
  item: ToolkitItem;
  path: string;
  /** Its folder, such as Highlights, for lists with more than one folder in them */
  type?: string | undefined;
}

/** Its files are on its own page, so the cards stay short */
export function ToolkitFileCard({ item, path, type }: FileCardProps) {
  return (
    <Card as="article" className={styles.linkCard}>
      <Stack gap={2}>
        <Heading level={3} className={styles.title}>
          <Link to={path} className={styles.cardLink}>
            {item.title}
            {/* Tells apart resources that share a title, such as the 2 ADHD ones (WCAG 2.4.9) */}
            {type && <ScreenReaderOnly>, {type}</ScreenReaderOnly>}
          </Link>
        </Heading>
        <p>{item.description}</p>
        <ToolkitTags item={item} type={type} />
      </Stack>
    </Card>
  );
}

/** The all-in-one resources have no topics, as they cover everything in their folder */
export function ToolkitTags({ item, type }: { item: ToolkitItem; type?: string | undefined }) {
  if (!type && item.topics.length === 0) return null;

  return (
    <div className={cx(styles.meta, styles.tags)}>
      {type && <p>Type: {type}</p>}
      {item.topics.length > 0 && (
        <>
          <p>Topics: {topicNames(item.topics).join(', ')}</p>
          <p>Who it’s for: {audienceNames(item.audiences).join(', ')}</p>
        </>
      )}
    </div>
  );
}
