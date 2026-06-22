# Momo Fever - Development Log

## Current Sprint
**Sprint 3: Multiple Stations & Customer Types**
- Goal: Exercise the "many simultaneous timers" problem for real, and prove the data-driven level config actually lets you add content without new code.
- Status: Completed. Added new stations (Fry Pan, Laphing Tray), a new telegraphed customer (Office Worker), and LEVEL_2 / LEVEL_3 configs.

## Past Sprints
**Sprint 2: Floor Scene & Cooking Loop**
- Goal: Get the core game loop running (drag raw ingredient -> cook -> drag cooked item to customer -> get paid).
- Status: Completed.

## Features Implemented
- **Hotbar Drag Sources**: The hotbar acts as an infinite source of raw ingredients (`raw-momo`).
- **Station Cooking Logic**: The Steamer accepts raw momos, starts a timer, and visually progresses until the momo is "ready", turning it into a new draggable element.
- **Customer Spawning & Patience**: Customers spawn based on level configs, display what they want, and their patience depletes over time.
- **Match System**: Simplistic (v1) evaluation comparing served item against the customer order.
- **Quality of Life Dropzones**: Entire stations act as dropzones rather than individual small slots; dropping an item on a station automatically finds an empty slot for it.
- **Additional Stations**: Added 'Fry Pan' (noodles) and 'Laphing Tray' (laphing) station types to item registry.
- **Additional Customer Type**: Added 'Office Worker' with a fast patience drain rate and a telegraphed arrival (3-second warning cue).
- **Telegraph System**: Updated `FloorScene` to queue customers if they have a `telegraphMs` configuration.
- **Level 2 and 3 Configs**: Defined `LEVEL_2` and `LEVEL_3` in `data/levels.js`.
- **Feedback Toast**: Implemented the Sprint 4D Feedback Toast UI system for visual feedback on serves.

## Bugs Fixed
- **Drag Intersection Failure**: `interact.js` wasn't triggering dropzones because we were moving a clone instead of the actual dragged element. Fixed by moving the real element instead and leaving a placeholder behind.
- **Pointer Event Blocking**: Dragged items were accidentally absorbing the pointer events during movement, meaning `interact.js` couldn't see the dropzones underneath them. Fixed by setting `pointer-events: none` on the dragging element.
- **Customer Accepting Raw Items**: The customer dropzone was configured to catch anything, allowing players to serve raw momos directly. Fixed by adding a filter in the `Customer.js` drop logic to explicitly reject any item starting with `raw-`.
- **Placeholder "Sticking" (Clone Bug)**: When a drag was rejected and the item snapped back, its clone placeholder would sometimes get stuck on screen forever. This was due to a race condition where the placeholder reference was erased before the 300ms snap-back animation finished. Fixed by properly scoping the variable.
- **Layout Jitter on Drag Start**: Clicking an item in the hotbar would cause adjacent items to instantly shift sideways because the placeholder was expanding the flexbox container. Fixed by attaching the placeholder directly to `document.body` with absolute coordinates so it sits behind the item without taking up physical layout space.

## Persistent / Known Issues
- Needs complete testing of the full "serve" loop to ensure score and money update perfectly across edge cases.
- We have not implemented plating (coming in Sprint 4), meaning cooked items go straight to the customer.
- Toppings and combo mechanics are entirely excluded for this sprint.
