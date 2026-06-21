import { ITEM_REGISTRY, renderIcon } from '../data/items.js';

export class Station {
    constructor(config, gameClock) {
        this.id = config.id;
        this.type = config.type;
        this.accepts = config.accepts;
        this.slots = new Array(config.slots).fill(null);
        this.gameClock = gameClock;
        this.element = null;
        this.dragManager = null;
        this.clockSubscription = null;
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
                    // Station is full, reject drop
                    if (draggableEl) draggableEl.setAttribute('data-drop-valid', 'false');
                }
            }
        });

        this.element = div;
        
        this.clockSubscription = this.gameClock.subscribe((delta) => this.tick(delta));
        return div;
    }

    receiveItem(index, rawIngredient) {
        if (this.slots[index] !== null) return; // occupied

        const baseType = rawIngredient.replace('raw-', '');
        const itemConfig = ITEM_REGISTRY[baseType];

        this.slots[index] = {
            baseType: baseType,
            progress: 0,
            maxTime: itemConfig.cookTimeMs,
            state: 'cooking',
            uiNeedsUpdate: true
        };

        this.updateSlotUI(index);
    }

    tick(delta) {
        this.slots.forEach((slot, index) => {
            if (slot && slot.state === 'cooking') {
                slot.progress += delta;
                
                // Update progress bar width visually
                const slotEl = this.element.querySelector(`#${this.id}-slot-${index}`);
                if (slotEl) {
                    const pb = slotEl.querySelector('.cook-progress');
                    if (pb) {
                        pb.style.width = `${Math.min((slot.progress / slot.maxTime) * 100, 100)}%`;
                    }
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
        slotEl.innerHTML = ''; // clear

        if (!slot) return;

        const baseType = slot.baseType;
        const config = ITEM_REGISTRY[baseType];

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
            
            // Make the cooked item draggable!
            this.dragManager.registerDraggable(readyItemEl, {
                itemType: baseType,
                scene: 'floor'
            });

            // Set up a listener for when it's dragged away to clear the slot
            // Since we clone, we need a way to know it was dropped successfully.
            // DragManager removes the ghost. We can use an event bus or custom event.
            // For now, DragManager doesn't fire an event on the source when drop succeeds.
            // Let's modify the draggable element itself and let the dropzone clear it.
            // Actually, we'll store slot reference on the element!
            readyItemEl.setAttribute('data-source-station', this.id);
            readyItemEl.setAttribute('data-source-slot', index);
        }
    }

    clearSlot(index) {
        this.slots[index] = null;
        this.updateSlotUI(index);
    }
}
