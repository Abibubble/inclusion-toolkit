import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  contentSecurityPolicy,
  inlineScriptHashes,
  withContentSecurityPolicy,
} from './contentSecurityPolicy';

const hash = (body: string) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`;

const PAGE = [
  '<!DOCTYPE html><html><head><meta charset="utf-8"/>',
  '<script>document.documentElement.dataset.js = "";</script>',
  '<script type="application/ld+json">{"@type":"WebSite"}</script>',
  '<script type="module" src="/assets/entry.js"></script>',
  '</head><body><script type="module" async="">import "/assets/root.js";</script>',
  '<script>document.documentElement.dataset.js = "";</script></body></html>',
].join('');

describe('inlineScriptHashes', () => {
  it('hashes each inline script that runs, once each', () => {
    expect(inlineScriptHashes(PAGE)).toEqual([
      hash('document.documentElement.dataset.js = "";'),
      hash('import "/assets/root.js";'),
    ]);
  });

  it('leaves out data that never runs, and scripts loaded from files', () => {
    const hashes = inlineScriptHashes(PAGE);

    expect(hashes).not.toContain(hash('{"@type":"WebSite"}'));
    expect(hashes).not.toContain(hash(''));
  });
});

describe('contentSecurityPolicy', () => {
  const policy = contentSecurityPolicy(["'sha256-abc'"]);

  it('blocks everything that isn’t allowed by name', () => {
    expect(policy).toMatch(/^default-src 'none'; /);
  });

  it('only runs the site’s own scripts, and inline scripts that match a hash', () => {
    expect(policy).toContain("script-src 'self' 'sha256-abc';");
    expect(policy).not.toMatch(/script-src[^;]*unsafe/);
  });

  it('only lets the browser talk to the site itself, for the search index', () => {
    expect(policy).toContain("connect-src 'self';");
  });

  it('lets people’s own reading tools add styles, such as for text spacing (WCAG 1.4.12)', () => {
    expect(policy).toContain("style-src 'self' 'unsafe-inline';");
  });

  it('allows the site’s own styles, fonts, images and manifest', () => {
    for (const directive of ['style-src', 'font-src', 'img-src', 'manifest-src']) {
      expect(policy).toContain(`${directive} 'self'`);
    }
  });
});

describe('withContentSecurityPolicy', () => {
  it('adds the policy first in the head, before any script it needs to cover', () => {
    const html = withContentSecurityPolicy(PAGE);

    expect(html).toMatch(/^<!DOCTYPE html><html><head><meta http-equiv="Content-Security-Policy"/);
    expect(html).toContain(hash('import "/assets/root.js";'));
  });

  it('stops the build if a page has no head', () => {
    expect(() => withContentSecurityPolicy('<p>Hello</p>')).toThrow('no <head>');
  });
});
