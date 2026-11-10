import { PageContents, PageContentsSection, type PageSection } from '../components/PageContents';
import { PageHeading } from '../components/PageHeading';
import { Stack } from '../components/Stack';
import { ABBREVIATIONS, type Abbreviation } from '../content/abbreviations';
import { GLOSSARY } from '../content/glossary';
import { GLOSSARY_PATH } from '../content/navigation';
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

/** Technical words (WCAG 3.1.3) and abbreviations (WCAG 3.1.4) used on the site, explained */
export default function Glossary() {
  return (
    <Stack gap={6}>
      <Stack gap={4}>
        <PageHeading>Glossary</PageHeading>
        <p>
          These are the technical words and abbreviations used on this site, explained in plain
          words.
        </p>
        <PageContents sections={Object.values(SECTIONS)} />
      </Stack>

      <PageContentsSection section={SECTIONS.words}>
        <dl className={styles.definitions}>
          {GLOSSARY.map(({ term, definition }) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{definition}</dd>
            </div>
          ))}
        </dl>
      </PageContentsSection>

      <PageContentsSection section={SECTIONS.abbreviations}>
        <p>These are the abbreviations used on this site, and what they stand for.</p>
        <dl className={styles.abbreviations}>
          {ABBREVIATION_NAMES.map((name) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{ABBREVIATIONS[name]}</dd>
            </div>
          ))}
        </dl>
      </PageContentsSection>
    </Stack>
  );
}
