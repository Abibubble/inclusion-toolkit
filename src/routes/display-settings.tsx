import { DisplaySettings } from '../components/DisplaySettings';
import { Link } from '../components/Link';
import { PageHeading } from '../components/PageHeading';
import { TitleBand } from '../components/TitleBand';
import { Stack } from '../components/Stack';
import { ACCESSIBILITY_PATH, DISPLAY_SETTINGS_PATH } from '../content/navigation';
import { pageTitle } from '../content/site';
import { pageMeta } from '../seo/pageMeta';
import type { Route } from './+types/display-settings';

export function meta(): Route.MetaDescriptors {
  return pageMeta({
    title: pageTitle('Display settings'),
    description:
      'Change the theme, text size, spacing, font and motion, to make this site easier for you to use.',
    path: DISPLAY_SETTINGS_PATH,
  });
}

export default function DisplaySettingsPage() {
  return (
    <Stack gap={6}>
      <TitleBand>
        <Stack gap={4}>
          <PageHeading>Display settings</PageHeading>
          <p>
            Change how the site looks, to make it easier for you to use. You can also read about{' '}
            <Link to={ACCESSIBILITY_PATH}>how accessible this site is</Link>.
          </p>
        </Stack>
      </TitleBand>
      <DisplaySettings />
    </Stack>
  );
}
