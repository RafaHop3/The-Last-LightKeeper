/**
 * THE LAST LIGHTKEEPER - Entity Manager
 * Core ECS system for entity and component management
 */

export class EntityManager {
    constructor() {
        this.nextId = 0;
        this.entities = new Map();
        this.components = new Map();
    }

    createEntity() {
        const id = this.nextId++;
        this.entities.set(id, new Set());
        return id;
    }

    addComponent(entityId, componentType, data) {
        if (!this.components.has(componentType)) {
            this.components.set(componentType, new Map());
        }
        this.components.get(componentType).set(entityId, data);
        this.entities.get(entityId).add(componentType);
    }

    getComponent(entityId, componentType) {
        const componentMap = this.components.get(componentType);
        return componentMap ? componentMap.get(entityId) : null;
    }

    hasComponent(entityId, componentType) {
        const entityComponents = this.entities.get(entityId);
        return entityComponents ? entityComponents.has(componentType) : false;
    }

    removeComponent(entityId, componentType) {
        const componentMap = this.components.get(componentType);
        if (componentMap) {
            componentMap.delete(entityId);
        }
        const entityComponents = this.entities.get(entityId);
        if (entityComponents) {
            entityComponents.delete(componentType);
        }
    }

    removeEntity(entityId) {
        const components = this.entities.get(entityId);
        if (components) {
            components.forEach(type => {
                this.components.get(type).delete(entityId);
            });
            this.entities.delete(entityId);
        }
    }

    getEntitiesWith(...args) {
        // Support both getEntitiesWith('A','B') and getEntitiesWith(['A','B'])
        const componentTypes = Array.isArray(args[0]) ? args[0] : args;
        const result = [];
        for (const [entityId, components] of this.entities) {
            // Skip inactive entities (pool-managed)
            if (components.has('Inactive')) continue;
            if (componentTypes.every(type => components.has(type))) {
                result.push(entityId);
            }
        }
        return result;
    }

    // Version that includes inactive entities (for pool management)
    getEntitiesWithIncludeInactive(...args) {
        const componentTypes = Array.isArray(args[0]) ? args[0] : args;
        const result = [];
        for (const [entityId, components] of this.entities) {
            if (componentTypes.every(type => components.has(type))) {
                result.push(entityId);
            }
        }
        return result;
    }

    getAllEntities() {
        return Array.from(this.entities.keys());
    }

    clear() {
        this.entities.clear();
        this.components.clear();
        this.nextId = 0;
    }

    getEntityCount() {
        return this.entities.size;
    }

    getComponentCount(componentType) {
        const componentMap = this.components.get(componentType);
        return componentMap ? componentMap.size : 0;
    }
}
