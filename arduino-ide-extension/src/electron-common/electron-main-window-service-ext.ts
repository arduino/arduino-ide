export const electronMainWindowServiceExtPath = '/services/electron-window-ext';
export const ElectronMainWindowServiceExt = Symbol(
  'ElectronMainWindowServiceExt'
);
export interface ElectronMainWindowServiceExt {
  isFirstWindow(windowId: number): Promise<boolean>;
}
