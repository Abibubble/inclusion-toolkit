import type { Meta, StoryObj } from '@storybook/react-vite';

import { Abbr } from './Abbr';

const meta = {
  title: 'Components/Abbr',
  component: Abbr,
  args: { name: 'WCAG' },
  render: (args) => (
    <p>
      This site meets <Abbr {...args} /> 2.2 Level AAA.
    </p>
  ),
} satisfies Meta<typeof Abbr>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstUse: Story = { args: { expand: true } };

export const LaterUse: Story = {};
