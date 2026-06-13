// Super Dash Audio Synthesizer using Web Audio API
class AudioSynth {
  constructor() {
    this.ctx = null;
    this.musicVolumeNode = null;
    this.sfxVolumeNode = null;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.isPlayingMusic = false;
    this.tempo = 130; // BPM
    this.sequencerTimer = null;
    this.currentStep = 0;
    this.bassNotes = [55.00, 65.41, 48.99, 43.65]; // A1, C2, G1, F1 (frequencies)
    this.melodyNotes = [110, 130.81, 146.83, 164.81, 196.00, 220, 261.63, 293.66, 329.63, 392.00]; // Pentatonic A minor
    this.melodyPatterns = [
      [0, -1, 3, 5, -1, 4, 3, -1],
      [7, 6, 5, 4, 5, 7, 8, 9],
      [0, 2, 3, -1, 4, -1, 3, 2],
      [-1, -1, 7, -1, 5, -1, 4, 3]
    ];
    this.currentPatternIndex = 0;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    
    this.ctx = new AudioContextClass();
    
    // Setup volume nodes
    this.musicVolumeNode = this.ctx.createGain();
    this.sfxVolumeNode = this.ctx.createGain();
    
    this.musicVolumeNode.gain.setValueAtTime(0.25, this.ctx.currentTime);
    this.sfxVolumeNode.gain.setValueAtTime(0.4, this.ctx.currentTime);
    
    this.musicVolumeNode.connect(this.ctx.destination);
    this.sfxVolumeNode.connect(this.ctx.destination);
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // SOUND EFFECTS
  playJump() {
    if (!this.sfxEnabled) return;
    this.resume();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    // Exponential sweep up for the jump feel
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.sfxVolumeNode);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  playCrash() {
    if (!this.sfxEnabled) return;
    this.resume();
    if (!this.ctx) return;

    // Create explosion noise using noise buffer
    const bufferSize = this.ctx.sampleRate * 0.4; // 0.4 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Filter to make it a deep, crunchy explosion
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.35);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.38);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxVolumeNode);
    
    noise.start();
    noise.stop(this.ctx.currentTime + 0.4);

    // Add a low sine boom for extra bass
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.frequency.setValueAtTime(120, this.ctx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);
    subGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    subOsc.connect(subGain);
    subGain.connect(this.sfxVolumeNode);
    subOsc.start();
    subOsc.stop(this.ctx.currentTime + 0.3);
  }

  playPad() {
    if (!this.sfxEnabled) return;
    this.resume();
    if (!this.ctx) return;

    // Higher pitch sci-fi chime
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.sfxVolumeNode);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  playWin() {
    if (!this.sfxEnabled) return;
    this.resume();
    if (!this.ctx) return;

    // A beautiful major arpeggio chord progression
    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major notes
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.5, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.4);
      
      osc.connect(gain);
      gain.connect(this.sfxVolumeNode);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });
  }

  // PROCEDURAL MUSIC GENERATOR
  startMusic(levelIndex = 0) {
    this.resume();
    if (!this.musicEnabled) return;
    if (this.isPlayingMusic) return;
    if (!this.ctx) return;

    this.isPlayingMusic = true;
    this.currentStep = 0;
    
    // Adjust tempo based on level
    this.tempo = 135 + levelIndex * 10;
    this.currentPatternIndex = levelIndex % this.melodyPatterns.length;
    
    const stepDuration = 60 / this.tempo / 4; // Sixteenth note duration
    let nextNoteTime = this.ctx.currentTime + 0.05;

    const scheduler = () => {
      if (!this.isPlayingMusic) return;
      while (nextNoteTime < this.ctx.currentTime + 0.1) {
        this.scheduleStep(this.currentStep, nextNoteTime);
        nextNoteTime += stepDuration;
        this.currentStep = (this.currentStep + 1) % 16;
      }
      this.sequencerTimer = setTimeout(scheduler, 25);
    };

    scheduler();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.sequencerTimer) {
      clearTimeout(this.sequencerTimer);
      this.sequencerTimer = null;
    }
  }

  scheduleStep(step, time) {
    if (!this.musicEnabled || !this.isPlayingMusic) return;

    // 1. Kick Drum (On beats 1, 5, 9, 13)
    if (step % 4 === 0) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      
      kickOsc.frequency.setValueAtTime(150, time);
      kickOsc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);
      
      kickGain.gain.setValueAtTime(1.0, time);
      kickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
      
      kickOsc.connect(kickGain);
      kickGain.connect(this.musicVolumeNode);
      
      kickOsc.start(time);
      kickOsc.stop(time + 0.16);
    }

    // 2. Closed Hi-Hat (On steps 2, 6, 10, 14 or 4, 8, 12, 16)
    if (step % 2 === 1 || step % 4 === 2) {
      // Noise hat
      const hatSize = this.ctx.sampleRate * 0.03;
      const hatBuffer = this.ctx.createBuffer(1, hatSize, this.ctx.sampleRate);
      const data = hatBuffer.getChannelData(0);
      for (let i = 0; i < hatSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const hatSource = this.ctx.createBufferSource();
      hatSource.buffer = hatBuffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, time);
      
      const hatGain = this.ctx.createGain();
      hatGain.gain.setValueAtTime(0.08, time);
      hatGain.gain.exponentialRampToValueAtTime(0.01, time + 0.03);
      
      hatSource.connect(filter);
      filter.connect(hatGain);
      hatGain.connect(this.musicVolumeNode);
      
      hatSource.start(time);
      hatSource.stop(time + 0.04);
    }

    // 3. Bassline (Simple low sawtooth pluck)
    if (step % 2 === 0) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFilter = this.ctx.createBiquadFilter();

      bassOsc.type = 'sawtooth';
      
      const chordIndex = Math.floor(step / 4) % 4;
      const baseFreq = this.bassNotes[chordIndex];
      const noteFreq = (step % 8 === 0) ? baseFreq : baseFreq * 1.5;
      
      bassOsc.frequency.setValueAtTime(noteFreq, time);
      
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(400, time);
      bassFilter.frequency.exponentialRampToValueAtTime(100, time + 0.12);

      bassGain.gain.setValueAtTime(0.2, time);
      bassGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.musicVolumeNode);

      bassOsc.start(time);
      bassOsc.stop(time + 0.16);
    }

    // 4. Lead Melody (Slightly distorted square wave pluck)
    const pattern = this.melodyPatterns[this.currentPatternIndex];
    const noteIdx = pattern[step % pattern.length];
    
    if (noteIdx !== -1 && noteIdx !== undefined) {
      const melodyFreq = this.melodyNotes[noteIdx];
      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();
      const leadFilter = this.ctx.createBiquadFilter();

      leadOsc.type = 'square';
      leadOsc.frequency.setValueAtTime(melodyFreq, time);

      leadFilter.type = 'lowpass';
      leadFilter.frequency.setValueAtTime(1200, time);
      leadFilter.frequency.exponentialRampToValueAtTime(300, time + 0.18);

      leadGain.gain.setValueAtTime(0.06, time);
      leadGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

      leadOsc.connect(leadFilter);
      leadFilter.connect(leadGain);
      leadGain.connect(this.musicVolumeNode);

      leadOsc.start(time);
      leadOsc.stop(time + 0.22);
    }
  }

  setMusicVolume(vol) {
    if (this.musicVolumeNode) {
      this.musicVolumeNode.gain.setValueAtTime(vol * 0.25, this.ctx.currentTime);
    }
  }

  setSFXVolume(vol) {
    if (this.sfxVolumeNode) {
      this.sfxVolumeNode.gain.setValueAtTime(vol * 0.4, this.ctx.currentTime);
    }
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }
}

// Global single instance export (or global window access)
window.audioSynth = new AudioSynth();