
export interface Detailable<T> {
    detail(options: Detailable.Options): Promise<{ item?: T }>;
}

export namespace Detailable {
    export interface Options {
        readonly id: string;
    }
}