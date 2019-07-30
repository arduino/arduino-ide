export interface Installable<T> {
    install(item: T): Promise<void>;
}