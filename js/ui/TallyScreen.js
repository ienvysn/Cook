import { UPGRADE_FASTER_STEAMER_COST } from '../data/config.js';

export class TallyScreen {
    constructor(el) {
        this.el = el; // the #tally-screen div
    }

    // stats: { levelName, score, revenue, tips, expenses, levelConfig, sessionMoney, upgrades }
    // onContinue(upgrades, sessionMoney): called when player clicks Continue / Next Level
    // onReplay(): called when player clicks Replay
    show(stats, onContinue, onReplay) {
        const { levelName, score, revenue, tips, expenses, levelConfig, sessionMoney, upgrades } = stats;

        const net = revenue + tips - expenses;
        const stars = this._calcStars(score, levelConfig.starThresholds);

        this.el.innerHTML = `
            <div class="tally-content">
                <h1 class="tally-title">Level Complete!</h1>
                <div class="tally-level-name">${levelName}</div>

                <div class="tally-stars">
                    ${[1,2,3].map(n => `<span class="tally-star ${n <= stars ? 'filled' : 'empty'}">★</span>`).join('')}
                </div>

                <div class="tally-stats">
                    <div class="tally-row">
                        <span>Revenue</span><span class="tally-val">Rs. ${revenue}</span>
                    </div>
                    <div class="tally-row">
                        <span>Tips</span><span class="tally-val tally-tip">+Rs. ${tips}</span>
                    </div>
                    <div class="tally-row tally-expense-row">
                        <span>Boosters spent</span><span class="tally-val tally-expense">-Rs. ${expenses}</span>
                    </div>
                    <div class="tally-row tally-total-row">
                        <span>Net Earned</span><span class="tally-val tally-total">Rs. ${net}</span>
                    </div>
                    <div class="tally-row tally-session-row">
                        <span>Session Money</span><span class="tally-val">Rs. ${sessionMoney + net}</span>
                    </div>
                </div>

                <div class="tally-upgrades" id="tally-upgrades-section">
                    ${this._upgradeHTML(upgrades, sessionMoney + net)}
                </div>

                <div class="tally-actions">
                    <button id="tally-replay-btn" class="tally-btn tally-btn-secondary">Replay</button>
                    <button id="tally-continue-btn" class="tally-btn tally-btn-primary">
                        ${levelConfig.id < 3 ? 'Next Level' : 'Play Again'}
                    </button>
                </div>
            </div>
        `;

        this.el.style.display = 'flex';

        // Wire up upgrade button
        const upgradeBtn = this.el.querySelector('#upgrade-faster-steamer');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                upgrades.fasterSteamer = true;
                const newSession = sessionMoney + net - UPGRADE_FASTER_STEAMER_COST;
                upgradeBtn.textContent = '✓ Faster Steamer Purchased!';
                upgradeBtn.disabled = true;
                this.el.querySelector('.tally-session-row .tally-val').textContent = `Rs. ${newSession}`;
                // Update continue callback closure
                this.el.querySelector('#tally-continue-btn').addEventListener('click', () => {
                    this.hide();
                    onContinue(upgrades, newSession);
                }, { once: true });
            });
        }

        // Wire buttons — once so we don't stack listeners on replay
        this.el.querySelector('#tally-continue-btn').addEventListener('click', () => {
            this.hide();
            onContinue(upgrades, sessionMoney + net);
        }, { once: true });

        this.el.querySelector('#tally-replay-btn').addEventListener('click', () => {
            this.hide();
            onReplay();
        }, { once: true });
    }

    hide() {
        this.el.style.display = 'none';
        this.el.innerHTML = '';
    }

    _calcStars(score, thresholds) {
        if (score >= thresholds[3]) return 3;
        if (score >= thresholds[2]) return 2;
        if (score >= thresholds[1]) return 1;
        return 1; // minimum 1 star for completing
    }

    _upgradeHTML(upgrades, availableMoney) {
        if (upgrades.fasterSteamer) {
            return `<div class="upgrade-owned">✓ Faster Steamer (already owned)</div>`;
        }

        const canAfford = availableMoney >= UPGRADE_FASTER_STEAMER_COST;
        return `
            <div class="tally-upgrades-title">Upgrades</div>
            <button id="upgrade-faster-steamer"
                    class="upgrade-btn ${canAfford ? '' : 'upgrade-btn-disabled'}"
                    ${canAfford ? '' : 'disabled'}>
                ⚙️ Faster Steamer — Rs. ${UPGRADE_FASTER_STEAMER_COST}
                <small>(all cook times -20%)</small>
            </button>
            ${!canAfford ? `<div class="upgrade-hint">Need Rs. ${UPGRADE_FASTER_STEAMER_COST - availableMoney} more</div>` : ''}
        `;
    }
}
