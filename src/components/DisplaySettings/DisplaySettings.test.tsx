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
    ['Text size', 'Largest (50% bigger)', 'data-text-size', 'larger'],
    [
      'Text spacing',
      'Increased (more space between lines, words, and letters)',
      'data-text-spacing',
      'increased',
    ],
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
    await user.click(screen.getByRole('radio', { name: 'Largest (50% bigger)' }));

    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));

    expect(root).not.toHaveAttribute('data-theme');
    expect(root).not.toHaveAttribute('data-text-size');
    expect(within(group('Theme')).getByRole('radio', { name: 'Match my device' })).toBeChecked();
    expect(within(group('Text size')).getByRole('radio', { name: 'Default' })).toBeChecked();
    expect(await screen.findByText('Display settings are back to their defaults.')).toHaveRole(
      'status',
    );
  });

  it('announces the reset again when it’s pressed a second time (WCAG 4.1.3)', async () => {
    const user = userEvent.setup();
    render(<DisplaySettings />);
    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));
    await screen.findByText('Display settings are back to their defaults.');

    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(await screen.findByText('Display settings are back to their defaults.')).toHaveRole(
      'status',
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
