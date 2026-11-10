import { createHash } from 'node:crypto';

const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)(?<attributes>[^>]*)>(?<body>[\s\S]*?)<\/script>/g;
const DATA_BLOCK = /\btype="application\/(?:ld\+)?json"/;

export function inlineScriptHashes(html: string): string[] {
  const hashes = [...html.matchAll(INLINE_SCRIPT)]
    .filter((match) => !DATA_BLOCK.test(match.groups?.attributes ?? ''))
    .map((match) =>
      createHash('sha256')
        .update(match.groups?.body ?? '')
        .digest('base64'),
    )
    .map((hash) => `'sha256-${hash}'`);
  return [...new Set(hashes)];
}

export function contentSecurityPolicy(scriptHashes: readonly string[]): string {
  return [
    "default-src 'none'",
    `script-src 'self' ${scriptHashes.join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self'",
    "manifest-src 'self'",
    // Search fetches its index from the site itself
    "connect-src 'self'",
    "base-uri 'none'",
    "form-action 'self'",
  ].join('; ');
}

export function withContentSecurityPolicy(html: string): string {
  const policy = contentSecurityPolicy(inlineScriptHashes(html));
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}"/>`;
  if (!html.includes('<head>')) throw new Error('The page has no <head> to add its policy to.');
  return html.replace('<head>', `<head>${meta}`);
}
