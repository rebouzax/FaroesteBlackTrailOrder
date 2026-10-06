import { CHAMPIONS } from '../config/champions.js';
import { STAGES } from '../config/stages.js';
export class MenuViewModel {
  constructor(model, view, gameViewModel, gameRoot) {
    this.model = model;
    this.view = view;
    this.gameViewModel = gameViewModel;
    this.gameRoot = gameRoot;
    this.page = 0; this.search = ''; this.filter = 'unlocked';
    this.heroFocus=model.champion;this.stageFocus=model.map;
    this.shopTab='upgrades';this.shopPage=0;this.shopFocus='damage';this.shopNotice='';
  }

  mount() {
    this.applySettings();
    this.view.mount(this);
  }

  navigate(screen) {
    const previous=this.model.screen;
    const catalogs=['arsenal','bestiary','merchant'];
    if(catalogs.includes(screen)&&!catalogs.includes(previous))this.model.returnScreen=previous;
    this.model.screen = screen;
    if(!this.model.heroUnlocked(this.model.champion))this.model.champion='joao';
    if(!this.model.stageUnlocked(this.model.map))this.model.map='desert';
    if(screen==='champion'&&previous==='modes')this.heroFocus=this.model.champion;
    if(screen==='map'&&previous==='champion')this.stageFocus=this.model.map;
    this.page = 0;
    if(screen==='merchant'){this.shopPage=0;this.shopNotice='';}
    this.view.render();
  }
  cycleSelection(direction) {
    const hero=this.model.screen==='champion';
    if(!hero&&this.model.screen!=='map')return;
    const key=hero?'heroFocus':'stageFocus',ids=Object.keys(hero?CHAMPIONS:STAGES);
    const index=Math.max(0,ids.indexOf(this[key]));
    this[key]=ids[(index+(direction<0?-1:1)+ids.length)%ids.length];
    this.view.render();
  }

  applySettings() {
    this.gameRoot.classList.toggle('menu-effects-off', !this.model.settings.effects);
    this.gameRoot.classList.toggle('menu-grain-off', !this.model.settings.grain);
    this.gameViewModel.view.audio.setVolumes(this.model.settings.musicVolume, this.model.settings.effectsVolume);
    this.gameViewModel.view.whipAudio.volume=.38*this.gameViewModel.view.audio.effectsVolume;
  }

  setVolume(kind, value) {
    if(!['music','effects'].includes(kind))return;
    this.model.settings[`${kind}Volume`]=Math.max(0,Math.min(1,Number(value)/100));
    this.model.saveSettings();this.applySettings();
  }

  setSensitivity(value) {
    const key = this.gameViewModel.touchDevice ? 'touchSensitivity' : 'mouseSensitivity';
    this.model.settings[key] = Math.max(.2, Math.min(3, Number(value) || 1));
    this.model.saveSettings();
    this.gameViewModel.view.controls.pointerSpeed = this.gameViewModel.sensitivity();
  }

  action(action) {
    if(action.startsWith('shop:')){
      const [,command,value]=action.split(':');
      if(command==='tab'&&['upgrades','cards'].includes(value)){this.shopTab=value;this.shopPage=0;this.shopFocus=null;this.shopNotice='';}
      if(command==='page'){this.shopPage+=Number(value)||0;this.shopNotice='';}
      if(command==='focus')this.shopFocus=value;
      if(command==='buy'){
        const bought=this.shopTab==='cards'?this.model.buyCard(value):this.model.buy(value);
        this.shopNotice=bought?this.shopTab==='cards'?'Carta adquirida! Equipe-a no Arsernal.':'Melhoria adquirida! Será aplicada na próxima jornada.':'Compra indisponível. Confira o saldo e o avanço da campanha.';
      }
      this.view.render();return;
    }
    if(action.startsWith('cycle:')){this.cycleSelection(Number(action.slice(6)));return;}
    if(action==='confirmChampion'){
      if(!this.model.heroUnlocked(this.heroFocus))return;
      this.model.champion=this.heroFocus;this.navigate('map');return;
    }
    if (action === 'fullscreen') { this.gameViewModel.requestLandscape(); return; }
    if (action === 'modes' && this.gameViewModel.touchDevice) this.gameViewModel.requestLandscape();
    if (action.startsWith('page:')) { this.page = Math.max(0, this.page + Number(action.slice(5))); this.view.render(); return; }
    if (action.startsWith('filter:')) { this.filter = action.slice(7); this.page = 0; this.view.render(); return; }
    if (action.startsWith('mode:')) {
      this.model.mode = action.slice(5);
      this.navigate('champion');
      return;
    }
    if(action.startsWith('stage:') && this.model.stageUnlocked(action.slice(6))){this.model.map=this.stageFocus=action.slice(6);this.view.render();return;}
    if (action.startsWith('champion:') && CHAMPIONS[action.slice(9)] && this.model.heroUnlocked(action.slice(9))) { this.model.champion=this.heroFocus=action.slice(9);this.view.render();return; }
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
      if(!this.model.stageUnlocked(this.stageFocus)||!this.model.heroUnlocked(this.model.champion))return;
      this.model.map=this.stageFocus;
      this.gameViewModel.start({ mode: this.model.mode, champion: this.model.champion, map: this.model.map });
      return;
    }
    if (['home', 'modes', 'champion', 'map', 'arsenal', 'bestiary', 'merchant', 'settings', 'exit'].includes(action)) this.navigate(action);
  }
}
