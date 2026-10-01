import test from 'node:test';
import assert from 'node:assert/strict';
import { MenuModel } from '../src/models/MenuModel.js';
import { WorldModel } from '../src/models/WorldModel.js';
import { GameViewModel } from '../src/viewmodels/GameViewModel.js';
import { MISSIONS,INITIAL_CARDS } from '../src/config/campaign.js';
import { ABILITIES } from '../src/config/abilityConfig.js';

function profile(saved){
  const data=new Map(saved?[['faroeste-black-trail-order-profile-v1',JSON.stringify(saved)]]:[]);
  globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
  globalThis.window={matchMedia:()=>({matches:false})};
  return new MenuModel();
}
test('new campaign has exactly six cards, João, desert and no discoveries',()=>{
  const m=profile();assert.equal(Object.keys(ABILITIES).filter(id=>m.cardUnlocked(id)).length,6);
  assert.deepEqual(m.profile.deck,INITIAL_CARDS);assert.equal(m.heroUnlocked('maria'),false);assert.equal(m.heroUnlocked('labuta'),false);
  assert.equal(m.stageUnlocked('mine'),false);assert.deepEqual(m.profile.discoveries,[]);
  assert.equal(m.toggleDeck('lantern'),false);assert.equal(m.buy('damage'),false);
});
test('mission rewards survive reload and cannot be awarded twice',()=>{
  const m=profile();m.completeMission('desert:1');m.completeMission('desert:2');
  assert.equal(m.heroUnlocked('maria'),true);assert.equal(m.heroUnlocked('labuta'),true);
  assert.equal(m.cardUnlocked('ghostShot'),true);assert.equal(m.stageUnlocked('mine'),false);
  const restored=new MenuModel();assert.equal(restored.heroUnlocked('labuta'),true);
  assert.deepEqual(restored.completeMission('desert:1'),[]);
});
test('boss rewards, stage rewards and discovery are independently persistent',()=>{
  const m=profile();m.defeatBoss('giantBat');m.discover('bat');
  assert.equal(m.merchantUnlocked(),true);assert.equal(m.cardUnlocked('requiem'),true);assert.equal(m.stageUnlocked('mine'),false);
  m.clearStage('desert');const restored=new MenuModel();assert.equal(restored.stageUnlocked('mine'),true);assert.deepEqual(restored.profile.discoveries,['bat']);
  assert.equal(restored.cardUnlocked('bloodOath'),true);assert.equal(restored.cardUnlocked('moonLens'),false);
});
test('legacy deck cannot equip locked cards but coins and purchases survive migration',()=>{
  const m=profile({coins:42,deck:['lantern','ghostShot','boneStorm'],purchases:{damage:2}});
  assert.equal(m.profile.coins,42);assert.equal(m.profile.purchases.damage,2);assert.deepEqual(m.profile.deck,INITIAL_CARDS);
});
test('mission counters respect start/deadline and do not progress in free mode',()=>{
  const menu=profile(),world=new WorldModel();world.stage='desert';world.mode='campaign';
  const game=new GameViewModel(world,{showPickupMessage(){}},menu);game.runMissions=MISSIONS.desert.map(m=>({...m,count:0}));
  world.elapsed=44;game.missionEvent('bat',10);assert.equal(menu.heroUnlocked('maria'),false);
  world.elapsed=45;game.missionEvent('bat',10);assert.equal(menu.heroUnlocked('maria'),true);
  world.elapsed=401;game.missionEvent('coins',8);assert.equal(menu.heroUnlocked('labuta'),false);
  world.elapsed=300;world.mode='free';game.missionEvent('coins',8);assert.equal(menu.heroUnlocked('labuta'),false);
});
test('survival victory requires all three bosses and clock freezes during boss fight',()=>{
  const world=new WorldModel();world.startRun({map:'desert'});world.isLocked=true;world.elapsed=899;
  world.updateTime(1);assert.equal(world.phase,'playing');
  world.bossesSpawned=new Set(['a','b','c']);world.enemies=[{boss:true}];const time=world.elapsed;
  world.updateTime(2);assert.equal(world.elapsed,time);assert.equal(world.visualTime,3);
  world.enemies=[];world.updateTime(.1);assert.equal(world.phase,'victory');
});
