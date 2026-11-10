import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import {
  SETTINGS,
  SETTING_NAMES,
  STORAGE_KEY,
  displaySettingsStore,
} from '../../settings/displaySettings';
import { expectNoAxeViolations } from '../../test/axe';
import { DisplaySettings } from './DisplaySettings';

const root = document.documentElement;
const group = (legend: string) => screen.getByRole('group', { name: legend });

afterEach(() => {
  displaySettingsStore.reset();
});

describe('DisplaySettings', () => {
  it('has a group of options for every setting, starting at the defaults', () => {
    render(<DisplaySettings />);

    for (const name of SETTING_NAMES) {
      const { legend, default: defaultValue, options } = SETTINGS[name];
      const defaultLabel = options.find((option) => option.value === defaultValue)?.label ?? '';

      expect(within(group(legend)).getByRole('radio', { name: defaultLabel })).toBeChecked();
    }
  });

  it('applies and saves a change straight away', async () => {
    const user = userEvent.setup();
    render(<DisplaySettings />);

    await user.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(root).toHaveAttribute('data-theme', 'dark');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({ theme: 'dark' });
  });

  it.each([
    ['Text size', 'Larger', 'data-text-size', 'larger'],
    ['Text spacing', 'Increased', 'data-text-spacing', 'increased'],
    ['Motion', 'Reduce motion', 'data-motion', 'reduce'],
    ['Font', 'My device’s font', 'data-font', 'system'],
  ])('changes %s', async (legend, label, attribute, value) => {
    const user = userEvent.setup();
    render(<DisplaySettings />);

    await user.click(screen.getByRole('radio', { name: label }));

    expect(group(legend)).toContainElement(screen.getByRole('radio', { name: label }));
    expect(root).toHaveAttribute(attribute, value);
  });

  it('resets everything to the defaults, and says so', async () => {
    const user = userEvent.setup();
    render(<DisplaySettings />);
    await user.click(screen.getByRole('radio', { name: 'Cream' }));
    await user.click(screen.getByRole('radio', { name: 'Larger' }));

    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));

    expect(root).not.toHaveAttribute('data-theme');
    expect(root).not.toHaveAttribute('data-text-size');
    expect(within(group('Theme')).getByRole('radio', { name: 'Match my device' })).toBeChecked();
    expect(within(group('Text size')).getByRole('radio', { name: 'Default' })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Display settings are back to their defaults.',
    );
  });

  it('clears the reset message once another change is made', async () => {
    const user = userEvent.setup();
    render(<DisplaySettings />);
    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));

    await user.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = render(<DisplaySettings />);

    await expectNoAxeViolations(container, { disableRules: ['region'] });
  });
});
