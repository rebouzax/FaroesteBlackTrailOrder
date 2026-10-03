import { INITIAL_CARDS, MISSIONS, BOSS_REWARDS, CLEAR_REWARDS, cardUnlocked, refreshCardRewards } from '../config/campaign.js';
import { ABILITIES } from '../config/abilityConfig.js';
import { CHAMPIONS } from '../config/champions.js';
const STORAGE_KEY = 'faroeste-black-trail-order-profile-v1';
const DEFAULT_PROFILE = { coins: 0, deck: INITIAL_CARDS, purchases: { damage: 0, health: 0, speed: 0 }, discoveries: [] };

export class MenuModel {
  constructor() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch { /* Perfil novo. */ }
    this.profile = {
      coins: Number.isFinite(saved.coins) ? Math.max(0, saved.coins) : 0,
      deck: Array.isArray(saved.deck) ? [...new Set(saved.deck.filter(id => ABILITIES[id]))].slice(0, 8) : [...DEFAULT_PROFILE.deck],
      purchases: { ...DEFAULT_PROFILE.purchases, ...saved.purchases },
      discoveries: Array.isArray(saved.discoveries) ? saved.discoveries.filter(id=>id!=='crow') : [],
      storyClears: saved.storyClears && typeof saved.storyClears==='object' ? saved.storyClears : {},
      missionClears: Array.isArray(saved.missionClears)?saved.missionClears:[],
      bossKills: Array.isArray(saved.bossKills)?saved.bossKills:[],
      unlockedCards: Array.isArray(saved.unlockedCards)?saved.unlockedCards.filter(id=>ABILITIES[id]):[],
      unlockedHeroes: Array.isArray(saved.unlockedHeroes)?saved.unlockedHeroes.filter(id=>CHAMPIONS[id]):['joao'],
    };
    refreshCardRewards(this.profile);
    this.profile.deck=this.profile.deck.filter(id=>this.cardUnlocked(id));
    if (this.profile.deck.length < 3) this.profile.deck = [...INITIAL_CARDS];
    this.screen = 'home';
    this.returnScreen = 'map';
    this.mode = 'campaign';
    this.champion = 'joao';
    this.map = 'desert';
    this.settings = { effects: true, grain: true, mouseSensitivity: 1, touchSensitivity: 1, musicVolume: .65, effectsVolume: .8 };
    try { Object.assign(this.settings, JSON.parse(localStorage.getItem(`${STORAGE_KEY}-settings`) || '{}')); } catch { /* Padrões. */ }
  }

  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile)); } catch { /* Jogo ainda funciona sem armazenamento. */ }
  }

  saveSettings() {
    try { localStorage.setItem(`${STORAGE_KEY}-settings`, JSON.stringify(this.settings)); } catch { /* Opcional. */ }
  }

  addCoins(amount) {
    this.profile.coins += amount;
    this.save();
  }

  discover(id) {
    if (this.profile.discoveries.includes(id)) return;
    this.profile.discoveries.push(id);
    this.save();
  }

  toggleDeck(id) {
    if (!this.cardUnlocked(id)) return false;
    const deck = this.profile.deck;
    if (deck.includes(id)) {
      if (deck.length <= 3) return false;
      deck.splice(deck.indexOf(id), 1);
    } else {
      if (deck.length >= 8) return false;
      deck.push(id);
    }
    this.save();
    return true;
  }

  heroUnlocked(id){return id==='joao'||id==='ana'&&Boolean(this.profile.storyClears.ghostTown)||this.profile.unlockedHeroes.includes(id);}
  stageUnlocked(id){return id==='desert'||id==='mine'&&Boolean(this.profile.storyClears.desert)||id==='ghostTown'&&Boolean(this.profile.storyClears.mine);}
  cardUnlocked(id){return cardUnlocked(this.profile,id);}
  merchantUnlocked(){return this.profile.bossKills.length>0;}
  completeMission(id){
    const mission=Object.values(MISSIONS).flat().find(m=>m.id===id);
    if(!mission||this.profile.missionClears.includes(id))return [];
    this.profile.missionClears.push(id);if(mission.hero&&!this.profile.unlockedHeroes.includes(mission.hero))this.profile.unlockedHeroes.push(mission.hero);
    this.profile.unlockedCards=[...new Set([...this.profile.unlockedCards,...mission.cards])];refreshCardRewards(this.profile);this.save();
    return [mission.hero,...mission.cards].filter(Boolean);
  }
  defeatBoss(id){
    if(!this.profile.bossKills.includes(id))this.profile.bossKills.push(id);
    this.profile.unlockedCards=[...new Set([...this.profile.unlockedCards,...(BOSS_REWARDS[id]||[])])];this.save();
  }
  clearStage(id){
    this.profile.storyClears[id]=true;
    if(id==='ghostTown'){
      this.profile.storyClears.town=true;
      if(!this.profile.unlockedHeroes.includes('ana'))this.profile.unlockedHeroes.push('ana');
    }
    this.profile.unlockedCards=[...new Set([...this.profile.unlockedCards,...(CLEAR_REWARDS[id]||[])])];refreshCardRewards(this.profile);this.save();
  }
  price(id) {
    const base = { damage: 18, health: 15, speed: 14 }[id];
    const rank = this.profile.purchases[id] || 0;
    return base * (rank + 1);
  }

  buy(id) {
    if (!this.merchantUnlocked() || !['damage', 'health', 'speed'].includes(id)) return false;
    const rank = this.profile.purchases[id] || 0;
    const price = this.price(id);
    if (rank >= 5 || this.profile.coins < price) return false;
    this.profile.coins -= price;
    this.profile.purchases[id] = rank + 1;
    this.save();
    return true;
  }
}
