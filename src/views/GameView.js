import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { applyPSXMaterial } from '../vendor/threejs-psx-shader/src/PSXMaterial.js';
import { PSXPipeline } from '../vendor/threejs-psx-shader/src/PSXPipeline.js';

const BASE_URL = import.meta.env.BASE_URL;
const MODEL_ROOT = `${BASE_URL}models/`;
export class GameView {
  constructor(root) {
    this.root = root;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#111d38');
    this.scene.fog = new THREE.FogExp2('#172640', 0.0028);
    this.camera = new THREE.PerspectiveCamera(76, 1, 0.08, 400);
    this.camera.position.set(0, 1.68, 218);
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
    this.psx = new PSXPipeline(this.renderer, this.scene, this.camera, { resolutionHeight: 240 });
    this.psx.getEffect('fog').settings.color = '#172640';
    this.psx.getEffect('fog').settings.density = 0.0025;
    this.psx.getEffect('fog').settings.offset = 14;
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
    this.draco.setDecoderPath(`${BASE_URL}draco/`);
    this.loader.setDRACOLoader(this.draco);
    this.materials = new Map();
    this.colliderSpecs = [];
    this.enemyTemplates = new Map();
    this.enemyActors = new Map();
    this.enemyLoadJobs = [];
    this.whipTimer = 0;
    this.endShown = false;
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.weapon = this.createWhipHand();
    this.camera.add(this.weapon);
    this.whipLine = this.createWhipLine();
    this.scene.add(this.camera);
    this.frame = this.frame.bind(this);
    this.buttons = null;
    this.addLighting();
    this.buildMoon();
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
        <div class="combat-hud" aria-live="polite"><span>VIDA <b class="health-value">100/100</b></span><span>MOEDAS <b class="coins-value">0</b></span></div>
        <section class="main-menu" aria-label="Menu principal">
          <div class="menu-art" style="--menu-image: url('${BASE_URL}art/menu-black-trail.png')"></div>
          <div class="menu-moon-glow"></div><div class="menu-wind"></div>
          <div class="menu-lantern menu-lantern-one"></div><div class="menu-lantern menu-lantern-two"></div>
          <div class="menu-zombie menu-zombie-one"></div><div class="menu-zombie menu-zombie-two"></div>
          <div class="menu-panel">
            <img class="game-logo" src="${BASE_URL}art/logo-black-trail-order.png" alt="Faroeste Black Trail Order: caveira de boi e trem negro" />
            <nav aria-label="Opções do jogo"><button class="enter-button" type="button"><span>NOVA JORNADA</span><b>↗</b></button><button class="guide-button" type="button">COMO JOGAR <span>⌖</span></button></nav>
            <p class="menu-guide" hidden><kbd>W</kbd> frente &nbsp; <kbd>S</kbd> trás &nbsp; <kbd>A</kbd> esquerda &nbsp; <kbd>D</kbd> direita<br>No celular ou tablet, gire o aparelho na horizontal, use o controle esquerdo para andar e arraste o lado direito para olhar. O chicote ataca sozinho quando há um inimigo à frente. Todos deixam experiência; alguns deixam moedas.</p>
          </div>
        </section>
        <button class="resume-button" type="button" hidden>${this.viewModel.touchDevice ? 'TOQUE PARA VOLTAR AO DESERTO' : 'CLIQUE PARA VOLTAR AO DESERTO'}</button>
        <div class="touch-controls" aria-label="Controles de toque">
          <div class="touch-joystick" aria-label="Mover"><div class="touch-stick"></div></div>
          <div class="touch-look" aria-label="Arraste para olhar"></div>
          <button class="touch-pause" type="button" aria-label="Pausar">Ⅱ</button>
        </div>
        <section class="cards-overlay" hidden aria-label="Escolha uma carta"><div class="cards-panel"><span class="cards-kicker">UM NOVO NÍVEL</span><h2>ESCOLHA SUA CARTA</h2><p>A estrada fica mais perigosa a cada minuto.</p><div class="cards-list"></div></div></section>
        <section class="end-overlay" hidden><div class="end-panel"><span class="end-kicker">BLACK TRAIL ORDER</span><h2 class="end-title"></h2><p class="end-copy"></p><button class="restart-button" type="button">NOVA JORNADA</button></div></section>
        <div class="xp-track" role="progressbar" aria-label="Experiência para o próximo nível" aria-valuemin="0" aria-valuenow="0" aria-valuemax="100"><div class="xp-fill"></div><span class="xp-label">NÍVEL 1 · 0/100 XP</span></div>
        <div class="rotate-device" role="status"><span class="rotate-symbol" aria-hidden="true">▯</span><strong>GIRE O APARELHO</strong><p>Jogue na horizontal. Se preciso, desative o bloqueio de rotação.</p></div>
        <div class="vignette"></div>
      </div>`;
    this.root.prepend(this.renderer.domElement);
    this.root.classList.add('game-root');
    this.buttons = {
      enter: this.root.querySelector('.enter-button'),
      menu: this.root.querySelector('.main-menu'),
      resume: this.root.querySelector('.resume-button'),
      guide: this.root.querySelector('.guide-button'),
      guideText: this.root.querySelector('.menu-guide'),
      cards: this.root.querySelector('.cards-overlay'),
      cardsList: this.root.querySelector('.cards-list'),
      end: this.root.querySelector('.end-overlay'),
      health: this.root.querySelector('.health-value'),
      coins: this.root.querySelector('.coins-value'),
      xpTrack: this.root.querySelector('.xp-track'),
      xpFill: this.root.querySelector('.xp-fill'),
      xpLabel: this.root.querySelector('.xp-label'),
    };
    this.buttons.enter.addEventListener('click', () => this.viewModel.start());
    this.buttons.resume.addEventListener('click', () => this.viewModel.start());
    this.buttons.guide.addEventListener('click', () => { this.buttons.guideText.hidden = !this.buttons.guideText.hidden; });
    this.buttons.cardsList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-card]');
      if (button) this.viewModel.chooseCard(button.dataset.card);
    });
    this.root.querySelector('.restart-button').addEventListener('click', () => window.location.reload());
    this.bindTouchControls();
    this.controls.addEventListener('lock', () => {
      this.buttons.menu.classList.add('is-hidden');
      this.buttons.resume.hidden = true;
    });
    this.controls.addEventListener('unlock', () => {
      if (this.viewModel?.model.phase === 'playing') this.buttons.resume.hidden = false;
    });
    this.loadStageAssets();
    this.renderer.setAnimationLoop(this.frame);
  }

  hideMenu() {
    this.buttons.menu.classList.add('is-hidden');
    this.root.classList.add('is-started');
  }

  showResume() { this.buttons.resume.hidden = false; }

  hideResume() { this.buttons.resume.hidden = true; }

  bindTouchControls() {
    const joystick = this.root.querySelector('.touch-joystick');
    const stick = this.root.querySelector('.touch-stick');
    const look = this.root.querySelector('.touch-look');
    let movePointer = null;
    let lookPointer = null;
    let lastX = 0, lastY = 0;
    const updateStick = (event) => {
      const rect = joystick.getBoundingClientRect();
      const radius = rect.width * 0.34;
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const scale = Math.min(1, radius / Math.max(radius, Math.hypot(dx, dy)));
      const x = dx * scale, y = dy * scale;
      stick.style.transform = `translate(${x}px, ${y}px)`;
      this.viewModel.setTouchMove(Math.abs(x) < 5 ? 0 : x / radius, Math.abs(y) < 5 ? 0 : -y / radius);
    };
    joystick.addEventListener('pointerdown', (event) => {
      if (!this.viewModel.model.isLocked || movePointer !== null) return;
      event.preventDefault();
      movePointer = event.pointerId;
      joystick.setPointerCapture(movePointer);
      updateStick(event);
    });
    joystick.addEventListener('pointermove', (event) => { if (event.pointerId === movePointer) updateStick(event); });
    const stopMove = (event) => {
      if (event.pointerId !== movePointer) return;
      movePointer = null;
      stick.style.transform = '';
      this.viewModel.setTouchMove(0, 0);
    };
    joystick.addEventListener('pointerup', stopMove);
    joystick.addEventListener('pointercancel', stopMove);
    look.addEventListener('pointerdown', (event) => {
      if (!this.viewModel.model.isLocked || lookPointer !== null) return;
      event.preventDefault();
      lookPointer = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      look.setPointerCapture(lookPointer);
    });
    look.addEventListener('pointermove', (event) => {
      if (event.pointerId !== lookPointer) return;
      this.viewModel.lookBy(event.clientX - lastX, event.clientY - lastY);
      lastX = event.clientX;
      lastY = event.clientY;
    });
    const stopLook = (event) => { if (event.pointerId === lookPointer) lookPointer = null; };
    look.addEventListener('pointerup', stopLook);
    look.addEventListener('pointercancel', stopLook);
    this.root.querySelector('.touch-pause').addEventListener('click', () => this.viewModel.pause());
  }

  showCards(offers) {
    const cards = {
      damage: ['✦', 'CHICOTE REFORÇADO', '+5 de dano no chicote'],
      cooldown: ['⌛', 'PULSO FIRME', 'Chicotadas mais frequentes'],
      speed: ['➤', 'PASSO VELOZ', 'João anda mais rápido'],
      health: ['♥', 'CORAÇÃO DE VAQUEIRO', '+20 de vida máxima e cura 20'],
    };
    this.buttons.cardsList.innerHTML = offers.map((id) => {
      const [icon, name, description] = cards[id];
      return `<button type="button" data-card="${id}"><b>${icon}</b><strong>${name}</strong><span>${description}</span></button>`;
    }).join('');
    this.buttons.cards.hidden = false;
  }

  hideCards() { this.buttons.cards.hidden = true; }

  showEnd(model) {
    if (this.endShown) return;
    this.endShown = true;
    this.buttons.end.querySelector('.end-title').textContent = model.phase === 'victory' ? 'A LUA SE PÔS.' : 'A ESTRADA COBROU SEU PREÇO.';
    this.buttons.end.querySelector('.end-copy').textContent = model.phase === 'victory'
      ? `João atravessou o Deserto dos Condenados. ${model.kills} inimigos ficaram para trás.`
      : `João resistiu ${Math.floor(model.elapsed / 60)} minutos e derrotou ${model.kills} inimigos.`;
    this.buttons.end.hidden = false;
  }

  addLighting() {
    const sky = new THREE.HemisphereLight(0xc8dcff, 0x393945, 2.3);
    this.scene.add(sky);
    const moonlight = new THREE.DirectionalLight(0xc6dcff, 2.7);
    moonlight.position.set(-70, 85, -130);
    this.scene.add(moonlight);
    const rim = new THREE.DirectionalLight(0x7a8cb8, 0.6);
    rim.position.set(30, 20, 42);
    this.scene.add(rim);
  }

  buildMoon() {
    const moon = new THREE.Mesh(new THREE.SphereGeometry(10, 16, 10), new THREE.MeshBasicMaterial({ color: '#ecf3ff', fog: false }));
    moon.position.set(-120, 160, -45);
    this.scene.add(moon);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(14.5, 16, 8), new THREE.MeshBasicMaterial({ color: '#8ca9de', transparent: true, opacity: 0.11, depthWrite: false, fog: false }));
    halo.position.copy(moon.position);
    this.scene.add(halo);
    const stars = new Float32Array(110 * 3);
    for (let i = 0; i < 110; i++) {
      const angle = i * 2.399963;
      const radius = 110 + (i * 41.7) % 170;
      stars[i * 3] = Math.sin(angle) * radius;
      stars[i * 3 + 1] = 75 + (i * 19.3) % 110;
      stars[i * 3 + 2] = Math.cos(angle) * radius;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(stars, 3));
    this.scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#d6e4ff', size: 0.6, fog: false, sizeAttenuation: true })));
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
    const size = 620;
    const segments = 70;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    const positions = geometry.attributes.position;
    const colors = [];
    const base = new THREE.Color('#6d7288');
    const shadow = new THREE.Color('#414a66');
    const sun = new THREE.Color('#a2abc2');
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);
      const ripples = Math.sin(x * 0.13 + Math.cos(z * 0.08) * 1.1) * 0.43 + Math.sin(z * 0.27 - x * 0.04) * 0.26;
      positions.setZ(i, Math.abs(x) < 9 ? -0.16 : ripples * 0.22);
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

    const trackGeometry = new THREE.PlaneGeometry(14, 460, 8, 120);
    const trackColors = [];
    for (let i = 0; i < trackGeometry.attributes.position.count; i++) {
      const x = trackGeometry.attributes.position.getX(i);
      const tint = new THREE.Color(x > 0 ? '#414a61' : '#4a5369');
      trackColors.push(tint.r, tint.g, tint.b);
    }
    trackGeometry.setAttribute('color', new THREE.Float32BufferAttribute(trackColors, 3));
    trackGeometry.rotateX(-Math.PI / 2);
    const track = new THREE.Mesh(trackGeometry, this.mat('#ffffff', { vertexColors: true, side: THREE.DoubleSide }));
    track.position.set(0, 0.012, 0);
    this.world.add(track);

    for (const x of [-4.4, 4.4]) {
      const rut = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 460), this.mat('#262f43', { side: THREE.DoubleSide }));
      rut.rotation.x = -Math.PI / 2;
      rut.position.set(x, 0.03, 0);
      this.world.add(rut);
    }

    // The far ridge encloses the walkable stage while reading as a canyon horizon.
    for (let i = 0; i < 30; i++) {
      const angle = (i + 0.5) / 30 * Math.PI * 2;
      const radius = 269 + Math.sin(i * 12.3) * 12;
      const height = 46 + (Math.sin(i * 8.1) + 1) * 28;
      const mesa = new THREE.Mesh(
        new THREE.CylinderGeometry(10 + i % 3 * 3, 21 + i % 4 * 2, height, 5),
        this.mat(i % 2 ? '#3b4058' : '#464a60'),
      );
      mesa.position.set(Math.sin(angle) * radius, height * 0.5 - 1, Math.cos(angle) * radius);
      mesa.rotation.y = i * 0.58;
      this.world.add(mesa);
    }
    for (const [x, z, width, height] of [
      [-82, -24, 1.8, 90], [84, -67, 1.6, 105], [-148, 60, 1.8, 74], [142, -164, 1.55, 96],
    ]) {
      const butte = new THREE.Mesh(new THREE.CylinderGeometry(19, 29, height, 6), this.mat('#30384d'));
      butte.position.set(x, height * 0.5 - 1, z);
      butte.scale.x = width;
      this.world.add(butte);
    }
  }

  buildDunes() {
    for (let i = 0; i < 36; i++) {
      const side = i % 2 ? -1 : 1;
      const row = Math.floor(i / 2);
      const z = -215 + row * 25;
      const x = side * (105 + (row % 4) * 14);
      const height = 2.8 + (row % 5) * 0.55;
      const dune = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1, 1),
        this.mat(row % 3 ? '#666a80' : '#7e8194'),
      );
      dune.position.set(x, height * 0.23 - 0.1, z);
      dune.scale.set(17 + (row % 3) * 3, height, 10 + (row % 4));
      dune.rotation.y = row * 0.62;
      this.world.add(dune);
    }

    const cactusMat = this.mat('#354f50');
    for (let i = 0; i < 44; i++) {
      const angle = i * 2.399963;
      const radius = 28 + (i % 7) * 23;
      const x = Math.sin(angle) * radius;
      const z = -Math.cos(angle) * radius;
      if (Math.abs(x) < 20) continue;
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
      const radius = 6 + (i * 13.57) % 170;
      points[i * 3] = Math.sin(angle) * radius;
      points[i * 3 + 1] = 0.15 + ((i * 7.33) % 48) / 10;
      points[i * 3 + 2] = Math.cos(angle) * radius;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
    const dust = new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#c7d5e9', size: 0.08, transparent: true, opacity: 0.27, sizeAttenuation: true }));
    dust.name = 'suspended-dust';
    this.world.add(dust);
    this.dust = dust;
  }

  buildCardinals() {
    const markers = [
      { x: -28, z: 166, kind: 'grave' }, { x: 33, z: 121, kind: 'grave' },
      { x: -48, z: 40, kind: 'grave' }, { x: 34, z: -57, kind: 'grave' },
      { x: -29, z: -165, kind: 'grave' }, { x: 42, z: -197, kind: 'grave' },
      { x: -35, z: 155, kind: 'tree' }, { x: 45, z: 97, kind: 'tree' },
      { x: 61, z: -21, kind: 'tree' }, { x: -53, z: -108, kind: 'tree' },
      { x: -34, z: -185, kind: 'tree' }, { x: 58, z: -179, kind: 'tree' },
      { x: -31, z: 80, kind: 'coffin' }, { x: 36, z: -145, kind: 'coffin' },
    ];
    for (const marker of markers) this.loadProp(marker.kind, marker.x, marker.z, markers);
    this.buildProceduralWagons();
    this.buildTelegraphLine();
    this.buildFences();
  }

  addStaticCollider(x, z, radius) {
    this.colliderSpecs.push({ x, z, radius });
    this.viewModel?.addCollider(x, z, radius);
  }

  buildProceduralWagons() {
    for (const [x, z, rotation] of [[-31, 145, 0.2], [39, 15, -0.65], [-48, -155, 0.34]]) {
      const wagon = new THREE.Group();
      const wood = this.mat('#5d4d52');
      const darkWood = this.mat('#302b39');
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
    const postMat = this.mat('#3d3943');
    const polePositions = [-205, -155, -105, -55, -5, 45, 95, 145, 195];
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
      post.position.set(-12, 0, z);
      this.world.add(post);
      this.addStaticCollider(-12, z, 0.45);
    }
    const wirePoints = [];
    for (let i = 0; i < polePositions.length - 1; i++) {
      const z1 = polePositions[i];
      const z2 = polePositions[i + 1];
      wirePoints.push(new THREE.Vector3(-12, 6.0, z1), new THREE.Vector3(-12, 5.65, (z1 + z2) / 2), new THREE.Vector3(-12, 6.0, z2));
    }
    const wires = new THREE.BufferGeometry().setFromPoints(wirePoints);
    this.world.add(new THREE.LineSegments(wires, new THREE.LineBasicMaterial({ color: '#222937' })));
  }

  buildFences() {
    const wood = this.mat('#51444b');
    const sections = [[21, 187, 5], [31, 102, 6], [-36, 61, 4], [39, -28, 6], [-46, -126, 5], [28, -190, 5]];
    for (const [x, z, count] of sections) {
      for (let i = 0; i < count; i++) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.45, 0.24), wood);
        post.position.set(x + i * 2.2, 0.72, z);
        post.rotation.z = Math.sin(i * 3.2) * 0.08;
        this.world.add(post);
        if (i === count - 1) continue;
        for (const y of [0.65, 1.12]) {
          const rail = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.13, 0.12), wood);
          rail.position.set(x + i * 2.2 + 1.1, y, z);
          this.world.add(rail);
        }
      }
    }
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
    const progress = [];
    for (const [filename, x, z, scale, rotation] of [
      ['waypost.glb', 25, 155, 1.8, -0.3],
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
    for (const [filename, x, z, width, rotation] of [
      ['mudbrick-house.glb', 43, 156, 13, -0.18],
      ['farmhouse.glb', -49, 56, 15, 0.3],
      ['shack.glb', 51, -43, 11, -0.42],
      ['mudbrick-house.glb', -52, -148, 13, 0.2],
    ]) progress.push(this.loadHouse(filename, x, z, width, rotation));
    for (const type of ['bat', 'dog', 'skeleton', 'marshal']) progress.push(this.loadEnemyTemplate(type));
    Promise.allSettled(progress);
  }

  async loadHouse(filename, x, z, desiredWidth, rotation) {
    try {
      const { scene } = await this.loader.loadAsync(`${MODEL_ROOT}${filename}`);
      scene.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = Array.isArray(child.material)
          ? child.material.map((material) => this.psxMaterial(material, 0.4))
          : this.psxMaterial(child.material, 0.4);
      });
      const bounds = new THREE.Box3().setFromObject(scene);
      const size = bounds.getSize(new THREE.Vector3());
      scene.scale.setScalar(desiredWidth / Math.max(size.x, size.z));
      const floor = new THREE.Box3().setFromObject(scene);
      scene.position.set(x, -floor.min.y, z);
      scene.rotation.y = rotation;
      this.world.add(scene);
      this.addStaticCollider(x, z, desiredWidth * 0.34);
      const lantern = new THREE.PointLight(0xffa75c, 11, 14, 2);
      lantern.position.set(x + 3, 2.5, z + 2);
      this.world.add(lantern);
    } catch (error) {
      console.error(`Falha ao carregar ${filename}`, error);
    }
  }

  async loadEnemyTemplate(type) {
    try {
      const { scene, animations } = await this.loader.loadAsync(`${MODEL_ROOT}${type}.glb`);
      scene.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.material = Array.isArray(child.material)
          ? child.material.map((material) => this.psxMaterial(material, 0.35))
          : this.psxMaterial(child.material, 0.35);
      });
      const bounds = new THREE.Box3().setFromObject(scene);
      const size = bounds.getSize(new THREE.Vector3());
      scene.scale.setScalar((type === 'bat' ? 2.15 : 2.3) / Math.max(size.x, size.y, size.z));
      const scaled = new THREE.Box3().setFromObject(scene);
      scene.position.y = type === 'bat' ? -(scaled.min.y + scaled.max.y) / 2 : -scaled.min.y;
      this.enemyTemplates.set(type, { scene, animations });
    } catch (error) {
      console.error(`Falha ao carregar ${type}.`, error);
    }
  }

  addEnemy(type, x, y, z, boss = false) {
    const template = this.enemyTemplates.get(type);
    if (!template) return null;
    const root = new THREE.Group();
    const body = cloneSkinned(template.scene);
    root.add(body);
    root.position.set(x, y, z);
    const scale = boss ? 2.7 : 1;
    root.scale.setScalar(scale);
    this.world.add(root);
    const mixer = new THREE.AnimationMixer(body);
    const preferred = type === 'bat' ? /fly/i : /run|walk/i;
    const clip = template.animations.find((item) => preferred.test(item.name)) || template.animations[0];
    if (clip) mixer.clipAction(clip).play();
    this.enemyActors.set(root, { mixer, flash: 0, scale });
    return root;
  }

  updateEnemy(object, delta) {
    const actor = this.enemyActors.get(object);
    if (!actor) return;
    actor.mixer.update(delta);
    actor.flash = Math.max(0, actor.flash - delta);
    object.scale.setScalar(actor.scale * (actor.flash > 0 ? 1.1 : 1));
  }

  hitEnemy(object) {
    const actor = this.enemyActors.get(object);
    if (actor) actor.flash = 0.1;
  }

  removeEnemy(object) {
    if (!object) return;
    this.world.remove(object);
    this.enemyActors.get(object)?.mixer.stopAllAction();
    this.enemyActors.delete(object);
  }

  addLoot(x, z, kind = 'xp') {
    const isCoin = kind === 'coin';
    const object = new THREE.Mesh(
      isCoin ? new THREE.CylinderGeometry(0.28, 0.28, 0.09, 8) : new THREE.OctahedronGeometry(0.34, 0),
      new THREE.MeshBasicMaterial({ color: isCoin ? '#f2b94f' : '#8fd6f7' }),
    );
    if (isCoin) object.rotation.x = Math.PI / 2;
    object.position.set(x, 0.55, z);
    this.world.add(object);
    return object;
  }

  removeLoot(object) { this.world.remove(object); }

  addProjectile(x, y, z) {
    const object = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), new THREE.MeshBasicMaterial({ color: '#ef9e65' }));
    object.position.set(x, y, z);
    this.world.add(object);
    return object;
  }

  removeProjectile(object) { this.world.remove(object); }

  startWhip() {
    this.whipTimer = 0.38;
  }

  createWhipHand() {
    const group = new THREE.Group();
    group.position.set(0.43, -0.49, -0.72);
    group.scale.setScalar(0.43);
    group.rotation.set(-0.04, -0.07, -0.06);
    const skin = this.mat('#bd8060');
    const sleeve = this.mat('#50332c');
    const leather = this.mat('#67412d');
    const brass = this.mat('#b18a52');
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.68, 0.24), sleeve);
    arm.position.set(-0.07, -0.23, 0.12);
    arm.rotation.z = -0.18;
    group.add(arm);
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.18), skin);
    hand.position.set(-0.05, 0.05, -0.08);
    group.add(hand);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.62, 6), leather);
    handle.position.set(0.02, 0.22, -0.3);
    handle.rotation.x = -0.28;
    handle.rotation.z = -0.28;
    group.add(handle);
    const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.1, 6), brass);
    ferrule.position.set(0.1, 0.47, -0.39);
    ferrule.rotation.z = -0.28;
    group.add(ferrule);
    const cord = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 4, 7), leather);
    cord.position.set(0.02, -0.04, -0.05);
    cord.rotation.y = Math.PI / 2;
    group.add(cord);
    group.traverse((child) => { if (child.isMesh) child.renderOrder = 3; });
    return group;
  }

  createWhipLine() {
    const positions = new Float32Array(24 * 6 * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const line = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: '#d5af80', transparent: true, opacity: 0.98, depthWrite: false, side: THREE.DoubleSide }));
    line.frustumCulled = false;
    line.visible = false;
    line.renderOrder = 4;
    this.world.add(line);
    return line;
  }

  updateWhip(delta) {
    if (this.whipTimer <= 0) {
      this.whipLine.visible = false;
      return;
    }
    this.whipTimer = Math.max(0, this.whipTimer - delta);
    const progress = 1 - this.whipTimer / 0.38;
    const yaw = this.camera.rotation.y;
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const origin = new THREE.Vector3(this.camera.position.x, this.camera.position.y - 0.38, this.camera.position.z).addScaledVector(right, 0.32);
    const points = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const angle = 0.78 - progress * 1.56 + Math.sin(u * Math.PI) * 0.23;
      const reach = 0.45 + u * 4.7;
      const curl = Math.sin(u * Math.PI * 2 - progress * 7) * 0.11 * u;
      const point = origin.clone()
        .addScaledVector(forward, Math.cos(angle) * reach)
        .addScaledVector(right, Math.sin(angle) * reach + curl);
      point.y += Math.sin(u * Math.PI) * 0.18;
      points.push(point);
    }
    const positions = this.whipLine.geometry.attributes.position;
    let index = 0;
    for (let i = 0; i < 24; i++) {
      const a = points[i], b = points[i + 1];
      const widthA = 0.025 + i / 24 * 0.06;
      const widthB = 0.025 + (i + 1) / 24 * 0.06;
      for (const [point, lift] of [[a, widthA], [a, -widthA], [b, widthB], [a, -widthA], [b, -widthB], [b, widthB]]) {
        positions.setXYZ(index++, point.x, point.y + lift, point.z);
      }
    }
    positions.needsUpdate = true;
    this.whipLine.geometry.computeBoundingSphere();
    this.whipLine.visible = true;
    this.whipLine.material.opacity = Math.max(0, 0.95 * (1 - Math.max(0, progress - 0.72) / 0.28));
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
    const strike = model.whip.active ? model.whip.elapsed / 0.38 : -1;
    let swing = 0;
    if (strike >= 0 && strike < 0.24) swing = -strike / 0.24 * 0.38;
    else if (strike < 0.67 && strike >= 0) swing = -0.38 + (strike - 0.24) / 0.43 * 1.18;
    else if (strike >= 0) swing = 0.8 * (1 - (strike - 0.67) / 0.33);
    this.weapon.position.x = 0.43 - Math.max(0, swing) * 0.33;
    this.weapon.position.y = -0.49 + sway * 0.018 + Math.abs(swing) * 0.11;
    this.weapon.rotation.z = -0.06 - swing * 1.25;
    this.weapon.rotation.x = -0.04 - Math.max(0, swing) * 0.36;
    this.dust.rotation.y += delta * 0.018;
    this.updateWhip(delta);
    if (this.buttons) {
      this.buttons.health.textContent = `${model.health}/${model.maxHealth}`;
      this.buttons.health.style.color = model.health <= 30 ? '#ff8262' : '';
      this.buttons.coins.textContent = String(model.coins);
      const xpCost = model.nextLevelCost();
      const xpProgress = Math.min(100, model.xp / xpCost * 100);
      this.buttons.xpFill.style.width = `${xpProgress}%`;
      this.buttons.xpLabel.textContent = `NÍVEL ${model.level} · ${model.xp}/${xpCost} XP`;
      this.buttons.xpTrack.setAttribute('aria-valuenow', String(Math.min(model.xp, xpCost)));
      this.buttons.xpTrack.setAttribute('aria-valuemax', String(xpCost));
      this.root.classList.toggle('is-active', model.isLocked && model.phase === 'playing' && !this.viewModel.isPortraitBlocked());
      this.root.classList.toggle('is-damaged', model.damageFlash > 0);
      if (model.phase === 'victory' || model.phase === 'defeat') this.showEnd(model);
    }
  }

  frame() {
    const now = performance.now();
    const delta = Math.min((now - this.previousFrameTime) / 1000, 0.05);
    this.previousFrameTime = now;
    this.viewModel?.update(delta);
    if (this.viewModel?.model.phase !== 'menu' && !this.viewModel.isPortraitBlocked()) this.psx.render(delta);
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.psx.dispose();
    this.draco.dispose();
    this.renderer.dispose();
  }
}
