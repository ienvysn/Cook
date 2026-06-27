# Momo Fever - Development Log

## Current Sprint
**Sprint 6: Tally Screen, Upgrades, Star Ratings, Polish Pass**
- Status: Completed.
- Added `TallyScreen.js` — post-level overlay showing revenue, tips, booster expenses, net total, and a 1–3 star rating driven by level thresholds from `data/levels.js`.
- Added a "Faster Steamer" upgrade stub: purchasable from the tally screen with earned money, persisted in session, reduces all cook times by 20% in subsequent levels.
- Full level progression loop: Level 1 → tally → upgrade → Level 2 → tally → Level 3 → tally → "Game Complete" screen with replay.
- Added `css/animations.css` with keyframes for combo pulse/glow, mood pulse, customer arrive, ready-item glow, booster shimmer.
- All tunable constants moved to `js/data/config.js`.

---

## Past Sprints

**Sprint 5: Gamification Layer (Combo + Mood + Tips + Boosters)**
- Status: Completed.
- Implemented `EventBus.js` — simple pub/sub; decouples MatchSystem results from all downstream systems.
- Implemented `ComboSystem.js` — tracks consecutive perfect serves; multiplier milestones at 5× (1.5x), 10× (2.0x), 15× (3.0x); resets on any fail or partial.
- Implemented `MoodSystem.js` — global mood meter (0–100); +8 on perfect, +2 on partial, −10 on fail, −5 on abandon; drives patience drain rate (0.8x calm → 1.6x frantic); mood:zero event triggers early level end.
- Implemented `BoosterSystem.js` — Speed Boost (Rs.150, 15s, cook −30%), Calm Crowd (Rs.150, 15s, patience drain −40%), Quick Plate (Rs.100, single-use, skips plating time-slow). Buttons grey out when unaffordable; countdown timer displayed on active timed boosters.
- Implemented tip variability: perfect + patience>70% = Rs.50 tip; perfect + patience 30–70% = Rs.25; perfect + patience<30% = Rs.10; partial = Rs.5.
- Updated `FloorScene.js` to emit EventBus events, apply combo multiplier to score, apply mood+calm-crowd drain modifier to patient timers, wire booster buttons to HUD.
- Updated `PlatingScene.js` to consume the Quick Plate flag and skip time-slow for that one popup.
- Updated `Station.js` to read booster cook speed factor each tick (progress × speedFactor).
- Added combo streak/multiplier display and mood-bar to HUD.

**Sprint 4: Plating Sub-Game & Toppings**
- Status: Completed. Implemented the Plating Scene with time-scaling, interactive topping bins, dynamically generated customer topping requests, and graduated matching logic with detailed toast feedback.

**Sprint 3: Multiple Stations & Customer Types**
- Status: Completed.

**Sprint 2: Floor Scene & Cooking Loop**
- Status: Completed.

---

## Features Implemented
- **GameClock** — single rAF-based tick loop with timeScale; every timer subscribes to it.
- **DragManager** — wraps interact.js; scene-scoped zones; visual proxy (no state mutation during drag); silent snap-back on invalid drops.
- **EventBus** — pub/sub decoupling MatchSystem results from ComboSystem, MoodSystem, Toast, and HUD.
- **Hotbar** — infinite ingredient strip; dragging never depletes.
- **Stations** — Steamer, Laphing Tray, Fry Pan; cook timers subscribe to GameClock; speed booster applied per-tick; upgrade reduces maxTime on receive.
- **Customer spawning** — patience drain scales with MoodSystem + Calm Crowd booster; office-worker telegraphed arrival.
- **MatchSystem v2** — graduated payment: set-based topping comparison, partial payment floor, tipEligible flag.
- **PlatingScene** — time-scaled popup; Quick Plate booster skips slow; cancel is zero-mutation.
- **ComboSystem** — streak/multiplier in HUD with CSS glow at milestones.
- **MoodSystem** — mood bar in HUD; mood:zero ends level early.
- **BoosterSystem** — 3 mid-level purchasable boosters; spend tracked separately for tally screen.
- **TallyScreen** — revenue / tips / expenses / net / stars / upgrade shop / continue or replay.
- **Level progression** — LEVEL_1 → 2 → 3 → game complete; session money and upgrades persist.
- **Config.js** — all tuning constants in one file.

## Bugs Fixed (historical)
- Drag intersection failure (moved real element, left placeholder).
- Pointer event blocking during drag (set pointer-events: none on dragging item).
- Customer accepting raw items (filter in Customer.js dropzone).
- Placeholder sticking on rejected drag (scoped variable, cleared before timeout).
- Layout jitter on drag start (placeholder attached to body with absolute coords).
- Plating counter missing DOM fallback.
- Order toppings ignored in constructor.

## Known Issues / Future Work
- Touch/mobile layout untested.
- No persistent save (session only by design per TECH_SPEC).
- Sound stubs not implemented (out of scope for Sprint 6 unless time allows).
- Friend Group / TikTok Reviewer customer types are deferred bonus content.
