import { ITEM_REGISTRY, renderIcon } from '../data/items.js';
import { UPGRADE_FASTER_STEAMER_MULTIPLIER } from '../data/config.js';

export class Station {
    constructor(config, gameClock) {
        this.id      = config.id;
        this.type    = config.type;
        this.accepts = config.accepts;
        this.slots   = new Array(config.slots).fill(null);
        this.gameClock  = gameClock;
        this.element    = null;
        this.dragManager = null;
        this.clockSubscription = null;

        // Set by FloorScene after construction
        this.boosterSystem = null;
        this.upgrades      = null; // { fasterSteamer: bool }
    }

    render(dragManager) {
        this.dragManager = dragManager;

        const div = document.createElement('div');
        div.className = `station station-${this.type} dropzone`;
        div.id = this.id;
        div.innerHTML = `<h3>${this.type.toUpperCase()}</h3><div class="station-slots"></div>`;

        const slotsContainer = div.querySelector('.station-slots');
        this.slots.forEach((_, index) => {
            const slotEl = document.createElement('div');
            slotEl.className = 'station-slot';
            slotEl.id = `${this.id}-slot-${index}`;
            slotsContainer.appendChild(slotEl);
        });

        dragManager.registerZone(this.id, div, {
            scene: 'floor',
            accepts: this.accepts,
            onReceive: (draggedItemType, draggableEl) => {
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

        const baseType  = rawIngredient.replace('raw-', '');
        const itemConfig = ITEM_REGISTRY[baseType];

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

        this.updateSlotUI(index);
    }

    tick(delta) {
        // Speed booster makes progress accumulate faster (cook time feels shorter)
        const speedFactor = this.boosterSystem ? this.boosterSystem.getCookSpeedFactor() : 1.0;

        this.slots.forEach((slot, index) => {
            if (slot && slot.state === 'cooking') {
                slot.progress += delta * speedFactor;

                const slotEl = this.element.querySelector(`#${this.id}-slot-${index}`);
                if (slotEl) {
                    const pb = slotEl.querySelector('.cook-progress');
                    if (pb) pb.style.width = `${Math.min((slot.progress / slot.maxTime) * 100, 100)}%`;
                }

                if (slot.progress >= slot.maxTime) {
                    slot.state = 'ready';
                    slot.progress = slot.maxTime;
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
        const slotEl = this.element.querySelector(`#${this.id}-slot-${index}`);
        if (!slotEl) return;

        const slot = this.slots[index];
        slotEl.innerHTML = '';
        if (!slot) return;

        const config = ITEM_REGISTRY[slot.baseType];

        if (slot.state === 'cooking') {
            slotEl.innerHTML = `
                ${renderIcon(config)}
                <div class="cook-progress-bar"><div class="cook-progress" style="width: ${(slot.progress / slot.maxTime) * 100}%"></div></div>
            `;
        } else if (slot.state === 'ready') {
            slotEl.innerHTML = `
                <div class="ready-item" id="${this.id}-ready-${index}">
                    ${renderIcon(config)}
                </div>
            `;
            const readyItemEl = slotEl.querySelector('.ready-item');
            this.dragManager.registerDraggable(readyItemEl, { itemType: slot.baseType, scene: 'floor' });
            readyItemEl.setAttribute('data-source-station', this.id);
            readyItemEl.setAttribute('data-source-slot', index);
        }
    }

    clearSlot(index) {
        this.slots[index] = null;
        this.updateSlotUI(index);
    }
}
