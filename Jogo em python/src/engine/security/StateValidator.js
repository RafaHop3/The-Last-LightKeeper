/**
 * THE LAST LIGHTKEEPER - State Validator
 * Cyber Security module for anti-cheat and state integrity
 * Implements Delta Analysis and Type Checking for client-side protection
 */

import { VALIDATION_BOUNDS } from '../../game/config/constants.js';

export class StateValidator {
    constructor() {
        this.rules = new Map();
        this.previousStates = new Map();
        this.violations = 0;
        this.maxViolations = 3; // Tolerance threshold before intervention
        this.violationHistory = [];
        this.lastViolationTime = 0;
        this.telemetryMode = false; // Future: send to backend
    }

    /**
     * Define security boundaries for state variables
     * @param {string} key - State variable name
     * @param {Object} rule - Validation rule configuration
     */
    addRule(key, rule) {
        // Rule format: { type: 'number', min: 0, max: 100, maxDelta: 50 }
        const defaultRule = {
            type: 'number',
            min: -Infinity,
            max: Infinity,
            maxDelta: Infinity,
            strictType: true
        };
        
        this.rules.set(key, { ...defaultRule, ...rule });
    }

    /**
     * Register a validated secure state (checkpoint from previous frame)
     * @param {string} key - State variable name
     * @param {*} value - Validated value
     */
    secureState(key, value) {
        this.previousStates.set(key, {
            value: value,
            timestamp: performance.now()
        });
    }

    /**
     * Core validation engine
     * @param {string} key - State variable name
     * @param {*} newValue - New value to validate
     * @returns {boolean} - True if valid, false if violation detected
     */
    validate(key, newValue) {
        const rule = this.rules.get(key);
        if (!rule) return true; // Fail-open for untracked variables

        // 1. Type Injection Prevention (NaN/Infinity/String injection)
        if (rule.strictType && typeof newValue !== rule.type) {
            this.logViolation(key, 'TYPE_MISMATCH', {
                expected: rule.type,
                received: typeof newValue,
                value: newValue
            });
            return false;
        }

        // 2. Special NaN/Infinity checks for numbers
        if (rule.type === 'number') {
            if (isNaN(newValue)) {
                this.logViolation(key, 'NAN_INJECTION', { value: newValue });
                return false;
            }
            
            if (!isFinite(newValue)) {
                this.logViolation(key, 'INFINITY_INJECTION', { value: newValue });
                return false;
            }
        }

        // 3. Bounds Checking (God Mode / Infinite Ammo prevention)
        if (rule.min !== undefined && newValue < rule.min) {
            this.logViolation(key, 'BELOW_MINIMUM', {
                value: newValue,
                min: rule.min
            });
            return false;
        }
        
        if (rule.max !== undefined && newValue > rule.max) {
            this.logViolation(key, 'ABOVE_MAXIMUM', {
                value: newValue,
                max: rule.max
            });
            return false;
        }

        // 4. Delta Checking / Sanity Check (Teleport / Speedhack prevention)
        if (rule.maxDelta !== undefined && rule.maxDelta < Infinity) {
            const prevEntry = this.previousStates.get(key);
            if (prevEntry) {
                const delta = Math.abs(newValue - prevEntry.value);
                const timeDelta = performance.now() - prevEntry.timestamp;
                
                // Normalize delta by time to handle frame rate variations
                const normalizedDelta = timeDelta > 0 ? delta / (timeDelta / 16.67) : delta; // 60fps baseline
                
                if (normalizedDelta > rule.maxDelta) {
                    this.logViolation(key, 'IMPOSSIBLE_DELTA', {
                        delta: delta,
                        normalizedDelta: normalizedDelta,
                        maxDelta: rule.maxDelta,
                        timeDelta: timeDelta
                    });
                    return false;
                }
            }
        }

        // 5. Pattern-based anomaly detection
        if (this.detectAnomalousPattern(key, newValue)) {
            this.logViolation(key, 'ANOMALOUS_PATTERN', { value: newValue });
            return false;
        }

        // State is valid - secure it for next frame
        this.secureState(key, newValue);
        return true;
    }

    /**
     * Validate complete sensitive game state snapshot
     * @param {Object} currentStateSnapshot - Current game state
     * @returns {boolean} - True if all states are valid
     */
    validateAll(currentStateSnapshot) {
        let violationsThisFrame = 0;
        
        for (const [key, value] of Object.entries(currentStateSnapshot)) {
            if (!this.validate(key, value)) {
                violationsThisFrame++;
                this.violations++;
                
                // Check if we've exceeded tolerance
                if (this.violations >= this.maxViolations) {
                    this.triggerAntiCheat(key, 'VIOLATION_THRESHOLD_EXCEEDED');
                    return false;
                }
            }
        }
        
        // Gradual penalty reduction for clean frames (prevents false positives from lag)
        if (violationsThisFrame === 0) {
            this.violations = Math.max(0, this.violations - 0.05);
        }
        
        return true;
    }

