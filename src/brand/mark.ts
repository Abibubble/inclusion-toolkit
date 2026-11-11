// The site's mark: a toolbox on a blue square, for a kit of practical resources. It has a light blue
// band and an amber catch. Run `pnpm brand-images` after changing it, to redraw the icons

export interface MarkShape {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  fill: string;
  /** For an outline, such as the handle. Its fill is 'none' */
  stroke?: string;
  strokeWidth?: number;
}

export const MARK: { viewBox: string; background: string; shapes: MarkShape[] } = {
  viewBox: '0 0 64 64',
  background: '#1C4882',
  shapes: [
    // The handle. Its lower half is hidden behind the box
    {
      x: 24,
      y: 15,
      width: 16,
      height: 14,
      radius: 3,
      fill: 'none',
      stroke: '#FFFFFF',
      strokeWidth: 4,
    },
    // The box, its band and its catch
    { x: 11, y: 22, width: 42, height: 28, radius: 5, fill: '#FFFFFF' },
    { x: 11, y: 31, width: 42, height: 5, radius: 0, fill: '#BCD6F5' },
    { x: 28, y: 29, width: 8, height: 9, radius: 2, fill: '#F2A541' },
  ],
};

interface MarkSvgOptions {
  rounded?: boolean;
}

function shapeSvg({ x, y, width, height, radius, fill, stroke, strokeWidth }: MarkShape): string {
  const outline = stroke ? ` stroke="${stroke}" stroke-width="${String(strokeWidth ?? 1)}"` : '';
  return `<rect x="${String(x)}" y="${String(y)}" width="${String(width)}" height="${String(height)}" rx="${String(radius)}" fill="${fill}"${outline}/>`;
}

/** The mark as a standalone SVG file, with its blue background */
export function markSvg({ rounded = true }: MarkSvgOptions = {}): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK.viewBox}">`,
    `<rect width="64" height="64"${rounded ? ' rx="14"' : ''} fill="${MARK.background}"/>`,
    ...MARK.shapes.map(shapeSvg),
    '</svg>',
  ].join('');
}
