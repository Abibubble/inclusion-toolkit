import { useId } from 'react';

import {
  type ToolkitFolder,
  type ToolkitItem,
  type ToolkitVersion,
  downloadName,
  fileType,
} from '../../content/toolkit';
import { Abbr } from '../Abbr';
import { Card } from '../Card';
import { type HeadingLevel, Heading } from '../Heading';
import { Link } from '../Link';
import { ScreenReaderOnly } from '../ScreenReaderOnly';
import { Stack } from '../Stack';
import { Time } from '../Time';
import styles from './Toolkit.module.css';

const { BASE_URL } = import.meta.env;

/**
 * A resource's files. Hidden text says which resource, version and file each link is for
 * (WCAG 2.4.9), after the visible words so speech control users can say what they see (WCAG 2.5.3)
 */
export function ToolkitFileLinks({ item }: { item: ToolkitItem }) {
  const [only] = item.versions;

  if (item.versions.length === 1 && only) {
    return (
      <div className={styles.versions}>
        <Card className={styles.versionCard}>
          <ToolkitVersionFiles title={item.title} version={only} />
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.versions}>
      {item.versions.map((version) => (
        <Card key={version.name} className={styles.versionCard}>
          <ToolkitVersionSection title={item.title} version={version} />
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
                <a href={`${BASE_URL}${file.path}`}>
                  View<ScreenReaderOnly>: {about}, PDF</ScreenReaderOnly>
                </a>{' '}
                or{' '}
              </>
            )}
            <a href={`${BASE_URL}${file.path}`} download={downloadName(file.path)}>
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
  headingLevel: HeadingLevel;
}

/** The whole card is clickable, but it stays one link and one Tab stop (see .cardLink) */
export function ToolkitFolderCard({ folder, path, headingLevel }: FolderCardProps) {
  return (
    <Card as="article" className={styles.linkCard}>
      <Stack gap={2}>
        <Heading level={headingLevel}>{folder.title}</Heading>
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
  headingLevel: HeadingLevel;
}

/** Its files are on its own page, so the cards stay short */
export function ToolkitFileCard({ item, path, headingLevel }: FileCardProps) {
  return (
    <Card as="article" className={styles.linkCard}>
      <Stack gap={2}>
        <Heading level={headingLevel} className={styles.title}>
          <Link to={path} className={styles.cardLink}>
            {item.title}
          </Link>
        </Heading>
        <p className={styles.meta}>
          Last updated <Time date={item.updated} />
        </p>
        <p>{item.description}</p>
      </Stack>
    </Card>
  );
}
