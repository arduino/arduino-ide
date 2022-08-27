export interface Searchable<T, O extends Searchable.Options> {
  search(options: O): Promise<T[]>;
}
export namespace Searchable {
  export interface Options {
    /**
     * Defaults to empty an empty string.
     */
    readonly query?: string;
  }
}
