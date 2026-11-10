import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ScreenReaderOnly } from './ScreenReaderOnly';

describe('ScreenReaderOnly', () => {
  it('keeps its text available to assistive technology', () => {
    render(
      <button type="button">
        Menu <ScreenReaderOnly>for the whole site</ScreenReaderOnly>
      </button>,
    );

    expect(screen.getByRole('button', { name: 'Menu for the whole site' })).toBeInTheDocument();
  });

  it('renders inline by default so it can sit inside other text', () => {
    render(<ScreenReaderOnly>Hidden</ScreenReaderOnly>);

    expect(screen.getByText('Hidden').tagName).toBe('SPAN');
  });
});
