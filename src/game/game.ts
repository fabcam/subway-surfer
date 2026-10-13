import * as THREE from 'three';
import { Sfx } from '../audio/sfx';
import type { Action } from '../input/input';
import { hud } from '../ui/hud';
import { generateLevel, type LevelData, type LevelSpec } from '../world/level';
import { buildTrack, type Track } from '../world/track';
import { CONFIG, LANES, SPEEDS, type LaneIndex, type SpeedSetting } from './config';
import { Player } from './player';

type State = 'menu' | 'playing' | 'paused' | 'finishing' | 'done';
/** run: corre normal · bump: el "¡uy!" después de chocar · recover: se acomoda y retoma. */
type Motion = 'run' | 'bump' | 'recover';

const PLAYER_HALF_DEPTH = 0.3;
const PLAYER_HALF_WIDTH = 0.35;
const TRAIN_HALF_WIDTH = 0.95;

export class Game {
  readonly sfx = new Sfx();
  onFinished: (stars: number) => void = () => {};

  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
  private player = new Player();
  private confetti: Confetti;

  private level!: LevelData;
  private track: Track | null = null;

  private state: State = 'menu';
  private motion: Motion = 'run';
  private motionT = 0;
  private pendingLane: { lane: LaneIndex; delay: number } | null = null;

