import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../test/axe';
import { Button } from './Button';

describe('Button', () => {
  it('never submits a form by accident', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  it('can submit a form when asked to', () => {
    render(<Button type="submit">Send message</Button>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('responds to clicks and to the keyboard', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    await user.click(screen.getByRole('button'));
    screen.getByRole('button').focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('is primary by default, and can be secondary', () => {
    const { rerender } = render(<Button>Save</Button>);
    expect(screen.getByRole('button').className).toMatch(/primary/);

    rerender(<Button variant="secondary">Cancel</Button>);
    expect(screen.getByRole('button').className).toMatch(/secondary/);
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = render(<Button>Save</Button>);

    await expectNoAxeViolations(container, { disableRules: ['region'] });
  });
});
