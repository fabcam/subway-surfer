// Acceso simple a los elementos de la interfaz (HTML sobre el canvas).

const $ = (id: string) => document.getElementById(id)!;

export type ScreenName = 'start' | 'pause' | 'finish' | null;

export const hud = {
  showScreen(name: ScreenName) {
    for (const s of ['start', 'pause', 'finish'] as const) {
      $(`screen-${s}`).classList.toggle('hidden', s !== name);
    }
  },

  showPlayUI(visible: boolean) {
    $('hud').classList.toggle('hidden', !visible);
    $('controls').classList.toggle('hidden', !visible);
  },

  setStars(n: number) {
    $('star-count').textContent = String(n);
    const pill = $('stars');
    pill.classList.remove('bump');
    void pill.offsetWidth; // reinicia la animación
    pill.classList.add('bump');
  },

  resetStars() {
    $('star-count').textContent = '0';
  },

  setProgress(p: number) {
    const pct = Math.max(0, Math.min(1, p)) * 100;
    $('progress-fill').style.width = `${pct}%`;
    $('progress-runner').style.left = `calc(22px + (100% - 52px) * ${pct / 100})`;
  },

  setFinalStars(n: number) {
    $('final-stars').textContent = String(n);
  },
};
