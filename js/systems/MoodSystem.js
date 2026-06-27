import {
    MOOD_START, MOOD_MAX,
    MOOD_GAIN_PERFECT, MOOD_GAIN_PARTIAL,
    MOOD_LOSS_FAIL, MOOD_LOSS_PARTIAL, MOOD_LOSS_ABANDON,
    MOOD_DRAIN_MIN, MOOD_DRAIN_MAX
} from '../data/config.js';

export class MoodSystem {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.mood = MOOD_START;

        eventBus.on('order:perfect', () => this._change(+MOOD_GAIN_PERFECT));
        eventBus.on('order:partial', () => this._change(-MOOD_LOSS_PARTIAL));
        eventBus.on('order:failed',  () => this._change(-MOOD_LOSS_FAIL));
        eventBus.on('customer:left', () => this._change(-MOOD_LOSS_ABANDON));
    }

    _change(delta) {
        this.mood = Math.max(0, Math.min(MOOD_MAX, this.mood + delta));
        this.eventBus.emit('mood:update', { mood: this.mood, max: MOOD_MAX });
        if (this.mood <= 0) {
            this.eventBus.emit('mood:zero', {});
        }
    }

    // Returns a multiplier for patience drain speed.
    // At 100% mood → MOOD_DRAIN_MIN (slower drain).
    // At 0% mood   → MOOD_DRAIN_MAX (faster drain).
    getDrainMultiplier() {
        const fraction = this.mood / MOOD_MAX;
        return MOOD_DRAIN_MAX - fraction * (MOOD_DRAIN_MAX - MOOD_DRAIN_MIN);
    }

    getMood() { return this.mood; }
}
