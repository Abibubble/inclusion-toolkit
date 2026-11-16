import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { Stack } from '../Stack';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Send message' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Change your message' },
};

const BothVariants: Story = {
  render: () => (
    <Stack gap={3}>
      <Button>Send message</Button>
      <Button variant="secondary">Change your message</Button>
    </Stack>
  ),
};

export const InTheDarkTheme: Story = {
  ...BothVariants,
  globals: { theme: 'dark' },
  play: async () => {
    await expect(document.documentElement.dataset.theme).toBe('dark');
  },
};

export const InTheCreamTheme: Story = {
  ...BothVariants,
  globals: { theme: 'cream' },
  play: async () => {
    await expect(document.documentElement.dataset.theme).toBe('cream');
  },
};
