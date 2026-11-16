import type { Meta, StoryObj } from '@storybook/react-vite';

import { Time } from './Time';

const meta = {
  title: 'Components/Time',
  component: Time,
  args: { date: '2026-06' },
} satisfies Meta<typeof Time>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Month: Story = {};

export const Day: Story = { args: { date: '2025-04-03' } };

export const Year: Story = { args: { date: '2026' } };
