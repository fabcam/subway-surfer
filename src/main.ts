import type { SpeedSetting } from './game/config';
import { Game } from './game/game';
import { Input } from './input/input';
import { hud } from './ui/hud';
import { LEVEL_1 } from './world/level';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const game = new Game(canvas);
game.load(LEVEL_1);

const input = new Input(canvas, (a) => game.handle(a));

// ---------- Velocidad y sonido ----------
let speed: SpeedSetting = (localStorageGet('speed') as SpeedSetting) ?? 'medium';
const speedButtons = document.querySelectorAll<HTMLButtonElement>('.speed');
const paintSpeed = () => speedButtons.forEach((b) => b.classList.toggle('selected', b.dataset.speed === speed));
paintSpeed();
speedButtons.forEach((b) =>
  b.addEventListener('click', () => {
    speed = b.dataset.speed as SpeedSetting;
    localStorageSet('speed', speed);
    paintSpeed();
  }),
);

const soundBtn = document.getElementById('btn-sound')!;
const paintSound = () => (soundBtn.textContent = game.sfx.enabled ? '🔊' : '🔇');
game.sfx.setEnabled(localStorageGet('sound') !== 'off');
paintSound();
soundBtn.addEventListener('click', () => {
  game.sfx.setEnabled(!game.sfx.enabled);
  localStorageSet('sound', game.sfx.enabled ? 'on' : 'off');
  paintSound();
});

// En cada toque nos aseguramos de que el sonido esté activo (iOS lo pausa al cambiar de app).
for (const ev of ['touchend', 'click', 'keydown'] as const) {
  window.addEventListener(ev, () => game.sfx.unlock(), { capture: true, passive: true });
}

// ---------- Pantallas ----------
function play() {
  game.sfx.unlock();
  hud.showScreen(null);
  hud.showPlayUI(true);
  input.enabled = true;
  game.start(speed);
}

function pause() {
  if (!game.isPlaying) return;
  game.pause();
  input.enabled = false;
  hud.showScreen('pause');
}

function resume() {
  hud.showScreen(null);
  input.enabled = true;
  game.resume();
}

function home() {
  input.enabled = false;
  hud.showPlayUI(false);
  hud.showScreen('start');
  game.toMenu();
}

game.onFinished = (stars) => {
  input.enabled = false;
  hud.showPlayUI(false);
  hud.setFinalStars(stars);
  hud.showScreen('finish');
};

const on = (id: string, fn: () => void) => document.getElementById(id)!.addEventListener('click', fn);
on('btn-play', play);
on('btn-again', play);
on('btn-pause', pause);
on('btn-resume', resume);
on('btn-home', home);

// Con teclado o pulsador: espacio / enter también sirven para "Jugar", "Seguir" y "Otra vez".
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' && e.code !== 'Enter') return;
  const visible = (id: string) => !document.getElementById(id)!.classList.contains('hidden');
  if (visible('screen-start') || visible('screen-finish')) {
    e.preventDefault();
    play();
  } else if (visible('screen-pause')) {
    e.preventDefault();
    resume();
  }
});

// Si se cambia de app o se apaga la pantalla, el juego se pausa solo.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause();
});

// ---------- Bucle ----------
let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function localStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function localStorageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

// Solo en desarrollo: acceso desde la consola para probar.
if (import.meta.env.DEV) (window as unknown as { game: Game }).game = game;
