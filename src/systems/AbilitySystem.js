import { abilityStats } from '../config/abilityConfig.js';
import { CHAMPION_CARD_STYLE } from '../config/champions.js';
import { enemyShape, enemyHit, obstacleHit } from './ProjectilePhysics.js';

export class AbilitySystem {
  constructor(model, view, game) {
    this.model=model; this.view=view; this.game=game;
    this.shots=[]; this.bottles=[]; this.fires=[]; this.pulses=[]; this.pending=[]; this.impacts=[];
    this.clocks={}; this.primaryClock=0;
  }
  closest(range, inFront=false) {
    const p=this.view.camera.position, f=this.view.getPlanarFacing(); let target=null;
    for (const enemy of this.model.enemies) {
      const dx=enemy.x-p.x,dz=enemy.z-p.z,d=Math.hypot(dx,dz);
      if (enemy.hp<=0||d>=range||(inFront&&(dx*f.forwardX+dz*f.forwardZ)/Math.max(.001,d)<.55)) continue;
      target=enemy;range=d;
    }
    return target;
  }
  skillStats(id,level=this.model.abilities[id]) {
    const base=abilityStats(id,level),attributes=this.model.attributes(),hero=this.model.hero;
    return {...base,damage:base.damage===undefined?undefined:base.damage+Math.max(0,attributes.damage-hero.damage),
      range:base.range===undefined?undefined:base.range+Math.max(0,attributes.range-hero.range)};
  }
  extraShots(){return abilityStats('doubleShot',this.model.abilities.doubleShot||0).count;}
  burstDelay(attack){return attack.mode==='dual' ? .24 : attack.mode==='shotgun' ? .19 : .13;}
  queueAttack(attack) {
    this.emitAttack(attack);
    const extra=this.extraShots(),delay=this.burstDelay(attack);
    for(let i=1;i<=extra&&this.pending.length<256;i++)this.pending.push({...attack,delay:delay*i});
  }
  emitAttack(attack) {
    const {stats,kind,mode}=attack;
    // Follow the current camera for weapons; cards may target in any direction.
    const target=attack.primary||attack.frontOnly?this.closest(stats.range,true):attack.target?.hp>0?attack.target:this.closest(stats.range||22);
    if(mode==='bomb'){if(target)this.throwBomb(target,stats,kind,attack.bonus);return;}
    if(mode==='radial'){
      const count=Math.min(18,stats.count);
      for(let i=0;i<count;i++)this.fire(null,stats,kind,i*Math.PI*2/count);
      return;
    }
    if(mode==='shotgun'){
      const f=this.view.getPlanarFacing(),angle=Math.atan2(f.forwardZ,f.forwardX);
      for(let i=0;i<this.model.hero.pellets;i++)this.fire(target,stats,'shotgun',angle+(i-(this.model.hero.pellets-1)/2)*.085);
      this.view.fireShotgun();return;
    }
    if(mode==='dual'){
      this.fire(target,stats,'primary',null,'right');this.view.fireRevolver('right');
      if(this.pending.length<256)this.pending.push({...attack,mode:'bullet',kind:'primary',hand:'left',delay:.11});
      return;
    }
    if(!target&&!attack.primary)return;
    this.fire(target,stats,kind,null,attack.hand||'right');
    if(attack.primary||attack.animation==='primary')this.view.fireRevolver(attack.hand||'right');
    else if(kind==='pistol')this.view.fireAbilityPistol();
  }
  damage(enemy,damage,push=0) {
    if (enemy.hp<=0) return;
    enemy.hp-=damage*20/(20+enemy.armor);
    // Continuous auras must not restart hurt poses every rendered frame.
    const showImpact=this.model.visualTime >= (enemy.nextImpactAt || 0);
    if(showImpact){this.view.hitEnemy(enemy.object);enemy.nextImpactAt=this.model.visualTime+.18;}
    if (push) {
      const dx=enemy.x-this.view.camera.position.x,dz=enemy.z-this.view.camera.position.z,d=Math.hypot(dx,dz)||1;
      enemy.knockX=dx/d;enemy.knockZ=dz/d;enemy.knockback=enemy.boss?push*.35:push;
    }
    if (showImpact && this.impacts.length<64) this.impacts.push({x:enemy.x,y:enemy.y+1,z:enemy.z,age:0});
    if (enemy.hp<=0) this.game.killEnemy(enemy);
  }
  fire(target,stats,kind='pistol',angle=null,hand='right') {
    if (this.shots.length>=160) return;
    const p=this.view.camera.position,f=this.view.getPlanarFacing();
    const a=angle??(target?Math.atan2(target.z-p.z,target.x-p.x):Math.atan2(f.forwardZ,f.forwardX));
    const distance=target?Math.max(1,Math.hypot(target.x-p.x,target.z-p.z)):15;
    const blade=['returningBlade','lunarReturn'].includes(kind);
    const speed=blade?17:kind==='ghostShot'?20:kind==='rifle'?115:kind==='shotgun'?65:80;
    const startY=p.y-.18,aimY=target?enemyShape(target).center.y:startY;
    const pitch=Math.atan2(aimY-startY,distance)+(kind==='shotgun'?(Math.random()-.5)*.025:0);
    // Two barrels have distinct origins; their convergence is calculated at the target.
    const offset=this.model.hero.primary==='dualRevolver'&&kind==='primary'?(hand==='left'?-.18:.18):0;
    const x=p.x+f.rightX*offset,z=p.z+f.rightZ*offset;
    const aim=angle===null&&target?Math.atan2(target.z-z,target.x-x):a;
    this.shots.push({x,y:startY,z,vx:Math.cos(aim)*Math.cos(pitch)*speed,vz:Math.sin(aim)*Math.cos(pitch)*speed,
      vy:Math.sin(pitch)*speed,damage:stats.damage*(Math.random()<this.model.attributes().crit?1.7:1),pierce:stats.pierce||1,
      hit:new Set(),age:0,kind,range:stats.range||22,speed,distance:0,target:kind==='ghostShot'?target:null,blade});
  }

