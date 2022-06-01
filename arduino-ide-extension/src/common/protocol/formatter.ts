export const FormatterPath = '/services/formatter';
export const Formatter = Symbol('Formatter');
export interface Formatter {
  format({
    content,
    formatterConfigFolderUris,
    options,
  }: {
    content: string;
    formatterConfigFolderUris: string[];
    options?: FormatterOptions;
  }): Promise<string>;
}
export interface FormatterOptions {
  /**
   * Size of a tab in spaces.
   */
  tabSize: number;
  /**
   * Prefer spaces over tabs.
   */
  insertSpaces: boolean;
}
