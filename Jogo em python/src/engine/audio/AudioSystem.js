/**
 * THE LAST LIGHTKEEPER - Audio System
 * Professional Web Audio API implementation with spatial audio and autoplay bypass
 * Features PCM buffer caching, stereo panning, and crossfade transitions
 */

export class AudioSystem {
    constructor() {
        // Initialize Web Audio API (cross-browser compatible)
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // Cache of decoded buffers in RAM (Our Audio Pool)
        this.buffers = new Map();
        this.loadingPromises = new Map();

        // Master Gain Nodes (Separate mixing channels)
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.connect(this.ctx.destination);
        this.bgmGain.gain.value = 0.5; // Default music volume

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.connect(this.ctx.destination);
        this.sfxGain.gain.value = 0.8; // Default SFX volume

        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);

        // Reconnect through master gain for global control
        this.bgmGain.disconnect();
        this.sfxGain.disconnect();
        this.bgmGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);

        this.bgmSource = null;
        this.isUnlocked = false;

        // Performance tracking
        this.metrics = {
            soundsPlayed: 0,
            averageLatency: 0,
            bufferCount: 0,
            unlockTime: 0
        };

        // Setup autoplay bypass
        this._setupUnlock();
    }

    /**
     * 🔓 AUTOPLAY POLICY CIRCUMVENTION
     * Bypass browser autoplay blocking policies
     */
    _setupUnlock() {
        const unlock = () => {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().then(() => {
                    this.isUnlocked = true;
                    this.metrics.unlockTime = performance.now();
                    console.log('[AudioSystem] 🔊 AudioContext unlocked by user.');

                    // Play silent sound to fully unlock some browsers
                    const silentSource = this.ctx.createBufferSource();
                    const silentBuffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
                    silentSource.buffer = silentBuffer;
                    silentSource.connect(this.ctx.destination);
                    silentSource.start(0);
                    silentSource.stop(0.01);
                }).catch(error => {
                    console.error('[AudioSystem] Failed to unlock AudioContext:', error);
                });
            }

            // Clean up listeners after first interaction to save CPU
            ['click', 'keydown', 'touchstart', 'mousedown'].forEach(evt =>
                document.removeEventListener(evt, unlock)
            );
        };

        // Multiple event types for maximum compatibility
        ['click', 'keydown', 'touchstart', 'mousedown'].forEach(evt =>
            document.addEventListener(evt, unlock, { once: true })
        );
    }

    /**
     * 📥 ASYNCHRONOUS ASSET LOADING
     * Load and decode audio files to RAM cache
     * @param {string} id - Audio identifier
     * @param {string} url - Audio file URL
     * @returns {Promise} - Loading promise
     */
    async loadSound(id, url) {
        // Check if already loading
        if (this.loadingPromises.has(id)) {
            return this.loadingPromises.get(id);
        }

        // Check if already loaded
        if (this.buffers.has(id)) {
            return Promise.resolve(this.buffers.get(id));
        }

        const loadPromise = this._loadAndDecode(id, url);
        this.loadingPromises.set(id, loadPromise);

        return loadPromise;
    }

    /**
     * Internal method to load and decode audio
     * @param {string} id - Audio identifier
     * @param {string} url - Audio file URL
     * @returns {Promise} - Loading promise
     */
    async _loadAndDecode(id, url) {
        try {
            const startTime = performance.now();

            const response = await fetch(url).catch(() => null);
            if (!response || !response.ok) {
                console.warn(`[AudioSystem] Missing audio file ${id} at ${url}. Creating silent buffer.`);
                return this.#createSilentBuffer(id);
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer).catch((e) => {
                console.warn(`[AudioSystem] Could not decode ${id}. Creating silent buffer. Error:`, e.message);
                return this.#createSilentBuffer(id);
            });

            this.buffers.set(id, audioBuffer);
            this.loadingPromises.delete(id);
            this.metrics.bufferCount++;

            const loadTime = performance.now() - startTime;
            console.log(`[AudioSystem] Loaded ${id} in ${loadTime.toFixed(2)}ms`);

            return audioBuffer;
        } catch (error) {
            this.loadingPromises.delete(id);
            console.warn(`[AudioSystem] Gracefully failed to load audio (${id}), creating silent fallback:`, error.message);
            return this.#createSilentBuffer(id);
        }
    }

    /**
     * Creates a dummy silent buffer to prevent game crashes from missing audio assets
     * @param {string} id - Audio identifier
     */
    #createSilentBuffer(id) {
        // Create 1 second of silence
        const silentBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
        this.buffers.set(id, silentBuffer);
        this.loadingPromises.delete(id);
        return silentBuffer;
    }

    /**
     * 🔫 SOUND EFFECTS FIRING (WITH GAME FEEL AND 2D PANNING)
     * Play instant sound effects with spatial positioning
     * @param {string} id - Sound identifier
     * @param {Object} options - Playback options
     */
    playSFX(id, options = {}) {
        const startTime = performance.now();

        if (!this.isUnlocked || !this.buffers.has(id)) {
            return null;
        }

        // Default options
        const {
            volume = 1.0,
            pitchRandomization = 0.1, // 10% pitch variation to avoid repetition
            panX = 0, // -1.0 (Left) to 1.0 (Right)
            pitch = 1.0,
            loop = false
        } = options;

        try {
            // 1. Create lightweight audio source (disposable)
            const source = this.ctx.createBufferSource();
            source.buffer = this.buffers.get(id);
            source.loop = loop;

            // 2. Apply Pitch variation (Game Feel)
            let finalPitch = pitch;
            if (pitchRandomization > 0) {
                const pitchShift = 1.0 + (Math.random() * pitchRandomization * 2 - pitchRandomization);
                finalPitch = Math.max(0.1, pitchShift); // Prevent mathematical errors
            }
            source.playbackRate.value = finalPitch;

            // 3. Local Volume Control
            const localGain = this.ctx.createGain();
            localGain.gain.value = Math.max(0, Math.min(1, volume));

            // 4. 2D Spatial Audio (Stereo Panner)
            // If entity is on left side of screen, sound comes from left headphone
            const panner = this.ctx.createStereoPanner();
            panner.pan.value = Math.max(-1, Math.min(1, panX));

            // 5. Audio Graph Routing: Source -> Panner -> Gain -> Master SFX
            source.connect(panner);
            panner.connect(localGain);
            localGain.connect(this.sfxGain);

            source.start(0);

            // Update metrics
            this.metrics.soundsPlayed++;
            const latency = performance.now() - startTime;
            this.metrics.averageLatency = (this.metrics.averageLatency * 0.9) + (latency * 0.1);

            return source;
        } catch (error) {
            console.error(`[AudioSystem] Failed to play SFX (${id}):`, error);
            return null;
        }
    }

    /**
     * 🎼 BACKGROUND MUSIC (BGM)
     * Play background music with smooth crossfade transitions
     * @param {string} id - Music identifier
     * @param {number} crossfadeTime - Crossfade duration in seconds
     * @param {number} targetVolume - Target volume (0-1)
     */
    playBGM(id, crossfadeTime = 2.0, targetVolume = 0.5) {
        if (!this.isUnlocked || !this.buffers.has(id)) {
            return null;
        }

        // Smooth fade out of current music
        if (this.bgmSource) {
            const oldSource = this.bgmSource;
            this.bgmGain.gain.setTargetAtTime(0, this.ctx.currentTime, crossfadeTime / 4);

            setTimeout(() => {
                try {
                    oldSource.stop();
                    oldSource.disconnect();
                } catch (e) {
                    // Source might already be stopped
                }
            }, crossfadeTime * 1000);
        }

        // Start new music
        try {
            this.bgmSource = this.ctx.createBufferSource();
            this.bgmSource.buffer = this.buffers.get(id);
            this.bgmSource.loop = true;

            this.bgmSource.connect(this.bgmGain);
            this.bgmSource.start(0);

            // Smooth fade in
            this.bgmGain.gain.setValueAtTime(0, this.ctx.currentTime);
            this.bgmGain.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, crossfadeTime / 4);

            return this.bgmSource;
        } catch (error) {
            console.error(`[AudioSystem] Failed to play BGM (${id}):`, error);
            return null;
        }
    }

    /**
     * Stop background music with optional fade out
     * @param {number} fadeOutTime - Fade out duration in seconds
     */
    stopBGM(fadeOutTime = 0) {
        if (this.bgmSource) {
            if (fadeOutTime > 0) {
                this.bgmGain.gain.setTargetAtTime(0, this.ctx.currentTime, fadeOutTime / 4);

                setTimeout(() => {
                    try {
                        this.bgmSource.stop();
                        this.bgmSource.disconnect();
                        this.bgmSource = null;
                    } catch (e) {
                        // Source might already be stopped
                    }
                }, fadeOutTime * 1000);
            } else {
                try {
                    this.bgmSource.stop();
                    this.bgmSource.disconnect();
                    this.bgmSource = null;
                } catch (e) {
                    // Source might already be stopped
                }
            }
        }
    }

    /**
     * Set master volume
     * @param {number} volume - Master volume (0-1)
     */
    setMasterVolume(volume) {
        this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }

    /**
     * Set SFX volume
     * @param {number} volume - SFX volume (0-1)
     */
    setSFXVolume(volume) {
        this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
    }

    /**
     * Set BGM volume
     * @param {number} volume - BGM volume (0-1)
     */
    setBGMVolume(volume) {
        this.bgmGain.gain.value = Math.max(0, Math.min(1, volume));
    }

    /**
     * Mute/unmute all audio
     * @param {boolean} muted - Whether to mute
     */
    setMuted(muted) {
        this.masterGain.gain.value = muted ? 0 : 1;
    }

    /**
     * Check if audio system is unlocked
     * @returns {boolean} - True if unlocked
     */
    isAudioUnlocked() {
        return this.isUnlocked;
    }

    /**
     * Get audio context state
     * @returns {string} - Audio context state
     */
    getContextState() {
        return this.ctx.state;
    }

    /**
     * Load multiple sounds at once
     * @param {Object} soundMap - Map of id -> url
     * @returns {Promise} - Loading promise
     */
    async loadSounds(soundMap) {
        const promises = Object.entries(soundMap).map(([id, url]) =>
            this.loadSound(id, url).catch(error => {
                console.error(`Failed to load ${id}:`, error);
                return null;
            })
        );

        return Promise.allSettled(promises);
    }

    /**
     * Get loading progress
     * @returns {number} - Progress (0-1)
     */
    getLoadingProgress() {
        const total = this.loadingPromises.size + this.buffers.size;
        const loaded = this.buffers.size;
        return total > 0 ? loaded / total : 0;
    }

    /**
     * Get performance metrics
     * @returns {Object} - Performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            contextState: this.ctx.state,
            sampleRate: this.ctx.sampleRate,
            bufferSize: this.ctx.baseLatency
        };
    }

    /**
     * Force unlock audio context (for testing)
     */
    async forceUnlock() {
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
            this.isUnlocked = true;
            this.metrics.unlockTime = performance.now();
        }
    }

    /**
     * Pause all audio
     */
    pause() {
        if (this.ctx.state === 'running') {
            this.ctx.suspend();
        }
    }

    /**
     * Resume all audio
     */
    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Destroy audio system and clean up resources
     */
    destroy() {
        // Stop all sounds
        this.stopBGM(0);

        // Close audio context
        if (this.ctx.state !== 'closed') {
            this.ctx.close();
        }

        // Clear caches
        this.buffers.clear();
        this.loadingPromises.clear();

        console.log('[AudioSystem] Audio system destroyed');
    }
}
