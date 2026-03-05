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
        const score = this.gameState?.gameData?.score || 0;
        this.animations.score.target = score;
        this.animations.score.current +=
            (this.animations.score.target - this.animations.score.current) *
            this.animations.score.speed;

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
     * Render menu screen - Dante's Inferno theme with premium visuals
     */
    #renderMenu() {
        const t = performance.now() / 1000;
        const cx = this.width / 2;
        const cy = this.height / 2;

        // Animated radial gradient background
        const grd = this.ctx.createRadialGradient(cx, cy, 50, cx, cy, 600);
        grd.addColorStop(0, 'rgba(30, 5, 5, 0.95)');
        grd.addColorStop(0.5, 'rgba(10, 0, 0, 0.97)');
        grd.addColorStop(1, 'rgba(0, 0, 0, 0.98)');
        this.ctx.fillStyle = grd;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Animated concentric circle portal effect (9 circles of Dante)
        for (let i = 0; i < 9; i++) {
            const radius = 80 + i * 45 + Math.sin(t * 0.5 + i * 0.8) * 8;
            const alpha = 0.05 + (i === 0 ? 0.15 : 0);
            const hue = 10 + i * 20;
            this.ctx.strokeStyle = `hsla(${hue}, 80%, 50%, ${alpha})`;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Floating fire sparks effect
        for (let i = 0; i < 15; i++) {
            const px = cx + Math.sin(t * 0.3 + i * 2.1) * (150 + i * 20);
            const py = cy + Math.cos(t * 0.4 + i * 1.5) * 100 - Math.sin(t * 2 + i) * 30;
            const size = 2 + Math.sin(t * 3 + i) * 1.5;
            const alpha = 0.3 + Math.sin(t * 2 + i * 0.7) * 0.2;
            this.ctx.fillStyle = `rgba(255, ${80 + i * 10}, 0, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(px, py, size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Title with glow
        const titleGlow = 0.7 + Math.sin(t * 1.5) * 0.3;
        this.ctx.shadowColor = `rgba(220, 50, 20, ${titleGlow})`;
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 44px monospace';
        this.ctx.fillText('THE LAST LIGHTKEEPER', cx, cy - 100);
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'transparent';

        // Underline accent
        const lineW = 360;
        const ug = this.ctx.createLinearGradient(cx - lineW / 2, 0, cx + lineW / 2, 0);
        ug.addColorStop(0, 'transparent');
        ug.addColorStop(0.5, '#ff4400');
        ug.addColorStop(1, 'transparent');
        this.ctx.strokeStyle = ug;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(cx - lineW / 2, cy - 80);
        this.ctx.lineTo(cx + lineW / 2, cy - 80);
        this.ctx.stroke();

        // Subtitle
        this.ctx.fillStyle = '#aa8866';
        this.ctx.font = '16px monospace';
        this.ctx.fillText('Os 9 Círculos do Inferno de Dante', cx, cy - 52);

        // 9 circles dot indicators
        for (let i = 0; i < 9; i++) {
            const dx = cx - 80 + i * 20;
            const dy = cy - 30;
            const glow = 0.4 + Math.sin(t * 2 + i * 0.7) * 0.3;
            const hue = 10 + i * 18;
            this.ctx.fillStyle = `hsla(${hue}, 80%, 55%, ${glow})`;
            this.ctx.beginPath();
            this.ctx.arc(dx, dy, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Click to start with breathing glow
        const pulse = 0.6 + Math.sin(t * 2.5) * 0.4;
        this.ctx.fillStyle = `rgba(0, 200, 255, ${pulse})`;
        this.ctx.shadowColor = `rgba(0, 200, 255, ${pulse * 0.5})`;
        this.ctx.shadowBlur = 15;
        this.ctx.font = 'bold 18px monospace';
        this.ctx.fillText('▶  CLIQUE PARA COMEÇAR SUA JORNADA  ◀', cx, cy + 20);
        this.ctx.shadowBlur = 0;

        // Controls
        this.ctx.fillStyle = 'rgba(150, 150, 180, 0.6)';
        this.ctx.font = '13px monospace';
        this.ctx.fillText('WASD/Setas: Mover  |  Mouse: Mirar  |  Clique: Atirar  |  ESC: Pausar', cx, cy + 60);

        // Dante quote at bottom
        this.ctx.fillStyle = 'rgba(100, 70, 50, 0.7)';
        this.ctx.font = '12px monospace';
        this.ctx.fillText('"Lasciate ogne speranza, voi ch\'intrate"  – Dante Alighieri', cx, this.height - 30);

        this.performanceMetrics.elementsRendered += 10;
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
     * Render game over screen - Dramatic dark horror
     */
    #renderGameOver() {
        const t = performance.now() / 1000;
        const cx = this.width / 2;
        const cy = this.height / 2;

        // Deep crimson vignette
        const grd = this.ctx.createRadialGradient(cx, cy, 100, cx, cy, 600);
        grd.addColorStop(0, 'rgba(60, 0, 0, 0.85)');
        grd.addColorStop(1, 'rgba(0, 0, 0, 0.97)');
        this.ctx.fillStyle = grd;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Bleeding drip lines from top
        for (let i = 0; i < 8; i++) {
            const x = 80 + i * 120 + Math.sin(t * 0.2 + i) * 10;
            const len = 40 + Math.sin(t * 1.5 + i * 2) * 20;
            const alpha = 0.4 + Math.sin(t + i) * 0.2;
            this.ctx.strokeStyle = `rgba(160, 0, 0, ${alpha})`;
            this.ctx.lineWidth = 2 + Math.sin(t + i) * 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, len);
            this.ctx.stroke();
        }

        // Title with flicker
        const flicker = 0.7 + Math.sin(t * 8) * 0.2 + Math.sin(t * 3.3) * 0.1;
        this.ctx.shadowColor = `rgba(255, 0, 0, ${flicker})`;
        this.ctx.shadowBlur = 25;
        this.ctx.fillStyle = '#ff2222';
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 46px monospace';
        this.ctx.fillText('A LUZ APAGOU-SE', cx, cy - 60);
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = '#cc8888';
        this.ctx.font = '16px monospace';
        this.ctx.fillText('A escuridão te consumiu.', cx, cy - 20);

        // Final score
        const finalScore = this.gameState?.gameData?.score || 0;
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.fillText(`PONTUAÇÃO FINAL: ${finalScore.toLocaleString()}`, cx, cy + 10);

        // Restart hint with pulse
        const restartPulse = 0.5 + Math.sin(t * 2) * 0.5;
        this.ctx.fillStyle = `rgba(255, 120, 120, ${restartPulse})`;
        this.ctx.font = 'bold 16px monospace';
        this.ctx.fillText('CLIQUE ou ESPAÇO para tentar novamente', cx, cy + 50);

        this.performanceMetrics.elementsRendered += 5;
    }

    /**
     * Render victory screen - Celestial triumph
     */
    #renderVictory() {
        const t = performance.now() / 1000;
        const cx = this.width / 2;
        const cy = this.height / 2;

        // Celestial gradient
        const grd = this.ctx.createRadialGradient(cx, cy, 80, cx, cy, 600);
        grd.addColorStop(0, 'rgba(0, 30, 80, 0.9)');
        grd.addColorStop(0.6, 'rgba(0, 5, 30, 0.95)');
        grd.addColorStop(1, 'rgba(0, 0, 0, 0.99)');
        this.ctx.fillStyle = grd;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Star field
        for (let i = 0; i < 50; i++) {
            const sx = ((i * 137.5 + 50) % this.width);
            const sy = ((i * 93.7 + 30) % this.height);
            const starAlpha = 0.3 + Math.sin(t * 2 + i * 0.7) * 0.3;
            this.ctx.fillStyle = `rgba(200, 220, 255, ${starAlpha})`;
            this.ctx.fillRect(sx, sy, 1, 1);
        }

        // Expanding light ring
        const ringR = 120 + Math.sin(t * 0.8) * 20;
        this.ctx.strokeStyle = `rgba(100, 200, 255, 0.1)`;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        this.ctx.stroke();

        // Title
        this.ctx.shadowColor = 'rgba(0, 200, 255, 0.8)';
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = '#00ccff';
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 40px monospace';
        this.ctx.fillText('⚡ INFERNO CONQUISTADO ⚡', cx, cy - 70);
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = '#aaddff';
        this.ctx.font = '16px monospace';
        this.ctx.fillText('Você atravessou os 9 círculos e emergiu na luz.', cx, cy - 30);

        // Final score
        const victoryScore = this.gameState?.gameData?.score || 0;
        this.ctx.shadowColor = 'rgba(255, 220, 0, 0.6)';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#ffdd00';
        this.ctx.font = 'bold 22px monospace';
        this.ctx.fillText(`✨ PONTUAÇÃO: ${victoryScore.toLocaleString()} ✨`, cx, cy + 5);
        this.ctx.shadowBlur = 0;

        // Play again
        const pulse = 0.5 + Math.sin(t * 2.5) * 0.5;
        this.ctx.fillStyle = `rgba(100, 220, 255, ${pulse})`;
        this.ctx.font = 'bold 16px monospace';
        this.ctx.fillText('CLIQUE ou ESPAÇO para jogar novamente', cx, cy + 40);

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
        // Read directly from gameState (the GameData ECS entity doesn't exist)
        if (this.gameState && this.gameState.gameData) {
            return this.gameState.gameData;
        }
        return null;
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
