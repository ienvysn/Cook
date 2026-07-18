export const CUSTOMER_TYPES = {
    'college-student': {
        id: 'college-student',
        name: 'College Student',
        basePatienceMs: 25000,
        possibleOrders: ['momo', 'fried-momo', 'laphing', 'noodles'],
        color: '#3498db',
        sprites: [
            'assets/icons/images/studentboy.png',
            'assets/icons/images/schoolgirl.png'
        ],
        spriteFrames: 4
    },
    'office-worker': {
        id: 'office-worker',
        name: 'Office Worker',
        basePatienceMs: 15000,
        possibleOrders: ['momo', 'fried-momo', 'laphing', 'noodles'],
        color: '#2c3e50',
        telegraphMs: 3000,
        sprites: ['assets/icons/images/officeguy.png'],
        spriteFrames: 4
    },
    'oli': {
        id: 'oli',
        name: 'Oli',
        basePatienceMs: 20000,
        possibleOrders: ['momo', 'fried-momo', 'laphing', 'noodles'],
        color: '#8e44ad',
        sprites: ['assets/icons/images/olii.png'],
        spriteFrames: 4
    }
};
