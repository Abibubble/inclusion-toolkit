import type { ReactNode } from 'react';

import { Abbr } from '../components/Abbr';
import { Heading } from '../components/Heading';
import { Link } from '../components/Link';
import { PageContents, PageContentsSection, type PageSection } from '../components/PageContents';
import { PageHeading } from '../components/PageHeading';
import { Stack } from '../components/Stack';
import { Time } from '../components/Time';
import { ACCESSIBILITY_PATH, DISPLAY_SETTINGS_PATH, GLOSSARY_PATH } from '../content/navigation';
import { pageTitle } from '../content/site';
import { ACCESSIBILITY_REVIEWED, MANUAL_TESTING, NEW_ISSUE_URL } from '../content/statements';
import { pageMeta } from '../seo/pageMeta';
import type { Route } from './+types/accessibility-statement';
import styles from './accessibility-statement.module.css';

export function meta(): Route.MetaDescriptors {
  return pageMeta({
    title: pageTitle('Accessibility statement'),
    description:
      'How accessible this site is, what doesn’t work yet, how to report a problem, and display settings to make it work for you.',
    path: ACCESSIBILITY_PATH,
  });
}

const SECTIONS = {
  // Not called Display settings, as the footer has a link with that name to another page (WCAG 2.4.9)
  displaySettings: { id: 'display-settings', title: 'Change how the site looks' },
  howAccessible: { id: 'how-accessible', title: 'How accessible this site is' },
  whatsBeenDone: { id: 'whats-been-done', title: 'What’s been done to make it accessible' },
  knownIssues: { id: 'known-issues', title: 'Known issues' },
  otherSites: { id: 'other-sites', title: 'Content on other sites' },
  testing: { id: 'testing', title: 'How this site is tested' },
  reportAProblem: { id: 'report-a-problem', title: 'Report a problem' },
} satisfies Record<string, PageSection>;

interface KnownIssueProps {
  title: string;
  /** The success criteria it might fail, such as "1.1.1 Non-text Content, Level A" */
  criteria: string[];
  affects: string;
  workaround: ReactNode;
  plan: string;
}

function KnownIssue({ title, criteria, affects, workaround, plan }: KnownIssueProps) {
  return (
    <Stack gap={3}>
      <Heading level={3}>{title}</Heading>
      <dl className={styles.details}>
        <div>
          <dt>{criteria.length === 1 ? 'Success criterion' : 'Success criteria'}</dt>
          {criteria.map((criterion) => (
            <dd key={criterion}>{criterion}</dd>
          ))}
        </div>
        <div>
          <dt>Who it affects</dt>
          <dd>{affects}</dd>
        </div>
        <div>
          <dt>How to get around it</dt>
          <dd>{workaround}</dd>
        </div>
        <div>
          <dt>What’s being done about it</dt>
          <dd>{plan}</dd>
        </div>
      </dl>
    </Stack>
  );
}

