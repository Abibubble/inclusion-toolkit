import type { Meta, StoryObj } from '@storybook/react-vite';

import { DateRange, Time } from './Time';

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

export const Range: Story = {
  render: () => <DateRange from="2019-06" to="2021-07" />,
};

export const RangeToPresent: Story = {
  render: () => <DateRange from="2021-08" />,
};
