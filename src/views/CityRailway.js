import * as THREE from 'three';

// Parked rolling stock and a weathered depot on the city's western edge.
// Repeated wooden and iron parts share instanced draws.
export class CityRailway {
  constructor(view,parent,colliders){
    this.group=new THREE.Group();this.group.name='Estação abandonada';parent.add(this.group);
    const iron=view.mat('#222632'),rust=view.mat('#59453b'),wood=view.mat('#493c34'),trim=view.mat('#777065'),glass=view.mat('#111a2b');
    const batches=new Map(),dummy=new THREE.Object3D();
    const put=(shape,material,x,y,z,sx,sy,sz,rx=0,rz=0)=>{
      const key=`${shape}:${material.uuid}`;if(!batches.has(key))batches.set(key,{shape,material,matrices:[]});
      dummy.position.set(x,y,z);dummy.rotation.set(rx,0,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();batches.get(key).matrices.push(dummy.matrix.clone());
    };
    const box=(w,h,d,x,y,z,material)=>put('box',material,x,y,z,w,h,d);
    const cylinder=(r,h,x,y,z,material,rx=0,rz=0)=>put('cylinder',material,x,y,z,r,h,r,rx,rz);
    const solid=(x,z,w,d,h)=>colliders.push({kind:'box',minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,minY:0,maxY:h});
    const railX=-218;
    const ballast=new THREE.Mesh(new THREE.PlaneGeometry(7.5,542),view.mat('#403d3d'));ballast.rotation.x=-Math.PI/2;ballast.position.set(railX,.025,0);this.group.add(ballast);
    for(const side of [-1,1])box(.14,.16,538,railX+side*1.35,.17,0,iron);
    for(let z=-266;z<=266;z+=2.2)box(4.4,.12,.3,railX,.08,z,wood);
    const wheels=(z,length,count=4)=>{
      for(let i=0;i<count;i++)for(const side of [-1,1]){
        const wz=z+(i/(count-1)-.5)*(length-3);
        cylinder(.92,.3,railX+side*1.62,1.05,wz,iron,0,Math.PI/2);
        cylinder(.23,.34,railX+side*1.64,1.05,wz,trim,0,Math.PI/2);
      }
      for(const side of [-1,1])box(.13,.16,length-2,railX+side*1.82,1.06,z,rust);
    };
    // Locomotive faces toward the northern end of the track (negative Z).
    const engineZ=-103;
    box(4,.65,19,railX,1.68,engineZ,iron);
    cylinder(1.6,11,railX,3.55,engineZ-2,iron,Math.PI/2);
    for(const z of [-6.5,-3,1.5])cylinder(1.64,.18,railX,3.55,engineZ+z,trim,Math.PI/2);
    box(4.4,4.25,5.1,railX,4.12,engineZ+6.5,iron);box(5,.3,6,railX,6.45,engineZ+6.5,rust);
    for(const side of [-1,1])box(.08,1.6,2.4,railX+side*2.23,4.8,engineZ+6.5,glass);
    cylinder(.56,2.35,railX,6.22,engineZ-5,iron);cylinder(.78,.28,railX,7.42,engineZ-5,trim);
    cylinder(.55,1.1,railX,5.55,engineZ+.5,rust);
    wheels(engineZ,15,5);solid(railX,engineZ+1,5.1,23,7.6);
    const catcher=new THREE.Mesh(new THREE.ConeGeometry(2.65,3.2,4),iron);catcher.rotation.set(-Math.PI/2,0,Math.PI/4);catcher.scale.y=.8;catcher.position.set(railX,1.5,engineZ-11);this.group.add(catcher);
    const lamp=new THREE.Mesh(new THREE.CircleGeometry(.48,8),new THREE.MeshBasicMaterial({color:'#ddb473'}));lamp.position.set(railX,3.55,engineZ-7.62);lamp.rotation.y=Math.PI;this.group.add(lamp);
    this.lamp=new THREE.PointLight('#d8a864',4,13,2);this.lamp.position.set(railX,3.55,engineZ-8);this.group.add(this.lamp);
    // Coal tender, two passenger cars and an abandoned freight car.
    for(const [offset,length,passenger] of [[22,13,false],[42,20,true],[66,20,true],[88,17,false]]){
      const z=engineZ+offset;wheels(z,length,4);box(4.5,.55,length,railX,1.7,z,iron);
      box(4.3,passenger?4:2.35,length-1,railX,passenger?4:3.15,z,passenger?wood:iron);
      box(4.8,.3,length+.6,railX,passenger?6.15:4.48,z,rust);
      if(passenger)for(const side of [-1,1])for(let i=0;i<5;i++){
        const wz=z-7+i*3.5;box(.1,1.55,2.05,railX+side*2.18,4.7,wz,glass);
        box(.15,.12,2.4,railX+side*2.24,3.82,wz,trim);
      }
      if(!passenger)for(let i=0;i<5;i++)box(1,.65,1.2,railX+(i%2-.5)*2,4.55,z-4+i*1.8,iron);
      box(.3,.25,4,railX,1.25,z-length/2-1,trim);solid(railX,z,4.8,length+1,passenger?6.35:5);
    }
    // Depot has a flat wooden walk and a raised canopy with solid support posts.
    box(10,.1,62,-204,.085,-102,wood);
    for(const z of [-129,-106,-77])for(const x of [-208,-200]){
      box(.32,4.6,.32,x,2.3,z,wood);solid(x,z,.32,.32,4.6);
    }
    box(11,.35,60,-204,4.72,-103,rust);
    colliders.push({kind:'box',minX:-209.5,maxX:-198.5,minZ:-133,maxZ:-73,minY:4.545,maxY:4.895});
    for(const z of [-132,-73]){box(6,.14,.18,-204,1.6,z,wood);solid(-204,z,6,.2,1.7);}
    for(const [x,z] of [[-201,-140],[-202,-142],[-207,-68],[-204,-64]]){
      box(1.5,1.5,1.5,x,.75,z,wood);box(1.57,.12,1.57,x,1.34,z,trim);solid(x,z,1.6,1.6,1.5);
    }
    const sign=new THREE.Mesh(new THREE.BoxGeometry(.18,1.3,4.5),wood);sign.position.set(-198,3.7,-106);this.group.add(sign);
    for(const batch of batches.values()){
      const geometry=batch.shape==='box'?new THREE.BoxGeometry(1,1,1):new THREE.CylinderGeometry(1,1,1,8);
      const mesh=new THREE.InstancedMesh(geometry,batch.material,batch.matrices.length);batch.matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
      mesh.computeBoundingSphere();this.group.add(mesh);
    }
    this.steam=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshBasicMaterial({color:'#8b94a9',transparent:true,opacity:.09,depthWrite:false}),8);
    this.steam.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.steam.frustumCulled=false;this.group.add(this.steam);this.dummy=dummy;this.chimney={x:railX,z:engineZ-5};
  }
  update(time){
    this.lamp.intensity=3.4+Math.sin(time*5)*.5;
    for(let i=0;i<8;i++){
      const age=(time*.15+i/8)%1;this.dummy.position.set(this.chimney.x+Math.sin(age*3+i)*age*2,7.6+age*8,this.chimney.z+age*4);
      this.dummy.rotation.set(age,age*2,i);this.dummy.scale.setScalar((.25+age*1.25)*Math.sin(age*Math.PI));this.dummy.updateMatrix();this.steam.setMatrixAt(i,this.dummy.matrix);
    }
    this.steam.instanceMatrix.needsUpdate=true;
  }
}
