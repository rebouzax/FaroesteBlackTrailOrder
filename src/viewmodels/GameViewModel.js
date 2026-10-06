import { MISSIONS } from '../config/campaign.js';
import { RUN_UPGRADES } from '../config/bentoShop.js';
import { runProducts, licenseProducts } from './BentoShopModel.js';
import { STAGES, DESERT_BOSSES as BOSSES, MINE_BOSSES, CITY_BOSSES, SALOON_BOSSES } from '../config/stages.js';
import { SaloonBossSystem } from '../systems/SaloonBossSystem.js';
import { WeatherSystem } from '../systems/WeatherSystem.js';
import { obstacleHit, segmentSphere } from '../systems/ProjectilePhysics.js';
import { AbilitySystem } from '../systems/AbilitySystem.js';
import { EnemySeparation } from '../systems/EnemySeparation.js';
const LIMIT = 238;
const RANGE = 5;
const BOSS_COINS = Object.fromEntries(
  [BOSSES, MINE_BOSSES, CITY_BOSSES, SALOON_BOSSES].flatMap(bosses => bosses.map((boss, index) => [boss.type, [100, 300, 700][index]]))
);
const STATS = {
  bat: { hp: 10, damage: 10, armor: 0, speed: 2.5, xp: 10 },
  dog: { hp: 35, damage: 14, armor: 2, speed: 3.5, xp: 20 },
  skeleton: { hp: 22, damage: 8, armor: 1, speed: 1.7, xp: 15 },
  snake:{hp:15,damage:12,armor:0,speed:2.4,xp:12},
  scorpion:{hp:25,damage:15,armor:2,speed:1.8,xp:18},
  spider:{hp:18,damage:10,armor:0,speed:2.8,xp:14},
  miner:{hp:55,damage:18,armor:2,speed:1.55,xp:32},
  ghost:{hp:30,damage:16,armor:0,speed:2.2,xp:26},
  ghoul:{hp:85,damage:22,armor:2,speed:1.9,xp:42},
  axeSkeleton:{hp:48,damage:18,armor:1,speed:1.5,xp:30},
  zombie: { hp: 36, damage: 12, armor: 1, speed: 1.45, xp: 23 },
  bonewalker: { hp: 31, damage: 11, armor: 1, speed: 1.95, xp: 22 },
  wendigo: { hp: 115, damage: 23, armor: 3, speed: 2.3, xp: 90 },
  snatcher: { hp: 70, damage: 19, armor: 1, speed: 2.7, xp: 55 },
};

export class GameViewModel {
  constructor(model, view, menuModel) {
    this.model = model;
    this.view = view;
    this.menuModel = menuModel;
    this.abilitySystem = new AbilitySystem(model, view, this);
    this.weather = new WeatherSystem(this);
    this.saloonBosses = new SaloonBossSystem(this);
    this.keys = new Set();
    this.colliders = [];
    this.crowd = new EnemySeparation((x,z,radius,enemy)=>{
      const clear=this.spotClear(x,z,radius,enemy.floor||0);
      if(clear)enemy.floor=this.view.floorAt(x,z,enemy.floor||0);
      return clear;
    });
    this.spawnClock = 1.2;
    this.dogClock = 7;
    this.skeletonClock = 11;
    this.extraClock = 8;
    this.bandageClock = 55 + Math.random() * 35;
    this.chestTimes = [90 + Math.random() * 95, 330 + Math.random() * 95, 610 + Math.random() * 95, 790 + Math.random() * 65];
    this.nextChest = 0;
    this.merchantWindow = -1;
    this.shopTab='upgrades';this.shopPage=0;this.shopFocus='whip';this.shopNotice='';
    this.invulnerable = 0;
    this.fallbackLook = false;
    this.touchDevice = window.matchMedia('(pointer: coarse)').matches;
    this.touchMove = { forward: 0, strafe: 0 };
    this.onKeyDown = (event) => {
      if(this.model.phase==='menu')return;
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
      rotation.y -= event.movementX * 0.002 * this.sensitivity();
      rotation.x = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, rotation.x - event.movementY * 0.002 * this.sensitivity()));
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

  addCollider(x, z, radius) { this.colliders.push({ kind: 'circle', x, z, radius }); }

  addBoxCollider(minX, maxX, minZ, maxZ, minY=0, maxY=4) { this.colliders.push({ kind: 'box', minX, maxX, minZ, maxZ,minY,maxY }); }

