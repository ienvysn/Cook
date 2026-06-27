import { COMBO_MILESTONES } from '../data/config.js';

export class ComboSystem {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.streak = 0;
        this.multiplier = 1.0;

        eventBus.on('order:perfect', () => {
            this.streak++;
            const milestone = COMBO_MILESTONES[this.streak];
            if (milestone) this.multiplier = milestone;
            this._emit();
        });

        eventBus.on('order:partial', () => this._reset());
        eventBus.on('order:failed',  () => this._reset());
    }

    _reset() {
        if (this.streak === 0) return;
        this.streak = 0;
        this.multiplier = 1.0;
        this._emit();
    }

    _emit() {
        this.eventBus.emit('combo:update', { streak: this.streak, multiplier: this.multiplier });
    }

    getMultiplier() { return this.multiplier; }
    getStreak()     { return this.streak; }
}
