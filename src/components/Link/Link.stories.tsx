import type { Meta, StoryObj } from '@storybook/react-vite';

import { Link } from './Link';

const meta = {
  title: 'Components/Link',
  component: Link,
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ToAPageOnThisSite: Story = {
  args: { to: '/highlights', children: 'Highlights' },
};

export const ToAnotherSite: Story = {
  args: { href: 'https://www.w3.org/WAI/', children: 'W3C Web Accessibility Initiative' },
};

export const InAParagraph: Story = {
  args: { href: 'https://www.w3.org/WAI/', children: 'the Web Accessibility Initiative' },
  render: (args) => (
    <p>
      You can find more guidance from <Link {...args} />, which writes the accessibility guidelines.
    </p>
  ),
};
