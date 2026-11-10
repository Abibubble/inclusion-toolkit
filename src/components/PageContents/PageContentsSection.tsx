import type { ReactNode } from 'react';

import { Heading } from '../Heading';
import { Stack } from '../Stack';
import type { PageSection } from './PageContents';

interface PageContentsSectionProps {
  section: PageSection;
  children: ReactNode;
}

export function PageContentsSection({ section, children }: PageContentsSectionProps) {
  return (
    <Stack as="section" gap={4} aria-labelledby={section.id}>
      <Heading level={2} id={section.id} tabIndex={-1}>
        {section.title}
      </Heading>
      {children}
    </Stack>
  );
}
