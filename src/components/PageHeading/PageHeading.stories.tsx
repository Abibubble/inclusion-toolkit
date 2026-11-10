import type { Meta, StoryObj } from '@storybook/react-vite';

import { PageHeading } from './PageHeading';

const meta = {
  title: 'Layout/PageHeading',
  component: PageHeading,
  args: { children: 'Highlights' },
} satisfies Meta<typeof PageHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Long: Story = {
  args: { children: 'Assistive technology beyond screen readers, and how to test with it' },
};
