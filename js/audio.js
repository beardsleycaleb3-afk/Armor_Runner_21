/**
 * Audio Module - Sound Effects using Web Audio API
 * Creates synthesized sound effects for game events
 * No audio files needed - all sounds generated dynamically
 */

class AudioModule extends GameModule {
  constructor() {
    super();
    this.audioContext = null;
    this.enabled = true;
    this.masterVolume = 0.3;
  }

  init(gameInstance) {
    super.init(gameInstance);
    
    // Initialize Audio Context on first user interaction
    if (!this.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      try {
        this.audioContext = new AudioContext();
      } catch (e) {
        console.warn('Web Audio API not supported');
        this.enabled = false;
        return;
      }
    }

    // Register event listeners
    this.gameInstance.modules.addEventListener('onCollectible', () => this.playCollectSound());
    this.gameInstance.modules.addEventListener('onObstacleHit', () => this.playHitSound());
    this.gameInstance.modules.addEventListener('onGameStart', () => this.playStartSound());
    this.gameInstance.modules.addEventListener('onChapterComplete', () => this.playVictorySound());
    this.gameInstance.modules.addEventListener('onPowerUpCollected', (powerup) => this.playPowerUpSound(powerup));
  }

  /**
   * Play collect sound - bright beep
   */
  playCollectSound() {
    if (!this.enabled || !this.audioContext) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Create oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Bright ascending tone
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    
    gain.gain.setValueAtTime(this.masterVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Play hit sound - low thud with buzz
   */
  playHitSound() {
    if (!this.enabled || !this.audioContext) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Main hit tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    
    gain1.gain.setValueAtTime(this.masterVolume * 0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc1.start(now);
    osc1.stop(now + 0.2);
    
    // Noise component (white noise buzz)
    const bufferSize = ctx.sampleRate * 0.15;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const noiseGain = ctx.createGain();
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    noise.start(now);
  }

  /**
   * Play start sound - ascending tones
   */
  playStartSound() {
    if (!this.enabled || !this.audioContext) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const frequencies = [392, 523, 659]; // G4, C5, E5
    
    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const startTime = now + (index * 0.1);
      
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(this.masterVolume * 0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
      
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  /**
   * Play victory sound - ascending fanfare
   */
  playVictorySound() {
    if (!this.enabled || !this.audioContext) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const notes = [
      { freq: 523, time: 0 },    // C5
      { freq: 659, time: 0.15 },  // E5
      { freq: 784, time: 0.3 },   // G5
      { freq: 1047, time: 0.45 }, // C6
    ];
    
    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const startTime = now + note.time;
      
      osc.frequency.setValueAtTime(note.freq, startTime);
      gain.gain.setValueAtTime(this.masterVolume * 0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  /**
   * Play power-up sound - special effect based on type
   */
  playPowerUpSound(powerup) {
    if (!this.enabled || !this.audioContext) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const sounds = {
      shield: () => this.playTone([440, 550, 660], 0.1, 0.2),
      speed: () => this.playTone([880, 1000], 0.05, 0.15),
      magnet: () => this.playTone([440, 440, 440], 0.08, 0.12),
    };
    
    const soundFunc = sounds[powerup.type] || sounds.shield;
    soundFunc();
  }

  /**
   * Helper to play tone sequences
   */
  playTone(frequencies, duration, total) {
    if (!this.audioContext) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const startTime = now + (i * duration);
      
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(this.masterVolume * 0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  /**
   * Toggle audio on/off
   */
  toggleAudio() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(level) {
    this.masterVolume = Math.max(0, Math.min(1, level));
  }

  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
