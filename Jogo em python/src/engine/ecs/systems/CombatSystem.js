/**
 * THE LAST LIGHTKEEPER - Combat System
 * ECS system for damage application and combat resolution
 * Handles bullet impacts, damage calculation, and death mechanics
 */

export class CombatSystem {
    constructor(entityManager, quadTree, enemyPool, bulletPool, particleSystem) {
        this.em = entityManager;
        this.quadTree = quadTree; // Reuse spatial partitioning structure
        this.enemyPool = enemyPool;
        this.bulletPool = bulletPool;
        this.particleSystem = particleSystem;

        this.combatEvents = [];
        this.performanceMetrics = {
            bulletsProcessed: 0,
            damageDealt: 0,
            enemiesKilled: 0,
            friendlyFireIncidents: 0
        };

        this.damageMultipliers = {
            'headshot': 2.0,
            'critical': 1.5,
            'weak_point': 3.0
        };
    }

    /**
     * Main combat update loop
     * Processes bullet impacts and applies damage
     */
    update(dt = 0.016) {
        // Reset metrics
        this.performanceMetrics.bulletsProcessed = 0;
        this.combatEvents.length = 0;

        // --- HitFlash: process frame-synced color restore (replaces setTimeout) ---
        const flashing = this.em.getEntitiesWith(['HitFlash', 'Renderable']);
        for (const id of flashing) {
            const flash = this.em.getComponent(id, 'HitFlash');
            flash.timer -= dt;
            if (flash.timer <= 0) {
                const r = this.em.getComponent(id, 'Renderable');
                if (r && r.originalColor) r.color = r.originalColor;
                this.em.removeComponent(id, 'HitFlash');
            }
        }

        // Get all active bullets and vulnerable entities
        const bullets = this.em.getEntitiesWith(['Damage', 'Position', 'Renderable']);
        const vulnerableEntities = this.em.getEntitiesWith(['Health', 'Position', 'Renderable']);

        // Build QuadTree mapping for vulnerable entities (Broad Phase)
        this.#buildVulnerableQuadTree(vulnerableEntities);

        // Process each bullet
        for (const bullet of bullets) {
            if (this.em.getComponent(bullet, 'Inactive')) continue;

            this.performanceMetrics.bulletsProcessed++;
            this.#processBullet(bullet);
        }

        // Process combat events
        this.#processCombatEvents();
    }

    /**
     * Build QuadTree with vulnerable entities for spatial queries
     * @param {Array} vulnerableEntities - Array of vulnerable entity IDs
     */
    #buildVulnerableQuadTree(vulnerableEntities) {
        // Clear and rebuild QuadTree
        this.quadTree.clear();

