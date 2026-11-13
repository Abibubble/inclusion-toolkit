import { Link } from '../components/Link';
import { PageContents, PageContentsSection, type PageSection } from '../components/PageContents';
import { PageHeading } from '../components/PageHeading';
import { TitleBand } from '../components/TitleBand';
import { Stack } from '../components/Stack';
import { Time } from '../components/Time';
import { DISPLAY_SETTINGS_PATH, PRIVACY_PATH } from '../content/navigation';
import { pageTitle } from '../content/site';
import { NEW_ISSUE_URL, PRIVACY_UPDATED } from '../content/statements';
import { pageMeta } from '../seo/pageMeta';
import type { Route } from './+types/privacy';

export function meta(): Route.MetaDescriptors {
  return pageMeta({
    title: pageTitle('Privacy'),
    description:
      'What information this site collects, and what happens to it. There’s no tracking, analytics, or advertising.',
    path: PRIVACY_PATH,
  });
}

const SECTIONS = {
  whatsCollected: { id: 'whats-collected', title: 'What this site collects' },
  displaySettings: { id: 'display-settings-storage', title: 'What’s saved in your browser' },
  noTracking: { id: 'no-tracking', title: 'No tracking' },
  otherSites: { id: 'other-sites', title: 'Other sites' },
  hosting: { id: 'hosting', title: 'Hosting' },
  questions: { id: 'questions', title: 'Questions' },
  changes: { id: 'changes', title: 'Changes to this notice' },
} satisfies Record<string, PageSection>;

export default function Privacy() {
  return (
    <Stack gap={6}>
      <TitleBand>
        <Stack gap={5}>
          <PageHeading>Privacy</PageHeading>
          <p>This notice explains what information this site collects, and what happens to it.</p>
          <p>
            In short, this site doesn’t collect any personal information. There’s no tracking,
            analytics, or advertising, and no cookies.
          </p>
        </Stack>
      </TitleBand>
      <PageContents sections={Object.values(SECTIONS)} />

      <PageContentsSection section={SECTIONS.whatsCollected}>
        <p>
          Nothing. There are no forms, no accounts, and no sign-up. You can use every page and
          download every file without telling anyone who you are.
        </p>
      </PageContentsSection>

      <PageContentsSection section={SECTIONS.displaySettings}>
        <p>
          If you change the <Link to={DISPLAY_SETTINGS_PATH}>display settings</Link>, your choices
          are saved in your browser’s local storage, so they’re remembered next time. They’re only
          your preferences, such as the theme and text size, and nothing personal.
        </p>
        <p>
          They stay in your browser and are never sent anywhere. Local storage isn’t a cookie, and
          nothing else on the site uses it. To remove them, choose “Reset to defaults” in the
          display settings, or clear this site’s data in your browser.
        </p>
      </PageContentsSection>

      <PageContentsSection section={SECTIONS.noTracking}>
        <p>
          This site doesn’t use cookies, analytics, or advertising. It doesn’t record which pages
          you visit, which files you download, or what you search for, and doesn’t track you across
          other sites. Search works entirely in your browser.
        </p>
      </PageContentsSection>

      <PageContentsSection section={SECTIONS.otherSites}>
        <p>
          Links to other sites are marked with an arrow icon. Those sites have their own privacy
          policies.
        </p>
      </PageContentsSection>

      <PageContentsSection section={SECTIONS.hosting}>
        <p>
          This site is hosted by GitHub Pages. When you visit, GitHub logs your internet address and
          stores it for security purposes. Those logs aren’t shared with this site, and aren’t used
          to identify anyone. You can read{' '}
          <Link href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
            GitHub’s privacy statement
          </Link>
          .
        </p>
      </PageContentsSection>

      <PageContentsSection section={SECTIONS.questions}>
        <p>
          If you have a question about this notice, you can{' '}
          <Link href={NEW_ISSUE_URL}>ask a question on GitHub</Link>. You need a free GitHub account
          to do this, and what you write there is public.
        </p>
      </PageContentsSection>

      <PageContentsSection section={SECTIONS.changes}>
        <p>
          If anything changes, this page will be updated. It was last updated on{' '}
          <Time date={PRIVACY_UPDATED} />.
        </p>
      </PageContentsSection>
    </Stack>
  );
}
