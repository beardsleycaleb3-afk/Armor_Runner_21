/**
 * WorldObjects: Logic for Crates and Lane Locks.
 * Handles the behavior of static/interactive assets.
 * Points at: ecs.ts, eventbus.ts
 */

import { world, Entity } from './ecs.js';
import { bus } from './eventbus.js';

export enum ObjectType {
    CRATE = '📦',      // Wooden Crate asset
    LANE_LOCK = '💎',  // Blue Crystal Cube asset
    TROPHY = '🏆'      // Star Trophy asset
}

export class WorldObjects {
    /**
     * Create a breakable crate
     */
    spawnCrate(x: number, y: number) {
        const crate = world.createEntity();
        world.addComponent(crate, 'position', { x, y });
        world.addComponent(crate, 'type', ObjectType.CRATE);
        world.addComponent(crate, 'health', 1); // One hit to break
        world.addComponent(crate, 'collision', { width: 32, height: 32 });
    }

    /**
     * Create a Lane Lock (Crystal)
     */
    spawnLaneLock(x: number, y: number) {
        const lock = world.createEntity();
        world.addComponent(lock, 'position', { x, y });
        world.addComponent(lock, 'type', ObjectType.LANE_LOCK);
        world.addComponent(lock, 'power', 'INVINCIBLE_GHOST'); // 👻 effect
        world.addComponent(lock, 'collision', { width: 32, height: 32 });
    }

    /**
     * Handle the interaction logic
     */
    onInteract(entity: Entity, interactType: string) {
        if (interactType === ObjectType.CRATE) {
            bus.emit('UI_SHAKE', 5);
            bus.emit('UI_FLOAT_TEXT', { x: 150, y: 150, text: 'CRATE BROKE! 🏈💥', color: '#8B4513' });
            world.removeEntity(entity);
        }

        if (interactType === ObjectType.LANE_LOCK) {
            bus.emit('UI_FLOAT_TEXT', { x: 150, y: 150, text: 'LANE LOCKED! ⚡🔥', color: '#00FFFF' });
            // Logic for ghost/lane lock would be triggered here
            world.removeEntity(entity);
        }
    }
}

export const worldObjects = new WorldObjects();
