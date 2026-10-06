import * as THREE from 'three';
import { placeAsset } from '../views/AssetPlacement.js';

// Local, read-only visual fixtures. Excluded from production by Vite.
export async function preview(game) {
  const { view,model }=game;
  const kind=new URLSearchParams(location.search).get('preview');
  if(kind==='menus'){
    const screen=new URLSearchParams(location.search).get('screen');
    if(['home','modes','champion','map','arsenal','bestiary','merchant','settings'].includes(screen))game.menuViewModel.navigate(screen);
    return;
  }
  await Promise.all([view.assetsReady,view.weaponReady]);
  if(kind==='saloon'){
    await view.selectStage('saloon');model.startRun({map:'saloon',mode:'free'});model.phase='preview';view.hideMenu();
    const angle=new URLSearchParams(location.search).get('angle');
    if(angle==='upper'){view.camera.position.set(-19,6.08,12);view.camera.lookAt(10,2,-12);}
    else if(angle==='witch'){
      view.camera.position.set(0,2,9);view.camera.lookAt(0,1.7,4);
      const actor=view.addEnemy('witch',0,.7,4,true,1.25);if(actor){actor.rotation.y=0;view.danceEnemy(actor);}
    }else{view.camera.position.set(0,2.3,24);view.camera.lookAt(0,3,-18);}
    view.renderer.setAnimationLoop(()=>{
      model.visualTime+=1/60;
      for(const actor of view.enemyActors.keys())view.updateEnemy(actor,1/60);
      view.update(1/60,model);view.psx.render(1/60);
    });return;
  }
  if(kind==='city'){
    await view.selectStage('ghostTown');model.startRun({map:'ghostTown',mode:'free'});model.phase='preview';view.hideMenu();
    view.camera.position.set(0,1.68,170);view.camera.lookAt(0,1.68,-200);
    const weather=new URLSearchParams(location.search).get('weather');
    if(['rain','sand','tornado'].includes(weather)){game.viewModel.weather.state.kind=weather;if(weather==='tornado')game.viewModel.weather.state.tornado={x:6,z:145};}
    view.renderer.setAnimationLoop(()=>{model.visualTime+=1/60;view.update(1/60,model);view.psx.render(1/60);});
    return;
  }
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
      const all=['snake','scorpion','spider','miner','zombie','ghost','ghoul','wendigo','cerberus','devourer','chainedDemon'];
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
    model.visualTime+=1/60;
    for(const actor of view.enemyActors.keys())view.updateEnemy(actor,1/60);
    if(kind==='enemies'&&Math.floor(t)!==view.lastGroundReport){
      view.lastGroundReport=Math.floor(t);
      view.root.dataset.groundReport=JSON.stringify([...view.enemyActors.keys()].map(actor=>({floor:actor.position.y,lowest:new THREE.Box3().setFromObject(actor,true).min.y})));
    }
    if(bento)view.updateEventObject(bento,'merchant',t);
    view.update(1/60,model);view.psx.render(1/60);
  });
}
