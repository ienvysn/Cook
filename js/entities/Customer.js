import { Order } from './Order.js';

export class Customer {
    constructor(id, typeConfig) {
        this.id = id;
        this.typeConfig = typeConfig;
        
        const orderType = typeConfig.possibleOrders[Math.floor(Math.random() * typeConfig.possibleOrders.length)];
        this.order = new Order(orderType, 1);
        
        this.maxPatienceMs = typeConfig.basePatienceMs;
        this.patienceMs = this.maxPatienceMs;
        
        this.element = null;
    }

    render(dragManager, onServe) {
        const div = document.createElement('div');
        div.className = 'customer dropzone';
        div.id = this.id;
        div.innerHTML = `
            <div class="customer-avatar" style="background:${this.typeConfig.color}">${this.typeConfig.emoji}</div>
            <div class="customer-order-bubble">Wants: ${this.order.baseType}</div>
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
                if (draggedItemType.startsWith('raw-')) {
                    // Ignore raw items silently (snaps back)
                    draggableEl.setAttribute('data-drop-valid', 'false');
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
