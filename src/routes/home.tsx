import { SITE_NAME } from '../content/site';
import type { Route } from './+types/home';

// A placeholder until the toolkit's own pages are added
export function meta(): Route.MetaDescriptors {
  return [{ title: SITE_NAME }];
}

export default function Home() {
  return (
    <main>
      <h1>{SITE_NAME}</h1>
      <p>Free resources about accessibility and neurodiversity.</p>
    </main>
  );
}
