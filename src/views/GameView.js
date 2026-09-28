import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { applyPSXMaterial } from '../vendor/threejs-psx-shader/src/PSXMaterial.js';
import { PSXPipeline } from '../vendor/threejs-psx-shader/src/PSXPipeline.js';

const MODEL_ROOT = '/models/';
export class GameView {
  constructor(root) {
    this.root = root;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#c17e52');
    this.scene.fog = new THREE.FogExp2('#b57950', 0.0125);
    this.camera = new THREE.PerspectiveCamera(76, 1, 0.08, 180);
    this.camera.position.set(0, 1.68, 8);
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
    this.psx = new PSXPipeline(this.renderer, this.scene, this.camera, { resolutionHeight: 240 });
    this.psx.getEffect('fog').settings.color = '#b57950';
    this.psx.getEffect('fog').settings.density = 0.007;
    this.psx.getEffect('fog').settings.offset = 8;
    this.psx.getEffect('dithering').settings.strength = 0.68;
    Object.assign(this.psx.getEffect('crt').settings, {
      vignetteAmount: 0.5,
      scanlineWeight: 0.045,
      grainWeight: 0.018,
      chromatic: 0.08,
    });
    this.previousFrameTime = performance.now();
    this.loader = new GLTFLoader();
    this.draco = new DRACOLoader();
    this.draco.setDecoderPath('/draco/');
    this.loader.setDRACOLoader(this.draco);
    this.materials = new Map();
    this.colliderSpecs = [];
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.weapon = this.createRevolver();
    this.camera.add(this.weapon);
    this.scene.add(this.camera);
    this.frame = this.frame.bind(this);
    this.buttons = null;
    this.loadingStatus = null;
    this.addLighting();
    this.buildTerrain();
    this.buildDunes();
    this.buildDust();
    this.buildCardinals();
    this.resize();
  }

  mount(viewModel) {
    this.viewModel = viewModel;
    for (const collider of this.colliderSpecs) this.viewModel.addCollider(collider.x, collider.z, collider.radius);
    this.root.innerHTML = `
      <div class="scene-shell">
        <div class="scene-label"><span class="eyebrow">BLACK ROAD ORDER</span><strong>DESERTO DOS CONDENADOS</strong><span class="coords">FRONTEIRA · 1897</span></div>
        <div class="hud-top"><div class="hud-chip"><span class="hud-dot"></span> EXPLORAÇÃO</div><div class="hud-chip">FASE 01 <b>—</b> 00:00</div></div>
        <div class="aim"><i></i><i></i><i></i><i></i><b></b></div>
        <div class="weapon-caption">COLT · SEIS TIROS</div>
        <section class="intro-card" aria-label="Iniciar exploração">
          <div class="card-rule"><span></span> UM CAMINHO SEM VOLTA <span></span></div>
          <h1>FAROESTE<br><em>BLACK ROAD ORDER</em></h1>
          <p>O vento apagou as pegadas. A estrada ainda lembra.</p>
          <button class="enter-button" type="button"><span>ENTRAR NO DESERTO</span><b>↗</b></button>
          <div class="card-controls"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> MOVER</span><span><kbd>MOUSE</kbd> OLHAR</span><span><kbd>SHIFT</kbd> CORRER</span><span><kbd>ESC</kbd> SOLTAR CURSOR</span></div>
        </section>
        <button class="resume-button" type="button" hidden>CLIQUE PARA VOLTAR AO DESERTO</button>
        <div class="hud-bottom"><span class="location-mark">⌖ &nbsp; TRILHA DAS SEPULTURAS</span><span>VENTO <b>SECO</b> &nbsp;·&nbsp; VISIBILIDADE <b>BAIXA</b></span></div>
        <div class="load-toast">Preparando o deserto…</div>
        <div class="vignette"></div>
      </div>`;
    this.root.prepend(this.renderer.domElement);
    this.root.classList.add('game-root');
    this.buttons = {
      enter: this.root.querySelector('.enter-button'),
      intro: this.root.querySelector('.intro-card'),
      resume: this.root.querySelector('.resume-button'),
      toast: this.root.querySelector('.load-toast'),
      clock: this.root.querySelectorAll('.hud-chip')[1],
    };
    this.buttons.enter.addEventListener('click', () => this.viewModel.start());
    this.buttons.resume.addEventListener('click', () => this.viewModel.start());
    this.controls.addEventListener('lock', () => {
      this.buttons.intro.classList.add('is-hidden');
      this.buttons.resume.hidden = true;
    });
    this.controls.addEventListener('unlock', () => {
      if (this.viewModel?.model.elapsed > 0) this.buttons.resume.hidden = false;
      else this.buttons.intro.classList.remove('is-hidden');
    });
    this.loadStageAssets();
    this.renderer.setAnimationLoop(this.frame);
  }

