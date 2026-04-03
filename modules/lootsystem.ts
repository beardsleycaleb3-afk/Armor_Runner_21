/**
 * LootSystem: The logic that connects items to the world.
 * Points at: ecs.ts, eventbus.ts, loot.ts
 */

import { world, Entity } from './ecs.js';
import { bus } from './eventbus.js';
import { LOOT_TABLE, Item } from './loot.js';

export class LootSystem {
    /**
     * Trigger a loot drop at a specific coordinate
     */
    spawnDrop(x: number, y: number, rarityMultiplier: number = 1.0) {
        const item = this.rollLoot(rarityMultiplier);
        if (!item) return;

        const dropEntity = world.createEntity();
        
        // Attach components to the new item entity
        world.addComponent(dropEntity, 'position', { x, y });
        world.addComponent(dropEntity, 'itemData', item);
        world.addComponent(dropEntity, 'sprite', 'item_sparkle');
        
        bus.emit('UI_FLOAT_TEXT', { 
            x, 
            y: y - 20, 
            text: `💎 ${item.name}`, 
            color: this.getRarityColor(item.rarity) 
        });
    }

    /**
     * Probability logic for item drops
     */
    private rollLoot(multiplier: number): Item | null {
        const roll = Math.random() * 100 * multiplier;
        const keys = Object.keys(LOOT_TABLE);
        
        // Simple logic: 20% chance to drop anything at base
        if (roll < 80) return null; 

        const randomIndex = Math.floor(Math.random() * keys.length);
        return LOOT_TABLE[keys[randomIndex]];
    }

    private getRarityColor(rarity: string): string {
        switch (rarity) {
            case 'legendary': return '#fca503';
            case 'epic': return '#a335ee';
            case 'rare': return '#0070dd';
            default: return '#ffffff';
        }
    }
}

export const lootSystem = new LootSystem();
