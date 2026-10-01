import * as THREE from 'three';
import { placeAsset } from '../views/AssetPlacement.js';

// Local, read-only visual fixtures. Excluded from production by Vite.
export async function preview(game) {
  const { view,model }=game;
  const kind=new URLSearchParams(location.search).get('preview');
  if(kind==='menus'){
    const screen=new URLSearchParams(location.search).get('screen');
    if(['home','modes','champion','map','arsenal','bestiary','merchant'].includes(screen))game.menuViewModel.navigate(screen);
    return;
  }
  await Promise.all([view.assetsReady,view.weaponReady]);
  model.startRun({champion:kind==='revolver'?'maria':'joao'});
  model.phase='preview';view.hideMenu();view.setChampion(model.champion);
  let bento=null;
  if(kind!=='revolver'){
    view.weapon.visible=false;view.revolver.visible=false;
    for(const child of view.world.children)child.visible=false;
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:'#3d424e'}));
    ground.rotation.x=-Math.PI/2;view.world.add(ground);
    if(kind==='bento'){
      bento=view.addEventObject('merchant',0,0);
      view.camera.position.set(0,1.5,4.8);view.camera.lookAt(0,1.1,0);
    }else if(kind==='enemies'){
      const all=['snake','scorpion','spider','miner','zombie','ghost','ghoul','wendigo'];
      const chosen=new URLSearchParams(location.search).get('actor');
      const names=all.includes(chosen)?[chosen]:all;
      names.forEach((name,i)=>{const actor=view.addEnemy(name,(i-(names.length-1)/2)*3,0,0);if(actor)actor.rotation.y=Number(new URLSearchParams(location.search).get('yaw'))||0;});
      view.camera.position.set(0,names.length===1?2.8:2.5,names.length===1?4:15);view.camera.lookAt(0,names.length===1?.8:1.2,0);
    }else{
      const names=['psx_abandoned_house.glb','psx_abandoned_church.glb','psx_old_abandoned_mansion.glb','low_poly_western_saloon.glb'];
      for(let i=0;i<names.length;i++){
        const source=await view.loadSharedAsset(names[i]);
        view.world.add(placeAsset(source.scene.clone(true),{size:8,x:(i-1.5)*10,z:0}));
      }
      view.camera.position.set(0,10,32);view.camera.lookAt(0,2,0);
    }
  }
  view.renderer.setAnimationLoop(()=>{
    const t=performance.now()/1000;
    if(bento)view.updateEventObject(bento,'merchant',t);
    view.update(1/60,model);view.psx.render(1/60);
  });
}
