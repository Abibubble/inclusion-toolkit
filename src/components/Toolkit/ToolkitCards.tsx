import { useId } from 'react';

import {
  type ToolkitFolder,
  type ToolkitItem,
  type ToolkitVersion,
  fileType,
} from '../../content/toolkit';
import { Card } from '../Card';
import { type HeadingLevel, Heading } from '../Heading';
import { Link } from '../Link';
import { ScreenReaderOnly } from '../ScreenReaderOnly';
import { Stack } from '../Stack';
import { Time } from '../Time';
import styles from './Toolkit.module.css';

const { BASE_URL } = import.meta.env;

/**
 * A resource's files, for its own page, under its "Files" heading. If it has more than one
 * version, each has a level 3 heading, so it's clear they're titles, and screen reader users can
 * move between them. Then there's a line for each file: what kind of file it is, its size, and
 * short links to view it (PDFs only, as browsers can show them) and download it. Screen readers
 * also hear which resource, version and file each link is for, so it makes sense read on its own
 * (WCAG 2.4.9). That comes after the visible words, so speech control users can say what they see
 * (WCAG 2.5.3)
 */
export function ToolkitFileLinks({ item }: { item: ToolkitItem }) {
  const [only] = item.versions;

  // With only one version, there's nothing to tell apart, so it isn't named
  if (item.versions.length === 1 && only) {
    return (
      <div className={styles.versions}>
        <Card className={styles.versionCard}>
          <ToolkitVersionFiles title={item.title} version={only} />
        </Card>
      </div>
    );
  }

  // Each version in a card of its own, side by side when there's room
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

function ToolkitVersionFiles({ title, version, named = false }: VersionFilesProps) {
  const about = named ? `${title}, ${version.name.toLowerCase()}` : title;

  return (
    <ul className={styles.files}>
      {version.files.map((file) => {
        const type = fileType(file) ?? 'File';

        // The line is ordinary text, not a flex layout, so the spaces between the words and links
        // stay when it's copied or shown in a reader view
        return (
          <li key={file.path} className={styles.file}>
            {type} <span className={styles.meta}>({file.size})</span>:{' '}
            {type === 'PDF' && (
              <>
                {/* It opens in the same tab, so people aren't moved somewhere they didn't
                    expect, and the Back button brings them back (WCAG 3.2.5) */}
                <a href={`${BASE_URL}${file.path}`}>
                  View<ScreenReaderOnly>: {about}, PDF</ScreenReaderOnly>
                </a>{' '}
                or{' '}
              </>
            )}
            <a href={`${BASE_URL}${file.path}`} download>
              Download
              <ScreenReaderOnly>
                : {about}, {type}, {file.size}
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

/**
 * The whole of a folder's or resource's card can be clicked, as it only has one link. It stays one
 * real link, so screen readers hear its name rather than everything in the card, and it's one Tab
 * stop. Its clickable area stretches over the card (see .cardLink)
 */
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

/**
 * A resource's card in a folder. Its files are on its own page, so the cards stay short. The whole
 * card can be clicked, as with folders' cards
 */
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
