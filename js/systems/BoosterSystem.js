import {
    BOOSTER_SPEED_COST, BOOSTER_SPEED_MULTIPLIER, BOOSTER_SPEED_DURATION,
    BOOSTER_CALM_COST,  BOOSTER_CALM_MULTIPLIER,  BOOSTER_CALM_DURATION,
    BOOSTER_PLATE_COST
} from '../data/config.js';

export const BOOSTER_DEFS = {
    'speed-boost': {
        id: 'speed-boost', label: 'Speed Boost', emoji: '⚡',
        cost: BOOSTER_SPEED_COST, durationMs: BOOSTER_SPEED_DURATION
    },
    'calm-crowd': {
        id: 'calm-crowd', label: 'Calm Crowd', emoji: '😌',
        cost: BOOSTER_CALM_COST, durationMs: BOOSTER_CALM_DURATION
    },
    'quick-plate': {
        id: 'quick-plate', label: 'Quick Plate', emoji: '🍽️',
        cost: BOOSTER_PLATE_COST, durationMs: null
    }
};

export class BoosterSystem {
    constructor(gameClock, eventBus) {
        this.gameClock = gameClock;
        this.eventBus  = eventBus;

        // timers for active timed boosters (ms remaining)
        this._timers = { 'speed-boost': 0, 'calm-crowd': 0 };
        this._quickPlateReady = false;

        this._getMoney  = () => 0;
        this._spendMoney = () => {};

        this._unsubscribe = gameClock.subscribe((delta) => this._tick(delta));
    }

    setMoneyCallbacks(getMoney, spendMoney) {
        this._getMoney  = getMoney;
        this._spendMoney = spendMoney;
    }

    activate(boosterId) {
        const def = BOOSTER_DEFS[boosterId];
        if (!def || this._getMoney() < def.cost) return false;

        this._spendMoney(def.cost);

        if (boosterId === 'quick-plate') {
            this._quickPlateReady = true;
        } else {
            this._timers[boosterId] = def.durationMs;
        }

        this.eventBus.emit('booster:activated', { boosterId, durationMs: def.durationMs });
        return true;
    }

    // Called by PlatingScene — consumes the flag and returns true if it was set.
    consumeQuickPlate() {
        if (this._quickPlateReady) {
            this._quickPlateReady = false;
            this.eventBus.emit('booster:expired', { boosterId: 'quick-plate' });
            return true;
        }
        return false;
    }

    _tick(delta) {
        for (const id of ['speed-boost', 'calm-crowd']) {
            if (this._timers[id] > 0) {
                this._timers[id] -= delta;
                if (this._timers[id] <= 0) {
                    this._timers[id] = 0;
                    this.eventBus.emit('booster:expired', { boosterId: id });
                    this.eventBus.emit('booster:update', { boosterId: id, remainingMs: 0 });
                } else {
                    this.eventBus.emit('booster:update', { boosterId: id, remainingMs: this._timers[id] });
                }
            }
        }
    }

    // Cook speed factor: <1 means faster cooking (progress advances faster).
    // Returns the inverse of the multiplier so Station can multiply progress delta.
    getCookSpeedFactor() {
        return this._timers['speed-boost'] > 0
            ? 1 / BOOSTER_SPEED_MULTIPLIER  // ~1.43x progress rate
            : 1.0;
    }

    // Patience drain factor: <1 means slower drain (customers more patient).
    getCalmFactor() {
        return this._timers['calm-crowd'] > 0 ? BOOSTER_CALM_MULTIPLIER : 1.0;
    }

    isActive(boosterId) {
        if (boosterId === 'quick-plate') return this._quickPlateReady;
        return this._timers[boosterId] > 0;
    }

    getRemainingMs(boosterId) {
        if (boosterId === 'quick-plate') return this._quickPlateReady ? 1 : 0;
        return this._timers[boosterId] || 0;
    }

    destroy() {
        if (this._unsubscribe) this._unsubscribe();
    }
}
