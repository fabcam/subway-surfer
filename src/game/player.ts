import * as THREE from 'three';
import { CONFIG, LANES, type LaneIndex } from './config';

// El personaje: un chico con gorra y mochila, hecho con formas simples.
// Mira hacia adelante (-z); la cámara lo ve de espaldas.

type Mood = 'run' | 'bump' | 'dance' | 'idle';

export class Player {
  readonly root = new THREE.Group();
  /** Carril al que se dirige. */
  lane: LaneIndex = 1;
  x: number = LANES[1];
  y = 0;

  private body = new THREE.Group();
  private head = new THREE.Group();
  private legL: THREE.Group;
  private legR: THREE.Group;
  private armL: THREE.Group;
  private armR: THREE.Group;
  private shadow: THREE.Mesh;

  private jumpT = -1; // <0: en el piso; 0..1: progreso del salto
  private jumpH = CONFIG.jumpHeight;
  private jumpDur = CONFIG.jumpTime;
  private mood: Mood = 'idle';
  private moodT = 0;
  private shakeT = -1;
  private runPhase = 0;
  private disposables: { dispose(): void }[] = [];

  constructor() {
    const t = <T extends { dispose(): void }>(x: T) => (this.disposables.push(x), x);
    const skin = t(new THREE.MeshLambertMaterial({ color: 0xffcc99 }));
    const shirt = t(new THREE.MeshLambertMaterial({ color: 0xff7f11 }));
    const pants = t(new THREE.MeshLambertMaterial({ color: 0x3a6ea5 }));
    const shoe = t(new THREE.MeshLambertMaterial({ color: 0xffffff }));
    const cap = t(new THREE.MeshLambertMaterial({ color: 0xe63946 }));
    const bag = t(new THREE.MeshLambertMaterial({ color: 0x2ec4b6 }));
    const dark = t(new THREE.MeshBasicMaterial({ color: 0x222222 }));

    // Piernas (pivote en la cadera)
    const legGeo = t(new THREE.CapsuleGeometry(0.13, 0.45, 4, 8));
    const shoeGeo = t(new THREE.BoxGeometry(0.24, 0.14, 0.36));
    const makeLeg = (x: number) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.78, 0);
      const leg = new THREE.Mesh(legGeo, pants);
      leg.position.y = -0.36;
      const foot = new THREE.Mesh(shoeGeo, shoe);
      foot.position.set(0, -0.7, -0.06);
      pivot.add(leg, foot);
      this.body.add(pivot);
      return pivot;
    };
    this.legL = makeLeg(-0.17);
    this.legR = makeLeg(0.17);

    // Torso
    const torso = new THREE.Mesh(t(new THREE.CapsuleGeometry(0.34, 0.42, 4, 12)), shirt);
    torso.position.y = 1.2;
    this.body.add(torso);

    // Mochila (lo que más se ve desde atrás)
    const backpack = new THREE.Mesh(t(new THREE.BoxGeometry(0.5, 0.55, 0.25)), bag);
    backpack.position.set(0, 1.25, 0.33);
    this.body.add(backpack);
    const pocket = new THREE.Mesh(t(new THREE.BoxGeometry(0.34, 0.2, 0.08)), t(new THREE.MeshLambertMaterial({ color: 0xffd23f })));
    pocket.position.set(0, 1.12, 0.48);
    this.body.add(pocket);

    // Brazos (pivote en el hombro)
    const armGeo = t(new THREE.CapsuleGeometry(0.1, 0.4, 4, 8));
    const handGeo = t(new THREE.SphereGeometry(0.11, 8, 6));
    const makeArm = (x: number) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 1.48, 0);
      const arm = new THREE.Mesh(armGeo, shirt);
      arm.position.y = -0.28;
      const hand = new THREE.Mesh(handGeo, skin);
      hand.position.y = -0.56;
      pivot.add(arm, hand);
      this.body.add(pivot);
      return pivot;
    };
    this.armL = makeArm(-0.45);
    this.armR = makeArm(0.45);

    // Cabeza con gorra
    this.head.position.y = 1.95;
    const face = new THREE.Mesh(t(new THREE.SphereGeometry(0.38, 16, 12)), skin);
    this.head.add(face);
    const capTop = new THREE.Mesh(t(new THREE.SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)), cap);
    capTop.position.y = 0.05;
    this.head.add(capTop);
    const brim = new THREE.Mesh(t(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16, 1, false, 0, Math.PI)), cap);
    brim.position.set(0, 0.07, -0.3);
    brim.rotation.y = Math.PI / 2;
    this.head.add(brim);
    const eyeGeo = t(new THREE.SphereGeometry(0.055, 8, 6));
    for (const ex of [-0.13, 0.13]) {
      const eye = new THREE.Mesh(eyeGeo, dark);
      eye.position.set(ex, -0.02, -0.34);
      this.head.add(eye);
    }
    const smile = new THREE.Mesh(t(new THREE.TorusGeometry(0.1, 0.022, 6, 12, Math.PI)), dark);
    smile.position.set(0, -0.15, -0.35);
    smile.rotation.z = Math.PI;
    this.head.add(smile);
    // Orejas
    for (const ex of [-0.38, 0.38]) {
      const ear = new THREE.Mesh(eyeGeo, skin);
      ear.scale.setScalar(1.6);
      ear.position.set(ex, -0.02, 0);
      this.head.add(ear);
    }
    this.body.add(this.head);

    this.root.add(this.body);

    // Sombra redonda (más barata que sombras reales, ideal para tablets)
    this.shadow = new THREE.Mesh(
      t(new THREE.CircleGeometry(0.55, 20)),
      t(new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false })),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.03;
    this.root.add(this.shadow);
  }

  get onGround() {
    return this.jumpT < 0;
  }

  get isChangingLane() {
    return Math.abs(this.x - LANES[this.lane]) > 0.05;
  }

  reset() {
    this.lane = 1;
    this.x = LANES[1];
    this.y = 0;
    this.jumpT = -1;
    this.shakeT = -1;
    this.setMood('idle');
    this.body.rotation.set(0, 0, 0);
  }

  setLane(lane: LaneIndex) {
    this.lane = lane;
  }

  jump(height = CONFIG.jumpHeight, time = CONFIG.jumpTime) {
    if (!this.onGround) return false;
    this.jumpT = 0;
    this.jumpH = height;
    this.jumpDur = time;
    return true;
  }

  /** Movimiento de cabeza "por acá no" cuando un carril está ocupado. Nada de castigo. */
  shake() {
    this.shakeT = 0;
  }

  setMood(mood: Mood) {
    this.mood = mood;
    this.moodT = 0;
  }

  /** speed01: 0 = quieto, 1 = corriendo a la velocidad elegida. */
  update(dt: number, dist: number, speed01: number) {
    this.moodT += dt;

    // Desplazamiento lateral suave
    const targetX = LANES[this.lane];
    const step = (LANES[2] - LANES[1]) / CONFIG.laneChangeTime * dt;
    if (Math.abs(targetX - this.x) <= step) this.x = targetX;
    else this.x += Math.sign(targetX - this.x) * step;

    // Salto (parábola)
    if (this.jumpT >= 0) {
      this.jumpT += dt / this.jumpDur;
      if (this.jumpT >= 1) {
        this.jumpT = -1;
        this.y = 0;
      } else {
        this.y = this.jumpH * 4 * this.jumpT * (1 - this.jumpT);
      }
    }

    this.root.position.set(this.x, 0, -dist);
    this.body.position.y = this.y;
    const leanTarget = (this.x - targetX) * 0.25;
    this.body.rotation.z += (leanTarget - this.body.rotation.z) * Math.min(1, dt * 12);

    // Sombra: más chica cuanto más alto salta
    const s = 1 - Math.min(0.5, this.y / 5);
    this.shadow.scale.setScalar(s);

    this.animate(dt, speed01);
  }

  private animate(dt: number, speed01: number) {
    const swingAmp = 0.9;
    let legSwing = 0;
    let armSwing = 0;
    let bob = 0;
    let squash = 1;

    if (this.mood === 'run' || this.mood === 'idle') {
      this.runPhase += dt * (4 + 7 * speed01);
      const amt = this.mood === 'run' ? Math.max(speed01, 0.15) : 0;
      legSwing = Math.sin(this.runPhase) * swingAmp * amt;
      armSwing = -legSwing * 0.8;
      bob = Math.abs(Math.sin(this.runPhase)) * 0.08 * amt;
      if (!this.onGround) {
        // Piernas recogidas en el aire
        legSwing = 0.5;
        armSwing = -1.2;
      }
    } else if (this.mood === 'bump') {
      // "¡Uy!": se aplasta un poquito y se tambalea, como un dibujo animado
      const k = Math.min(1, this.moodT / CONFIG.bumpPause);
      squash = 1 - 0.18 * Math.sin(k * Math.PI);
      this.body.rotation.z = Math.sin(this.moodT * 18) * 0.15 * (1 - k);
      armSwing = -2.4 * Math.sin(k * Math.PI);
    } else if (this.mood === 'dance') {
      // Baila con los brazos arriba (la cámara da la vuelta para verlo de frente)
      const beat = this.moodT * 6;
      bob = Math.abs(Math.sin(beat)) * 0.35;
      armSwing = -2.6 + Math.sin(beat) * 0.4;
      legSwing = Math.sin(beat) * 0.3;
      this.body.rotation.z = Math.sin(beat * 0.5) * 0.12;
    }

    this.legL.rotation.x = legSwing;
    this.legR.rotation.x = -legSwing;
    if (this.mood === 'dance' || this.mood === 'bump') {
      this.armL.rotation.x = armSwing;
      this.armR.rotation.x = armSwing;
      this.armL.rotation.z = -0.4;
      this.armR.rotation.z = 0.4;
    } else {
      this.armL.rotation.x = armSwing;
      this.armR.rotation.x = -armSwing;
      this.armL.rotation.z = 0;
      this.armR.rotation.z = 0;
    }

    this.body.position.y = this.y + bob;
    this.body.scale.set(1 + (1 - squash) * 0.6, squash, 1 + (1 - squash) * 0.6);

    // Sacudida de cabeza
    if (this.shakeT >= 0) {
      this.shakeT += dt;
      this.head.rotation.y = Math.sin(this.shakeT * 30) * 0.35 * (1 - this.shakeT / 0.45);
      if (this.shakeT > 0.45) {
        this.shakeT = -1;
        this.head.rotation.y = 0;
      }
    }
  }

  dispose() {
    for (const d of this.disposables) d.dispose();
  }
}