export default function Accessibility() {
  return (
    <Stack gap={6}>
      <Stack gap={5}>
        <PageHeading>Accessibility statement</PageHeading>
        <p>
          This site is for everyone. This page explains how accessible it is, what doesn’t work yet,
          and how to report a problem. You can also change how the site looks, to make it easier for
          you to use.
        </p>
        <PageContents sections={Object.values(SECTIONS)} />
      </Stack>

      <PageContentsSection section={SECTIONS.displaySettings}>
        <p>
          You can change the theme, text size, spacing, font and motion, to make the site easier for
          you to use. Your choices are saved in this browser only.
        </p>
        <p className={styles.standalone}>
          <Link to={DISPLAY_SETTINGS_PATH}>Change the display settings</Link>
        </p>
      </PageContentsSection>

      <PageContentsSection section={SECTIONS.howAccessible}>
        <p>
          This site aims to meet the <Abbr name="WCAG" expand /> version 2.2 at Level AAA. That’s
          the highest level, and goes further than the Level AA most sites aim for.
        </p>
        <p>
          The web pages are written and tested to meet Level AAA. The files you can download might
          not fully meet it yet. The <a href={`#${SECTIONS.knownIssues.id}`}>known issues</a>{' '}
          explain this, and how to get around it.
        </p>
      </PageContentsSection>

      <PageContentsSection section={SECTIONS.whatsBeenDone}>
        <ul className={styles.list}>
          <li>
            Every resource has its own page with everything in it as text, including a description
            of each picture, chart and diagram. So you never need the files to use a resource.
          </li>
          <li>
            Text has a contrast ratio of at least 7 to 1 against its background, in every theme.
          </li>
          <li>
            You can change the theme, text size, spacing, font and motion in the{' '}
            <Link to={DISPLAY_SETTINGS_PATH}>display settings</Link>.
          </li>
          <li>The font is Atkinson Hyperlegible, which is designed to be easy to read.</li>
          <li>
            Everything works with a keyboard alone, and shows a clear outline around what’s focused.
          </li>
          <li>
            Pages fit screens as narrow as 320 pixels without scrolling sideways, so you can zoom in
            up to 400%.
          </li>
          <li>Nothing flashes, moves on its own or has a time limit.</li>
          <li>
            Every abbreviation is listed with what it stands for in the{' '}
            <Link to={`${GLOSSARY_PATH}#abbreviations`}>list of abbreviations</Link>.
          </li>
          <li>
            Technical words are explained in the <Link to={GLOSSARY_PATH}>glossary</Link>.
          </li>
        </ul>
      </PageContentsSection>

      <PageContentsSection section={SECTIONS.knownIssues}>
        <p>These are the parts of the site that might not meet Level AAA yet.</p>
        <KnownIssue
          title="The files haven’t all been checked for accessibility yet"
          criteria={[
            '1.1.1 Non-text Content, Level A',
            '1.3.1 Info and Relationships, Level A',
            '1.4.6 Contrast (Enhanced), Level AAA',
          ]}
          affects="People who use a screen reader or other assistive technology with the Word, PowerPoint and PDF files, and people who need high contrast."
          workaround="Each resource’s page on this site has everything in the files as text, including a description of each picture. Use the page instead of the files."
          plan="The files are being checked with an accessibility checker and a screen reader, and fixed where needed."
        />
      </PageContentsSection>

      <PageContentsSection section={SECTIONS.otherSites}>
        <p>
          Some links go to other sites, such as guidance from other organisations. They’re marked
          with an arrow icon, and screen readers hear “external site”. Other sites aren’t covered by
          this statement, and might not be as accessible as this one.
        </p>
      </PageContentsSection>

      <PageContentsSection section={SECTIONS.testing}>
        <p>
          Every page and component is checked automatically with axe, an accessibility testing tool,
          each time the site changes. Pages are checked in the browser engines behind Chrome,
          Firefox and Safari, on wide and narrow screens, and with the largest text and widest
          spacing in the display settings.
        </p>
        {MANUAL_TESTING.length > 0 ? (
          <>
            <p>
              Automated tools only find some problems, so the site is also tested by hand, using:
            </p>
            <ul className={styles.list}>
              {MANUAL_TESTING.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : (
          <p>
            Automated tools only find some problems, so the site is also being tested by hand with
            screen readers and other assistive technology. What’s been used will be listed here.
          </p>
        )}
        <p>
          This statement was last checked on <Time date={ACCESSIBILITY_REVIEWED} />.
        </p>
      </PageContentsSection>

      <PageContentsSection section={SECTIONS.reportAProblem}>
        <p>
          If something on this site doesn’t work for you, or you need something in a different
          format, please <Link href={NEW_ISSUE_URL}>report it on GitHub</Link>. You need a free
          GitHub account to do this.
        </p>
        <p>
          You don’t need to say anything about a disability. It helps to know which page you were on
          and what you were trying to do. If you’re happy to share it, it also helps to know what
          you were using, such as your browser or screen reader.
        </p>
      </PageContentsSection>
    </Stack>
  );
}
