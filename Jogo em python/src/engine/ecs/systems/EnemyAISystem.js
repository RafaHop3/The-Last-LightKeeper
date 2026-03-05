/**
 * THE LAST LIGHTKEEPER - Enemy AI System
 * ECS system for enemy intelligence and behavior
 * Implements steering behaviors and tactical AI patterns
 */

export class EnemyAISystem {
    constructor(entityManager) {
        this.em = entityManager;
        this.behaviors = {
            'stealth': this.#stealthBehavior.bind(this),
            'aggressive': this.#aggressiveBehavior.bind(this),
            'patrol': this.#patrolBehavior.bind(this),
            'guardian': this.#guardianBehavior.bind(this),
            'berserker': this.#berserkerBehavior.bind(this),
            'summoner': this.#summonerBehavior.bind(this),
            'charger': this.#chargerBehavior.bind(this),
            'deceiver': this.#deceiverBehavior.bind(this),
            'assassin': this.#assassinBehavior.bind(this),
            'default': this.#defaultBehavior.bind(this)
        };
        
        this.performanceMetrics = {
            activeEnemies: 0,
            aggroedEnemies: 0,
            thinkingTime: 0
        };
    }

    /**
     * Main AI update loop
     * Implements intention-based movement (sets velocity, not position)
     */
    update() {
        const startTime = performance.now();
        
        // Reset metrics
        this.performanceMetrics.activeEnemies = 0;
        this.performanceMetrics.aggroedEnemies = 0;

        // 1. Find target (the Player)
        const players = this.em.getEntitiesWith(['PlayerControlled', 'Position']);
        if (players.length === 0) return; // Safety: Pause AI if player doesn't exist
        
        const playerEntity = players[0];
        const playerPos = this.em.getComponent(playerEntity, 'Position');

        // 2. Collect all active enemies
        const enemies = this.em.getEntitiesWith(['EnemyAI', 'Position', 'Velocity']);

        for (const enemy of enemies) {
            // Ignore dead/inactive entities (managed by EntityPool)
            if (this.em.getComponent(enemy, 'Inactive')) continue;
            
            this.performanceMetrics.activeEnemies++;

            const ai = this.em.getComponent(enemy, 'EnemyAI');
            const pos = this.em.getComponent(enemy, 'Position');
            const vel = this.em.getComponent(enemy, 'Velocity');

            // 3. Calculate direction vector
            const dx = playerPos.x - pos.x;
            const dy = playerPos.y - pos.y;
            
            // OPTIMIZATION: Squared distance for detection phase (Broad Phase visual)
            const distanceSq = (dx * dx) + (dy * dy);
            const aggroSq = ai.aggroRange * ai.aggroRange;

            // If player is within enemy's vision range
            if (distanceSq < aggroSq) {
                this.performanceMetrics.aggroedEnemies++;
                this.#executeAggroBehavior(enemy, ai, pos, vel, dx, dy, distanceSq, playerPos);
            } else {
                this.#executePatrolBehavior(enemy, ai, pos, vel);
            }
        }

        // Track performance
        this.performanceMetrics.thinkingTime = performance.now() - startTime;
    }

    /**
     * Execute behavior when player is detected (aggro)
     * @param {number} enemy - Enemy entity ID
     * @param {Object} ai - EnemyAI component
     * @param {Object} pos - Position component
     * @param {Object} vel - Velocity component
     * @param {number} dx - Delta X to player
     * @param {number} dy - Delta Y to player
     * @param {number} distanceSq - Squared distance
     * @param {Object} playerPos - Player position
     */
    #executeAggroBehavior(enemy, ai, pos, vel, dx, dy, distanceSq, playerPos) {
        const distance = Math.sqrt(distanceSq);
        
