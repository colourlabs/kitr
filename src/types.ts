export interface Subscribable {
  subscribe(callback: () => void): () => void;
};

export interface KitrServices {
  // this is modifed by the user via declaration merging
};
