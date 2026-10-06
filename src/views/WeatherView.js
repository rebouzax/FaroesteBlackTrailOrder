import * as THREE from 'three';
export class WeatherView {
  constructor(scene) {
    this.group=new THREE.Group();scene.add(this.group);this.dummy=new THREE.Object3D();
    const pool=(geo,color,count)=>{const mesh=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.5,depthWrite:false}),count);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.count=0;mesh.frustumCulled=false;this.group.add(mesh);return mesh;};
    this.rain=pool(new THREE.BoxGeometry(.025,.8,.025),'#a5bfd6',420);
    this.sand=pool(new THREE.OctahedronGeometry(.1,0),'#b69360',300);
    this.vortex=pool(new THREE.OctahedronGeometry(.25,0),'#897658',160);
    this.funnel=new THREE.Mesh(new THREE.CylinderGeometry(3.5,.45,12,12,5,true),new THREE.MeshBasicMaterial({color:'#968267',transparent:true,opacity:.14,depthWrite:false,side:THREE.DoubleSide}));this.group.add(this.funnel);this.funnel.visible=false;
    this.warnings=pool(new THREE.TorusGeometry(4.2,.07,3,24),'#ffe078',8);
    this.bolts=pool(new THREE.CylinderGeometry(.07,.15,1,5),'#d5eaff',8);
    this.flash=new THREE.PointLight('#b5d9ff',0,90,1);this.group.add(this.flash);
  }
  put(mesh,i,x,y,z,scale=1,rx=0,rz=0){this.dummy.position.set(x,y,z);this.dummy.rotation.set(rx,i*.4,rz);this.dummy.scale.setScalar(scale);this.dummy.updateMatrix();mesh.setMatrixAt(i,this.dummy.matrix);}
  update(w,player,time,stage) {
    this.group.visible=['desert','ghostTown'].includes(stage);
    if(!this.group.visible){this.flash.intensity=0;return;}
    this.rain.count=w.kind==='rain'?420:0;this.sand.count=w.kind==='sand'?300:0;
    const roof=22;
    for(let i=0;i<this.rain.count;i++)this.put(this.rain,i,player.x+((i*17.3+time*2)%60)-30,roof-((time*18+i*.43)%roof),player.z+((i*7.7)%60)-30,1,0,-.12);
    for(let i=0;i<this.sand.count;i++)this.put(this.sand,i,player.x+((i*13.7+time*12)%64)-32,.15+((i*1.31+time*.7)%8),player.z+((i*9.1+time*3)%64)-32,.5+(i%4)*.4,0,time+i);
    this.vortex.count=w.tornado?160:0;
    this.funnel.visible=Boolean(w.tornado);
    if(w.tornado){
      const height=12;this.funnel.position.set(w.tornado.x,height/2,w.tornado.z);this.funnel.scale.set(1,height/12,1);this.funnel.rotation.y=time*2;
      for(let i=0;i<160;i++){const h=i/160*height,angle=time*8+i*2.399,r=.45+h*.22;this.put(this.vortex,i,w.tornado.x+Math.cos(angle)*r,h,w.tornado.z+Math.sin(angle)*r,.6+h*.1,time,angle);}
    }
    this.warnings.count=0;this.bolts.count=0;this.flash.intensity=0;
    for(const s of w.strikes.slice(0,8)){
      if(!s.fired)this.put(this.warnings,this.warnings.count++,s.x,.075,s.z,.6+s.age/1.4*.4,Math.PI/2);
      else {
        const i=this.bolts.count++;this.put(this.bolts,i,s.x,roof/2,s.z);this.dummy.scale.set(.7,roof, .7);this.dummy.updateMatrix();this.bolts.setMatrixAt(i,this.dummy.matrix);
        this.flash.position.set(s.x,Math.min(roof,8),s.z);this.flash.intensity=55*Math.max(0,1-(s.age-1.4)/.35);
      }
    }
    for(const mesh of [this.rain,this.sand,this.vortex,this.warnings,this.bolts])mesh.instanceMatrix.needsUpdate=true;
  }
}
