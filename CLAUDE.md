# Momo Fever — Claude Context

## What this project is
A browser-based restaurant-tycoon game set at a Nepali street food stall.
Players drag raw ingredients into cooking stations, plate dishes via a mini-game
popup, then serve them to customers. Built with plain HTML5 + vanilla JS ES6
modules + interact.js. No bundler, no framework, no backend. Opens in a browser.

## How to run
Serve from a static server (ES6 modules need HTTP, not file://):
- `npx serve .`  or `python -m http.server`  or VSCode Live Server
- Then open `http://localhost:PORT/index.html`

## Architecture in one paragraph
`GameClock` is the single source of time (rAF loop, scaled delta). Every timer
subscribes to it — nothing uses setInterval. `DragManager` wraps interact.js;
zones register `accepts` lists and `onReceive` callbacks; everything in a
different scene is ignored; invalid/missed drops snap back silently with no state
mutation. `EventBus` decouples MatchSystem results from ComboSystem / MoodSystem
/ Toast — FloorScene emits events, systems react independently. Data is config-
driven (items.js, levels.js, customerTypes.js) — adding a level or item type is
a data change, not a code change.

## Key rules from TECH_SPEC.md
- `core/` never imports from entities/systems/scenes/ui — stays fully generic.
- Nothing hardcodes emoji/color/image paths — everything goes through
  `ITEM_REGISTRY` / `TOPPING_REGISTRY` and the shared `renderIcon()` function.
- No state is mutated during a drag — only on a resolved valid drop (visual-proxy
  rule).
- Plating popup uses `GameClock.setTimeScale(0.35)` so floor time slows (not
  pauses) while the popup is open.
- Boosters are mid-level consumables; upgrades are permanent/between-level. Do
  not merge the two systems.

## Sprint status (as of completion)
- Sprint 0–4: Done (skeleton → engine → first loop → multi-station → plating)
- Sprint 5: Done (EventBus, ComboSystem, MoodSystem, BoosterSystem, tips)
- Sprint 6: Done (TallyScreen with stars, upgrade stub, level progression loop)

## File map
```
js/core/       GameClock.js, DragManager.js, EventBus.js
js/entities/   Item.js, PlatedItem.js, Station.js, Hotbar.js, Order.js, Customer.js
js/systems/    MatchSystem.js, ComboSystem.js, MoodSystem.js, BoosterSystem.js
js/scenes/     FloorScene.js, PlatingScene.js
js/ui/         Toast.js, Ticket.js, TallyScreen.js
js/data/       items.js, levels.js, customerTypes.js, config.js
```

## Tuning constants
All live in `js/data/config.js`. Cook times, combo thresholds, mood gains/losses,
booster costs/durations, tip amounts — change only that file to rebalance.

## Upgrade system (Sprint 6 stub)
One upgrade: "Faster Steamer" — costs Rs. 200, reduces all cook times by 20%.
Persisted in a plain object in `main.js` scope for the session. Station reads
the upgrade flag on each `receiveItem()` call to set `slot.maxTime`.

## Level progression
`main.js` owns the level loop: LEVEL_1 → LEVEL_2 → LEVEL_3 → game complete.
`FloorScene` accepts an `onLevelEnd(stats)` callback; when the level goal is met
or mood hits zero, it calls that callback with revenue/tips/expenses data.
`TallyScreen.show(data)` renders the summary overlay. Clicking "Continue" or
"Replay" triggers the next action via callbacks.

## EventBus events emitted by FloorScene / MatchSystem
- `order:perfect` — `{ payment, tip, customer }`
- `order:partial` — `{ payment, customer }`
- `order:failed`  — `{ customer }`
- `customer:left` — `{ customer }` (patience ran out)

## Known issues / future work
- Touch/mobile layout not tested (interact.js supports it, layout is not tuned).
- No persistent save (session only by design).
- Sound stubs exist in Sprint 6 polish pass but are silent (no audio files).
- Friend Group / TikTok Reviewer customer types are deferred bonus content.