  private dist = 0;
  private baseSpeed = SPEEDS.medium;
  private speed01 = 0; // 0..1 multiplicador de velocidad (para frenar y arrancar suave)
  private starCount = 0;
  private lastStarTime = 0;
  private time = 0;
  private finishT = 0;
  private camX = 0;
  private camPos = new THREE.Vector3();
  private camLook = new THREE.Vector3();
  private tmp = new THREE.Vector3();
  private lookY = 0.2;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const sky = new THREE.Color(0x7cc6ff);
    this.scene.background = sky;
    this.scene.fog = new THREE.Fog(sky, 45, 140);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x88aa66, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 2.0);
    sun.position.set(-6, 12, 8);
    this.scene.add(sun);

    this.scene.add(this.player.root);
    this.confetti = new Confetti();
    this.scene.add(this.confetti.mesh);

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  // ---------- Ciclo de vida ----------

  load(spec: LevelSpec) {
    if (this.track) {
      this.scene.remove(this.track.root);
      this.track.dispose();
    }
    this.level = generateLevel(spec);
    this.track = buildTrack(this.level);
    this.scene.add(this.track.root);
    this.reset();
  }

  private reset() {
    this.dist = 0;
    this.speed01 = 0;
    this.starCount = 0;
    this.motion = 'run';
    this.pendingLane = null;
    this.finishT = 0;
    this.player.reset();
    this.confetti.stop();
    for (const s of this.track!.stars) {
      s.collected = false;
      s.flying = 0;
      s.mesh.visible = true;
      s.mesh.scale.setScalar(1);
      s.mesh.position.set(LANES[s.lane], s.baseY, -s.dist);
    }
    hud.resetStars();
    hud.setProgress(0);
    this.snapCamera();
  }

  start(speed: SpeedSetting) {
    this.baseSpeed = SPEEDS[speed];
    this.reset();
    this.state = 'playing';
    this.player.setMood('run');
    this.sfx.say('¡Vamos!');
  }

  pause() {
    if (this.state === 'playing') this.state = 'paused';
  }

  resume() {
    if (this.state === 'paused') this.state = 'playing';
  }

  toMenu() {
    this.state = 'menu';
    this.reset();
  }

  get isPlaying() {
    return this.state === 'playing';
  }

  // ---------- Controles ----------

  handle(action: Action) {
    if (this.state !== 'playing') return;
    if (action === 'jump') {
      if (this.motion === 'bump') return;
      if (this.player.jump()) this.sfx.jump();
      return;
    }
    const dir = action === 'left' ? -1 : 1;
    const target = this.player.lane + dir;
    if (target < 0 || target > 2) {
      this.player.shake();
      return;
    }
    if (this.trainNear(target as LaneIndex, this.dist - 0.6, this.dist + PLAYER_HALF_DEPTH + 0.5)) {
      // Hay un vagón justo al lado: el personaje dice "por acá no" con la cabeza.
      this.player.shake();
      this.sfx.blocked();
      return;
    }
    this.player.setLane(target as LaneIndex);
    this.sfx.move();
    if (this.motion === 'bump') this.beginRecover();
  }

  // ---------- Bucle principal ----------

  update(dt: number) {
    this.time += dt;
    this.track?.update(this.time);

    if (this.state === 'playing') this.updatePlaying(dt);
    else if (this.state === 'finishing' || this.state === 'done') this.updateFinish(dt);
    else if (this.state === 'menu') this.player.update(dt, this.dist, 0);

    this.confetti.update(dt);
    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
  }

  private updatePlaying(dt: number) {
    this.motionT += dt;

    // Velocidad: arranque suave, frena en el choque, se recupera de a poco.
    if (this.motion === 'run') {
      this.speed01 = Math.min(1, this.speed01 + dt / 1.0);
    } else if (this.motion === 'bump') {
      this.speed01 = 0;
      if (this.motionT >= CONFIG.bumpPause) this.recoverToFreeLane();
    } else if (this.motion === 'recover') {
      this.updatePendingLane(dt);
      if (!this.pendingLane && !this.player.isChangingLane) {
        this.speed01 = Math.min(1, this.speed01 + dt / CONFIG.recoverTime);
        if (this.speed01 >= 1) this.motion = 'run';
      }
    }

    const prevDist = this.dist;
    this.dist += this.baseSpeed * this.speed01 * dt;

    this.autoHopBarriers();
    this.checkTrainHits(prevDist);

    this.player.update(dt, this.dist, this.speed01);
    this.collectStars(dt);

    hud.setProgress(this.dist / this.level.length);

    if (this.dist >= this.level.length) this.beginFinish();
  }

  /** Las barreras bajas se saltan solas (ayuda automática). */
  private autoHopBarriers() {
    if (!this.player.onGround) return;
    const front = this.dist + PLAYER_HALF_DEPTH;
    const reach = Math.max(1.2, this.baseSpeed * 0.25);
    for (const ob of this.level.obstacles) {
      if (ob.kind !== 'barrier') continue;
      if (!this.overlapsLane(ob.lane)) continue;
      if (ob.start > front && ob.start - front < reach) {
        this.player.jump();
        this.sfx.jump();
        return;
      }
    }
  }

  /** Choque amable con el frente de un vagón. */
  private checkTrainHits(prevDist: number) {
    const front = this.dist + PLAYER_HALF_DEPTH;
    const prevFront = prevDist + PLAYER_HALF_DEPTH;
    for (const ob of this.level.obstacles) {
      if (ob.kind !== 'train') continue;
      if (!this.overlapsLane(ob.lane)) continue;
      if (prevFront <= ob.start + 0.001 && front > ob.start && this.player.y < ob.height) {
        this.dist = ob.start - PLAYER_HALF_DEPTH - 0.02;
        this.speed01 = 0;
        if (this.motion !== 'bump') {
          this.motion = 'bump';
          this.motionT = 0;
          this.pendingLane = null;
          this.player.setMood('bump');
          this.sfx.bump();
        }
        return;
      }
    }
  }

  /** Después del "¡uy!", busca el carril libre más cercano y se pasa con un saltito. */
  private recoverToFreeLane() {
    const current = this.player.lane;
    const candidates = ([0, 1, 2] as LaneIndex[])
      .filter((l) => l !== current)
      .sort((a, b) => Math.abs(a - current) - Math.abs(b - current) || this.starsAhead(b) - this.starsAhead(a));
    const free = candidates.find((l) => !this.trainNear(l, this.dist - 0.6, this.dist + 4));
    if (free === undefined) {
      // No debería pasar (cada fila deja un carril libre); por las dudas, espera y vuelve a probar.
      this.motionT = CONFIG.bumpPause * 0.5;
      return;
    }
    if (Math.abs(free - current) === 1) {
      this.player.jump(1.0, 0.45);
      this.player.setLane(free);
      this.pendingLane = null;
    } else {
      // Dos carriles de distancia: salto alto por encima del vagón del medio.
      this.player.jump(3.6, 1.1);
      this.pendingLane = { lane: free, delay: 0.2 };
    }
    this.sfx.jump();
    this.beginRecover();
  }

  private beginRecover() {
    this.motion = 'recover';
    this.motionT = 0;
    this.player.setMood('run');
  }

  private updatePendingLane(dt: number) {
    if (!this.pendingLane) return;
    this.pendingLane.delay -= dt;
    if (this.pendingLane.delay <= 0) {
      this.player.setLane(this.pendingLane.lane);
      this.pendingLane = null;
    }
  }

  private collectStars(dt: number) {
    const px = this.player.x;
    for (const s of this.track!.stars) {
      if (s.collected) continue;
      if (s.flying > 0) {
        // Vuela hacia el personaje y desaparece
        s.flying += dt / 0.18;
        const k = Math.min(1, s.flying);
        s.mesh.position.lerp(this.tmp.set(px, this.player.y + 1.3, -this.dist), k);
        s.mesh.scale.setScalar(1 - 0.7 * k);
        if (s.flying >= 1) {
          s.collected = true;
          s.mesh.visible = false;
        }
        continue;
      }
      const dz = s.dist - this.dist;
      if (dz < -1 || dz > 1.2) continue;
      if (Math.abs(LANES[s.lane] - px) < CONFIG.magnetRadius) {
        s.flying = 0.0001;
        this.starCount++;
        hud.setStars(this.starCount);
        if (this.time - this.lastStarTime > 1.5) this.sfx.resetStarCombo();
        this.lastStarTime = this.time;
        this.sfx.star();
      }
    }
  }

  private beginFinish() {
    this.state = 'finishing';
    this.finishT = 0;
    this.player.setMood('dance');
    this.confetti.burst(this.player.x, -this.dist);
    this.sfx.finish();
    setTimeout(() => this.sfx.say('¡Muy bien! ¡Llegaste a la meta!'), 900);
  }

  private updateFinish(dt: number) {
    this.finishT += dt;
    // Sigue un poquito y frena suave
    this.speed01 = Math.max(0, this.speed01 - dt / 1.2);
    this.dist += this.baseSpeed * this.speed01 * dt;
    this.player.update(dt, this.dist, this.speed01);
    this.collectStars(dt);
    if (this.state === 'finishing' && this.finishT > 2.4) {
      this.state = 'done';
      this.onFinished(this.starCount);
    }
  }

  // ---------- Ayudas ----------

  private overlapsLane(lane: number) {
    return Math.abs(LANES[lane] - this.player.x) < PLAYER_HALF_WIDTH + TRAIN_HALF_WIDTH - 0.15;
  }

  private trainNear(lane: LaneIndex, from: number, to: number) {
    return this.level.obstacles.some((ob) => ob.kind === 'train' && ob.lane === lane && ob.start < to && ob.end > from);
  }

  private starsAhead(lane: LaneIndex) {
    return this.track!.stars.filter((s) => !s.collected && s.lane === lane && s.dist > this.dist && s.dist < this.dist + 20).length;
  }

  // ---------- Cámara ----------

  private cameraTarget(pos: THREE.Vector3, look: THREE.Vector3) {
    const z = -this.dist;
    if (this.state === 'finishing' || this.state === 'done') {
      // Da la vuelta por el costado para ver al personaje bailando de frente, con la meta atrás
      const k = Math.min(1, this.finishT / 1.6);
      const e = k * k * (3 - 2 * k);
      const angle = e * Math.PI; // 0 = detrás, PI = delante
      const radius = 7.4 - 1.4 * e;
      pos.set(this.player.x + Math.sin(angle) * radius, 4.8 - 2.2 * e, z + Math.cos(angle) * radius);
      look.set(this.player.x, 0.2 + 0.6 * e, z - 8 * (1 - e));
      return;
    }
    // Cámara un poco más alta y mirando hacia abajo: el personaje queda arriba de los botones
    pos.set(this.camX, 4.8, z + 7.4);
    look.set(this.camX, this.lookY, z - 8);
  }

  private snapCamera() {
    this.camX = this.player.x * 0.6;
    this.cameraTarget(this.camPos, this.camLook);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
  }

  private updateCamera(dt: number) {
    this.camX += (this.player.x * 0.6 - this.camX) * Math.min(1, dt * 6);
    this.cameraTarget(this.camPos, this.camLook);
    const f = this.state === 'playing' || this.state === 'menu' ? 1 : Math.min(1, dt * 4);
    this.camera.position.lerp(this.camPos, f);
    this.camera.lookAt(this.camLook);
  }

  private resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // En pantallas verticales (celular parado) se abre el ángulo para ver los tres carriles
    this.camera.fov = w < h ? 75 : 60;
    // En pantallas muy anchas y bajas (celular apaisado) se mira más abajo para subir al personaje
    this.lookY = w / h > 1.7 ? -1.6 : 0.2;
    this.camera.updateProjectionMatrix();
  }
}

