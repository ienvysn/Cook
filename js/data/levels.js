export const LEVEL_1 = {
    id: 1,
    name: "Sano Suru",
    stations: [{ id: 'steamer-1', type: 'steamer', accepts: ['raw-momo'], slots: 3 }],
    customerTypes: ['college-student'],
    spawnIntervalSeconds: 8,
    goal: { type: 'serveCount', target: 10 },
    starThresholds: { 1: 0, 2: 400, 3: 700 }
};

export const LEVEL_2 = {
    id: 2,
    name: "Boudha",
    stations: [
        { id: 'steamer-1', type: 'steamer', accepts: ['raw-momo'], slots: 3 },
        { id: 'laphing-1', type: 'laphing-tray', accepts: ['raw-laphing'], slots: 2 }
    ],
    customerTypes: ['college-student', 'office-worker'],
    spawnIntervalSeconds: 7,
    goal: { type: 'serveCount', target: 15 },
    starThresholds: { 1: 0, 2: 600, 3: 1000 }
};

export const LEVEL_3 = {
    id: 3,
    name: "Jhamsikhel",
    stations: [
        { id: 'steamer-1', type: 'steamer', accepts: ['raw-momo'], slots: 3 },
        { id: 'laphing-1', type: 'laphing-tray', accepts: ['raw-laphing'], slots: 2 },
        { id: 'frypan-1', type: 'fry-pan', accepts: ['raw-noodles'], slots: 2 }
    ],
    customerTypes: ['college-student', 'office-worker'],
    spawnIntervalSeconds: 6,
    goal: { type: 'serveCount', target: 20 },
    starThresholds: { 1: 0, 2: 800, 3: 1400 }
};
