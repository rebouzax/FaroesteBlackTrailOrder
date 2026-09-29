export class WorldModel {
  constructor() {
    this.stageName = 'Deserto dos Condenados';
    this.objective = 'Sobreviva por 15 minutos';
    this.phase = 'menu';
    this.elapsed = 0;
    this.player = { x: 0, z: 218, yaw: 0, pitch: 0 };
    this.health = 100;
    this.maxHealth = 100;
    this.coins = 0;
    this.kills = 0;
    this.xp = 0;
    this.level = 1;
    this.cardOffers = [];
    this.upgrades = { damage: 0, cooldown: 0, speed: 0, health: 0 };
    this.enemies = [];
    this.loot = [];
    this.projectiles = [];
    this.bossesSpawned = new Set();
    this.whip = { active: false, elapsed: 0, cooldown: 0, hitApplied: false };
    this.damageFlash = 0;
    this.isLocked = false;
    this.walking = false;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) listener(this);
  }

  updatePlayer({ x, z, yaw, pitch, walking }) {
    Object.assign(this.player, { x, z, yaw, pitch });
    this.walking = walking;
  }

  setLocked(isLocked) {
    this.isLocked = isLocked;
    this.notify();
  }

  startRun() {
    this.phase = 'playing';
    this.notify();
  }

  addExperience(amount) {
    this.xp += amount;
    this.checkLevelUp();
  }

  nextLevelCost() {
    return 100 * this.level * (this.level + 1) / 2;
  }

  checkLevelUp() {
    const cost = this.nextLevelCost();
    if (this.xp >= cost && this.phase === 'playing') {
      this.xp -= cost;
      this.level += 1;
      this.phase = 'upgrade';
      const deck = ['damage', 'cooldown', 'speed', 'health'];
      this.cardOffers = deck.sort(() => Math.random() - 0.5).slice(0, 3);
      this.notify();
      return true;
    }
    return false;
  }

  chooseCard(id) {
    if (this.phase !== 'upgrade' || !this.cardOffers.includes(id)) return false;
    this.upgrades[id] += 1;
    if (id === 'health') {
      this.maxHealth += 20;
      this.health = Math.min(this.maxHealth, this.health + 20);
    }
    this.phase = 'playing';
    this.cardOffers = [];
    if (!this.checkLevelUp()) this.notify();
    return true;
  }

  updateTime(delta) {
    if (!this.isLocked || this.phase !== 'playing') return;
    this.elapsed += delta;
    if (this.elapsed >= 900) {
      this.phase = 'victory';
      this.notify();
    }
    this.damageFlash = Math.max(0, this.damageFlash - delta);
    this.whip.cooldown = Math.max(0, this.whip.cooldown - delta);
    if (this.whip.active) {
      this.whip.elapsed += delta;
      if (this.whip.elapsed >= 0.38) this.whip.active = false;
    }
  }
}