  throwBomb(target,skill,kind,bonus={damage:0,radius:0}) {
    if(this.bottles.length>=16)return;
    const p=this.view.camera.position,flight=Math.max(.65,Math.min(1.35,Math.hypot(target.x-p.x,target.z-p.z)/18));
    const x=target.x+(target.vx||0)*flight*.6,z=target.z+(target.vz||0)*flight*.6,y=p.y-.25;
    this.bottles.push({x:p.x,y,z:p.z,vx:(x-p.x)/flight,vz:(z-p.z)/flight,vy:(.18-y)/flight+9.81*flight/2,
      gravity:9.81,age:0,kind,damage:(skill.damage+bonus.damage)*(Math.random()<this.model.attributes().crit?1.7:1),radius:(skill.radius||3.5)+bonus.radius,duration:skill.duration||0});
  }
  detonate(bottle) {
    const effect={...bottle,y:.08,age:0};
    if(bottle.duration){if(this.fires.length<12)this.fires.push(effect);this.view.audio.play('glass',.4);}
    else {
      this.pulses.push(effect);
      for(const enemy of [...this.model.enemies]) {
        const distance=Math.hypot(enemy.x-bottle.x,enemy.z-bottle.z);
        if(distance>bottle.radius||enemy.y>bottle.radius)continue;
        // Walls protect targets from the blast; damage tapers at its edge.
        if(obstacleHit({x:bottle.x,y:.5,z:bottle.z},{...enemyShape(enemy).center},this.game.colliders)!==null)continue;
        this.damage(enemy,bottle.damage*(1-.55*distance/bottle.radius),7);
      }
      this.view.audio.shotgun();
    }
  }
  update(dt) {
    const m=this.model,a=m.abilities,stats=m.attributes(),p=this.view.camera.position;
    for(const key of Object.keys(this.clocks)) this.clocks[key]-=dt;
    this.primaryClock-=dt;
    const ready=(id,interval)=>{if((this.clocks[id]||0)>0)return false;this.clocks[id]=interval;return true;};
    for(const pending of [...this.pending]){
      pending.delay-=dt;if(pending.delay>0)continue;
      this.pending.splice(this.pending.indexOf(pending),1);this.emitAttack(pending);
    }
    const pistolStyle=CHAMPION_CARD_STYLE[m.champion]?.pistol||'sidearm';
    if(['shotgun','revolver','rifle','dualRevolver'].includes(m.hero.primary)&&this.primaryClock<=0){
      const target=this.closest(stats.range,true);
      if(target){
        const dual=pistolStyle==='dualUpgrade',pistol=dual&&a.pistol?abilityStats('pistol',a.pistol):null;
        const attack={primary:true,target,mode:m.hero.primary==='shotgun'?'shotgun':dual?'dual':'bullet',
          kind:m.hero.primary==='rifle'?'rifle':'primary',stats:{damage:stats.damage+(pistol?pistol.damage*.35:0),range:stats.range}};
        this.queueAttack(attack);
        this.primaryClock=Math.max(this.burstDelay(attack)*this.extraShots()+(dual ? .23 : .1),m.hero.cooldown/(stats.attack*(pistol?1+.08*a.pistol:1)));
      }
    }
    for(const id of ['pistol','ghostShot','returningBlade','lunarReturn']){
      if(!a[id]||(id==='returningBlade'&&a.lunarReturn)||(id==='pistol'&&pistolStyle==='dualUpgrade'))continue;
      const skill=this.skillStats(id),frontOnly=id==='pistol'&&pistolStyle==='primary',target=this.closest(skill.range,frontOnly);
      if(target&&ready(id,skill.cooldown/stats.attack)){
        this.queueAttack({mode:'bullet',kind:id,target,frontOnly,animation:id==='pistol'?pistolStyle:null,
          stats:{...skill,pierce:['returningBlade','lunarReturn'].includes(id)?999:skill.pierce}});
      }
    }
    for(const id of ['molotov','pirateBomb']){
      if(!a[id]&&!(id==='molotov'&&a.inferno))continue;
      const skill=this.skillStats(id,Math.max(1,a[id])),target=this.closest(skill.range);
      if(!target||!ready(id,skill.cooldown/stats.attack))continue;
      const bonus=id==='molotov'&&a.inferno?abilityStats('inferno',a.inferno):{damage:0,radius:0};
      this.queueAttack({mode:'bomb',kind:id,target,stats:skill,bonus});
    }
    for(const bottle of [...this.bottles]){
      const old={x:bottle.x,y:bottle.y,z:bottle.z};bottle.age+=dt;
      bottle.x+=bottle.vx*dt;bottle.z+=bottle.vz*dt;bottle.y+=bottle.vy*dt-.5*bottle.gravity*dt*dt;bottle.vy-=bottle.gravity*dt;
      const wall=obstacleHit(old,bottle,this.game.colliders,.12);
      if(wall!==null){bottle.x=old.x+(bottle.x-old.x)*Math.max(0,wall-.01);bottle.z=old.z+(bottle.z-old.z)*Math.max(0,wall-.01);}
      if(bottle.y>.18&&wall===null&&bottle.age<3)continue;
      this.detonate(bottle);this.bottles.splice(this.bottles.indexOf(bottle),1);
    }
    for(const fire of this.fires){fire.age+=dt;for(const enemy of [...m.enemies])if(Math.hypot(enemy.x-fire.x,enemy.z-fire.z)<=fire.radius)this.damage(enemy,fire.damage*dt);}
    this.fires=this.fires.filter(fire=>fire.age<fire.duration);
    if(a.requiem){const skill=this.skillStats('requiem');if(ready('requiem',skill.cooldown/stats.attack)){
      this.pulses.push({x:p.x,z:p.z,radius:skill.radius,age:0});for(const enemy of [...m.enemies])if(Math.hypot(enemy.x-p.x,enemy.z-p.z)<=skill.radius)this.damage(enemy,skill.damage,8);
    }}
    for(const id of ['silverRain','boneStorm']){
      if(!a[id]&&!(id==='silverRain'&&a.silverStorm))continue;
      const skill=this.skillStats(id,Math.max(1,a[id])),bonus=id==='silverRain'&&a.silverStorm?abilityStats('silverStorm',a.silverStorm):{count:0,damage:0};
      if(ready(id,skill.cooldown/stats.attack))this.queueAttack({mode:'radial',kind:id,stats:{...skill,count:skill.count+bonus.count,damage:skill.damage+bonus.damage}});
    }
    if(a.horseshoe){const skill=this.skillStats('horseshoe');for(const enemy of [...m.enemies]){
      if(m.visualTime<(enemy.orbitHitAt||0))continue;
      for(let i=0;i<skill.count;i++){const angle=m.visualTime*2.7+i*Math.PI*2/skill.count;
        if(Math.hypot(enemy.x-p.x-Math.cos(angle)*skill.radius,enemy.z-p.z-Math.sin(angle)*skill.radius)<.8){enemy.orbitHitAt=m.visualTime+.45;this.damage(enemy,skill.damage);break;}}
    }}
    if(a.lantern||a.inferno){const skill=this.skillStats('lantern',Math.max(1,a.lantern));for(const enemy of [...m.enemies])if(Math.hypot(enemy.x-p.x,enemy.z-p.z)<=skill.radius)this.damage(enemy,(skill.damage+4*a.inferno)*dt);}
    for(const shot of this.shots){
      const old={x:shot.x,y:shot.y,z:shot.z};shot.age+=dt;
      if(shot.blade&&shot.distance>=shot.range){
        if(!shot.returning){shot.returning=true;shot.hit.clear();}
        const dx=p.x-shot.x,dy=p.y-.18-shot.y,dz=p.z-shot.z,d=Math.hypot(dx,dy,dz)||1,blend=1-Math.exp(-dt*8);
        shot.vx+=(dx/d*23-shot.vx)*blend;shot.vz+=(dz/d*23-shot.vz)*blend;shot.vy+=(dy/d*23-shot.vy)*blend;if(d<.8)shot.pierce=0;
      }else if(shot.target&&shot.target.hp>0){
        const aim=enemyShape(shot.target).center,dx=aim.x-shot.x,dy=aim.y-shot.y,dz=aim.z-shot.z,d=Math.hypot(dx,dy,dz)||1,blend=1-Math.exp(-dt*2.5);
        shot.vx+=(dx/d*shot.speed-shot.vx)*blend;shot.vy+=(dy/d*shot.speed-shot.vy)*blend;shot.vz+=(dz/d*shot.speed-shot.vz)*blend;
      }
      shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.z+=shot.vz*dt;
      shot.distance+=Math.hypot(shot.x-old.x,shot.y-old.y,shot.z-old.z);
      const wall=obstacleHit(old,shot,this.game.colliders,shot.blade ? .2 : .04);
      const hits=[];
      for(const enemy of m.enemies){
        if(shot.hit.has(enemy))continue;
        const t=enemyHit(old,shot,enemy,shot.blade ? .2 : .04);if(t!==null&&(wall===null||t<wall))hits.push({enemy,t});
      }
      hits.sort((a,b)=>a.t-b.t);
      for(const {enemy} of hits){
        const falloff=shot.kind==='shotgun'?Math.max(.35,1-shot.distance/shot.range*.65):1;
        shot.hit.add(enemy);this.damage(enemy,shot.damage*falloff,shot.kind==='shotgun'?2:0);shot.pierce--;if(shot.pierce<=0)break;
      }
      if(wall!==null){this.impacts.push({x:old.x+(shot.x-old.x)*wall,y:old.y+(shot.y-old.y)*wall,z:old.z+(shot.z-old.z)*wall,age:0});shot.pierce=0;}
      if(shot.y<.03)shot.pierce=0;
    }
    this.shots=this.shots.filter(shot=>shot.pierce>0&&shot.age<(shot.blade?Math.min(6,shot.range/shot.speed+3):shot.range/shot.speed));
    this.pulses=this.pulses.filter(effect=>(effect.age+=dt)<.55);
    this.impacts=this.impacts.filter(effect=>(effect.age+=dt)<.18);
  }
}
