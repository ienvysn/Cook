import { PLATING_TIME_SCALE } from '../data/config.js';

// laphingsheet.png: 3-col × 2-row sprite sheet
// frame 0(TL)=plain, 1(TM)=sauce, 2(TR)=gluten-strip,
// frame 3(BL)=noodles-spread, 4(BM)=rolled-tube, 5(BR)=sliced
const SHEET_POS = [
    '0% 0%', '50% 0%', '100% 0%',
    '0% 100%', '50% 100%', '100% 100%'
];
// step 0-5 → frame index in laphingsheet; step 6 = bowl view (different image)
const STEP_FRAME = [0, 1, 2, 3, 4, 5];

// laphingbowl.png: 1-col × 2-row sprite
// top frame = plain bowl (no sauce), bottom frame = bowl with soya sauce
const BOWL_IMG  = 'assets/icons/images/laphingbowl.png';
const BOWL_POS  = { plain: '50% 0%', sauce: '50% 100%' };

const CHOPS_NEEDED = 3;

const HINTS = [
    '🍯 Drag sauce onto the sheet',
    '🫙 Drag gluten onto the sheet',
    '🍜 Drag noodles onto the sheet',
    '☝️ Scroll UP to roll the laphing!',
    '✂️ Click to chop!',
    '✂️ Click to chop!',          // step 5 = chopping done, about to bowl
    '🫙 Add soya sauce (optional), then press Serve!'
];

export class LaphingScene {
    constructor(gameClock, dragManager, audioManager) {
        this.gameClock   = gameClock;
        this.dragManager = dragManager;
        this.audioManager = audioManager || null;

        this.popupEl    = document.getElementById('laphing-popup');
        this.plateArea  = document.getElementById('laphing-plate-area');
        this.binEl      = document.getElementById('laphing-ingredient-bin');
        this.hintEl     = document.getElementById('laphing-hint');
        this.confirmBtn = document.getElementById('laphing-confirm');
        this.cancelBtn  = document.getElementById('laphing-cancel');

        this.step       = 0;
        this.chopCount  = 0;
        this.hasSauce   = false;
        this._blocking  = false;

        this.confirmBtn.addEventListener('click', () => this._onConfirmClick());
        this.cancelBtn.addEventListener('click',  () => this.cancel());

        // Accept everything in laphing scene; filter in _onIngredientDrop
        this.dragManager.registerZone('laphing-plate-area', this.plateArea, {
            scene:   'laphing',
            accepts: [],
            onReceive: (itemType) => this._onIngredientDrop(itemType)
        });

        // Scroll UP = rolling (step 3)
        this.plateArea.addEventListener('wheel', (e) => {
            if (this.step === 3 && e.deltaY < 0) {
                e.preventDefault();
                this._advanceTo(4);
            }
        }, { passive: false });

        // Click = chop (step 4)
        this.plateArea.addEventListener('click', () => {
            if (this.step === 4) {
                this.chopCount++;
                this.plateArea.classList.add('laphing-chop-flash');
                setTimeout(() => this.plateArea.classList.remove('laphing-chop-flash'), 150);
                this._updateHint();

                if (this.chopCount >= CHOPS_NEEDED) this._advanceTo(5);
            }
        });
    }

    open() {
        this.step      = 0;
        this.chopCount = 0;
        this.hasSauce  = false;
        this._blocking = false;
        this.confirmBtn.disabled = true;
        this.confirmBtn.textContent = 'Add to Bowl 🥣';

        this.gameClock.setTimeScale(PLATING_TIME_SCALE);
        this.dragManager.setScene('laphing');

        this.popupEl.style.display = 'flex';
        this._renderBin();
        this._updatePlate();
        this._updateHint();
    }

    _onIngredientDrop(itemType) {
        if (this._blocking) return;

        if (itemType === 'laphing-sauce'   && this.step === 0) { this._advanceTo(1); if (this.audioManager) this.audioManager.playPlating(); }
        if (itemType === 'laphing-gluten'  && this.step === 1) { this._advanceTo(2); if (this.audioManager) this.audioManager.playPlating(); }
        if (itemType === 'laphing-noodles' && this.step === 2) { this._advanceTo(3); if (this.audioManager) this.audioManager.playPlating(); }

        // Soya sauce for the bowl — available at steps 5 and 6, optional
        if (itemType === 'laphing-soya' && (this.step === 5 || this.step === 6) && !this.hasSauce) {
            this.hasSauce = true;
            this._updatePlate();
            this._updateBinState();
            if (this.audioManager) this.audioManager.playPlating();
        }
    }

    _advanceTo(step) {
        const prevStep = this.step;
        this.step = step;
        this._updatePlate();
        this._updateHint();
        this._updateBinState();

        // Start chop loop when entering chopping phase
        if (step === 4 && prevStep !== 4) {
            if (this.audioManager) this.audioManager.startChop();
        }

        if (step === 5) {
            // Chopping done → stop chop sound, show "Add to Bowl" button
            if (this.audioManager) this.audioManager.stopChop();
            this.confirmBtn.disabled    = false;
            this.confirmBtn.textContent = 'Add to Bowl 🥣';
        } else if (step === 6) {
            // Bowl view → show "Serve!" button
            this.confirmBtn.disabled    = false;
            this.confirmBtn.textContent = 'Serve! ✅';
        }
    }

