import { GameAudio } from '../services/GameAudio.js';
import { AbilityEffectsView } from './AbilityEffectsView.js';
import { ABILITIES, cardDescription, abilityMaxLevel } from '../config/abilityConfig.js';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { applyPSXMaterial } from '../vendor/threejs-psx-shader/src/PSXMaterial.js';
import { PSXPipeline } from '../vendor/threejs-psx-shader/src/PSXPipeline.js';
import { MenuView } from './MenuView.js';

const BASE_URL = import.meta.env.BASE_URL;
const MODEL_ROOT = `${BASE_URL}models/`;
export class GameView {
  constructor(root) {
    this.root = root;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#111d38');
    this.scene.fog = new THREE.FogExp2('#172640', 0.0028);
    this.camera = new THREE.PerspectiveCamera(76, 1, 0.08, 400);
    this.camera.rotation.order = 'YXZ';
    this.camera.position.set(0, 1.68, 218);
    this.planarFacing = new THREE.Vector3();
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
    this.psx = new PSXPipeline(this.renderer, this.scene, this.camera, { resolutionHeight: window.matchMedia('(pointer: coarse)').matches ? 200 : 240 });
    this.psx.getEffect('fog').settings.color = '#172640';
    this.psx.getEffect('fog').settings.density = 0.0025;
    this.psx.getEffect('fog').settings.offset = 14;
    this.psx.getEffect('dithering').settings.strength = 0.72;
    Object.assign(this.psx.getEffect('crt').settings, {
      vignetteAmount: 0.56,
      scanlineWeight: 0.055,
      grainWeight: 0.024,
      chromatic: 0.1,
    });
    this.previousFrameTime = performance.now();
    this.loader = new GLTFLoader();
    this.draco = new DRACOLoader();
    this.draco.setDecoderPath(`${BASE_URL}draco/`);
    this.loader.setDRACOLoader(this.draco);
    this.materials = new Map();
    this.assetPromises = new Map();
    this.colliderSpecs = [];
    this.enemyTemplates = new Map();
    this.enemyActors = new Map();
    this.enemyLoadJobs = [];
    this.whipTimer = 0;
    this.crackTimer = 0;
    this.bossBarNodes = new Map();
    this.whipAudio = new Audio(`${BASE_URL}art/whip.wav`);
    this.whipAudio.volume = 0.38;
    this.endShown = false;
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.weapon = this.createWhipHand();
    this.camera.add(this.weapon);
    this.whipLine = this.createWhipLine();
    this.crackEffect = this.createCrackEffect();
    this.camera.add(this.crackEffect);
    this.crackLight = new THREE.PointLight(0xffd7a3, 0, 7);
    this.crackLight.position.set(0, 0, -2.4);
    this.camera.add(this.crackLight);
    this.scene.add(this.camera);
    this.frame = this.frame.bind(this);
    this.buttons = null;
    this.addLighting();
    this.buildMoon();
    this.buildTerrain();
    this.buildDunes();
    this.buildDust();
    this.buildCardinals();
    this.audio = new GameAudio();
    this.abilityEffects = new AbilityEffectsView(this.world);
    this.revolver = this.createRevolver();
    this.camera.add(this.revolver);
    this.revolver.visible = false;
    this.pistolEffect = this.createRevolver();
    this.camera.add(this.pistolEffect);
    this.pistolEffect.visible = false;
    this.recoil = 0;
    this.pistolFlash = 0;
    this.resize();
  }

