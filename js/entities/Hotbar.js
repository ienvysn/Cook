import { HOTBAR_SLOTS, renderIcon } from '../data/items.js';

export class Hotbar {
    constructor() {
        this.element = null;
    }

    render(dragManager) {
        const div = document.createElement('div');
        div.className = 'hotbar';
        div.innerHTML = `<div class="hotbar-slots"></div>`;
        const slotsContainer = div.querySelector('.hotbar-slots');

        HOTBAR_SLOTS.forEach((slotData, index) => {
            const slotEl = document.createElement('div');
            slotEl.className = 'hotbar-slot';
            slotEl.id = `hotbar-slot-${index}`;
            
            slotEl.innerHTML = renderIcon(slotData);
            slotsContainer.appendChild(slotEl);

            // Register as infinite drag source
            dragManager.registerDraggable(slotEl, {
                itemType: slotData.ingredient,
                scene: 'floor'
            });
        });

        this.element = div;
        return div;
    }
}
