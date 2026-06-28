import { GameClock }     from './core/GameClock.js';
import { DragManager }   from './core/DragManager.js';
import { EventBus }      from './core/EventBus.js';
import { AudioManager }  from './core/AudioManager.js';
import { ComboSystem }   from './systems/ComboSystem.js';
import { MoodSystem }    from './systems/MoodSystem.js';
import { BoosterSystem } from './systems/BoosterSystem.js';
import { FloorScene }    from './scenes/FloorScene.js';
import { PlatingScene }  from './scenes/PlatingScene.js';
import { LaphingScene }  from './scenes/LaphingScene.js';
import { NoodlesScene }  from './scenes/NoodlesScene.js';
import { TallyScreen }   from './ui/TallyScreen.js';
import { LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4 } from './data/levels.js';

console.log('Game Booted');

const LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4];

// Session state — persists across levels within one browser session
const sessionState = {
    sessionMoney: 0,
    upgrades: { fasterSteamer: false },
    currentLevelIndex: 0
};

const clock        = new GameClock();
const audioManager = new AudioManager();
const gameContainer = document.getElementById('game-container');
const tallyEl      = document.getElementById('tally-screen');
const tallyScreen  = new TallyScreen(tallyEl);

// DragManager is created once and reused; scenes register their own zones each run.
let dragManager = null;

function startLevel(levelIndex) {
    sessionState.currentLevelIndex = levelIndex;
    const levelConfig = LEVELS[levelIndex];

    // Clean up any previous DragManager to remove stale interact.js bindings
    dragManager = new DragManager();
    dragManager.setScene('floor');

    // Per-level systems — fresh each level
    const eventBus     = new EventBus();
    const comboSystem  = new ComboSystem(eventBus);
    const moodSystem   = new MoodSystem(eventBus);
    const boosterSystem = new BoosterSystem(clock, eventBus);

    const systems = {
        eventBus,
        comboSystem,
        moodSystem,
        boosterSystem,
        audioManager,
        upgrades: sessionState.upgrades,
        onLevelEnd: (stats) => onLevelEnd(stats, { eventBus, boosterSystem })
    };

    const floorScene   = new FloorScene(clock, dragManager, levelConfig, systems);
    const platingScene = new PlatingScene(clock, dragManager, floorScene, boosterSystem, audioManager);
    const laphingScene = new LaphingScene(clock, dragManager, audioManager);
    const noodlesScene = new NoodlesScene(clock, dragManager, floorScene, audioManager);
    floorScene.setPlatingScene(platingScene);
    floorScene.setLaphingScene(laphingScene);
    floorScene.setNoodlesScene(noodlesScene);

    gameContainer.style.display = '';
    gameContainer.innerHTML = '';
    floorScene.render(gameContainer);

    if (!clock.isRunning) clock.start();
    audioManager.startAmbient();

    // Store refs for later cleanup
    sessionState._floorScene   = floorScene;
    sessionState._boosterSystem = boosterSystem;
}

function onLevelEnd(stats, { eventBus, boosterSystem }) {
    // Tear down booster GameClock subscription
    boosterSystem.destroy();

    tallyScreen.show(
        {
            ...stats,
            sessionMoney: sessionState.sessionMoney,
            upgrades: sessionState.upgrades
        },
        // onContinue
        (updatedUpgrades, newSessionMoney) => {
            sessionState.upgrades     = updatedUpgrades;
            sessionState.sessionMoney = newSessionMoney;

            const next = sessionState.currentLevelIndex + 1;
            if (next < LEVELS.length) {
                startLevel(next);
            } else {
                showGameComplete();
            }
        },
        // onReplay
        () => {
            startLevel(sessionState.currentLevelIndex);
        }
    );
}

function showGameComplete() {
    gameContainer.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:24px;background:#fdf0e8;">
            <h1 style="font-size:3rem;color:#5c3a21;">All Levels Complete!</h1>
            <p style="font-size:1.2rem;color:#7a5c3a;">Session earnings: Rs. ${sessionState.sessionMoney}</p>
            <button id="restart-btn" style="padding:14px 32px;font-size:1.1rem;font-weight:bold;background:#e67e22;color:white;border:none;border-radius:10px;cursor:pointer;">
                Play Again
            </button>
        </div>
    `;
    document.getElementById('restart-btn').addEventListener('click', () => {
        sessionState.sessionMoney      = 0;
        sessionState.upgrades          = { fasterSteamer: false };
        sessionState.currentLevelIndex = 0;
        startLevel(0);
    });
}

// ── DEV: press 1–4 to jump to any level instantly ──
document.addEventListener('keydown', (e) => {
    const idx = parseInt(e.key) - 1;
    if (idx >= 0 && idx < LEVELS.length) startLevel(idx);
});

// Boot
startLevel(0);
