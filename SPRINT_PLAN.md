# Momo Fever — Sprint Plan

## How to use this document

Each sprint has a **Definition of Done (DoD)**. You do not move to the next sprint
until every box in the current sprint's DoD is checked AND you've manually played
the result. If a sprint's DoD can't be met in the time you expected, that's a signal
to cut scope from the *next* sprint, not to skip ahead with a half-working foundation.

Rule of thumb: every sprint must end with something you can physically click/drag in
a browser. "I wrote the class but didn't wire it up yet" does not count as done.

add the current sprint plans chnages or bug ,/ fixes in log.md

---

## Sprint 0 — Project Skeleton (no game logic)

**Goal:** Empty but correctly wired project. Proves the file structure loads, nothing more.

### Tasks
- Create full directory structure (see TECH_SPEC.md)
- `index.html` loads `main.js` as an ES6 module, loads `interact.js` via CDN
- `main.js` logs "game booted" to console, nothing else
- All CSS files linked, even if mostly empty
- Confirm it runs by opening `index.html` directly in browser (no server needed) —
  if ES6 modules complain about CORS/file:// restrictions, set up a trivial local
  server (e.g. `python -m http.server` or VSCode Live Server) and note that in README

### Definition of Done
- [ ] Opening `index.html` shows a blank page with no console errors
- [ ] Console log confirms JS is running
- [ ] interact.js is confirmed loaded (`typeof interact !== 'undefined'` in console)
- [ ] Directory structure matches TECH_SPEC.md exactly

### Explicitly NOT in this sprint
- Any game logic, any visible UI, any classes

---

## Sprint 1 — Core Engine: Clock + Drag (the foundation everything depends on)

**Goal:** Prove the two riskiest systems work in isolation, before any game content
exists. This is deliberately abstract/ugly — you are testing plumbing, not making
something fun yet.

### Sub-sprint 1A — GameClock
- `core/GameClock.js`: class with `start()`, `pause()`, `setTimeScale(n)`,
  `subscribe(callback)` — uses a single `requestAnimationFrame` loop, calculates
  delta time between frames, multiplies by `timeScale`, calls all subscribed
  callbacks with that scaled delta
- Test harness: a single `<div>` with a number counting up, driven entirely by
  a GameClock subscription, with two buttons: "slow time" (0.35x) and "normal time" (1x)
- **Why this matters:** if this drifts or feels janky with one subscriber, it will
  be unusable with fifteen. Catch it now while it's cheap to fix.

### Sub-sprint 1B — DragManager
- `core/DragManager.js`: wraps interact.js, exposes:
  - `registerZone(id, { scene, accepts: [], onReceive: fn })`
  - `registerDraggable(element, { itemType, scene })`
  - Internally handles: drag start, drag move (visual only), drop (hit-test
    against registered zones, accept or snap back silently), scene-scoping
    (zones in 'plating' scene are ignored while scene is 'floor')
- Test harness: 3 colored boxes (draggables) + 2 drop zones (one accepts
  'red' only, one accepts anything) + 1 area that's not a drop zone at all.
  Confirm: valid drop commits, invalid drop snaps back silently, dropping on
  empty space snaps back silently, all three with NO state mutation until
  drop resolves (per our "visual proxy" decision).

### Definition of Done
- [ ] GameClock test harness counts smoothly, slow-time button visibly changes rate, no drift over 30+ seconds
- [ ] DragManager test harness: all 3 snap-back cases behave correctly with zero console errors
- [ ] Dragging a box does NOT change any JS variable until a valid drop occurs (verify by logging)
- [ ] Code for both classes has no references to momo/customers/stations — fully generic, reusable

### Explicitly NOT in this sprint
- Anything game-specific. No Station, no Customer, no momo. If you find yourself
  writing "if itemType === 'momo'" inside DragManager, stop — that logic belongs
  in a later layer, not the engine core.

---

## Sprint 2 — First Playable Loop (raw-serve, no plating, one customer type)

**Goal:** The entire core loop works end to end, ugly is fine. This is your first
genuinely "playable" build.

### Sub-sprint 2A — Entities
- `entities/Item.js` — `{ id, baseType, state: 'idle'|'cooking'|'ready' }`
- `entities/Hotbar.js` — fixed strip of ingredient slots (`data/items.js`
  `HOTBAR_SLOTS`), infinite supply, no depletion. Each slot is a drag SOURCE
  registered with DragManager, `itemType` tagged, `scene: 'floor'`.
