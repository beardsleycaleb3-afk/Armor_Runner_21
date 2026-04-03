/**
 * Movement: Standard Lane-Based Physics.
 * Handles 5-lane switching and forward velocity.
 * Points at: ecs.ts, map.ts
 */

import { world, Entity } from './ecs.js';
import { gameMap } from './map.js';

export class MovementSystem {
    private playerLane: number = 2; // Start in middle lane (0, 1, 2, 3, 4)
    private targetX: number = 0;
    private currentX: number = 0;
    private transitionSpeed: number = 15; // Speed of lateral lane switching

    constructor() {
        this.targetX = gameMap.getLaneX(this.playerLane);
        this.currentX = this.targetX;
    }

    /**
     * Handle Input to change lanes
     */
    moveLeft() {
        if (this.playerLane > 0) {
            this.playerLane--;
            this.targetX = gameMap.getLaneX(this.playerLane);
        }
    }

    moveRight() {
        if (this.playerLane < gameMap.LANES - 1) {
            this.playerLane++;
            this.targetX = gameMap.getLaneX(this.playerLane);
        }
    }

    /**
     * Update the player's actual X position based on target lane
     */
    update(playerEntity: Entity, dt: number) {
        const pos = world.getComponent<{x: number, y: number}>(playerEntity, 'position');
        
        if (pos) {
            // Standard Linear Interpolation (Lerp) for smooth sliding
            const diff = this.targetX - this.currentX;
            this.currentX += diff * this.transitionSpeed * dt;
            
            // Update the ECS component
            pos.x = this.currentX;
        }
    }

    getLane() {
        return this.playerLane;
    }
}

export const movement = new MovementSystem();
