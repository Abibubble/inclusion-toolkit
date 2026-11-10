import { afterEach, describe, expect, it } from 'vitest';

import { withoutTrailingSlashScript } from './trailingSlash';

/** Opens an address, then runs the script, as the page does before React Router starts */
function openThenRun(address: string, basePath: string): string {
  history.replaceState(null, '', address);
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- it's the site's own script
  const script = new Function(withoutTrailingSlashScript(basePath)) as () => void;
  script();
  return `${location.pathname}${location.search}${location.hash}`;
}

afterEach(() => {
  history.replaceState(null, '', '/');
});

describe('withoutTrailingSlashScript', () => {
  it('takes the slash off the end of a page’s address, keeping anything after it', () => {
    expect(openThenRun('/highlights/?a=1#top', '/')).toBe('/highlights?a=1#top');
  });

  it('leaves addresses without a slash at the end alone', () => {
    expect(openThenRun('/highlights', '/')).toBe('/highlights');
  });

  it('leaves the home page alone', () => {
    expect(openThenRun('/', '/')).toBe('/');
  });

  it('leaves the home page alone under a base path, so React Router still recognises it', () => {
    expect(openThenRun('/inclusion-toolkit/', '/inclusion-toolkit/')).toBe('/inclusion-toolkit/');
  });

  it('still tidies other pages under a base path', () => {
    expect(openThenRun('/inclusion-toolkit/about/', '/inclusion-toolkit/')).toBe(
      '/inclusion-toolkit/about',
    );
  });
});
