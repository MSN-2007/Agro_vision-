// Speech Synthesis and Audio Chimes for AgroVision Wearable Assistant

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;
  private rate: number = 1.0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
    if (typeof window !== 'undefined') {
      const savedRate = localStorage.getItem('agrovision_speaking_speed');
      if (savedRate) {
        const parsed = parseFloat(savedRate.replace('x', ''));
        if (!isNaN(parsed) && parsed > 0) {
          this.rate = parsed;
        }
      }
    }
  }

  /**
   * Set speaking speed using either number or string slab (0.5x, 1.0x, 1.25x, 1.5x, 2.0x)
   */
  setRate(speed: string | number) {
    const numeric = typeof speed === 'string' ? parseFloat(speed.replace('x', '')) : speed;
    if (!isNaN(numeric) && numeric > 0) {
      this.rate = numeric;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('agrovision_speaking_speed', `${numeric}x`);
        } catch {
          // Ignore storage restrictions
        }
      }
    }
  }

  getRate(): number {
    return this.rate;
  }

  getRateString(): string {
    return `${this.rate}x`;
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Speak text out loud using standard browser SpeechSynthesis
   */
  speak(text: string, onEnd?: () => void) {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    try {
      this.synth.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.rate;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      
      // Try to find a friendly natural voice
      const voices = this.synth.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      this.synth.speak(utterance);
    } catch {
      if (onEnd) onEnd();
    }
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  pauseSpeaking() {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  resumeSpeaking() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * Play futuristic wake sound for "Hey Vision"
   */
  playWakeChime() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Audio not supported or blocked by user gesture
    }
  }

  /**
   * Play camera shutter chime when smart glasses take a photo
   */
  playShutterChime() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Ignore
    }
  }

  /**
   * Play confirmation beep for saving observation / task
   */
  playSuccessChime() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      
      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      playNote(523.25, now, 0.12); // C5
      playNote(659.25, now + 0.1, 0.18); // E5
    } catch {
      // Ignore
    }
  }
}

export const speechService = new SpeechService();
