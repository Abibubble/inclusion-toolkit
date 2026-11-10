import { NotFoundPage } from '../components/NotFoundPage';
import { pageTitle } from '../content/site';
import type { Route } from './+types/not-found';

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle('Page not found') }, { name: 'robots', content: 'noindex' }];
}

export default function NotFound() {
  return <NotFoundPage />;
}