  addLighting() {
    const sky = new THREE.HemisphereLight(0xffd6a0, 0x573b2d, 1.65);
    this.scene.add(sky);
    const sun = new THREE.DirectionalLight(0xffbb83, 2.2);
    sun.position.set(-35, 52, 24);
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0xb1bac8, 0.45);
    rim.position.set(30, 20, -42);
    this.scene.add(rim);
  }

  mat(color, options = {}) {
    const key = `${color}:${options.transparent ? 1 : 0}:${options.opacity ?? 1}`;
    if (!this.materials.has(key)) {
      const material = new THREE.MeshLambertMaterial({ color, flatShading: true, ...options });
      applyPSXMaterial(material, { snap: true, affine: 0.5 });
      this.materials.set(key, material);
    }
    return this.materials.get(key);
  }

  psxMaterial(source, affine = 0.5) {
    const material = source.clone();
    applyPSXMaterial(material, { snap: true, affine });
    return material;
  }

  buildTerrain() {
    const size = 232;
    const segments = 70;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    const positions = geometry.attributes.position;
    const colors = [];
    const base = new THREE.Color('#bd8454');
    const shadow = new THREE.Color('#876044');
    const sun = new THREE.Color('#d6a36a');
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);
      const ripples = Math.sin(x * 0.13 + Math.cos(z * 0.08) * 1.1) * 0.43 + Math.sin(z * 0.27 - x * 0.04) * 0.26;
      positions.setZ(i, ripples * 0.22);
      const tint = base.clone().lerp(ripples > 0 ? sun : shadow, Math.abs(ripples) * 0.42);
      colors.push(tint.r, tint.g, tint.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();
    const ground = new THREE.Mesh(geometry, this.mat('#ffffff', { vertexColors: true, side: THREE.DoubleSide }));
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.world.add(ground);

    const trackGeometry = new THREE.PlaneGeometry(10, 205, 8, 70);
    const trackColors = [];
    for (let i = 0; i < trackGeometry.attributes.position.count; i++) {
      const x = trackGeometry.attributes.position.getX(i);
      const tint = new THREE.Color(x > 0 ? '#99704e' : '#a27853');
      trackColors.push(tint.r, tint.g, tint.b);
    }
    trackGeometry.setAttribute('color', new THREE.Float32BufferAttribute(trackColors, 3));
    trackGeometry.rotateX(-Math.PI / 2);
    const track = new THREE.Mesh(trackGeometry, this.mat('#ffffff', { vertexColors: true, side: THREE.DoubleSide }));
    track.position.set(0, 0.012, -24);
    this.world.add(track);

    // The far ridge encloses the walkable stage while reading as a canyon horizon.
    for (let i = 0; i < 36; i++) {
      const angle = i / 36 * Math.PI * 2;
      const radius = 117 + Math.sin(i * 12.3) * 3.5;
      const height = 12 + (Math.sin(i * 8.1) + 1) * 9;
      const rock = new THREE.Mesh(
        new THREE.ConeGeometry(9 + (i % 4) * 1.8, height, 5 + i % 3),
        this.mat(i % 2 ? '#755240' : '#895b3d'),
      );
      rock.position.set(Math.sin(angle) * radius, height * 0.5 - 0.8, Math.cos(angle) * radius);
      rock.rotation.y = i * 0.9;
      rock.rotation.z = Math.sin(i * 5.7) * 0.12;
      this.world.add(rock);
    }
  }

  buildDunes() {
    for (let i = 0; i < 32; i++) {
      const side = i % 2 ? -1 : 1;
      const row = Math.floor(i / 2);
      const z = -91 + row * 12.2;
      const x = side * (19 + (row % 4) * 5.1);
      const height = 3.5 + (row % 5) * 0.65;
      const dune = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1, 1),
        this.mat(row % 3 ? '#c69562' : '#d1a170'),
      );
      dune.position.set(x, height * 0.23 - 0.1, z);
      dune.scale.set(13 + (row % 3) * 2, height, 8 + (row % 4));
      dune.rotation.y = row * 0.62;
      this.world.add(dune);
    }

    const cactusMat = this.mat('#66724b');
    for (let i = 0; i < 19; i++) {
      const angle = i * 2.399963;
      const radius = 16 + (i % 6) * 11;
      const x = Math.sin(angle) * radius;
      const z = -Math.cos(angle) * radius - 15;
      if (Math.abs(x) < 7 && z < 5 && z > -68) continue;
      const height = 1.9 + (i % 3) * 0.45;
      const group = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, height, 5), cactusMat);
      trunk.position.y = height / 2;
      group.add(trunk);
      for (const dir of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.85, 5), cactusMat);
        arm.position.set(dir * 0.38, height * 0.61, 0);
        arm.rotation.z = dir * -0.6;
        group.add(arm);
        const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.58, 5), cactusMat);
        tip.position.set(dir * 0.66, height * 0.84, 0);
        group.add(tip);
      }
      group.position.set(x, 0, z);
      this.world.add(group);
      this.addStaticCollider(x, z, 0.8);
    }
  }

  buildDust() {
    const count = 1200;
    const points = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = i * 17.17;
      const radius = 6 + (i * 13.57) % 95;
      points[i * 3] = Math.sin(angle) * radius;
      points[i * 3 + 1] = 0.15 + ((i * 7.33) % 48) / 10;
      points[i * 3 + 2] = Math.cos(angle) * radius;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
    const dust = new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#ecc49a', size: 0.09, transparent: true, opacity: 0.32, sizeAttenuation: true }));
    dust.name = 'suspended-dust';
    this.world.add(dust);
    this.dust = dust;
  }

  buildCardinals() {
    const markers = [
      { x: -11, z: -13, kind: 'grave' }, { x: 14, z: -25, kind: 'grave' },
      { x: -17, z: -49, kind: 'grave' }, { x: 22, z: -59, kind: 'grave' },
      { x: -29, z: -76, kind: 'grave' }, { x: 15, z: -87, kind: 'grave' },
      { x: -15, z: 18, kind: 'tree' }, { x: 24, z: 30, kind: 'tree' },
      { x: 43, z: -21, kind: 'tree' }, { x: -43, z: -33, kind: 'tree' },
      { x: -34, z: 8, kind: 'tree' }, { x: 48, z: 4, kind: 'tree' },
      { x: -17, z: -35, kind: 'coffin' }, { x: 19, z: -70, kind: 'coffin' },
    ];
    for (const marker of markers) this.loadProp(marker.kind, marker.x, marker.z, markers);
    this.buildProceduralWagons();
    this.buildTelegraphLine();
  }

  addStaticCollider(x, z, radius) {
    this.colliderSpecs.push({ x, z, radius });
    this.viewModel?.addCollider(x, z, radius);
  }

  buildProceduralWagons() {
    for (const [x, z, rotation] of [[-25, -5, 0.2], [30, -43, -0.65], [-44, -69, 0.34]]) {
      const wagon = new THREE.Group();
      const wood = this.mat('#704634');
      const darkWood = this.mat('#482e25');
      const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.82, 2.1), wood);
      body.position.y = 0.94;
      wagon.add(body);
      const bed = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.16, 2.15), darkWood);
      bed.position.y = 1.42;
      wagon.add(bed);
      for (let side = -1; side <= 1; side += 2) {
        for (let board = 0; board < 3; board++) {
          const rail = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.16, 0.15), wood);
          rail.position.set(0, 1.63 + board * 0.19, side * 0.97);
          wagon.add(rail);
        }
        for (let axle = -1; axle <= 1; axle += 2) {
          const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.63, 0.14, 5, 8), darkWood);
          wheel.position.set(axle * 1.28, 0.63, side * 1.14);
          wheel.rotation.y = Math.PI / 2;
          wagon.add(wheel);
          const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.25, 6), this.mat('#b17a45'));
          hub.position.copy(wheel.position);
          hub.rotation.z = Math.PI / 2;
          wagon.add(hub);
        }
      }
      wagon.position.set(x, 0, z);
      wagon.rotation.y = rotation;
      this.world.add(wagon);
      this.addStaticCollider(x, z, 2.8);
    }
  }

  buildTelegraphLine() {
    const postMat = this.mat('#51382d');
    const polePositions = [-53, -21, 15, 51];
    for (const z of polePositions) {
      const post = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6.4, 0.34), postMat);
      trunk.position.y = 3.2;
      post.add(trunk);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(3, 0.24, 0.3), postMat);
      beam.position.y = 5.8;
      post.add(beam);
      for (const x of [-1.1, 0, 1.1]) {
        const insulator = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.24), this.mat('#c69b6b'));
        insulator.position.set(x, 6.06, 0);
        post.add(insulator);
      }
      post.position.set(-8, 0, z);
      this.world.add(post);
      this.addStaticCollider(-8, z, 0.45);
    }
    const wirePoints = [];
    for (let i = 0; i < polePositions.length - 1; i++) {
      const z1 = polePositions[i];
      const z2 = polePositions[i + 1];
      wirePoints.push(new THREE.Vector3(-8, 6.0, z1), new THREE.Vector3(-8, 5.65, (z1 + z2) / 2), new THREE.Vector3(-8, 6.0, z2));
    }
    const wires = new THREE.BufferGeometry().setFromPoints(wirePoints);
    this.world.add(new THREE.LineSegments(wires, new THREE.LineBasicMaterial({ color: '#362925' })));
  }

  async loadProp(kind, x, z) {
    const paths = { grave: 'gravestone.glb', tree: 'dead-tree.glb', coffin: 'coffin.glb' };
    try {
      const { scene } = await this.loader.loadAsync(`${MODEL_ROOT}${paths[kind]}`);
      scene.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = Array.isArray(child.material)
          ? child.material.map((material) => this.psxMaterial(material, 0.45))
          : this.psxMaterial(child.material, 0.45);
      });
      const bounds = new THREE.Box3().setFromObject(scene);
      const size = bounds.getSize(new THREE.Vector3());
      const desired = kind === 'tree' ? 6.3 : kind === 'coffin' ? 2.4 : 2.3;
      const scale = desired / Math.max(size.x, size.y, size.z);
      scene.scale.setScalar(scale);
      const scaledBounds = new THREE.Box3().setFromObject(scene);
      scene.position.set(x, -scaledBounds.min.y, z);
      scene.rotation.y = ((Math.abs(x * 7 + z * 3) % 21) - 10) * 0.08;
      this.world.add(scene);
      this.addStaticCollider(x, z, kind === 'tree' ? 0.8 : 0.75);
    } catch (error) {
      console.error(`Não foi possível carregar o marco ${kind}.`, error);
    }
  }

  loadStageAssets() {
    const status = this.root.querySelector('.load-toast');
    const progress = [];
    for (const [filename, x, z, scale, rotation] of [
      ['dune-tile.glb', -43, -54, 4.2, 0.5],
      ['dune-slope-corner-tile.glb', 48, -73, 3.2, -0.7],
      ['road-sand-straight.glb', 0, -35, 3.6, 0],
      ['waypost.glb', 34, -10, 1.8, -0.3],
    ]) {
      const task = this.loader.loadAsync(`${MODEL_ROOT}${filename}`).then(({ scene }) => {
        scene.traverse((child) => {
          if (!child.isMesh) return;
          child.castShadow = true;
          child.receiveShadow = true;
          child.material = Array.isArray(child.material)
            ? child.material.map((material) => this.psxMaterial(material, 0.5))
            : this.psxMaterial(child.material, 0.5);
        });
        scene.scale.setScalar(scale);
        const scaled = new THREE.Box3().setFromObject(scene);
        scene.position.set(x, -scaled.min.y, z);
        scene.rotation.y = rotation;
        this.world.add(scene);
        if (filename === 'waypost.glb') this.addStaticCollider(x, z, 0.8);
      }).catch((error) => console.error(`Falha ao carregar ${filename}`, error));
      progress.push(task);
    }
    Promise.allSettled(progress).then(() => status?.classList.add('is-hidden'));
  }

  createRevolver() {
    const group = new THREE.Group();
    group.position.set(0.46, -0.43, -0.58);
    group.scale.setScalar(0.52);
    group.rotation.set(-0.04, -0.07, -0.025);
    const skin = this.mat('#bd8060');
    const sleeve = this.mat('#50332c');
    const metal = this.mat('#777c79');
    const darkMetal = this.mat('#373d3c');
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.68, 0.24), sleeve);
    arm.position.set(-0.07, -0.23, 0.12);
    arm.rotation.z = -0.18;
    group.add(arm);
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.18), skin);
    hand.position.set(-0.05, 0.05, -0.08);
    group.add(hand);
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.42), metal);
    barrel.position.set(0.03, 0.18, -0.37);
    group.add(barrel);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.2), metal);
    frame.position.set(0, 0.1, -0.1);
    group.add(frame);
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.2, 7), darkMetal);
    cylinder.rotation.z = Math.PI / 2;
    cylinder.position.set(0, 0.11, -0.13);
    group.add(cylinder);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.28, 0.14), this.mat('#604230'));
    grip.position.set(-0.035, -0.12, -0.005);
    grip.rotation.x = -0.28;
    group.add(grip);
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 0.04), darkMetal);
    sight.position.set(0.03, 0.25, -0.3);
    group.add(sight);
    group.traverse((child) => { if (child.isMesh) child.renderOrder = 3; });
    return group;
  }

  resize() {
    if (!this.renderer) return;
    const width = Math.max(1, this.root.clientWidth || window.innerWidth);
    const height = Math.max(1, this.root.clientHeight || window.innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.psx.setSize(width, height);
  }

  update(delta, model) {
    const sway = model.walking ? Math.sin(model.elapsed * 10) : 0;
    this.weapon.position.y = -0.3 + sway * 0.018;
    this.weapon.rotation.z = -0.025 + sway * 0.012;
    this.dust.rotation.y += delta * 0.018;
    if (this.buttons?.clock) {
      const minutes = Math.floor(model.elapsed / 60).toString().padStart(2, '0');
      const seconds = Math.floor(model.elapsed % 60).toString().padStart(2, '0');
      this.buttons.clock.innerHTML = `FASE 01 <b>—</b> ${minutes}:${seconds}`;
    }
  }

  frame() {
    const now = performance.now();
    const delta = Math.min((now - this.previousFrameTime) / 1000, 0.05);
    this.previousFrameTime = now;
    this.viewModel?.update(delta);
    this.psx.render(delta);
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.psx.dispose();
    this.draco.dispose();
    this.renderer.dispose();
  }
}
