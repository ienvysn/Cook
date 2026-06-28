/**
 * AudioManager — handles all game sound effects.
 *
 * Audio mapping:
 *   ambient.wav       → loops throughout the entire game session
 *   boilingnoodles.wav → plays while noodles are cooking in the cooking-pot
 *   coins.wav         → plays when a customer pays (successful serve)
 *   frying.wav        → plays while momos are frying in the fry-pan, stops when done
 *   laphingchop.wav   → plays during the chopping step of the Laphing mini-game
 *   puttingstuffon.mp3→ plays when placing toppings/ingredients during plating (all dishes)
 */

const AUDIO_PATHS = {
    ambient:    'assets/audio/ambien.wav',
    boiling:    'assets/audio/boilingnoodles.wav',
    coins:      'assets/audio/coins.wav',
    frying:     'assets/audio/frying.wav',
    steam:      'assets/audio/freesound_community-steam-sfx-26907.mp3',
    chop:       'assets/audio/laphingchop.wav',
    plating:    'assets/audio/puttingstuffon.mp3'
};

export class AudioManager {
    constructor() {
        /** @type {Record<string, HTMLAudioElement>} */
        this._sounds = {};
        this._started = false;

        // Pre-create all Audio elements
        for (const [key, path] of Object.entries(AUDIO_PATHS)) {
            const audio = new Audio(path);
            audio.preload = 'auto';

            // Ambient loops forever at lower volume
            if (key === 'ambient') {
                audio.loop = true;
                audio.volume = 0.3;
            }

            // Looping cooking sounds (stop/start controlled by game logic)
            if (key === 'boiling' || key === 'frying' || key === 'steam' || key === 'chop') {
                audio.loop = true;
                audio.volume = 0.5;
            }

            if (key === 'coins') {
                audio.volume = 0.7;
            }

            if (key === 'chop') {
                audio.volume = 0.6;
            }

            if (key === 'steam') {
                audio.volume = 0.5;
            }

            if (key === 'plating') {
                audio.volume = 0.6;
            }

            this._sounds[key] = audio;
        }
    }

    /**
     * Start ambient background music. Must be called after a user gesture
     * (browsers block autoplay until the user interacts).
     */
    startAmbient() {
        if (this._started) return;
        this._started = true;
        const ambient = this._sounds.ambient;
        ambient.currentTime = 0;
        ambient.play().catch(() => {
            // Autoplay blocked — retry on next user interaction
            const retry = () => {
                ambient.play().catch(() => {});
                document.removeEventListener('click', retry);
                document.removeEventListener('pointerdown', retry);
            };
            document.addEventListener('click', retry, { once: true });
            document.addEventListener('pointerdown', retry, { once: true });
        });
    }

    /** Play the coin-collect jingle (one-shot). */
    playCoins() {
        this._oneShot('coins');
    }

    /** Play the plating / putting-stuff-on sound (one-shot). */
    playPlating() {
        this._oneShot('plating');
    }

    /** Start the laphing chop loop (plays continuously during chopping). */
    startChop() {
        this._startLoop('chop');
    }

    /** Stop the laphing chop loop (called when chopping is done). */
    stopChop() {
        this._stopLoop('chop');
    }

    // ── Looping cooking sounds ──

    /** Start the boiling-noodles loop (called when noodles start cooking). */
    startBoiling() {
        this._startLoop('boiling');
    }

    /** Stop the boiling-noodles loop (called when noodles finish cooking / are removed). */
    stopBoiling() {
        this._stopLoop('boiling');
    }

    /** Start the frying loop (called when momos start frying). */
    startFrying() {
        this._startLoop('frying');
    }

    /** Stop the frying loop (called when momos finish frying / are removed). */
    stopFrying() {
        this._stopLoop('frying');
    }

    /** Start the steam loop (called when momos start steaming). */
    startSteam() {
        this._startLoop('steam');
    }

    /** Stop the steam loop (called when momos finish steaming / are removed). */
    stopSteam() {
        this._stopLoop('steam');
    }

    // ── Internal helpers ──

    _oneShot(key) {
        const snd = this._sounds[key];
        if (!snd) return;
        // Clone so overlapping plays don't cut each other off
        const clone = snd.cloneNode();
        clone.volume = snd.volume;
        clone.play().catch(() => {});
    }

    _startLoop(key) {
        const snd = this._sounds[key];
        if (!snd || !snd.paused) return;  // already playing
        snd.currentTime = 0;
        snd.play().catch(() => {});
    }

    _stopLoop(key) {
        const snd = this._sounds[key];
        if (!snd) return;
        snd.pause();
        snd.currentTime = 0;
    }
}
