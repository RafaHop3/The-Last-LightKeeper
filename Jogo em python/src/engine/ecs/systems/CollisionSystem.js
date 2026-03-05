/**
 * THE LAST LIGHTKEEPER - Collision System
 * ECS system for spatial collision detection using QuadTree
 * Broad Phase (QuadTree) + Narrow Phase (circle-circle collision)
 */

import { QuadTree } from '../../math/QuadTree.js';
import { GAME_CONFIG } from '../../../game/config/constants.js';

export class CollisionSystem {
    constructor(entityManager, boundsWidth = GAME_CONFIG.width, boundsHeight = GAME_CONFIG.height, bulletPool = null, enemyPool = null, orbPool = null, gameState = null) {
        this.em = entityManager;
        this.bounds = { x: 0, y: 0, width: boundsWidth, height: boundsHeight };
        this.quadTree = new QuadTree(this.bounds);
        this.collisionEvents = [];
        this.bulletPool = bulletPool;
        this.enemyPool = enemyPool;
        this.orbPool = orbPool;
        this.gameState = gameState;
    }

    /**
     * Main update loop - performs collision detection
     * O(n log n) performance with QuadTree spatial partitioning
     */
    update() {
        // 1. Clear previous frame's tree and events
        this.quadTree.clear();
        this.collisionEvents.length = 0;

        // 2. Get all collidable entities (Position + Renderable/Collider)
        const collidables = this.em.getEntitiesWith(['Position', 'Collider']);
        const collidableData = [];

        // 3. Build data for QuadTree insertion
        for (const entity of collidables) {
            const pos = this.em.getComponent(entity, 'Position');
            const collider = this.em.getComponent(entity, 'Collider');
            const renderable = this.em.getComponent(entity, 'Renderable');

            if (!pos || !collider) continue;

            const radius = collider.radius || renderable?.radius || 10;

            const rect = {
                id: entity, // Reference crucial to know WHO collided
                x: pos.x - radius,
                y: pos.y - radius,
                width: radius * 2,
                height: radius * 2,
                radius: radius,
                cx: pos.x,
                cy: pos.y,
                layer: collider.layer || 'default'
            };

            collidableData.push(rect);
            this.quadTree.insert(rect);
        }

        // 4. Check Collisions (O(n log n) with QuadTree)
        for (let i = 0; i < collidableData.length; i++) {
            const objA = collidableData[i];

            // Get only objects in same region from QuadTree
            const candidates = [];
            this.quadTree.retrieve(candidates, objA);

            for (let j = 0; j < candidates.length; j++) {
                const objB = candidates[j];

                // Avoid self-collision and duplicate checks
                if (objA.id >= objB.id) continue;

                // Skip if same layer and layer-specific collision is not desired
                if (objA.layer === objB.layer && objA.layer !== 'default') continue;

                // Narrow Phase: Precise circular collision check
                const dx = objA.cx - objB.cx;
                const dy = objA.cy - objB.cy;
                const distanceSq = (dx * dx) + (dy * dy);
                const radiiSum = objA.radius + objB.radius;

                // PERFORMANCE OPTIMIZATION: Avoid Math.sqrt() using squared distance
                // Only calculate sqrt if collision actually occurred
                if (distanceSq < (radiiSum * radiiSum)) {
                    this.resolveCollision(objA, objB, dx, dy, distanceSq, radiiSum);
                }
            }
        }

        // 5. Process collision events
        this.processCollisionEvents();
    }

    /**
     * Resolve collision between two objects
     * Basic physics resolution - prevents continuous overlap
     */
    resolveCollision(objA, objB, dx, dy, distanceSq, radiiSum) {
        const distance = Math.sqrt(distanceSq) || 1; // Fallback if distance is 0
        const overlap = radiiSum - distance;

        // Normalized separation vector
        const nx = dx / distance;
        const ny = dy / distance;

        // Get actual positions from EntityManager to correct overlap
        const posA = this.em.getComponent(objA.id, 'Position');
        const posB = this.em.getComponent(objB.id, 'Position');

        // Move each entity half the overlap distance (assuming equal mass)
        // If one is static (e.g., wall), logic would change
        if (posA) {
            posA.x += nx * (overlap / 2);
            posA.y += ny * (overlap / 2);
        }
        if (posB) {
            posB.x -= nx * (overlap / 2);
            posB.y -= ny * (overlap / 2);
        }

        // Store collision event for processing
        this.collisionEvents.push({
            entityA: objA.id,
            entityB: objB.id,
            normal: { x: nx, y: ny },
            overlap: overlap,
            layerA: objA.layer,
            layerB: objB.layer
        });
    }

