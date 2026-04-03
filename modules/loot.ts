/**
 * Loot: The Item Definition Library.
 * Contains static data for gear and collectibles.
 * This is a foundational "lone" data file.
 */

export interface Item {
    id: string;
    name: string;
    type: 'gear' | 'consumable' | 'material';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    description: string;
    bonus?: {
        stat: 'strength' | 'agility' | 'speed' | 'maxHp';
        value: number;
    };
}

export const LOOT_TABLE: Record<string, Item> = {
    'old_jersey': {
        id: 'old_jersey',
        name: 'Old Jersey',
        type: 'gear',
        rarity: 'common',
        description: 'Smells like high school. +1 Max HP.',
        bonus: { stat: 'maxHp', value: 1 }
    },
    'weighted_cleats': {
        id: 'weighted_cleats',
        name: 'Weighted Cleats',
        type: 'gear',
        rarity: 'rare',
        description: 'Heavy but stable. +2 Strength.',
        bonus: { stat: 'strength', value: 2 }
    },
    'energy_drink': {
        id: 'energy_drink',
        name: 'Sultan Fuel',
        type: 'consumable',
        rarity: 'common',
        description: 'Temporary speed burst.',
        bonus: { stat: 'speed', value: 0.5 }
    },
    'gold_nugget': {
        id: 'gold_nugget',
        name: 'Raw Gold',
        type: 'material',
        rarity: 'epic',
        description: 'Shiny and heavy. Can be refined.'
    }
};

/**
 * Get item by ID
 */
export function getItem(id: string): Item | undefined {
    return LOOT_TABLE[id];
}
