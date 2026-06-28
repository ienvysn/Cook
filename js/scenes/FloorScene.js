import { Hotbar }      from '../entities/Hotbar.js';
import { Station }     from '../entities/Station.js';
import { Customer }    from '../entities/Customer.js';
import { CUSTOMER_TYPES } from '../data/customerTypes.js';
import { MatchSystem } from '../systems/MatchSystem.js';
import { Toast }       from '../ui/Toast.js';
import { BOOSTER_DEFS } from '../systems/BoosterSystem.js';
import {
    TIP_PERFECT_HIGH_PATIENCE, TIP_PERFECT_MID_PATIENCE,
    TIP_PERFECT_LOW_PATIENCE, TIP_PARTIAL
} from '../data/config.js';

export class FloorScene {
    constructor(gameClock, dragManager, levelConfig, systems) {
        this.gameClock   = gameClock;
        this.dragManager = dragManager;
        this.levelConfig = levelConfig;

        // Sprint 5 systems (all optional for backward-compat)
        const s = systems || {};
        this.eventBus     = s.eventBus     || null;
        this.comboSystem  = s.comboSystem  || null;
        this.moodSystem   = s.moodSystem   || null;
        this.boosterSystem = s.boosterSystem || null;
        this.upgrades     = s.upgrades     || { fasterSteamer: false };
        this.onLevelEnd   = s.onLevelEnd   || null; // (stats) => void

        this.hotbar    = new Hotbar();
        this.stations  = [];
        this.customers = [];
        this.telegraphedCustomers = [];

        this.score       = 0;
        this.money       = 0;
        this.tips        = 0;
        this.boosterSpend = 0;
        this.servedCount = 0;

        this.nextSpawnTime = 0;
        this.timeElapsedMs = 0;
        this.levelEnded    = false;

        this.container    = null;
        this.clockSub     = null;
        this.platingScene = null;
        this.laphingScene = null;
        this.noodlesScene = null;
    }

    setPlatingScene(platingScene) {
        this.platingScene = platingScene;
    }

    setLaphingScene(laphingScene) {
        this.laphingScene = laphingScene;
    }

    setNoodlesScene(noodlesScene) {
        this.noodlesScene = noodlesScene;
    }

