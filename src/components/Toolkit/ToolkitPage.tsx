import { type ReactNode, useId } from 'react';

import {
  PICTURE_SIZE,
  PICTURE_WIDTHS,
  type ToolkitFolder,
  type ToolkitItem,
  picturePath,
  toolkitPath,
} from '../../content/toolkit';
import { sectionResources } from '../../content/toolkitFilters';
import { cx } from '../../utils/cx';
import type { ToolkitPageData } from '../../content/toolkitPage';
import { Breadcrumbs } from '../Breadcrumbs';
import { Heading } from '../Heading';
import { Link } from '../Link';
import { PageHeading } from '../PageHeading';
import { TitleBand } from '../TitleBand';
import { Stack } from '../Stack';
import { Time } from '../Time';
import { RichText } from '../RichText';
import styles from './Toolkit.module.css';
import { ToolkitFileCard, ToolkitFileLinks, ToolkitSectionCard, ToolkitTags } from './ToolkitCards';
import { ToolkitFilters } from './ToolkitFilters';
import { ToolkitSearch } from './ToolkitSearch';

const { BASE_URL } = import.meta.env;

type PageData<Kind extends ToolkitPageData['kind']> = Extract<ToolkitPageData, { kind: Kind }>;

interface CardSectionProps {
  title: string;
  intro?: string;
  /** Fewer, wider cards, which share the full width */
  wide?: boolean;
  children: ReactNode;
}

function CardSection({ title, intro, wide = false, children }: CardSectionProps) {
  const headingId = useId();

  return (
    <Stack as="section" gap={4} aria-labelledby={headingId}>
      <Heading level={2} id={headingId}>
        {title}
      </Heading>
      {intro && <p>{intro}</p>}
      <ul role="list" className={cx(styles.cards, wide && styles.wideCards)}>
        {children}
      </ul>
    </Stack>
  );
}

function FileCards({ items, slugs }: { items: readonly ToolkitItem[]; slugs: readonly string[] }) {
  return items.map((item) => (
    <li key={item.slug}>
      <ToolkitFileCard item={item} path={toolkitPath([...slugs, item.slug])} />
    </li>
  ));
}

function ToolkitHome({ data }: { data: PageData<'home'> }) {
  const { toolkit, startHere } = data;

  return (
    <Stack gap={6}>
      <TitleBand>
        <Stack gap={4}>
          <PageHeading>{toolkit.title}</PageHeading>
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
      {toolkit.folders.length === 0 && toolkit.items.length === 0 && (
        <p>Resources are coming here soon.</p>
      )}
      {startHere.length > 0 && (
        <CardSection title="Start here" intro="Good places to begin, whatever your role.">
          {startHere.map(({ item, path }) => (
            <li key={path}>
              <ToolkitFileCard item={item} path={path} />
            </li>
          ))}
        </CardSection>
      )}
      {toolkit.folders.length > 0 && (
        <CardSection title="Browse the toolkit" wide>
          {toolkit.folders.map((section) => (
            <li key={section.slug}>
              <ToolkitSectionCard section={section} path={toolkitPath([section.slug])} />
            </li>
          ))}
        </CardSection>
      )}
      {toolkit.items.length > 0 && (
        <CardSection title="Templates and checklists" intro="Ready to use, for any team.">
          <FileCards items={toolkit.items} slugs={[]} />
        </CardSection>
      )}
    </Stack>
  );
}

/** A section, such as Accessibility, lists all its resources in one list that can be filtered */
function ToolkitSectionContents({ section, slugs }: { section: ToolkitFolder; slugs: string[] }) {
  const { resources, allInOne } = sectionResources(section, slugs);

  return (
    <>
      {allInOne.length > 0 && (
        <CardSection title="Everything in one file">
          {allInOne.map(({ item, path }) => (
            <li key={path}>
              <ToolkitFileCard item={item} path={path} />
            </li>
          ))}
        </CardSection>
      )}
      <ToolkitFilters section={section} resources={resources} />
    </>
  );
}

function ToolkitFolderPage({ data }: { data: PageData<'folder'> }) {
  const isSection = data.folder.folders.length > 0;

  return (
    <Stack gap={6}>
      <TitleBand>
        <Stack gap={4}>
          <Breadcrumbs trail={data.trail} current={data.folder.title} />
          <PageHeading>{data.folder.title}</PageHeading>
          <p>{data.folder.description}</p>
        </Stack>
      </TitleBand>
      {isSection ? (
        <ToolkitSectionContents section={data.folder} slugs={data.slugs} />
      ) : (
        <CardSection title="Resources">
          <FileCards items={data.folder.items} slugs={data.slugs} />
        </CardSection>
      )}
    </Stack>
  );
}

/**
 * Shows what the file looks like. Everything in it is also in the page's text, so the picture's
 * own text is only there as a preview of the file (WCAG 1.4.9)
 */
function ToolkitPicture({ item, picture }: { item: ToolkitItem; picture: string }) {
  const kind = item.versions.some(({ name }) => name === 'Infographic')
    ? 'infographic'
    : 'visual summary';
  const url = (width: number) => `${BASE_URL}${picturePath(picture, width)}`;

  return (
    <figure className={styles.picture}>
      <img
        src={url(PICTURE_SIZE.width)}
        srcSet={PICTURE_WIDTHS.map((width) => `${url(width)} ${String(width)}w`).join(', ')}
        sizes={`(min-width: ${String(PICTURE_SIZE.width)}px) ${String(PICTURE_SIZE.width)}px, 100vw`}
        width={PICTURE_SIZE.width}
        height={PICTURE_SIZE.height}
        alt={`The ${item.title} ${kind}.`}
      />
      <figcaption className={styles.meta}>
        A preview of the {kind}. Everything in it is also in the section{' '}
        <Link to="#whats-in-it">What’s in it</Link>.
      </figcaption>
    </figure>
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
          <ToolkitTags item={item} />
        </Stack>
      </TitleBand>
      {item.picture && <ToolkitPicture item={item} picture={item.picture} />}
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
