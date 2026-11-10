import type { Meta, StoryObj } from '@storybook/react-vite';

import { Stack } from '../Stack';
import { Heading } from './Heading';

const meta = {
  title: 'Components/Heading',
  component: Heading,
  args: { level: 2, children: 'Experience' },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllLevels: Story = {
  render: () => (
    <Stack gap={3}>
      <Heading level={2}>Second level heading</Heading>
      <Heading level={3}>Third level heading</Heading>
      <Heading level={4}>Fourth level heading</Heading>
      <Heading level={5}>Fifth level heading</Heading>
      <Heading level={6}>Sixth level heading</Heading>
    </Stack>
  ),
};