    render(container) {
        this.container = container;
        this.container.innerHTML = `
            <div id="hud">
                <div id="hud-stats">
                    <div>Score: <span id="hud-score">0</span></div>
                    <div>Money: Rs. <span id="hud-money">0</span></div>
                    <div>Served: <span id="hud-served">0</span> / ${this.levelConfig.goal.target}</div>
                </div>
                <div id="hud-combo">
                    <div class="combo-streak" id="combo-streak-display">Streak: 0</div>
                    <div class="combo-mult" id="combo-mult-display">x1.0</div>
                </div>
                <div id="hud-mood">
                    <span class="mood-label">Vibe</span>
                    <div class="mood-bar-container">
                        <div class="mood-bar" id="mood-bar" style="width:60%"></div>
                    </div>
                </div>
                <div id="hud-boosters">
                    ${Object.values(BOOSTER_DEFS).map(b => `
                        <button class="booster-btn" id="booster-btn-${b.id}" data-booster="${b.id}">
                            ${b.emoji} ${b.label}<br><small>Rs.${b.cost}</small>
                        </button>
                    `).join('')}
                </div>
            </div>
            <div id="floor-area">
                <div id="customers-area">
                    <div id="dustbin-area"></div>
                </div>
                <div id="stations-area"></div>
                <div id="hotbar-area"></div>
            </div>
        `;

        // Wire booster buttons
        this.container.querySelectorAll('.booster-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id       = btn.getAttribute('data-booster');
                const unlocked = this.levelConfig.availableBoosters || [];
                if (!unlocked.includes(id) || !this.boosterSystem) return;
                this.boosterSystem.activate(id);
                this._updateBoosterButtons();
            });
        });

        // Subscribe to EventBus for HUD updates
        if (this.eventBus) {
            this.eventBus.on('combo:update', ({ streak, multiplier }) => {
                const streakEl = this.container.querySelector('#combo-streak-display');
                const multEl   = this.container.querySelector('#combo-mult-display');
                if (streakEl) streakEl.textContent = `Streak: ${streak}`;
                if (multEl) {
                    multEl.textContent = `x${multiplier.toFixed(1)}`;
                    multEl.className = `combo-mult ${streak >= 15 ? 'combo-ultra' : streak >= 10 ? 'combo-high' : streak >= 5 ? 'combo-mid' : ''}`;
                }
            });

            this.eventBus.on('mood:update', ({ mood, max }) => {
                const bar = this.container.querySelector('#mood-bar');
                if (bar) {
                    const pct = (mood / max) * 100;
                    bar.style.width = `${pct}%`;
                    bar.className = `mood-bar ${pct < 25 ? 'mood-critical' : pct < 50 ? 'mood-low' : ''}`;
                }
            });

            this.eventBus.on('mood:zero', () => this._endLevel('mood'));

            this.eventBus.on('booster:activated', ({ boosterId }) => {
                const def = BOOSTER_DEFS[boosterId];
                if (def) this.boosterSpend += def.cost;
                this.updateHUD();
                this._updateBoosterButtons();
            });

            this.eventBus.on('booster:expired', () => this._updateBoosterButtons());
            this.eventBus.on('booster:update',  () => this._updateBoosterButtons());
        }

        // Wire BoosterSystem money callbacks
        if (this.boosterSystem) {
            this.boosterSystem.setMoneyCallbacks(
                () => this.money,
                (amount) => { this.money -= amount; this.updateHUD(); }
            );
        }

        // Render Hotbar — only show ingredients the current level's stations accept
        const levelIngredients = new Set(
            this.levelConfig.stations.flatMap(s => s.accepts)
        );
        const hotbarEl = this.hotbar.render(this.dragManager, levelIngredients);
        this.container.querySelector('#hotbar-area').appendChild(hotbarEl);

        // Render Stations
        this.levelConfig.stations.forEach(stConfig => {
            const station = new Station(stConfig, this.gameClock);
            station.boosterSystem = this.boosterSystem;
            station.upgrades      = this.upgrades;
            // Laphing-tray skips cooking and opens the mini-game popup directly
            if (stConfig.type === 'laphing-tray' && this.laphingScene) {
                station.onInstantOpen = () => this.laphingScene.open();
            }
            this.stations.push(station);
            this.container.querySelector('#stations-area').appendChild(station.render(this.dragManager));
        });

        // Render Plating Counter
        const platingCounterEl = document.createElement('div');
        platingCounterEl.className = 'station plating-counter';
        platingCounterEl.id = 'plating-counter-dropzone';
        platingCounterEl.innerHTML = `
            <div style="font-size:16px;color:#5c3a21;font-weight:bold;margin-bottom:5px;">Plating Counter</div>
            <div id="plating-counter-items" style="width:220px;height:90px;border:4px dashed #f4a9b8;border-radius:20px;display:flex;align-items:center;justify-content:flex-start;background:white;padding:10px;gap:10px;overflow:hidden;">
                <div id="plating-counter-empty-text" style="font-size:10px;color:#a8957a;text-align:center;width:100%;">Drop cooked<br>items here</div>
            </div>
        `;
        this.container.querySelector('#stations-area').appendChild(platingCounterEl);

        this.dragManager.registerZone('plating-counter-dropzone', platingCounterEl, {
            scene: 'floor',
            accepts: [],
            onReceive: (itemType, draggableEl) => {
                if (itemType.startsWith('raw-') || itemType.startsWith('burnt-')) {
                    // Reject raw ingredients and burnt items
                    if (draggableEl) draggableEl.setAttribute('data-drop-valid', 'false');
                    return;
                }
                const itemsContainer = document.getElementById('plating-counter-items');
                if (itemsContainer && itemsContainer.querySelectorAll('.plated-item').length >= 3) {
                    if (draggableEl) draggableEl.setAttribute('data-drop-valid', 'false');
                    return;
                }
                const sourceStationId  = draggableEl.getAttribute('data-source-station');
                const sourceSlotIndex  = draggableEl.getAttribute('data-source-slot');
                // Noodles get their own step-by-step plating mini-game
                if (itemType === 'noodles' && this.noodlesScene) {
                    this.noodlesScene.open(sourceStationId, sourceSlotIndex);
                    return;
                }
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
        this.container.querySelector('#dustbin-area').appendChild(dustbinEl);

        this.dragManager.registerZone('dustbin-dropzone', dustbinEl, {
            scene: 'floor',
            accepts: [],
            onReceive: (itemType, draggableEl) => {
                // Only accept items that came from a cooking station (not hotbar raw- or plating-counter plated-)
                const sourceStationId = draggableEl.getAttribute('data-source-station');
                const isFromStation   = sourceStationId && sourceStationId !== 'plating-counter';
                const isRaw           = itemType.startsWith('raw-');
                const isPlated        = itemType.startsWith('plated-');

                if (isRaw || isPlated || !isFromStation) {
                    if (draggableEl) draggableEl.setAttribute('data-drop-valid', 'false');
                    return;
                }

                const sourceSlotIndex = draggableEl.getAttribute('data-source-slot');
                const station = this.stations.find(s => s.id === sourceStationId);
                if (station) {
                    station.clearSlot(parseInt(sourceSlotIndex));
                }

                // Remove the dragged element so it doesn't snap back and linger
                if (draggableEl?.parentNode) draggableEl.parentNode.removeChild(draggableEl);
            }
        });

        // Set initial spawn time
        this.nextSpawnTime = 2000; // First customer in 2 seconds
        this.clockSub = this.gameClock.subscribe((delta) => this.tick(delta));
        this._updateBoosterButtons();
    }

    tick(delta) {
        if (this.levelEnded) return;
        this.timeElapsedMs += delta;

        // Spawn customers
        if (this.timeElapsedMs >= this.nextSpawnTime) {
            this.spawnCustomer();
            this.nextSpawnTime = this.timeElapsedMs + (this.levelConfig.spawnIntervalSeconds * 1000);
        }

        // Countdown telegraphed customers
        for (let i = this.telegraphedCustomers.length - 1; i >= 0; i--) {
            const tel = this.telegraphedCustomers[i];
            tel.remainingMs -= delta;
            if (tel.remainingMs <= 0) {
                if (tel.element?.parentNode) tel.element.parentNode.removeChild(tel.element);
                this.telegraphedCustomers.splice(i, 1);
                this.addCustomerToQueue(tel.customer);
            }
        }

        // Combined patience drain modifier from MoodSystem + BoosterSystem (calm crowd)
        const moodDrain  = this.moodSystem   ? this.moodSystem.getDrainMultiplier()  : 1.0;
        const calmFactor = this.boosterSystem ? this.boosterSystem.getCalmFactor()    : 1.0;
        const drainMod   = moodDrain * calmFactor;

        // Update customer patience
        for (let i = this.customers.length - 1; i >= 0; i--) {
            const customer = this.customers[i];
            const hasLeft  = customer.updatePatience(delta * drainMod);
            if (hasLeft) {
                if (this.eventBus) this.eventBus.emit('customer:left', { customer });
                this.removeCustomer(customer);
            }
        }
    }

    spawnCustomer() {
        if (this.customers.length + this.telegraphedCustomers.length >= 4) return;

        const typeId = this.levelConfig.customerTypes[Math.floor(Math.random() * this.levelConfig.customerTypes.length)];
        const config = CUSTOMER_TYPES[typeId];

        // Only let customers order food that this level's stations can actually produce
        const availableFoodTypes = this.levelConfig.stations.map(s =>
            s.produces || s.accepts[0].replace('raw-', '')
        );
        const filteredOrders = config.possibleOrders.filter(o => availableFoodTypes.includes(o));
        const levelConfig = filteredOrders.length > 0
            ? { ...config, possibleOrders: filteredOrders }
            : config;

        const customer = new Customer(`customer-${Date.now()}`, levelConfig);

        if (config.telegraphMs) {
            const telegraphEl = document.createElement('div');
            telegraphEl.className = 'customer-telegraph';
            telegraphEl.style = 'padding:10px;background:#e74c3c;color:white;margin:5px;border-radius:4px;text-align:center;font-weight:bold;font-size:14px;';
            telegraphEl.innerHTML = `⚠️ Incoming: ${config.name}`;
            this.container.querySelector('#customers-area').appendChild(telegraphEl);
            this.telegraphedCustomers.push({ customer, remainingMs: config.telegraphMs, element: telegraphEl });
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
        // Clear source
        const sourceStationId = draggableEl.getAttribute('data-source-station');
        const sourceSlotIndex = draggableEl.getAttribute('data-source-slot');

        if (sourceStationId === 'plating-counter') {
            if (draggableEl?.parentNode) draggableEl.parentNode.removeChild(draggableEl);
            const ic = document.getElementById('plating-counter-items');
            if (ic && ic.querySelectorAll('.plated-item').length === 0) {
                if (!document.getElementById('plating-counter-empty-text')) {
                    ic.innerHTML = '<div id="plating-counter-empty-text" style="font-size:10px;color:#a8957a;text-align:center;width:100%;">Drop cooked<br>items here</div>';
                }
            }
        } else if (sourceStationId && sourceSlotIndex !== null) {
            const station = this.stations.find(s => s.id === sourceStationId);
            if (station) station.clearSlot(parseInt(sourceSlotIndex));
        }

        const servedToppings = JSON.parse(draggableEl.getAttribute('data-toppings') || '[]');
        const result = MatchSystem.evaluate(servedItemType, servedToppings, customer.order);

        let toastX = 0, toastY = 0;
        if (customer.element) {
            toastX = customer.element.offsetLeft + (customer.element.offsetWidth / 2);
            toastY = customer.element.offsetTop;
        }

        if (result.success) {
            // Combo multiplier applied to score
            const comboMult = this.comboSystem ? this.comboSystem.getMultiplier() : 1.0;
            const scoreGain = Math.round(100 * comboMult);

            // Tip calculation based on patience remaining
            let tip = 0;
            if (result.tipEligible) {
                const patiencePct = customer.patienceMs / customer.maxPatienceMs;
                if (patiencePct > 0.7)      tip = TIP_PERFECT_HIGH_PATIENCE;
                else if (patiencePct > 0.3) tip = TIP_PERFECT_MID_PATIENCE;
                else                         tip = TIP_PERFECT_LOW_PATIENCE;
            } else {
                tip = TIP_PARTIAL;
            }

            this.score       += scoreGain;
            this.money       += result.payment + tip;
            this.tips        += tip;
            this.servedCount += 1;
            this.updateHUD();

            if (result.toppingAccuracy === 1.0) {
                const label = comboMult > 1.0 ? `Perfect! x${comboMult.toFixed(1)}` : 'Perfect!';
                Toast.spawn(this.container.querySelector('#customers-area'), toastX, toastY, result.payment + tip, label, 'perfect');
                if (this.eventBus) this.eventBus.emit('order:perfect', { payment: result.payment, tip, customer });
            } else {
                const details = [];
                if (result.missingToppings?.length) details.push(`Missing: ${result.missingToppings.join(', ')}`);
                if (result.extraToppings?.length)   details.push(`Extra: ${result.extraToppings.join(', ')}`);
                Toast.spawn(this.container.querySelector('#customers-area'), toastX, toastY, result.payment + tip, details.join(' | '), 'partial');
                if (this.eventBus) this.eventBus.emit('order:partial', { payment: result.payment, customer });
            }

            if (this.servedCount >= this.levelConfig.goal.target) {
                this._endLevel('goal');
            }
        } else {
            Toast.spawn(this.container.querySelector('#customers-area'), toastX, toastY, 0, 'Wrong Dish', 'fail');
            if (this.eventBus) this.eventBus.emit('order:failed', { customer });
        }

        this.removeCustomer(customer);
    }

    removeCustomer(customer) {
        const index = this.customers.indexOf(customer);
        if (index > -1) {
            this.customers.splice(index, 1);
            if (customer.element?.parentNode) customer.element.parentNode.removeChild(customer.element);
        }
    }

    _endLevel(reason) {
        if (this.levelEnded) return;
        this.levelEnded = true;

        const tallyDelay = reason === 'goal' ? 2400 : 900;

        if (reason === 'goal') this._spawnConfetti();

        setTimeout(() => {
            if (this.onLevelEnd) {
                this.onLevelEnd({
                    levelName:   this.levelConfig.name,
                    score:       this.score,
                    revenue:     this.money - this.tips,
                    tips:        this.tips,
                    expenses:    this.boosterSpend,
                    levelConfig: this.levelConfig,
                    reason
                });
            }
        }, tallyDelay);
    }

    _spawnConfetti() {
        const colors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#f1c40f'];

        const overlay = document.createElement('div');
        overlay.id = 'confetti-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;overflow:hidden;z-index:3000;';

        for (let i = 0; i < 90; i++) {
            const p = document.createElement('div');
            const color    = colors[Math.floor(Math.random() * colors.length)];
            const size     = 7 + Math.random() * 10;
            const left     = Math.random() * 100;
            const delay    = Math.random() * 1.2;
            const duration = 1.8 + Math.random() * 1.4;
            const isCircle = Math.random() > 0.5;
            p.style.cssText = `
                position:absolute;width:${size}px;height:${size}px;
                background:${color};border-radius:${isCircle ? '50%' : '2px'};
                left:${left}%;top:-20px;
                animation:confettiFall ${duration}s ${delay}s ease-in forwards;
            `;
            overlay.appendChild(p);
        }

        // "Level Complete!" banner
        const banner = document.createElement('div');
        banner.style.cssText = `
            position:fixed;top:38%;left:50%;transform:translate(-50%,-50%);
            font-size:2.8rem;font-weight:900;color:#fff;
            text-shadow:0 4px 14px rgba(0,0,0,0.55);
            animation:levelCompleteBanner 0.45s cubic-bezier(.17,.67,.47,1.3) forwards;
            z-index:3001;pointer-events:none;text-align:center;white-space:nowrap;
        `;
        banner.textContent = '🎉 Level Complete! 🎉';

        document.body.appendChild(overlay);
        document.body.appendChild(banner);

        // Clean up before tally screen appears
        setTimeout(() => {
            overlay.remove();
            banner.remove();
        }, 2200);
    }

    updateHUD() {
        if (!this.container) return;
        this.container.querySelector('#hud-score').textContent  = this.score;
        this.container.querySelector('#hud-money').textContent  = this.money;
        this.container.querySelector('#hud-served').textContent = this.servedCount;
        // Refresh booster affordability every time money changes
        this._updateBoosterButtons();
    }

    _updateBoosterButtons() {
        if (!this.container || !this.boosterSystem) return;
        const unlocked = this.levelConfig.availableBoosters || [];

        Object.values(BOOSTER_DEFS).forEach(def => {
            const btn = this.container.querySelector(`#booster-btn-${def.id}`);
            if (!btn) return;

            const isLocked = !unlocked.includes(def.id);

            if (isLocked) {
                btn.disabled = true;
                btn.className = 'booster-btn booster-locked';
                btn.innerHTML = `🔒 ${def.label}<br><small>Next level</small>`;
                return;
            }

            const active    = this.boosterSystem.isActive(def.id);
            const canAfford = this.money >= def.cost;
            const remainMs  = this.boosterSystem.getRemainingMs(def.id);

            btn.disabled = active || !canAfford;
            btn.className = [
                'booster-btn',
                active      ? 'booster-active'      : '',
                !canAfford && !active ? 'booster-cant-afford' : ''
            ].join(' ').trim();

            if (active && def.durationMs) {
                const secs = Math.ceil(remainMs / 1000);
                btn.innerHTML = `${def.emoji} ${def.label}<br><small>${secs}s left</small>`;
            } else if (active && def.id === 'quick-plate') {
                btn.innerHTML = `${def.emoji} ${def.label}<br><small>Ready!</small>`;
            } else {
                btn.innerHTML = `${def.emoji} ${def.label}<br><small>Rs.${def.cost}</small>`;
            }
        });
    }

    destroy() {
        if (this.clockSub) {
            this.clockSub(); // subscribe() returns an unsubscribe fn
            this.clockSub = null;
        }
        this.stations.forEach(s => {
            if (s.clockSubscription) s.clockSubscription();
        });
    }
}
