import { PLATING_TIME_SCALE } from '../data/config.js';
import { ITEM_REGISTRY, renderIcon } from '../data/items.js';

// One image per step — shown via <img src> swap
const STEP_IMAGES = [
    'assets/icons/images/emtyplate.png',
    'assets/icons/images/platewithsoya.png',
    'assets/icons/images/soyawithpeanuts.png',
    'assets/icons/images/keemaontop.png',
    'assets/icons/images/keemanoodleskeema.png'
];

const HINTS = [
    '🫙 Drag soya sauce onto the plate',
    '🥜 Drag peanuts onto the plate',
    '🍜 Drag noodles onto the plate',
    '🍖 Drag keema meat onto the plate',
    '✅ Keema noodles ready! Press Serve!'
];

const INGREDIENTS = [
    { id: 'kn-soya',    label: 'Soya Sauce', emoji: '🫙', step: 0 },
    { id: 'kn-peanuts', label: 'Peanuts',    emoji: '🥜', step: 1 },
    { id: 'kn-noodles', label: 'Noodles',    emoji: '🍜', step: 2 },
    { id: 'kn-keema',   label: 'Keema Meat', emoji: '🍖', step: 3 }
];

export class NoodlesScene {
    constructor(gameClock, dragManager, floorScene) {
        this.gameClock   = gameClock;
        this.dragManager = dragManager;
        this.floorScene  = floorScene;

        this.popupEl    = document.getElementById('noodles-popup');
        this.stepImg    = document.getElementById('noodles-step-img');
        this.binEl      = document.getElementById('noodles-ingredient-bin');
        this.hintEl     = document.getElementById('noodles-hint');
        this.confirmBtn = document.getElementById('noodles-confirm');
        this.cancelBtn  = document.getElementById('noodles-cancel');

        this.step             = 0;
        this._sourceStationId = null;
        this._sourceSlotIndex = null;

        this.confirmBtn.addEventListener('click', () => this.confirm());
        this.cancelBtn.addEventListener('click',  () => this.cancel());

        this.dragManager.registerZone('noodles-plate-area', document.getElementById('noodles-plate-area'), {
            scene:   'noodles',
            accepts: INGREDIENTS.map(i => i.id),
            onReceive: (itemType) => this._onIngredientDrop(itemType)
        });
    }

    open(sourceStationId, sourceSlotIndex) {
        this.step             = 0;
        this._sourceStationId = sourceStationId;
        this._sourceSlotIndex = sourceSlotIndex;
        this.confirmBtn.disabled = true;

        this.gameClock.setTimeScale(PLATING_TIME_SCALE);
        this.dragManager.setScene('noodles');

        this.stepImg.src = STEP_IMAGES[0];
        this.popupEl.style.display = 'flex';
        this._renderBin();
        this._updateHint();
    }

    _onIngredientDrop(itemType) {
        const ing = INGREDIENTS.find(i => i.id === itemType);
        if (!ing || ing.step !== this.step) return;
        this._advanceTo(this.step + 1);
    }

    _advanceTo(step) {
        this.step = step;
        this.stepImg.src = STEP_IMAGES[Math.min(step, STEP_IMAGES.length - 1)];
        this._updateHint();
        this._updateBinState();
        if (step >= INGREDIENTS.length) this.confirmBtn.disabled = false;
    }

    _updateHint() {
        if (this.hintEl) this.hintEl.textContent = HINTS[Math.min(this.step, HINTS.length - 1)];
    }

    _renderBin() {
        this.binEl.innerHTML = '';
        INGREDIENTS.forEach(ing => {
            const btn = document.createElement('div');
            btn.className = 'noodles-ing-btn';
            btn.dataset.ingStep = String(ing.step);
            btn.innerHTML = `<span>${ing.emoji}</span><small>${ing.label}</small>`;
            this.binEl.appendChild(btn);
            this.dragManager.registerDraggable(btn, { itemType: ing.id, scene: 'noodles' });
        });
        this._updateBinState();
    }

    _updateBinState() {
        this.binEl.querySelectorAll('.noodles-ing-btn').forEach(btn => {
            const active = this.step === parseInt(btn.dataset.ingStep);
            btn.style.opacity       = active ? '1' : '0.3';
            btn.style.pointerEvents = active ? 'auto' : 'none';
        });
    }

    confirm() {
        if (this.step < INGREDIENTS.length) return;

        // Clear the cooking-pot slot that held the cooked noodles
        if (this._sourceStationId && this._sourceSlotIndex !== null) {
            const station = this.floorScene.stations.find(s => s.id === this._sourceStationId);
            if (station) station.clearSlot(parseInt(this._sourceSlotIndex));
        }

        // Place plated noodles on the plating counter
        const itemsContainer = document.getElementById('plating-counter-items');
        if (!itemsContainer) { this.cleanup(); return; }

        const emptyText = document.getElementById('plating-counter-empty-text');
        if (emptyText) emptyText.remove();

        const baseItemHtml = `<img src="assets/icons/images/keemanoodleskeema.png" class="item-icon food-img" draggable="false" />`;
        const itemWrapper  = document.createElement('div');
        itemWrapper.className = 'plated-item ready-item';
        itemWrapper.setAttribute('data-source-station', 'plating-counter');
        itemWrapper.setAttribute('data-base-type', 'noodles');
        itemWrapper.setAttribute('data-toppings', '[]');
        itemWrapper.style.cssText = 'position:relative;width:60px;height:60px;background:#fff;border:4px solid #2ecc71;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 6px rgba(0,0,0,0.1);cursor:grab;flex-shrink:0;';
        itemWrapper.innerHTML = `<div style="position:absolute;z-index:1;transform:scale(0.8);">${baseItemHtml}</div>`;

        itemsContainer.appendChild(itemWrapper);
        this.dragManager.registerDraggable(itemWrapper, { itemType: 'plated-noodles', scene: 'floor', dragPreviewSrc: 'assets/icons/images/keemanoodleskeema.png' });

        this.cleanup();
    }

    cancel() { this.cleanup(); }

    cleanup() {
        this.step             = 0;
        this._sourceStationId = null;
        this._sourceSlotIndex = null;

        this.popupEl.style.display = 'none';
        this.binEl.innerHTML       = '';

        this.gameClock.setTimeScale(1.0);
        this.dragManager.setScene('floor');
    }
}
