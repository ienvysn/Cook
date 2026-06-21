export class GameClock {
    constructor() {
        this.timeScale = 1.0;
        this.subscribers = new Set();
        this.isRunning = false;
        this.lastTime = null;
        this.rafId = null;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame((now) => this._tick(now));
    }

    pause() {
        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    setTimeScale(scale) {
        this.timeScale = scale;
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        // Return unsubscribe function for convenience
        return () => this.unsubscribe(callback);
    }

    unsubscribe(callback) {
        this.subscribers.delete(callback);
    }

    _tick(now) {
        if (!this.isRunning) return;

        const deltaMs = now - this.lastTime;
        this.lastTime = now;

        const scaledDelta = deltaMs * this.timeScale;

        for (const callback of this.subscribers) {
            callback(scaledDelta);
        }

        this.rafId = requestAnimationFrame((n) => this._tick(n));
    }
}

// Export a singleton instance for global use, or just the class.
// Based on the spec, having a single GameClock makes sense, but we'll export the class
// so it can be instantiated in main.js.
