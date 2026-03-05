/**
 * THE LAST LIGHTKEEPER - Game Feel System
 * Advanced camera system with screen shake and smooth following
 * Implements trauma-based screen shake and linear interpolation for camera movement
 */

export class GameFeel {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        // Camera state (Lerp)
        this.camX = canvasWidth / 2;
        this.camY = canvasHeight / 2;
        this.targetX = this.camX;
        this.targetY = this.camY;
        
        // Screen shake state (Trauma)
        this.trauma = 0;
        this.shakeDecay = 1.5;        // Recovery speed per second
        this.maxOffset = 25;          // Maximum pixel displacement
        this.maxAngle = 0.1;          // Maximum rotation in radians
        this.shakeFrequency = 25;     // Shake frequency multiplier
        this.shakeTime = 0;           // Time accumulator for shake animation
        
        // Camera smoothing settings
        this.lerpFactor = 0.05;      // Camera follow speed (5% per frame)
        this.deadZone = 50;           // Dead zone for camera movement
        this.zoom = 1.0;              // Camera zoom level
        this.targetZoom = 1.0;
        this.zoomSpeed = 0.1;         // Zoom transition speed
        
        // Advanced shake patterns
        this.shakePattern = 'default'; // 'default', 'explosion', 'recoil', 'impact'
        this.customShakeFunction = null;
        
        // Performance metrics
        this.metrics = {
            averageTrauma: 0,
            peakTrauma: 0,
            totalShakeTime: 0,
            cameraDistance: 0
        };
        
