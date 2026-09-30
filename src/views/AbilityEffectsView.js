import * as THREE from 'three';
import { abilityStats } from '../config/abilityConfig.js';

export class AbilityEffectsView {
  constructor(scene) {
    this.group=new THREE.Group();scene.add(this.group);this.dummy=new THREE.Object3D();this.color=new THREE.Color();
    const pool=(geometry,color,count)=>{
      const mesh=new THREE.InstancedMesh(geometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85}),count);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.count=0;this.group.add(mesh);return mesh;
    };
    this.shots=pool(new THREE.BoxGeometry(.1,.1,.5),'#fff1b3',160);
    this.bottles=pool(new THREE.CylinderGeometry(.1,.14,.42,6),'#779b53',16);
    this.necks=pool(new THREE.CylinderGeometry(.045,.045,.18,5),'#aac373',16);
    this.ground=pool(new THREE.CircleGeometry(1,16),'#b64b20',12);
    this.flames=pool(new THREE.ConeGeometry(.22,1,5),'#ff973e',144);
    this.shoes=pool(new THREE.TorusGeometry(.3,.065,4,10,Math.PI*1.6),'#d6ae7f',6);
    this.rings=pool(new THREE.TorusGeometry(1,.025,3,24),'#b9dfc1',12);
    this.hits=pool(new THREE.OctahedronGeometry(.18),'#fff3c4',64);
  }
  put(mesh,index,x,y,z,sx=1,sy=sx,sz=sx,rx=0,ry=0,rz=0,color=null) {
    this.dummy.position.set(x,y,z);this.dummy.scale.set(sx,sy,sz);this.dummy.rotation.set(rx,ry,rz);this.dummy.updateMatrix();
    mesh.setMatrixAt(index,this.dummy.matrix);if(color)mesh.setColorAt(index,this.color.set(color));
  }
  update(system,model,player) {
    this.shots.count=system.shots.length;
    system.shots.forEach((shot,i)=>{
      const blade=['returningBlade','lunarReturn'].includes(shot.kind);
      this.put(this.shots,i,shot.x,shot.y,shot.z,blade?4:1,1,blade?2:1,0,blade?shot.age*18:Math.atan2(shot.vx,shot.vz),0,
        shot.kind==='ghostShot'?'#a4ffdc':shot.kind==='boneStorm'?'#d6cfb5':shot.kind==='lunarReturn'?'#91bfff':'#fff1b3');
    });
    this.bottles.count=this.necks.count=Math.min(16,system.bottles.length);
    system.bottles.slice(0,16).forEach((b,i)=>{
      const t=b.age/.65,x=THREE.MathUtils.lerp(b.fromX,b.x,t),z=THREE.MathUtils.lerp(b.fromZ,b.z,t),y=1.2*(1-t)+Math.sin(t*Math.PI)*3.5;
      this.put(this.bottles,i,x,y,z,1,1,1,t*8,0,t*5);this.put(this.necks,i,x,y+.25,z,1,1,1,t*8);
    });
    this.ground.count=system.fires.length;this.flames.count=system.fires.length*12;
    system.fires.forEach((f,i)=>{
      this.put(this.ground,i,f.x,.06,f.z,f.radius,f.radius,1,-Math.PI/2);
      for(let j=0;j<12;j++){const angle=j*Math.PI*2/12,r=f.radius*(.3+(j%3)*.23),h=.65+Math.sin(model.visualTime*12+j)*.3;
        this.put(this.flames,i*12+j,f.x+Math.cos(angle)*r,h/2,f.z+Math.sin(angle)*r,1,h,1,0,angle,Math.sin(model.visualTime*8+j)*.16);}
    });
    const orbit=model.abilities.horseshoe?abilityStats('horseshoe',model.abilities.horseshoe):null;
    this.shoes.count=orbit?.count||0;
    for(let i=0;i<this.shoes.count;i++){const angle=model.visualTime*2.7+i*Math.PI*2/orbit.count;this.put(this.shoes,i,player.x+Math.cos(angle)*orbit.radius,1,player.z+Math.sin(angle)*orbit.radius,1,1,1,Math.PI/2,angle,angle*2);}
    this.rings.count=Math.min(10,system.pulses.length);
    system.pulses.slice(0,10).forEach((e,i)=>{const r=e.radius*e.age/.55;this.put(this.rings,i,e.x,.2,e.z,r,r,r,-Math.PI/2);});
    if(model.abilities.lantern||model.abilities.inferno){const r=abilityStats('lantern',Math.max(1,model.abilities.lantern)).radius;this.put(this.rings,this.rings.count++,player.x,.15,player.z,r,r,r,-Math.PI/2);}
    this.hits.count=Math.min(64,system.impacts.length);system.impacts.slice(0,64).forEach((e,i)=>this.put(this.hits,i,e.x,e.y,e.z,1+e.age*4));
    for(const mesh of [this.shots,this.bottles,this.necks,this.ground,this.flames,this.shoes,this.rings,this.hits]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
  }
}
