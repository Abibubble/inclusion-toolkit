import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { pageHtmlMarker } from '../../build/repeatedHtml';
import { renderMarkdown } from '../../content/markdown';
import { expectNoAxeViolations } from '../../test/axe';
import { RichText } from './RichText';

const MARKDOWN = `### Introduction

On the slide: the title

This guide is **free** to use.

\`\`\`js
const accessible = true;
\`\`\`
`;

describe('RichText', () => {
  it('shows the text’s headings, paragraphs and code', () => {
    render(<RichText html={renderMarkdown(MARKDOWN)} />);

    expect(screen.getByRole('heading', { level: 3, name: 'Introduction' })).toBeInTheDocument();
    expect(screen.getByText('On the slide: the title')).toBeInTheDocument();
    expect(screen.getByText('const accessible = true;')).toBeInTheDocument();
  });

  it('reads its HTML back from the page when the build swapped it for a marker', () => {
    const shown = document.createElement('div');
    shown.dataset.pageHtml = 'from-the-build';
    shown.innerHTML = '<p>Already on the page</p>';
    document.body.append(shown);

    render(<RichText html={pageHtmlMarker('from-the-build')} />);
    shown.remove();

    expect(screen.getByText('Already on the page')).toBeInTheDocument();
    expect(screen.queryByText(/page-html/)).not.toBeInTheDocument();
  });

  it('fails loudly if the HTML for a marker isn’t on the page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<RichText html={pageHtmlMarker('missing')} />)).toThrow(
      'The page has no element with data-page-html="missing".',
    );
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = render(
      <>
        <h2>RichText</h2>
        <RichText html={renderMarkdown(MARKDOWN)} />
      </>,
    );

    await expectNoAxeViolations(container, { disableRules: ['region'] });
  });
});
