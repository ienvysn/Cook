export const LEVEL_1 = {
    id: 1,
    name: "Sano Suru",
    stations: [{ id: 'steamer-1', type: 'steamer', accepts: ['raw-momo'], slots: 3 }],
    customerTypes: ['college-student'],
    spawnIntervalSeconds: 8,
    goal: { type: 'serveCount', target: 10 },
    starThresholds: { 1: 0, 2: 400, 3: 700 }
};
