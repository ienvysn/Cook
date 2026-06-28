import { HOTBAR_SLOTS, renderIcon } from '../data/items.js';

export class Hotbar {
    constructor() {
        this.element = null;
    }

    // ingredientFilter: Set<string> of raw ingredient keys needed at this level (e.g. {'raw-momo'})
    // Pass null to show all slots (backward-compat).
    render(dragManager, ingredientFilter = null) {
        const slots = ingredientFilter
            ? HOTBAR_SLOTS.filter(s => ingredientFilter.has(s.ingredient))
            : HOTBAR_SLOTS;

        const div = document.createElement('div');
        div.className = 'hotbar';
        div.innerHTML = `<div class="hotbar-label">Ingredients</div><div class="hotbar-slots"></div>`;
        const slotsContainer = div.querySelector('.hotbar-slots');

        slots.forEach((slotData, index) => {
            const slotEl = document.createElement('div');
            slotEl.className = 'hotbar-slot';
            slotEl.id = `hotbar-slot-${index}`;
            slotEl.innerHTML = renderIcon(slotData);
            slotsContainer.appendChild(slotEl);

            dragManager.registerDraggable(slotEl, {
                itemType: slotData.ingredient,
                scene: 'floor'
            });
        });

        this.element = div;
        return div;
    }
}
