import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button';
import { Cluster } from './Cluster';

const meta = {
  title: 'Layout/Cluster',
  component: Cluster,
  args: {
    gap: 3,
    children: (
      <>
        <Button>Send message</Button>
        <Button variant="secondary">Change your message</Button>
        <Button variant="secondary">Start again</Button>
      </>
    ),
  },
  argTypes: { gap: { control: { type: 'select' }, options: [1, 2, 3, 4, 5, 6, 7] } },
} satisfies Meta<typeof Cluster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
