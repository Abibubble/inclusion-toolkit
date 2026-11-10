# Inclusion Toolkit

Free resources about accessibility and neurodiversity.

Built with React, TypeScript and React Router, with every page prerendered to static HTML. The site
aims for WCAG 2.2 Level AAA.

## Getting started

You need [nvm](https://github.com/nvm-sh/nvm) and pnpm.

```bash
nvm use
pnpm install
pnpm exec playwright install
pnpm dev
```

The dev server runs at http://localhost:5173.

## Site address

The site's address is https://inclusiontoolkit.org.

Canonical addresses, share previews, the sitemap and the base path come from the `SITE_URL` environment
variable, such as `https://inclusiontoolkit.org`. It can also include a path, such as
`https://abibubble.github.io/inclusion-toolkit`, and every page and file address then starts with
`/inclusion-toolkit/`. Local builds use http://localhost:4173 without it. The GitHub Pages build
fails without it, so the live site can never point at localhost.

## Scripts

| Script                   | What it does                                                              |
| ------------------------ | ------------------------------------------------------------------------- |
| `pnpm dev`               | Starts the dev server                                                     |
| `pnpm build`             | Builds the site and prerenders every page into `build/client`             |
| `pnpm preview`           | Serves the production build at http://localhost:4173                      |
| `pnpm typecheck`         | Generates route types and runs the TypeScript compiler                    |
| `pnpm lint`              | Lints TypeScript and React, including strict accessibility rules          |
| `pnpm lint:css`          | Lints CSS, and fails on raw colours or sizes outside the token files      |
| `pnpm format`            | Formats everything with Prettier                                          |
| `pnpm test`              | Runs unit and component tests                                             |
| `pnpm test:watch`        | Runs unit tests in watch mode                                             |
| `pnpm test:coverage`     | Runs unit tests with a 90% coverage threshold                             |
| `pnpm test:storybook`    | Tests every Storybook story in a real browser, including axe checks       |
| `pnpm storybook`         | Starts Storybook at http://localhost:6006                                 |
| `pnpm build-storybook`   | Builds a static copy of Storybook into `storybook-static`                 |
| `pnpm test:e2e`          | Builds the site and runs Playwright tests in Chromium, Firefox and WebKit |
| `pnpm test:e2e:chromium` | Runs the same Playwright tests in Chromium only, which is quicker         |
| `pnpm test:e2e:sample`   | Runs them in Chromium on a sample of the toolkit's resources, not all     |
| `pnpm test:lighthouse`   | Runs Lighthouse on the built site, with minimum scores                    |
| `pnpm test:pages`        | Checks the build works under its base path, as GitHub Pages serves it     |
| `pnpm brand-images`      | Redraws the icons and share image in `public/` from the site's mark       |
| `pnpm commit:check`      | Runs the checks that must pass before committing, in about 2 minutes      |
| `pnpm commit:check:full` | Runs every check CI runs, in about 10 minutes                             |

## Before committing

Run `pnpm commit:check`. It runs these checks in 3 stages, and stops after any stage with a failure:

1. At the same time (`scripts/check.ts`): formatting, CSS lint, TypeScript and React lint, and type
   checks.
2. At the same time, on their own, as some tests time out if the computer is too busy: the unit
   tests with the 90% coverage threshold, and the Storybook story tests. Both include axe checks.
3. The production build, then end to end tests in Chromium, including axe checks. Toolkit resources
   in a folder's folders, such as each single highlight, share one design, so only a sample of them
   is tested (`TOOLKIT_SAMPLE` in `e2e/support/routes.ts`).

Don't run it while another run of the end to end tests is going, as they share a build folder and
port.

CI also tests every toolkit resource in Chromium, runs the end to end tests in Firefox and WebKit,
builds Storybook, and runs Lighthouse: at least 95 for performance (90 for the full Accessibility
Highlights), and 100 for accessibility, best practice and SEO. To run everything CI runs, use
`pnpm commit:check:full`.

## Deploying

The site is hosted on GitHub Pages. CI builds it on every push and pull request, checks it works
under its base path with `pnpm test:pages`, and deploys it from `main` once every other check has
passed.

The build reads the `SITE_URL` repository variable, set under Settings, then Secrets and variables,
then Actions, on the Variables tab. Set it to `https://inclusiontoolkit.org`.

GitHub Pages can't send custom headers. Every page gets its own Content Security Policy as a meta tag
at build time, allowing exactly its own inline scripts, and the referrer policy is a meta tag too.

Long pages would send their text twice: once as HTML, and again in the page data React Router adds
so the browser can take over the page. After the build, `src/build/repeatedHtml.ts` swaps the copy in
the data for a short marker, and the `RichText` component reads the HTML back from the page. This
roughly halves the size of the longest pages.
