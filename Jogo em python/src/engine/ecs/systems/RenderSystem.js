/**
 * THE LAST LIGHTKEEPER - Render System
 * ECS system for visual rendering - ONLY module that talks to Canvas API
 * Implements Separation between Simulation and Presentation
 */

import { GAME_CONFIG } from '../../../game/config/constants.js';

export class RenderSystem {
    constructor(entityManager, context2d, canvasWidth = GAME_CONFIG.width, canvasHeight = GAME_CONFIG.height) {
        this.em = entityManager;
        this.ctx = context2d;
        this.width = canvasWidth;
        this.height = canvasHeight;

        // Performance metrics
        this.renderedEntities = 0;
        this.culledEntities = 0;
        this.lastFrameTime = 0;
    }

    /**
     * Main render loop - draws all visible entities
     * Implements viewport culling for performance optimization
     */
    update() {
        const startTime = performance.now();

        // Reset metrics
        this.renderedEntities = 0;
        this.culledEntities = 0;

        // 1. Clear previous frame (prepare buffer)
        // In future, replace with OffscreenCanvas background for parallax
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 2. Collect all visible entities
        const renderables = this.em.getEntitiesWith(['Position', 'Renderable']);

        // PERFORMANCE OPTIMIZATION: Context switching is expensive
        // In a full implementation, we'd batch by color, but keeping it clean for now
        for (const entity of renderables) {
            const pos = this.em.getComponent(entity, 'Position');
            const render = this.em.getComponent(entity, 'Renderable');

            if (!pos || !render) continue;

            // Viewport Culling - Skip entities completely off-screen
            const radius = render.radius || 10;
            if (this.isEntityOffScreen(pos.x, pos.y, radius)) {
                this.culledEntities++;
                continue;
            }

            // Check for Invulnerable shield to apply visual effect
            const isInvulnerable = this.em.getComponent(entity, 'Invulnerable');
            if (isInvulnerable) {
                // Pulsate between 0.2 and 0.8
                this.ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 150) * 0.3;
            }

            // Render the entity based on type
            this.renderEntity(pos, render);
            this.renderedEntities++;

            if (isInvulnerable) {
                this.ctx.globalAlpha = 1.0; // Reset
            }
        }

        // 3. Render UI/HUD last (on top of everything)
        this.renderHUD();

        // Track performance
        this.lastFrameTime = performance.now() - startTime;
    }

    /**
     * Check if entity is completely outside viewport
     * Massive performance optimization for large worlds
     */
    isEntityOffScreen(x, y, radius) {
        return (
            x + radius < 0 ||
            x - radius > this.width ||
            y + radius < 0 ||
            y - radius > this.height
        );
    }

    /**
     * Render individual entity based on type
     * Centralized rendering logic for maintainability
     */
    renderEntity(pos, render) {
        this.ctx.save();

        switch (render.type) {
            case 'circle':
                this.renderCircle(pos.x, pos.y, render.radius, render.color);
                break;
            case 'devil':
                this.renderDevil(pos.x, pos.y, render.radius, render.color);
                break;
            case 'particle':
                this.renderParticle(pos.x, pos.y, render.radius, render.color);
                break;
            default:
                // Fallback to circle rendering
                this.renderCircle(pos.x, pos.y, render.radius, render.color);
        }

        this.ctx.restore();
    }

    /**
     * Render basic circle
     */
    renderCircle(x, y, radius, color = '#ffffff') {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.closePath();
    }

    /**
     * Render devil entity with more complex drawing
     */
    renderDevil(x, y, radius, color = '#ff0000') {
        // Body
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();

        // Eyes
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.arc(x - radius * 0.3, y - radius * 0.2, radius * 0.15, 0, Math.PI * 2);
        this.ctx.arc(x + radius * 0.3, y - radius * 0.2, radius * 0.15, 0, Math.PI * 2);
        this.ctx.fill();

        // Horns
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x - radius * 0.5, y - radius * 0.8);
        this.ctx.lineTo(x - radius * 0.3, y - radius);
        this.ctx.moveTo(x + radius * 0.5, y - radius * 0.8);
        this.ctx.lineTo(x + radius * 0.3, y - radius);
        this.ctx.stroke();
    }

    /**
     * Render particle with glow effect
     */
    renderParticle(x, y, radius, color = '#ffffff') {
        // Glow effect
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color + '88');
        gradient.addColorStop(1, 'transparent');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Core
        this.renderCircle(x, y, radius, color);
    }

    /**
     * Render HUD/UI elements
     * Should be drawn last to appear on top of everything
     */
    renderHUD() {
        // Find player entity for HUD reference
        const playerEntities = this.em.getEntitiesWith(['PlayerControlled', 'Health']);
        if (playerEntities.length === 0) return;

        const player = playerEntities[0];
        const health = this.em.getComponent(player, 'Health');
        const pos = this.em.getComponent(player, 'Position');

        // Health bar
        if (health) {
            this.renderHealthBar(health);
        }

        // Player position (debug)
        if (pos && this.showDebugInfo) {
            this.renderDebugInfo(pos);
        }
    }

    /**
     * Render health bar
     */
    renderHealthBar(health) {
        const barWidth = 200;
        const barHeight = 20;
        const x = 20;
        const y = this.height - 40;

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x, y, barWidth, barHeight);

        // Health fill
        const healthPercent = health.current / health.max;
        const healthColor = healthPercent > 0.5 ? '#00ff00' :
            healthPercent > 0.25 ? '#ffff00' : '#ff0000';

        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

        // Border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, barWidth, barHeight);

        // Text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`HP: ${Math.max(0, health.current)}/${health.max}`, x + barWidth / 2, y + barHeight / 2 + 5);
    }

    /**
     * Render debug information
     */
    renderDebugInfo(pos) {
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Player: (${Math.round(pos.x)}, ${Math.round(pos.y)})`, 20, 20);
        this.ctx.fillText(`FPS: ${Math.round(1000 / this.lastFrameTime)}`, 20, 35);
        this.ctx.fillText(`Entities: ${this.renderedEntities}`, 20, 50);
        this.ctx.fillText(`Culled: ${this.culledEntities}`, 20, 65);
    }

    /**
     * Enable/disable debug information display
     */
    setDebugMode(enabled) {
        this.showDebugInfo = enabled;
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            renderedEntities: this.renderedEntities,
            culledEntities: this.culledEntities,
            frameTime: this.lastFrameTime,
            fps: Math.round(1000 / this.lastFrameTime)
        };
    }

    /**
     * Resize canvas and update dimensions
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    /**
     * Clear screen with specific color (for backgrounds)
     */
    clearScreen(color = '#000000') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Draw background image or pattern
     * Future enhancement for OffscreenCanvas integration
     */
    drawBackground(backgroundElement) {
        if (backgroundElement) {
            this.ctx.drawImage(backgroundElement, 0, 0, this.width, this.height);
        }
    }
}
