// Horizontal body colliders keep a horde dense without allowing shared centers.
// Three short solver passes are sufficient for the bounded 48-enemy population.
export class EnemySeparation {
  constructor(clear) { this.clear=clear;this.nextId=1; }
  register(enemy,radius) { enemy.bodyRadius=radius;enemy.crowdId=this.nextId++; }
  steer(enemy,enemies,dx,dz) {
    const length=Math.hypot(dx,dz)||1;let x=dx/length,z=dz/length;
    for(const other of enemies){
      if(other===enemy||other.hp<=0||Math.abs((enemy.floor||0)-(other.floor||0))>1.5)continue;
      const ox=enemy.x-other.x,oz=enemy.z-other.z,d=Math.hypot(ox,oz),reach=enemy.bodyRadius+other.bodyRadius+.75;
      if(d<.001||d>=reach)continue;
      const force=(1-d/reach)*.8;x+=ox/d*force;z+=oz/d*force;
    }
    const total=Math.hypot(x,z)||1;return {x:x/total,z:z/total};
  }
  move(enemy,dx,dz) {
    // Flying creatures also keep their footprint clear of the scene geometry.
    const radius=enemy.bodyRadius;
    if(this.clear(enemy.x+dx,enemy.z,radius,enemy))enemy.x+=dx;
    if(this.clear(enemy.x,enemy.z+dz,radius,enemy))enemy.z+=dz;
  }
  resolve(enemies,player) {
    for(let pass=0;pass<4;pass++){
      for(let i=0;i<enemies.length;i++)for(let j=i+1;j<enemies.length;j++){
        const a=enemies[i],b=enemies[j];let dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);
        if(Math.abs((a.floor||0)-(b.floor||0))>1.5)continue;
        const gap=a.bodyRadius+b.bodyRadius+.04;if(d>=gap)continue;
        if(d<.0001){const angle=((a.crowdId*13+b.crowdId*7)%31)/31*Math.PI*2;dx=Math.cos(angle);dz=Math.sin(angle);d=1;}
        else {dx/=d;dz/=d;}
        const overlap=gap-Math.hypot(b.x-a.x,b.z-a.z),wa=a.boss ? .25 : 1,wb=b.boss ? .25 : 1;
        this.move(a,-dx*overlap*wa/(wa+wb),-dz*overlap*wa/(wa+wb));
        this.move(b,dx*overlap*wb/(wa+wb),dz*overlap*wb/(wa+wb));
        // If scenery blocks one body, let the other absorb the remaining correction.
        const left=gap-Math.hypot(b.x-a.x,b.z-a.z);
        if(left>.01){this.move(a,-dx*left*.5,-dz*left*.5);this.move(b,dx*left*.5,dz*left*.5);}
      }
      for(const enemy of enemies){
        if(Math.abs((enemy.floor||0)-(player.y-1.68))>1.5)continue;
        const dx=enemy.x-player.x,dz=enemy.z-player.z,d=Math.hypot(dx,dz),gap=enemy.bodyRadius+.48;
        if(d<gap){const angle=enemy.crowdId*2.39996,ux=d>.001?dx/d:Math.cos(angle),uz=d>.001?dz/d:Math.sin(angle);
          this.move(enemy,ux*(gap-d),uz*(gap-d));}
      }
    }
  }
}
