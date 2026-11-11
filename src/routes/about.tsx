import { Abbr } from '../components/Abbr';
import { Link } from '../components/Link';
import { PageHeading } from '../components/PageHeading';
import { TitleBand } from '../components/TitleBand';
import { ScreenReaderOnly } from '../components/ScreenReaderOnly';
import { Stack } from '../components/Stack';
import { CREDIT, LICENCE_URL } from '../content/about';
import { ABOUT_PATH } from '../content/navigation';
import { pageTitle } from '../content/site';
import { NEW_ISSUE_URL } from '../content/statements';
import { pageMeta } from '../seo/pageMeta';
import type { Route } from './+types/about';

export function meta(): Route.MetaDescriptors {
  return pageMeta({
    title: pageTitle('About'),
    description: 'What the Inclusion Toolkit is, who made it and why, and how you can share it.',
    path: ABOUT_PATH,
  });
}

export default function About() {
  return (
    <Stack gap={6}>
      <TitleBand>
        <Stack gap={4}>
          <PageHeading>About</PageHeading>
          <p>
            The Inclusion Toolkit is a free set of guides, slides and infographics about
            accessibility and neurodiversity. Anyone can use it.
          </p>
        </Stack>
      </TitleBand>
      <Stack as="section" gap={4} aria-labelledby="who-made-it">
        <h2 id="who-made-it">Who made it</h2>
        <p>
          I’m Abi Harrison-Nye. I wrote the toolkit’s text, made its guides, slides and
          infographics, and built this site.
        </p>
        <p>
          I’m still learning too, so if something could be clearer or better, please{' '}
          <Link href={NEW_ISSUE_URL}>suggest a change on GitHub</Link>.
        </p>
      </Stack>
      <Stack as="section" gap={4} aria-labelledby="why-i-made-it">
        <h2 id="why-i-made-it">Why I made it</h2>
        <p>
          It started at giffgaff, as part of the Home of Accessibility and NeuroDiversity (HAND), an
          employee network group I founded and lead. Each week I wrote a short highlight about an
          accessibility or neurodiversity topic, so colleagues could learn something new and
          practical. Over time, these grew into a full set of resources.
        </p>
      </Stack>
      <Stack as="section" gap={4} aria-labelledby="what-its-for">
        <h2 id="what-its-for">What it’s for</h2>
        <p>
          It’s for anyone who wants to make their workplace, meetings or website more inclusive. You
          don’t need to be an expert to use it.
        </p>
      </Stack>
      <Stack as="section" gap={4} aria-labelledby="what-i-hope-it-does">
        <h2 id="what-i-hope-it-does">What I hope it does</h2>
        <p>I hope the toolkit can:</p>
        <ul>
          <li>explain accessibility and neurodiversity in plain words</li>
          <li>give people practical steps they can take straight away</li>
          <li>stay free for everyone, with nothing to sign up for</li>
          <li>
            be easy for everyone to use, so this site aims to meet the <Abbr name="WCAG" expand />{' '}
            version 2.2 at Level AAA
          </li>
        </ul>
      </Stack>
      <Stack as="section" gap={4} aria-labelledby="credit-and-licence">
        <h2 id="credit-and-licence">Credit and licence</h2>
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
