/**
 * Combat & Collision: Standard Box-to-Box Detection.
 * Points at: ecs.ts, eventbus.ts, worldobjects.ts
 */

import { world, Entity } from './ecs.js';
import { bus } from './eventbus.js';
import { worldObjects } from './worldobjects.js';

export interface Hitbox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class CombatSystem {
    /**
     * Standard Rectangle Intersection Check
     */
    checkCollision(a: Hitbox, b: Hitbox): boolean {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    /**
     * Scan the world for collisions between the player and other entities
     */
    update(playerEntity: Entity) {
        const playerPos = world.getComponent<{x: number, y: number}>(playerEntity, 'position');
        const playerBox = { x: playerPos!.x, y: playerPos!.y, width: 30, height: 30 };

        // Get all interactive entities (Crates, Defenders, Items)
        const targets = world.getEntitiesWith(['position', 'type']);

        for (const target of targets) {
            if (target === playerEntity) continue;

            const tPos = world.getComponent<{x: number, y: number}>(target, 'position');
            const tType = world.getComponent<string>(target, 'type');
            const tBox = { x: tPos!.x, y: tPos!.y, width: 32, height: 32 };

            if (this.checkCollision(playerBox, tBox)) {
                this.handleImpact(target, tType!);
            }
        }
    }

    private handleImpact(target: Entity, type: string) {
        // Use the existing worldObjects logic for Crates/Locks
        worldObjects.onInteract(target, type);

        // Standard Defender Logic
        if (type === 'DEFENDER') {
            bus.emit('UI_SHAKE', 15);
            bus.emit('UI_FLOAT_TEXT', { x: 150, y: 150, text: 'TACKLED! 🏈💥', color: '#ff0000' });
            // Here you would trigger standard damage in stats.ts
        }
    }
}

export const combat = new CombatSystem();
