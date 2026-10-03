import * as THREE from 'three';
import { placeAsset } from './AssetPlacement.js';

// Open streets between haunted blocks; every imported building keeps its glTF axes.
export class GhostTownStage {
  constructor(view) {
    this.view=view;this.group=new THREE.Group();this.group.name='Cidade Fantasma';this.colliders=[];this.lamps=[];
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(550,570,32,32),view.mat('#534739'));
    ground.rotation.x=-Math.PI/2;ground.position.y=-.035;this.group.add(ground);
    const road=new THREE.Mesh(new THREE.PlaneGeometry(20,550,1,20),view.mat('#675b49'));
    road.rotation.x=-Math.PI/2;road.position.y=.01;this.group.add(road);
    const wood=view.mat('#44352f'),iron=view.mat('#242630');
    const box=(w,h,d,x,y,z,material,solid=false)=>{
      const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);this.group.add(m);
      if(solid)this.colliders.push({kind:'box',minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,maxY:h});return m;
    };
    for(const z of [-158,-58,42,142]) {
      const cross=new THREE.Mesh(new THREE.PlaneGeometry(480,12),view.mat('#615240'));cross.rotation.x=-Math.PI/2;cross.position.set(0,.012,z);this.group.add(cross);
    }
    for(let z=-235;z<=235;z+=32)for(const side of [-1,1]){
      const x=side*13;
      box(.24,5,.24,x,2.5,z,wood,true);box(1.8,.14,.14,x,4.7,z,wood);
      const lamp=new THREE.Mesh(new THREE.BoxGeometry(.32,.5,.32),new THREE.MeshBasicMaterial({color:'#ffd086'}));lamp.position.set(x-side*.5,3.3,z);this.group.add(lamp);
      box(.42,.08,.42,x-side*.5,3.61,z,iron);
      if(Math.round((z+235)/32)%4===0){const light=new THREE.PointLight('#ffb366',7,24,2);light.position.copy(lamp.position);this.group.add(light);this.lamps.push(light);}
    }
    for(let i=0;i<18;i++){
      const z=-235+i*27,x=i%2?160:-160;
      for(let j=0;j<5;j++)box(.18,1.4,.18,x+j*3, .7,z,wood,true);
      for(const y of [.5,1.05])box(12,.12,.12,x+6,y,z,wood,true);
    }
    // Batched dry grass, concentrated away from roads and house footprints.
    const grass=new THREE.InstancedMesh(new THREE.ConeGeometry(.24,.75,3),view.mat('#827951'),700),dummy=new THREE.Object3D();
    let seed=7391;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<700;i++){
      const side=random()>.5?1:-1,x=side*(175+random()*80),z=random()*520-260;
      dummy.position.set(x,.23,z);dummy.rotation.set((random()-.5)*.3,random()*6.28,(random()-.5)*.4);dummy.scale.set(.6+random(),.5+random(),.6+random());dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);
    }
    this.group.add(grass);
    const verge=new THREE.InstancedMesh(new THREE.ConeGeometry(.17,.45,3),view.mat('#8c8156'),180);
    for(let i=0;i<180;i++){
      const z=random()*510-255;dummy.position.set((i%2?1:-1)*(15+random()*6),.15,z);dummy.rotation.set(0,random()*6.28,(random()-.5)*.35);dummy.scale.setScalar(.6+random());dummy.updateMatrix();verge.setMatrixAt(i,dummy.matrix);
    }
    this.group.add(verge);
    // Weathered wooden walks along the frontage of the main street.
    for(const side of [-1,1])for(let row=0;row<7;row++){
      const z=-210+row*65;
      box(5,.15,22,side*23,.13,z,wood);
      for(const edge of [-10,10])box(.18,1.6,.18,side*23,.8,z+edge,wood,true);
    }
    const ambient=new THREE.HemisphereLight('#a4b6d6','#35291e',1.1);this.group.add(ambient);
    this.ready=this.loadProps();
  }
  async loadProps() {
    const placements=[];
    for(const side of [-1,1])for(let row=0;row<7;row++)for(let block=0;block<3;block++){
      const z=-210+row*65,x=side*(35+block*47);
      const filename=block===0&&row%3===1?'low_poly_western_saloon.glb':block===2&&row%2===0?'psx_old_abandoned_mansion.glb':'psx_abandoned_house.glb';
      placements.push([filename,block===2?19:16,x,z,side<0?Math.PI/2:-Math.PI/2]);
    }
    placements.push(['psx_abandoned_church.glb',24,0,-248,0]);
    for(const x of [-22,22,190,-195])for(const z of [-215,-95,80,210])placements.push(['tree_ps1psx_style.glb',5,x,z,0]);
    for(const x of [-22,22])for(const z of [-190,-70,55,180])placements.push(['psx_barrel.glb',1.3,x,z,0]);
    const prepared=new Map();
    await Promise.all([...new Set(placements.map(p=>p[0]))].map(async filename=>{
      try {
        const {scene}=await this.view.loadSharedAsset(filename),copy=scene.clone(true);
        copy.traverse(n=>{if(n.isMesh)n.material=Array.isArray(n.material)?n.material.map(m=>this.view.psxMaterial(m,.25)):this.view.psxMaterial(n.material,.25);});prepared.set(filename,copy);
      }catch(error){console.warn(`Cidade: falha em ${filename}`,error);}
    }));
    for(const [filename,size,x,z,yaw] of placements){
      const source=prepared.get(filename);if(!source)continue;
      const prop=placeAsset(source.clone(true),{size,x,z,yaw});this.group.add(prop);
      const bounds=new THREE.Box3().setFromObject(prop);
      if(filename.includes('tree'))this.colliders.push({kind:'circle',x,z,radius:.6,maxY:4});
      else this.colliders.push({kind:'box',minX:bounds.min.x,maxX:bounds.max.x,minZ:bounds.min.z,maxZ:bounds.max.z,minY:0,maxY:bounds.max.y});
    }
    // Small cemetery beyond the eastern blocks.
    const {scene}=await this.view.loadSharedAsset('gravestone.glb');
    for(let i=0;i<12;i++){
      const prop=placeAsset(scene.clone(true),{size:1.2,x:192+(i%3)*6,z:-98+Math.floor(i/3)*8});this.group.add(prop);
      const bounds=new THREE.Box3().setFromObject(prop);this.colliders.push({kind:'box',minX:bounds.min.x,maxX:bounds.max.x,minZ:bounds.min.z,maxZ:bounds.max.z,maxY:bounds.max.y});
    }
  }
  update(time){this.lamps.forEach((lamp,i)=>{lamp.intensity=7+Math.sin(time*7+i*2)*.7+Math.sin(time*13+i)*.25;});}
}
