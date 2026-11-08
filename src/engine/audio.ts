export type BgmTrack =
  | 'title'
  | 'pallet'
  | 'route'
  | 'city'
  | 'cave'
  | 'lavender'
  | 'gym'
  | 'indigo'
  | 'frontier'
  | 'battle_wild'
  | 'battle_trainer'
  | 'battle_gym'
  | 'victory';

const NOTE_FREQ: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, Cs4: 277.18, D4: 293.66, Ds4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99,
  G4: 392.0, Gs4: 415.3, A4: 440.0, Bb4: 466.16, B4: 493.88,
  C5: 523.25, Cs5: 554.37, D5: 587.33, Ds5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99,
  G5: 783.99, A5: 880.0, B5: 987.77, C6: 1046.5,
  R: 0,
};

const TRACKS: Record<BgmTrack, { tempo: number; wave: OscillatorType; notes: Array<[string, number]> }> = {
  title: {
    tempo: 145,
    wave: 'sawtooth',
    notes: [
      ['G4', 1], ['C5', 1], ['E5', 1.5], ['D5', 0.5], ['C5', 1], ['G5', 2],
      ['F5', 1], ['E5', 1], ['D5', 1], ['E5', 1], ['C5', 2], ['R', 1],
      ['A4', 1], ['C5', 1], ['F5', 1.5], ['E5', 0.5], ['D5', 1], ['G5', 2],
      ['E5', 1], ['D5', 1], ['C5', 1], ['B4', 1], ['C5', 2], ['R', 1],
    ],
  },
  pallet: {
    tempo: 105,
    wave: 'triangle',
    notes: [
      ['E4', 1], ['G4', 1], ['B4', 1], ['A4', 1], ['G4', 2], ['E4', 2],
      ['D4', 1], ['F4', 1], ['A4', 1], ['G4', 1], ['E4', 2], ['R', 2],
      ['C5', 1.5], ['B4', 0.5], ['A4', 1], ['G4', 1], ['F4', 1], ['E4', 1], ['D4', 2],
    ],
  },
  route: {
    tempo: 140,
    wave: 'square',
    notes: [
      ['C5', 0.5], ['D5', 0.5], ['E5', 1], ['E5', 1], ['G5', 1], ['E5', 1], ['C5', 1], ['G4', 1],
      ['A4', 1], ['C5', 1], ['D5', 1], ['B4', 1], ['G4', 2], ['R', 1],
      ['F4', 0.5], ['G4', 0.5], ['A4', 1], ['C5', 1], ['B4', 1], ['D5', 1], ['C5', 2], ['R', 1],
    ],
  },
  city: {
    tempo: 126,
    wave: 'triangle',
    notes: [
      ['G4', 1], ['B4', 1], ['D5', 1], ['G5', 1], ['Fs5', 1], ['E5', 1], ['D5', 2],
      ['C5', 1], ['E5', 1], ['D5', 1], ['B4', 1], ['A4', 2], ['R', 1],
      ['B4', 1], ['C5', 1], ['D5', 1], ['E5', 1], ['Fs5', 1], ['G5', 2], ['R', 1],
    ],
  },
  cave: {
    tempo: 98,
    wave: 'sine',
    notes: [
      ['E4', 1], ['Bb4', 1], ['A4', 1], ['E4', 1], ['Cs4', 2], ['R', 1],
      ['D4', 1], ['Gs4', 1], ['G4', 1], ['D4', 1], ['C4', 2], ['R', 1],
    ],
  },
  lavender: {
    tempo: 88,
    wave: 'sine',
    notes: [
      ['C5', 1], ['G5', 1], ['B5', 1], ['Fs5', 1],
      ['C5', 1], ['G5', 1], ['B5', 1], ['Fs5', 1],
      ['E5', 2], ['D5', 2], ['C5', 2], ['B4', 2],
    ],
  },
  gym: {
    tempo: 152,
    wave: 'sawtooth',
    notes: [
      ['E4', 0.5], ['E4', 0.5], ['B4', 1], ['A4', 1], ['G4', 1], ['Fs4', 1], ['E4', 2],
      ['G4', 0.5], ['A4', 0.5], ['B4', 1], ['D5', 1], ['Cs5', 1], ['B4', 2], ['R', 1],
    ],
  },
  indigo: {
    tempo: 138,
    wave: 'sawtooth',
    notes: [
      ['C4', 1], ['G4', 1], ['C5', 2], ['Ds5', 1], ['D5', 1], ['C5', 2],
      ['Gs4', 1], ['Bb4', 1], ['C5', 1], ['G5', 2], ['F5', 1], ['Ds5', 2],
    ],
  },
  frontier: {
    tempo: 156,
    wave: 'sawtooth',
    notes: [
      ['D4', 0.5], ['F4', 0.5], ['A4', 1], ['D5', 1], ['C5', 1], ['D5', 1], ['F5', 2],
      ['E5', 1], ['D5', 1], ['C5', 1], ['A4', 1], ['G4', 2], ['A4', 2],
    ],
  },
  battle_wild: {
    tempo: 175,
    wave: 'square',
    notes: [
      ['G4', 0.5], ['Gs4', 0.5], ['A4', 0.5], ['Bb4', 0.5], ['B4', 1], ['G4', 1], ['C5', 1], ['B4', 1],
      ['Bb4', 1], ['A4', 1], ['G4', 1], ['F4', 1], ['E4', 1], ['G4', 1], ['C5', 2],
    ],
  },
  battle_trainer: {
    tempo: 180,
    wave: 'square',
    notes: [
      ['E4', 0.5], ['F4', 0.5], ['Fs4', 0.5], ['G4', 0.5], ['A4', 1], ['E5', 1], ['D5', 1], ['C5', 1],
      ['B4', 1], ['C5', 1], ['D5', 1], ['E5', 1], ['F5', 1.5], ['E5', 1.5],
    ],
  },
  battle_gym: {
    tempo: 192,
    wave: 'sawtooth',
    notes: [
      ['A4', 0.5], ['A4', 0.5], ['E5', 1], ['D5', 0.5], ['C5', 0.5], ['B4', 1], ['C5', 1], ['D5', 1],
      ['E5', 1], ['F5', 1], ['G5', 1.5], ['E5', 0.5], ['A5', 2],
    ],
  },
  victory: {
    tempo: 165,
    wave: 'square',
    notes: [
      ['C5', 0.5], ['C5', 0.5], ['C5', 0.5], ['C5', 1.5], ['Gs4', 1.5], ['Bb4', 1.5],
      ['C5', 1], ['Bb4', 0.5], ['C5', 3], ['R', 2],
    ],
  },
};

class GbaAudioEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private volume = 0.25;
  private currentTrack: BgmTrack | null = null;
  private noteIdx = 0;
  private timer: number | null = null;

  private ensureCtx(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    this.ensureCtx();
  }

  public setSettings(enabled: boolean, volume: number) {
    this.enabled = enabled;
    this.volume = Math.max(0, Math.min(1, volume));
    if (!enabled) {
      this.stopBgm();
    } else if (this.currentTrack && !this.timer) {
      const t = this.currentTrack;
      this.currentTrack = null;
      this.playBgm(t);
    }
  }

  public playBgm(track: BgmTrack) {
    if (this.currentTrack === track && this.timer) return;
    this.stopBgm();
    this.currentTrack = track;
    if (!this.enabled) return;
    this.noteIdx = 0;
    this.scheduleNextNote();
  }

  public stopBgm() {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNextNote() {
    if (!this.enabled || !this.currentTrack) return;
    const def = TRACKS[this.currentTrack];
    if (!def) return;
    const [note, beats] = def.notes[this.noteIdx % def.notes.length];
    this.noteIdx = (this.noteIdx + 1) % def.notes.length;

    const durSec = (60 / def.tempo) * beats;
    const freq = NOTE_FREQ[note] || 0;
    const ctx = this.ensureCtx();
    if (ctx && freq > 0 && ctx.state === 'running') {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = def.wave;
      osc.frequency.setValueAtTime(freq, now);

      const peak = this.volume * (def.wave === 'sawtooth' ? 0.09 : 0.12);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durSec * 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + durSec * 0.92);
    }

    this.timer = window.setTimeout(() => this.scheduleNextNote(), durSec * 1000);
  }

  public playSfx(
    kind:
      | 'select'
      | 'cancel'
      | 'bump'
      | 'heal'
      | 'hit'
      | 'super_hit'
      | 'ball_throw'
      | 'ball_shake'
      | 'catch_success'
      | 'level_up'
      | 'faint'
      | 'shiny'
  ) {
    const ctx = this.ensureCtx();
    if (!ctx || !this.enabled) return;
    const now = ctx.currentTime;

    const tone = (freq: number, start: number, dur: number, type: OscillatorType = 'square', vol = 0.16, endFreq?: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, now + start);
      if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, now + start + dur);
      g.gain.setValueAtTime(vol * this.volume * 2, now + start);
      g.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(now + start);
      o.stop(now + start + dur + 0.01);
    };

    switch (kind) {
      case 'select':
        tone(880, 0, 0.06, 'square', 0.12, 1175);
        break;
      case 'cancel':
        tone(520, 0, 0.07, 'square', 0.12, 330);
        break;
      case 'bump':
        tone(140, 0, 0.08, 'triangle', 0.18, 90);
        break;
      case 'heal':
        // Classic B-B-B-G#-E Pokemon Center jingle!
        tone(493.88, 0, 0.14, 'triangle', 0.2);
        tone(493.88, 0.16, 0.14, 'triangle', 0.2);
        tone(493.88, 0.32, 0.14, 'triangle', 0.2);
        tone(415.3, 0.48, 0.16, 'triangle', 0.2);
        tone(659.25, 0.66, 0.35, 'triangle', 0.24);
        break;
      case 'hit':
        tone(220, 0, 0.12, 'sawtooth', 0.22, 75);
        break;
      case 'super_hit':
        tone(340, 0, 0.09, 'sawtooth', 0.25, 110);
        tone(520, 0.08, 0.16, 'square', 0.25, 140);
        break;
      case 'ball_throw':
        tone(320, 0, 0.18, 'sine', 0.18, 780);
        break;
      case 'ball_shake':
        tone(300, 0, 0.08, 'triangle', 0.16, 420);
        break;
      case 'catch_success':
        tone(523.25, 0, 0.12, 'square', 0.2);
        tone(659.25, 0.13, 0.12, 'square', 0.2);
        tone(783.99, 0.26, 0.12, 'square', 0.2);
        tone(1046.5, 0.4, 0.38, 'square', 0.24);
        break;
      case 'level_up':
        tone(440, 0, 0.1, 'square', 0.18);
        tone(554.37, 0.1, 0.1, 'square', 0.18);
        tone(659.25, 0.2, 0.1, 'square', 0.18);
        tone(880, 0.31, 0.28, 'square', 0.22);
        break;
      case 'faint':
        tone(360, 0, 0.28, 'sawtooth', 0.18, 95);
        break;
      case 'shiny':
        tone(880, 0, 0.08, 'sine', 0.2, 1320);
        tone(1175, 0.09, 0.12, 'sine', 0.22, 1760);
        break;
    }
  }
}

export const audio = new GbaAudioEngine();
