# Momo Fever - Development Log

## Current Sprint
**Sprint 4: Plating Sub-Game & Toppings**
- Goal: Add a secondary gameplay layer (plating) to increase complexity, implement dynamic customer requests, and scale payouts based on accuracy.
- Status: Completed. Implemented the Plating Scene with time-scaling, interactive topping bins, dynamically generated customer topping requests, and graduated matching logic with detailed toast feedback.

## Past Sprints
**Sprint 3: Multiple Stations & Customer Types**
- Goal: Exercise the "many simultaneous timers" problem for real, and prove the data-driven level config actually lets you add content without new code.
- Status: Completed.

**Sprint 2: Floor Scene & Cooking Loop**
- Goal: Get the core game loop running (drag raw ingredient -> cook -> drag cooked item to customer -> get paid).
- Status: Completed.

## Features Implemented
- **Hotbar Drag Sources**: The hotbar acts as an infinite source of raw ingredients (`raw-momo`).
- **Station Cooking Logic**: The Steamer accepts raw momos, starts a timer, and visually progresses until the momo is "ready", turning it into a new draggable element.
- **Customer Spawning & Patience**: Customers spawn based on level configs, display what they want (including specific toppings), and their patience depletes over time.
- **Match System**: Upgraded (v2) to support Graduated Matching. It evaluates both the correct base dish and the accuracy of applied toppings (calculating intersections) to scale payment.
- **Quality of Life Dropzones**: Entire stations act as dropzones rather than individual small slots; dropping an item on a station automatically finds an empty slot for it.
- **Additional Stations**: Added 'Fry Pan' (noodles) and 'Laphing Tray' (laphing) station types to item registry.
- **Additional Customer Type**: Added 'Office Worker' with a fast patience drain rate and a telegraphed arrival (3-second warning cue).
- **Telegraph System**: Updated `FloorScene` to queue customers if they have a `telegraphMs` configuration.
- **Plating Scene**: A time-scaled popup that allows players to drag and drop toppings onto cooked items.
- **Plating Counter**: A 3-slot holding area on the floor scene for finalized, plated dishes before they are served.
- **Feedback Toast**: Implemented the Sprint 4D Feedback Toast UI system for visual feedback on serves, providing detailed info on missing/extra toppings.

## Bugs Fixed
- **Drag Intersection Failure**: `interact.js` wasn't triggering dropzones because we were moving a clone instead of the actual dragged element. Fixed by moving the real element instead and leaving a placeholder behind.
- **Pointer Event Blocking**: Dragged items were accidentally absorbing the pointer events during movement, meaning `interact.js` couldn't see the dropzones underneath them. Fixed by setting `pointer-events: none` on the dragging element.
- **Customer Accepting Raw Items**: The customer dropzone was configured to catch anything, allowing players to serve raw momos directly. Fixed by adding a filter in the `Customer.js` drop logic to explicitly reject any item starting with `raw-`.
- **Placeholder "Sticking" (Clone Bug)**: When a drag was rejected and the item snapped back, its clone placeholder would sometimes get stuck on screen forever. This was due to a race condition where the placeholder reference was erased before the 300ms snap-back animation finished. Fixed by properly scoping the variable.
- **Layout Jitter on Drag Start**: Clicking an item in the hotbar would cause adjacent items to instantly shift sideways because the placeholder was expanding the flexbox container. Fixed by attaching the placeholder directly to `document.body` with absolute coordinates so it sits behind the item without taking up physical layout space.
- **Plating Counter Missing DOM Fallback**: Updated the DOM injection dynamically to prevent items from disappearing if the browser cache held onto an older FloorScene layout.
- **Order Toppings Ignored**: The Order.js class previously ignored randomly generated requested toppings. Added it to the constructor to ensure customers display and expect their desired toppings.

## Persistent / Known Issues
- Needs complete testing of the full "serve" loop to ensure score and money update perfectly across edge cases.
- Combo mechanics, tips, and mood systems are currently excluded (scheduled for Sprint 5).
