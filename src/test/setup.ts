import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, expect, vi } from 'vitest';

const realRequests: string[] = [];

vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
  const url = input instanceof Request ? input.url : input.toString();
  realRequests.push(url);

  return Promise.reject(
    new Error(`Unit tests can’t make real requests, but this one tried ${url}`),
  );
});

afterEach(() => {
  expect(
    realRequests.splice(0),
    'A test made a real request. Pass a fake into the code being tested instead.',
  ).toEqual([]);
});

if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = vi.fn();
}

afterEach(() => {
  cleanup();
});
