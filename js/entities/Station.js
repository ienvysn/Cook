import { ITEM_REGISTRY } from '../data/items.js';
import { UPGRADE_FASTER_STEAMER_MULTIPLIER } from '../data/config.js';

// Maps station type → the sprite sheet used for that station's slots.
// Each sprite sheet has 4 frames horizontally: [empty, cooking, ready, burnt].
// Laphing uses a 3×2 grid (see CSS for frame positions).
const STATION_SPRITES = {
    'steamer':      'assets/icons/images/momo.png',
    'fry-pan':      'assets/icons/images/finalfryingpan asset.png',
    'laphing-tray': 'assets/icons/images/laphingsheet.png',
    'cooking-pot':  'assets/icons/images/keemanoodle.png'
};

const STATION_LABELS = {
    'steamer':      'Steamer',
    'fry-pan':      'Fry Pan',
    'laphing-tray': 'Laphing',
    'cooking-pot':  'Noodles'
};

export class Station {
    constructor(config, gameClock) {
        this.id      = config.id;
        this.type    = config.type;
        this.accepts = config.accepts;
        this.produces = config.produces || null; // what food type this station outputs
        this.slots   = new Array(config.slots).fill(null);
        this.gameClock   = gameClock;
        this.element     = null;
        this.dragManager = null;
        this.clockSubscription = null;

        // Set by FloorScene after construction
        this.boosterSystem = null;
        this.upgrades      = null;
        this.audioManager  = null;
    }

    render(dragManager) {
        this.dragManager = dragManager;

        const div = document.createElement('div');
        div.className = `station station-${this.type} dropzone`;
        div.id = this.id;

        const label = STATION_LABELS[this.type] || this.type;
        div.innerHTML = `<div class="station-name">${label}</div><div class="station-slots"></div>`;

        const slotsContainer = div.querySelector('.station-slots');
        this.slots.forEach((_, index) => {
            const slotEl = document.createElement('div');
            slotEl.className = 'station-slot state-empty';
            slotEl.id = `${this.id}-slot-${index}`;
            slotsContainer.appendChild(slotEl);
        });

        dragManager.registerZone(this.id, div, {
            scene: 'floor',
            accepts: this.accepts,
            onReceive: (draggedItemType, draggableEl) => {
                // Laphing-tray (and any station with onInstantOpen set) skips the cook timer
                // and hands off directly to a mini-game popup.
                if (this.onInstantOpen) {
                    this.onInstantOpen(draggedItemType, draggableEl);
                    return;
                }
                const availableIndex = this.slots.findIndex(slot => slot === null);
                if (availableIndex !== -1) {
                    this.receiveItem(availableIndex, draggedItemType);
                } else {
                    if (draggableEl) draggableEl.setAttribute('data-drop-valid', 'false');
                }
            }
        });

        this.element = div;
        this.clockSubscription = this.gameClock.subscribe((delta) => this.tick(delta));
        return div;
    }

    receiveItem(index, rawIngredient) {
        if (this.slots[index] !== null) return;

        // Use the station's declared output type, or fall back to stripping 'raw-'
        const baseType   = this.produces || rawIngredient.replace('raw-', '');
        const itemConfig = ITEM_REGISTRY[baseType];
        if (!itemConfig) return;

        const upgradeMultiplier = this.upgrades?.fasterSteamer
            ? UPGRADE_FASTER_STEAMER_MULTIPLIER
            : 1.0;

        this.slots[index] = {
            baseType,
            progress: 0,
            maxTime:  itemConfig.cookTimeMs * upgradeMultiplier,
            state:    'cooking',
            uiNeedsUpdate: true
        };

        // Start cooking sound for this station type
        if (this.audioManager) {
            if (this.type === 'fry-pan')     this.audioManager.startFrying();
            if (this.type === 'cooking-pot') this.audioManager.startBoiling();
            if (this.type === 'steamer')     this.audioManager.startSteam();
        }

        this.updateSlotUI(index);
    }

