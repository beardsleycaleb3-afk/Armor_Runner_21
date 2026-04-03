/**
 * ECS: The Entity Component System core.
 * Handles entity life cycles and component storage.
 * This is a foundational "lone" module.
 */

export type Entity = number;

export class ECS {
    private nextEntityId: Entity = 0;
    private entities: Set<Entity> = new Set();
    private components: Map<string, Map<Entity, any>> = new Map();

    /**
     * Create a new unique entity ID
     */
    createEntity(): Entity {
        const entity = this.nextEntityId++;
        this.entities.add(entity);
        return entity;
    }

    /**
     * Remove an entity and all its associated data
     */
    removeEntity(entity: Entity): void {
        this.entities.delete(entity);
        for (const componentMap of this.components.values()) {
            componentMap.delete(entity);
        }
    }

    /**
     * Attach a component (data) to an entity
     */
    addComponent<T>(entity: Entity, name: string, data: T): void {
        if (!this.components.has(name)) {
            this.components.set(name, new Map());
        }
        this.components.get(name)!.set(entity, data);
    }

    /**
     * Get a specific component from an entity
     */
    getComponent<T>(entity: Entity, name: string): T | undefined {
        const componentMap = this.components.get(name);
        return componentMap ? componentMap.get(entity) as T : undefined;
    }

    /**
     * Get all entities that possess a specific set of components
     */
    getEntitiesWith(names: string[]): Entity[] {
        return Array.from(this.entities).filter(entity => 
            names.every(name => this.components.get(name)?.has(entity))
        );
    }
}

export const world = new ECS();
