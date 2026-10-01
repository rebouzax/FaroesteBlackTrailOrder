import * as THREE from 'three';
import { placeAsset } from './AssetPlacement.js';

// A wide central gallery keeps the horde readable, with work bays along both sides.
export class MineStage {
  constructor(view) {
    this.view=view;this.group=new THREE.Group();this.group.name='Mina dos Condenados';
    this.colliders=[];this.lamps=[];
    const rock=view.mat('#3d3835'),wood=view.mat('#443022'),iron=view.mat('#333639'),gold=view.mat('#ac8140');
    const mesh=(geometry,material,x,y,z)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);this.group.add(m);return m;};
    const box=(w,h,d,mat,x,y,z,solid=false)=>{const m=mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z);if(solid)this.colliders.push({kind:'box',minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});return m;};
    const ground=mesh(new THREE.CircleGeometry(1,64),view.mat('#504536'),0,0,0);ground.rotation.x=-Math.PI/2;ground.scale.set(41,81,1);
    const ceiling=mesh(new THREE.CircleGeometry(1,48),rock,0,12,0);ceiling.rotation.x=Math.PI/2;ceiling.scale.set(41,81,1);
    const wallMat=rock.clone();wallMat.side=THREE.BackSide;
    const wall=mesh(new THREE.CylinderGeometry(1,1,14,48,3,true),wallMat,0,6,0);wall.scale.set(40,1,80);
    const pos=wall.geometry.attributes.position;
    for(let i=0;i<pos.count;i++){const y=pos.getY(i);if(Math.abs(y)<6.9){const r=1+.018*Math.sin(pos.getX(i)*31+pos.getZ(i)*47+y);pos.setX(i,pos.getX(i)*r);pos.setZ(i,pos.getZ(i)*r);}}
    wall.geometry.computeVertexNormals();
    for(let z=-66;z<=66;z+=18){
      for(const x of [-12,12])box(.65,8,.8,wood,x,4,z,true);
      box(25,.8,.9,wood,0,8,z);
      for(const x of [-10,10]){
        const bulb=mesh(new THREE.SphereGeometry(.16,6,4),new THREE.MeshBasicMaterial({color:'#ffc77a'}),x,3.5,z);
        box(.38,.55,.38,iron,x,3.5,z);bulb.scale.setScalar(1.3);bulb.position.z+=.22;
        if(x===(Math.round((z+66)/18)%2?-10:10)){
          const lamp=new THREE.PointLight('#ffb968',9,28,2);lamp.position.copy(bulb.position);this.group.add(lamp);this.lamps.push(lamp);
        }
      }
    }
    for(const x of [-1.2,1.2])box(.12,.12,142,iron,x,.12,0);
    for(let z=-70;z<=70;z+=2.4)box(3.5,.1,.32,wood,0,.055,z);
    for(let i=0;i<36;i++){
      const angle=i/36*Math.PI*2,x=Math.cos(angle)*37,z=Math.sin(angle)*76;
      const r=mesh(new THREE.IcosahedronGeometry(2+(i%3),0),rock,x,1.5,z);r.scale.y=1.5;r.rotation.set(i*.5,i*.9,0);
      this.colliders.push({kind:'circle',x,z,radius:2.6});
      if(i%3===0){const ore=mesh(new THREE.IcosahedronGeometry(.8,0),gold,x*.97,2.8,z*.97);ore.scale.set(1.6,.25,.5);ore.rotation.z=i;}
    }
    const ambient=new THREE.HemisphereLight('#a8a0aa','#30251b',1.15);this.group.add(ambient);
    this.ready=this.loadProps();
  }
  async loadProps() {
    try {
      const {scene}=await this.view.loadSharedAsset('mine.glb');scene.updateMatrixWorld(true);
      const specs=[['Wagon',4,-2,-28],['Wagon',4,2,24],['Box_Wood',2,-23,38],['Box_Wood_01',2.3,-25,40],['Barrel',1.5,24,36],['Barrel_01',1.5,26,37],['Shovel',1.8,-23,-6],['Beak',1.6,23,-38],['Box',2,24,-40],['Box_Wood_02',2.5,-24,-47]];
      for(const [name,size,x,z] of specs){
        const source=scene.getObjectByName(name);if(!source)continue;
        const clone=source.clone(true);source.matrixWorld.decompose(clone.position,clone.quaternion,clone.scale);
        clone.traverse(node=>{if(node.isMesh)node.material=Array.isArray(node.material)?node.material.map(m=>this.view.psxMaterial(m,.18)):this.view.psxMaterial(node.material,.18);});
        const prop=placeAsset(clone,{size,x,z});this.group.add(prop);
        const bounds=new THREE.Box3().setFromObject(prop);
        const collider={kind:'box',minX:bounds.min.x,maxX:bounds.max.x,minZ:bounds.min.z,maxZ:bounds.max.z};
        this.colliders.push(collider);
        if(this.view.currentStage==='mine')this.view.viewModel.colliders.push(collider);
      }
    }catch(error){console.warn('Objetos da mina indisponíveis.',error);}
  }
  update(time){this.lamps.forEach((lamp,i)=>{lamp.intensity=8.5+Math.sin(time*6+i)*.6+Math.sin(time*11+i*3)*.25;});}
}