  spotClear(x, z, padding = 0, feet = this.view.camera.position.y-1.68) {
    const bounds=STAGES[this.model.stage||'desert'].bounds;
    if(bounds.ellipse){if((x/(bounds.ellipse[0]-padding))**2+(z/(bounds.ellipse[1]-padding))**2>1)return false;}
    else if(bounds.x){if(Math.abs(x)>bounds.x-padding||Math.abs(z)>bounds.z-padding)return false;}
    else if (Math.hypot(x, z) > bounds.radius - padding) return false;
    const saloon=this.model.stage==='saloon';
    if(saloon&&!this.view.saloonStage.canStep(x,z,feet))return false;
    const floor=saloon?this.view.floorAt(x,z,feet):feet;
    return this.colliders.every(item => item.walkable||(item.maxY??4)<=floor+.1||(item.minY??0)>=floor+1.75|| (item.kind === 'box'
      ? x < item.minX - padding || x > item.maxX + padding || z < item.minZ - padding || z > item.maxZ + padding
      : Math.hypot(x - item.x, z - item.z) >= item.radius + padding));
  }

  sensitivity() {
    const key = this.touchDevice ? 'touchSensitivity' : 'mouseSensitivity';
    return Math.max(.2, Math.min(3, Number(this.menuModel.settings[key]) || 1));
  }

