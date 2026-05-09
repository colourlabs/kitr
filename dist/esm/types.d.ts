export interface Subscribable {
    subscribe(callback: () => void): () => void;
}
export interface KitrServices {
}
