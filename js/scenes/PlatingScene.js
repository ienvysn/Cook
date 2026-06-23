import { ITEM_REGISTRY, TOPPING_REGISTRY, renderIcon } from '../data/items.js';

export class PlatingScene {
    constructor(gameClock, dragManager, floorScene) {
        this.gameClock = gameClock;
        this.dragManager = dragManager;
        this.floorScene = floorScene;

        this.popupEl = document.getElementById('plating-popup');
        this.closeBtn = document.getElementById('plating-cancel');
        this.plateBtn = document.getElementById('plating-confirm');
        this.plateArea = document.getElementById('plating-plate-area');
        this.toppingBin = document.getElementById('plating-topping-bin');

        this.currentItem = null;
        this.currentSourceStationId = null;
        this.currentSourceSlotIndex = null;
        this.currentDraggableEl = null;
        this.selectedToppings = new Set();

        this.closeBtn.addEventListener('click', () => this.cancel());
        this.plateBtn.addEventListener('click', () => this.confirm());

        this.dragManager.registerZone('plating-plate-area', this.plateArea, {
            scene: 'plating',
            accepts: [],
            onReceive: (toppingType) => {
                const toppingId = toppingType.replace('topping-', '');
                this.selectedToppings.add(toppingId);
                this.renderPlateArea();
            }
        });
    }

    open(itemType, sourceStationId, sourceSlotIndex, draggableEl) {
        this.currentItem = itemType;
        this.currentSourceStationId = sourceStationId;
        this.currentSourceSlotIndex = sourceSlotIndex;
        this.currentDraggableEl = draggableEl;
        this.selectedToppings.clear();

        this.gameClock.setTimeScale(0.35);
        this.dragManager.setScene('plating');

        this.popupEl.style.display = 'flex';

        this.renderToppingBin();
        this.renderPlateArea();
    }

    renderToppingBin() {
        this.toppingBin.innerHTML = '';
        if (!this.currentItem) return;

        const validToppings = ITEM_REGISTRY[this.currentItem].validToppings || [];
        validToppings.forEach(toppingId => {
            const topping = TOPPING_REGISTRY[toppingId];
            if (!topping) return;

            const btn = document.createElement('div');
            btn.className = 'topping-button draggable';
            btn.innerHTML = renderIcon(topping);

            btn.style.cursor = 'grab';
            btn.style.width = '64px';
            btn.style.height = '64px';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';

            this.toppingBin.appendChild(btn);

            this.dragManager.registerDraggable(btn, {
                itemType: `topping-${toppingId}`,
                scene: 'plating'
            });
        });
    }

    renderPlateArea() {
        if (!this.currentItem) return;

        const item = ITEM_REGISTRY[this.currentItem];
        const itemHtml = renderIcon(item);

        let toppingsHtml = '';
        const toppingsArray = Array.from(this.selectedToppings);
        toppingsArray.forEach((toppingId, i) => {
            const topping = TOPPING_REGISTRY[toppingId];
            if (!topping) return;

            const angle = (i * (Math.PI * 2) / Math.max(toppingsArray.length, 1)) + (Math.PI/4);
            const distance = 25;
            const top = 30 + Math.sin(angle) * distance;
            const left = 30 + Math.cos(angle) * distance;

            toppingsHtml += `
                <div style="position: absolute; top: ${top}%; left: ${left}%; transform: translate(-50%, -50%) scale(0.6); z-index: 2; pointer-events: none;">
                    ${renderIcon(topping)}
                </div>
            `;
        });

        this.plateArea.innerHTML = `
            <div class="plated-item-preview" style="position: relative; display: inline-block; width: 64px; height: 64px;">
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;">
                    ${itemHtml}
                </div>
                ${toppingsHtml}
            </div>
        `;
    }

    cancel() {
        this.cleanup();
    }

    confirm() {
        if (!this.currentItem) return;

        if (this.currentSourceStationId && this.currentSourceSlotIndex !== null) {
            const station = this.floorScene.stations.find(s => s.id === this.currentSourceStationId);
            if (station) {
                station.clearSlot(parseInt(this.currentSourceSlotIndex));
            }
        }

        let itemsContainer = document.getElementById('plating-counter-items');
        
        // Fallback for un-refreshed DOM: upgrade the counter structure on the fly
        if (!itemsContainer) {
            const platingCounterEl = document.getElementById('plating-counter-dropzone');
            if (platingCounterEl) {
                platingCounterEl.innerHTML = `
                    <div style="font-size: 16px; color: #5c3a21; font-weight: bold; margin-bottom: 5px;">Plating Counter</div>
                    <div id="plating-counter-items" style="width: 220px; height: 90px; border: 4px dashed #f4a9b8; border-radius: 20px; display: flex; align-items: center; justify-content: flex-start; background: white; padding: 10px; gap: 10px; overflow: hidden;">
                    </div>
                `;
                itemsContainer = document.getElementById('plating-counter-items');
            }
        }

        if (itemsContainer) {
            const emptyText = document.getElementById('plating-counter-empty-text');
            if (emptyText) emptyText.remove();

            const baseItemHtml = renderIcon(ITEM_REGISTRY[this.currentItem]);

            let miniToppingsHtml = '';
            Array.from(this.selectedToppings).forEach((toppingId, i) => {
                const angle = (i * (Math.PI * 2) / Math.max(this.selectedToppings.size, 1));
                const distance = 15;
                const top = 50 + Math.sin(angle) * distance;
                const left = 50 + Math.cos(angle) * distance;

                miniToppingsHtml += `
                    <div style="position: absolute; top: ${top}%; left: ${left}%; transform: translate(-50%, -50%) scale(0.4); z-index: 2; pointer-events: none;">
                        ${renderIcon(TOPPING_REGISTRY[toppingId])}
                    </div>
                `;
            });

            const itemWrapper = document.createElement('div');
            itemWrapper.className = 'plated-item ready-item';
            itemWrapper.setAttribute('data-source-station', 'plating-counter');
            itemWrapper.style.cssText = 'position: relative; width: 60px; height: 60px; background: #fff; border: 4px solid #2ecc71; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); cursor: grab; flex-shrink: 0;';
            itemWrapper.innerHTML = `
                <div style="position: absolute; z-index: 1; transform: scale(0.8);">${baseItemHtml}</div>
                ${miniToppingsHtml}
            `;

            itemWrapper.setAttribute('data-base-type', this.currentItem);
            itemWrapper.setAttribute('data-toppings', JSON.stringify(Array.from(this.selectedToppings)));

            itemsContainer.appendChild(itemWrapper);

            this.dragManager.registerDraggable(itemWrapper, {
                itemType: `plated-${this.currentItem}`,
                scene: 'floor'
            });
        }

        this.cleanup();
    }

    cleanup() {
        this.currentItem = null;
        this.currentSourceStationId = null;
        this.currentSourceSlotIndex = null;
        this.currentDraggableEl = null;
        this.selectedToppings.clear();

        this.popupEl.style.display = 'none';
        this.plateArea.innerHTML = '';
        this.toppingBin.innerHTML = '';

        this.gameClock.setTimeScale(1.0);
        this.dragManager.setScene('floor');
    }
}
