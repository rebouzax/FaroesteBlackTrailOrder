const LIMIT = 238;
const RANGE = 5;
const BOSSES = [
  { at: 180, type: 'giantBat', visual: 'bat', hp: 450, damage: 21, speed: 1.55, xp: 380 },
  { at: 360, type: 'fireChupacabra', visual: 'dog', hp: 700, damage: 27, speed: 1.65, xp: 480 },
  { at: 660, type: 'shadowMarshal', visual: 'marshal', hp: 950, damage: 34, speed: 2.35, xp: 650 },
];
const STATS = {
  bat: { hp: 10, damage: 10, armor: 0, speed: 2.5, xp: 10 },
  dog: { hp: 35, damage: 14, armor: 2, speed: 3.5, xp: 20 },
  skeleton: { hp: 22, damage: 8, armor: 1, speed: 1.7, xp: 15 },
};

export class GameViewModel {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.keys = new Set();
    this.colliders = [];
    this.spawnClock = 1.2;
    this.dogClock = 7;
    this.skeletonClock = 11;
    this.invulnerable = 0;
    this.fallbackLook = false;
    this.touchDevice = window.matchMedia('(pointer: coarse)').matches;
    this.touchMove = { forward: 0, strafe: 0 };
    this.onKeyDown = (event) => {
      if (event.code === 'Escape' && (this.fallbackLook || this.touchDevice)) {
        this.pause();
        return;
      }
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
        this.keys.add(event.code);
      }
    };
    this.onKeyUp = (event) => this.keys.delete(event.code);
    this.onBlur = () => {
      this.keys.clear();
      if ((this.fallbackLook || this.touchDevice) && this.model.phase === 'playing') {
        this.pause();
      }
    };
    this.onResize = () => this.view.resize();
    this.onLock = () => this.model.setLocked(true);
    this.onUnlock = () => this.model.setLocked(false);
    this.onMouseMove = (event) => {
      if (!this.fallbackLook || !this.model.isLocked) return;
      const rotation = this.view.camera.rotation;
      rotation.order = 'YXZ';
      rotation.y -= event.movementX * 0.002;
      rotation.x = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, rotation.x - event.movementY * 0.002));
    };
  }

  connect() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);
    this.view.controls.addEventListener('lock', this.onLock);
    this.view.controls.addEventListener('unlock', this.onUnlock);
    this.view.mount(this);
  }

  addCollider(x, z, radius) { this.colliders.push({ x, z, radius }); }

  start() {
    if (this.model.phase === 'menu') {
      this.model.startRun();
      this.view.hideMenu();
    }
    if (this.model.phase !== 'playing') return;
    this.view.hideResume();
    if (this.touchDevice) {
      this.model.setLocked(true);
      this.requestLandscape();
      return;
    }
    try {
      const request = this.view.renderer.domElement.requestPointerLock({ unadjustedMovement: false });
      Promise.resolve(request).catch(() => {
        if (this.model.phase !== 'playing') return;
        this.fallbackLook = true;
        this.model.setLocked(true);
      });
    } catch {
      this.fallbackLook = true;
      this.model.setLocked(true);
    }
  }

  async requestLandscape() {
    try {
      if (!document.fullscreenElement && this.view.root.requestFullscreen) {
        await this.view.root.requestFullscreen({ navigationUI: 'hide' });
      }
    } catch {
      // Alguns navegadores móveis não oferecem tela cheia para elementos HTML.
    }
    try {
      await screen.orientation?.lock?.('landscape');
    } catch {
      // O aviso de rotação cobre navegadores sem bloqueio de orientação.
    }
  }

  isPortraitBlocked() {
    return this.touchDevice && this.model.phase !== 'menu' && window.innerHeight > window.innerWidth;
  }

  chooseCard(id) {
    if (!this.model.chooseCard(id)) return;
    if (this.model.phase === 'upgrade') {
      this.view.showCards(this.model.cardOffers);
      return;
    }
    this.view.hideCards();
    this.start();
  }

  releasePointer() {
    this.touchMove.forward = 0;
    this.touchMove.strafe = 0;
    if (this.touchDevice) {
      this.model.setLocked(false);
      return;
    }
    if (this.fallbackLook) {
      this.fallbackLook = false;
      this.model.setLocked(false);
    } else this.view.controls.unlock();
  }

  pause() {
    if (this.model.phase !== 'playing') return;
    this.releasePointer();
    this.view.showResume();
  }

  setTouchMove(strafe, forward) {
    this.touchMove.strafe = strafe;
    this.touchMove.forward = forward;
  }

  lookBy(dx, dy) {
    if (!this.model.isLocked || this.model.phase !== 'playing') return;
    const rotation = this.view.camera.rotation;
    rotation.order = 'YXZ';
    rotation.y -= dx * 0.003;
    rotation.x = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, rotation.x - dy * 0.003));
  }

  update(delta) {
    let active = this.model.isLocked && this.model.phase === 'playing' && !this.isPortraitBlocked();
    if (active) {
      this.model.updateTime(delta);
      if (this.model.phase === 'victory') {
        this.releasePointer();
      } else {
        this.movePlayer(delta);
        this.spawnWave(delta);
        this.moveEnemies(delta);
        this.moveProjectiles(delta);
        this.collectLoot(delta);
        if (this.model.phase === 'playing' && this.model.whip.cooldown === 0 && !this.model.whip.active) this.autoWhip();
        if (this.model.phase === 'playing') this.whipImpact();
        if (this.model.phase === 'playing' && this.model.health <= 0) {
          this.model.phase = 'defeat';
          this.releasePointer();
        }
      }
    }
    const camera = this.view.camera;
    active = this.model.isLocked && this.model.phase === 'playing' && !this.isPortraitBlocked();
    this.model.updatePlayer({
      x: camera.position.x, z: camera.position.z,
      yaw: camera.rotation.y, pitch: camera.rotation.x,
      walking: active && (this.keys.size > 0 || Math.hypot(this.touchMove.forward, this.touchMove.strafe) > 0.04),
    });
    this.view.update(active ? delta : 0, this.model);
  }

  movePlayer(delta) {
    const forward = Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')) + this.touchMove.forward;
    const strafe = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft')) + this.touchMove.strafe;
    if (!forward && !strafe) return;
    const step = (5 + this.model.upgrades.speed * 0.5) * delta / Math.max(1, Math.hypot(forward, strafe));
    const { forwardX, forwardZ, rightX, rightZ } = this.view.getPlanarFacing();
    const dx = (forwardX * forward + rightX * strafe) * step;
    const dz = (forwardZ * forward + rightZ * strafe) * step;
    const camera = this.view.camera;
    const blocked = (x, z) => Math.hypot(x, z) > LIMIT ||
      this.colliders.some((item) => Math.hypot(x - item.x, z - item.z) < item.radius + 0.48);
    if (!blocked(camera.position.x + dx, camera.position.z)) camera.position.x += dx;
    if (!blocked(camera.position.x, camera.position.z + dz)) camera.position.z += dz;
  }

  spawnWave(delta) {
    const elapsed = this.model.elapsed;
    this.spawnClock -= delta;
    if (this.spawnClock <= 0) {
      this.spawnClock = Math.max(0.55, 1.5 - elapsed / 700);
      if (this.model.enemies.length < 48) {
        for (let i = 0; i < 1 + Math.floor(elapsed / 180); i++) this.spawnEnemy('bat');
      }
    }
    if (elapsed >= 60) {
      this.dogClock -= delta;
      if (this.dogClock <= 0) {
        this.dogClock = Math.max(2, 7 - (elapsed - 60) / 140);
        if (this.model.enemies.length < 48) this.spawnEnemy('dog');
      }
    }
    if (elapsed >= 180) {
      this.skeletonClock -= delta;
      if (this.skeletonClock <= 0) {
        this.skeletonClock = Math.max(3.5, 11 - elapsed / 110);
        if (this.model.enemies.length < 48) this.spawnEnemy('skeleton');
      }
    }
    for (const boss of BOSSES) {
      if (elapsed < boss.at || this.model.bossesSpawned.has(boss.type)) continue;
      this.model.bossesSpawned.add(boss.type);
      this.spawnEnemy(boss.type, boss);
    }
  }

  spawnEnemy(type, boss = null) {
    const visual = boss?.visual || type;
    if (!this.view.enemyTemplates.has(visual)) return;
    const camera = this.view.camera;
    const angle = Math.random() * Math.PI * 2;
    const distance = boss ? 18 : 25 + Math.random() * 8;
    let x = camera.position.x + Math.cos(angle) * distance;
    let z = camera.position.z + Math.sin(angle) * distance;
    const edge = Math.hypot(x, z);
    if (edge > 230) { x *= 230 / edge; z *= 230 / edge; }
    const y = visual === 'bat' ? 2.2 + Math.random() * 1.2 : 0;
    const object = this.view.addEnemy(visual, x, y, z, Boolean(boss));
    if (!object) return;
    const stats = boss || STATS[type];
    const minute = Math.floor(this.model.elapsed / 60);
    this.model.enemies.push({
      type, visual, object, x, y, z, boss: Boolean(boss),
      hp: boss ? stats.hp : Math.round(stats.hp * (1 + minute * 0.18)),
      damage: stats.damage, armor: boss ? 3 : stats.armor,
      speed: stats.speed, xp: stats.xp,
      phase: Math.random() * Math.PI * 2, shotClock: 2.6,
    });
  }

  moveEnemies(delta) {
    const player = this.view.camera.position;
    this.invulnerable = Math.max(0, this.invulnerable - delta);
    for (const enemy of this.model.enemies) {
      const dx = player.x - enemy.x, dz = player.z - enemy.z;
      const distance = Math.max(0.001, Math.hypot(dx, dz));
      if (distance > (enemy.boss ? 2.1 : 1.1)) {
        enemy.x += dx / distance * enemy.speed * delta;
        enemy.z += dz / distance * enemy.speed * delta;
      }
      enemy.object.position.set(enemy.x, enemy.y + (enemy.visual === 'bat' ? Math.sin(this.model.elapsed * 5 + enemy.phase) * 0.28 : 0), enemy.z);
      // Os modelos originais têm a frente em +Z, como no Faroeste Survivors.
      enemy.object.rotation.y = Math.atan2(dx, dz);
      this.view.updateEnemy(enemy.object, delta);
      if (distance < (enemy.boss ? 2.2 : 1.35) && this.invulnerable === 0) this.hurt(enemy.damage);
      if (enemy.boss && distance < 28) {
        enemy.shotClock -= delta;
        if (enemy.shotClock <= 0) {
          enemy.shotClock = 3.6;
          this.bossVolley(enemy);
        }
      }
    }
  }

  hurt(amount) {
    this.model.health = Math.max(0, this.model.health - amount);
    this.model.damageFlash = 0.22;
    this.invulnerable = 0.9;
  }

  bossVolley(enemy) {
    if (this.model.projectiles.length >= 64) return;
    const aim = Math.atan2(this.view.camera.position.z - enemy.z, this.view.camera.position.x - enemy.x);
    for (let i = -2; i <= 2; i++) {
      const angle = aim + i * 0.23;
      const object = this.view.addProjectile(enemy.x, 1.8, enemy.z);
      this.model.projectiles.push({
        object, x: enemy.x, y: 1.8, z: enemy.z,
        vx: Math.cos(angle) * 7, vz: Math.sin(angle) * 7,
        age: 0, damage: Math.ceil(enemy.damage * 0.45),
      });
    }
  }

  moveProjectiles(delta) {
    const player = this.view.camera.position;
    for (const shot of [...this.model.projectiles]) {
      shot.age += delta;
      shot.x += shot.vx * delta;
      shot.z += shot.vz * delta;
      shot.object.position.set(shot.x, shot.y, shot.z);
      if (Math.hypot(player.x - shot.x, player.z - shot.z) < 0.75 && Math.abs(shot.y - player.y) < 1.5) {
        if (this.invulnerable === 0) this.hurt(shot.damage);
        shot.age = 10;
      }
      if (shot.age > 5) {
        this.view.removeProjectile(shot.object);
        this.model.projectiles.splice(this.model.projectiles.indexOf(shot), 1);
      }
    }
  }

  autoWhip() {
    const camera = this.view.camera;
    const { forwardX, forwardZ } = this.view.getPlanarFacing();
    let target = null, nearest = RANGE;
    for (const enemy of this.model.enemies) {
      const dx = enemy.x - camera.position.x, dz = enemy.z - camera.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance >= nearest || distance < 0.001) continue;
      if ((dx * forwardX + dz * forwardZ) / distance <= 0) continue;
      target = enemy;
      nearest = distance;
    }
    if (!target) return;
    const whip = this.model.whip;
    whip.active = true;
    whip.elapsed = 0;
    whip.hitApplied = false;
    whip.cooldown = Math.max(0.4, 1.05 - this.model.upgrades.cooldown * 0.1);
    this.view.startWhip();
  }

  whipImpact() {
    const whip = this.model.whip;
    if (!whip.active || whip.hitApplied || whip.elapsed < 0.18) return;
    whip.hitApplied = true;
    const camera = this.view.camera;
    const { forwardX, forwardZ } = this.view.getPlanarFacing();
    for (const enemy of [...this.model.enemies]) {
      const dx = enemy.x - camera.position.x, dz = enemy.z - camera.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance > RANGE) continue;
      if ((dx * forwardX + dz * forwardZ) / Math.max(0.001, distance) <= 0) continue;
      enemy.hp -= Math.max(1, 10 + this.model.upgrades.damage * 5 - enemy.armor);
      this.view.hitEnemy(enemy.object);
      if (enemy.hp <= 0) this.killEnemy(enemy);
    }
  }

  killEnemy(enemy) {
    this.view.removeEnemy(enemy.object);
    this.model.enemies.splice(this.model.enemies.indexOf(enemy), 1);
    this.model.kills += 1;
    this.dropLoot(enemy.x, enemy.z, 'xp', enemy.xp);
    const chance = enemy.boss ? 1 : { bat: 0.12, dog: 0.3, skeleton: 0.22 }[enemy.type] ?? 0.15;
    if (Math.random() < chance) this.dropLoot(enemy.x + 0.5, enemy.z, 'coin', enemy.boss ? 10 : 1);
  }

  dropLoot(x, z, kind, value) {
    if (this.model.loot.length >= 250) {
      this.view.removeLoot(this.model.loot[0].object);
      this.model.loot.shift();
    }
    const object = this.view.addLoot(x, z, kind);
    this.model.loot.push({ object, x, z, kind, value });
  }

  collectLoot(delta) {
    const player = this.view.camera.position;
    for (const item of [...this.model.loot]) {
      if (Math.hypot(player.x - item.x, player.z - item.z) < 3.5) {
        this.view.removeLoot(item.object);
        this.model.loot.splice(this.model.loot.indexOf(item), 1);
        if (item.kind === 'coin') this.model.coins += item.value;
        else this.model.addExperience(item.value);
        if (this.model.phase === 'upgrade') {
          this.view.showCards(this.model.cardOffers);
          this.releasePointer();
          return;
        }
      } else item.object.rotation.y += delta;
    }
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.view.controls.removeEventListener('lock', this.onLock);
    this.view.controls.removeEventListener('unlock', this.onUnlock);
    this.view.dispose();
  }
}
