// Tuning constants — change only this file to rebalance the game.
// Never scatter these as magic numbers in logic files.

export const PLATING_TIME_SCALE      = 0.35;  // How much floor time slows during plating popup
export const MAX_ORDER_QUANTITY      = 3;      // Default per-customer max; override per type
export const MIN_PARTIAL_PAYMENT_FLOOR = 0.2; // Floor so partial never pays literally Rs. 0

// Combo milestones: consecutive perfect serves → multiplier
export const COMBO_MILESTONES = { 5: 1.5, 10: 2.0, 15: 3.0 };

// Mood system
export const MOOD_START            = 60;   // Starting mood (0–100)
export const MOOD_MAX              = 100;
export const MOOD_GAIN_PERFECT     = 8;
export const MOOD_GAIN_PARTIAL     = 2;
export const MOOD_LOSS_FAIL        = 10;
export const MOOD_LOSS_PARTIAL     = 3;
export const MOOD_LOSS_ABANDON     = 5;    // customer leaves from patience

// Mood → patience drain: high mood = calmer crowd (lower multiplier)
// At MOOD_MAX drain rate = 0.8x; at 0 drain rate = 1.6x
export const MOOD_DRAIN_MIN = 0.8;
export const MOOD_DRAIN_MAX = 1.6;

// Tips
export const TIP_PERFECT_HIGH_PATIENCE = 50;  // perfect serve, patience > 70%
export const TIP_PERFECT_MID_PATIENCE  = 25;  // perfect serve, patience 30–70%
export const TIP_PERFECT_LOW_PATIENCE  = 10;  // perfect serve, patience < 30%
export const TIP_PARTIAL               = 5;

// Boosters
export const BOOSTER_SPEED_COST       = 150;
export const BOOSTER_SPEED_MULTIPLIER = 0.7;   // cook time factor (0.7 = 30% faster)
export const BOOSTER_SPEED_DURATION   = 15000; // ms

export const BOOSTER_CALM_COST        = 150;
export const BOOSTER_CALM_MULTIPLIER  = 0.6;   // patience drain factor (0.6 = 40% slower drain)
export const BOOSTER_CALM_DURATION    = 15000; // ms

export const BOOSTER_PLATE_COST       = 100;   // single-use, skips plating time-slow

// Upgrades (between-level, session-persistent)
export const UPGRADE_FASTER_STEAMER_COST       = 200;
export const UPGRADE_FASTER_STEAMER_MULTIPLIER = 0.8; // cook time factor (0.8 = 20% faster)
