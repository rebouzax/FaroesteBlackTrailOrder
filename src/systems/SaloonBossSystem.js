import { obstacleHit, segmentSphere } from './ProjectilePhysics.js';

// Simulation only. The effects view reads these bounded lists without dealing damage.
export class SaloonBossSystem {
  constructor(game) {this.game=game;this.reset();}
  reset(){this.bombs=[];this.fires=[];this.warnings=[];this.time=0;}
  floor(x,z,previous=0){return this.game.view.floorAt(x,z,previous);}
  summon(enemy,count=4){
    const g=this.game;
    for(let i=0;i<count&&g.model.enemies.length<48;i++)g.spawnEnemy('skeleton',null,{near:enemy,min:3,max:6,floor:enemy.floor});
  }
  aim(){const p=this.game.view.camera.position;return {x:p.x,y:p.y-1.68,z:p.z};}
  warn(target,radius,delay){const w={...target,radius,age:0,delay};this.warnings.push(w);return w;}
  lob(enemy,target){
    if(this.bombs.length>=12)return;
    const y=enemy.y+1.6,flight=Math.max(.8,Math.min(1.6,Math.hypot(target.x-enemy.x,target.z-enemy.z)/13));
    this.bombs.push({x:enemy.x,y,z:enemy.z,vx:(target.x-enemy.x)/flight,vz:(target.z-enemy.z)/flight,
      vy:(target.y+.15-y)/flight+9.81*flight/2,age:0,floor:target.y,damage:enemy.damage*.65,radius:3.2});
    this.game.view.attackEnemy(enemy.object);
  }
  fireball(enemy){
    const g=this.game,p=g.view.camera.position,y=enemy.y+1.4,dx=p.x-enemy.x,dy=p.y-.4-y,dz=p.z-enemy.z,d=Math.hypot(dx,dy,dz)||1;
    if(g.model.projectiles.length>=64)return;
    const object=g.view.addProjectile(enemy.x,y,enemy.z,'fireball');
    g.model.projectiles.push({object,x:enemy.x,y,z:enemy.z,vx:dx/d*12,vy:dy/d*12,vz:dz/d*12,age:0,damage:enemy.damage*.75,kind:'fireball'});
    g.view.attackEnemy(enemy.object);
  }
  updateEnemy(enemy,dt){
    if(!enemy.boss||this.game.model.stage!=='saloon')return false;
    if(enemy.type==='saloonSkeleton'){
      enemy.shotClock-=dt;
      if(enemy.cast){enemy.cast.left-=dt;if(enemy.cast.left<=0){this.lob(enemy,enemy.cast.target);enemy.cast=null;}}
      else if(enemy.shotClock<=0){
        // Snapshot at windup: the bottle never retargets a moving player.
        const target=this.aim();this.warn(target,3.2,.85);enemy.cast={target,left:.85};enemy.shotClock=4.8;
      }
      return false;
    }
    if(enemy.type!=='damaMalvina')return false;
    const g=this.game,p=g.view.camera.position;
    const ai=enemy.ai||=( {state:'flank',age:0,attack:0,clock:2.5,side:Math.random()<.5?-1:1,
      lastHp:enemy.hp,damage:0,window:0,retreatCooldown:0,target:null} );
    ai.age+=dt;ai.window+=dt;ai.retreatCooldown=Math.max(0,ai.retreatCooldown-dt);
    ai.damage+=Math.max(0,ai.lastHp-enemy.hp);ai.lastHp=enemy.hp;
    if(ai.window>4){ai.window=0;ai.damage*=.35;}
    if(ai.damage>enemy.maxHp*.12&&ai.retreatCooldown===0){
      ai.state='retreat';ai.age=0;ai.retreatCooldown=14;ai.damage=0;ai.cast=null;
      // Prefer a distant hiding place whose scenery blocks the player's direct aim.
      ai.target=[...g.view.saloonStage.cover].sort((a,b)=>{
        const score=c=>Math.hypot(c.x-p.x,c.z-p.z)+(obstacleHit(p,{x:c.x,y:1.6,z:c.z},g.colliders)!==null?12:0);
        return score(b)-score(a);
      })[0];
      this.summon(enemy,5);
    }
    if(ai.state==='retreat'){
      if(ai.age>6||Math.hypot(enemy.x-ai.target.x,enemy.z-ai.target.z)<1.2){ai.state='dance';ai.age=0;g.view.danceEnemy(enemy.object);}
    }else if(ai.state==='dance'){
      if(ai.age>2.2){ai.state='flank';ai.age=0;ai.side*=-1;ai.clock=.5;}
    }else{
      // Move around the player's flank, rather than steering into melee range.
      const a=Math.atan2(enemy.z-p.z,enemy.x-p.x)+ai.side*.85;
      const raw={x:p.x+Math.cos(a)*9,z:p.z+Math.sin(a)*9};
      ai.target={x:Math.max(-21,Math.min(21,raw.x)),z:Math.max(-26,Math.min(26,raw.z))};
      ai.clock-=dt;
      if(ai.cast){
        ai.cast.left-=dt;
        if(ai.cast.left<=0){
          const attack=ai.cast.attack;ai.cast=null;
          if(attack===0)this.fireball(enemy);
          if(attack===1){this.summon(enemy,4);g.view.attackEnemy(enemy.object);}
          if(attack===2){enemy.fireAura=5;g.view.danceEnemy(enemy.object);ai.state='dance';ai.age=0;}
          ai.clock=3.6;
        }
      }else if(ai.clock<=0){
        const attack=ai.attack++%3;ai.cast={left:.8,attack};
        if(attack===2)this.warn({x:enemy.x,y:enemy.floor,z:enemy.z},4.2,.8);
        g.view.attackEnemy(enemy.object);
      }
      if(ai.age>9&&!ai.cast){ai.state='dance';ai.age=0;g.view.danceEnemy(enemy.object);}
    }
    if(ai.state!=='dance'&&!ai.cast&&ai.target){
      const nav=g.view.saloonStage.route(enemy,{...ai.target,y:ai.state==='retreat'?(ai.target.floor||0)+1.68:p.y});
      let dx=nav.x-enemy.x,dz=nav.z-enemy.z,d=Math.hypot(dx,dz)||1;
      if(d>.6){const steering=g.crowd.steer(enemy,g.model.enemies,dx,dz);g.crowd.move(enemy,steering.x*enemy.speed*dt,steering.z*enemy.speed*dt);}
    }
    enemy.fireAura=Math.max(0,(enemy.fireAura||0)-dt);
    if(enemy.fireAura>0&&Math.hypot(enemy.x-p.x,enemy.z-p.z)<4.2&&Math.abs(enemy.floor-(p.y-1.68))<1.5&&g.invulnerable===0&&
      obstacleHit({x:enemy.x,y:enemy.y+1,z:enemy.z},p,g.colliders)===null)g.hurt(enemy.damage*.5);
    return true;
  }
  update(dt){
    if(this.game.model.stage!=='saloon')return;
    const g=this.game,p=g.view.camera.position;this.time+=dt;
    this.warnings=this.warnings.filter(w=>(w.age+=dt)<w.delay);
    for(const b of [...this.bombs]){
      const old={x:b.x,y:b.y,z:b.z};b.age+=dt;b.x+=b.vx*dt;b.z+=b.vz*dt;b.y+=b.vy*dt-4.905*dt*dt;b.vy-=9.81*dt;
      const wall=obstacleHit(old,b,g.colliders,.12),hit=segmentSphere(old,b,{x:p.x,y:p.y-.4,z:p.z},.65);
      if(wall!==null){const t=Math.max(0,wall-.01);b.x=old.x+(b.x-old.x)*t;b.z=old.z+(b.z-old.z)*t;b.y=old.y+(b.y-old.y)*t;}
      const floor=g.view.projectileFloor(b.x,b.z,b.y);
      if(b.y<=floor+.15||wall!==null||hit!==null||b.age>3){
        if(hit!==null&&(wall===null||hit<wall)&&g.invulnerable===0)g.hurt(b.damage);
        if(this.fires.length<16)this.fires.push({x:b.x,y:floor,z:b.z,radius:b.radius,age:0,duration:4.5,damage:b.damage});
        g.view.audio.play('glass',.4);this.bombs.splice(this.bombs.indexOf(b),1);
      }
    }
    for(const f of this.fires){
      f.age+=dt;
      if(Math.hypot(p.x-f.x,p.z-f.z)<f.radius&&Math.abs(p.y-1.68-f.y)<1.5&&g.invulnerable===0&&
        obstacleHit({x:f.x,y:f.y+.4,z:f.z},p,g.colliders)===null)g.hurt(f.damage);
    }
    this.fires=this.fires.filter(f=>f.age<f.duration);
  }
}
