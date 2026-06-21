import { Hotbar } from '../entities/Hotbar.js';
import { Station } from '../entities/Station.js';
import { Customer } from '../entities/Customer.js';
import { CUSTOMER_TYPES } from '../data/customerTypes.js';
import { MatchSystem } from '../systems/MatchSystem.js';

export class FloorScene {
    constructor(gameClock, dragManager, levelConfig) {
        this.gameClock = gameClock;
        this.dragManager = dragManager;
        this.levelConfig = levelConfig;
        
        this.hotbar = new Hotbar();
        this.stations = [];
        this.customers = [];
        
        this.score = 0;
        this.money = 0;
        this.servedCount = 0;
        
        this.nextSpawnTime = 0;
        this.timeElapsedMs = 0;
        
        this.container = null;
        this.clockSub = null;
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
        if (this.customers.length >= 4) return; // limit queue size

        const typeId = this.levelConfig.customerTypes[Math.floor(Math.random() * this.levelConfig.customerTypes.length)];
        const config = CUSTOMER_TYPES[typeId];
        
        const customer = new Customer(`customer-${Date.now()}`, config);
        this.customers.push(customer);
        
        const el = customer.render(this.dragManager, (cust, itemType, draggableEl) => this.handleServe(cust, itemType, draggableEl));
        this.container.querySelector('#customers-area').appendChild(el);
    }

    handleServe(customer, servedItemType, draggableEl) {
        // Clear it from the station slot!
        const sourceStationId = draggableEl.getAttribute('data-source-station');
        const sourceSlotIndex = draggableEl.getAttribute('data-source-slot');
        
        if (sourceStationId && sourceSlotIndex !== null) {
            const station = this.stations.find(s => s.id === sourceStationId);
            if (station) {
                station.clearSlot(parseInt(sourceSlotIndex));
            }
        }

        // Evaluate match
        const result = MatchSystem.evaluate(servedItemType, customer.order);

        if (result.success) {
            this.score += 100;
            this.money += result.payment;
            this.servedCount += 1;
            this.updateHUD();
            
            // Check win condition
            if (this.servedCount >= this.levelConfig.goal.target) {
                setTimeout(() => alert(`Level Complete! Score: ${this.score}`), 100);
            }
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
