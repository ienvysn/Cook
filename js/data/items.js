export const ITEM_REGISTRY = {
    'momo': {
        placeholder: { emoji: '🥟', color: '#e8c87a' },
        sprite: null,
        validToppings: ['chutney', 'sesame', 'chilli'],
        cookTimeMs: 4000 // 4 seconds for steamer
    },
    'noodles': {
        placeholder: { emoji: '🍜', color: '#e67e22' },
        sprite: null,
        validToppings: ['chilli'],
        cookTimeMs: 5000 // 5 seconds for fry pan
    },
    'laphing': {
        placeholder: { emoji: '🫔', color: '#f1c40f' },
        sprite: null,
        validToppings: ['chilli'],
        cookTimeMs: 3000 // 3 seconds for laphing tray
    }
};

export const HOTBAR_SLOTS = [
    { ingredient: 'raw-momo', baseType: 'momo', placeholder: { emoji: '🟤', color: '#d3b89a' } },
    { ingredient: 'raw-noodles', baseType: 'noodles', placeholder: { emoji: '🍝', color: '#d35400' } },
    { ingredient: 'raw-laphing', baseType: 'laphing', placeholder: { emoji: '🟨', color: '#f39c12' } }
];

export function renderIcon(registryEntry) {
    if (registryEntry.sprite) {
        return `<img src="${registryEntry.sprite}" class="item-icon" draggable="false" />`;
    }
    return `<div class="item-icon placeholder" style="background:${registryEntry.placeholder.color}">
              ${registryEntry.placeholder.emoji}
            </div>`;
}