        // History for smoothing
        this.positionHistory = [];
        this.maxHistoryLength = 5;
    }

    /**
     * Add trauma to trigger screen shake
     * @param {number} amount - Trauma amount (0-1)
     * @param {string} pattern - Shake pattern type
     */
    addTrauma(amount, pattern = 'default') {
        // Clamp trauma to maximum of 1.0 (100%)
        this.trauma = Math.min(this.trauma + amount, 1.0);
        this.shakePattern = pattern;
        
        // Track metrics
        this.metrics.peakTrauma = Math.max(this.metrics.peakTrauma, this.trauma);
        
        // Special effects for different patterns
        switch (pattern) {
            case 'explosion':
                this.maxOffset = 40;
                this.maxAngle = 0.15;
                break;
            case 'recoil':
                this.maxOffset = 8;
                this.maxAngle = 0.02;
                break;
            case 'impact':
                this.maxOffset = 20;
                this.maxAngle = 0.08;
                break;
            default:
                this.maxOffset = 25;
                this.maxAngle = 0.1;
        }
    }

    /**
     * Update camera mathematics and shake decay
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {Object} targetPos - Target position {x, y}
     * @param {Object} options - Additional options
     */
    update(deltaTime, targetPos, options = {}) {
        // Update position history for smoothing
        this.#updatePositionHistory(targetPos);
        
        // 1. Camera following with Linear Interpolation (Lerp)
        this.#updateCameraPosition(targetPos, options);
        
        // 2. Trauma decay (exponential decay)
        this.#updateTrauma(deltaTime);
        
        // 3. Zoom transitions
        this.#updateZoom(deltaTime);
        
        // 4. Update shake time for animation
        this.shakeTime += deltaTime * this.shakeFrequency;
        
        // 5. Update metrics
        this.#updateMetrics();
    }

    /**
     * Update camera position with smoothing
     * @param {Object} targetPos - Target position
     * @param {Object} options - Additional options
     */
    #updateCameraPosition(targetPos, options) {
        // Calculate desired camera position (center on target)
        const desiredX = targetPos.x - (this.width / 2);
        const desiredY = targetPos.y - (this.height / 2);
        
        // Apply dead zone to prevent micro-movements
        const dx = desiredX - this.camX;
        const dy = desiredY - this.camY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.deadZone) {
            // Use position history for predictive following
            const smoothedTarget = this.#getSmoothedPosition(targetPos);
            const smoothX = smoothedTarget.x - (this.width / 2);
            const smoothY = smoothedTarget.y - (this.height / 2);
            
            // Apply linear interpolation
            const lerpFactor = options.lerpFactor || this.lerpFactor;
            this.camX += (smoothX - this.camX) * lerpFactor;
            this.camY += (smoothY - this.camY) * lerpFactor;
        }
        
        // Store target for metrics
        this.targetX = desiredX;
        this.targetY = desiredY;
    }

    /**
     * Update trauma with exponential decay
     * @param {number} deltaTime - Time delta
     */
    #updateTrauma(deltaTime) {
        if (this.trauma > 0) {
            // Exponential decay: trauma *= decayFactor
            const decayFactor = Math.exp(-this.shakeDecay * deltaTime);
            this.trauma *= decayFactor;
            
            // Clamp to zero
            if (this.trauma < 0.001) {
                this.trauma = 0;
            }
            
            this.metrics.totalShakeTime += deltaTime;
        }
    }

    /**
     * Update zoom with smooth transitions
     * @param {number} deltaTime - Time delta
     */
    #updateZoom(deltaTime) {
        if (Math.abs(this.targetZoom - this.zoom) > 0.01) {
            this.zoom += (this.targetZoom - this.zoom) * this.zoomSpeed;
        }
    }

    /**
     * Update position history for predictive following
     * @param {Object} targetPos - Current target position
     */
    #updatePositionHistory(targetPos) {
        this.positionHistory.push({ x: targetPos.x, y: targetPos.y, time: performance.now() });
        
        // Keep only recent history
        if (this.positionHistory.length > this.maxHistoryLength) {
            this.positionHistory.shift();
        }
    }

    /**
     * Get smoothed position using history
     * @param {Object} currentPos - Current position
     * @returns {Object} - Smoothed position
     */
    #getSmoothedPosition(currentPos) {
        if (this.positionHistory.length < 2) {
            return currentPos;
        }
        
        // Simple predictive following based on velocity
        const recent = this.positionHistory.slice(-3);
        const avgVelocity = this.#calculateAverageVelocity(recent);
        
        return {
            x: currentPos.x + avgVelocity.x * 0.1, // Predict 10% of velocity
            y: currentPos.y + avgVelocity.y * 0.1
        };
    }

    /**
     * Calculate average velocity from position history
     * @param {Array} positions - Array of position objects
     * @returns {Object} - Average velocity {x, y}
     */
    #calculateAverageVelocity(positions) {
        if (positions.length < 2) return { x: 0, y: 0 };
        
        let totalVx = 0;
        let totalVy = 0;
        let count = 0;
        
        for (let i = 1; i < positions.length; i++) {
            const dt = (positions[i].time - positions[i-1].time) / 1000; // Convert to seconds
            if (dt > 0) {
                totalVx += (positions[i].x - positions[i-1].x) / dt;
                totalVy += (positions[i].y - positions[i-1].y) / dt;
                count++;
            }
        }
        
        return {
            x: count > 0 ? totalVx / count : 0,
            y: count > 0 ? totalVy / count : 0
        };
    }

    /**
     * Apply camera transformation to canvas context
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    applyCamera(ctx) {
        // Calculate shake amount (non-linear: trauma²)
        const shake = this.trauma * this.trauma;
        
        let offsetX = 0;
        let offsetY = 0;
        let angle = 0;
        
        if (shake > 0) {
            const shakeOffset = this.#calculateShakeOffset(shake);
            offsetX = shakeOffset.x;
            offsetY = shakeOffset.y;
            angle = shakeOffset.angle;
        }
        
        // Apply zoom
        ctx.save();
        ctx.translate(this.width / 2, this.height / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.width / 2, -this.height / 2);
        
        // Apply camera transformations
        ctx.translate(this.width / 2, this.height / 2);
        ctx.rotate(angle);
        ctx.translate(-this.width / 2, -this.height / 2);
        
        ctx.translate(-this.camX + offsetX, -this.camY + offsetY);
    }

    /**
     * Calculate shake offset based on pattern
     * @param {number} shake - Shake intensity
     * @returns {Object} - Offset values {x, y, angle}
     */
    #calculateShakeOffset(shake) {
        switch (this.shakePattern) {
            case 'explosion':
                return this.#explosionShake(shake);
            case 'recoil':
                return this.#recoilShake(shake);
            case 'impact':
                return this.#impactShake(shake);
            default:
                return this.#defaultShake(shake);
        }
    }

    /**
     * Default shake pattern (Perlin-like noise)
     * @param {number} shake - Shake intensity
     * @returns {Object} - Offset values
     */
    #defaultShake(shake) {
        // Use sine waves for smooth, continuous shake
        const t = this.shakeTime;
        const x = Math.sin(t * 1.1) * Math.cos(t * 2.3);
        const y = Math.sin(t * 1.7) * Math.cos(t * 3.1);
        const angle = Math.sin(t * 0.7) * 0.5;
        
        return {
            x: this.maxOffset * shake * x,
            y: this.maxOffset * shake * y,
            angle: this.maxAngle * shake * angle
        };
    }

    /**
     * Explosion shake pattern (violent, chaotic)
     * @param {number} shake - Shake intensity
     * @returns {Object} - Offset values
     */
    #explosionShake(shake) {
        const t = this.shakeTime * 2;
        const x = Math.sin(t * 3.7) * Math.cos(t * 5.1);
        const y = Math.sin(t * 4.3) * Math.cos(t * 2.9);
        const angle = Math.sin(t * 2.1) * Math.cos(t * 3.3);
        
        return {
            x: this.maxOffset * shake * x * 1.5,
            y: this.maxOffset * shake * y * 1.5,
            angle: this.maxAngle * shake * angle * 2
        };
    }

    /**
     * Recoil shake pattern (sharp, directional)
     * @param {number} shake - Shake intensity
     * @returns {Object} - Offset values
     */
    #recoilShake(shake) {
        const t = this.shakeTime * 8;
        const x = Math.sin(t) * Math.exp(-t * 0.5);
        const y = Math.cos(t * 1.5) * Math.exp(-t * 0.3);
        
        return {
            x: this.maxOffset * shake * x * 0.5,
            y: this.maxOffset * shake * y * 0.3,
            angle: 0 // Recoil doesn't rotate
        };
    }

    /**
     * Impact shake pattern (sharp bump)
     * @param {number} shake - Shake intensity
     * @returns {Object} - Offset values
     */
    #impactShake(shake) {
        const t = this.shakeTime * 4;
        const x = Math.sin(t * 2.1) * Math.exp(-t * 0.8);
        const y = Math.sin(t * 2.7) * Math.exp(-t * 0.8);
        const angle = Math.sin(t * 1.3) * Math.exp(-t * 0.6);
        
        return {
            x: this.maxOffset * shake * x,
            y: this.maxOffset * shake * y,
            angle: this.maxAngle * shake * angle
        };
    }

    /**
     * Update performance metrics
     */
    #updateMetrics() {
        const distance = Math.sqrt(
            Math.pow(this.targetX - this.camX, 2) + 
            Math.pow(this.targetY - this.camY, 2)
        );
        
        this.metrics.cameraDistance = distance;
        this.metrics.averageTrauma = (this.metrics.averageTrauma * 0.99) + (this.trauma * 0.01);
    }

    /**
     * Set camera zoom
     * @param {number} zoom - Zoom level
     * @param {boolean} instant - Whether to apply instantly
     */
    setZoom(zoom, instant = false) {
        this.targetZoom = Math.max(0.5, Math.min(2.0, zoom));
        if (instant) {
            this.zoom = this.targetZoom;
        }
    }

    /**
     * Reset camera to center
     */
    reset() {
        this.camX = this.width / 2;
        this.camY = this.height / 2;
        this.trauma = 0;
        this.shakeTime = 0;
        this.zoom = 1.0;
        this.targetZoom = 1.0;
        this.positionHistory = [];
    }

    /**
     * Get camera position
     * @returns {Object} - Camera position {x, y}
     */
    getCameraPosition() {
        return { x: this.camX, y: this.camY };
    }

    /**
     * Get current trauma level
     * @returns {number} - Current trauma (0-1)
     */
    getTrauma() {
        return this.trauma;
    }

    /**
     * Get performance metrics
     * @returns {Object} - Performance metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Set camera following speed
     * @param {number} factor - Lerp factor (0-1)
     */
    setFollowSpeed(factor) {
        this.lerpFactor = Math.max(0.01, Math.min(1.0, factor));
    }

    /**
     * Set dead zone for camera movement
     * @param {number} size - Dead zone size in pixels
     */
    setDeadZone(size) {
        this.deadZone = Math.max(0, size);
    }

    /**
     * Set custom shake function
     * @param {Function} func - Custom shake function
     */
    setCustomShakeFunction(func) {
        this.customShakeFunction = func;
    }

    /**
     * Force camera to position
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    setCameraPosition(x, y) {
        this.camX = x;
        this.camY = y;
    }

    /**
     * Add impulse to camera (for explosions, etc.)
     * @param {number} x - X impulse
     * @param {number} y - Y impulse
     */
    addImpulse(x, y) {
        this.camX += x;
        this.camY += y;
    }

    /**
     * Check if camera is shaking
     * @returns {boolean} - True if shaking
     */
    isShaking() {
        return this.trauma > 0.01;
    }

    /**
     * Get shake intensity as percentage
     * @returns {number} - Shake intensity (0-100)
     */
    getShakeIntensity() {
        return this.trauma * this.trauma * 100; // Square for non-linear feel
    }
}
