import type { ReactNode } from 'react';

export const PAGE_HEADING_ID = 'page-heading';

interface PageHeadingProps {
  children: ReactNode;
}

export function PageHeading({ children }: PageHeadingProps) {
  return (
    <h1 id={PAGE_HEADING_ID} tabIndex={-1}>
      {children}
    </h1>
  );
}
