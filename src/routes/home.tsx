import { PageHeading } from '../components/PageHeading';
import { SITE_DESCRIPTION, SITE_NAME } from '../content/site';
import { pageMeta } from '../seo/pageMeta';
import type { Route } from './+types/home';

// A placeholder until the toolkit's own pages are added
export function meta(): Route.MetaDescriptors {
  return pageMeta({ title: SITE_NAME, description: SITE_DESCRIPTION, path: '/' });
}

export default function Home() {
  return (
    <>
      <PageHeading>{SITE_NAME}</PageHeading>
      <p>{SITE_DESCRIPTION}</p>
    </>
  );
}