  mount(viewModel) {
    this.viewModel = viewModel;
    for (const collider of this.colliderSpecs) {
      if (collider.kind === 'box') this.viewModel.addBoxCollider(collider.minX, collider.maxX, collider.minZ, collider.maxZ);
      else this.viewModel.addCollider(collider.x, collider.z, collider.radius);
    }
    this.root.innerHTML = `
      <div class="scene-shell">
        <div class="combat-hud" aria-live="polite"><span>VIDA <b class="health-value">100/100</b></span><span>MOEDAS <b class="coins-value">0</b></span></div>
        <div class="stage-timer" role="timer"><small>DESERTO DOS CONDENADOS</small><strong class="timer-value">15:00</strong><span class="timer-status"></span></div>
        <div class="boss-bars" aria-label="Vida dos chefes"></div>
        <section class="main-menu" aria-label="Menu principal">
          <div class="menu-art"><img src="${BASE_URL}art/menu-black-trail.png" alt="" fetchpriority="high" /></div>
          <div class="menu-moon-glow"></div><div class="menu-wind"></div>
          <div class="menu-lantern menu-lantern-one"></div><div class="menu-lantern menu-lantern-two"></div>
          <div class="menu-zombie menu-zombie-one"></div><div class="menu-zombie menu-zombie-two"></div>
          <div class="menu-content"></div>
        </section>
        <button class="resume-button" type="button" hidden>${this.viewModel.touchDevice ? 'TOQUE PARA VOLTAR AO DESERTO' : 'CLIQUE PARA VOLTAR AO DESERTO'}</button>
        <div class="touch-controls" aria-label="Controles de toque">
          <div class="touch-joystick" aria-label="Mover"><div class="touch-stick"></div></div>
          <div class="touch-look" aria-label="Arraste para olhar"></div>
          <button class="touch-pause" type="button" aria-label="Pausar">Ⅱ</button>
        </div>
        <section class="cards-overlay" hidden aria-label="Escolha uma carta"><div class="cards-panel"><span class="cards-kicker">UM NOVO NÍVEL</span><h2>ESCOLHA SUA CARTA</h2><p>A estrada fica mais perigosa a cada minuto.</p><div class="cards-list"></div></div></section>
        <section class="run-merchant" hidden aria-label="Bento, o mercador"><div class="run-merchant-panel"><img src="${BASE_URL}art/menu/bento.webp" alt="Bento"><div><small>MERCADOR DA ESTRADA</small><h2>BENTO</h2><p class="run-wallet"></p><div class="run-products"></div><button type="button" class="leave-merchant">VOLTAR À ESTRADA</button></div></div></section>
        <div class="pickup-toast" hidden role="status"></div>
        <section class="end-overlay" hidden><div class="end-panel"><span class="end-kicker">BLACK TRAIL ORDER</span><h2 class="end-title"></h2><p class="end-copy"></p><button class="restart-button" type="button">NOVA JORNADA</button></div></section>
        <div class="xp-track" role="progressbar" aria-label="Experiência para o próximo nível" aria-valuemin="0" aria-valuenow="0" aria-valuemax="100"><div class="xp-fill"></div><span class="xp-label">NÍVEL 1 · 0/100 XP</span></div>
        <div class="rotate-device" role="status"><span class="rotate-symbol" aria-hidden="true">▯</span><strong>GIRE O APARELHO</strong><p>Jogue na horizontal. Se preciso, desative o bloqueio de rotação.</p></div>
        <div class="vignette"></div>
      </div>`;
    this.root.prepend(this.renderer.domElement);
    this.root.classList.add('game-root');
    this.buttons = {
      menu: this.root.querySelector('.main-menu'),
      resume: this.root.querySelector('.resume-button'),
      cards: this.root.querySelector('.cards-overlay'),
      cardsList: this.root.querySelector('.cards-list'),
      runMerchant: this.root.querySelector('.run-merchant'),
      runProducts: this.root.querySelector('.run-products'),
      runWallet: this.root.querySelector('.run-wallet'),
      pickupToast: this.root.querySelector('.pickup-toast'),
      end: this.root.querySelector('.end-overlay'),
      health: this.root.querySelector('.health-value'),
      coins: this.root.querySelector('.coins-value'),
      timer: this.root.querySelector('.timer-value'),
      timerStatus: this.root.querySelector('.timer-status'),
      bossBars: this.root.querySelector('.boss-bars'),
      xpTrack: this.root.querySelector('.xp-track'),
      xpFill: this.root.querySelector('.xp-fill'),
      xpLabel: this.root.querySelector('.xp-label'),
    };
    this.menuViewModel.view = new MenuView(this.root.querySelector('.menu-content'));
    this.menuViewModel.mount();
    this.buttons.resume.addEventListener('click', () => this.viewModel.start());
    this.buttons.cardsList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-card]');
      if (button) this.viewModel.chooseCard(button.dataset.card);
    });
    this.buttons.runProducts.addEventListener('click', event => {
      const button = event.target.closest('[data-run-buy]');
      if (button) this.viewModel.buyFromMerchant(button.dataset.runBuy);
    });
    this.root.querySelector('.leave-merchant').addEventListener('click', () => this.viewModel.leaveMerchant());
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
    this.audio.play('level', .35);
    this.buttons.cardsList.innerHTML = offers.map(id => {
      const card = ABILITIES[id], level = this.viewModel.model.abilities[id] + 1;
      return `<button class="ability-card color-${card.color}" type="button" data-card="${id}"><small>${card.suit} · NÍVEL ${level}/${abilityMaxLevel(id)}</small><b>${card.icon}</b><strong>${card.name}</strong><span>${cardDescription(id, level, this.viewModel.model.attributes().attack)}</span></button>`;
    }).join('');
    this.buttons.cards.hidden = false;
  }

  hideCards() { this.buttons.cards.hidden = true; }

  showRunMerchant(model) {
    this.buttons.runWallet.textContent = `MOEDAS NA PARTIDA · ${model.coins}`;
    const products = [
      ['whip', 'Arma reforçada', '+5 de dano nesta partida'],
      ['health', 'Bandagem de Bento', '+25 de vida agora'],
      ['speed', 'Botas ligeiras', 'Mais velocidade nesta partida'],
    ];
    this.buttons.runProducts.innerHTML = products.map(([id, name, detail]) => {
      const price = this.viewModel.merchantPrice(id);
      return `<button type="button" data-run-buy="${id}" ${model.coins < price ? 'disabled' : ''}><b>${name}</b><span>${detail}</span><strong>◈ ${price}</strong></button>`;
    }).join('');
    this.buttons.runMerchant.hidden = false;
  }

  hideRunMerchant() { this.buttons.runMerchant.hidden = true; }

  showPickupMessage(message) {
    this.buttons.pickupToast.textContent = message;
    this.buttons.pickupToast.hidden = false;
    this.pickupMessageExpires = performance.now() + 2500;
  }

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
    const sky = new THREE.HemisphereLight(0xc8dcff, 0x393945, 1.9);
    this.scene.add(sky);
    this.moonlight = new THREE.DirectionalLight(0xc6dcff, 2.75);
    this.moonlight.position.set(-70, 85, -130);
    this.scene.add(this.moonlight);
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
    this.moonHalo = halo;
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

  loadSharedAsset(filename) {
    if (!this.assetPromises.has(filename)) this.assetPromises.set(filename, this.loader.loadAsync(`${MODEL_ROOT}${filename}`));
    return this.assetPromises.get(filename);
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
      this.addStaticBoxCollider(x - 26 * width, x + 26 * width, z - 26, z + 26);
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
      this.addFootprint(dune, 1.1);
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

  addStaticBoxCollider(minX, maxX, minZ, maxZ) {
    const collider = { kind: 'box', minX, maxX, minZ, maxZ };
    this.colliderSpecs.push(collider);
    this.viewModel?.addBoxCollider(minX, maxX, minZ, maxZ);
  }

  addFootprint(scene, inset = 0) {
    scene.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(scene);
    this.addStaticBoxCollider(bounds.min.x + inset, bounds.max.x - inset, bounds.min.z + inset, bounds.max.z - inset);
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
      this.addFootprint(wagon, 0.1);
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
      this.addStaticBoxCollider(x - 0.12, x + (count - 1) * 2.2 + 0.12, z - 0.18, z + 0.18);
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
      const asset = await this.loadSharedAsset(paths[kind]);
      const scene = asset.scene.clone(true);
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
      if (kind === 'tree') this.addStaticCollider(x, z, 0.9);
      else this.addFootprint(scene, 0.05);
    } catch (error) {
      console.error(`Não foi possível carregar o marco ${kind}.`, error);
    }
  }

  loadStageAssets() {
    const progress = [];
    for (const [filename, x, z, scale, rotation] of [
      ['waypost.glb', 25, 155, 1.8, -0.3],
    ]) {
      const task = this.loadSharedAsset(filename).then((asset) => {
        const scene = asset.scene.clone(true);
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
    for (const [filename, x, z, width, rotation, zUp] of [
      ['psx_abandoned_house.glb', -65, 133, 11, 0.24, true],
      ['psx_abandoned_church.glb', 77, 28, 14, -0.28, true],
      ['psx_old_abandoned_mansion.glb', -78, -55, 16, 0.18, true],
      ['low_poly_western_saloon.glb', 73, -165, 14, -0.18, false],
    ]) progress.push(this.loadScenery(filename, x, z, width, rotation, { zUp, solid: true }));
    for (const [x, z, width] of [[-25, 196, 5], [52, 129, 6], [-89, 24, 7], [90, -78, 6], [-57, -210, 5]])
      progress.push(this.loadScenery('tree_ps1psx_style.glb', x, z, width, 0, { trunkRadius: 1.1 }));
    for (const [x, z] of [[31, 165], [-40, 44], [49, -59], [-51, -172]])
      progress.push(this.loadScenery('psx_barrel.glb', x, z, 1.2, 0.4, { zUp: true, solid: true }));
    for (const [x, z, rotation] of [[-27, -93, 0.35], [30, -176, -0.48]])
      progress.push(this.loadCorpse(x, z, rotation));
    for (const [type, filename] of [
      ['bat', 'bat.glb'], ['dog', 'dog.glb'], ['skeleton', 'skeleton.glb'], ['marshal', 'marshal.glb'],
      ['crow', 'low_poly_crow.glb'], ['zombie', 'lowpoly_zombie.glb'],
      ['bonewalker', 'low_poly_psx_skeleton.glb'], ['wendigo', 'stylized_low-poly_wendigo.glb'],
      ['snatcher', 'psx_snatcher_-_low_poly_horror.glb'],
    ]) progress.push(this.loadEnemyTemplate(type, filename));
    for (const filename of ['ps1_style_health_bandage.glb', 'chest.glb', 'bento_psx(1).glb'])
      progress.push(this.loadEventTemplate(filename));
    Promise.allSettled(progress);
  }

  async loadScenery(filename, x, z, width, rotation, { zUp = false, solid = false, trunkRadius = 0 } = {}) {
    try {
      const asset = await this.loadSharedAsset(filename);
      const scene = asset.scene.clone(true);
      scene.traverse(child => {
        if (!child.isMesh) return;
        child.material = Array.isArray(child.material)
          ? child.material.map(material => this.psxMaterial(material, 0.4))
          : this.psxMaterial(child.material, 0.4);
      });
      if (zUp) scene.rotation.x = -Math.PI / 2;
      scene.updateMatrixWorld(true);
      const raw = new THREE.Box3().setFromObject(scene);
      const size = raw.getSize(new THREE.Vector3());
      scene.scale.setScalar(width / Math.max(size.x, size.z));
      scene.rotation.y = rotation;
      scene.updateMatrixWorld(true);
      const floor = new THREE.Box3().setFromObject(scene);
      scene.position.set(x, -floor.min.y, z);
      this.world.add(scene);
      if (solid) this.addFootprint(scene, 0.15);
      else if (trunkRadius) this.addStaticCollider(x, z, trunkRadius);
    } catch (error) { console.warn(`Cenário ${filename} indisponível.`, error); }
  }

  async loadCorpse(x, z, rotation) {
    try {
      const asset = await this.loadSharedAsset('lowpoly_zombie.glb');
      const scene = asset.scene.clone(true);
      scene.traverse(child => {
        if (child.isMesh) child.material = Array.isArray(child.material)
          ? child.material.map(material => this.psxMaterial(material, 0.4))
          : this.psxMaterial(child.material, 0.4);
      });
      scene.updateMatrixWorld(true);
      const size = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
      scene.scale.setScalar(1.8 / size.y);
      scene.rotation.set(0, rotation, Math.PI / 2);
      scene.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(scene);
      scene.position.set(x, -bounds.min.y + 0.06, z);
      this.world.add(scene);
      this.addFootprint(scene, 0.02);
    } catch (error) { console.warn('Corpo de cenário indisponível.', error); }
  }

  async loadEventTemplate(filename) {
    try {
      const asset = await this.loadSharedAsset(filename);
      const scene = asset.scene.clone(true);
      scene.traverse(child => {
        if (!child.isMesh) return;
        child.material = Array.isArray(child.material)
          ? child.material.map(material => this.psxMaterial(material, 0.4))
          : this.psxMaterial(child.material, 0.4);
      });
      this.eventTemplates ||= new Map();
      this.eventTemplates.set(filename, scene);
    } catch (error) { console.warn(`Item ${filename} indisponível.`, error); }
  }

  async loadHouse(filename, x, z, desiredWidth, rotation) {
    try {
      const asset = await this.loadSharedAsset(filename);
      const scene = asset.scene.clone(true);
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
      this.addFootprint(scene, Math.min(0.4, desiredWidth * 0.03));
      const lantern = new THREE.PointLight(0xffa75c, 11, 14, 2);
      lantern.position.set(x + 3, 2.5, z + 2);
      this.world.add(lantern);
      (this.lanterns ||= []).push(lantern);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.18), new THREE.MeshBasicMaterial({ color: '#ffb565' }));
      lamp.position.copy(lantern.position);
      this.world.add(lamp);
    } catch (error) {
      console.error(`Falha ao carregar ${filename}`, error);
    }
  }

  async loadEnemyTemplate(type, filename = `${type}.glb`) {
    try {
      const { scene, animations } = await this.loader.loadAsync(`${MODEL_ROOT}${filename}`);
      scene.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        const convert = material => {
          const result = this.psxMaterial(material, 0.35);
          if (type === 'crow' && !result.map) result.color.set('#333044');
          return result;
        };
        child.material = Array.isArray(child.material)
          ? child.material.map(convert)
          : convert(child.material);
      });
      const bounds = new THREE.Box3().setFromObject(scene);
      const size = bounds.getSize(new THREE.Vector3());
      const flight = type === 'bat' || type === 'crow';
      const desired = type === 'wendigo' ? 3.25 : flight ? 2.15 : 2.3;
      scene.scale.setScalar(desired / Math.max(size.x, size.y, size.z));
      const scaled = new THREE.Box3().setFromObject(scene);
      scene.position.y = flight ? -(scaled.min.y + scaled.max.y) / 2 : -scaled.min.y;
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
    const deformables = this.prepareProceduralLimbs(body, type);
    root.add(body);
    root.position.set(x, y, z);
    const scale = boss ? 2.7 : 1;
    root.scale.setScalar(scale);
    this.world.add(root);
    const mixer = new THREE.AnimationMixer(body);
    const preferred = type === 'bat' || type === 'crow' ? /fly/i : /run|walk/i;
    const clip = template.animations.find((item) => preferred.test(item.name)) || template.animations[0];
    const walk = clip ? mixer.clipAction(clip).play() : null;
    const attackClip = template.animations.find(item => /attack|punch|bite|strike/i.test(item.name));
    const hurtClip = template.animations.find(item => /hurt|damage|hit|impact/i.test(item.name));
    this.enemyActors.set(root, { mixer, body, walk, attack: attackClip ? mixer.clipAction(attackClip) : null,
      hurt: hurtClip ? mixer.clipAction(hurtClip) : null, flash: 0, hitTime: 0, attackTime: 0, scale,
      baseY: body.position.y, phase: Math.random() * Math.PI * 2, deformables });
    return root;
  }

  prepareProceduralLimbs(body, type) {
    if (!['zombie', 'bonewalker', 'crow'].includes(type)) return [];
    const deformables = [];
    body.traverse(child => {
      if (!child.isMesh || child.isSkinnedMesh) return;
      child.geometry = child.geometry.clone();
      child.userData.proceduralGeometry = true;
      child.frustumCulled = false;
      const position = child.geometry.getAttribute('position');
      position.setUsage(THREE.DynamicDrawUsage);
      const original = Float32Array.from(position.array);
      child.geometry.computeBoundingBox();
      const box = child.geometry.boundingBox;
      const width = box.max.x - box.min.x, height = box.max.y - box.min.y;
      const midX = (box.min.x + box.max.x) * 0.5;
      const pivotY = box.min.y + height * (type === 'crow' ? 0.48 : 0.65);
      const threshold = width * (type === 'crow' ? 0.16 : 0.21);
      const pivotOffset = width * (type === 'crow' ? 0.12 : 0.15);
      const limbs = [];
      for (let i = 0; i < position.count; i++) {
        const px = original[i * 3], py = original[i * 3 + 1];
        if (Math.abs(px - midX) < threshold || py < pivotY - height * 0.09) continue;
        limbs.push({ i, side: Math.sign(px - midX), pivotX: midX + Math.sign(px - midX) * pivotOffset });
      }
      if (limbs.length) deformables.push({ position, original, pivotY, limbs, type });
    });
    return deformables;
  }

  updateEnemy(object, delta) {
    const actor = this.enemyActors.get(object);
    if (!actor) return;
    actor.mixer.update(delta);
    actor.flash = Math.max(0, actor.flash - delta);
    actor.hitTime = Math.max(0, actor.hitTime - delta);
    actor.attackTime = Math.max(0, actor.attackTime - delta);
    actor.phase += delta * 7;
    const stride = Math.sin(actor.phase);
    for (const { position, original, pivotY, limbs, type } of actor.deformables) {
      const attack = actor.attackTime > 0 ? Math.sin(actor.attackTime / 0.35 * Math.PI) : 0;
      const hit = actor.hitTime > 0 ? Math.sin(actor.hitTime / 0.28 * Math.PI) : 0;
      for (const { i, side, pivotX } of limbs) {
        const dx = original[i * 3] - pivotX, dy = original[i * 3 + 1] - pivotY;
        const angle = type === 'crow' ? side * (Math.sin(actor.phase * 1.7) * 0.44 + hit * 0.18)
          : -side * (0.62 + stride * 0.14 - attack * 0.5 + hit * 0.28);
        const c = Math.cos(angle), s = Math.sin(angle);
        position.setXYZ(i, pivotX + dx * c - dy * s, pivotY + dx * s + dy * c, original[i * 3 + 2]);
      }
      position.needsUpdate = true;
    }
    actor.body.position.y = actor.baseY + (actor.hitTime > 0 ? -0.11 * Math.sin(actor.hitTime / 0.28 * Math.PI) : Math.abs(stride) * 0.07);
    actor.body.rotation.z = (actor.hitTime > 0 ? 0.18 * Math.sin(actor.hitTime / 0.28 * Math.PI) : stride * 0.07) * (object.scale.x < 2 ? 1 : 0.6);
    actor.body.rotation.x = actor.attackTime > 0 ? -Math.sin(actor.attackTime / 0.35 * Math.PI) * 0.28 : Math.sin(actor.phase * 0.5) * 0.025;
    object.scale.setScalar(actor.scale * (actor.flash > 0 ? 1.045 : 1));
  }

  hitEnemy(object) {
    const actor = this.enemyActors.get(object);
    if (!actor) return;
    actor.flash = 0.15;
    actor.hitTime = 0.28;
    if (actor.hurt) { actor.hurt.reset().setLoop(THREE.LoopOnce, 1).play(); actor.hurt.clampWhenFinished = true; }
  }

  attackEnemy(object) {
    const actor = this.enemyActors.get(object);
    if (!actor) return;
    actor.attackTime = 0.35;
    if (actor.attack) { actor.attack.reset().setLoop(THREE.LoopOnce, 1).play(); actor.attack.clampWhenFinished = true; }
  }

  removeEnemy(object) {
    if (!object) return;
    this.world.remove(object);
    this.enemyActors.get(object)?.mixer.stopAllAction();
    object.traverse(child => {
      if (child.userData.proceduralGeometry) child.geometry.dispose();
    });
    this.enemyActors.delete(object);
  }

  addEventObject(kind, x, z) {
    const specs = {
      bandage: ['ps1_style_health_bandage.glb', 0.85, true],
      chest: ['chest.glb', 1.45, true],
      merchant: ['bento_psx(1).glb', 2.2, true],
    };
    const [filename, desired, zUp] = specs[kind] || [];
    const template = this.eventTemplates?.get(filename);
    if (!template) return null;
    const scene = template.clone(true);
    if (zUp) scene.rotation.x = -Math.PI / 2;
    scene.updateMatrixWorld(true);
    const original = new THREE.Box3().setFromObject(scene);
    const size = original.getSize(new THREE.Vector3());
    const scale = desired / (kind === 'merchant' ? size.y : Math.max(size.x, size.z));
    scene.scale.setScalar(scale);
    scene.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(scene);
    const center = bounds.getCenter(new THREE.Vector3());
    scene.position.set(-center.x, -bounds.min.y, -center.z);
    const object = new THREE.Group();
    object.position.set(x, 0, z);
    object.add(scene);
    this.world.add(object);
    return object;
  }

  removeEventObject(object) { if (object) this.world.remove(object); }

  updateEventObject(object, kind, age) {
    if (!object) return;
    if (kind === 'bandage') {
      object.position.y = 0.15 + Math.sin(age * 2.4) * 0.13;
      object.rotation.y += 0.012;
    } else if (kind === 'merchant') {
      object.rotation.y = Math.sin(age * 0.8) * 0.08;
      object.position.y = Math.sin(age * 2) * 0.025;
    }
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
    if (this.armsMixer && this.armsStrike) {
      this.armsMixer.stopAllAction();
      this.armsStrike.reset().setLoop(THREE.LoopOnce, 1).play();
      this.armsStrike.clampWhenFinished = true;
    }
  }

  whipCrack() {
    this.crackTimer = 0.14;
    this.crackEffect.visible = true;
    try { this.whipAudio.currentTime = 0; this.whipAudio.play().catch(() => {}); } catch { /* Áudio opcional. */ }
  }

  createCrackEffect() {
    const burst = new THREE.Group();
    burst.position.set(0, -0.1, -4.4);
    const material = new THREE.MeshBasicMaterial({ color: '#ffe1aa', transparent: true, opacity: 0.9, depthTest: false, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 3, 10), material);
    burst.add(ring);
    const points = [];
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      points.push(new THREE.Vector3(Math.cos(angle) * 0.37, Math.sin(angle) * 0.37, 0));
      points.push(new THREE.Vector3(Math.cos(angle) * 0.62, Math.sin(angle) * 0.62, 0));
    }
    burst.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: '#fff3d0', transparent: true, opacity: 0.85, depthTest: false })));
    burst.visible = false;
    return burst;
  }

  setChampion(champion) {
    this.weapon.visible = champion !== 'maria';
    this.revolver.visible = champion === 'maria';
  }

  fireRevolver() { this.recoil = 1; this.audio.play('shot', .65, .94 + Math.random()*.07); }
  fireAbilityPistol() { this.pistolFlash = .3; this.audio.play('shot', .35, 1.08); }

  createRevolver() {
    const group = new THREE.Group();
    const steel = new THREE.MeshStandardMaterial({color:'#68757f',metalness:.7,roughness:.65,depthTest:false});
    const wood = new THREE.MeshStandardMaterial({color:'#663f2c',roughness:1,depthTest:false});
    const box = (w,h,d,x,y,z,material) => {const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);group.add(mesh);return mesh;};
    box(.12,.13,.42,0,.06,-.18,steel);
    const grip=box(.11,.24,.1,0,-.12,.05,wood);grip.rotation.x=-.25;
    const drum=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.14,6),steel);drum.rotation.x=Math.PI/2;drum.position.set(0,.02,0);group.add(drum);
    box(.025,.045,.04,0,.145,-.34,steel);
    const flash=new THREE.Mesh(new THREE.ConeGeometry(.1,.25,5),new THREE.MeshBasicMaterial({color:'#ffe3a2',depthTest:false}));flash.rotation.x=-Math.PI/2;flash.position.set(0,.06,-.5);flash.visible=false;group.add(flash);group.userData.flash=flash;
    group.traverse(item=>{if(item.isMesh)item.renderOrder=5;});return group;
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
    arm.visible = false;
    hand.visible = false;
    group.traverse((child) => { if (child.isMesh) { child.renderOrder = 3; child.material = child.material.clone(); child.material.depthTest = false; } });
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
    const { forwardX, forwardZ, rightX, rightZ } = this.getPlanarFacing();
    const forward = new THREE.Vector3(forwardX, 0, forwardZ);
    const right = new THREE.Vector3(rightX, 0, rightZ);
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
      const widthA = 0.012 + (1 - i / 24) * 0.055;
      const widthB = 0.012 + (1 - (i + 1) / 24) * 0.055;
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

  getPlanarFacing() {
    this.camera.getWorldDirection(this.planarFacing);
    this.planarFacing.y = 0;
    this.planarFacing.normalize();
    const forwardX = this.planarFacing.x;
    const forwardZ = this.planarFacing.z;
    return { forwardX, forwardZ, rightX: -forwardZ, rightZ: forwardX };
  }

  syncBossBars(model) {
    const bosses = model.enemies.filter(enemy => enemy.boss && enemy.hp > 0);
    const active = new Set(bosses);
    for (const [enemy, node] of this.bossBarNodes) {
      if (active.has(enemy)) continue;
      node.remove();
      this.bossBarNodes.delete(enemy);
    }
    if (!bosses.length) return;
    this.camera.updateMatrixWorld();
    const width = this.root.clientWidth, height = this.root.clientHeight;
    const labels = { giantBat: 'MORCEGO GIGANTE', fireChupacabra: 'CHUPACABRA DE FOGO', shadowMarshal: 'MARECHAL DAS SOMBRAS' };
    for (const enemy of bosses) {
      let node = this.bossBarNodes.get(enemy);
      if (!node) {
        node = document.createElement('div');
        node.className = 'boss-float-bar';
        node.innerHTML = '<strong></strong><div><i></i></div>';
        node.querySelector('strong').textContent = labels[enemy.type] || 'CHEFE';
        this.buttons.bossBars.append(node);
        this.bossBarNodes.set(enemy, node);
      }
      const point = new THREE.Vector3(enemy.x, enemy.y + (enemy.visual === 'bat' ? 3.6 : 4.8), enemy.z);
      point.project(this.camera);
      const visible = point.z < 1 && point.z > -1 && Math.abs(point.x) < 1.2 && Math.abs(point.y) < 1.3;
      node.hidden = !visible;
      if (!visible) continue;
      node.style.left = `${(point.x * 0.5 + 0.5) * width}px`;
      node.style.top = `${(-point.y * 0.5 + 0.5) * height}px`;
      node.querySelector('i').style.width = `${Math.max(0, enemy.hp / enemy.maxHp * 100)}%`;
    }
  }

  update(delta, model) {
    this.audio.footsteps(delta, model.walking, model.attributes().speed);
    this.abilityEffects.update(this.viewModel.abilitySystem, model, this.camera.position);
    this.crackTimer = Math.max(0, this.crackTimer - delta);
    this.crackEffect.visible = this.crackTimer > 0;
    if (this.crackTimer > 0) this.crackEffect.scale.setScalar(1 + (0.14 - this.crackTimer) * 5);
    this.crackLight.intensity = this.crackTimer / 0.14 * 3.5;
    const sway = model.walking ? Math.sin(model.elapsed * 10) : 0;
    const strike = model.whip.active ? model.whip.elapsed / 0.38 : -1;
    let swing = 0;
    if (strike >= 0 && strike < 0.24) swing = -strike / 0.24 * 0.38;
    else if (strike < 0.67 && strike >= 0) swing = -0.38 + (strike - 0.24) / 0.43 * 1.18;
    else if (strike >= 0) swing = 0.8 * (1 - (strike - 0.67) / 0.33);
    this.weapon.position.set(0.43 - Math.max(0,swing)*.27 + sway*.007, -.49 + sway*.018 + Math.abs(swing)*.11, -.72);
    this.weapon.rotation.set(-.04-Math.max(0,swing)*.36,-.07,-.06-swing*1.25);
    this.recoil = Math.max(0, this.recoil - delta * 6);
    this.revolver.position.set(.36+sway*.006,-.34+sway*.012,-.64+this.recoil*.09);
    this.revolver.rotation.x = this.recoil*.25;
    this.revolver.userData.flash.visible = this.recoil > .76;
    this.pistolFlash = Math.max(0,this.pistolFlash-delta);
    this.pistolEffect.visible = this.pistolFlash > 0;
    this.pistolEffect.position.set(-.38,-.42+(this.pistolFlash/.3)*.08,-.74);
    this.pistolEffect.userData.flash.visible = this.pistolFlash > .22;
    this.dust.rotation.y += delta * 0.018;
    this.moonlight.intensity = 2.7 + Math.sin(performance.now() * 0.00043) * 0.14;
    this.moonHalo.material.opacity = 0.11 + Math.sin(performance.now() * 0.0007) * 0.025;
    this.lanterns?.forEach((light, index) => { light.intensity = 8.5 + Math.sin(performance.now() * 0.009 + index * 2.7) * 1.4; });
    this.updateWhip(delta);
    if (this.buttons) {
      this.buttons.health.textContent = `${Math.ceil(model.health)}/${Math.round(model.maxHealth)}`;
      this.buttons.health.style.color = model.health <= 30 ? '#ff8262' : '';
      this.buttons.coins.textContent = String(model.coins);
      if (this.pickupMessageExpires && performance.now() > this.pickupMessageExpires) this.buttons.pickupToast.hidden = true;
      const bossActive = model.enemies.some(enemy => enemy.boss);
      const seconds = model.mode === 'campaign' ? Math.max(0, Math.ceil(900 - model.elapsed)) : Math.floor(model.elapsed);
      this.buttons.timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
      this.buttons.timerStatus.textContent = bossActive ? 'TEMPO PARADO · CHEFE' : model.mode === 'campaign' ? 'ATÉ O AMANHECER' : 'TEMPO DE SOBREVIVÊNCIA';
      this.buttons.timer.parentElement.classList.toggle('is-boss-time', bossActive);
      this.syncBossBars(model);
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
