import { DisplaySettings } from '../components/DisplaySettings';
import { PageHeading } from '../components/PageHeading';
import { Stack } from '../components/Stack';
import { DISPLAY_SETTINGS_PATH } from '../content/navigation';
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
      <Stack gap={4}>
        <PageHeading>Display settings</PageHeading>
        {/* Links to the Accessibility page once it's added */}
        <p>Change how the site looks, to make it easier for you to use.</p>
      </Stack>
      <DisplaySettings />
    </Stack>
  );
}
