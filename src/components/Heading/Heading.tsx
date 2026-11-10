import type { ReactNode } from 'react';

export type HeadingLevel = 2 | 3 | 4 | 5 | 6;

interface HeadingProps {
  level: HeadingLevel;
  children: ReactNode;
  id?: string | undefined;
  className?: string | undefined;
  tabIndex?: -1 | undefined;
}

export function Heading({ level, children, id, className, tabIndex }: HeadingProps) {
  const Element = `h${level}` as const;

  return (
    <Element id={id} className={className} tabIndex={tabIndex}>
      {children}
    </Element>
  );
}

export function nextLevel(level: HeadingLevel): HeadingLevel {
  return Math.min(level + 1, 6) as HeadingLevel;
}