    _updatePlate() {
        if (this.step === 6) {
            // Bowl view using laphingbowl.png (1×2 vertical sprite)
            Object.assign(this.plateArea.style, {
                backgroundImage:    `url('${BOWL_IMG}')`,
                backgroundSize:     '200% 200%',
                backgroundPosition: this.hasSauce ? BOWL_POS.sauce : BOWL_POS.plain,
                backgroundRepeat:   'no-repeat',
                cursor:             'default',
                transition:         'background-position 0.35s ease'
            });
            return;
        }

        // laphingsheet steps 0–5
        const frame = STEP_FRAME[this.step] ?? 0;
        Object.assign(this.plateArea.style, {
            backgroundImage:    "url('assets/icons/images/laphingsheet.png')",
            backgroundSize:     '300% 200%',
            backgroundPosition: SHEET_POS[frame],
            backgroundRepeat:   'no-repeat',
            cursor:             this.step === 4 ? 'crosshair' : 'default',
            transition:         ''
        });
    }

    _updateHint() {
        if (!this.hintEl) return;
        let text = HINTS[Math.min(this.step, HINTS.length - 1)];
        if (this.step === 4 && this.chopCount > 0) {
            text = `✂️ Click to chop! (${this.chopCount}/${CHOPS_NEEDED})`;
        }
        this.hintEl.textContent = text;
    }

    _renderBin() {
        this.binEl.innerHTML = '';
        const ingredients = [
            { id: 'laphing-sauce',   label: 'Sauce',       emoji: '🍯', step: 0 },
            { id: 'laphing-gluten',  label: 'Gluten',      emoji: '🫙', step: 1 },
            { id: 'laphing-noodles', label: 'Raw Noodles', emoji: '🍜', step: 2 },
            { id: 'laphing-soya',    label: 'Soya Sauce',  emoji: '🍶', step: 5 }  // bowl step
        ];
        ingredients.forEach(ing => {
            const btn = document.createElement('div');
            btn.className = 'laphing-ing-btn';
            btn.dataset.ingStep = String(ing.step);
            btn.innerHTML = `<span>${ing.emoji}</span><small>${ing.label}</small>`;
            this.binEl.appendChild(btn);
            this.dragManager.registerDraggable(btn, { itemType: ing.id, scene: 'laphing' });
        });
        this._updateBinState();
    }

    _updateBinState() {
        this.binEl.querySelectorAll('.laphing-ing-btn').forEach(btn => {
            const ingStep = parseInt(btn.dataset.ingStep);
            let active;
            if (ingStep === 5) {
                // Soya sauce: available at step 5 or 6, unless already added
                active = !this._blocking && (this.step === 5 || this.step === 6) && !this.hasSauce;
            } else {
                active = !this._blocking && this.step === ingStep;
            }
            btn.style.opacity       = active ? '1' : '0.3';
            btn.style.pointerEvents = active ? 'auto' : 'none';
        });
    }

    confirm() {
        if (this.step < 6) return;

        const itemsContainer = document.getElementById('plating-counter-items');
        if (!itemsContainer) { this.cleanup(); return; }

        const emptyText = document.getElementById('plating-counter-empty-text');
        if (emptyText) emptyText.remove();

        // Counter item shows laphingbowl.png at the correct frame
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'plated-item ready-item';
        itemWrapper.setAttribute('data-source-station', 'plating-counter');
        itemWrapper.setAttribute('data-base-type', 'laphing');
        itemWrapper.setAttribute('data-toppings', '[]');
        itemWrapper.style.cssText = 'position:relative;width:60px;height:60px;border:4px solid #2ecc71;border-radius:50%;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);cursor:grab;flex-shrink:0;';
        itemWrapper.innerHTML = `
            <div style="
                width:100%;height:100%;
                background-image:url('${BOWL_IMG}');
                background-size:100% 200%;
                background-position:${this.hasSauce ? BOWL_POS.sauce : BOWL_POS.plain};
                background-repeat:no-repeat;
            "></div>
        `;

        itemsContainer.appendChild(itemWrapper);
        this.dragManager.registerDraggable(itemWrapper, { itemType: 'plated-laphing', scene: 'floor', dragPreviewSrc: BOWL_IMG });

        this.cleanup();
    }

    cancel() { this.cleanup(); }

    cleanup() {
        // Stop any looping chop sound if still playing
        if (this.audioManager) this.audioManager.stopChop();

        this._blocking  = false;
        this.step       = 0;
        this.chopCount  = 0;
        this.hasSauce   = false;

        this.confirmBtn.textContent = 'Add to Bowl 🥣';
        this.popupEl.style.display           = 'none';
        this.plateArea.style.backgroundImage = 'none';
        this.binEl.innerHTML                 = '';

        this.gameClock.setTimeScale(1.0);
        this.dragManager.setScene('floor');
    }
}
