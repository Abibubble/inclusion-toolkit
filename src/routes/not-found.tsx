import { Link } from '../components/Link';
import { PageHeading } from '../components/PageHeading';
import { pageTitle } from '../content/site';
import type { Route } from './+types/not-found';

// A placeholder until the full not found page is added
export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle('Page not found') }, { name: 'robots', content: 'noindex' }];
}

export default function NotFound() {
  return (
    <main>
      <PageHeading>Page not found</PageHeading>
      <p>
        <Link to="/">Go to the Inclusion Toolkit home page</Link>
      </p>
    </main>
  );
}
