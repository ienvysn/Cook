export const ITEM_REGISTRY = {
    'momo': {
        placeholder: { emoji: '🥟', color: '#e8c87a' },
        sprite:     'assets/icons/images/1momo.jpeg',
        hotbarIcon: 'assets/icons/images/1momo.jpeg',
        platedIcon: 'assets/icons/images/momoserve.png',
        validToppings: ['green-onion'],
        cookTimeMs: 4000
    },
    'fried-momo': {
        placeholder: { emoji: '🟠', color: '#c87a2a' },
        sprite:     'assets/icons/images/friedmomoo.jpeg',
        hotbarIcon: 'assets/icons/images/1momo.jpeg',
        platedIcon: 'assets/icons/images/friedmomoo.jpeg',
        validToppings: ['green-onion'],
        cookTimeMs: 5000
    },
    'laphing': {
        placeholder:   { emoji: '🫔', color: '#f1c40f' },
        sprite:        'assets/icons/images/laphingbowl.png',
        hotbarIcon:    'assets/icons/images/laphingbowl.png',
        verticalSprite: true,   // 1×2 stacked sprite; top frame = plain bowl
        validToppings: [],
        cookTimeMs: 3500
    },
    'noodles': {
        placeholder: { emoji: '🍜', color: '#e67e22' },
        sprite:     'assets/icons/images/keemanoodleskeema.png',
        hotbarIcon: 'assets/icons/images/keemapacket.png',
        validToppings: [],
        cookTimeMs: 6000
    }
};

export const TOPPING_REGISTRY = {
    'chutney':        { placeholder: { emoji: '🌶️', color: '#a83232' }, sprite: null },
    'sesame':         { placeholder: { emoji: '⚪',  color: '#cfc9a3' }, sprite: null },
    'chilli':         { placeholder: { emoji: '🔥',  color: '#ff4d4d' }, sprite: null },
    'green-onion':    { label: 'Green Onion', placeholder: { emoji: '🌿',  color: '#27ae60' }, sprite: null },
    'chilli-oil':     { placeholder: { emoji: '🍯',  color: '#c0392b' }, sprite: null },
    'extra-sour':     { placeholder: { emoji: '🍋',  color: '#f1c40f' }, sprite: null },
    'soya-sauce':     { label: 'Soya Sauce',   placeholder: { emoji: '🫙',  color: '#2c1a00' }, sprite: null },
    'peanuts':        { label: 'Peanuts',       placeholder: { emoji: '🥜',  color: '#c8922a' }, sprite: null },
    'boiled-noodles': { label: 'Noodles',       placeholder: { emoji: '🍜',  color: '#e67e22' }, sprite: null },
    'keema-chicken':  { label: 'Keema Chicken', placeholder: { emoji: '🍗',  color: '#8B4513' }, sprite: null }
};

// One slot per raw ingredient; Hotbar filters to only show what the current level needs
export const HOTBAR_SLOTS = [
    { ingredient: 'raw-momo',    baseType: 'momo',    hotbarIcon: 'assets/icons/images/1momo.jpeg',                       placeholder: { emoji: '🥟', color: '#d3b89a' } },
    { ingredient: 'raw-laphing', baseType: 'laphing', hotbarIcon: 'assets/icons/images/laphingempty.png',                  placeholder: { emoji: '🫔', color: '#f39c12' } },
    { ingredient: 'raw-noodles', baseType: 'noodles', hotbarIcon: 'assets/icons/images/keemapacket.png',      placeholder: { emoji: '🍜', color: '#d35400' } }
];

export function renderIcon(registryEntry) {
    const src = registryEntry.hotbarIcon || registryEntry.sprite;
    if (src) {
        return `<img src="${src}" class="item-icon food-img" draggable="false" />`;
    }
    return `<div class="item-icon placeholder" style="background:${registryEntry.placeholder.color}">
              ${registryEntry.placeholder.emoji}
            </div>`;
}
