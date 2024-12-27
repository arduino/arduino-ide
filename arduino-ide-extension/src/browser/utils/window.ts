/**
 * Changes the `window.location` without navigating away.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setURL(url: URL, data: any = {}): void {
  history.pushState(data, '', url);
}
