import { ABILITIES } from '../config/abilityConfig.js';
import { STARTER_DECK } from '../config/champions.js';
const STORAGE_KEY = 'faroeste-black-trail-order-profile-v1';
const DEFAULT_PROFILE = { coins: 0, deck: STARTER_DECK, purchases: { damage: 0, health: 0, speed: 0 }, discoveries: [] };

export class MenuModel {
  constructor() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch { /* Perfil novo. */ }
    this.profile = {
      coins: Number.isFinite(saved.coins) ? Math.max(0, saved.coins) : 0,
      deck: Array.isArray(saved.deck) ? [...new Set(saved.deck.filter(id => ABILITIES[id]))].slice(0, 8) : [...DEFAULT_PROFILE.deck],
      purchases: { ...DEFAULT_PROFILE.purchases, ...saved.purchases },
      discoveries: Array.isArray(saved.discoveries) ? saved.discoveries : [],
    };
    if (this.profile.deck.length < 3) this.profile.deck = [...DEFAULT_PROFILE.deck];
    this.screen = 'home';
    this.returnScreen = 'map';
    this.mode = 'campaign';
    this.champion = 'joao';
    this.map = 'desert';
    this.settings = { effects: true, grain: true, mouseSensitivity: 1, touchSensitivity: 1 };
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
    if (!ABILITIES[id]) return false;
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

  price(id) {
    const base = { damage: 18, health: 15, speed: 14 }[id];
    const rank = this.profile.purchases[id] || 0;
    return base * (rank + 1);
  }

  buy(id) {
    if (!['damage', 'health', 'speed'].includes(id)) return false;
    const rank = this.profile.purchases[id] || 0;
    const price = this.price(id);
    if (rank >= 5 || this.profile.coins < price) return false;
    this.profile.coins -= price;
    this.profile.purchases[id] = rank + 1;
    this.save();
    return true;
  }
}
