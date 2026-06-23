import { Order } from './Order.js';
import { ITEM_REGISTRY, TOPPING_REGISTRY, renderIcon } from '../data/items.js';

export class Customer {
    constructor(id, typeConfig) {
        this.id = id;
        this.typeConfig = typeConfig;
        
        const orderType = typeConfig.possibleOrders[Math.floor(Math.random() * typeConfig.possibleOrders.length)];
        
        // Randomly decide requested toppings
        const validToppings = ITEM_REGISTRY[orderType].validToppings || [];
        const requestedToppings = [];
        
        // 80% chance to want toppings. Otherwise, pick 1 to max valid toppings.
        if (Math.random() > 0.2 && validToppings.length > 0) {
            const numToppings = Math.floor(Math.random() * validToppings.length) + 1;
            const shuffled = [...validToppings].sort(() => 0.5 - Math.random());
            requestedToppings.push(...shuffled.slice(0, numToppings));
        }

        this.order = new Order(orderType, 1, requestedToppings);
        
        this.maxPatienceMs = typeConfig.basePatienceMs;
        this.patienceMs = this.maxPatienceMs;
        
        this.element = null;
    }

    render(dragManager, onServe) {
        const div = document.createElement('div');
        div.className = 'customer dropzone';
        div.id = this.id;
        
        const baseItemHtml = renderIcon(ITEM_REGISTRY[this.order.baseType]);
        let toppingsHtml = '';
        if (this.order.requestedToppings.length > 0) {
            toppingsHtml = `<div style="display: flex; gap: 5px; justify-content: center; margin-top: -5px;">`;
            this.order.requestedToppings.forEach(tId => {
                const html = renderIcon(TOPPING_REGISTRY[tId]);
                toppingsHtml += `<div style="transform: scale(0.35); margin: -15px;">${html}</div>`;
            });
            toppingsHtml += `</div>`;
        }

        div.innerHTML = `
            <div class="customer-avatar" style="background:${this.typeConfig.color}">${this.typeConfig.emoji}</div>
            <div class="customer-order-bubble" style="display: flex; flex-direction: column; align-items: center;">
                <div style="transform: scale(0.6); margin: -10px;">${baseItemHtml}</div>
                ${toppingsHtml}
            </div>
            <div class="patience-bar-container">
                <div class="patience-bar" style="width: 100%"></div>
            </div>
        `;
        this.element = div;

        // Register customer as a dropzone accepting ANY cooked item (we handle match logic after drop)
        // Wait, Sub-sprint 2A: "registers customer 'slots' as drop zones via DragManager"
        // We will accept any cooked item, and MatchSystem decides what happens
        dragManager.registerZone(this.id, div, {
            scene: 'floor',
            accepts: [], // Empty means accepts any draggable, we will filter in onReceive
            onReceive: (draggedItemType, draggableEl) => {
                if (!draggedItemType.startsWith('plated-')) {
                    // Ignore non-plated items silently (snaps back)
                    if (draggableEl) draggableEl.setAttribute('data-drop-valid', 'false');
                    return;
                }
                onServe(this, draggedItemType, draggableEl);
            }
        });

        return div;
    }

    updatePatience(deltaMs) {
        this.patienceMs -= deltaMs;
        if (this.patienceMs < 0) this.patienceMs = 0;

        if (this.element) {
            const bar = this.element.querySelector('.patience-bar');
            if (bar) {
                const percentage = (this.patienceMs / this.maxPatienceMs) * 100;
                bar.style.width = `${percentage}%`;
                
                // Color change based on patience
                if (percentage < 30) {
                    bar.style.background = '#e74c3c';
                } else if (percentage < 60) {
                    bar.style.background = '#f39c12';
                }
            }
        }

        return this.patienceMs <= 0; // Returns true if patience expired
    }
}
