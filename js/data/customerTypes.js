export const CUSTOMER_TYPES = {
    'college-student': {
        id: 'college-student',
        name: 'College Student',
        basePatienceMs: 25000, // 25 seconds
        possibleOrders: ['momo'],
        emoji: '🧑‍🎓',
        color: '#3498db'
    },
    'office-worker': {
        id: 'office-worker',
        name: 'Office Worker',
        basePatienceMs: 15000, // 15 seconds (fast drain)
        possibleOrders: ['momo', 'noodles', 'laphing'],
        emoji: '💼',
        color: '#2c3e50',
        telegraphMs: 3000 // 3 seconds warning
    }
};
