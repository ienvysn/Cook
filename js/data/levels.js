// Level 1: Bamboo steamer only — momo
export const LEVEL_1 = {
    id: 1,
    name: "Sano Suru",
    stations: [
        { id: 'steamer-1', type: 'steamer', accepts: ['raw-momo'], produces: 'momo', slots: 4 }
    ],
    customerTypes: ['college-student'],
    spawnIntervalSeconds: 9,
    patienceMultiplier: 1.5,
    goal: { type: 'serveCount', target: 10 },
    starThresholds: { 1: 0, 2: 400, 3: 700 },
    availableBoosters: [],
    minNetToProgress: 250
};

// Level 2: + Frying pan — fried momo unlocked
export const LEVEL_2 = {
    id: 2,
    name: "Boudha Bazaar",
    stations: [
        { id: 'steamer-1', type: 'steamer',  accepts: ['raw-momo'], produces: 'momo',       slots: 4 },
        { id: 'frypan-1',  type: 'fry-pan',  accepts: ['raw-momo'], produces: 'fried-momo', slots: 2 }
    ],
    customerTypes: ['college-student', 'office-worker'],
    spawnIntervalSeconds: 8,
    patienceMultiplier: 1.2,
    goal: { type: 'serveCount', target: 15 },
    starThresholds: { 1: 0, 2: 600, 3: 1000 },
    availableBoosters: ['speed-boost'],
    minNetToProgress: 450
};

// Level 3: + Laphing tray
export const LEVEL_3 = {
    id: 3,
    name: "Jhamsikhel",
    stations: [
        { id: 'steamer-1',  type: 'steamer',      accepts: ['raw-momo'],    produces: 'momo',       slots: 4 },
        { id: 'frypan-1',   type: 'fry-pan',       accepts: ['raw-momo'],    produces: 'fried-momo', slots: 2 },
        { id: 'laphing-1',  type: 'laphing-tray',  accepts: ['raw-laphing'], produces: 'laphing',    slots: 1 }
    ],
    customerTypes: ['college-student', 'office-worker', 'oli'],
    spawnIntervalSeconds: 7,
    patienceMultiplier: 1.0,
    goal: { type: 'serveCount', target: 20 },
    starThresholds: { 1: 0, 2: 800, 3: 1400 },
    availableBoosters: ['speed-boost', 'calm-crowd'],
    minNetToProgress: 600
};

// Level 4: + Two keema noodle pots
export const LEVEL_4 = {
    id: 4,
    name: "Thamel Chowk",
    stations: [
        { id: 'steamer-1',  type: 'steamer',      accepts: ['raw-momo'],    produces: 'momo',       slots: 4 },
        { id: 'frypan-1',   type: 'fry-pan',       accepts: ['raw-momo'],    produces: 'fried-momo', slots: 2 },
        { id: 'laphing-1',  type: 'laphing-tray',  accepts: ['raw-laphing'], produces: 'laphing',    slots: 1 },
        { id: 'pot-1',      type: 'cooking-pot',   accepts: ['raw-noodles'], produces: 'noodles',    slots: 2 }
    ],
    customerTypes: ['college-student', 'office-worker', 'oli'],
    spawnIntervalSeconds: 6,
    patienceMultiplier: 0.8,
    goal: { type: 'serveCount', target: 25 },
    starThresholds: { 1: 0, 2: 1000, 3: 1800 },
    availableBoosters: ['speed-boost', 'calm-crowd', 'quick-plate']
};
