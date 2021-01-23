export type RecursiveRequired<T> = {
    [P in keyof T]-?: RecursiveRequired<T[P]>;
};

export interface Index {
    [key: string]: any;
}
