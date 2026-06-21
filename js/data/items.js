export const ITEM_REGISTRY = {
    'momo': {
        placeholder: { emoji: '🥟', color: '#e8c87a' },
        sprite: null,
        validToppings: ['chutney', 'sesame', 'chilli'],
        cookTimeMs: 4000 // 4 seconds for steamer
    }
};

export const HOTBAR_SLOTS = [
    { ingredient: 'raw-momo', baseType: 'momo', placeholder: { emoji: '🟤', color: '#d3b89a' } }
];

export function renderIcon(registryEntry) {
    if (registryEntry.sprite) {
        return `<img src="${registryEntry.sprite}" class="item-icon" draggable="false" />`;
    }
    return `<div class="item-icon placeholder" style="background:${registryEntry.placeholder.color}">
              ${registryEntry.placeholder.emoji}
            </div>`;
}
