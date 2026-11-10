import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../test/axe';
import { RadioGroup } from './RadioGroup';

const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'cream', label: 'Cream', hint: 'A warm background' },
] as const;

type Theme = (typeof OPTIONS)[number]['value'];

function ThemeChoice({ onChange = vi.fn() }: { onChange?: (value: Theme) => void }) {
  const [value, setValue] = useState<Theme>('light');
  return (
    <RadioGroup
      legend="Theme"
      name="theme"
      options={OPTIONS}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('RadioGroup', () => {
  it('groups the options under a visible legend', () => {
    render(<ThemeChoice />);

    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('shows which option is chosen', () => {
    render(<ThemeChoice />);

    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dark' })).not.toBeChecked();
  });

  it('reads out an option’s hint along with it', () => {
    render(<ThemeChoice />);

    expect(screen.getByRole('radio', { name: 'Cream' })).toHaveAccessibleDescription(
      'A warm background',
    );
  });

  it('changes when an option or its label is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ThemeChoice onChange={onChange} />);

    await user.click(screen.getByText('Cream'));

    expect(screen.getByRole('radio', { name: 'Cream' })).toBeChecked();
    expect(onChange).toHaveBeenCalledWith('cream');
  });

  it('moves between options with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<ThemeChoice />);

    await user.click(screen.getByRole('radio', { name: 'Light' }));
    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveFocus();
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = render(<ThemeChoice />);

    await expectNoAxeViolations(container, { disableRules: ['region'] });
  });
});
