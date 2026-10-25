/**
 * HomeMind.AI Web Audio Call Synthesizer
 * Generates clear, hardware-accelerated incoming ringtones and outgoing dial ringbacks
 * with zero external assets, zero network latency, and cross-browser reliability.
 */

class CallAudioService {
  private audioCtx: AudioContext | null = null;
  private ringInterval: any = null;
  private isPlaying = false;
  private activeOscillators: OscillatorNode[] = [];
  private activeGainNodes: GainNode[] = [];

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  /**
   * Play Incoming Ringtone: Melodic harmonic chime repeated every 3 seconds
   */
  public playIncomingRingtone() {
    this.stopCallAudio();
    this.isPlaying = true;

    const playCycle = () => {
      if (!this.isPlaying) return;
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // High-clarity pleasant telephone chime sequence (D5, F#5, A5, D6)
      const notes = [
        { freq: 587.33, start: 0.00, dur: 0.18 }, // D5
        { freq: 739.99, start: 0.20, dur: 0.18 }, // F#5
        { freq: 880.00, start: 0.40, dur: 0.18 }, // A5
        { freq: 1174.66, start: 0.60, dur: 0.45 }, // D6
        // Second pulse in cycle
        { freq: 587.33, start: 1.20, dur: 0.18 }, // D5
        { freq: 739.99, start: 1.40, dur: 0.18 }, // F#5
        { freq: 880.00, start: 1.60, dur: 0.18 }, // A5
        { freq: 1174.66, start: 1.80, dur: 0.55 }, // D6
      ];

      notes.forEach(({ freq, start, dur }) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + start);

          // Gentle envelope to avoid clicks
          gain.gain.setValueAtTime(0.001, now + start);
          gain.gain.exponentialRampToValueAtTime(0.22, now + start + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + start);
          osc.stop(now + start + dur + 0.02);

          this.activeOscillators.push(osc);
          this.activeGainNodes.push(gain);
        } catch {}
      });
    };

    // First cycle immediately
    playCycle();
    // Repeat every 3 seconds
    this.ringInterval = setInterval(playCycle, 3000);
  }

  /**
   * Play Outgoing Ringback: Standard pleasant PBX tone (440Hz + 480Hz)
   */
  public playOutgoingRingback() {
    this.stopCallAudio();
    this.isPlaying = true;

    const playCycle = () => {
      if (!this.isPlaying) return;
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const toneDuration = 1.4;

      try {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
        gain.gain.setValueAtTime(0.12, now + toneDuration - 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + toneDuration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + toneDuration);
        osc2.stop(now + toneDuration);

        this.activeOscillators.push(osc1, osc2);
        this.activeGainNodes.push(gain);
      } catch {}
    };

    playCycle();
    this.ringInterval = setInterval(playCycle, 4000);
  }

  /**
   * Stop any playing call ringtone or dial tone immediately
   */
  public stopCallAudio() {
    this.isPlaying = false;
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }

    try {
      this.activeGainNodes.forEach((g) => {
        try {
          g.gain.setValueAtTime(0.001, (this.audioCtx?.currentTime || 0));
          g.disconnect();
        } catch {}
      });
      this.activeOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
    } catch {}

    this.activeOscillators = [];
    this.activeGainNodes = [];
  }
}

export const callAudioService = new CallAudioService();
