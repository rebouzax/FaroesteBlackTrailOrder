import { abilityStats } from '../config/abilityConfig.js';

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
  fire(target,stats,kind='pistol',angle=null) {
    if (this.shots.length>=160) return;
    const p=this.view.camera.position,a=angle??Math.atan2(target.z-p.z,target.x-p.x);
    const distance=target?Math.max(1,Math.hypot(target.x-p.x,target.z-p.z)):15;
    const speed=kind==='ghostShot'?15:['returningBlade','lunarReturn'].includes(kind)?16:25;
    this.shots.push({x:p.x,y:1.35,z:p.z,vx:Math.cos(a)*speed,vz:Math.sin(a)*speed,
      vy:target?((target.y||0)+1-1.35)/(distance/speed):0,damage:stats.damage,pierce:stats.pierce||1,
      hit:new Set(),age:0,kind,range:stats.range||22,speed});
  }
  update(dt) {
    const m=this.model,a=m.abilities,stats=m.attributes(),p=this.view.camera.position;
    for(const key of Object.keys(this.clocks)) this.clocks[key]-=dt;
    this.primaryClock-=dt;
    const ready=(id,interval)=>{if((this.clocks[id]||0)>0)return false;this.clocks[id]=interval;return true;};
    if(m.hero.primary==='shotgun'&&this.primaryClock<=0){
      const target=this.closest(stats.range,true);
      if(target){
        const facing=this.view.getPlanarFacing(),angle=Math.atan2(facing.forwardZ,facing.forwardX);
        const count=m.hero.pellets+Math.min(3,a.doubleShot||0);
        for(let i=0;i<count;i++)this.fire(target,{damage:stats.damage*(Math.random()<stats.crit?1.7:1),range:stats.range},'shotgun',angle+(i-(count-1)/2)*.085);
        this.view.fireShotgun();this.primaryClock=m.hero.cooldown/stats.attack;
      }
    }
    if(m.hero.primary==='revolver'&&this.primaryClock<=0){
      const target=this.closest(stats.range,true);
      if(target){
        const shot={damage:stats.damage*(Math.random()<stats.crit?1.7:1),range:stats.range};
        this.fire(target,shot,'primary');this.view.fireRevolver();
        const angle=Math.atan2(target.z-p.z,target.x-p.x);
        for(let i=0;i<a.doubleShot;i++)this.pending.push({delay:(i+1)*.11,stats:shot,angle});
        this.primaryClock=Math.max(.32,m.hero.cooldown/stats.attack);
      }
    }
    for(const pending of [...this.pending]){
      pending.delay-=dt;if(pending.delay>0)continue;
      this.fire(null,pending.stats,'primary',pending.angle);this.view.fireRevolver();this.pending.splice(this.pending.indexOf(pending),1);
    }
    for(const id of ['pistol','ghostShot','returningBlade','lunarReturn']){
      if(!a[id]||(id==='returningBlade'&&a.lunarReturn))continue;
      const skill=abilityStats(id,a[id]),target=this.closest(skill.range);
      if(target&&ready(id,skill.cooldown/stats.attack)){
        this.fire(target,{...skill,pierce:['returningBlade','lunarReturn'].includes(id)?999:skill.pierce},id);
        if(id==='pistol')this.view.fireAbilityPistol();
      }
    }
    for(const id of ['molotov','pirateBomb']){
      if(!a[id]&&!(id==='molotov'&&a.inferno))continue;
      const skill=abilityStats(id,Math.max(1,a[id])),target=this.closest(skill.range);
      if(!target||!ready(id,skill.cooldown/stats.attack))continue;
      const bonus=id==='molotov'&&a.inferno?abilityStats('inferno',a.inferno):{damage:0,radius:0};
      this.bottles.push({fromX:p.x,fromZ:p.z,x:target.x,z:target.z,age:0,kind:id,damage:skill.damage+bonus.damage,radius:(skill.radius||3.5)+bonus.radius,duration:skill.duration||0});
    }
    for(const bottle of [...this.bottles]){
      bottle.age+=dt;if(bottle.age<.65)continue;
      if(bottle.duration){if(this.fires.length<12)this.fires.push({...bottle,age:0});this.view.audio.play('glass',.4);}
      else{this.pulses.push({...bottle,age:0});for(const enemy of [...m.enemies])if(Math.hypot(enemy.x-bottle.x,enemy.z-bottle.z)<bottle.radius)this.damage(enemy,bottle.damage,7);this.view.audio.play('shot',.7,.65);}
      this.bottles.splice(this.bottles.indexOf(bottle),1);
    }
    for(const fire of this.fires){fire.age+=dt;for(const enemy of [...m.enemies])if(Math.hypot(enemy.x-fire.x,enemy.z-fire.z)<=fire.radius)this.damage(enemy,fire.damage*dt);}
    this.fires=this.fires.filter(fire=>fire.age<fire.duration);
    if(a.requiem){const skill=abilityStats('requiem',a.requiem);if(ready('requiem',skill.cooldown/stats.attack)){
      this.pulses.push({x:p.x,z:p.z,radius:skill.radius,age:0});for(const enemy of [...m.enemies])if(Math.hypot(enemy.x-p.x,enemy.z-p.z)<=skill.radius)this.damage(enemy,skill.damage,8);
    }}
    for(const id of ['silverRain','boneStorm']){
      if(!a[id]&&!(id==='silverRain'&&a.silverStorm))continue;
      const skill=abilityStats(id,Math.max(1,a[id])),bonus=id==='silverRain'&&a.silverStorm?abilityStats('silverStorm',a.silverStorm):{count:0,damage:0};
      if(ready(id,skill.cooldown/stats.attack))for(let i=0,n=Math.min(18,skill.count+bonus.count);i<n;i++)this.fire(null,{damage:skill.damage+bonus.damage},id,i*Math.PI*2/n);
    }
    if(a.horseshoe){const skill=abilityStats('horseshoe',a.horseshoe);for(const enemy of [...m.enemies]){
      if(m.visualTime<(enemy.orbitHitAt||0))continue;
      for(let i=0;i<skill.count;i++){const angle=m.visualTime*2.7+i*Math.PI*2/skill.count;
        if(Math.hypot(enemy.x-p.x-Math.cos(angle)*skill.radius,enemy.z-p.z-Math.sin(angle)*skill.radius)<.8){enemy.orbitHitAt=m.visualTime+.45;this.damage(enemy,skill.damage);break;}}
    }}
    if(a.lantern||a.inferno){const skill=abilityStats('lantern',Math.max(1,a.lantern));for(const enemy of [...m.enemies])if(Math.hypot(enemy.x-p.x,enemy.z-p.z)<=skill.radius)this.damage(enemy,(skill.damage+4*a.inferno)*dt);}
    for(const shot of this.shots){
      const oldX=shot.x,oldZ=shot.z;shot.age+=dt;
      if(['returningBlade','lunarReturn'].includes(shot.kind)&&shot.age>=shot.range/shot.speed){
        if(!shot.returning){shot.returning=true;shot.hit.clear();}
        const dx=p.x-shot.x,dz=p.z-shot.z,d=Math.hypot(dx,dz)||1;shot.vx=dx/d*20;shot.vz=dz/d*20;shot.vy=(1.35-shot.y)/Math.max(.05,d/20);if(d<.7)shot.pierce=0;
      }
      shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.z+=shot.vz*dt;
      const sx=shot.x-oldX,sz=shot.z-oldZ,length=sx*sx+sz*sz||1;
      for(const enemy of [...m.enemies]){
        if(shot.hit.has(enemy))continue;
        const t=Math.max(0,Math.min(1,((enemy.x-oldX)*sx+(enemy.z-oldZ)*sz)/length));
        if(Math.hypot(enemy.x-oldX-t*sx,enemy.z-oldZ-t*sz)>(enemy.boss?1.4:.7))continue;
        shot.hit.add(enemy);this.damage(enemy,shot.damage);shot.pierce--;if(!shot.pierce)break;
      }
    }
    this.shots=this.shots.filter(shot=>shot.pierce>0&&shot.age<(['returningBlade','lunarReturn'].includes(shot.kind)?3:shot.range/shot.speed));
    this.pulses=this.pulses.filter(effect=>(effect.age+=dt)<.55);
    this.impacts=this.impacts.filter(effect=>(effect.age+=dt)<.18);
  }
}