  async start(selection = null) {
    this.view.audio.unlock();
    this.view.controls.pointerSpeed = this.sensitivity();
    if (this.model.phase === 'menu') {
      if (!selection || !this.menuModel.heroUnlocked(selection.champion) || !this.menuModel.stageUnlocked(selection.map)) return;
      if(this.starting)return;
      this.starting=true;
      if(this.touchDevice)this.requestLandscape();
      await this.view.assetsReady;
      await this.view.selectStage(selection.map);
      this.weather.reset();
      this.saloonBosses.reset();
      this.starting=false;
      this.model.resetRun();this.abilitySystem.reset();this.resetRunTimers();
      this.model.deck = this.menuModel.profile.deck.filter(id=>this.menuModel.cardUnlocked(id));
      this.runMissions=(MISSIONS[selection.map]||[]).map(m=>({...m,count:0,completed:false,failed:false}));
      this.runBossKills=new Set();
      this.model.startRun(selection, this.menuModel.profile.purchases);
      this.view.setChampion(this.model.champion);
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
  resetRunTimers(){
    this.spawnClock=1.2;this.dogClock=7;this.skeletonClock=11;this.extraClock=8;
    this.bandageClock=55+Math.random()*35;
    this.chestTimes=[90+Math.random()*95,330+Math.random()*95,610+Math.random()*95,790+Math.random()*65];
    this.nextChest=0;this.merchantWindow=-1;this.invulnerable=0;this.actuallyWalking=false;
    this.crowd.nextId=1;
    this.keys.clear();this.touchMove={forward:0,strafe:0};this.shopTab='upgrades';this.shopPage=0;this.shopFocus='whip';this.shopNotice='';
  }
  returnToSelection(){
    if(!['victory','defeat'].includes(this.model.phase))return;
    const screen=this.model.phase==='victory'?'champion':'map';
    this.bankLevelCoins();this.releasePointer();this.view.clearRun(this.model);
    this.model.resetRun();this.abilitySystem.reset();this.weather.reset();this.saloonBosses.reset();this.resetRunTimers();
    const menu=this.view.menuViewModel;
    menu.heroFocus=this.menuModel.champion;menu.stageFocus=this.menuModel.map;
    menu.navigate(screen);this.view.showMenu();this.model.notify();
  }

  async requestLandscape() {
    try {
      const element = document.documentElement;
      const request = element.requestFullscreen || element.webkitRequestFullscreen;
      if (!document.fullscreenElement && !document.webkitFullscreenElement && request) await request.call(element, { navigationUI: 'hide' });
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
    this.bankLevelCoins();
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
    rotation.y -= dx * 0.003 * this.sensitivity();
    rotation.x = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, rotation.x - dy * 0.003 * this.sensitivity()));
  }

  update(delta) {
    let active = this.model.isLocked && this.model.phase === 'playing' && !this.isPortraitBlocked();
    if (active) {
      this.model.updateTime(delta);
      this.updateMissions();
      if (this.model.phase === 'victory') {
        if(this.model.mode==='campaign' && this.runBossKills.size===3)this.menuModel.clearStage(this.model.stage);
        this.releasePointer();
      } else {
        this.movePlayer(delta);
        this.updateWorldEvents(delta);
        if (this.model.phase === 'playing') {
          this.spawnWave(delta);
          this.weather.update(delta);
          this.moveEnemies(delta);
          this.saloonBosses.update(delta);
          this.moveProjectiles(delta);
          this.abilitySystem.update(delta);
          this.collectLoot(delta);
          if (this.model.hero.primary === 'whip' && this.model.whip.cooldown === 0 && !this.model.whip.active) this.autoWhip();
          if (this.model.phase === 'playing') this.whipImpact();
          if (this.model.phase === 'playing' && this.model.health <= 0) {
            this.model.phase = 'defeat';
            this.releasePointer();
          }
        }
      }
    }
    const camera = this.view.camera;
    active = this.model.isLocked && this.model.phase === 'playing' && !this.isPortraitBlocked();
    this.model.updatePlayer({
      x: camera.position.x, z: camera.position.z,
      yaw: camera.rotation.y, pitch: camera.rotation.x,
      walking: active && this.actuallyWalking,
    });
    this.view.update(active ? delta : 0, this.model);
  }

  movePlayer(delta) {
    const forward = Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')) + this.touchMove.forward;
    const strafe = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft')) + this.touchMove.strafe;
    this.actuallyWalking = false;
    if (!forward && !strafe) return;
    const step = this.model.attributes().speed * delta / Math.max(1, Math.hypot(forward, strafe));
    const { forwardX, forwardZ, rightX, rightZ } = this.view.getPlanarFacing();
    const dx = (forwardX * forward + rightX * strafe) * step;
    const dz = (forwardZ * forward + rightZ * strafe) * step;
    const camera = this.view.camera;
    const oldX = camera.position.x, oldZ = camera.position.z;
    const blocked = (x, z) => !this.spotClear(x, z, 0.48);
    if (!blocked(camera.position.x + dx, camera.position.z)) camera.position.x += dx;
    if (!blocked(camera.position.x, camera.position.z + dz)) camera.position.z += dz;
    camera.position.y=this.view.floorAt(camera.position.x,camera.position.z,camera.position.y-1.68)+1.68;
    this.actuallyWalking = Math.hypot(camera.position.x-oldX, camera.position.z-oldZ) > .0001;
  }

  displacePlayer(dx,dz) {
    const p=this.view.camera.position;
    if(this.spotClear(p.x+dx,p.z,.48))p.x+=dx;
    if(this.spotClear(p.x,p.z+dz,.48))p.z+=dz;
    p.y=this.view.floorAt(p.x,p.z,p.y-1.68)+1.68;
  }

  spawnWave(delta) {
    const elapsed = this.model.elapsed;
    if(this.model.stage==='saloon'){
      this.spawnClock-=delta;
      if(this.spawnClock<=0){
        this.spawnClock=Math.max(.65,1.9-elapsed/900);
        const roster=elapsed<90?['snake','bat','spider']:elapsed<240?['snake','bat','spider','skeleton','zombie']:['snake','bat','spider','skeleton','zombie','ghost'];
        const limit=this.model.enemies.some(enemy=>enemy.type==='damaMalvina')?40:44;
        for(let i=0;i<1+Math.floor(elapsed/300)&&this.model.enemies.length<limit;i++)this.spawnEnemy(roster[Math.floor(Math.random()*roster.length)]);
      }
      for(const boss of SALOON_BOSSES)if(elapsed>=boss.at&&!this.model.bossesSpawned.has(boss.type)&&this.spawnEnemy(boss.type,boss))this.model.bossesSpawned.add(boss.type);
      return;
    }
    if(this.model.stage==='ghostTown'){
      this.spawnClock-=delta;
      if(this.spawnClock<=0){
        this.spawnClock=Math.max(.5,1.8-elapsed/900);
        const roster=elapsed<100?['bat','snake','ghost']:elapsed<260?['ghost','snake','bat','scorpion','zombie']:['ghost','snake','bat','scorpion','ghoul','zombie','axeSkeleton'];
        for(let i=0;i<1+Math.floor(elapsed/240)&&this.model.enemies.length<48;i++)this.spawnEnemy(roster[Math.floor(Math.random()*roster.length)]);
      }
      for(const boss of CITY_BOSSES)if(elapsed>=boss.at&&!this.model.bossesSpawned.has(boss.type)&&this.spawnEnemy(boss.type,boss))this.model.bossesSpawned.add(boss.type);
      return;
    }
    if(this.model.stage==='mine'){
      this.spawnClock-=delta;
      if(this.spawnClock<=0){
        this.spawnClock=Math.max(.6,1.7-elapsed/850);
        const roster=elapsed<90?['snake','scorpion','spider']:elapsed<240?['snake','scorpion','spider','miner','zombie']:['snake','scorpion','spider','miner','zombie','ghost','skeleton'];
        for(let i=0;i<1+Math.floor(elapsed/240)&&this.model.enemies.length<48;i++)this.spawnEnemy(roster[Math.floor(Math.random()*roster.length)]);
      }
      for(const boss of MINE_BOSSES)if(elapsed>=boss.at&&!this.model.bossesSpawned.has(boss.type)&&this.spawnEnemy(boss.type,boss))this.model.bossesSpawned.add(boss.type);
      return;
    }
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
    if (elapsed >= 95) {
      this.extraClock -= delta;
      if (this.extraClock <= 0) {
        this.extraClock = Math.max(3.8, 9 - elapsed / 220);
        if (this.model.enemies.length < 48) {
          const options = elapsed >= 600 ? ['zombie', 'bonewalker', 'snatcher', 'wendigo']
            : elapsed >= 300 ? ['zombie', 'bonewalker', 'snatcher']
              : ['zombie'];
          this.spawnEnemy(options[Math.floor(Math.random() * options.length)]);
        }
      }
    }
    for (const boss of BOSSES) {
      if (elapsed < boss.at || this.model.bossesSpawned.has(boss.type)) continue;
      if (this.spawnEnemy(boss.type, boss)) this.model.bossesSpawned.add(boss.type);
    }
  }

  spawnEnemy(type, boss = null, options = {}) {
    const visual = boss?.visual || (type==='axeSkeleton'?'skeleton':type);
    if (!this.view.enemyTemplates.has(visual)) return false;
    const saloon=this.model.stage==='saloon',feet=options.floor??this.view.camera.position.y-1.68;
    const scale=boss?.scale??STAGES[this.model.stage]?.enemyScales?.[visual]??null;
    const padding=saloon?(boss?.bodyRadius??this.view.enemyRadius(visual,Boolean(boss),scale)):(boss?3.2:Math.max(1.1,this.view.enemyRadius(visual,false,scale)));
    const point = this.findEventSpot(options.min??(saloon?10:boss ? 17 : 25),options.max??(saloon?20:boss ? 22 : 33),
      padding,(x,z)=>this.model.enemies.every(enemy=>Math.abs((enemy.floor||0)-feet)>1.5||Math.hypot(x-enemy.x,z-enemy.z)>enemy.bodyRadius+padding),feet,options.near);
    if (!point) return false;
    const { x, z } = point;
    const floor=this.view.floorAt(x,z,feet);
    const hover = visual === 'bat' ? (saloon?1.8+Math.random()*.8:2.2+Math.random()*1.2) : visual==='witch'?.7:0;
    const y=floor+hover;
    const object = this.view.addEnemy(visual, x, y, z, Boolean(boss),scale,boss?.bodyRadius);
    if (!object) return false;
    const stats = boss || STATS[type];
    const minute = Math.floor(this.model.elapsed / 60);
    const enemy={
      type, visual, object, x, y, z, floor, hover, boss: Boolean(boss),height:this.view.enemyActors.get(object)?.height,bottom:this.view.enemyActors.get(object)?.bottom,
      hp: boss ? stats.hp : Math.round(stats.hp * (1 + minute * 0.18)),
      maxHp: boss ? stats.hp : Math.round(stats.hp * (1 + minute * 0.18)),
      damage: stats.damage, armor: boss ? 3 : stats.armor,
      speed: stats.speed, xp: stats.xp,
      phase: Math.random() * Math.PI * 2, shotClock: 2.6,
    };
    this.crowd.register(enemy,this.view.enemyActors.get(object)?.bodyRadius||.55);
    this.model.enemies.push(enemy);
    return true;
  }

  moveEnemies(delta) {
    const player = this.view.camera.position;
    this.invulnerable = Math.max(0, this.invulnerable - delta);
    const enemies=[...this.model.enemies];
    for (const enemy of enemies) {
      const oldX = enemy.x, oldZ = enemy.z;
      enemy.previousX=oldX;enemy.previousZ=oldZ;
      const dx = player.x - enemy.x, dz = player.z - enemy.z;
      const distance = Math.max(0.001, Math.hypot(dx, dz));
      const handled=this.saloonBosses.updateEnemy(enemy,delta);
      const destination=!handled&&this.model.stage==='saloon'?this.view.saloonStage.route(enemy,player):player;
      if (!handled&&(distance > enemy.bodyRadius+.58||Math.abs((enemy.floor||0)-(player.y-1.68))>1.5)) {
        const travel = Math.max(0, enemy.speed - (enemy.knockback || 0)) * delta;
        const direction=this.crowd.steer(enemy,enemies,destination.x-enemy.x,destination.z-enemy.z);
        this.crowd.move(enemy,direction.x*travel,direction.z*travel);
      }
      if (enemy.knockback > 0) {
        this.crowd.move(enemy,(enemy.knockX || 0)*enemy.knockback*delta,(enemy.knockZ || 0)*enemy.knockback*delta);
        enemy.knockback = Math.max(0, enemy.knockback - delta * 25);
      }
      const clearance = enemy.bodyRadius;
      if (!this.spotClear(enemy.x, enemy.z, clearance,enemy.floor||0)) {
        if (this.spotClear(enemy.x, oldZ, clearance,enemy.floor||0)) enemy.z = oldZ;
        else if (this.spotClear(oldX, enemy.z, clearance,enemy.floor||0)) enemy.x = oldX;
        else { enemy.x = oldX; enemy.z = oldZ; }
      }
    }
    this.crowd.resolve(enemies,player);
    for(const enemy of enemies){
      const dx=player.x-enemy.x,dz=player.z-enemy.z,distance=Math.hypot(dx,dz);
      enemy.floor=this.view.floorAt(enemy.x,enemy.z,enemy.floor||0);
      enemy.y=enemy.floor+(enemy.hover||0)+(enemy.visual==='witch'?Math.sin(this.saloonBosses.time*2+enemy.phase)*.2:0);
      enemy.object.position.set(enemy.x, enemy.y + (enemy.visual === 'bat' ? Math.sin(this.model.elapsed * 5 + enemy.phase) * 0.28 : 0), enemy.z);
      // Os modelos originais têm a frente em +Z, como no Faroeste Survivors.
      enemy.object.rotation.y = Math.atan2(dx, dz);
      this.view.updateEnemy(enemy.object, delta);
      enemy.vx=(enemy.x-enemy.previousX)/Math.max(.001,delta);enemy.vz=(enemy.z-enemy.previousZ)/Math.max(.001,delta);
      if (distance < enemy.bodyRadius+.8 && Math.abs((enemy.floor||0)-(player.y-1.68))<1.5 && this.invulnerable === 0) {
        this.hurt(enemy.damage);
        this.view.attackEnemy(enemy.object);
      }
      if (enemy.boss && this.model.stage!=='saloon' && distance < 28) {
        enemy.shotClock -= delta;
        if (enemy.shotClock <= 0) {
          enemy.shotClock = 3.6;
          this.bossVolley(enemy);
        }
      }
      if(enemy.type==='axeSkeleton'&&distance<23&&distance>3){
        enemy.shotClock-=delta;
        if(enemy.shotClock<=0){enemy.shotClock=3.2;this.throwAxe(enemy);this.view.attackEnemy(enemy.object);}
      }
    }
  }

  hurt(amount) {
    this.model.health = Math.max(0, this.model.health - amount * 20 / (20 + this.model.attributes().armor));
    this.model.damageFlash = 0.22;
    this.invulnerable = 0.9;
    if(this.model.health>0&&this.model.abilities.bentoMoonMirror)this.abilitySystem.pendingMirror=true;
  }

  bossVolley(enemy) {
    if (this.model.projectiles.length >= 64) return;
    const aim = Math.atan2(this.view.camera.position.z - enemy.z, this.view.camera.position.x - enemy.x);
    for (let i = -2; i <= 2; i++) {
      const angle = aim + i * 0.23;
      const y=enemy.y+Math.min(3.5,(enemy.height||3)*.6),distance=Math.max(1,Math.hypot(this.view.camera.position.x-enemy.x,this.view.camera.position.z-enemy.z));
      const object = this.view.addProjectile(enemy.x, y, enemy.z);
      this.model.projectiles.push({
        object, x: enemy.x, y, z: enemy.z,vy:(this.view.camera.position.y-.3-y)/distance*7,
        vx: Math.cos(angle) * 7, vz: Math.sin(angle) * 7,
        age: 0, damage: Math.ceil(enemy.damage * 0.45),
      });
    }
  }

  throwAxe(enemy) {
    if(this.model.projectiles.length>=64)return;
    const p=this.view.camera.position,flight=Math.max(.5,Math.hypot(p.x-enemy.x,p.z-enemy.z)/13),y=1.6;
    const object=this.view.addProjectile(enemy.x,y,enemy.z,'axe');
    this.model.projectiles.push({object,x:enemy.x,y,z:enemy.z,vx:(p.x-enemy.x)/flight,vz:(p.z-enemy.z)/flight,vy:(p.y-y)/flight+4*flight,gravity:8,age:0,damage:enemy.damage,kind:'axe'});
  }

  moveProjectiles(delta) {
    const player = this.view.camera.position;
    for (const shot of [...this.model.projectiles]) {
      const old={x:shot.x,y:shot.y,z:shot.z};
      shot.age += delta;
      shot.x += shot.vx * delta;
      shot.z += shot.vz * delta;
      shot.y+=(shot.vy||0)*delta-.5*(shot.gravity||0)*delta*delta;shot.vy=(shot.vy||0)-(shot.gravity||0)*delta;
      shot.object.position.set(shot.x, shot.y, shot.z);
      if(shot.kind==='fireball'){shot.object.rotation.set(shot.age*3,shot.age*5,0);shot.object.scale.setScalar(1+Math.sin(shot.age*16)*.12);}
      if(shot.kind==='axe')shot.object.rotation.z+=delta*12;
      const wall=obstacleHit(old,shot,this.colliders,.15);
      const hit=segmentSphere(old,shot,{x:player.x,y:player.y-.4,z:player.z},.75);
      if (hit!==null&&(wall===null||hit<wall)) {
        if (this.invulnerable === 0) this.hurt(shot.damage);
        shot.age = 10;
      }
      if(wall!==null||shot.y<.08)shot.age=10;
      if (shot.age > 5) {
        this.view.removeProjectile(shot.object);
        this.model.projectiles.splice(this.model.projectiles.indexOf(shot), 1);
      }
    }
  }

  autoWhip() {
    const camera = this.view.camera;
    const { forwardX, forwardZ } = this.view.getPlanarFacing();
    let target = null, nearest = this.model.attributes().range;
    for (const enemy of this.model.enemies) {
      if(!this.withinPlayerHeight(enemy))continue;
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
    whip.cooldown = Math.max(0.4, this.model.hero.cooldown / this.model.attributes().attack);
    this.view.startWhip();
  }

  whipImpact() {
    const whip = this.model.whip;
    if (!whip.active || whip.hitApplied || whip.elapsed < 0.18) return;
    whip.hitApplied = true;
    this.view.whipCrack();
    const camera = this.view.camera;
    const { forwardX, forwardZ } = this.view.getPlanarFacing();
    for (const enemy of [...this.model.enemies]) {
      if(!this.withinPlayerHeight(enemy))continue;
      const dx = enemy.x - camera.position.x, dz = enemy.z - camera.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance > this.model.attributes().range) continue;
      if ((dx * forwardX + dz * forwardZ) / Math.max(0.001, distance) <= 0) continue;
      enemy.hp -= (this.model.attributes().damage * (Math.random() < this.model.attributes().crit ? 1.7 : 1)) * 20 / (20 + enemy.armor);
      enemy.knockX = dx / Math.max(distance, 0.001);
      enemy.knockZ = dz / Math.max(distance, 0.001);
      enemy.knockback = enemy.boss ? 2.5 : 7;
      this.view.hitEnemy(enemy.object);
      if (enemy.hp <= 0) this.killEnemy(enemy);
    }
  }

  killEnemy(enemy) {
    const index=this.model.enemies.indexOf(enemy);
    if(index<0)return;
    this.view.removeEnemy(enemy.object);
    this.model.enemies.splice(index, 1);
    this.model.kills += 1;
    const rank = this.model.abilities.soulHarvest;
    if (rank) this.model.health = Math.min(this.model.maxHealth, this.model.health + Math.min(4, rank + 1));
    if(this.model.health>0)this.model.health=Math.min(this.model.maxHealth,this.model.health+(this.model.abilities.bentoBloodPact||0));
    if(this.model.mode==='campaign'){
      this.menuModel.discover(enemy.type);
      this.missionEvent(enemy.type,1);
      if(enemy.boss){this.runBossKills.add(enemy.type);this.menuModel.defeatBoss(enemy.type);}
    }
    this.dropLoot(enemy.x, enemy.z, 'xp', enemy.xp,enemy.floor||0);
    const chance = enemy.boss ? 1 : { bat: 0.12, dog: 0.3, skeleton: 0.22 }[enemy.type] ?? 0.15;
    if (Math.random() < chance) this.dropLoot(enemy.x + 0.5, enemy.z, 'coin', enemy.boss ? (BOSS_COINS[enemy.type] ?? 100) : 15,enemy.floor||0);
  }

  missionEvent(kind,amount){
    if(this.model.mode!=='campaign')return;
    for(const mission of this.runMissions||[]){
      if(mission.completed||mission.failed||mission.kind!==kind||this.model.elapsed<mission.at||this.model.elapsed>mission.at+mission.duration)continue;
      mission.count=Math.min(mission.target,mission.count+amount);
      if(mission.count===mission.target){mission.completed=true;this.menuModel.completeMission(mission.id);}
    }
  }
  updateMissions(){
    if(this.model.mode!=='campaign')return;
    for(const mission of this.runMissions||[])if(!mission.completed&&this.model.elapsed>mission.at+mission.duration)mission.failed=true;
    const active=this.runMissions?.find(m=>!m.completed&&!m.failed&&this.model.elapsed>=m.at&&this.model.elapsed<=m.at+m.duration);
    this.view.updateMissionHUD(active,this.model.elapsed);
  }

  withinPlayerHeight(enemy) {
    if(this.model.stage!=='saloon')return true;
    const p=this.view.camera.position,feet=p.y-1.68;
    if(Math.abs((enemy.floor||0)-feet)>1.5)return false;
    const aim={x:enemy.x,y:enemy.y+(enemy.bottom||0)+(enemy.height||2)*.5,z:enemy.z};
    return obstacleHit(p,aim,this.colliders,.02)===null;
  }

  dropLoot(x, z, kind, value, floor=0) {
    if (this.model.loot.length >= 250) {
      this.view.removeLoot(this.model.loot[0].object);
      this.model.loot.shift();
    }
    const object = this.view.addLoot(x, z, kind);
    object.position.y+=floor;
    this.model.loot.push({ object, x, z, kind, value, floor });
  }

  findEventSpot(minDistance, maxDistance, clearance=3,accept=()=>true,feet=this.view.camera.position.y-1.68,near=null) {
    const player = near||this.view.camera.position;
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = minDistance + Math.random() * (maxDistance - minDistance);
      const x = player.x + Math.cos(angle) * radius;
      const z = player.z + Math.sin(angle) * radius;
      if (this.spotClear(x, z, clearance,feet)&&accept(x,z)) return { x, z, floor:this.view.floorAt(x,z,feet) };
    }
    return null;
  }

