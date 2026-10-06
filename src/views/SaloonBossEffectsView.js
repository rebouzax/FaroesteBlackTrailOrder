import * as THREE from 'three';

export class SaloonBossEffectsView {
  constructor(scene){
    this.group=new THREE.Group();scene.add(this.group);this.dummy=new THREE.Object3D();
    const pool=(geometry,color,count)=>{
      const mesh=new THREE.InstancedMesh(geometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide}),count);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.count=0;this.group.add(mesh);return mesh;
    };
    this.rings=pool(new THREE.TorusGeometry(1,.035,3,24),'#ff7240',32);
    this.flames=pool(new THREE.ConeGeometry(.25,1,5),'#ff992f',204);
    this.bottles=pool(new THREE.CylinderGeometry(.12,.16,.5,6),'#678841',12);
    this.wicks=pool(new THREE.OctahedronGeometry(.15),'#ffd264',12);
  }
  put(mesh,x,y,z,sx=1,sy=sx,sz=sx,rx=0,ry=0,rz=0){
    if(mesh.count>=mesh.instanceMatrix.count)return;
    this.dummy.position.set(x,y,z);this.dummy.scale.set(sx,sy,sz);this.dummy.rotation.set(rx,ry,rz);this.dummy.updateMatrix();mesh.setMatrixAt(mesh.count++,this.dummy.matrix);
  }
  update(system,model){
    this.group.visible=model.stage==='saloon';
    for(const mesh of [this.rings,this.flames,this.bottles,this.wicks])mesh.count=0;
    if(!this.group.visible)return;
    for(const w of system.warnings)this.put(this.rings,w.x,w.y+.07,w.z,w.radius,w.radius,w.radius,-Math.PI/2,0,w.age);
    const zones=[...system.fires,...model.enemies.filter(e=>e.fireAura>0).map(e=>({x:e.x,y:e.floor,z:e.z,radius:4.2}))];
    for(const f of zones){
      this.put(this.rings,f.x,f.y+.08,f.z,f.radius,f.radius,f.radius,-Math.PI/2);
      for(let i=0;i<12;i++){const a=i/12*Math.PI*2,r=f.radius*(.45+i%3*.22),h=.75+Math.sin(system.time*13+i)*.28;
        this.put(this.flames,f.x+Math.cos(a)*r,f.y+h/2,f.z+Math.sin(a)*r,1,h,1,0,a,Math.sin(system.time*8+i)*.12);}
    }
    for(const b of system.bombs){this.put(this.bottles,b.x,b.y,b.z,1,1,1,b.age*7,0,b.age*4);this.put(this.wicks,b.x,b.y+.32,b.z);}
    for(const mesh of [this.rings,this.flames,this.bottles,this.wicks])mesh.instanceMatrix.needsUpdate=true;
  }
}
