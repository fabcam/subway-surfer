// Efectos de sonido. La mayoría son grabaciones de Kenney (CC0, ver sounds/CREDITOS.md);
// el "boing" del choque y la fanfarria de la meta se sintetizan con Web Audio.
// Todos son suaves y alegres: no hay ningún sonido de "error".

import aterrizajeUrl from './sounds/aterrizaje.mp3';
import carrilUrl from './sounds/carril.mp3';
import estrellaUrl from './sounds/estrella.mp3';
import ocupadoUrl from './sounds/ocupado.mp3';
import saltoUrl from './sounds/salto.mp3';

const SAMPLES = {
  estrella: estrellaUrl,
  salto: saltoUrl,
  aterrizaje: aterrizajeUrl,
  carril: carrilUrl,
  ocupado: ocupadoUrl,
};
type SampleName = keyof typeof SAMPLES;

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = true;
  private buffers: Partial<Record<SampleName, AudioBuffer>> = {};

  /**
   * Debe llamarse desde un toque del usuario (los navegadores lo exigen).
   * Se puede llamar en cada toque: si el audio ya está activo no hace nada.
   */
  unlock() {
    // iPhone/iPad: por defecto el sonido web se calla con el modo silencio (la voz no).
    // Pedimos el modo "reproducción", como una app de música o de video.
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession && nav.audioSession.type !== 'playback') {
      try {
        nav.audioSession.type = 'playback';
      } catch {
        /* navegador sin soporte: seguimos igual */
      }
    }

    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);

      // iOS más viejos: reproducir un sonido mudo con <audio> también saca al juego del modo silencio,
      // y un buffer vacío termina de "despertar" el audio.
      const silent = new Audio(SILENT_WAV);
      silent.setAttribute('playsinline', '');
      void silent.play().catch(() => {});
      const buffer = this.ctx.createBuffer(1, 1, 22050);
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(this.ctx.destination);
      src.start(0);

      void this.loadSamples();
    }
    // "suspended" al arrancar; "interrupted" en iOS después de una llamada o de cambiar de app
    if (this.ctx.state !== 'running') void this.ctx.resume().catch(() => {});
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

  /** Carga los sonidos grabados. Mientras no estén listos, se usa el sonido sintetizado. */
  private async loadSamples() {
    const ctx = this.ctx!;
    await Promise.all(
      (Object.entries(SAMPLES) as [SampleName, string][]).map(async ([name, url]) => {
        try {
          const data = await (await fetch(url)).arrayBuffer();
          // Safari viejo solo acepta la versión con callbacks de decodeAudioData
          this.buffers[name] = await new Promise<AudioBuffer>((ok, fail) => ctx.decodeAudioData(data, ok, fail));
        } catch {
          /* si un sonido no carga, queda el sintetizado */
        }
      }),
    );
  }

  /** Reproduce un sonido grabado. Devuelve false si todavía no está cargado. */
  private sample(name: SampleName, vol: number, rate = 1) {
    const buffer = this.buffers[name];
    if (!buffer) return false;
    if (!this.enabled || !this.ctx || !this.master) return true;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.connect(gain).connect(this.master);
    src.start();
    return true;
  }

  private starNote = 0;
  /** Moneda de estrella; sube de tono si se juntan seguidas (como una escalera de notas). */
  star() {
    // Semitonos de una escala mayor: do re mi fa sol la si do
    const steps = [0, 2, 4, 5, 7, 9, 11, 12];
    const step = steps[this.starNote % steps.length];
    this.starNote++;
    if (this.sample('estrella', 0.9, Math.pow(2, step / 12))) return;
    const f = 880 * Math.pow(2, step / 12);
    this.tone(f, 0, 0.18, 'triangle', 0.18);
    this.tone(f * 2, 0.03, 0.12, 'sine', 0.06);
  }

  resetStarCombo() {
    this.starNote = 0;
  }

  move() {
    if (this.sample('carril', 0.35)) return;
    this.tone(520, 0, 0.09, 'sine', 0.08, 700);
  }

  jump() {
    if (this.sample('salto', 0.6)) return;
    this.tone(330, 0, 0.25, 'sine', 0.15, 660);
  }

  /** Apoyo suave al terminar un salto. */
  land() {
    this.sample('aterrizaje', 1.0);
  }

  /** Choque amable: un "boing" gracioso. */
  bump() {
    this.tone(260, 0, 0.35, 'sine', 0.25, 140);
    this.tone(390, 0.12, 0.3, 'triangle', 0.12, 520);
  }

  /** Carril ocupado: dos notitas neutras, sin connotación de error. */
  blocked() {
    if (this.sample('ocupado', 0.4)) return;
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

/** Medio segundo de silencio en formato WAV, armado en el momento (no hace falta un archivo). */
const SILENT_WAV = (() => {
  const rate = 8000;
  const samples = rate / 2;
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, str: string) => [...str].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true); // 8 bits
  text(36, 'data');
  view.setUint32(40, samples, true);
  bytes.fill(128, 44); // 128 = silencio en 8 bits
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return `data:audio/wav;base64,${btoa(bin)}`;
})();
