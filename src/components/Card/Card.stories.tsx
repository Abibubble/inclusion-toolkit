import type { Meta, StoryObj } from '@storybook/react-vite';

import { Link } from '../Link';
import { Stack } from '../Stack';
import { TagList } from '../Tag';
import { Time } from '../Time';
import { Card } from './Card';

const meta = {
  title: 'Components/Card',
  component: Card,
  args: {
    as: 'article',
    children: (
      <Stack gap={3}>
        <h2>Dark mode</h2>
        <p>
          Updated <Time date="2026-11-06" />
        </p>
        <p>Why dark mode helps some people, and how to design it well.</p>
        <TagList tags={['Slides', 'Word', 'PDF']} label="Formats" />
        <p>
          <Link to="/accessibility/highlights/dark-mode">Read the dark mode highlight</Link>
        </p>
      </Stack>
    ),
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InTheDarkTheme: Story = { globals: { theme: 'dark' } };

export const InTheCreamTheme: Story = { globals: { theme: 'cream' } };
