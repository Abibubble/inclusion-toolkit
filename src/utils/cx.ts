// Joins class names, skipping any that are empty, false or undefined
export function cx(...classNames: (string | false | null | undefined)[]): string {
  return classNames.filter(Boolean).join(' ');
}