  spawnPickup(kind, minDistance, maxDistance, lifetime, value) {
    if(this.model.stage==='saloon'){minDistance=kind==='chest'?18:8;maxDistance=kind==='chest'?30:18;}
    const point = this.findEventSpot(minDistance, maxDistance);
    if (!point) return false;
    const object = this.view.addEventObject(kind, point.x, point.z);
    if (!object) return false;
    object.position.y+=point.floor||0;
    object.userData.floor=point.floor||0;
    this.model.pickups.push({ ...point, kind, object, age: 0, lifetime, value });
    return true;
  }

  updateWorldEvents(delta) {
    const elapsed = this.model.elapsed;
    this.bandageClock -= delta;
    if (this.bandageClock <= 0) {
      this.bandageClock = 65 + Math.random() * 45;
      if (this.model.pickups.filter(item => item.kind === 'bandage').length < 2)
        this.spawnPickup('bandage', 15, 60, 100, 25);
    }
    if (this.nextChest < this.chestTimes.length && elapsed >= this.chestTimes[this.nextChest]) {
      if (this.spawnPickup('chest', 35, 78, 40, 120 + Math.floor(Math.random() * 880))) this.nextChest++;
    }
    const windows = [[100, 180], [420, 600]];
    const activeWindow = windows.findIndex(([start, end]) => elapsed >= start && elapsed < end);
    if (activeWindow !== this.merchantWindow) {
      this.view.removeEventObject(this.model.merchant?.object);
      this.model.merchant = null;
      this.merchantWindow = activeWindow;
    }
    if (activeWindow >= 0 && !this.model.merchant) {
      const point = this.findEventSpot(17, 29);
      const object = point && this.view.addEventObject('merchant', point.x, point.z);
      if (object) {object.position.y+=point.floor||0;object.userData.floor=point.floor||0;this.model.merchant = { ...point, object, reentryLocked: false, age: 0 };}
    }
    const merchant = this.model.merchant;
    if (merchant) {
      merchant.age += delta;
      this.view.updateEventObject(merchant.object, 'merchant', merchant.age);
      const distance = Math.hypot(this.view.camera.position.x - merchant.x, this.view.camera.position.z - merchant.z);
      if (distance > 4) merchant.reentryLocked = false;
      if (distance < 2.4 && Math.abs((merchant.floor||0)-(this.view.camera.position.y-1.68))<1.5 && !merchant.reentryLocked) {
        this.model.phase = 'merchant';
        this.shopNotice='';this.shopPage=0;
        this.releasePointer();
        this.view.showRunMerchant(this.model);
        return;
      }
    }
    for (const item of [...this.model.pickups]) {
      item.age += delta;
      this.view.updateEventObject(item.object, item.kind, item.age);
      const distance = Math.hypot(this.view.camera.position.x - item.x, this.view.camera.position.z - item.z);
      if (item.age < item.lifetime && (distance > (item.kind === 'chest' ? 2.4 : 1.6)||Math.abs((item.floor||0)-(this.view.camera.position.y-1.68))>1.5)) continue;
      this.view.removeEventObject(item.object);
      this.model.pickups.splice(this.model.pickups.indexOf(item), 1);
      if (item.age >= item.lifetime) continue;
      if (item.kind === 'bandage') this.model.health = Math.min(this.model.maxHealth, this.model.health + item.value);
      else {
        const coins = Math.min(999, Math.round(item.value * this.model.attributes().fortune));
        this.model.coins += coins;
        this.missionEvent('coins',coins);
        this.menuModel.addCoins(coins);
      }
      this.view.showPickupMessage(item.kind === 'bandage' ? `BANDAGEM · +${item.value} VIDA` : `TESOURO · +${item.value} MOEDAS`);
    }
  }

