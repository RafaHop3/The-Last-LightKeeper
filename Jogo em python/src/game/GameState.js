/**
 * THE LAST LIGHTKEEPER - Game State Machine
 * Finite State Machine (FSM) for game flow management
 * Implements ES6 private fields (#) for cyber security
 */

// Freeze the object to prevent runtime state injection
export const STATES = Object.freeze({
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
    VICTORY: 'VICTORY',
    CINEMATIC: 'CINEMATIC',
    LOADING: 'LOADING',
    INSTRUCTIONS: 'INSTRUCTIONS'
});

export class GameState {
    // # makes variables natively private in V8 engine (DevTools protection)
    #currentState;
    #currentCircle;
    #observers;
    #stateHistory;
    #lastStateChange;
    #transitionRules;
    #gameData;

    constructor() {
        this.#currentState = STATES.MENU;
        this.#currentCircle = 1;
        this.#observers = [];
        this.#stateHistory = [];
        this.#lastStateChange = performance.now();
        this.#gameData = {
            score: 0,
            orbsCollected: 0,
            totalOrbs: 10,
            lightLevel: 100,
            playerHealth: 100,
            timeElapsed: 0,
            startTime: 0
        };
        
        this.#initializeTransitionRules();
    }

    // Public getters (read-only)
    get current() { return this.#currentState; }
    get circle() { return this.#currentCircle; }
    get gameData() { return { ...this.#gameData }; } // Return copy for security
    get stateHistory() { return [...this.#stateHistory]; }
    get lastStateChange() { return this.#lastStateChange; }

    /**
     * Core state transition engine with security validation
     * @param {string} newState - Target state
     * @param {Object} options - Transition options
     */
    changeState(newState, options = {}) {
        // Security validation (State Spoofing Prevention)
        if (!this.#isValidTransition(this.#currentState, newState)) {
            console.warn(`[Security] Illegal state transition blocked: ${this.#currentState} → ${newState}`);
            return false;
        }

        // Additional security checks
        if (!this.#validateStateTransition(newState, options)) {
            console.warn(`[Security] State transition validation failed: ${newState}`);
            return false;
        }

        // Record state change for audit trail
        this.#recordStateChange(this.#currentState, newState);

        // Execute state transition
        const previousState = this.#currentState;
        this.#currentState = newState;
        this.#lastStateChange = performance.now();

        // Execute transition side effects
        this.#executeTransitionSideEffects(previousState, newState, options);

        // Notify observers (UI, systems, etc.)
        this.#notifyObservers();

        return true;
    }

    /**
     * Initialize security transition rules
     */
    #initializeTransitionRules() {
        this.#transitionRules = {
            [STATES.MENU]: [STATES.PLAYING, STATES.INSTRUCTIONS, STATES.LOADING],
            [STATES.PLAYING]: [STATES.PAUSED, STATES.GAME_OVER, STATES.VICTORY, STATES.CINEMATIC],
            [STATES.PAUSED]: [STATES.PLAYING, STATES.MENU],
            [STATES.GAME_OVER]: [STATES.MENU, STATES.PLAYING],
            [STATES.VICTORY]: [STATES.MENU, STATES.CINEMATIC],
            [STATES.CINEMATIC]: [STATES.MENU, STATES.PLAYING],
            [STATES.LOADING]: [STATES.PLAYING, STATES.MENU],
            [STATES.INSTRUCTIONS]: [STATES.MENU]
        };
    }

    /**
     * Validate if transition is allowed
     * @param {string} fromState - Current state
     * @param {string} toState - Target state
     * @returns {boolean} - True if transition is valid
     */
    #isValidTransition(fromState, toState) {
        const allowedTransitions = this.#transitionRules[fromState];
        return allowedTransitions && allowedTransitions.includes(toState);
    }

    /**
     * Additional validation for state transitions
     * @param {string} newState - Target state
     * @param {Object} options - Transition options
     * @returns {boolean} - True if validation passes
     */
    #validateStateTransition(newState, options) {
        // Prevent rapid state switching (potential exploit)
        const timeSinceLastChange = performance.now() - this.#lastStateChange;
        if (timeSinceLastChange < 100 && !options.force) { // 100ms cooldown
            console.warn('[Security] Rapid state switching detected');
            return false;
        }

        // Validate circle progression
        if (newState === STATES.VICTORY && this.#currentCircle < 9) {
            console.warn('[Security] Victory state requires completing all circles');
            return false;
        }

        // Validate game data consistency
        if (newState === STATES.PLAYING && this.#gameData.playerHealth <= 0) {
            console.warn('[Security] Cannot start playing with dead player');
            return false;
        }

        return true;
    }

    /**
     * Record state change for security audit
     * @param {string} fromState - Previous state
     * @param {string} toState - New state
     */
    #recordStateChange(fromState, toState) {
        const changeRecord = {
            from: fromState,
            to: toState,
            timestamp: performance.now(),
            circle: this.#currentCircle,
            gameData: { ...this.#gameData }
        };

        this.#stateHistory.push(changeRecord);

        // Keep only recent history (last 50 changes)
        if (this.#stateHistory.length > 50) {
            this.#stateHistory = this.#stateHistory.slice(-50);
        }
    }

    /**
     * Execute side effects for state transitions
     * @param {string} previousState - Previous state
     * @param {string} newState - New state
     * @param {Object} options - Transition options
     */
    #executeTransitionSideEffects(previousState, newState, options) {
        switch (newState) {
            case STATES.PLAYING:
                if (previousState === STATES.MENU) {
                    this.#gameData.startTime = performance.now();
                    this.#gameData.score = 0;
                    this.#gameData.orbsCollected = 0;
                    this.#gameData.lightLevel = 100;
                    this.#gameData.playerHealth = 100;
                }
                break;

            case STATES.GAME_OVER:
                this.#gameData.timeElapsed = performance.now() - this.#gameData.startTime;
                break;

            case STATES.VICTORY:
                this.#gameData.timeElapsed = performance.now() - this.#gameData.startTime;
                break;

            case STATES.MENU:
                // Reset game data when returning to menu
                if (previousState !== STATES.INSTRUCTIONS) {
                    this.#currentCircle = 1;
                    this.#resetGameData();
                }
                break;
        }
    }

    /**
     * Advance to next circle with validation
     */
    advanceCircle() {
        if (this.#currentState !== STATES.PLAYING) {
            console.warn('[GameState] Cannot advance circle while not playing');
            return false;
        }

        if (this.#currentCircle < 9) {
            this.#currentCircle++;
            this.#notifyObservers();
            return true;
        } else {
            this.changeState(STATES.VICTORY);
            return false;
        }
    }

    /**
     * Set specific circle (for debugging/testing only)
     * @param {number} circle - Target circle (1-9)
     */
    setCircle(circle) {
        if (circle < 1 || circle > 9) {
            console.warn('[GameState] Invalid circle number:', circle);
            return false;
        }

        if (this.#currentState !== STATES.PLAYING) {
            console.warn('[GameState] Can only set circle during PLAYING state');
            return false;
        }

        this.#currentCircle = circle;
        this.#notifyObservers();
        return true;
    }

    /**
     * Reset game to initial state
     */
    resetGame() {
        this.#currentCircle = 1;
        this.#resetGameData();
        this.changeState(STATES.PLAYING);
    }

    /**
     * Reset game data to defaults
     */
    #resetGameData() {
        this.#gameData = {
            score: 0,
            orbsCollected: 0,
            totalOrbs: 10,
            lightLevel: 100,
            playerHealth: 100,
            timeElapsed: 0,
            startTime: performance.now()
        };
    }

    /**
     * Update game data (secure validation)
     * @param {string} key - Data key
     * @param {*} value - New value
     */
    updateGameData(key, value) {
        if (!this.#gameData.hasOwnProperty(key)) {
            console.warn('[GameState] Invalid game data key:', key);
            return false;
        }

        // Validate data types and ranges
        if (!this.#validateGameDataValue(key, value)) {
            console.warn('[GameState] Invalid game data value:', key, value);
            return false;
        }

        this.#gameData[key] = value;
        this.#notifyObservers();
        return true;
    }

    /**
     * Validate game data values
     * @param {string} key - Data key
     * @param {*} value - Value to validate
     * @returns {boolean} - True if valid
     */
    #validateGameDataValue(key, value) {
        switch (key) {
            case 'score':
            case 'orbsCollected':
            case 'totalOrbs':
            case 'timeElapsed':
                return typeof value === 'number' && value >= 0;
            
            case 'lightLevel':
            case 'playerHealth':
                return typeof value === 'number' && value >= 0 && value <= 100;
            
            case 'startTime':
                return typeof value === 'number' && value > 0;
            
            default:
                return false;
        }
    }

    /**
     * Get current game metrics
     * @returns {Object} - Game metrics
     */
    getMetrics() {
        const now = performance.now();
        return {
            currentState: this.#currentState,
            currentCircle: this.#currentCircle,
            timeInCurrentState: now - this.#lastStateChange,
            totalPlayTime: this.#currentState === STATES.PLAYING ? 
                now - this.#gameData.startTime : this.#gameData.timeElapsed,
            stateTransitions: this.#stateHistory.length,
            gameData: { ...this.#gameData }
        };
    }

    // --- Observer Pattern for Decoupled UI ---
    
    /**
     * Subscribe to state changes
     * @param {Function} callback - Callback function
     */
    subscribe(callback) {
        if (typeof callback !== 'function') {
            throw new Error('[GameState] Observer callback must be a function');
        }

        this.#observers.push(callback);
        
        // Immediately notify with current state
        callback(this.#currentState, this.#currentCircle, { ...this.#gameData });
        
        // Return unsubscribe function
        return () => {
            const index = this.#observers.indexOf(callback);
            if (index > -1) {
                this.#observers.splice(index, 1);
            }
        };
    }

    /**
     * Notify all observers of state change
     */
    #notifyObservers() {
        for (const observer of this.#observers) {
            try {
                // Pass copies, never references to internal objects
                observer(this.#currentState, this.#currentCircle, { ...this.#gameData });
            } catch (error) {
                console.error('[GameState] Observer error:', error);
            }
        }
    }

    /**
     * Get security audit information
     * @returns {Object} - Security audit data
     */
    getSecurityAudit() {
        return {
            currentState: this.#currentState,
            currentCircle: this.#currentCircle,
            stateHistory: [...this.#stateHistory],
            lastStateChange: this.#lastStateChange,
            observerCount: this.#observers.length,
            transitionRules: { ...this.#transitionRules }
        };
    }

    /**
     * Check if state is secure (no rapid transitions)
     * @returns {boolean} - True if state appears secure
     */
    isSecure() {
        const now = performance.now();
        const recentChanges = this.#stateHistory.filter(
            change => now - change.timestamp < 5000 // Last 5 seconds
        );
        
        // Too many state changes in short time = potential exploit
        return recentChanges.length < 10;
    }

    /**
     * Force state change (for emergency/debug only)
     * @param {string} newState - Target state
     */
    forceState(newState) {
        console.warn('[GameState] Forcing state change - DEBUG ONLY');
        this.#recordStateChange(this.#currentState, newState);
        this.#currentState = newState;
        this.#lastStateChange = performance.now();
        this.#notifyObservers();
    }
}
