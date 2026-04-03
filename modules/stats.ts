/**
 * Stats: The RPG Data Structure.
 * Handles leveling logic, HP, and XP.
 * This is a foundational "lone" record.
 */

export interface EntityStats {
    level: number;
    hp: number;
    maxHp: number;
    xp: number;
    nextLevelXp: number;
    speed: number;
    strength: number; // For stiff-arm power
    agility: number;   // For lateral movement
}

export class StatsManager {
    /**
     * Initialize base stats for a new player/entity
     */
    createBaseStats(): EntityStats {
        return {
            level: 1,
            hp: 3,
            maxHp: 3,
            xp: 0,
            nextLevelXp: 100,
            speed: 2.0,
            strength: 10,
            agility: 10
        };
    }

    /**
     * Calculate XP gain and handle leveling
     * returns true if a level-up occurred
     */
    addXp(stats: EntityStats, amount: number): boolean {
        stats.xp += amount;
        if (stats.xp >= stats.nextLevelXp) {
            this.levelUp(stats);
            return true;
        }
        return false;
    }

    /**
     * RPG Level Up Logic
     * Increases stats based on level
     */
    private levelUp(stats: EntityStats) {
        stats.level++;
        stats.xp = 0;
        stats.nextLevelXp = Math.floor(stats.nextLevelXp * 1.5);
        
        // Geometric Growth
        stats.maxHp += 1;
        stats.hp = stats.maxHp;
        stats.strength += 2;
        stats.agility += 2;
    }

    /**
     * Apply damage to HP
     * returns true if entity is "tackled" (0 HP)
     */
    takeDamage(stats: EntityStats, amount: number): boolean {
        stats.hp = Math.max(0, stats.hp - amount);
        return stats.hp <= 0;
    }
}

export const stats = new StatsManager();
