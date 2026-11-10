import type { Meta, StoryObj } from '@storybook/react-vite';

import { PageContents } from './PageContents';

const meta = {
  title: 'Layout/PageContents',
  component: PageContents,
  args: {
    sections: [
      { id: 'how-accessible', title: 'How accessible this site is' },
      { id: 'known-issues', title: 'Known issues' },
      { id: 'report-a-problem', title: 'Report a problem' },
    ],
  },
} satisfies Meta<typeof PageContents>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InTheDarkTheme: Story = { globals: { theme: 'dark' } };
