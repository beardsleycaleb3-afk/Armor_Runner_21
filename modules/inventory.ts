/**
 * Inventory: Manages player items and power-ups.
 * Points at: ecs.ts, stats.ts, loot.ts, eventbus.ts
 */

import { world, Entity } from './ecs.js';
import { bus } from './eventbus.js';
import { Item } from './loot.js';
import { stats, EntityStats } from './stats.js';

export class Inventory {
    private items: Item[] = [];
    private maxSlots: number = 10;

    /**
     * Add an item to the player's inventory
     */
    addItem(entity: Entity, item: Item) {
        if (this.items.length >= this.maxSlots) {
            bus.emit('UI_FLOAT_TEXT', { x: 150, y: 100, text: 'FULL! 🎒', color: '#ff0000' });
            return;
        }

        this.items.push(item);
        
        // If it's a gear item, apply the stat bonus immediately
        if (item.type === 'gear' && item.bonus) {
            const playerStats = world.getComponent<EntityStats>(entity, 'stats');
            if (playerStats) {
                (playerStats as any)[item.bonus.stat] += item.bonus.value;
                bus.emit('UI_FLOAT_TEXT', { 
                    x: 150, 
                    y: 80, 
                    text: `UPGRADE: ${item.bonus.stat} 🔥`, 
                    color: '#00ff00' 
                });
            }
        }

        bus.emit('UI_INVENTORY_UPDATED', this.items);
    }

    /**
     * Use a power-up (Consumable)
     */
    usePowerUp(entity: Entity, itemId: string) {
        const index = this.items.findIndex(i => i.id === itemId);
        if (index > -1) {
            const item = this.items[index];
            if (item.type === 'consumable') {
                // Logic for ⚡ or 💥 effects would go here
                this.items.splice(index, 1);
                bus.emit('UI_FLOAT_TEXT', { x: 150, y: 150, text: 'POWER UP! ⚡', color: '#ffff00' });
            }
        }
    }

    getItems() {
        return this.items;
    }
}

export const inventory = new Inventory();
