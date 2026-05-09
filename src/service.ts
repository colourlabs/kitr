export abstract class KitrService {
  private _subscribers = new Set<() => void>();
  private _pendingNotify = false;
  private _disposed = false;

  subscribe(callback: () => void): () => void {
    if (this._disposed) {
      console.warn("[kitr] attempted to subscribe to a disposed service");
      return () => {};
    }
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }

  /**
   * schedules a notification for the next microtask.
   * multiple calls in the same execution cycle will only result in one notification.
   */
  protected notify(): void {
    if (this._pendingNotify || this._disposed) return;

    this._pendingNotify = true;

    queueMicrotask(() => {
      this._subscribers.forEach((cb) => cb());
      this._pendingNotify = false;
    });
  }

  /**
   * runs the updater then schedules a batched notification.
   * subscribers will be called in the next microtask, not synchronously.
   */
  protected updateState(updater: () => void): void {
    try {
      updater();
    } finally {
      this.notify();
    }
  }

  dispose(): void {
    this._disposed = true;
    this._subscribers.clear();
  }
}
