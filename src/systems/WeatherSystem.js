export class WeatherSystem {
  constructor(game) {
    this.game=game;this.reset();
  }
  reset(){this.state={kind:'clear',age:0,duration:0,strikes:[],tornado:null};this.clock=50;this.cycle=0;this.boltClock=3;}
  update(dt) {
    const g=this.game,m=g.model,w=this.state;w.age+=dt;this.clock-=dt;
    if(this.clock<=0&&w.kind==='clear'){
      w.kind=['rain','sand','tornado'][this.cycle++%3];w.age=0;w.duration=38+Math.random()*18;this.boltClock=2;
      if(w.kind==='tornado'){
        const spot=g.findEventSpot(18,34);if(spot)w.tornado={...spot,age:0,angle:Math.random()*6.28,damageClock:0};
      }
      g.view.showPickupMessage(w.kind==='rain'?'CHUVA · CUIDADO COM OS RAIOS':w.kind==='sand'?'TEMPESTADE DE AREIA':'TORNADO · MANTENHA DISTÂNCIA');
    }
    if(w.kind!=='clear'&&w.age>=w.duration){w.kind='clear';w.age=0;w.tornado=null;this.clock=55+Math.random()*40;}
    if(w.kind==='rain'){
      this.boltClock-=dt;
      if(this.boltClock<=0){
        this.boltClock=5+Math.random()*5;
        // Telegraph random map impacts, including the area where combat happens.
        const target=Math.random()<.25?m.enemies[Math.floor(Math.random()*m.enemies.length)]:null;
        let spot=target?{x:target.x,z:target.z}:null;
        if(!spot&&Math.random()<.45)spot=g.findEventSpot(0,55);
        if(!spot)for(let i=0;i<30;i++){
          const bounds=g.view.currentStage==='ghostTown'?{x:260,z:270}:g.view.currentStage==='mine'?{x:38,z:76}:{x:235,z:235};
          const x=(Math.random()*2-1)*bounds.x,z=(Math.random()*2-1)*bounds.z;
          if(g.spotClear(x,z,1)){spot={x,z};break;}
        }
        if(spot)w.strikes.push({...spot,age:0,fired:false});
      }
    }
    for(const strike of w.strikes){
      strike.age+=dt;
      if(strike.age<1.4||strike.fired)continue;
      strike.fired=true;
      for(const enemy of [...m.enemies])if(Math.hypot(enemy.x-strike.x,enemy.z-strike.z)<4.2)g.abilitySystem.damage(enemy,85,5);
      if(Math.hypot(g.view.camera.position.x-strike.x,g.view.camera.position.z-strike.z)<4.2&&g.invulnerable===0)g.hurt(25);
      g.view.audio.play('shot',.32,.25);
    }
    w.strikes=w.strikes.filter(s=>s.age<1.75);
    if(w.tornado){
      const t=w.tornado;t.age+=dt;t.damageClock-=dt;
      const x=t.x+Math.cos(t.angle+t.age*.18)*dt*1.8,z=t.z+Math.sin(t.angle+t.age*.18)*dt*1.8;
      if(g.spotClear(x,z,2)){t.x=x;t.z=z;}
      const pull=(actor,player=false)=>{
        const dx=t.x-actor.x,dz=t.z-actor.z,d=Math.hypot(dx,dz);if(d>.1&&d<11){
          const speed=(1-d/11)*8*(actor.boss ? .35 : 1),mx=dx/d*speed*dt,mz=dz/d*speed*dt;
          if(player)g.displacePlayer(mx,mz);else {if(g.spotClear(actor.x+mx,actor.z,.5))actor.x+=mx;if(g.spotClear(actor.x,actor.z+mz,.5))actor.z+=mz;}
        }
        if(d<2.5&&t.damageClock<=0){if(player){if(g.invulnerable===0)g.hurt(8);}else g.abilitySystem.damage(actor,12);}
      };
      pull(g.view.camera.position,true);for(const enemy of [...m.enemies])pull(enemy);
      if(t.damageClock<=0)t.damageClock=1;
    }
  }
}
