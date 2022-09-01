export type RecursiveRequired<T> = {
  [P in keyof T]-?: RecursiveRequired<T[P]>;
};

export type Defined<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};
