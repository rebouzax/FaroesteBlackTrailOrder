import { CHAMPIONS } from '../config/champions.js';
export class MenuViewModel {
  constructor(model, view, gameViewModel, gameRoot) {
    this.model = model;
    this.view = view;
    this.gameViewModel = gameViewModel;
    this.gameRoot = gameRoot;
    this.page = 0; this.search = ''; this.filter = 'all';
  }

  mount() {
    this.applySettings();
    this.view.mount(this);
  }

  navigate(screen) {
    if (['arsenal', 'bestiary', 'merchant'].includes(screen)) this.model.returnScreen = this.model.screen;
    this.model.screen = screen;
    this.page = 0;
    this.view.render();
  }

  applySettings() {
    this.gameRoot.classList.toggle('menu-effects-off', !this.model.settings.effects);
    this.gameRoot.classList.toggle('menu-grain-off', !this.model.settings.grain);
  }

  setSensitivity(value) {
    const key = this.gameViewModel.touchDevice ? 'touchSensitivity' : 'mouseSensitivity';
    this.model.settings[key] = Math.max(.2, Math.min(3, Number(value) || 1));
    this.model.saveSettings();
    this.gameViewModel.view.controls.pointerSpeed = this.gameViewModel.sensitivity();
  }

  action(action) {
    if (action === 'fullscreen') { this.gameViewModel.requestLandscape(); return; }
    if (action === 'modes' && this.gameViewModel.touchDevice) this.gameViewModel.requestLandscape();
    if (action.startsWith('page:')) { this.page = Math.max(0, this.page + Number(action.slice(5))); this.view.render(); return; }
    if (action.startsWith('filter:')) { this.filter = action.slice(7); this.page = 0; this.view.render(); return; }
    if (action.startsWith('mode:')) {
      this.model.mode = action.slice(5);
      this.navigate('champion');
      return;
    }
    if (action.startsWith('champion:') && CHAMPIONS[action.slice(9)]) { this.model.champion = action.slice(9); this.view.render(); return; }
    if (action.startsWith('deck:')) { this.model.toggleDeck(action.slice(5)); this.view.render(); return; }
    if (action.startsWith('buy:')) { this.model.buy(action.slice(4)); this.view.render(); return; }
    if (action.startsWith('setting:')) {
      const setting = action.slice(8);
      if (!['effects', 'grain'].includes(setting)) return;
      this.model.settings[setting] = !this.model.settings[setting];
      this.model.saveSettings();
      this.applySettings();
      this.view.render();
      return;
    }
    if (action === 'play') {
      this.gameViewModel.start({ mode: this.model.mode, champion: this.model.champion, map: this.model.map });
      return;
    }
    if (['home', 'modes', 'champion', 'map', 'arsenal', 'bestiary', 'merchant', 'settings', 'exit'].includes(action)) this.navigate(action);
  }
}
