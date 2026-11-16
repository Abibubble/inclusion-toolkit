import { useId } from 'react';

import {
  type ToolkitFolder,
  type ToolkitItem,
  type ToolkitVersion,
  downloadName,
  fileType,
} from '../../content/toolkit';
import { audienceNames, topicNames } from '../../content/tags';
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

interface FolderCardProps {
  folder: ToolkitFolder;
  path: string;
}

/** The whole card is clickable, but it stays one link and one Tab stop (see .cardLink) */
export function ToolkitFolderCard({ folder, path }: FolderCardProps) {
  return (
    <Card as="article" className={styles.linkCard}>
      <Stack gap={2}>
        <Heading level={3}>{folder.title}</Heading>
        <p>{folder.description}</p>
        <p className={styles.standalone}>
          <Link to={path} className={styles.cardLink}>
            Open the {folder.title} folder
          </Link>
        </p>
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
