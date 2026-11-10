import type { Meta, StoryObj } from '@storybook/react-vite';

import { TagList } from './Tag';

const meta = {
  title: 'Components/TagList',
  component: TagList,
  args: {
    tags: ['React', 'TypeScript', 'Storybook', 'Playwright', 'Accessibility'],
    label: 'Technologies used',
  },
} satisfies Meta<typeof TagList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
