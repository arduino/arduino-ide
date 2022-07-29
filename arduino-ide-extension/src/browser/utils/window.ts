/**
 * Changes the `window.location` without navigating away.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setURL(url: URL, data: any = {}): void {
  history.pushState(data, '', url);
}

/**
 * If available from the `window` object, then it means, the IDE2 has successfully patched the `MonacoThemingService#init` static method,
 * and can wait the custom theme registration.
 */
export const MonacoThemeServiceIsReady = Symbol(
  '@arduino-ide#monaco-theme-service-is-ready'
);