  merchantAction(action){
    if(this.model.phase!=='merchant')return;
    const [,command,value]=action.split(':');
    if(command==='tab'&&['upgrades','cards'].includes(value)){this.shopTab=value;this.shopPage=0;this.shopFocus=null;this.shopNotice='';}
    if(command==='page'){this.shopPage+=Number(value)||0;this.shopNotice='';}
    if(command==='focus')this.shopFocus=value;
    if(command==='buy')this.buyFromMerchant(value);
    this.view.showRunMerchant(this.model);
  }
  buyFromMerchant(id) {
    if(this.model.phase!=='merchant')return;
    const cards=this.shopTab==='cards',products=cards?licenseProducts(this.menuModel,this.model):runProducts(this.menuModel,this.model);
    const product=products.find(item=>item.id===id);
    if(!product?.enabled){this.shopNotice='Compra indisponível. Confira o saldo e os requisitos.';return;}
    const bought=cards&&!product.owned?this.menuModel.buyCard(id):this.menuModel.spendCoins(product.price);
    if(!bought)return;
    this.model.coins-=product.price;
    if(cards){
      this.model.grantAbility(id);
      // Cards bought during the run can appear in its subsequent level offers.
      if(!(this.model.deck||[]).includes(id))this.model.deck=[...(this.model.deck||[]),id];
      this.shopNotice=product.owned?'Carta evoluída nesta partida.':'Carta adquirida e ativada! Disponível no Arsernal.';
    }else{
      this.model.runShopPurchases[id]=(this.model.runShopPurchases[id]||0)+1;
      const item=RUN_UPGRADES[id];
      if(item.stat)this.model.upgrades[item.stat]++;
      if(id==='health')this.model.health=Math.min(this.model.maxHealth,this.model.health+25);
      this.shopNotice='Suprimento aplicado nesta partida.';
    }
    this.model.notify();
  }
  bankLevelCoins(){
    if(!this.model.bankedLevelCoins)return;
    this.menuModel.addCoins(this.model.bankedLevelCoins);this.model.bankedLevelCoins=0;
  }

  leaveMerchant() {
    if (this.model.phase !== 'merchant') return;
    this.model.merchant.reentryLocked = true;
    this.model.phase = 'playing';
    this.view.hideRunMerchant();
    this.start();
  }

  collectLoot(delta) {
    const player = this.view.camera.position;
    for (const item of [...this.model.loot]) {
      if (Math.abs((item.floor||0)-(player.y-1.68))<1.5 && Math.hypot(player.x - item.x, player.z - item.z) < this.model.attributes().magnet) {
        this.view.removeLoot(item.object);
        this.model.loot.splice(this.model.loot.indexOf(item), 1);
        if (item.kind === 'coin') {
          const coins = Math.max(1, Math.round(item.value * this.model.attributes().fortune));
          this.model.coins += coins;
          this.missionEvent('coins',coins);
          this.menuModel.addCoins(coins);
          this.model.health=Math.min(this.model.maxHealth,this.model.health+Math.min(5,this.model.abilities.bentoMercyCoin||0));
        }
        else {this.model.addExperience(item.value);this.bankLevelCoins();}
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
