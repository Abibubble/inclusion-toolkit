// WCAG 2.2 relative luminance and contrast ratio
// https://www.w3.org/TR/WCAG22/#dfn-relative-luminance

function channelToLinear(channel: number): number {
  const value = channel / 255;

  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function parseHex(hex: string): [number, number, number] {
  const digits = hex.replace('#', '');
  const full =
    digits.length === 3
      ? digits
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : digits;

  if (!/^[0-9a-f]{6}$/i.test(full)) {
    throw new Error(`Not a hex colour: ${hex}`);
  }

  return [0, 2, 4].map((start) => parseInt(full.slice(start, start + 2), 16)) as [
    number,
    number,
    number,
  ];
}

export function relativeLuminance(hex: string): number {
  const [red, green, blue] = parseHex(hex).map(channelToLinear) as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (first, second) => second - first,
  ) as [number, number];

  return (lighter + 0.05) / (darker + 0.05);
}
