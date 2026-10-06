import * as THREE from 'three';
import { placeAsset } from './AssetPlacement.js';

export class SaloonStage {
  constructor(view) {
    this.view=view;this.group=new THREE.Group();this.group.name='Salão Fantasma';this.colliders=[];this.lamps=[];this.upperY=4.4;
    this.cover=[{x:-21,z:-16,floor:0},{x:-21,z:16,floor:0},{x:-9,z:-24,floor:.6},{x:10,z:-24,floor:.6},{x:21,z:23,floor:0}];
    const wood=this.wood('#5a4030'),planks=this.wood('#72503a'),dark=view.mat('#292124'),iron=view.mat('#343138'),red=view.mat('#591f2a');
    this.box=(w,h,d,x,y,z,material,solid=false)=>{
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);this.group.add(mesh);
      if(solid)this.colliders.push({kind:'box',minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,minY:y-h/2,maxY:y+h/2});return mesh;
    };
    const box=this.box;
    box(48,.25,58,0,-.125,0,planks,true);this.colliders.at(-1).walkable=true;
    box(48,.35,58,0,9.8,0,dark,true);
    box(.6,10,58,-24,5,0,wood,true);box(.6,10,58,24,5,0,wood,true);
    box(48,10,.6,0,5,-29,wood,true);box(48,10,.6,0,5,29,wood,true);
    // Windows are moonlit painted planes; walls retain their solid collision.
    const blue=new THREE.MeshBasicMaterial({color:'#33465c'}),moon=new THREE.MeshBasicMaterial({color:'#b2bac2'});
    for(const x of [-16,-8,0,8,16])for(const y of [2.3,7]){
      box(3.5,3,.12,x,y,28.64,blue);box(.16,3.2,.17,x,y,28.52,iron);box(3.7,.14,.17,x,y,28.52,iron);
      for(const side of [-1,1])box(.16,3.25,.2,x+side*1.9,y,28.5,wood);
      box(3.9,.15,.2,x,y+1.6,28.5,wood);
    }
    const disk=new THREE.Mesh(new THREE.CircleGeometry(.8,9),moon);disk.position.set(0,7.5,28.45);disk.rotation.y=Math.PI;this.group.add(disk);
    // Upper gallery wraps around an open central atrium.
    box(10,.25,58,-19,4.275,0,planks,true);box(28,.25,10,0,4.275,-24,planks,true);
    box(10,.25,15,19,4.275,21.5,planks,true);box(10,.25,15,19,4.275,-21.5,planks,true);
    box(4,.25,28,22,4.275,0,planks,true);box(2,.25,28,15,4.275,0,planks,true);
    const rail=(x,z,length,axis='z',floor=4.4)=>{
      const w=axis==='z'?.13:length,d=axis==='z'?length:.13;
      box(w,.14,d,x,floor+1.08,z,wood,true);box(w,.1,d,x,floor+.52,z,wood,true);
      for(let n=0;n<=length;n+=1.6)box(.13,1.08,.13,x+(axis==='x'?n-length/2:0),floor+.54,z+(axis==='z'?n-length/2:0),wood,true);
    };
    rail(-14,4.8,47);rail(14,-22,12);rail(14,22,12);rail(0,-19,28,'x');
    // Visible treads match the continuous walkable ramp used by navigation.
    for(let i=0;i<28;i++){
      const z=13.5-i,height=(i+1)/28*this.upperY;
      box(4,.18,1,18,height-.09,z,planks,true);this.colliders.at(-1).walkable=true;
      for(const x of [15.9,20.1]){
        box(.12,1.05,.13,x,height+.5,z,wood);
        if(i%4===0)box(.13,1.9,.13,x,height-.1,z,wood);
      }
    }
    for(const x of [15.9,20.1]){
      const handrail=box(.16,.15,28.5,x,3.28,0,wood);handrail.rotation.x=Math.atan(this.upperY/28);
    }
    // Bar, back shelves, bottles and stools leave a wide route through the room.
    box(4.2,1.3,21,-18,.65,0,wood,true);box(4.7,.2,21.5,-18,1.4,0,planks,true);
    for(const y of [1.3,2.4,3.4])box(1.3,.13,22,-22.4,y,0,wood,true);
    const glass=view.mat('#476157'),bottleGeo=new THREE.CylinderGeometry(.11,.15,.5,6);
    for(let i=0;i<48;i++){
      const b=new THREE.Mesh(bottleGeo,glass);b.position.set(-22.35,1.61+Math.floor(i/16)*1.05,-10+(i%16)*1.3);b.rotation.z=i%9===0?.18:0;this.group.add(b);
    }
    for(const z of [-8,-3,3,8]){
      box(1,.15,1,-13,1.05,z,red,true);for(const dx of [-.35,.35])for(const dz of [-.35,.35])box(.1,1,.1,-13+dx,.5,z+dz,wood);
    }
    // Upright piano and individually modeled white/black keys.
    box(4.3,1.85,1.35,7,.93,18,wood,true);box(4.3,.2,2,7,.9,17.6,wood,true);
    box(3.8,.8,.15,7,1.48,17.28,dark);
    const bone=view.mat('#c2b49a');for(let i=0;i<36;i++){
      box(.1,.09,.58,5.2+i*.1,1.04,16.9,bone);
      if(![2,6].includes(i%7))box(.06,.08,.32,5.24+i*.1,1.13,17.03,dark);
    }
    box(2,.13,.85,7,.6,15.4,red,true);
    // Performance stage, stairs at its front, ragged curtains and show backdrop.
    box(22,.6,6,0,.3,-25,wood,true);this.colliders.at(-1).walkable=true;
    box(22,.2,1.5,0,.1,-21.3,planks);box(22,.2,1.5,0,.3,-22.1,planks);
    for(const x of [-11,11]){box(.3,4,.3,x,2,-25,iron,true);for(let j=0;j<6;j++)box(.48,3.5,.22,x+(x<0?1:-1)*j*.4,2.2,-26,red);}
    box(22,.4,.3,0,4,-26,red);box(18,2.9,.12,0,2.25,-28.55,dark);
    // Tall partitions and side curtains are real cover for Malvina's retreat.
    for(const z of [-16,16]){
      box(.25,3.6,5,-18,1.8,z,wood,true);
      for(const offset of [-2.5,2.5])box(.3,3.8,.3,-18,1.9,z+offset,iron,true);
    }
    box(.45,3.5,5,18,1.75,23,wood,true);
    for(const x of [-9,9])box(6,3.3,.2,x,2.25,-22.9,red,true);
    // Oblique tables, pillars and upstairs rooms create cover without a maze.
    for(const [x,z] of [[-6,-10],[5,-7],[-5,7],[9,5]]){
      const top=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,.15,8),planks);top.position.set(x,1.1,z);this.group.add(top);
      box(.3,1.1,.3,x,.55,z,wood);this.colliders.push({kind:'circle',x,z,radius:1.5,minY:0,maxY:1.2});
      for(const sign of [-1,1]){
        const chairX=x+sign*2.1;
        box(.95,.14,.85,chairX,.65,z,wood,true);box(.14,1.25,.95,chairX+sign*.4,.9,z,wood,true);
        for(const dx of [-.35,.35])for(const dz of [-.3,.3])box(.1,.65,.1,chairX+dx,.325,z+dz,wood);
      }
      box(.055,.22,.055,x,1.28,z,bone);
      const flame=new THREE.Mesh(new THREE.OctahedronGeometry(.08),new THREE.MeshBasicMaterial({color:'#ffc781'}));flame.position.set(x,1.45,z);this.group.add(flame);
    }
    for(const x of [-14,14])for(const z of [-17,17])box(.55,4.3,.55,x,2.15,z,wood,true);
    for(const z of [-18,-8,3,15,24]){
      box(.15,2.7,2,-23.62,5.75,z,dark);box(.16,2.7,.18,-23.5,5.75,z-1.1,wood);box(.16,2.7,.18,-23.5,5.75,z+1.1,wood);
    }
    for(const [x,z,y] of [[-12,-15,3],[12,-15,3],[-12,13,3],[12,20,3],[0,-25,3.4],[-20,-4,7],[19,-21,7]]){
      const light=new THREE.PointLight('#f0ae64',8,16,2);light.position.set(x,y,z);this.group.add(light);this.lamps.push(light);
      box(.25,.45,.25,x,y,z,new THREE.MeshBasicMaterial({color:'#ffd19b'}));
    }
    this.group.add(new THREE.HemisphereLight('#a8b4d0','#665047',2));
    this.group.add(new THREE.AmbientLight('#b4a1ae',.8));
    const moonlight=new THREE.DirectionalLight('#8faad5',2);moonlight.position.set(0,9,28);moonlight.target.position.set(0,0,-12);this.group.add(moonlight,moonlight.target);
    this.addWeb(-22,8.8,-27);this.addWeb(22,8.8,-27);this.addWeb(-22,3.7,26);
    const dust=new THREE.BufferGeometry(),points=[];for(let i=0;i<120;i++)points.push(Math.sin(i*13)*22,(i%23)/23*8+.3,Math.cos(i*7)*27);
    dust.setAttribute('position',new THREE.Float32BufferAttribute(points,3));this.dust=new THREE.Points(dust,new THREE.PointsMaterial({color:'#c3ae8a',size:.035,transparent:true,opacity:.4}));this.group.add(this.dust);
    this.ready=this.loadProps();
  }
  async loadProps(){
    for(const [filename,x,z,size] of [['psx_barrel.glb',-21,24,1.3],['psx_barrel.glb',21,25,1.3],['coffin.glb',-21,-24,2.6]]){
      try{
        const asset=await this.view.loadSharedAsset(filename),scene=asset.scene.clone(true);
        scene.traverse(node=>{if(node.isMesh)node.material=Array.isArray(node.material)?node.material.map(m=>this.view.psxMaterial(m,.2)):this.view.psxMaterial(node.material,.2);});
        const prop=placeAsset(scene,{size,x,z});this.group.add(prop);
        const b=new THREE.Box3().setFromObject(prop);this.colliders.push({kind:'box',minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z,minY:b.min.y,maxY:b.max.y});
      }catch(error){console.warn('Objeto do salão indisponível.',filename,error);}
    }
  }
  wood(color){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,64,64);
    for(let i=0;i<64;i+=8){ctx.fillStyle='#1c13184a';ctx.fillRect(i,0,1,64);for(let j=0;j<5;j++){ctx.fillStyle='#c3965e22';ctx.fillRect(i+2+j%3,(j*13+i)%60,1,10);}}
    const texture=new THREE.CanvasTexture(canvas);texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(5,6);
    const material=this.view.mat(color,{map:texture});material.color.set('#d8c6b1');return material;
  }
  addWeb(x,y,z){
    const points=[];for(let i=0;i<9;i++){const a=i/9*Math.PI*2;points.push(0,0,0,Math.cos(a)*2,Math.sin(a)*1.7,0);}
    for(const radius of [.5,1,1.5,2])for(let i=0;i<9;i++){const a=i/9*Math.PI*2,b=(i+1)/9*Math.PI*2;points.push(Math.cos(a)*radius,Math.sin(a)*radius*.85,0,Math.cos(b)*radius,Math.sin(b)*radius*.85,0);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));const web=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:'#958d8c',transparent:true,opacity:.5}));web.position.set(x,y,z);this.group.add(web);
  }
  onStairs(x,z){return x>=16&&x<=20&&z>=-14&&z<=14;}
  floorAt(x,z,previous=0){
    if(this.onStairs(x,z))return (14-z)/28*this.upperY;
    if(previous>3.9&&(Math.abs(x)>=14||z<=-19))return this.upperY;
    if(z<-20.5&&Math.abs(x)<11)return Math.min(.6,(-20.5-z)*.3);
    return 0;
  }
  canStep(x,z,previous){return Math.abs(this.floorAt(x,z,previous)-previous)<.45;}
  buildNavigation(){
    const game=this.view.viewModel;this.nodes=[];const cells=new Map();
    // The same X/Z cell may have two independent floors; stairs connect them.
    for(let ix=-15;ix<=15;ix++)for(let iz=-18;iz<=18;iz++){
      const x=ix*1.5,z=iz*1.5,heights=[...new Set([this.floorAt(x,z,0),this.floorAt(x,z,4.4)])];
      const cell=[];
      for(const y of heights)if(game.spotClear(x,z,.6,y)){
        const node={x,z,y,id:this.nodes.length,edges:[]};this.nodes.push(node);cell.push(node);
      }
      cells.set(`${ix},${iz}`,cell);
    }
    for(const node of this.nodes){
      const ix=Math.round(node.x/1.5),iz=Math.round(node.z/1.5);
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])for(const other of cells.get(`${ix+dx},${iz+dz}`)||[]){
        if(Math.abs(other.y-node.y)>.45)continue;
        const x=(node.x+other.x)/2,z=(node.z+other.z)/2;
        if(game.spotClear(x,z,.6,node.y))node.edges.push(other.id);
      }
    }
    this.flowCache=new Map();
    this.cells=cells;
  }
  nearest(point,floor){
    let best=null,distance=Infinity;
    const ix=Math.round(point.x/1.5),iz=Math.round(point.z/1.5),near=[];
    for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)near.push(...(this.cells.get(`${ix+dx},${iz+dz}`)||[]));
    for(const node of near.length?near:this.nodes){const d=Math.hypot(node.x-point.x,node.z-point.z)+Math.abs(node.y-floor)*12;
      if(d<distance){best=node;distance=d;}}
    if(best&&Math.abs(best.y-floor)>1.2)for(const node of this.nodes){
      if(Math.abs(node.y-floor)>.6)continue;
      const d=Math.hypot(node.x-point.x,node.z-point.z)+Math.abs(node.y-floor)*12;
      if(d<distance){best=node;distance=d;}
    }
    return best;
  }
  route(enemy,target){
    if(!this.nodes)this.buildNavigation();
    const start=this.nearest(enemy,enemy.floor||0),goal=this.nearest(target,target.y-1.68);
    if(!start||!goal)return target;
    const now=this.view.viewModel.saloonBosses.time;
    let flow=this.flowCache.get(goal.id);
    if(!flow||now-flow.time>1){
      const costs=new Int32Array(this.nodes.length);costs.fill(-1);costs[goal.id]=0;
      const queue=[goal.id];for(let i=0;i<queue.length;i++)for(const next of this.nodes[queue[i]].edges)if(costs[next]<0){costs[next]=costs[queue[i]]+1;queue.push(next);}
      flow={costs,time:now};this.flowCache.set(goal.id,flow);
      if(this.flowCache.size>12)this.flowCache.delete(this.flowCache.keys().next().value);
    }
    if(start===goal)return target;
    if(Math.hypot(start.x-enemy.x,start.z-enemy.z)>.8)return start;
    let next=start;
    for(const id of start.edges)if(flow.costs[id]>=0&&(flow.costs[next.id]<0||flow.costs[id]<flow.costs[next.id]))next=this.nodes[id];
    return next;
  }
  update(time){this.lamps.forEach((lamp,i)=>{lamp.intensity=7.5+Math.sin(time*7+i)*.7;});this.dust.rotation.y=Math.sin(time*.1)*.01;}
}
