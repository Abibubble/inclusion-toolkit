import type { Meta, StoryObj } from '@storybook/react-vite';

import { Stack } from '../Stack';
import { Notice } from './Notice';

const meta = {
  title: 'Forms/Notice',
  component: Notice,
} satisfies Meta<typeof Notice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Message sent',
    children: <p>Thanks for getting in touch. I’ll reply to the email address you gave.</p>,
  },
};

export const Failure: Story = {
  args: {
    variant: 'error',
    title: 'Your message wasn’t sent',
    children: <p>Something went wrong. Your message is still in the form, so you can try again.</p>,
  },
};

const BothVariants: Story = {
  args: Success.args,
  render: () => (
    <Stack gap={4}>
      <Notice variant="success" title="Message sent">
        <p>Thanks for getting in touch.</p>
      </Notice>
      <Notice variant="error" title="Your message wasn’t sent">
        <p>Your message is still in the form, so you can try again.</p>
      </Notice>
    </Stack>
  ),
};

export const InTheDarkTheme: Story = { ...BothVariants, globals: { theme: 'dark' } };

export const InTheCreamTheme: Story = { ...BothVariants, globals: { theme: 'cream' } };
