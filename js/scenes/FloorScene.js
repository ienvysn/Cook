import { Hotbar } from '../entities/Hotbar.js';
import { Station } from '../entities/Station.js';
import { Customer } from '../entities/Customer.js';
import { CUSTOMER_TYPES } from '../data/customerTypes.js';
import { MatchSystem } from '../systems/MatchSystem.js';
import { Toast } from '../ui/Toast.js';

export class FloorScene {
    constructor(gameClock, dragManager, levelConfig) {
        this.gameClock = gameClock;
        this.dragManager = dragManager;
        this.levelConfig = levelConfig;
        
        this.hotbar = new Hotbar();
        this.stations = [];
        this.customers = [];
        this.telegraphedCustomers = [];
        
        this.score = 0;
        this.money = 0;
        this.servedCount = 0;
        
        this.nextSpawnTime = 0;
        this.timeElapsedMs = 0;
        
        this.container = null;
        this.clockSub = null;
        this.platingScene = null;
    }

    setPlatingScene(platingScene) {
        this.platingScene = platingScene;
    }

    render(container) {
        this.container = container;
        this.container.innerHTML = `
            <div id="hud">
                <div>Score: <span id="hud-score">0</span></div>
                <div>Money: Rs. <span id="hud-money">0</span></div>
                <div>Served: <span id="hud-served">0</span> / ${this.levelConfig.goal.target}</div>
            </div>
            <div id="floor-area">
                <div id="customers-area"></div>
                <div id="stations-area"></div>
                <div id="hotbar-area"></div>
            </div>
        `;

        // Render Hotbar
        const hotbarEl = this.hotbar.render(this.dragManager);
        this.container.querySelector('#hotbar-area').appendChild(hotbarEl);

        // Render Stations
        this.levelConfig.stations.forEach(stConfig => {
            const station = new Station(stConfig, this.gameClock);
            this.stations.push(station);
            this.container.querySelector('#stations-area').appendChild(station.render(this.dragManager));
        });

        // Render Plating Counter
        const platingCounterEl = document.createElement('div');
        platingCounterEl.className = 'station plating-counter';
        platingCounterEl.id = 'plating-counter-dropzone';
        platingCounterEl.innerHTML = `
            <div style="font-size: 16px; color: #5c3a21; font-weight: bold; margin-bottom: 5px;">Plating Counter</div>
            <div id="plating-counter-items" style="width: 220px; height: 90px; border: 4px dashed #f4a9b8; border-radius: 20px; display: flex; align-items: center; justify-content: flex-start; background: white; padding: 10px; gap: 10px; overflow: hidden;">
                <div id="plating-counter-empty-text" style="font-size: 10px; color: #a8957a; text-align: center; width: 100%;">Drop cooked<br>items here</div>
            </div>
        `;
        this.container.querySelector('#stations-area').appendChild(platingCounterEl);

        this.dragManager.registerZone('plating-counter-dropzone', platingCounterEl, {
            scene: 'floor',
            accepts: [], // Empty accepts means it could accept anything, but we'll filter below
            onReceive: (itemType, draggableEl) => {
                if (itemType.startsWith('raw-') || itemType.startsWith('burnt-')) {
                    // Reject raw ingredients and burnt items
                    if (draggableEl) draggableEl.setAttribute('data-drop-valid', 'false');
                    return;
                }
                const itemsContainer = document.getElementById('plating-counter-items');
                if (itemsContainer && itemsContainer.querySelectorAll('.plated-item').length >= 3) {
                    if (draggableEl) draggableEl.setAttribute('data-drop-valid', 'false');
                    return; // Full!
                }
                const sourceStationId = draggableEl.getAttribute('data-source-station');
                const sourceSlotIndex = draggableEl.getAttribute('data-source-slot');
                if (this.platingScene) {
                    this.platingScene.open(itemType, sourceStationId, sourceSlotIndex, draggableEl);
                }
            }
        });

        // Render Dustbin
        const dustbinEl = document.createElement('div');
        dustbinEl.className = 'station dustbin';
        dustbinEl.id = 'dustbin-dropzone';
        dustbinEl.innerHTML = `
            <div style="font-size: 16px; color: #5c3a21; font-weight: bold; margin-bottom: 5px;">Dustbin</div>
            <div id="dustbin-items" style="width: 100px; height: 90px; border: 4px dashed #7f8c8d; border-radius: 20px; display: flex; align-items: center; justify-content: center; background: #95a5a6; padding: 10px; font-size: 30px; margin-left: 20px;">
                🗑️
            </div>
        `;
        this.container.querySelector('#stations-area').appendChild(dustbinEl);

        this.dragManager.registerZone('dustbin-dropzone', dustbinEl, {
            scene: 'floor',
            accepts: [], 
            onReceive: (itemType, draggableEl) => {
                if (!itemType.startsWith('burnt-')) {
                    if (draggableEl) draggableEl.setAttribute('data-drop-valid', 'false');
                    return;
                }
                
                const sourceStationId = draggableEl.getAttribute('data-source-station');
                const sourceSlotIndex = draggableEl.getAttribute('data-source-slot');
                
                if (sourceStationId && sourceSlotIndex !== null) {
                    const station = this.stations.find(s => s.id === sourceStationId);
                    if (station) {
                        station.clearSlot(parseInt(sourceSlotIndex));
                    }
                }
            }
        });

        // Set initial spawn time
        this.nextSpawnTime = 2000; // First customer in 2 seconds
        this.clockSub = this.gameClock.subscribe((delta) => this.tick(delta));
    }

