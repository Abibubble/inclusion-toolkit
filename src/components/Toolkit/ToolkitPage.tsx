import { type ReactNode, useId } from 'react';

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

type PageData<Kind extends ToolkitPageData['kind']> = Extract<ToolkitPageData, { kind: Kind }>;

function CardSection({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId();

  return (
    <Stack as="section" gap={4} aria-labelledby={headingId}>
      <Heading level={2} id={headingId}>
        {title}
      </Heading>
      <ul role="list" className={styles.cards}>
        {children}
      </ul>
    </Stack>
  );
}

function ToolkitContents({ folder, slugs }: { folder: ToolkitFolder; slugs: readonly string[] }) {
  if (folder.folders.length === 0 && folder.items.length === 0) {
    return <p>Resources are coming here soon.</p>;
  }

  return (
    <>
      {folder.folders.length > 0 && (
        <CardSection title="Folders">
          {folder.folders.map((child) => (
            <li key={child.slug}>
              <ToolkitFolderCard folder={child} path={toolkitPath([...slugs, child.slug])} />
            </li>
          ))}
        </CardSection>
      )}
      {folder.items.length > 0 && (
        <CardSection title="Files">
          {folder.items.map((item) => (
            <li key={item.slug}>
              <ToolkitFileCard item={item} path={toolkitPath([...slugs, item.slug])} />
            </li>
          ))}
        </CardSection>
      )}
    </>
  );
}

function ToolkitHome({ data }: { data: PageData<'home'> }) {
  return (
    <Stack gap={6}>
      <TitleBand>
        <Stack gap={4}>
          <PageHeading>{data.toolkit.title}</PageHeading>
          <p>
            These resources help make workplaces, meetings, and the web more accessible and
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

function ToolkitFolderPage({ data }: { data: PageData<'folder'> }) {
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

function ToolkitItemPage({ data }: { data: PageData<'item'> }) {
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

export function ToolkitPage({ data }: { data: ToolkitPageData }) {
  switch (data.kind) {
    case 'home':
      return <ToolkitHome data={data} />;
    case 'folder':
      return <ToolkitFolderPage data={data} />;
    case 'item':
      return <ToolkitItemPage data={data} />;
  }
}
