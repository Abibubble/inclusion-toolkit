import { render } from '@testing-library/react';
import { StrictMode, useState } from 'react';
import { describe, expect, it } from 'vitest';

import { Abbr } from './Abbr';
import { AbbrText } from './AbbrText';
import { AbbreviationScope } from './AbbreviationScope';

function renderInScope(children: React.ReactNode) {
  return render(<AbbreviationScope>{children}</AbbreviationScope>);
}

describe('AbbrText', () => {
  it('marks up every abbreviation, writing out only the first use on the page', () => {
    const { container } = renderInScope(
      <>
        <p>
          <AbbrText>Read the WCAG guidance.</AbbrText>
        </p>
        <p>
          <AbbrText>Another WCAG link later.</AbbrText>
        </p>
      </>,
    );

    const [first, second] = container.querySelectorAll('p');
    expect(first).toHaveTextContent(
      'Read the Web Content Accessibility Guidelines (WCAG) guidance.',
    );
    expect(second?.textContent).toBe('Another WCAG link later.');
    expect(container.querySelectorAll('abbr')).toHaveLength(2);
  });

  it('leaves content that already spells an abbreviation out as it is', () => {
    const { container } = renderInScope(
      <AbbrText>Using search engine optimisation (SEO), then more SEO.</AbbrText>,
    );

    expect(container).toHaveTextContent('Using search engine optimisation (SEO), then more SEO.');
  });

  it('handles plurals, and abbreviations next to punctuation', () => {
    const { container } = renderInScope(<AbbrText>URLs, ARIA and SEO.</AbbrText>);

    expect(container).toHaveTextContent(
      'uniform resource locators (URLs), Accessible Rich Internet Applications (ARIA) and search engine optimisation (SEO).',
    );
  });

  it('ignores capitals inside other words', () => {
    const { container } = renderInScope(<AbbrText>A BAND played in the UKULELE tent.</AbbrText>);

    expect(container.querySelector('abbr')).toBeNull();
  });

  it('counts a first use written by hand, so the text after it isn’t written out again', () => {
    const { container } = renderInScope(
      <>
        <Abbr name="ADHD" expand />
        <AbbrText> and the ADHD infographic</AbbrText>
      </>,
    );

    expect(container).toHaveTextContent(
      'attention deficit hyperactivity disorder (ADHD) and the ADHD infographic',
    );
  });

  it('keeps the same first use when only a later part of the page re-renders', () => {
    let rerenderLater = (): void => undefined;
    function Later() {
      const [count, setCount] = useState(0);
      rerenderLater = () => {
        setCount(count + 1);
      };
      return <AbbrText>{`ARIA ${String(count)}`}</AbbrText>;
    }
    const { container, rerender } = render(
      <StrictMode>
        <AbbreviationScope>
          <AbbrText>The ARIA</AbbrText> <Later />
        </AbbreviationScope>
      </StrictMode>,
    );

    rerenderLater();
    rerender(
      <StrictMode>
        <AbbreviationScope>
          <AbbrText>The ARIA</AbbrText> <Later />
        </AbbreviationScope>
      </StrictMode>,
    );

    expect(container).toHaveTextContent('The Accessible Rich Internet Applications (ARIA) ARIA');
  });

  it('only marks up abbreviations outside a page, as in Storybook', () => {
    const { container } = render(<AbbrText>The UK</AbbrText>);

    expect(container.textContent).toBe('The UK');
    expect(container.querySelector('abbr')).toHaveAttribute('title', 'United Kingdom');
  });
});

describe('Abbr', () => {
  it('can be kept short, such as in a heading that matches the navigation', () => {
    const { container } = renderInScope(
      <>
        <Abbr name="WCAG" expand={false} />
        <span> then </span>
        <Abbr name="WCAG" />
      </>,
    );

    expect(container).toHaveTextContent('WCAG then Web Content Accessibility Guidelines (WCAG)');
  });

  it('keeps abbreviations most people know short, marked up with their full form', () => {
    const { container } = renderInScope(<AbbrText>A PDF, in the UK.</AbbrText>);

    expect(container.textContent).toBe('A PDF, in the UK.');
    expect(container.querySelector('abbr')).toHaveAttribute('title', 'Portable Document Format');
  });

  it('can still write out one most people know, on purpose', () => {
    const { container } = renderInScope(<Abbr name="UK" expand />);

    expect(container).toHaveTextContent('United Kingdom (UK)');
  });
});
