import { Link } from '../components/Link';
import { PageHeading } from '../components/PageHeading';
import { ScreenReaderOnly } from '../components/ScreenReaderOnly';
import { Stack } from '../components/Stack';
import { CREDIT, LICENCE_URL } from '../content/about';
import { ABOUT_PATH } from '../content/navigation';
import { pageTitle } from '../content/site';
import { pageMeta } from '../seo/pageMeta';
import type { Route } from './+types/about';

export function meta(): Route.MetaDescriptors {
  return pageMeta({
    title: pageTitle('About'),
    description: 'What the Inclusion Toolkit is, who first made it, and how you can share it.',
    path: ABOUT_PATH,
  });
}

export default function About() {
  return (
    <Stack gap={6}>
      <Stack gap={4}>
        <PageHeading>About</PageHeading>
        <p>
          The Inclusion Toolkit is a free set of guides, slides and infographics about accessibility
          and neurodiversity. Anyone can use it.
        </p>
      </Stack>
      <Stack as="section" gap={4} aria-labelledby="where-it-came-from">
        <h2 id="where-it-came-from">Where the toolkit came from</h2>
        <p>
          {CREDIT.before}
          <Link href={LICENCE_URL}>
            {/* A real space rather than one inside the hidden text, so every browser keeps it */}
            {CREDIT.licence} <ScreenReaderOnly>licence</ScreenReaderOnly>
          </Link>
          {CREDIT.after}
        </p>
        <p>
          CC BY 4.0 is short for the Creative Commons Attribution 4.0 International licence. It
          means you can share and change the toolkit, as long as you say where it came from.
        </p>
      </Stack>
    </Stack>
  );
}
