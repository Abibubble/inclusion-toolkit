import type { Meta, StoryObj } from '@storybook/react-vite';

import { SkipLink } from './SkipLink';

const meta = {
  title: 'Layout/SkipLink',
  component: SkipLink,
} satisfies Meta<typeof SkipLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hidden: Story = {};

export const Focused: Story = {
  play: ({ canvasElement }) => {
    canvasElement.querySelector('a')?.focus();
  },
};