    /**
     * Detect anomalous patterns in state changes
     * @param {string} key - State variable name
     * @param {*} value - Current value
     * @returns {boolean} - True if anomaly detected
     */
    detectAnomalousPattern(key, value) {
        const history = this.violationHistory.filter(v => v.key === key);
        
        // Check for rapid oscillation (cheat engine pattern)
        if (history.length >= 3) {
            const recent = history.slice(-3);
            const oscillations = recent.reduce((count, violation, index) => {
                if (index === 0) return count;
                const prevValue = recent[index - 1].value;
                const currValue = violation.value;
                return count + (Math.sign(currValue - prevValue) !== Math.sign(value - currValue) ? 1 : 0);
            }, 0);
            
            if (oscillations >= 2) {
                return true; // Rapid value switching detected
            }
        }
        
        return false;
    }

    /**
     * Log security violation for telemetry
     * @param {string} key - State variable name
     * @param {string} type - Violation type
     * @param {Object} details - Violation details
     */
    logViolation(key, type, details) {
        const violation = {
            key,
            type,
            details,
            timestamp: performance.now(),
            userAgent: navigator.userAgent,
            sessionId: this.getSessionId()
        };
        
        this.violationHistory.push(violation);
        
        // Keep only recent violations (last 100)
        if (this.violationHistory.length > 100) {
            this.violationHistory = this.violationHistory.slice(-100);
        }
        
        // Console warning for development
        if (process?.env?.NODE_ENV !== 'production') {
            console.warn(`[Security] ${type} in ${key}:`, details);
        }
        
        // Future: Send to telemetry backend
        if (this.telemetryMode) {
            this.sendTelemetry(violation);
        }
        
        this.lastViolationTime = performance.now();
    }

    /**
     * Trigger anti-cheat response
     * @param {string} reason - Trigger reason
     * @param {string} details - Additional details
     */
    triggerAntiCheat(reason, details = '') {
        // In real architecture, send silent telemetry to backend here
        // In client-side context, force game loop termination with fatal error
        
        const errorDetails = {
            reason,
            details,
            violations: this.violations,
            violationHistory: this.violationHistory.slice(-10), // Last 10 violations
            timestamp: performance.now()
        };
        
        // Clear sensitive data before throwing
        this.clearSensitiveData();
        
        // Fatal error stops game execution
        throw new Error(`ERR_STATE_CORRUPTION: ${reason}. Game integrity compromised.`);
    }

    /**
     * Get session identifier for tracking
     * @returns {string} - Session ID
     */
    getSessionId() {
        // Simple session ID generation (in production, use proper session management)
        if (!this._sessionId) {
            this._sessionId = Math.random().toString(36).substr(2, 9);
        }
        return this._sessionId;
    }

    /**
     * Send telemetry data to backend (placeholder)
     * @param {Object} violation - Violation data
     */
    sendTelemetry(violation) {
        // Placeholder for backend telemetry
        // In production: fetch('/api/security/violation', { method: 'POST', body: JSON.stringify(violation) })
    }

    /**
     * Clear sensitive data from memory
     */
    clearSensitiveData() {
        this.previousStates.clear();
        this.violationHistory = [];
        this._sessionId = null;
    }

    /**
     * Get security statistics
     * @returns {Object} - Security metrics
     */
    getStats() {
        return {
            totalViolations: this.violations,
            currentViolationCount: this.violations,
            violationHistory: this.violationHistory.length,
            lastViolationTime: this.lastViolationTime,
            rulesCount: this.rules.size
        };
    }

    /**
     * Enable/disable telemetry mode
     * @param {boolean} enabled - Telemetry state
     */
    setTelemetryMode(enabled) {
        this.telemetryMode = enabled;
    }

    /**
     * Reset validator state
     */
    reset() {
        this.violations = 0;
        this.violationHistory = [];
        this.lastViolationTime = 0;
        this.clearSensitiveData();
    }

    /**
     * Factory method for default game validator
     * @returns {StateValidator} - Configured validator instance
     */
    static createDefaultValidator() {
        const validator = new StateValidator();
        
        // Strict rules based on game physics and constraints
        validator.addRule('player_health', { 
            type: 'number', 
            min: 0, 
            max: 100,
            maxDelta: 100 // Can't heal more than 100 HP instantly
        });
        
        validator.addRule('player_x', { 
            type: 'number', 
            min: VALIDATION_BOUNDS.positionBounds.minX, 
            max: VALIDATION_BOUNDS.positionBounds.maxX, 
            maxDelta: 50 // Can't move > 50px in single frame
        });
        
        validator.addRule('player_y', { 
            type: 'number', 
            min: VALIDATION_BOUNDS.positionBounds.minY, 
            max: VALIDATION_BOUNDS.positionBounds.maxY, 
            maxDelta: 50
        });
        
        validator.addRule('score', { 
            type: 'number', 
            min: VALIDATION_BOUNDS.scoreBounds.min, 
            max: VALIDATION_BOUNDS.scoreBounds.max,
            maxDelta: 100 // Can't gain more than 100 points instantly
        });
        
        validator.addRule('orbs_collected', { 
            type: 'number', 
            min: 0, 
            max: 200, // Max orbs in all circles
            maxDelta: 1 // Can't collect more than 1 orb per frame
        });
        
        validator.addRule('light_level', { 
            type: 'number', 
            min: 0, 
            max: 100,
            maxDelta: 5 // Light can't change dramatically
        });
        
        validator.addRule('current_circle', { 
            type: 'number', 
            min: 1, 
            max: 9,
            maxDelta: 1 // Can't skip circles
        });
        
        return validator;
    }
}