    tick(delta) {
        const speedFactor = this.boosterSystem ? this.boosterSystem.getCookSpeedFactor() : 1.0;

        this.slots.forEach((slot, index) => {
            if (slot && slot.state === 'cooking') {
                slot.progress += delta * speedFactor;

                // Smooth progress bar update (targeted, no full re-render)
                const slotEl = this.element?.querySelector(`#${this.id}-slot-${index}`);
                if (slotEl) {
                    const pb = slotEl.querySelector('.cook-progress');
                    if (pb) pb.style.width = `${Math.min((slot.progress / slot.maxTime) * 100, 100)}%`;
                }

                if (slot.progress >= slot.maxTime) {
                    slot.state = 'ready';
                    slot.progress = slot.maxTime;
                    slot.burnProgress = 0;
                    slot.burnTime = slot.maxTime * 1.5;
                    slot.uiNeedsUpdate = true;

                    // Stop cooking sound if no other slots are still cooking
                    this._stopCookingSoundIfDone();
                }
            } else if (slot && slot.state === 'ready') {
                slot.burnProgress += delta;
                if (slot.burnProgress >= slot.burnTime) {
                    slot.state = 'burnt';
                    slot.uiNeedsUpdate = true;
                }
            }

            if (slot && slot.uiNeedsUpdate) {
                this.updateSlotUI(index);
                slot.uiNeedsUpdate = false;
            }
        });
    }

    updateSlotUI(index) {
        const slotEl = this.element?.querySelector(`#${this.id}-slot-${index}`);
        if (!slotEl) return;

        const slot = this.slots[index];

        // Update the state class — CSS background-position rules pick the right sprite frame
        slotEl.className = `station-slot state-${slot ? slot.state : 'empty'}`;
        slotEl.innerHTML = '';

        if (!slot) return;

        if (slot.state === 'cooking') {
            slotEl.innerHTML = `
                <div class="cook-progress-bar">
                    <div class="cook-progress" style="width:${(slot.progress / slot.maxTime) * 100}%"></div>
                </div>
            `;
        } else if (slot.state === 'ready') {
            const handle = document.createElement('div');
            handle.className = 'ready-item slot-handle';
            handle.id = `${this.id}-ready-${index}`;
            handle.setAttribute('data-source-station', this.id);
            handle.setAttribute('data-source-slot', String(index));
            slotEl.appendChild(handle);
            const previewSrc = ITEM_REGISTRY[slot.baseType]?.platedIcon || ITEM_REGISTRY[slot.baseType]?.sprite;
            this.dragManager.registerDraggable(handle, { itemType: slot.baseType, scene: 'floor', dragPreviewSrc: previewSrc });
        } else if (slot.state === 'burnt') {
            const handle = document.createElement('div');
            handle.className = 'burnt-item slot-handle';
            handle.id = `${this.id}-burnt-${index}`;
            handle.setAttribute('data-source-station', this.id);
            handle.setAttribute('data-source-slot', String(index));
            slotEl.appendChild(handle);
            this.dragManager.registerDraggable(handle, {
                itemType: `burnt-${slot.baseType}`,
                scene: 'floor'
            });
        }
    }

    clearSlot(index) {
        this.slots[index] = null;
        this.updateSlotUI(index);

        // Stop cooking sound if no other slots are still cooking
        this._stopCookingSoundIfDone();
    }

    /** Stop the station's cooking sound only when no slots remain in 'cooking' state. */
    _stopCookingSoundIfDone() {
        if (!this.audioManager) return;
        const stillCooking = this.slots.some(s => s && s.state === 'cooking');
        if (!stillCooking) {
            if (this.type === 'fry-pan')     this.audioManager.stopFrying();
            if (this.type === 'cooking-pot') this.audioManager.stopBoiling();
            if (this.type === 'steamer')     this.audioManager.stopSteam();
        }
    }
}