    /**
     * Process collision events (damage, sounds, etc.)
     */
    processCollisionEvents() {
        for (const event of this.collisionEvents) {
            // Player-Enemy collision
            if (this.isPlayerEnemyCollision(event)) {
                this.handlePlayerEnemyCollision(event);
            }

            // Player-Orb collision
            else if (this.isPlayerOrbCollision(event)) {
                this.handlePlayerOrbCollision(event);
            }

            // Bullet-Enemy collision
            else if (this.isBulletEnemyCollision(event)) {
                this.handleBulletEnemyCollision(event);
            }

            // Generic collision event
            else {
                this.handleGenericCollision(event);
            }
        }
    }

    /**
     * Collision type detection helpers
     */
    isPlayerEnemyCollision(event) {
        return (event.layerA === 'player' && event.layerB === 'enemy') ||
            (event.layerA === 'enemy' && event.layerB === 'player');
    }

    isPlayerOrbCollision(event) {
        return (event.layerA === 'player' && event.layerB === 'orb') ||
            (event.layerA === 'orb' && event.layerB === 'player');
    }

    isBulletEnemyCollision(event) {
        return (event.layerA === 'bullet' && event.layerB === 'enemy') ||
            (event.layerA === 'enemy' && event.layerB === 'bullet');
    }

    /**
     * Collision handlers
     */
    handlePlayerEnemyCollision(event) {
        // Apply damage to player
        const playerHealth = this.em.getComponent(
            event.layerA === 'player' ? event.entityA : event.entityB,
            'Health'
        );

        if (playerHealth) {
            const enemy = this.em.getComponent(
                event.layerA === 'enemy' ? event.entityA : event.entityB,
                'Enemy'
            );

            if (enemy) {
                playerHealth.current -= enemy.damage;
                // Add screen shake effect
                this.em.addComponent(event.entityA, 'ScreenShake', { intensity: 3, duration: 0.3 });
            }
        }
    }

    handlePlayerOrbCollision(event) {
        // Collect orb
        const orbEntity = event.layerA === 'orb' ? event.entityA : event.entityB;
        const orb = this.em.getComponent(orbEntity, 'Orb');

        if (orb && !this.em.getComponent(orbEntity, 'Inactive')) {
            // Award score for orb collection
            if (this.gameState) {
                this.gameState.addScore(50);
            }

            // Return orb to pool instead of permanently destroying it
            if (this.orbPool && this.orbPool.activeEntities.has(orbEntity)) {
                this.orbPool.release(orbEntity);
            } else {
                this.em.removeEntity(orbEntity);
            }
        }
    }

    handleBulletEnemyCollision(event) {
        const bulletEntity = event.layerA === 'bullet' ? event.entityA : event.entityB;
        const enemyEntity = event.layerA === 'enemy' ? event.entityA : event.entityB;

        // Damage enemy first
        const enemyHealth = this.em.getComponent(enemyEntity, 'Health');
        if (enemyHealth) {
            const bulletComp = this.em.getComponent(bulletEntity, 'Bullet');
            const dmg = bulletComp?.maxLife ? 34 : 34;
            enemyHealth.current -= dmg;

            // Return enemy to pool if dead
            if (enemyHealth.current <= 0) {
                // Award score for enemy kill
                if (this.gameState) {
                    this.gameState.addScore(100);
                }

                if (this.enemyPool) {
                    this.enemyPool.release(enemyEntity);
                } else {
                    this.em.removeEntity(enemyEntity);
                }
            }
        }

        // Return bullet to pool (always, regardless of enemy status)
        if (this.bulletPool && this.bulletPool.activeEntities.has(bulletEntity)) {
            this.bulletPool.release(bulletEntity);
        } else if (!this.bulletPool) {
            this.em.removeEntity(bulletEntity);
        }
    }

    handleGenericCollision(event) {
        // Add generic collision component for systems to handle
        this.em.addComponent(event.entityA, 'CollisionEvent', {
            with: event.entityB,
            normal: event.normal
        });
    }

    /**
     * Get collision events from last frame
     */
    getCollisionEvents() {
        return [...this.collisionEvents];
    }

    /**
     * Set new bounds for the QuadTree
     */
    setBounds(x, y, width, height) {
        this.bounds = { x, y, width, height };
        this.quadTree = new QuadTree(this.bounds);
    }

    /**
     * Get QuadTree statistics for debugging
     */
    getStats() {
        return this.quadTree.getStats();
    }

    /**
     * Visualize QuadTree structure (debug)
     */
    visualize() {
        console.log('QuadTree Structure:');
        this.quadTree.visualize();
    }
}