        if (distance > 0) {
            // Get behavior function based on enemy type
            const behaviorFunction = this.behaviors[ai.behavior] || this.behaviors.default;
            behaviorFunction(enemy, ai, pos, vel, dx, dy, distance, playerPos);
        }
    }

    /**
     * Execute patrol/idle behavior when player is far
     * @param {number} enemy - Enemy entity ID
     * @param {Object} ai - EnemyAI component
     * @param {Object} pos - Position component
     * @param {Object} vel - Velocity component
     */
    #executePatrolBehavior(enemy, ai, pos, vel) {
        // Apply friction to slow down smoothly
        vel.vx *= 0.9;
        vel.vy *= 0.9;
        
        // Truncate to absolute zero to avoid unnecessary calculations in MovementSystem
        if (Math.abs(vel.vx) < 0.1) vel.vx = 0;
        if (Math.abs(vel.vy) < 0.1) vel.vy = 0;

        // Optional: Add gentle wandering behavior
        if (Math.random() < 0.02) { // 2% chance per frame
            const wanderAngle = Math.random() * Math.PI * 2;
            const wanderSpeed = 20;
            vel.vx += Math.cos(wanderAngle) * wanderSpeed;
            vel.vy += Math.sin(wanderAngle) * wanderSpeed;
        }
    }

    /**
     * Stealth behavior - Hide and ambush
     */
    #stealthBehavior(enemy, ai, pos, vel, dx, dy, distance, playerPos) {
        // Move perpendicular to player for flanking
        const perpX = -dy / distance;
        const perpY = dx / distance;
        
        const speed = ai.baseSpeed || 100;
        vel.vx = perpX * speed;
        vel.vy = perpY * speed;
        
        // Try to maintain optimal distance
        const optimalDistance = ai.aggroRange * 0.7;
        if (distance < optimalDistance) {
            vel.vx = -dx / distance * speed;
            vel.y = -dy / distance * speed;
        }
    }

    /**
     * Aggressive behavior - Direct pursuit
     */
    #aggressiveBehavior(enemy, ai, pos, vel, dx, dy, distance, playerPos) {
        const speed = ai.baseSpeed || 120;
        vel.vx = (dx / distance) * speed;
        vel.vy = (dy / distance) * speed;
    }

    /**
     * Patrol behavior - Random movement patterns
     */
    #patrolBehavior(enemy, ai, pos, vel, dx, dy, distance, playerPos) {
        // Move in patterns
        const time = performance.now() / 1000;
        const patternSpeed = ai.baseSpeed || 80;
        
        vel.vx = Math.sin(time + enemy) * patternSpeed;
        vel.vy = Math.cos(time * 0.7 + enemy) * patternSpeed;
    }

    /**
     * Guardian behavior - Protect specific area
     */
    #guardianBehavior(enemy, ai, pos, vel, dx, dy, distance, playerPos) {
        // Stay between player and guard point
        const guardPoint = ai.guardPoint || { x: 500, y: 350 };
        const toGuardX = guardPoint.x - pos.x;
        const toGuardY = guardPoint.y - pos.y;
        
        const speed = ai.baseSpeed || 90;
        
        // Interpolate between guarding and pursuing
        const pursuitWeight = Math.min(1, distance / ai.aggroRange);
        vel.vx = (dx / distance * speed * pursuitWeight) + (toGuardX * 0.1 * (1 - pursuitWeight));
        vel.vy = (dy / distance * speed * pursuitWeight) + (toGuardY * 0.1 * (1 - pursuitWeight));
    }

    /**
     * Berserker behavior - Rush attack
     */
    #berserkerBehavior(enemy, ai, pos, vel, dx, dy, distance, playerPos) {
        const speed = ai.baseSpeed || 150;
        
        // Rush directly at player with acceleration
        vel.vx = (dx / distance) * speed * 1.5;
        vel.vy = (dy / distance) * speed * 1.5;
        
        // Add charge cooldown
        if (!ai.lastChargeTime || performance.now() - ai.lastChargeTime > 3000) {
            ai.lastChargeTime = performance.now();
            ai.isCharging = true;
        }
    }

    /**
     * Summoner behavior - Keep distance and summon
     */
    #summonerBehavior(enemy, ai, pos, vel, dx, dy, distance, playerPos) {
        const optimalDistance = ai.aggroRange * 0.8;
        const speed = ai.baseSpeed || 70;
        
        if (distance < optimalDistance) {
            // Move away from player
            vel.vx = -(dx / distance) * speed;
            vel.vy = -(dy / distance) * speed;
        } else if (distance > optimalDistance * 1.2) {
            // Move closer to player
            vel.vx = (dx / distance) * speed;
            vel.vy = (dy / distance) * speed;
        } else {
            // Maintain distance, circle around player
            const angle = Math.atan2(dy, dx) + Math.PI / 2;
            vel.vx = Math.cos(angle) * speed;
            vel.vy = Math.sin(angle) * speed;
        }
        
        // Trigger summoning behavior
        if (!ai.lastSummonTime || performance.now() - ai.lastSummonTime > 5000) {
            ai.lastSummonTime = performance.now();
            this.#triggerSummon(enemy, ai, pos);
        }
    }

    /**
     * Charger behavior - Linear charge attacks
     */
    #chargerBehavior(enemy, ai, pos, vel, dx, dy, distance, playerPos) {
        const speed = ai.baseSpeed || 140;
        
        if (!ai.isCharging && distance < ai.aggroRange * 0.8) {
            // Start charging
            ai.isCharging = true;
            ai.chargeStartPos = { x: pos.x, y: pos.y };
            ai.chargeTargetPos = { x: playerPos.x, y: playerPos.y };
        }
        
        if (ai.isCharging) {
            // Charge in straight line
            const chargeDx = ai.chargeTargetPos.x - pos.x;
            const chargeDy = ai.chargeTargetPos.y - pos.y;
            const chargeDist = Math.sqrt(chargeDx * chargeDx + chargeDy * chargeDy);
            
            if (chargeDist > 10) {
                vel.vx = (chargeDx / chargeDist) * speed * 2;
                vel.vy = (chargeDy / chargeDist) * speed * 2;
            } else {
                // Stop charging
                ai.isCharging = false;
            }
        } else {
            // Normal pursuit
            vel.vx = (dx / distance) * speed;
            vel.vy = (dy / distance) * speed;
        }
    }

    /**
     * Deceiver behavior - Fake movements
     */
    #deceiverBehavior(enemy, ai, pos, vel, dx, dy, distance, playerPos) {
        const speed = ai.baseSpeed || 110;
        const time = performance.now() / 1000;
        
        // Create illusion of multiple directions
        const illusionAngle = Math.atan2(dy, dx) + Math.sin(time * 3) * 0.5;
        vel.vx = Math.cos(illusionAngle) * speed;
        vel.vy = Math.sin(illusionAngle) * speed;
        
        // Occasionally teleport (illusion)
        if (Math.random() < 0.005) { // 0.5% chance per frame
            const teleportDistance = 100;
            const teleportAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI;
            pos.x += Math.cos(teleportAngle) * teleportDistance;
            pos.y += Math.sin(teleportAngle) * teleportDistance;
        }
    }

    /**
     * Assassin behavior - Stealth attacks from behind
     */
    #assassinBehavior(enemy, ai, pos, vel, dx, dy, distance, playerPos) {
        const speed = ai.baseSpeed || 130;
        
        // Try to get behind player
        const playerVel = this.em.getComponent(
            this.em.getEntitiesWith(['PlayerControlled', 'Velocity'])[0], 
            'Velocity'
        );
        
        let targetX = playerPos.x;
        let targetY = playerPos.y;
        
        if (playerVel) {
            // Predict player position
            targetX += playerVel.vx * 0.5;
            targetY += playerVel.vy * 0.5;
        }
        
        // Move to behind position
        const toTargetX = targetX - (playerVel ? playerVel.vx * 2 : 0) - pos.x;
        const toTargetY = targetY - (playerVel ? playerVel.vy * 2 : 0) - pos.y;
        const toTargetDist = Math.sqrt(toTargetX * toTargetX + toTargetY * toTargetY);
        
        if (toTargetDist > 0) {
            vel.vx = (toTargetX / toTargetDist) * speed;
            vel.vy = (toTargetY / toTargetDist) * speed;
        }
    }

    /**
     * Default behavior - Simple pursuit
     */
    #defaultBehavior(enemy, ai, pos, vel, dx, dy, distance, playerPos) {
        const speed = ai.baseSpeed || 100;
        vel.vx = (dx / distance) * speed;
        vel.vy = (dy / distance) * speed;
    }

    /**
     * Trigger summoning behavior
     * @param {number} enemy - Enemy entity ID
     * @param {Object} ai - EnemyAI component
     * @param {Object} pos - Position component
     */
    #triggerSummon(enemy, ai, pos) {
        // This would integrate with EntityPool to spawn new enemies
        // For now, just log the event
        console.log(`[EnemyAI] ${ai.type} is summoning at (${pos.x}, ${pos.y})`);
        
        // Future: Create summoning particles, sound effects, etc.
        const particleRequest = {
            type: 'summon',
            x: pos.x,
            y: pos.y,
            color: '#ff00ff',
            count: 10
        };
        
        // Store request for particle system to process
        if (!this.summonRequests) this.summonRequests = [];
        this.summonRequests.push(particleRequest);
    }

    /**
     * Get pending summon requests (for particle system)
     * @returns {Array} - Array of summon requests
     */
    getSummonRequests() {
        const requests = this.summonRequests || [];
        this.summonRequests = [];
        return requests;
    }

    /**
     * Get AI performance metrics
     * @returns {Object} - Performance metrics
     */
    getMetrics() {
        return { ...this.performanceMetrics };
    }

    /**
     * Set behavior for specific enemy type
     * @param {string} enemyType - Enemy type
     * @param {Function} behavior - Behavior function
     */
    setBehavior(enemyType, behavior) {
        this.behaviors[enemyType] = behavior;
    }

    /**
     * Force all enemies to stop (for debugging)
     */
    forceStop() {
        const enemies = this.em.getEntitiesWith(['EnemyAI', 'Velocity']);
        for (const enemy of enemies) {
            const vel = this.em.getComponent(enemy, 'Velocity');
            if (vel) {
                vel.vx = 0;
                vel.vy = 0;
            }
        }
    }

    /**
     * Make all enemies aggressive (for testing)
     */
    forceAggro() {
        const enemies = this.em.getEntitiesWith(['EnemyAI']);
        for (const enemy of enemies) {
            const ai = this.em.getComponent(enemy, 'EnemyAI');
            if (ai) {
                ai.aggroRange = 2000; // Maximum range
            }
        }
    }
}
