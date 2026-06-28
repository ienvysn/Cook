import { UPGRADE_FASTER_STEAMER_COST } from '../data/config.js';

export class TallyScreen {
    constructor(el) {
        this.el = el;
    }

    show(stats, onContinue, onReplay) {
        const { levelName, score, revenue, tips, expenses, levelConfig, sessionMoney, upgrades } = stats;

        const net           = revenue + tips - expenses;
        const stars         = this._calcStars(score, levelConfig.starThresholds);
        const minNet        = levelConfig.minNetToProgress || 0;
        const isLastLevel   = levelConfig.id >= 4;
        const meetsGate     = isLastLevel || net >= minNet;
        const shortfall     = minNet - net;
        const continueLabel = isLastLevel ? 'Play Again' : 'Next Level →';

        this.el.innerHTML = `
            <div class="tally-content">
                <h1 class="tally-title">${stats.reason === 'mood' ? '😞 Crowd Left...' : '🎊 Level Complete!'}</h1>
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
                        <span>Session Total</span><span class="tally-val">Rs. ${sessionMoney + net}</span>
                    </div>
                </div>

                ${!isLastLevel ? `
                <div class="tally-gate ${meetsGate ? 'gate-met' : 'gate-unmet'}">
                    ${meetsGate
                        ? `✅ Earnings goal met! (Rs. ${minNet} required)`
                        : `🔒 Need Rs. ${minNet} net to advance — you're Rs. ${shortfall} short. Replay to earn more!`
                    }
                </div>` : ''}

                <div class="tally-upgrades" id="tally-upgrades-section">
                    ${this._upgradeHTML(upgrades, sessionMoney + net)}
                </div>

                <div class="tally-actions">
                    <button id="tally-replay-btn" class="tally-btn tally-btn-secondary">↩ Replay</button>
                    <button id="tally-continue-btn"
                        class="tally-btn ${meetsGate ? 'tally-btn-primary' : 'tally-btn-locked'}"
                        ${meetsGate ? '' : 'disabled'}>
                        ${meetsGate ? continueLabel : `🔒 Rs. ${shortfall} short`}
                    </button>
                </div>
            </div>
        `;

        this.el.style.display = 'flex';

        // Upgrade button
        const upgradeBtn = this.el.querySelector('#upgrade-faster-steamer');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                upgrades.fasterSteamer = true;
                const newSession = sessionMoney + net - UPGRADE_FASTER_STEAMER_COST;
                upgradeBtn.textContent = '✓ Faster Steamer purchased!';
                upgradeBtn.disabled = true;
                this.el.querySelector('.tally-session-row .tally-val').textContent = `Rs. ${newSession}`;
                // Rebind continue with updated session money
                const btn = this.el.querySelector('#tally-continue-btn');
                btn.replaceWith(btn.cloneNode(true)); // remove old listener
                this.el.querySelector('#tally-continue-btn').addEventListener('click', () => {
                    this.hide();
                    onContinue(upgrades, newSession);
                }, { once: true });
            });
        }

        if (meetsGate) {
            this.el.querySelector('#tally-continue-btn').addEventListener('click', () => {
                this.hide();
                onContinue(upgrades, sessionMoney + net);
            }, { once: true });
        }

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
        return 1;
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
                <small>(all cook times −20%)</small>
            </button>
            ${!canAfford ? `<div class="upgrade-hint">Need Rs. ${UPGRADE_FASTER_STEAMER_COST - availableMoney} more</div>` : ''}
        `;
    }
}
