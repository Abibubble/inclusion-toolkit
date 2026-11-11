import { useId } from 'react';

import { type ToolkitFolder, toolkitPath } from '../../content/toolkit';
import type { ToolkitPageData } from '../../content/toolkitPage';
import { Breadcrumbs } from '../Breadcrumbs';
import { Heading } from '../Heading';
import { PageHeading } from '../PageHeading';
import { TitleBand } from '../TitleBand';
import { Stack } from '../Stack';
import { Time } from '../Time';
import { RichText } from '../RichText';
import styles from './Toolkit.module.css';
import { ToolkitFileCard, ToolkitFileLinks, ToolkitFolderCard } from './ToolkitCards';
import { ToolkitSearch } from './ToolkitSearch';

/** A folder's folders, then its resources, each under their own heading */
function ToolkitContents({ folder, slugs }: { folder: ToolkitFolder; slugs: readonly string[] }) {
  const foldersId = useId();
  const filesId = useId();

  if (folder.folders.length === 0 && folder.items.length === 0) {
    return <p>Resources are coming here soon.</p>;
  }

  return (
    <>
      {folder.folders.length > 0 && (
        <Stack as="section" gap={4} aria-labelledby={foldersId}>
          <Heading level={2} id={foldersId}>
            Folders
          </Heading>
          <ul role="list" className={styles.cards}>
            {folder.folders.map((child) => (
              <li key={child.slug}>
                <ToolkitFolderCard
                  folder={child}
                  path={toolkitPath([...slugs, child.slug])}
                  headingLevel={3}
                />
              </li>
            ))}
          </ul>
        </Stack>
      )}
      {folder.items.length > 0 && (
        <Stack as="section" gap={4} aria-labelledby={filesId}>
          <Heading level={2} id={filesId}>
            Files
          </Heading>
          <ul role="list" className={styles.cards}>
            {folder.items.map((item) => (
              <li key={item.slug}>
                <ToolkitFileCard
                  item={item}
                  path={toolkitPath([...slugs, item.slug])}
                  headingLevel={3}
                />
              </li>
            ))}
          </ul>
        </Stack>
      )}
    </>
  );
}

/** The Inclusion Toolkit: its main page with search, a folder, or a resource with its text */
export function ToolkitPage({ data }: { data: ToolkitPageData }) {
  if (data.kind === 'home') {
    return (
      <Stack gap={6}>
        <TitleBand>
          <Stack gap={4}>
            <PageHeading>{data.toolkit.title}</PageHeading>
            <p>
              These resources help make workplaces, meetings and the web more accessible and
              inclusive, covering accessibility and neurodiversity.
            </p>
            <p>
              They’re free for anyone to use, with no sign-up. Each one has its own page with
              everything in it as text, and files you can view or download.
            </p>
          </Stack>
        </TitleBand>
        <ToolkitSearch entries={data.search} />
        <ToolkitContents folder={data.toolkit} slugs={[]} />
      </Stack>
    );
  }

  if (data.kind === 'folder') {
    return (
      <Stack gap={6}>
        <TitleBand>
          <Stack gap={4}>
            <Breadcrumbs trail={data.trail} current={data.folder.title} />
            <PageHeading>{data.folder.title}</PageHeading>
            <p>{data.folder.description}</p>
          </Stack>
        </TitleBand>
        <ToolkitContents folder={data.folder} slugs={data.slugs} />
      </Stack>
    );
  }

  const { item } = data;
  return (
    <Stack gap={6}>
      <TitleBand>
        <Stack gap={4}>
          <Breadcrumbs trail={data.trail} current={item.title} />
          <Stack gap={2}>
            <PageHeading>{item.title}</PageHeading>
            <p className={styles.meta}>
              Last updated <Time date={item.updated} />
            </p>
          </Stack>
          <p>{item.description}</p>
        </Stack>
      </TitleBand>
      <Stack as="section" gap={4} aria-labelledby="files">
        <Heading level={2} id="files">
          Files
        </Heading>
        <ToolkitFileLinks item={item} />
      </Stack>
      <Stack as="section" gap={4} aria-labelledby="whats-in-it" className={styles.text}>
        <Heading level={2} id="whats-in-it">
          What’s in it
        </Heading>
        <RichText html={data.textHtml} />
      </Stack>
    </Stack>
  );
}
