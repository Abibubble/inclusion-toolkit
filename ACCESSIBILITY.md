# Accessibility

This is the code for [InclusionToolkit.org](https://inclusiontoolkit.org). The site is for
everyone, so everyone should be able to use it.

For visitors, the site's [Accessibility page](https://inclusiontoolkit.org/accessibility) explains
how accessible it is, the known issues and how to get around them, and how the site is tested. This
file is for anyone looking at the code, and doesn't repeat that page.

## Goal

The site aims to meet the Web Content Accessibility Guidelines (WCAG) version 2.2 at Level AAA.

This is a target, not a claim that the site meets it. The automated checks below find some
problems, but not all, and the manual checks with assistive technology aren't finished yet. Where
the site falls short, it's listed in the known issues on the Accessibility page.

The Word, PowerPoint and PDF files can't be checked by the tests. Every resource has its own page
with everything in its files as text, so the files are never the only way to get the content.

## Checks every change must pass

Before a change is committed, `pnpm commit:check` must pass. It includes:

- strict accessibility lint rules for React
- a CSS lint that only allows colours and sizes from the design tokens, which are chosen to give a
  contrast of 7 to 1 or more in every theme
- axe checks in the component tests, on every Storybook story, and on every page (a sample of the
  toolkit's resources locally, and all of them in CI)
- end to end tests that check every page can be used with a keyboard alone, in order, with a visible
  focus outline that isn't hidden behind anything
- checks that targets are at least 44 by 44 pixels, that abbreviations are written out in full the
  first time, and that controls stay visible in Windows high contrast mode
- checks that every word in the glossary and every abbreviation in the list is used on the site

CI then also runs the end to end tests in Firefox and WebKit, and Lighthouse, which must score 100
for accessibility.

The [README](README.md) explains each check and how to run them.

## Supported browsers and settings

The automated tests run in the browser engines behind Chrome, Firefox and Safari. Pages are tested:

- on wide screens and on screens 320 pixels wide
- with the largest text and widest spacing in the site's display settings
- in Windows high contrast mode

## Reporting a problem

If something doesn't work for you, please
[open an issue](https://github.com/Abibubble/inclusion-toolkit/issues/new) on GitHub.

You don't need to say anything about a disability, or send screenshots or recordings. It helps to
know which page you were on and what you were trying to do. If you're happy to share it, it also
helps to know what you were using, such as your browser or screen reader.

## What happens to a report

Each report gets a reply to say it's been seen. If it's a problem with the site, it's added to the
known issues on the Accessibility page, with a way to get around it if there is one, until it's
fixed. Problems that stop someone using the site come first.

## Keeping this file up to date

This file and the Accessibility page are kept up to date together. The Accessibility page shows the
date it was last checked.
