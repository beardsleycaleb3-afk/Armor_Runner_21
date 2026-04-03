/**
 * Map: 5-Lane Field Logic.
 * 3 tiles = 1 yard. 330 tiles = 1 Level Loop.
 * Player size: 0.5 tile.
 */

import { bus } from './eventbus.js';

export class GameMap {
    // 5 lanes: index 0, 1, 2, 3, 4
    public readonly LANES = 5;
    public readonly TILE_SIZE = 60; // Based on 300px width / 5 lanes
    public readonly LEVEL_LENGTH_TILES = 330;
    public readonly TILES_PER_YARD = 3;

    private scrollProgress: number = 0; // In tiles
    private currentLevel: number = 1;

    /**
     * Convert lane index to X coordinate (0.5 offset for player centering)
     */
    getLaneX(laneIndex: number): number {
        return laneIndex * this.TILE_SIZE + (this.TILE_SIZE * 0.25);
    }

    /**
     * Update scrolling and yardage tracking
     */
    update(speed: number, dt: number) {
        this.scrollProgress += speed * dt;

        // Calculate Yardage (Total tiles / 3)
        const totalYards = Math.floor(this.scrollProgress / this.TILES_PER_YARD);
        
        // Loop Level at 330 tiles
        if (this.scrollProgress >= this.LEVEL_LENGTH_TILES) {
            this.scrollProgress = 0;
            this.currentLevel++;
            bus.emit('UI_FLOAT_TEXT', { x: 150, y: 100, text: `LEVEL ${this.currentLevel} 🏈`, color: '#ffff00' });
        }

        bus.emit('MAP_UPDATE', {
            progress: this.scrollProgress,
            yards: totalYards,
            level: this.currentLevel
        });
    }

    /**
     * Get the current grass tile index (0-8) based on scroll
     * Points at: assets/grass/grass[0-8].png
     */
    getTileAt(row: number): number {
        // Logic to cycle grass assets 0-8 based on your folder structure
        return (Math.floor(this.scrollProgress) + row) % 9;
    }
}

export const gameMap = new GameMap();
