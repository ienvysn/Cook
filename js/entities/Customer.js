import { Order } from './Order.js';
import { ITEM_REGISTRY, TOPPING_REGISTRY, renderIcon } from '../data/items.js';

export class Customer {
    // Display width of one sprite frame in the customer card
    static FRAME_W = 140;

    constructor(id, typeConfig) {
        this.id = id;
        this.typeConfig = typeConfig;

        const orderType = typeConfig.possibleOrders[Math.floor(Math.random() * typeConfig.possibleOrders.length)];

        const validToppings = ITEM_REGISTRY[orderType].validToppings || [];
        const requestedToppings = [];
        if (Math.random() > 0.2 && validToppings.length > 0) {
            const numToppings = Math.floor(Math.random() * validToppings.length) + 1;
            const shuffled = [...validToppings].sort(() => 0.5 - Math.random());
            requestedToppings.push(...shuffled.slice(0, numToppings));
        }

        this.order = new Order(orderType, 1, requestedToppings);
        this.maxPatienceMs = typeConfig.basePatienceMs;
        this.patienceMs    = this.maxPatienceMs;
        this.element       = null;

        // Pick a random sprite from the type's sprite list
        const sprites = typeConfig.sprites || [];
        this.sprite       = sprites[Math.floor(Math.random() * sprites.length)] || null;
        this.spriteFrames = typeConfig.spriteFrames || 1;
        this._lastFrame   = -1; // track last frame to avoid unnecessary DOM writes
    }

    render(dragManager, onServe) {
        const div = document.createElement('div');
        div.className = 'customer dropzone';
        div.id = this.id;
        
        // Show the final plated image (not raw hotbar icon) in the order bubble
        const item = ITEM_REGISTRY[this.order.baseType];
        let orderIconHtml;
        if (item.verticalSprite && item.sprite) {
            // 1×2 stacked sprite (e.g. laphingbowl): crop to top frame only
            orderIconHtml = `<div style="width:38px;height:38px;border-radius:50%;overflow:hidden;flex-shrink:0;
                                         background:url('${item.sprite}') 0% 0% / 100% 200% no-repeat;"></div>`;
        } else {
            const src = item.platedIcon || item.sprite;
            orderIconHtml = src
                ? `<img src="${src}" draggable="false"
                        style="width:38px;height:38px;object-fit:contain;flex-shrink:0;" />`
                : renderIcon(item);
        }

        // Each requested topping shows as  + emoji  to the right of the main icon
        let toppingPills = '';
        this.order.requestedToppings.forEach(tId => {
            const topping = TOPPING_REGISTRY[tId];
            if (!topping) return;
            const emoji = topping.placeholder?.emoji || '❓';
            toppingPills += `
                <span style="font-size:9px;font-weight:900;color:#c0392b;line-height:1;">+</span>
                <span style="font-size:16px;line-height:1;">${emoji}</span>
            `;
        });

        const fw = Customer.FRAME_W;
        const avatarHtml = this.sprite
            ? `<div class="customer-sprite-frame" style="
                   width:${fw}px;height:${fw}px;overflow:hidden;border-radius:8px;margin:0 auto 6px;
                   background-image:url('${this.sprite}');
                   background-size:200% 200%;
                   background-position:0% 0%;
                   background-repeat:no-repeat;
               "></div>`
            : `<div class="customer-avatar" style="background:${this.typeConfig.color}">${this.typeConfig.emoji || '👤'}</div>`;

        div.innerHTML = `
            <div class="customer-order-bubble" style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;justify-content:center;padding:4px 6px;">
                ${orderIconHtml}
                ${toppingPills}
            </div>
            <div class="patience-bar-container" style="margin-bottom:4px;">
                <div class="patience-bar" style="width:100%"></div>
            </div>
            ${avatarHtml}
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
            const pct = this.patienceMs / this.maxPatienceMs;

            // Patience bar
            const bar = this.element.querySelector('.patience-bar');
            if (bar) {
                bar.style.width = `${pct * 100}%`;
                if (pct < 0.30)      bar.style.background = '#e74c3c';
                else if (pct < 0.60) bar.style.background = '#f39c12';
            }

            // 2x2 sprite grid: frame advances as patience drops
            // 0=happy(TL), 1=sad(TR), 2=worried(BL), 3=angry(BR)
            if (this.sprite && this.spriteFrames >= 4) {
                const frame = pct > 0.75 ? 0 : pct > 0.5 ? 1 : pct > 0.25 ? 2 : 3;
                if (frame !== this._lastFrame) {
                    const el = this.element.querySelector('.customer-sprite-frame');
                    if (el) {
                        const col = frame % 2;
                        const row = Math.floor(frame / 2);
                        el.style.backgroundPosition = `${col * 100}% ${row * 100}%`;
                    }
                    this._lastFrame = frame;
                }
            }
        }

        return this.patienceMs <= 0;
    }
}
