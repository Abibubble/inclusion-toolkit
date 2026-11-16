/** WebKit's Tab skips links unless Alt is held, like Safari's default setting */
export function tabKey(browserName: string): string {
  return browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
}