- `entities/Station.js` — holds N slots; each slot is a drop ZONE that only
  `accepts` its station's `acceptsIngredient` list (e.g. Steamer accepts
  `['raw-momo']` only — dragging raw noodles onto it snaps back silently).
  Receiving a valid ingredient starts a cook timer subscribed to GameClock;
  on completion, slot's Item becomes 'ready' and itself becomes draggable
  (now tagged as a cooked-item drag SOURCE, separate from the hotbar).
- `entities/Order.js` — `{ baseType, requestedToppings: [], quantity }` (toppings
  unused this sprint, but field exists so Sprint 4 doesn't require a data model change)
- `entities/Customer.js` — `{ id, order: Order, patience, maxPatience }`, patience
  subscribed to GameClock, removes self at zero

### Sub-sprint 2B — Floor Scene wiring
- `scenes/FloorScene.js` — renders the Hotbar strip + one Steamer station,
  spawns College Student customers on an interval (`data/levels.js` Level 1
  config), renders patience bars, registers customer "slots" as drop zones
  via DragManager
- Full cook interaction is now two drags, not one click: (1) drag raw-momo
  from Hotbar into a Steamer slot — starts cook timer, (2) once ready, drag
  the cooked momo out of the Steamer onto a customer (no plating yet — this
  is intentionally the simplified version, plating is added in Sprint 4 as a
  new required stop)
- `systems/MatchSystem.js` — v1: boolean match only (baseType equality). Returns
  `{ success: bool, payment: number }`. (Graduated payment comes in Sprint 4
  alongside toppings — can't grade topping accuracy that doesn't exist yet.)
- Wrong serve: per spec, customer leaves immediately, item is destroyed, no payment
- Score + money display, updates on serve

### Definition of Done
- [ ] Customers spawn automatically and queue visibly
- [ ] Dragging raw-momo from Hotbar onto Steamer starts cooking (visible timer/progress); dragging raw-momo onto a station that doesn't accept it snaps back silently with no state change
- [ ] Hotbar slot remains usable immediately again after a drag (infinite supply, confirmed by dragging from the same slot 5+ times in a row with no degradation)
- [ ] Cooked momo becomes draggable when ready, separate drag source from the hotbar slot it came from
- [ ] Dragging ready momo onto correct customer: customer leaves happy, money increases, customer removed
- [ ] Dragging momo onto wrong customer / customer who didn't order momo: item destroyed, customer unaffected (or leaves per rule — confirm this matches "wrong type = leaves, no pay" exactly)
- [ ] A customer's patience reaching zero removes them with no payment, no penalty beyond that (soft-fail philosophy)
- [ ] Level ends after configured duration or goal count, shows a bare score number (full tally screen is Sprint 6)
- [ ] You can play this start-to-finish without console errors

### Explicitly NOT in this sprint
- Plating popup, toppings, combo system, mood meter, boosters, multiple
  stations, multiple customer types, tally screen polish, star ratings,
  ingredient depletion (hotbar is infinite by design, not a future cut)

---

## Sprint 3 — Multiple Stations & Customer Types

**Goal:** Exercise the "many simultaneous timers" problem for real, and prove
the data-driven level config actually lets you add content without new code.

### Sub-sprint 3A — Additional stations
- Add Fry Pan and Laphing Tray station types (just new Station instances with
  different `baseType` output and possibly different cook durations — should
  require zero changes to `Station.js` itself, only new entries in `data/items.js`)
- Confirm: adding a station type is purely a data change. If it's not, that's
  a sign Station.js has hidden assumptions — fix before continuing.

### Sub-sprint 3B — Additional customer type
- Add Office Worker: fast patience drain, telegraphed arrival (3-second warning
  cue before joining queue — can be a simple visual/text cue for now, sound is
  a polish-pass item)
- Confirm multiple customers with *different* drain rates all run correctly off
  the same GameClock with no interference

### Sub-sprint 3C — Level 2 and Level 3 configs
- Write `data/levels.js` entries for Level 2 (adds Laphing) and Level 3 (adds
  Fry Pan), per the original design doc's progression
- Confirm switching levels is a config change + reload, not a code change

### Definition of Done
- [ ] 3 station types functional simultaneously, each with independent cook timers, no timer drift or interference at 5+ minutes of play
- [ ] 2 customer types functional, correctly different patience behavior
- [ ] Level 1/2/3 are distinguished ONLY by their config object — verified by diffing what changed to add a level (should be data/levels.js only)
- [ ] Can play a full level with multiple stations + both customer types active at once without bugs

### Explicitly NOT in this sprint
- Plating, toppings, combo, mood, Friend Group, TikTok Reviewer, tally screen

---

## Sprint 4 — Plating Sub-Game + Toppings + Graduated Payment

**Goal:** Layer the second mini-loop onto the now-proven floor loop. This is the
most architecturally risky remaining sprint — budget extra time here.

### Sub-sprint 4A — PlatingScene shell
- `scenes/PlatingScene.js` — opens on drag-to-plating-counter, sets
  `GameClock.setTimeScale(0.35)` on open, `setTimeScale(1)` on any close path
- Popup UI shell with a "Plate" (confirm) button and a close/cancel button
- Cancel path: discard all popup-local state, item visually returns to its
  pre-drag position, zero game-state mutation (verify nothing changed)

### Sub-sprint 4B — Topping selection
- `data/items.js` extended: each baseType lists its valid toppings (momo gets
  chutney/sesame/chilli, noodles get its own set, no cross-contamination).
  Use the placeholder-first registry shape from TECH_SPEC.md Section 3.7
  (`placeholder: { emoji, color }`, `sprite: null`) — do NOT hand-make icon
  files for this sprint. Every item/topping should be visually distinguishable
  using only emoji + color at this stage.
- Toppings draggable onto the popup's "plate" area, using the SAME DragManager
  (new zone registration scoped to `scene: 'plating'`)
- Confirm button only enabled once at least... [decide: is an unmodified/no-topping
  plate platable, or must something be added? Recommend: yes, plain is valid,
  since not every order wants toppings]
- On confirm: create `PlatedItem` combining baseType + selected toppings, NOW
  commit removal of raw item from station, place PlatedItem back at the
  counter, ready to drag to a customer

### Sub-sprint 4C — Graduated matching
- `systems/MatchSystem.js` v2: compare requestedToppings vs actual as sets
  (order-independent), return `{ baseTypeCorrect, toppingAccuracy, payment,
  breaksCombo, countsAsPerfect }` per our earlier design
- Wrong base type: existing harsh rule unchanged (nothing, leaves, destroyed)
- Right type, topping mismatch: proportional payment, no tip, small mood dip,
  does not break combo, does not count as perfect for milestones

### Sub-sprint 4D — Feedback toast
- `ui/Toast.js` — spawns above customer, reuses score-float animation pattern,
  shows amount + short detail text on partial match (e.g. "missing chutney")
- Three visual variants: perfect / partial / fail, per our design

### Definition of Done
- [ ] Opening plating popup visibly slows (not stops) the floor in the background
- [ ] Cancel reverts everything with zero state change — verified by checking station/item state before and after a cancelled plating attempt
- [ ] Confirm produces a correctly-tagged PlatedItem draggable to customers
- [ ] Toppings are correctly restricted per base item type (noodles never show chutney, etc.)
- [ ] Perfect match pays full + toast confirms; topping mismatch pays partial + toast explains why; wrong base type fails completely per existing rule
- [ ] Full loop playable: cook → plate (with toppings) → serve, across all 3 stations from Sprint 3

### Explicitly NOT in this sprint
- Combo system, mood meter, Friend Group, TikTok Reviewer, tally screen, star ratings

---

## Sprint 5 — Gamification Layer (Combo + Mood + Tips)

**Goal:** Add the systems that create the "feel" — these sit ON TOP of the now-stable
core loop and should not require touching FloorScene's fundamental logic, only
reacting to events it already emits.

### Sub-sprint 5A — EventBus retrofit (if not already in place from Sprint 1)
- Confirm MatchSystem results are emitted as events (`order:perfect`,
  `order:partial`, `order:failed`, `customer:left`) that other systems subscribe
  to, rather than FloorScene directly calling ComboSystem/MoodSystem. Keeps
  systems decoupled — easier to tune independently.

### Sub-sprint 5B — ComboSystem
- Tracks consecutive perfect serves, resets on any failure or partial
- Multiplier thresholds per original design doc (5/10/15 → x1.5/x2/x3)
- Visual: counter UI + glow intensification at milestones

### Sub-sprint 5C — MoodSystem
- Global meter, increments on perfect/good serves, decrements on fails/partials/
  abandons, drives: customer arrival calmness, patience drain rate modifier,
  zero-mood triggers early level end

### Sub-sprint 5D — Tip variability
- Implement the tip table from the original design doc (early-serve bonus,
  exact-spice bonus once spice exists, reviewer multiplier if Reviewer is in
  this sprint or deferred to Sprint 6)

### Sub-sprint 5E — BoosterSystem
- `systems/BoosterSystem.js` — 3 HUD-accessible boosters (Speed Boost, Calm
  Crowd, Quick Plate per TECH_SPEC.md Section 3.9). Buying subtracts cost
  from real current money immediately; button greys out if unaffordable.
- Timed boosters (Speed Boost, Calm Crowd): subscribe to GameClock, apply a
  temporary multiplier to Station cook speed / Customer patience decay
  respectively, auto-revert on expiry. Reuses existing GameClock subscription
  pattern — no new timer mechanism.
- Quick Plate: single-use flag consumed on the next PlatingScene open, skips
  the `PLATING_TIME_SCALE` slowdown for that one popup only.
- These are explicitly NOT the same system as the Sprint 6 permanent upgrade
  stub — do not merge the two. Boosters are temporary/in-level; the Sprint 6
  upgrade is permanent/between-level.

### Definition of Done
- [ ] Combo visibly increments/resets correctly across a full play session
- [ ] Mood meter responds to both positive and negative events and visibly affects difficulty (patience drain rate change is observable)
- [ ] Hitting zero mood ends the level early
- [ ] Tips vary per the table, confirmed by playing multiple serves and observing different payouts for the same item under different conditions
- [ ] All 3 boosters purchasable mid-level, correctly deduct real money, correct effect observed (faster cook times / slower patience drain / skipped plating slowdown), timed ones correctly expire and revert
- [ ] Booster buttons grey out / are unclickable when money is insufficient

### Explicitly NOT in this sprint
- Friend Group, TikTok Reviewer, environmental events, tally screen, the
  separate permanent-upgrade stub (that's Sprint 6)

---

## Sprint 6 — Tally Screen, Upgrades (stub), Star Ratings, Polish Pass

**Goal:** Wrap the loop in the meta-layer that makes it feel like a complete game,
plus whatever feedback/sound polish time allows.

### Sub-sprint 6A — Tally screen
- `ui/TallyScreen.js` — end-of-level summary: revenue, tips, (cosmetic) expenses
  line, net total, star rating based on score thresholds (config-driven, per level)

### Sub-sprint 6B — Upgrade stub
- One simple upgrade (e.g. "Faster Steamer" — flat cost, flat cook-time reduction)
  purchasable with earned money between levels, persisted in memory for the session
- Explicitly a stub, not a full economy — sufficient to demonstrate the
  progression loop exists

### Sub-sprint 6C — Polish pass (time-boxed, cut ruthlessly if short on time)
- Sound stubs (ding, fail buzz) if time allows
- Particle/CSS feedback flourishes
- Pause menu
- Friend Group and/or TikTok Reviewer IF Sprints 1-5 finished with time to spare
  — these are explicitly bonus, not required for a complete demo

### Definition of Done
- [ ] Tally screen displays correct, real numbers after every level
- [ ] At least one upgrade purchasable and its effect is observable in the next level
- [ ] Star rating displays and is consistent with score thresholds
- [ ] Full play session possible: menu → level 1 → tally → upgrade → level 2 → tally, no crashes

### Explicitly NOT required
- Everything in 6C is opportunistic. If you only get through 6A and 6B, you have
  a complete, presentable demo. Do not sacrifice Sprint 1-5 stability to chase 6C items.

---

## What "done with the whole project" looks like if time runs out

If you run out of time mid-sprint, the **last fully-completed sprint is your demo**,
not whatever is half-built in the current one. A solid Sprint 4 (full loop with
plating and toppings) is a strong demo even with zero combo/mood/tally. A broken
Sprint 6 with half-working everything is a weak demo. Always protect the last
sprint boundary, not the most features.