    tick(delta) {
        this.timeElapsedMs += delta;
        
        // Spawn customers
        if (this.timeElapsedMs >= this.nextSpawnTime) {
            this.spawnCustomer();
            this.nextSpawnTime = this.timeElapsedMs + (this.levelConfig.spawnIntervalSeconds * 1000);
        }

        // Update telegraphed customers
        for (let i = this.telegraphedCustomers.length - 1; i >= 0; i--) {
            const tel = this.telegraphedCustomers[i];
            tel.remainingMs -= delta;
            if (tel.remainingMs <= 0) {
                if (tel.element && tel.element.parentNode) {
                    tel.element.parentNode.removeChild(tel.element);
                }
                this.telegraphedCustomers.splice(i, 1);
                this.addCustomerToQueue(tel.customer);
            }
        }

        // Update customers
        for (let i = this.customers.length - 1; i >= 0; i--) {
            const customer = this.customers[i];
            const hasLeft = customer.updatePatience(delta);
            if (hasLeft) {
                this.removeCustomer(customer);
            }
        }
    }

    spawnCustomer() {
        if (this.customers.length + this.telegraphedCustomers.length >= 4) return; // limit queue size

        const typeId = this.levelConfig.customerTypes[Math.floor(Math.random() * this.levelConfig.customerTypes.length)];
        const config = CUSTOMER_TYPES[typeId];
        
        const customer = new Customer(`customer-${Date.now()}`, config);

        if (config.telegraphMs) {
            const telegraphEl = document.createElement('div');
            telegraphEl.className = 'customer-telegraph';
            telegraphEl.style = 'padding: 10px; background: #e74c3c; color: white; margin: 5px; border-radius: 4px; text-align: center; font-weight: bold; font-size: 14px;';
            telegraphEl.innerHTML = `⚠️ Incoming: ${config.name}`;
            this.container.querySelector('#customers-area').appendChild(telegraphEl);

            this.telegraphedCustomers.push({
                customer: customer,
                remainingMs: config.telegraphMs,
                element: telegraphEl
            });
        } else {
            this.addCustomerToQueue(customer);
        }
    }

    addCustomerToQueue(customer) {
        this.customers.push(customer);
        const el = customer.render(this.dragManager, (cust, itemType, draggableEl) => this.handleServe(cust, itemType, draggableEl));
        this.container.querySelector('#customers-area').appendChild(el);
    }

    handleServe(customer, servedItemType, draggableEl) {
        // Clear it from the station slot or plating counter!
        const sourceStationId = draggableEl.getAttribute('data-source-station');
        const sourceSlotIndex = draggableEl.getAttribute('data-source-slot');
        
        if (sourceStationId === 'plating-counter') {
            if (draggableEl && draggableEl.parentNode) {
                draggableEl.parentNode.removeChild(draggableEl);
            }
            const itemsContainer = document.getElementById('plating-counter-items');
            if (itemsContainer && itemsContainer.querySelectorAll('.plated-item').length === 0) {
                if (!document.getElementById('plating-counter-empty-text')) {
                    itemsContainer.innerHTML = '<div id="plating-counter-empty-text" style="font-size: 10px; color: #a8957a; text-align: center; width: 100%;">Drop cooked<br>items here</div>';
                }
            }
        } else if (sourceStationId && sourceSlotIndex !== null) {
            const station = this.stations.find(s => s.id === sourceStationId);
            if (station) {
                station.clearSlot(parseInt(sourceSlotIndex));
            }
        }

        // Evaluate match
        const servedToppings = JSON.parse(draggableEl.getAttribute('data-toppings') || '[]');
        const result = MatchSystem.evaluate(servedItemType, servedToppings, customer.order);

        // Calculate toast position
        let toastX = 0, toastY = 0;
        if (customer.element) {
            toastX = customer.element.offsetLeft + (customer.element.offsetWidth / 2);
            toastY = customer.element.offsetTop;
        }

        if (result.success) {
            this.score += 100;
            this.money += result.payment;
            this.servedCount += 1;
            this.updateHUD();
            
            if (result.toppingAccuracy === 1.0) {
                Toast.spawn(this.container.querySelector('#customers-area'), toastX, toastY, result.payment, 'Perfect!', 'perfect');
            } else {
                const details = [];
                if (result.missingToppings && result.missingToppings.length > 0) {
                    details.push(`Missing: ${result.missingToppings.join(', ')}`);
                }
                if (result.extraToppings && result.extraToppings.length > 0) {
                    details.push(`Extra: ${result.extraToppings.join(', ')}`);
                }
                const detailStr = details.join(' | ');
                Toast.spawn(this.container.querySelector('#customers-area'), toastX, toastY, result.payment, detailStr, 'partial');
            }
            
            // Check win condition
            if (this.servedCount >= this.levelConfig.goal.target) {
                setTimeout(() => alert(`Level Complete! Score: ${this.score}`), 100);
            }
        } else {
            Toast.spawn(this.container.querySelector('#customers-area'), toastX, toastY, 0, 'Wrong Dish', 'fail');
        }

        // Customer leaves immediately after ANY serve attempt
        this.removeCustomer(customer);
    }

    removeCustomer(customer) {
        const index = this.customers.indexOf(customer);
        if (index > -1) {
            this.customers.splice(index, 1);
            if (customer.element && customer.element.parentNode) {
                customer.element.parentNode.removeChild(customer.element);
            }
        }
    }

    updateHUD() {
        if (!this.container) return;
        this.container.querySelector('#hud-score').textContent = this.score;
        this.container.querySelector('#hud-money').textContent = this.money;
        this.container.querySelector('#hud-served').textContent = this.servedCount;
    }
}
