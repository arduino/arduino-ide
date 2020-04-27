export interface Searchable<T> {
    search(options: Searchable.Options): Promise<T[]>;
}
export namespace Searchable {
    export interface Options {
        /**
         * Defaults to empty an empty string.
         */
        readonly query?: string;
    }
}
