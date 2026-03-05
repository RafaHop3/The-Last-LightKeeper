/**
 * THE LAST LIGHTKEEPER - HUD System
 * ECS system for Heads-Up Display and user interface rendering
 * Implements state-driven UI with Observer pattern integration
 */

import { STATES } from '../../../game/GameState.js';
import { CIRCLE_CONFIGS } from '../../../game/config/constants.js';

export class HUDSystem {
    constructor(entityManager, context2d, canvasWidth, canvasHeight, gameState) {
        this.em = entityManager;
        this.ctx = context2d;
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.gameState = gameState;
        
        // UI configuration
        this.fonts = {
            small: '14px monospace',
            medium: '16px monospace',
            large: '20px monospace',
            xlarge: '40px monospace'
        };
        
        this.colors = {
            primary: '#ffffff',
            secondary: '#aaaaaa',
            success: '#00ff66',
            warning: '#ffaa00',
            danger: '#ff3333',
            info: '#00ccff'
        };
        
        this.animations = {
            healthBar: { current: 100, target: 100, speed: 0.1 },
            score: { current: 0, target: 0, speed: 0.15 },
            notifications: []
        };
        
        this.performanceMetrics = {
            renderTime: 0,
            elementsRendered: 0
        };
    }

    /**
     * Main HUD update loop
     * Renders different UI based on game state
     */
    update() {
        const startTime = performance.now();
        
        // Reset metrics
        this.performanceMetrics.elementsRendered = 0;
        
        // Update animations
        this.#updateAnimations();
        
        // Render based on game state
        switch (this.gameState.current) {
            case STATES.PLAYING:
                this.#renderPlayingHUD();
                break;
            case STATES.MENU:
                this.#renderMenu();
                break;
            case STATES.PAUSED:
                this.#renderPaused();
                break;
            case STATES.GAME_OVER:
                this.#renderGameOver();
                break;
            case STATES.VICTORY:
                this.#renderVictory();
                break;
            case STATES.LOADING:
                this.#renderLoading();
                break;
            case STATES.INSTRUCTIONS:
                this.#renderInstructions();
                break;
            case STATES.CINEMATIC:
                this.#renderCinematic();
                break;
        }
        
        // Render notifications
        this.#renderNotifications();
        
        // Track performance
        this.performanceMetrics.renderTime = performance.now() - startTime;
    }

    /**
     * Update UI animations for smooth transitions
     */
    #updateAnimations() {
        // Health bar animation
        const players = this.em.getEntitiesWith(['PlayerControlled', 'Health']);
        if (players.length > 0) {
            const health = this.em.getComponent(players[0], 'Health');
            if (health) {
                this.animations.healthBar.target = (health.current / health.max) * 100;
                this.animations.healthBar.current += 
                    (this.animations.healthBar.target - this.animations.healthBar.current) * 
                    this.animations.healthBar.speed;
            }
        }
        
        // Score animation
        const gameData = this.#getGameData();
        if (gameData) {
            this.animations.score.target = gameData.score || 0;
            this.animations.score.current += 
                (this.animations.score.target - this.animations.score.current) * 
                this.animations.score.speed;
        }
        
