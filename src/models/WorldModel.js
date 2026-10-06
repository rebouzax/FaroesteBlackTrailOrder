import { ABILITIES, abilityStats, abilityMaxLevel } from '../config/abilityConfig.js';
import { FRONTIER_CARDS } from '../config/frontierCards.js';
import { BENTO_CARDS } from '../config/bentoCards.js';
import { permanentBonuses } from '../config/bentoShop.js';
import { CHAMPIONS, STARTER_DECK } from '../config/champions.js';
import { STAGES } from '../config/stages.js';
export class WorldModel {
  constructor() {
    this.stageName = 'Deserto dos Condenados';
    this.objective = 'Sobreviva por 15 minutos';
    this.phase = 'menu';
    this.mode = 'campaign';
    this.elapsed = 0;
    this.player = { x: 0, z: 218, yaw: 0, pitch: 0 };
    this.health = 100;
    this.maxHealth = 100;
    this.coins = 0;
    this.kills = 0;
    this.xp = 0;
    this.level = 1;
    this.cardOffers = [];
    this.hero = CHAMPIONS.joao;
    this.abilities = Object.fromEntries(Object.keys(ABILITIES).map(id => [id, 0]));
    this.visualTime = 0;
    this.upgrades = { damage: 0, cooldown: 0, speed: 0, health: 0, armor:0, haste:0, range:0, magnet:0 };
    this.enemies = [];
    this.loot = [];
    this.pickups = [];
    this.merchant = null;
    this.runShopPurchases = {};
    this.bankedLevelCoins = 0;
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
  resetRun(){
    const listeners=this.listeners;
    Object.assign(this,new WorldModel());this.listeners=listeners;
    delete this.stage;delete this.champion;delete this.deck;delete this.permanent;
    this.baseDamageBonus=0;this.baseSpeedBonus=0;
  }

  startRun(selection = {}, purchases = {}) {
    this.stage = STAGES[selection.map] ? selection.map : 'desert';
    this.stageName = STAGES[this.stage].name;
    this.mode = selection.mode === 'free' ? 'free' : 'campaign';
    this.upgrades.damage = 0;
    this.champion = CHAMPIONS[selection.champion] ? selection.champion : 'joao';
    this.hero = CHAMPIONS[this.champion];
    this.permanent=permanentBonuses(purchases);
    this.maxHealth = this.hero.hp + (this.permanent.health || 0);
    this.health = this.maxHealth;
    this.baseDamageBonus = this.permanent.damage || 0;
    this.baseSpeedBonus = this.permanent.speed || 0;
    this.phase = 'playing';
    this.notify();
  }

  addExperience(amount) {
    this.xp += amount * this.attributes().xp;
    this.checkLevelUp();
  }

  nextLevelCost() {
    return 100 * this.level * (this.level + 1) / 2;
  }

  attributes() {
    const hero = this.hero;
    const result = { damage: hero.damage + (this.baseDamageBonus || 0) + this.upgrades.damage * 5,
      speed: hero.speed + (this.baseSpeedBonus || 0) + this.upgrades.speed * 0.5,
      armor: hero.armor + (this.permanent?.armor||0) + this.upgrades.armor*2,
      range: hero.range + this.upgrades.range, attack: 1 + (this.permanent?.attack||0) + this.upgrades.cooldown * 0.1 + this.upgrades.haste*.06,
      crit: hero.crit + (this.permanent?.crit||0), magnet: 3.5 + hero.magnet + (this.permanent?.magnet||0) + this.upgrades.magnet*.5,
      xp: 1, fortune: 1 + (this.permanent?.fortune||0), regen: this.permanent?.regen||0, pierce:0 };
    for (const [id, level] of Object.entries(this.abilities)) {
      if (!level) continue;
      if (FRONTIER_CARDS[id]?.stats || BENTO_CARDS[id]?.stats || id==='bentoGhostLead') {
        const stats = abilityStats(id, level);
        result.damage += stats.damage || 0; result.range += stats.range || 0;
        result.armor += stats.armor || 0; result.attack += stats.haste || 0;
        result.speed += hero.speed * (stats.speed || 0); result.crit += stats.crit || 0;
        result.magnet += stats.magnet || 0; result.xp += stats.fortune || 0;
        result.fortune += stats.fortune || 0; result.regen += stats.regen || 0;
        result.pierce += stats.pierce || 0;
      }
    }
    const ranks = this.abilities;
    for (const [id, value] of Object.entries({ deadeye:4,saltedRounds:3,saloonTempest:5,railbreaker:4,marshfire:3 })) result.damage += (ranks[id] || 0) * value;
    for (const [id, value] of Object.entries({ ironWill:3,bulwark:2,ironCharm:2,ironRosary:2,windwardOath:1 })) result.armor += (ranks[id] || 0) * value;
    for (const [id, value] of Object.entries({ dustWaltz:.06,windwardOath:.08,crowstorm:.04 })) result.speed += hero.speed * (ranks[id] || 0) * value;
    result.range += 2 * (ranks.longshot + ranks.railbreaker);
    if (this.health / this.maxHealth < .35) result.attack += .2 * ranks.lastStand;
    result.crit = Math.min(.7, result.crit + .05 * ranks.crowstorm);
    result.regen += ranks.bloodOath;
    return result;
  }

  checkLevelUp() {
    while (this.xp >= this.nextLevelCost() && this.phase === 'playing') {
      this.xp -= this.nextLevelCost(); this.level++;
      const deck = (this.deck || STARTER_DECK).filter(id => ABILITIES[id] && this.abilities[id] < abilityMaxLevel(id));
      if (!deck.length) { this.coins += 12; this.bankedLevelCoins+=12; continue; }
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
      this.cardOffers = deck.slice(0, 3); this.phase = 'upgrade'; this.notify(); return true;
    }
    return false;
  }

  chooseCard(id) {
    if (this.phase !== 'upgrade' || !this.cardOffers.includes(id)) return false;
    this.grantAbility(id);
    this.phase = 'playing'; this.cardOffers = [];
    if (!this.checkLevelUp()) this.notify();
    return true;
  }
  grantAbility(id){
    if(!ABILITIES[id]||this.abilities[id]>=abilityMaxLevel(id))return false;
    this.abilities[id]++;
    const stats = BENTO_CARDS[id] ? BENTO_CARDS[id].stats || {} : FRONTIER_CARDS[id]?.stats || {};
    const health = stats.health || ({ heart:20,bulwark:10,bloodOath:12,blueTonic:18 }[id] || 0);
    this.maxHealth += health;
    const heal = stats.heal || (id === 'blueTonic' ? 12 : health);
    this.health = Math.min(this.maxHealth, this.health + heal);
    return true;
  }

  updateTime(delta) {
    if (!this.isLocked || this.phase !== 'playing') return;
    this.visualTime += delta;
    if(this.health>0)this.health=Math.min(this.maxHealth,this.health+this.attributes().regen*delta);
    // O relógio da campanha espera o confronto com qualquer chefe ativo.
    if (!this.enemies.some(enemy => enemy.boss)) this.elapsed += delta;
    if (this.mode === 'campaign' && this.elapsed >= 900 && this.bossesSpawned.size === 3 && !this.enemies.some(enemy=>enemy.boss)) {
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
