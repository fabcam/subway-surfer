import { CONFIG } from '../game/config';

// Junta todas las formas de controlar el juego en tres acciones simples.
// - Botones grandes en pantalla (un toque, sin deslizar ni mantener apretado).
// - Tocar la pantalla: tercio izquierdo / centro / tercio derecho.
// - Teclado y pulsadores Bluetooth (se presentan como teclas: flechas, espacio, enter).

export type Action = 'left' | 'right' | 'jump';

const KEYMAP: Record<string, Action> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
  Enter: 'jump',
};

export class Input {
  enabled = false;
  private lastTime: Partial<Record<Action, number>> = {};
  private buttons: Record<Action, HTMLElement>;

  constructor(
    private canvas: HTMLElement,
    private onAction: (a: Action) => void,
  ) {
    this.buttons = {
      left: document.getElementById('btn-left')!,
      right: document.getElementById('btn-right')!,
      jump: document.getElementById('btn-jump')!,
    };

    for (const [action, el] of Object.entries(this.buttons) as [Action, HTMLElement][]) {
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.fire(action);
      });
    }

    this.canvas.addEventListener('pointerdown', (e) => {
      const w = this.canvas.clientWidth;
      const third = w / 3;
      this.fire(e.clientX < third ? 'left' : e.clientX > w - third ? 'right' : 'jump');
    });

    window.addEventListener('keydown', (e) => {
      const action = KEYMAP[e.code];
      if (!action || !this.enabled) return;
      e.preventDefault();
      if (e.repeat) return; // mantener apretado no repite la acción
      this.fire(action);
    });

    // Evita el menú contextual de "mantener apretado" en tablets
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private fire(action: Action) {
    if (!this.enabled) return;
    const now = performance.now();
    const last = this.lastTime[action] ?? 0;
    if (now - last < CONFIG.inputDebounceMs) return; // toque repetido sin querer
    this.lastTime[action] = now;
    this.flash(action);
    this.onAction(action);
  }

  private flash(action: Action) {
    const el = this.buttons[action];
    el.classList.add('pressed');
    setTimeout(() => el.classList.remove('pressed'), 120);
  }
}
