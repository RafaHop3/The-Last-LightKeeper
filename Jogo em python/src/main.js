/**
 * THE LAST LIGHTKEEPER - Main Entry Point
 * Vite + ES Modules Architecture
 * ECS-based game loop orchestration with all new systems
 */

import { EntityManager } from './engine/ecs/EntityManager.js';
import { Components } from './engine/ecs/Components.js';
import { InputSystem } from './engine/ecs/systems/InputSystem.js';
import { MovementSystem } from './engine/ecs/systems/MovementSystem.js';
import { CollisionSystem } from './engine/ecs/systems/CollisionSystem.js';
import { RenderSystem } from './engine/ecs/systems/RenderSystem.js';
import { EnemyAISystem } from './engine/ecs/systems/EnemyAISystem.js';
import { WeaponSystem } from './engine/ecs/systems/WeaponSystem.js';
import { CombatSystem } from './engine/ecs/systems/CombatSystem.js';
import { HUDSystem } from './engine/ecs/systems/HUDSystem.js';
import { ParticleSystem } from './engine/ecs/systems/ParticleSystem.js';
import { QuadTree } from './engine/math/QuadTree.js';
import { GameFeel } from './engine/math/GameFeel.js';
import { AudioSystem } from './engine/audio/AudioSystem.js';
import { GameState, STATES } from './game/GameState.js';
import { CircleManager } from './game/CircleManager.js';
import { CIRCLE_CONFIGS } from './game/config/constants.js';
import { EntityPool } from './engine/ecs/EntityPool.js';

// ============================================
// 1. CONFIGURAÇÃO DO CANVAS
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

const GAME_WIDTH = 1000;
const GAME_HEIGHT = 700;

// ============================================
// 2. INICIALIZAÇÃO DO MOTOR ECS
// ============================================

const em = new EntityManager();
const quadTree = new QuadTree(0, 0, GAME_WIDTH, GAME_HEIGHT);
const gameFeel = new GameFeel(GAME_WIDTH, GAME_HEIGHT);
const audioSystem = new AudioSystem();
const gameState = new GameState();
const circleManager = new CircleManager(em, gameState);

// Entity Pools para performance
const bulletPool = new EntityPool(em, 100, 'bullet');
const enemyPool = new EntityPool(em, 50, 'enemy');
const particlePool = new EntityPool(em, 200, 'particle');
const orbPool = new EntityPool(em, 30, 'orb');

// Particle System com TypedArrays
const particleSystem = new ParticleSystem(ctx, 2000);

// ============================================
// 3. INICIALIZAÇÃO DOS SISTEMAS ECS
// ============================================

const inputSystem = new InputSystem(em);
const movementSystem = new MovementSystem(em, GAME_WIDTH, GAME_HEIGHT);
const collisionSystem = new CollisionSystem(em, quadTree);
const renderSystem = new RenderSystem(em, ctx);
const enemyAISystem = new EnemyAISystem(em);
const weaponSystem = new WeaponSystem(em, bulletPool);
const combatSystem = new CombatSystem(em, quadTree, enemyPool, bulletPool, particlePool);
const hudSystem = new HUDSystem(em, ctx, GAME_WIDTH, GAME_HEIGHT, gameState);

// ============================================
// 4. VARIÁVEIS DO JOGO
// ============================================

let playerEntity = null;
let lastTime = 0;
let isInitialized = false;

// ============================================
// 5. INICIALIZAÇÃO DO JOGO
// ============================================

async function initGame() {
    try {
        // Carrega assets de áudio
        await loadAudioAssets();
        
        // Setup UI handlers
        setupUIHandlers();
        
        // Mostra menu inicial
        showMenu();
        
        isInitialized = true;
        console.log('[Game] Initialized successfully');
    } catch (error) {
        console.error('[Game] Failed to initialize:', error);
    }
}

async function loadAudioAssets() {
    const audioAssets = {
        'shoot': '/audio/laser.wav',
        'hit': '/audio/impact.wav',
        'orb': '/audio/chime.wav',
        'enemy_death': '/audio/explosion.wav',
        'player_hit': '/audio/player_hit.wav',
        'bgm_limbo': '/audio/ambient_dark.mp3',
        'bgm_lust': '/audio/ambient_pink.mp3',
        'bgm_gluttony': '/audio/ambient_brown.mp3',
        'bgm_greed': '/audio/ambient_gold.mp3',
        'bgm_wrath': '/audio/ambient_red.mp3',
        'bgm_heresy': '/audio/ambient_orange.mp3',
        'bgm_violence': '/audio/ambient_blood.mp3',
        'bgm_fraud': '/audio/ambient_purple.mp3',
        'bgm_treachery': '/audio/ambient_ice.mp3'
    };
    
    await audioSystem.loadSounds(audioAssets);
}

function setupUIHandlers() {
    // Botões da UI
    document.getElementById('start-btn')?.addEventListener('click', startGame);
    document.getElementById('restart-death-btn')?.addEventListener('click', restartGame);
    document.getElementById('restart-victory-btn')?.addEventListener('click', restartGame);
    
    // Subscribe to game state changes
    gameState.subscribe((state, circle) => {
        handleStateChange(state, circle);
    });
}

