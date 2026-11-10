import {
  type LoaderFunctionArgs,
  type MetaArgs,
  type MetaDescriptor,
  useLoaderData,
} from 'react-router';

import { ToolkitPage } from '../components/Toolkit';
import { SITE_DESCRIPTION, SITE_NAME, pageTitle } from '../content/site';
import { TOOLKIT_PATH, type ToolkitCrumb, toolkitPath } from '../content/toolkit';
import { loadToolkitPage } from '../content/toolkitPage';
import { pageMeta } from '../seo/pageMeta';
import { websiteSchema } from '../seo/website';

/**
 * /highlights/dark-mode gives highlights and dark-mode. Anything before it in the site's base path,
 * such as /inclusion-toolkit/ on GitHub Pages, is left out. The home page's data is at /_.data
 */
export function toolkitSlugsFrom(
  url: string,
  basePath: string = import.meta.env.BASE_URL,
): string[] {
  const path = new URL(url).pathname.replace(/\.data$/, '').replace(/\/_$/, '/');
  const withinSite = path.startsWith(basePath) ? path.slice(basePath.length) : path;

  return withinSite.split('/').filter(Boolean);
}

/** Runs when the site is built, so the resources' Markdown never reaches visitors */
export function loader({ request }: LoaderFunctionArgs) {
  return loadToolkitPage(toolkitSlugsFrom(request.url));
}

/**
 * A page's title, with the folder it's in, so no two pages share a title (WCAG 2.4.2). There are
 * resources called Meetings in both the accessibility and neurodiversity highlights, for example.
 * Pages at the top of the toolkit, and resources named after their folder, keep just their own name
 */
export function withFolder(title: string, trail: readonly ToolkitCrumb[]): string {
  const folder = trail.length > 1 ? trail.at(-1)?.title : undefined;
  return folder && folder !== title ? `${title}, ${folder}` : title;
}

export function meta({ loaderData }: MetaArgs<typeof loader>): MetaDescriptor[] {
  if (!loaderData) return [];

  if (loaderData.kind === 'home') {
    return [
      ...pageMeta({ title: SITE_NAME, description: SITE_DESCRIPTION, path: TOOLKIT_PATH }),
      { 'script:ld+json': websiteSchema() },
    ];
  }

  const { title, description } = loaderData.kind === 'folder' ? loaderData.folder : loaderData.item;
  return pageMeta({
    title: pageTitle(withFolder(title, loaderData.trail)),
    description,
    path: toolkitPath(loaderData.slugs),
  });
}

export default function Toolkit() {
  return <ToolkitPage data={useLoaderData<typeof loader>()} />;
}
