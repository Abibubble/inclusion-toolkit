# Security

This is the code for [InclusionToolkit.org](https://inclusiontoolkit.org), a free set of
accessibility and neurodiversity resources. It's a static site hosted on GitHub Pages. It has no
logins, accounts, database, cookies or tracking.

## What this covers

- the site itself, including its pages and its search
- the files people can view or download: the Word, PowerPoint and PDF files in `public/files`
- the scripts that make those files, in `toolkit-sources`
- the code and CI workflows in this repository

## Reporting a problem

Please don't open a public issue for a security problem, as everyone can see issues.

Instead, [report a vulnerability on GitHub](https://github.com/Abibubble/inclusion-toolkit/security/advisories/new).
Only I can see these reports.

It helps to know what the problem is, where it is, and how to make it happen.

## What happens to a report

I'll reply to say I've seen it, and tell you what I'm going to do about it. If you'd like, I'll
credit you once it's fixed.

I run this site on my own, so I can't promise how quickly I'll fix things.

## Things that aren't problems

- **Missing security headers.** GitHub Pages can't send custom headers. Instead, every page has its
  own Content Security Policy and referrer policy as meta tags. The policy is made in
  `src/security/contentSecurityPolicy.ts`.
- **The display settings saved in your browser.** The site saves your theme, text size and other
  display choices in your browser's local storage, so they stay when you come back. They never
  leave your device, and the site checks them before using them.
- **The files' author.** Each Word, PowerPoint and PDF file names me as its author. That's on
  purpose.