function handleStateChange(state, circle) {
    switch (state) {
        case STATES.PLAYING:
            // Toca música do círculo atual
            const circleKey = `bgm_${Object.keys(CIRCLE_CONFIGS)[circle - 1]?.toLowerCase() || 'limbo'}`;
            audioSystem.playBGM(circleKey, 2.0, 0.4);
            break;
            
        case STATES.GAME_OVER:
            audioSystem.playSFX('player_hit');
            audioSystem.stopBGM(2.0);
            break;
            
        case STATES.VICTORY:
            audioSystem.stopBGM(3.0);
            break;
    }
}

// ============================================
// 6. CONTROLE DO JOGO
// ============================================

function startGame() {
    // Esconde menus, mostra HUD
    document.getElementById('main-menu')?.classList.add('hidden');
    document.getElementById('game-over')?.classList.add('hidden');
    document.getElementById('victory')?.classList.add('hidden');
    document.getElementById('hud')?.classList.remove('hidden');
    
    // Inicia jogo
    gameState.changeState(STATES.PLAYING);
    setupPlayer();
    
    // Carrega primeiro círculo
    circleManager.loadCircle(1);
    
    // Inicia game loop
    requestAnimationFrame(gameLoop);
}

function restartGame() {
    // Limpa entidades
    const entities = em.getEntitiesWith('Position');
    entities.forEach(id => em.removeEntity(id));
    
    // Reseta pools
    bulletPool.reset();
    enemyPool.reset();
    particlePool.reset();
    orbPool.reset();
    
    // Reseta partículas
    particleSystem.clear();
    
    // Reinicia jogo
    startGame();
}

function setupPlayer() {
    // Cria jogador
    playerEntity = em.createEntity();
    em.addComponent(playerEntity, 'Position', Components.Position(500, 350));
    em.addComponent(playerEntity, 'Velocity', Components.Velocity(0, 0));
    em.addComponent(playerEntity, 'PlayerControlled', Components.PlayerControlled(300));
    em.addComponent(playerEntity, 'Collider', Components.Collider(20, 'player'));
    em.addComponent(playerEntity, 'Health', Components.Health(100));
    em.addComponent(playerEntity, 'Weapon', {
        fireRate: 0.2,
        timeSinceLastShot: 0,
        bulletSpeed: 800,
        damage: 25,
        currentAmmo: 30,
        maxAmmo: 30
    });
    em.addComponent(playerEntity, 'Renderable', Components.Renderable('#444466', 20, 'circle'));
}

function showMenu() {
    document.getElementById('main-menu')?.classList.remove('hidden');
    document.getElementById('hud')?.classList.add('hidden');
    document.getElementById('game-over')?.classList.add('hidden');
    document.getElementById('victory')?.classList.add('hidden');
}

// ============================================
// 7. GAME LOOP PRINCIPAL
// ============================================

function gameLoop(timestamp) {
    if (!isInitialized) return;
    
    // Cálculo de Delta Time
    const deltaTime = lastTime ? (timestamp - lastTime) / 1000 : 0;
    lastTime = timestamp;
    
    // Limita delta time para evitar saltos grandes
    const dt = Math.min(deltaTime, 0.1);
    
    // Atualiza apenas se estiver jogando
    if (gameState.current === STATES.PLAYING) {
        update(dt);
    }
    
    // Renderiza sempre
    render();
    
    requestAnimationFrame(gameLoop);
}

function update(dt) {
    // Atualiza sistemas ECS
    inputSystem.update();
    weaponSystem.update(dt);
    enemyAISystem.update();
    movementSystem.update(dt);
    collisionSystem.update();
    combatSystem.update();
    
    // Atualiza câmera
    if (playerEntity) {
        const playerPos = em.getComponent(playerEntity, 'Position');
        if (playerPos) {
            gameFeel.update(dt, playerPos);
        }
    }
    
    // Verifica condições de vitória/derrota
    checkGameConditions();
}

function render() {
    // Limpa canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Aplica transformações de câmera
    ctx.save();
    gameFeel.applyCamera(ctx);
    
    // Renderiza mundo
    renderSystem.update();
    
    // Renderiza partículas (antes de restore para pegar transformações)
    particleSystem.updateAndRender(dt);
    
    ctx.restore();
    
    // Renderiza HUD (fixo na tela)
    hudSystem.update();
}

function checkGameConditions() {
    // Verifica vitória (todos os orbs coletados)
    if (circleManager.isCircleCompleted()) {
        const nextCircle = gameState.circle + 1;
        
        if (nextCircle <= 9) {
            // Avança para próximo círculo
            gameState.advanceCircle();
            circleManager.loadCircle(nextCircle);
        } else {
            // Vitória final
            gameState.changeState(STATES.VICTORY);
        }
    }
    
    // Verifica derrota (jogador morto)
    if (playerEntity) {
        const health = em.getComponent(playerEntity, 'Health');
        if (health && health.current <= 0) {
            gameState.changeState(STATES.GAME_OVER);
        }
    }
}

// ============================================
// 8. INICIALIZAÇÃO
// ============================================

// Inicia o jogo quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', initGame);

// Exporta para debug global
window.gameDebug = {
    gameState,
    audioSystem,
    particleSystem,
    gameFeel,
    circleManager,
    bulletPool,
    enemyPool,
    forceEmitParticles: () => particleSystem.forceEmit(100),
    addTrauma: (amount) => gameFeel.addTrauma(amount),
    unlockAudio: () => audioSystem.forceUnlock(),
    getMetrics: () => ({
        audio: audioSystem.getMetrics(),
        particles: particleSystem.getMetrics(),
        pools: {
            bullets: bulletPool.getStats(),
            enemies: enemyPool.getStats()
        }
    })
};