/** Papelitos de colores que caen despacio (sin destellos). */
class Confetti {
  readonly mesh: THREE.InstancedMesh;
  private count = 160;
  private pos: THREE.Vector3[] = [];
  private vel: THREE.Vector3[] = [];
  private rot: THREE.Euler[] = [];
  private spin: THREE.Vector3[] = [];
  private active = false;
  private dummy = new THREE.Object3D();

  constructor() {
    this.mesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.18, 0.28),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
      this.count,
    );
    const colors = [0xff595e, 0xffca3a, 0x8ac926, 0x1982c4, 0x6a4c93, 0xff7eb6];
    const c = new THREE.Color();
    for (let i = 0; i < this.count; i++) {
      this.pos.push(new THREE.Vector3());
      this.vel.push(new THREE.Vector3());
      this.rot.push(new THREE.Euler());
      this.spin.push(new THREE.Vector3());
      this.mesh.setColorAt(i, c.setHex(colors[i % colors.length]));
    }
    this.mesh.visible = false;
    this.mesh.frustumCulled = false;
  }

  burst(x: number, z: number) {
    this.active = true;
    this.mesh.visible = true;
    for (let i = 0; i < this.count; i++) {
      this.pos[i].set(x + (Math.random() - 0.5) * 8, 5 + Math.random() * 6, z - 4 + (Math.random() - 0.5) * 10);
      this.vel[i].set((Math.random() - 0.5) * 0.8, -1 - Math.random() * 1.2, (Math.random() - 0.5) * 0.8);
      this.rot[i].set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      this.spin[i].set(Math.random() * 4, Math.random() * 4, Math.random() * 4);
    }
  }

  stop() {
    this.active = false;
    this.mesh.visible = false;
  }

  update(dt: number) {
    if (!this.active) return;
    for (let i = 0; i < this.count; i++) {
      const p = this.pos[i];
      p.addScaledVector(this.vel[i], dt);
      p.x += Math.sin(p.y * 2 + i) * dt * 0.5;
      if (p.y < 0.1) p.y = 0.1; // quedan en el piso
      else {
        this.rot[i].x += this.spin[i].x * dt;
        this.rot[i].y += this.spin[i].y * dt;
        this.rot[i].z += this.spin[i].z * dt;
      }
      this.dummy.position.copy(p);
      this.dummy.rotation.copy(this.rot[i]);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
