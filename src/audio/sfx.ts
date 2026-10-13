// Sonidos sintetizados con Web Audio (no hace falta descargar archivos).
// Todos son suaves y alegres: no hay ningún sonido de "error".

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = true;

  /** Debe llamarse desde un toque del usuario (los navegadores lo exigen). */
  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on && 'speechSynthesis' in window) speechSynthesis.cancel();
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.3, slideTo?: number) {
    if (!this.enabled || !this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime + start;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  private starNote = 0;
  /** "Ding" de estrella; sube de tono si se juntan seguidas. */
  star() {
    const scale = [880, 988, 1109, 1175, 1319, 1480, 1661, 1760];
    const f = scale[this.starNote % scale.length];
    this.starNote++;
    this.tone(f, 0, 0.18, 'triangle', 0.18);
    this.tone(f * 2, 0.03, 0.12, 'sine', 0.06);
  }

  resetStarCombo() {
    this.starNote = 0;
  }

  move() {
    this.tone(520, 0, 0.09, 'sine', 0.08, 700);
  }

  jump() {
    this.tone(330, 0, 0.25, 'sine', 0.15, 660);
  }

  /** Choque amable: un "boing" gracioso. */
  bump() {
    this.tone(260, 0, 0.35, 'sine', 0.25, 140);
    this.tone(390, 0.12, 0.3, 'triangle', 0.12, 520);
  }

  /** Carril ocupado: dos notitas neutras, sin connotación de error. */
  blocked() {
    this.tone(600, 0, 0.07, 'sine', 0.08);
    this.tone(600, 0.1, 0.07, 'sine', 0.08);
  }

  /** Fanfarria de llegada. */
  finish() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach((f, i) => this.tone(f, i * 0.13, 0.3, 'triangle', 0.2));
  }

  /** Voz que felicita (para chicos que todavía no leen). */
  say(text: string) {
    if (!this.enabled || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-AR';
    const voice = speechSynthesis.getVoices().find((v) => v.lang.startsWith('es'));
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.pitch = 1.15;
    speechSynthesis.speak(u);
  }
}