        for (const entity of vulnerableEntities) {
            if (this.em.getComponent(entity, 'Inactive')) continue;

            const pos = this.em.getComponent(entity, 'Position');
            const render = this.em.getComponent(entity, 'Renderable');
            const health = this.em.getComponent(entity, 'Health');

            if (!pos || !render || !health) continue;

            const entityRect = {
                id: entity,
                x: pos.x - render.radius,
                y: pos.y - render.radius,
                width: render.radius * 2,
                height: render.radius * 2,
                cx: pos.x,
                cy: pos.y,
                radius: render.radius,
                health: health.current,
                maxHealth: health.max,
                team: this.#getEntityTeam(entity)
            };

            this.quadTree.insert(entityRect);
        }
    }

    /**
     * Process individual bullet collision and damage
     * @param {number} bullet - Bullet entity ID
     */
    #processBullet(bullet) {
        const bPos = this.em.getComponent(bullet, 'Position');
        const bRend = this.em.getComponent(bullet, 'Renderable');
        const bDamage = this.em.getComponent(bullet, 'Damage');
        const bBullet = this.em.getComponent(bullet, 'Bullet');

        if (!bPos || !bRend || !bDamage) return;
        // bBullet may be null if component wasn't attached yet
        const penetration = bBullet ? (bBullet.penetration || 1) : 1;

        const bulletRect = {
            id: bullet,
            x: bPos.x - bRend.radius,
            y: bPos.y - bRend.radius,
            width: bRend.radius * 2,
            height: bRend.radius * 2,
            cx: bPos.x,
            cy: bPos.y,
            radius: bRend.radius,
            damage: bDamage.amount,
            owner: bDamage.owner,
            penetration: penetration,
            team: this.#getEntityTeam(bDamage.owner)
        };

        // Query QuadTree for nearby targets (Broad Phase)
        const candidates = [];
        this.quadTree.retrieve(candidates, bulletRect);

        // Check collisions with candidates (Narrow Phase)
        let hitCount = 0;
        for (const target of candidates) {
            // Skip self-hits and team hits
            if (target.id === bulletRect.owner || target.team === bulletRect.team) continue;
            if (this.em.getComponent(target.id, 'Inactive')) continue;

            // Narrow Phase: Circular collision detection
            const dx = bulletRect.cx - target.cx;
            const dy = bulletRect.cy - target.cy;
            const distanceSq = (dx * dx) + (dy * dy);
            const radiiSum = bulletRect.radius + target.radius;

            if (distanceSq < (radiiSum * radiiSum)) {
                // Calculate damage with multipliers
                const damage = this.#calculateDamage(bulletRect, target, dx, dy);

                // Apply damage
                this.#applyDamage(target.id, damage, bulletRect.owner);

                // Create impact effects
                this.#createImpactEffects(target.cx, target.cy, damage, target.team);

                // Record combat event
                this.combatEvents.push({
                    type: 'hit',
                    attacker: bulletRect.owner,
                    target: target.id,
                    damage: damage,
                    position: { x: target.cx, y: target.cy }
                });

                hitCount++;

                // Check bullet penetration
                if (hitCount >= bulletRect.penetration) {
                    this.bulletPool.release(bullet);
                    break; // Bullet exhausted
                }
            }
        }
    }

    /**
     * Calculate damage with multipliers and critical hits
     * @param {Object} bullet - Bullet data
     * @param {Object} target - Target data
     * @param {number} dx - Delta X
     * @param {number} dy - Delta Y
     * @returns {number} - Final damage amount
     */
    #calculateDamage(bullet, target, dx, dy) {
        let damage = bullet.damage;

        // Check for critical hit (random chance)
        if (Math.random() < 0.1) { // 10% critical chance
            damage *= this.damageMultipliers.critical;
        }

        // Check for weak point hits (based on hit location)
        const hitAngle = Math.atan2(dy, dx);
        if (this.#isWeakPointHit(target.team, hitAngle)) {
            damage *= this.damageMultipliers.weak_point;
        }

        // Apply damage reduction based on target type
        const reduction = this.#getDamageReduction(target.team);
        damage *= (1 - reduction);

        return Math.round(damage);
    }

    /**
     * Check if hit is on weak point
     * @param {string} team - Target team
     * @param {number} hitAngle - Hit angle in radians
     * @returns {boolean} - True if weak point hit
     */
    #isWeakPointHit(team, hitAngle) {
        // Different enemy types have different weak points
        switch (team) {
            case 'enemy':
                // Head area (top hemisphere)
                return Math.sin(hitAngle) < -0.5;
            default:
                return false;
        }
    }

    /**
     * Get damage reduction for entity type
     * @param {string} team - Entity team
     * @returns {number} - Damage reduction (0-1)
     */
    #getDamageReduction(team) {
        switch (team) {
            case 'enemy':
                return 0.1; // 10% damage reduction
            case 'player':
                return 0.0; // No reduction
            default:
                return 0.0;
        }
    }

    /**
     * Apply damage to entity
     * @param {number} entityId - Target entity ID
     * @param {number} amount - Damage amount
     * @param {number} attacker - Attacker entity ID
     */
    #applyDamage(entityId, amount, attacker) {
        const health = this.em.getComponent(entityId, 'Health');
        if (!health) return;

        health.current = Math.max(0, health.current - amount);
        this.performanceMetrics.damageDealt += amount;

        // Visual feedback - hit flash
        this.#applyHitFlash(entityId);

        // Screen shake for significant damage
        if (amount > 20) {
            this.em.addComponent(entityId, 'ScreenShake', {
                intensity: Math.min(5, amount / 10),
                duration: 0.2
            });
        }

        // Check for death
        if (health.current <= 0) {
            this.#handleDeath(entityId, attacker);
        }
    }

    /**
     * Apply visual hit flash effect
     * @param {number} entityId - Entity ID
     */
    #applyHitFlash(entityId) {
        const render = this.em.getComponent(entityId, 'Renderable');
        if (!render) return;

        // Store original color
        if (!render.originalColor) {
            render.originalColor = render.color;
        }

        // Flash white — restored by HitFlash component in update() (frame-synced, pool-safe)
        render.color = '#ffffff';
        this.em.addComponent(entityId, 'HitFlash', { timer: 0.1 });
    }

    /**
     * Handle entity death
     * @param {number} entityId - Dead entity ID
     * @param {number} killer - Killer entity ID
     */
    #handleDeath(entityId, killer) {
        // Check if player died
        if (this.em.hasComponent(entityId, 'PlayerControlled')) {
            this.#handlePlayerDeath(entityId, killer);
            return;
        }

        // Check if enemy died
        if (this.em.hasComponent(entityId, 'EnemyAI')) {
            this.#handleEnemyDeath(entityId, killer);
            return;
        }

        // Generic death handling
        this.em.addComponent(entityId, 'Dead', {});
    }

    /**
     * Handle player death
     * @param {number} playerId - Player entity ID
     * @param {number} killer - Killer entity ID
     */
    #handlePlayerDeath(playerId, killer) {
        // Add death component for GameState to process
        this.em.addComponent(playerId, 'Dead', { killer: killer });

        // Create death effects
        const pos = this.em.getComponent(playerId, 'Position');
        if (pos) {
            this.#createDeathEffects(pos.x, pos.y, 'player');
        }

        console.log(`[Combat] Player killed by entity ${killer}`);
    }

    /**
     * Handle enemy death
     * @param {number} enemyId - Enemy entity ID
     * @param {number} killer - Killer entity ID
     */
    #handleEnemyDeath(enemyId, killer) {
        // Get enemy position for effects
        const pos = this.em.getComponent(enemyId, 'Position');
        if (pos) {
            this.#createDeathEffects(pos.x, pos.y, 'enemy');
        }

        // Get enemy type for scoring
        const enemy = this.em.getComponent(enemyId, 'EnemyAI');
        const enemyType = enemy ? enemy.type : 'default';

        // Return to pool
        this.enemyPool.release(enemyId);
        this.performanceMetrics.enemiesKilled++;

        // Record combat event
        this.combatEvents.push({
            type: 'kill',
            killer: killer,
            victim: enemyId,
            enemyType: enemyType,
            position: pos ? { x: pos.x, y: pos.y } : null
        });

        console.log(`[Combat] Enemy ${enemyType} killed by entity ${killer}`);
    }

    /**
     * Create impact visual effects
     * @param {number} x - Impact X position
     * @param {number} y - Impact Y position
     * @param {number} damage - Damage amount
     * @param {string} team - Target team
     */
    #createImpactEffects(x, y, damage, team) {
        if (!this.particleSystem) return;

        const particleCount = Math.min(10, Math.max(3, damage / 10));
        const color = team === 'enemy' ? '#ff3333' : '#ffcc00';

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 50 + Math.random() * 100;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            const life = 0.3 + Math.random() * 0.3;
            const size = 2 + Math.random() * 2;

            this.particleSystem.emit(x, y, vx, vy, life, size, color);
        }
    }

    /**
     * Create death effects
     * @param {number} x - Death X position
     * @param {number} y - Death Y position
     * @param {string} type - Death type
     */
    #createDeathEffects(x, y, type) {
        if (!this.particleSystem) return;

        const particleCount = type === 'player' ? 30 : 20;
        const color = type === 'player' ? '#00ccff' : '#ff3333';

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 200;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            const life = 0.5 + Math.random() * 0.5;
            const size = 3 + Math.random() * 4;

            this.particleSystem.emit(x, y, vx, vy, life, size, color);
        }

        // Screen shake for dramatic deaths
        const intensity = type === 'player' ? 8 : 4;
        const pid = this.em.getEntitiesWith(['PlayerControlled'])[0];
        if (pid !== undefined) {
            this.em.addComponent(pid, 'ScreenShake', { intensity, duration: 0.5 });
        }
    }

    /**
     * Get entity team for friendly fire prevention
     * @param {number} entityId - Entity ID
     * @returns {string} - Team identifier
     */
    #getEntityTeam(entityId) {
        if (this.em.hasComponent(entityId, 'PlayerControlled')) {
            return 'player';
        } else if (this.em.hasComponent(entityId, 'EnemyAI')) {
            return 'enemy';
        }
        return 'neutral';
    }

    /**
     * Process combat events (for scoring, achievements, etc.)
     */
    #processCombatEvents() {
        for (const event of this.combatEvents) {
            switch (event.type) {
                case 'kill':
                    this.#processKillEvent(event);
                    break;
                case 'hit':
                    this.#processHitEvent(event);
                    break;
            }
        }
    }

    /**
     * Process kill event
     * @param {Object} event - Kill event data
     */
    #processKillEvent(event) {
        // Add score based on enemy type
        const scoreValues = {
            'Sombras': 10,
            'Amantes': 15,
            'Glutões': 20,
            'Avarentos': 25,
            'Furiosos': 30,
            'Hereges': 35,
            'Violentos': 40,
            'Fraudadores': 45,
            'Traidores': 50,
            'default': 10
        };

        const score = scoreValues[event.enemyType] || scoreValues.default;

        // Update game state score
        const gameState = this.em.getEntitiesWith(['GameData'])[0];
        if (gameState) {
            const gameData = this.em.getComponent(gameState, 'GameData');
            if (gameData) {
                gameData.score += score;
            }
        }
    }

    /**
     * Process hit event
     * @param {Object} event - Hit event data
     */
    #processHitEvent(event) {
        // Track accuracy statistics
        // Could be used for achievements or analytics
    }

    /**
     * Get combat system performance metrics
     * @returns {Object} - Performance metrics
     */
    getMetrics() {
        return { ...this.performanceMetrics };
    }

    /**
     * Get recent combat events
     * @returns {Array} - Array of combat events
     */
    getCombatEvents() {
        return [...this.combatEvents];
    }

    /**
     * Clear all combat events
     */
    clearCombatEvents() {
        this.combatEvents.length = 0;
    }

    /**
     * Force kill all enemies (for debugging)
     */
    killAllEnemies() {
        const enemies = this.em.getEntitiesWith(['EnemyAI', 'Health']);
        for (const enemy of enemies) {
            const health = this.em.getComponent(enemy, 'Health');
            if (health) {
                health.current = 0;
                this.#handleDeath(enemy, -1); // -1 = system kill
            }
        }
    }

    /**
     * Heal all entities (for debugging)
     */
    healAll() {
        const entities = this.em.getEntitiesWith(['Health']);
        for (const entity of entities) {
            const health = this.em.getComponent(entity, 'Health');
            if (health) {
                health.current = health.max;
            }
        }
    }
}
