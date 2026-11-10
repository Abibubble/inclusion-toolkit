# Inclusion Toolkit

Free resources about accessibility and neurodiversity.

Built with React, TypeScript and React Router, with every page prerendered to static HTML. The site
aims for WCAG 2.2 Level AAA.

## Getting started

You need [nvm](https://github.com/nvm-sh/nvm) and pnpm.

```bash
nvm use
pnpm install
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

| Script                 | What it does                                                         |
| ---------------------- | -------------------------------------------------------------------- |
| `pnpm dev`             | Starts the dev server                                                |
| `pnpm build`           | Builds the site and prerenders every page into `build/client`        |
| `pnpm preview`         | Serves the production build at http://localhost:4173                 |
| `pnpm typecheck`       | Generates route types and runs the TypeScript compiler               |
| `pnpm lint`            | Lints TypeScript and React, including strict accessibility rules     |
| `pnpm lint:css`        | Lints CSS, and fails on raw colours or sizes outside the token files |
| `pnpm format`          | Formats everything with Prettier                                     |
| `pnpm test`            | Runs unit and component tests                                        |
| `pnpm test:watch`      | Runs unit tests in watch mode                                        |
| `pnpm test:coverage`   | Runs unit tests with a 90% coverage threshold                        |
| `pnpm test:storybook`  | Tests every Storybook story in a real browser, including axe checks  |
| `pnpm storybook`       | Starts Storybook at http://localhost:6006                            |
| `pnpm build-storybook` | Builds a static copy of Storybook into `storybook-static`            |
| `pnpm brand-images`    | Redraws the icons and share image in `public/` from the site's mark  |
| `pnpm commit:check`    | Runs the checks that must pass before committing                     |

The first time, run `pnpm exec playwright install chromium` so the Storybook tests have a browser.

## Before committing

Run `pnpm commit:check`. It runs these checks in 2 stages, and stops after any stage with a failure:

1. At the same time: formatting, CSS lint, TypeScript and React lint, and type checks.
2. At the same time: the unit tests with the coverage threshold, and the Storybook story tests.
   Both include axe checks.
