# Momo Fever — Technical Specification

This document is the single source of truth for HOW the game is built. The
SPRINT_PLAN.md covers WHEN things get built; this covers the technical decisions
behind each piece, so you're not re-deriving them mid-build.

---

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Markup/Logic | Plain HTML5 + vanilla JS (ES6 classes, ES6 modules) | No build step, no install friction, runs by opening a file. Solid JS knowledge makes vanilla JS the right fit — frameworks would add complexity without solving our actual bottlenecks. |
| Styling | Plain CSS (no preprocessor) | Project is small enough that Sass/Less add tooling overhead for no real benefit. CSS variables (`:root { --... }`) used for theming/easy art-swap later. |
| Rendering | DOM elements (divs/images), NOT Canvas | We need native hit-testing, hover states, transitions, and (most importantly) drag-and-drop — all native to DOM, all hand-rolled in Canvas. Item count on screen (~10-15) is far below where Canvas's performance advantage would matter. |
| Drag & Drop | [interact.js](https://interactjs.io/) (CDN or vendored) | Purpose-built for DOM drag/drop/resize, handles touch+mouse uniformly, gives us draggable + dropzone primitives we wrap in our own `DragManager` rather than hand-rolling pointer math. |
| Game Framework | **None** (no Phaser/PixiJS/etc.) | Those are Canvas/WebGL-first and opinionated about scene structure — fighting their conventions to bolt on a DOM-based plating popup would cost more than it saves. Our hard problems (timer sync, drag logic) aren't things a game framework specifically solves better than a focused library + our own classes. |
| Module system | Native ES6 `import`/`export` | No bundler (Webpack/Vite/Rollup) needed at this scale. Modern browsers support ES6 modules directly via `<script type="module">`. |
| Persistence | None for MVP (in-memory only) | Explicitly out of scope per design discussion — session-only state is fine for a demo/presentation context. |

### Libraries used (full list)
- `interact.js` — drag and drop (only external dependency)

That's it. Everything else is hand-written. This is intentional — fewer
dependencies means fewer things that can break in ways you didn't write and
can't quickly debug during a live demo.

---

## 2. Directory Structure

```
momo-fever/
├── index.html
├── README.md
│
├── css/
│   ├── base.css          — resets, CSS variables (colors, spacing, fonts)
│   ├── layout.css        — floor layout, station/customer positioning grid
│   ├── components.css    — buttons, tickets, toasts, popup shell, meters
│   └── animations.css    — keyframes (float-up, pulse, particle burst, glow)
│
├── js/
│   ├── main.js            — entry point; boots GameClock, DragManager, loads Level 1
│   │
│   ├── core/
│   │   ├── GameClock.js   — central tick loop (rAF-based), timeScale, subscriptions
│   │   ├── DragManager.js — wraps interact.js; zone registration, scene scoping
│   │   └── EventBus.js    — simple pub/sub; decouples systems from each other
│   │
│   ├── entities/
│   │   ├── Item.js        — raw cooked item (idle/cooking/ready)
│   │   ├── PlatedItem.js  — item + toppings, post-popup, serveable
│   │   ├── Station.js     — N slots of Items, fed by Hotbar drag-in
│   │   ├── Hotbar.js      — fixed ingredient source strip, infinite, type-tagged
│   │   ├── Order.js       — what a customer wants (baseType, toppings, quantity)
│   │   └── Customer.js    — patience, order, type-specific behavior
│   │
│   ├── systems/
│   │   ├── MatchSystem.js   — graduated match/payment logic
│   │   ├── ComboSystem.js   — streak tracking, multiplier thresholds
│   │   ├── MoodSystem.js    — global meter, difficulty modifiers
│   │   ├── SpawnSystem.js   — customer arrival timing/logic per level config
│   │   └── BoosterSystem.js — in-level consumable purchases, temporary multipliers
│   │
│   ├── scenes/
│   │   ├── FloorScene.js   — main gameplay scene
│   │   └── PlatingScene.js — plating mini-game (its own state machine)
│   │
│   ├── ui/
│   │   ├── Toast.js        — floating feedback (perfect/partial/fail)
│   │   ├── Ticket.js       — customer order icon-row rendering
│   │   └── TallyScreen.js  — end-of-level summary + star rating
│   │
│   └── data/
│       ├── levels.js        — level config objects (stations, customers, goals)
│       ├── items.js         — item registry: baseTypes, valid toppings, icons
│       └── customerTypes.js — per-type patience/tip/behavior config
│
├── assets/
│   ├── icons/    — empty until real sprites exist; placeholders are
│   │               rendered from data/items.js (emoji + color), not files —
│   │               see Section 3.7. Drop files here and set `sprite` paths
│   │               in the registry when art is ready; no code changes needed.
│   └── sounds/   — empty until polish pass (Sprint 6)
│
└── lib/
    └── interact.min.js   — vendored copy (fallback if CDN unavailable during demo)
```

**Rule:** `core/` never imports from `entities/`, `systems/`, `scenes/`, or `ui/`.
It must stay fully generic and game-agnostic. If you find yourself wanting to
reference "momo" inside `core/`, that logic belongs one layer up.

---

## 3. Core Architecture Decisions (the "why" behind each system)

### 3.1 GameClock — single source of time
**Problem it solves:** Many independent timers (station cook times, customer
patience, mood decay) running via separate `setInterval` calls will drift
relative to each other and to real elapsed time, especially under load. This
was identified as the single biggest technical risk in the project.

**Solution:** One `requestAnimationFrame` loop computes delta time each frame,
multiplied by a global `timeScale` (default 1.0), and notifies all subscribers
with that scaled delta. Nothing else in the codebase should use `setInterval`
or `setTimeout` for gameplay timing — everything subscribes to GameClock instead.

**Why timeScale exists:** Required for the plating popup's "slow time, don't
pause" behavior. Building this in from the start avoids a painful retrofit.

### 3.2 DragManager — global, not per-zone
**Problem it solves:** With many drop zones (station slots, plating counter,
customer slots, topping buttons), letting each handle its own drag listeners
means duplicated hit-testing logic and inconsistent snap-back behavior.

**Solution:** One manager wraps interact.js. Zones register themselves with
an `accepts` list and an `onReceive` callback; draggables register with an
`itemType` and `scene`. On drop, the manager checks all zones in the *current
scene* for a match; valid drop commits via the zone's callback, anything else
(invalid type, empty space) **silently** snaps back — no negative feedback,
since missed drops are an input/dexterity failure, not a decision failure, and
punishing them undermines the "fair, not frustrating" design goal.

**Visual proxy rule:** The dragged element is a clone/ghost. No game-state
array is mutated during the drag — only on a resolved valid drop. This means a
cancelled or invalid drag can never leave the game in an inconsistent state,
by construction, not by extra error-handling.

**Scene scoping:** Zones tagged `scene: 'floor'` are inert while
`scene: 'plating'` is active, and vice versa. Prevents accidentally dragging a
topping onto a floor customer mid-popup.

### 3.3 Plating as a separate scene, not a modal
**Decision:** The plating popup is architected as its own self-contained
mini-game with its own entry/exit state machine, not a dialog bolted onto
FloorScene.

```
CLOSED → OPEN (item loaded, GameClock.timeScale → 0.35)
       → [select toppings, draggable, scene='plating']
       → CONFIRM ("Plate" button) → commit PlatedItem, remove raw Item,
         GameClock.timeScale → 1.0, scene → 'floor'
       → OR CANCEL → discard all popup-local state, zero game-state mutation,
         GameClock.timeScale → 1.0, scene → 'floor'
```

**Why time slows rather than pauses or runs full speed:** Full pause would let
players retreat from chaos at will, undermining the core "triage under
pressure" design. Full speed makes the popup unfair, since threats progress
invisibly while attention is locked in the popup UI. Slowed time preserves
stakes while keeping the popup fair to interact with. (Exact slow factor,
e.g. 0.35, is a tuning constant — adjust during playtesting, expose as a config
value, don't hardcode it in multiple places.)

**Why nothing commits until "Plate" is pressed:** Same principle as drag's
visual-proxy rule, one level up — cancel must be free and bug-proof, which
only works if real state was never touched in the first place.

### 3.4 Item/Order/Match data model

```js
// Raw item sitting in a station
Item = { id, baseType: 'momo', state: 'idle' | 'cooking' | 'ready' }

// Item after the plating popup — what's actually serveable
PlatedItem = { id, baseType: 'momo', toppings: ['chutney'], state: 'ready' }

// What a customer wants — one "unit"; quantity means N separate PlatedItems needed
Order = { baseType: 'momo', requestedToppings: ['chutney'], quantity: 3 }

// Result of comparing a PlatedItem against an Order unit
MatchResult = {
  baseTypeCorrect: bool,
  toppingAccuracy: 0.0–1.0,      // proportion of requested toppings correctly present
  payment: number,                // derived: full if perfect, proportional if partial, 0 if baseType wrong
  tipEligible: bool,               // only true on perfect match
  breaksCombo: bool,               // true only on baseTypeCorrect === false
  countsAsPerfectForMilestone: bool // true only if toppingAccuracy === 1.0
}
```

**Payment formula (starting point, tune via playtesting):**
```
if (!baseTypeCorrect) → payment = 0, customer leaves, item destroyed, breaksCombo = true
else → payment = basePrice * toppingAccuracy (floor at some minimum, e.g. 20%, so
       it's never a literal zero for a right-type/wrong-topping serve)
       tipEligible = (toppingAccuracy === 1.0)
       breaksCombo = false
       countsAsPerfectForMilestone = (toppingAccuracy === 1.0)
```

**Toppings are compared as sets, not arrays** — `['chutney','sesame']` matches
`['sesame','chutney']`. Order of selection never matters.

### 3.5 EventBus — decoupling systems
**Problem it solves:** Without it, FloorScene would need to directly call
ComboSystem, MoodSystem, Toast, and TallyScreen every time an order resolves —
tangling unrelated systems together and making each harder to test or tune
independently.

**Solution:** MatchSystem emits an event (`order:perfect`, `order:partial`,
`order:failed`, `customer:left`) with the MatchResult payload. ComboSystem,
MoodSystem, and Toast each subscribe independently and react. Adding a new
system that reacts to serves (e.g. a future achievements system) never requires
touching FloorScene or MatchSystem.

### 3.6 Level config — data, not code
```js
// data/levels.js
export const LEVEL_1 = {
  id: 1,
  name: "Sano Suru",
  stations: ['steamer'],
  customerTypes: ['college-student'],
  spawnIntervalSeconds: 8,
  goal: { type: 'serveCount', target: 10 },
  starThresholds: { 1: 0, 2: 400, 3: 700 } // score needed for each star rating
};
```
Adding a level means adding an object to this file. `LevelLoader`/`FloorScene`
reads whatever config it's given — it has no hardcoded knowledge of "Level 1"
as a special case. **If implementing a level ever requires an `if (level === 1)`
branch inside engine or scene code, that's a sign the config isn't expressive
enough yet — fix the config shape, don't special-case the code.**

### 3.7 Icon registry — shared between Ticket and PlatingScene, placeholder-first by design

**Hard rule: nothing in rendering code ever hardcodes an emoji, color, or image
path. Every visual reference goes through `ITEM_REGISTRY` / `TOPPING_REGISTRY`,
and rendering code only ever asks "what does the registry say to show for this
id." This is what makes swapping placeholders for real sprites later a one-file
change instead of a find-and-replace across the whole codebase.**

Each registry entry carries BOTH a placeholder representation and a slot for
the real asset, from day one — we don't add the `sprite` field later, we just
leave it `null` until art exists:

```js
// data/items.js
export const ITEM_REGISTRY = {
  momo: {
    placeholder: { emoji: '🥟', color: '#e8c87a' }, // used until sprite exists
    sprite: null,                                     // e.g. 'assets/icons/momo.png' once art is ready
    validToppings: ['chutney', 'sesame', 'chilli'],
  },
  laphing: {
    placeholder: { emoji: '🍜', color: '#d9534f' },
    sprite: null,
    validToppings: ['chilli-oil', 'extra-sour'],
  },
};

export const TOPPING_REGISTRY = {
  chutney: { placeholder: { emoji: '🌶️', color: '#a83232' }, sprite: null },
  sesame:  { placeholder: { emoji: '⚪', color: '#cfc9a3' }, sprite: null },
  // ...
};
```

**Rendering rule (used everywhere — Station slots, Ticket icons, PlatingScene
buttons, dragged ghost elements):**
```js
function renderIcon(registryEntry) {
  if (registryEntry.sprite) {
    return `<img src="${registryEntry.sprite}" class="item-icon" />`;
  }
  // placeholder fallback: colored div with emoji, same dimensions/class as
  // the real sprite will use, so layout never shifts when art is swapped in
  return `<div class="item-icon placeholder" style="background:${registryEntry.placeholder.color}">
            ${registryEntry.placeholder.emoji}
          </div>`;
}
```

**Why this matters beyond just "looks nicer later":** because every consumer
(Ticket, PlatingScene, Station, the drag ghost) calls the same `renderIcon()`
function instead of each independently deciding how to display an item, the
art-swap is guaranteed to be consistent everywhere at once. There's no risk of
"I swapped the sprite in the ticket but forgot the plating popup still shows
the old emoji" — there's only one place that decision is made.

**Workflow once real sprites exist:** drop the image files into
`assets/icons/`, set the corresponding `sprite` path in the registry, done.
Zero changes to `Ticket.js`, `PlatingScene.js`, `Station.js`, or `DragManager.js`.

---

### 3.8 Ingredient Hotbar — drag-in required, infinite supply, no depletion

**Decision:** Stations do not self-produce ingredients. Each station's cook
slot must be fed by dragging a raw ingredient in from a persistent **hotbar**
(Minecraft-style strip, fixed position on screen — see layout doc). This adds
intentionality to cooking without the complexity of real stock management.

- Hotbar slots are **type-tagged** (raw momo, raw noodles, raw laphing mix,
  etc.) and **infinite** — dragging from a slot never depletes it. This is a
  deliberate scope cut: real depletion/restocking was considered and explicitly
  rejected as unnecessary complexity requiring its own shop/restock UI.
- **Type restriction is enforced at the station, not the hotbar.** Each Station
  declares an `acceptsIngredient` list (e.g. Steamer accepts `['raw-momo']`
  only). Dragging raw noodles onto a Steamer is an invalid drop — snaps back
  silently, per the existing DragManager rule (Section 3.2). This reuses
  the SAME zone/accepts pattern already built for customer-matching; no new
  drag mechanic required, only new registry data.
- Hotbar itself is a fixed UI strip, not draggable/movable, sitting in its own
  reserved screen region (see layout doc — bottom or side strip, outside the
  station row).

```js
// data/items.js — extended
export const HOTBAR_SLOTS = [
  { ingredient: 'raw-momo', placeholder: { emoji: '🥟', color: '#e8c87a' } },
  { ingredient: 'raw-noodles', placeholder: { emoji: '🍝', color: '#e8d9a0' } },
  { ingredient: 'raw-laphing-mix', placeholder: { emoji: '🥗', color: '#c9e0a8' } },
];

// entities/Station.js — extended
Station.acceptsIngredient = ['raw-momo']; // Steamer example; Noodle Pot would be ['raw-noodles']
```

### 3.9 Boosters — in-level consumable spends, not a separate shop scene

**Decision:** Rather than a separate end-of-level shop scene for upgrades,
players can buy temporary **boosters** mid-level directly from the HUD,
spending their real, currently-earned money. This avoids an extra scene/
context-switch (unlike the plating popup, a shop scene here has no strong
justification) and creates a genuine in-the-moment risk/reward decision,
consistent with the game's core triage-under-pressure philosophy.

**This is distinct from the Sprint 6 permanent upgrade stub** (e.g. "buy a
faster steamer forever between levels") — boosters are temporary/consumable
and bought *during* a level; permanent upgrades are bought *between* levels.
Do not collapse these into one system; they have different data shapes
(duration + expiry vs. permanent stat modifier) and different UI locations
(HUD button vs. tally-screen shop stub).

| Booster | Effect | Duration | Cost (tune via playtesting) |
|---|---|---|---|
| Speed Boost | All station cook times -30% | 15 sec | Rs. 150 |
| Calm Crowd | All customers' patience drain -40% | 15 sec | Rs. 150 |
| Quick Plate | Next plating popup skips the time-slow penalty | Single use, consumed on next popup open | Rs. 100 |

**Payment rule:** buying a booster immediately subtracts its cost from the
player's real, current money total (same value shown in the HUD and carried
into the tally screen) — not a separate currency. This preserves real
risk/reward: spending now genuinely costs you score/money at the end screen.

```js
Booster = {
  id: 'speed-boost',
  cost: 150,
  effect: { type: 'cookTimeMultiplier', value: 0.7 },
  durationSeconds: 15, // omit/null for single-use consumables like Quick Plate
}
```

**Implementation note:** timed boosters are just another `GameClock`
subscriber with a countdown, applying a temporary multiplier to relevant
systems (Station cook speed, Customer patience decay) and reverting on
expiry — no new timer architecture needed, this reuses Section 3.1 directly.

## 4. Key Numeric Constants to Tune (placeholders — finalize via playtesting)

These should all live in one place (e.g. `data/config.js` or top of `data/levels.js`)
as named constants, never magic numbers scattered in logic files.

| Constant | Starting value | Notes |
|---|---|---|
| `PLATING_TIME_SCALE` | 0.35 | How much floor time slows during plating popup |
| `MAX_ORDER_QUANTITY` | 3 (can vary per customer type) | Per-customer-type override for Friend Group etc. |
| `MIN_PARTIAL_PAYMENT_FLOOR` | 0.2 (20% of base price) | Floor so partial match is never literally Rs. 0 |
| `COMBO_MILESTONES` | 5 → x1.5, 10 → x2, 15 → x3 | From original design doc |
| `MOOD_DECAY_PER_FAIL` / `MOOD_GAIN_PER_PERFECT` | TBD via playtesting | |
| `STATION_COOK_TIMES` | per item type, TBD | Tune so chaos is survivable, per design philosophy |
| `BOOSTER_SPEED_BOOST_COST` / `_MULTIPLIER` / `_DURATION` | Rs. 150 / 0.7 / 15s | Speed Boost booster |
| `BOOSTER_CALM_CROWD_COST` / `_MULTIPLIER` / `_DURATION` | Rs. 150 / 0.6 / 15s | Calm Crowd booster |
| `BOOSTER_QUICK_PLATE_COST` | Rs. 100 | Single-use, no duration field needed |

---

## 5. Things Explicitly Deferred / Out of Scope for MVP

These were discussed and intentionally cut or deferred — listed here so they
don't get accidentally "remembered" mid-build as something that should already
exist:

- Ingredient depletion/restocking (the hotbar IS in scope and required for
  every cook action — see Section 3.8 — but it never runs out. Stock running
  low/zero and needing restock was considered and explicitly rejected as
  unnecessary complexity for this project, not deferred-but-planned.)
- Persistent save between sessions
- Friend Group, TikTok Reviewer (bonus content if Sprint 1-5 finish early)
- Environmental events (load shedding, rain rush, etc.)
- A separate shop/upgrade scene (replaced by in-level HUD boosters, Section 3.9,
  plus a single permanent-upgrade stub at the Sprint 6 tally screen)
- Sound (stubbed at best until Sprint 6 polish pass)
- Mobile/touch optimization (interact.js supports it, but layout/testing for
  touch is not a planned pass unless time allows)

---

## 6. Browser/Runtime Notes

- Target: fullscreen responsive browser game (not a fixed mobile portrait frame)
- No backend — fully client-side, runs from static files
- If ES6 modules throw CORS errors when opening `index.html` directly via
  `file://`, run a trivial local static server (e.g. `npx serve`,
  `python -m http.server`, or VSCode's Live Server extension) — note this in
  README so a grader running it locally isn't confused by a blank page.
