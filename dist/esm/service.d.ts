export declare abstract class KitrService {
    private _subscribers;
    private _pendingNotify;
    private _disposed;
    subscribe(callback: () => void): () => void;
    /**
     * schedules a notification for the next microtask.
     * multiple calls in the same execution cycle will only result in one notification.
     */
    protected notify(): void;
    /**
     * runs the updater then schedules a batched notification.
     * subscribers will be called in the next microtask, not synchronously.
     */
    protected updateState(updater: () => void): void;
    dispose(): void;
}
