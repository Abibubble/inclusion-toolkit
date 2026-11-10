// The site's mark: a stack of 3 cards on a purple square, for a collection of resources. The front
// card has lines of text on it. Run `pnpm brand-images` after changing it, to redraw the icons
export const MARK = {
  viewBox: '0 0 64 64',
  background: '#5B2A86',
  shapes: [
    { x: 24, y: 10, width: 28, height: 34, radius: 4, fill: '#C9B6F2' },
    { x: 18, y: 16, width: 28, height: 34, radius: 4, fill: '#5FD4C4' },
    { x: 12, y: 22, width: 28, height: 34, radius: 4, fill: '#FFFFFF' },
    { x: 17, y: 29, width: 18, height: 4, radius: 2, fill: '#5B2A86' },
    { x: 17, y: 37, width: 14, height: 4, radius: 2, fill: '#5B2A86' },
    { x: 17, y: 45, width: 16, height: 4, radius: 2, fill: '#5B2A86' },
  ],
};

interface MarkSvgOptions {
  rounded?: boolean;
}

/** The mark as a standalone SVG file, with its purple background */
export function markSvg({ rounded = true }: MarkSvgOptions = {}): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK.viewBox}">`,
    `<rect width="64" height="64"${rounded ? ' rx="14"' : ''} fill="${MARK.background}"/>`,
    ...MARK.shapes.map(
      ({ x, y, width, height, radius, fill }) =>
        `<rect x="${String(x)}" y="${String(y)}" width="${String(width)}" height="${String(height)}" rx="${String(radius)}" fill="${fill}"/>`,
    ),
    '</svg>',
  ].join('');
}
