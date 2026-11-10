import type { Meta, StoryObj } from '@storybook/react-vite';

import { ErrorPage } from '../ErrorPage';
import { PageHeading } from '../PageHeading';
import { SiteShell } from './SiteShell';

const meta = {
  title: 'Layout/SiteShell',
  component: SiteShell,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SiteShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithAPage: Story = {
  args: {
    children: (
      <>
        <PageHeading>About</PageHeading>
        <p>
          The layout every page shares: a skip link, the header and navigation, the main content and
          the footer.
        </p>
      </>
    ),
  },
  parameters: { router: { path: '/about' } },
};

export const WithTheErrorPage: Story = {
  args: { children: <ErrorPage /> },
};