        // Update notifications
        this.animations.notifications = this.animations.notifications.filter(
            notification => performance.now() - notification.startTime < notification.duration
        );
    }

    /**
     * Render playing state HUD
     */
    #renderPlayingHUD() {
        // Get player data
        const playerData = this.#getPlayerData();
        if (!playerData) return;
        
        const circleNumber = this.gameState.circle;
        const config = CIRCLE_CONFIGS[circleNumber];
        
        // Save context state
        this.ctx.save();
        
        // Render main HUD elements
        this.#renderHealthBar(playerData.health);
        this.#renderCircleInfo(circleNumber, config);
        this.#renderOrbProgress(playerData.collector, config);
        this.#renderScore();
        this.#renderMinimap();
        this.#renderWeaponInfo();
        
        // Restore context state
        this.ctx.restore();
    }

    /**
     * Render health bar with animation
     */
    #renderHealthBar(health) {
        const hpBarWidth = 200;
        const hpBarHeight = 20;
        const x = 20;
        const y = 20;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, hpBarWidth, hpBarHeight);
        
        // Animated health fill
        const healthPercent = this.animations.healthBar.current / 100;
        const fillColor = healthPercent > 0.3 ? this.colors.success : this.colors.danger;
        
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(x, y, hpBarWidth * healthPercent, hpBarHeight);
        
        // Border
        this.ctx.strokeStyle = this.colors.primary;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, hpBarWidth, hpBarHeight);
        
        // Health text
        this.ctx.fillStyle = this.colors.primary;
        this.ctx.font = this.fonts.small;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`HP: ${Math.max(0, health.current)}/${health.max}`, x + 5, y + 14);
        
        this.performanceMetrics.elementsRendered++;
    }

    /**
     * Render circle information
     */
    #renderCircleInfo(circleNumber, config) {
        const centerX = this.width / 2;
        const y = 20;
        
        // Circle name and number
        this.ctx.fillStyle = config.themeColor;
        this.ctx.textAlign = 'center';
        this.ctx.font = `bold ${this.fonts.large}`;
        this.ctx.fillText(`CÍRCULO ${circleNumber}`, centerX, y);
        
        this.ctx.font = this.fonts.medium;
        this.ctx.fillText(config.name, centerX, y + 30);
        
        // Progress indicator
        const progressWidth = 300;
        const progressHeight = 8;
        const progressX = centerX - progressWidth / 2;
        const progressY = y + 55;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(progressX, progressY, progressWidth, progressHeight);
        
        this.ctx.fillStyle = config.themeColor;
        this.ctx.fillRect(progressX, progressY, progressWidth * 0.8, progressHeight);
        
        this.performanceMetrics.elementsRendered += 3;
    }

    /**
     * Render orb collection progress
     */
    #renderOrbProgress(collector, config) {
        if (!collector) return;
        
        const x = this.width - 20;
        const y = 20;
        
        this.ctx.fillStyle = this.colors.warning;
        this.ctx.textAlign = 'right';
        this.ctx.font = this.fonts.medium;
        this.ctx.fillText(`LUZ: ${collector.count}/${config.orbsCount}`, x, y);
        
        // Orb icons
        const iconSize = 16;
        const spacing = 20;
        const startX = x - (config.orbsCount * spacing);
        
        for (let i = 0; i < config.orbsCount; i++) {
            const iconX = startX + (i * spacing);
            const collected = i < collector.count;
            
            this.ctx.fillStyle = collected ? config.themeColor : 'rgba(255, 255, 255, 0.2)';
            this.ctx.beginPath();
            this.ctx.arc(iconX, y + 25, iconSize / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.performanceMetrics.elementsRendered += 2 + config.orbsCount;
    }

    /**
     * Render animated score
     */
    #renderScore() {
        const x = this.width / 2;
        const y = this.height - 30;
        
        this.ctx.fillStyle = this.colors.info;
        this.ctx.textAlign = 'center';
        this.ctx.font = this.fonts.medium;
        this.ctx.fillText(`PONTUAÇÃO: ${Math.round(this.animations.score.current)}`, x, y);
        
        this.performanceMetrics.elementsRendered++;
    }

    /**
     * Render minimap
     */
    #renderMinimap() {
        const mapSize = 120;
        const x = this.width - mapSize - 20;
        const y = this.height - mapSize - 20;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, mapSize, mapSize);
        
        // Border
        this.ctx.strokeStyle = this.colors.primary;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, mapSize, mapSize);
        
        // Player position
        const player = this.em.getEntitiesWith(['PlayerControlled', 'Position'])[0];
        if (player) {
            const playerPos = this.em.getComponent(player, 'Position');
            if (playerPos) {
                const mapX = x + (playerPos.x / 1000) * mapSize;
                const mapY = y + (playerPos.y / 700) * mapSize;
                
                this.ctx.fillStyle = this.colors.success;
                this.ctx.beginPath();
                this.ctx.arc(mapX, mapY, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Enemy positions
        const enemies = this.em.getEntitiesWith(['EnemyAI', 'Position']);
        for (const enemy of enemies) {
            const enemyPos = this.em.getComponent(enemy, 'Position');
            if (enemyPos) {
                const mapX = x + (enemyPos.x / 1000) * mapSize;
                const mapY = y + (enemyPos.y / 700) * mapSize;
                
                this.ctx.fillStyle = this.colors.danger;
                this.ctx.fillRect(mapX - 1, mapY - 1, 2, 2);
            }
        }
        
        this.performanceMetrics.elementsRendered += 3 + enemies.length;
    }

    /**
     * Render weapon information
     */
    #renderWeaponInfo() {
        const player = this.em.getEntitiesWith(['PlayerControlled', 'Weapon'])[0];
        if (!player) return;
        
        const weapon = this.em.getComponent(player, 'Weapon');
        if (!weapon) return;
        
        const x = 20;
        const y = this.height - 60;
        
        // Weapon name
        this.ctx.fillStyle = this.colors.secondary;
        this.ctx.textAlign = 'left';
        this.ctx.font = this.fonts.small;
        this.ctx.fillText('ARMA LUZ', x, y);
        
        // Ammo indicator
        if (weapon.currentAmmo !== undefined) {
            const ammoText = weapon.isReloading ? 'RECAREGANDO...' : `${weapon.currentAmmo}/${weapon.maxAmmo}`;
            this.ctx.fillStyle = weapon.isReloading ? this.colors.warning : this.colors.primary;
            this.ctx.fillText(ammoText, x, y + 20);
            
            // Reload bar
            if (weapon.isReloading) {
                const barWidth = 100;
                const barHeight = 4;
                const progress = weapon.reloadTime / weapon.reloadDuration;
                
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(x, y + 30, barWidth, barHeight);
                
                this.ctx.fillStyle = this.colors.warning;
                this.ctx.fillRect(x, y + 30, barWidth * progress, barHeight);
            }
        }
        
        this.performanceMetrics.elementsRendered += 3;
    }

    /**
     * Render menu screen
     */
    #renderMenu() {
        // Dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Title
        this.ctx.fillStyle = this.colors.primary;
        this.ctx.textAlign = 'center';
        this.ctx.font = this.fonts.xlarge;
        this.ctx.fillText("THE LAST LIGHTKEEPER", this.width / 2, this.height / 2 - 60);
        
        // Subtitle
        this.ctx.fillStyle = this.colors.secondary;
        this.ctx.font = this.fonts.medium;
        this.ctx.fillText("Os 9 Círculos do Inferno de Dante", this.width / 2, this.height / 2 - 20);
        
        // Instructions
        this.ctx.fillStyle = this.colors.info;
        this.ctx.font = this.fonts.medium;
        this.ctx.fillText("Clique para começar sua jornada", this.width / 2, this.height / 2 + 20);
        
        // Controls hint
        this.ctx.fillStyle = this.colors.secondary;
        this.ctx.font = this.fonts.small;
        this.ctx.fillText("WASD/Setas: Mover | Mouse: Mirar | Clique: Atirar", this.width / 2, this.height / 2 + 60);
        
        this.performanceMetrics.elementsRendered += 5;
    }

    /**
     * Render paused screen
     */
    #renderPaused() {
        // Dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Paused text
        this.ctx.fillStyle = this.colors.warning;
        this.ctx.textAlign = 'center';
        this.ctx.font = this.fonts.xlarge;
        this.ctx.fillText("PAUSADO", this.width / 2, this.height / 2);
        
        // Instructions
        this.ctx.fillStyle = this.colors.secondary;
        this.ctx.font = this.fonts.medium;
        this.ctx.fillText("Pressione ESC para continuar", this.width / 2, this.height / 2 + 40);
        
        this.performanceMetrics.elementsRendered += 3;
    }

    /**
     * Render game over screen
     */
    #renderGameOver() {
        // Dark red overlay
        this.ctx.fillStyle = 'rgba(50, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Game over text
        this.ctx.fillStyle = this.colors.danger;
        this.ctx.textAlign = 'center';
        this.ctx.font = this.fonts.xlarge;
        this.ctx.fillText("A LUZ APAGOU-SE", this.width / 2, this.height / 2 - 40);
        
        // Final score
        const gameData = this.#getGameData();
        if (gameData) {
            this.ctx.fillStyle = this.colors.primary;
            this.ctx.font = this.fonts.large;
            this.ctx.fillText(`Pontuação Final: ${gameData.score || 0}`, this.width / 2, this.height / 2 + 10);
        }
        
        // Restart instruction
        this.ctx.fillStyle = this.colors.secondary;
        this.ctx.font = this.fonts.medium;
        this.ctx.fillText("Pressione ESPAÇO para tentar novamente", this.width / 2, this.height / 2 + 50);
        
        this.performanceMetrics.elementsRendered += 4;
    }

    /**
     * Render victory screen
     */
    #renderVictory() {
        // Blue overlay
        this.ctx.fillStyle = 'rgba(0, 20, 50, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Victory text
        this.ctx.fillStyle = this.colors.info;
        this.ctx.textAlign = 'center';
        this.ctx.font = this.fonts.xlarge;
        this.ctx.fillText("O INFERNO FOI CONQUISTADO", this.width / 2, this.height / 2 - 40);
        
        // Final stats
        const gameData = this.#getGameData();
        if (gameData) {
            this.ctx.fillStyle = this.colors.primary;
            this.ctx.font = this.fonts.large;
            this.ctx.fillText(`Pontuação Final: ${gameData.score || 0}`, this.width / 2, this.height / 2 + 10);
            
            this.ctx.font = this.fonts.medium;
            this.ctx.fillText(`Tempo: ${Math.round((gameData.timeElapsed || 0) / 1000)}s`, this.width / 2, this.height / 2 + 40);
        }
        
        // Continue instruction
        this.ctx.fillStyle = this.colors.secondary;
        this.ctx.font = this.fonts.medium;
        this.ctx.fillText("Pressione ESPAÇO para continuar", this.width / 2, this.height / 2 + 80);
        
        this.performanceMetrics.elementsRendered += 5;
    }

    /**
     * Render loading screen
     */
    #renderLoading() {
        // Dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Loading text
        this.ctx.fillStyle = this.colors.primary;
        this.ctx.textAlign = 'center';
        this.ctx.font = this.fonts.large;
        this.ctx.fillText("CARREGANDO...", this.width / 2, this.height / 2);
        
        // Loading bar
        const barWidth = 300;
        const barHeight = 10;
        const x = this.width / 2 - barWidth / 2;
        const y = this.height / 2 + 30;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        // Animated loading progress
        const progress = (Math.sin(performance.now() / 500) + 1) / 2; // 0-1 oscillation
        this.ctx.fillStyle = this.colors.info;
        this.ctx.fillRect(x, y, barWidth * progress, barHeight);
        
        this.performanceMetrics.elementsRendered += 4;
    }

    /**
     * Render instructions screen
     */
    #renderInstructions() {
        // Dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Title
        this.ctx.fillStyle = this.colors.primary;
        this.ctx.textAlign = 'center';
        this.ctx.font = this.fonts.xlarge;
        this.ctx.fillText("COMO JOGAR", this.width / 2, 80);
        
        // Instructions
        const instructions = [
            "WASD ou SETAS - Mover personagem",
            "Mouse - Mirar arma",
            "Clique Esquerdo - Atirar",
            "R - Recarregar arma",
            "ESC - Pausar jogo",
            "",
            "Colete toda a luz para avançar",
            "Sobreviva aos 9 círculos do inferno"
        ];
        
        this.ctx.fillStyle = this.colors.secondary;
        this.ctx.font = this.fonts.medium;
        let y = 150;
        
        for (const instruction of instructions) {
            this.ctx.fillText(instruction, this.width / 2, y);
            y += 30;
        }
        
        // Back instruction
        this.ctx.fillStyle = this.colors.info;
        this.ctx.fillText("Pressione ESC para voltar", this.width / 2, this.height - 50);
        
        this.performanceMetrics.elementsRendered += 3 + instructions.length;
    }

    /**
     * Render cinematic overlay
     */
    #renderCinematic() {
        // Cinematic bars
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.width, 60);
        this.ctx.fillRect(0, this.height - 60, this.width, 60);
        
        // Cinematic text
        this.ctx.fillStyle = this.colors.primary;
        this.ctx.textAlign = 'center';
        this.ctx.font = this.fonts.medium;
        this.ctx.fillText("CINEMÁTICO", this.width / 2, 35);
        
        this.performanceMetrics.elementsRendered += 3;
    }

    /**
     * Render notifications
     */
    #renderNotifications() {
        let y = 100;
        
        for (const notification of this.animations.notifications) {
            const alpha = 1 - (performance.now() - notification.startTime) / notification.duration;
            
            this.ctx.fillStyle = `${notification.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            this.ctx.textAlign = 'center';
            this.ctx.font = this.fonts.medium;
            this.ctx.fillText(notification.text, this.width / 2, y);
            
            y += 30;
        }
    }

    /**
     * Add notification to display
     * @param {string} text - Notification text
     * @param {string} color - Text color
     * @param {number} duration - Display duration in ms
     */
    addNotification(text, color = this.colors.primary, duration = 3000) {
        this.animations.notifications.push({
            text: text,
            color: color,
            startTime: performance.now(),
            duration: duration
        });
    }

    /**
     * Get player data
     * @returns {Object|null} - Player data
     */
    #getPlayerData() {
        const players = this.em.getEntitiesWith(['PlayerControlled', 'Health']);
        if (players.length === 0) return null;
        
        const player = players[0];
        return {
            health: this.em.getComponent(player, 'Health'),
            collector: this.em.getComponent(player, 'Collector'),
            weapon: this.em.getComponent(player, 'Weapon')
        };
    }

    /**
     * Get game data
     * @returns {Object|null} - Game data
     */
    #getGameData() {
        const gameEntities = this.em.getEntitiesWith(['GameData']);
        if (gameEntities.length === 0) return null;
        
        return this.em.getComponent(gameEntities[0], 'GameData');
    }

    /**
     * Get HUD performance metrics
     * @returns {Object} - Performance metrics
     */
    getMetrics() {
        return { ...this.performanceMetrics };
    }

    /**
     * Set UI theme colors
     * @param {Object} colors - Color configuration
     */
    setColors(colors) {
        Object.assign(this.colors, colors);
    }

    /**
     * Set UI fonts
     * @param {Object} fonts - Font configuration
     */
    setFonts(fonts) {
        Object.assign(this.fonts, fonts);
    }

    /**
     * Clear all notifications
     */
    clearNotifications() {
        this.animations.notifications = [];
    }

    /**
     * Force UI redraw (for debugging)
     */
    forceRedraw() {
        console.log('[HUDSystem] Force redraw triggered');
    }
}
