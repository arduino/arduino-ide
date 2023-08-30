export type RecursiveRequired<T> = {
  [P in keyof T]-?: RecursiveRequired<T[P]>;
};

export type Defined<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

export type UnknownObject<T = object> = Record<
  string | number | symbol,
  unknown
> & { [K in keyof T]: unknown };
