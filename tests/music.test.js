import test from 'node:test';
import assert from 'node:assert/strict';
import { GameAudio } from '../src/services/GameAudio.js';

function audio(){
  globalThis.Audio=class{play(){return Promise.resolve();}pause(){}};
  const audio=new GameAudio(),sources=[];
  audio.context={state:'running',currentTime:0,createBufferSource(){const source={connect(){},start(when,offset){this.offset=offset;},stop(){this.stopped=true;},disconnect(){}};sources.push(source);return source;}};
  audio.musicGain={};audio.musicBuffers={desert:{duration:180,id:'desert'},mine:{duration:178.36,id:'mine'}};
  return {audio,sources};
}
test('mine track loops from zero to 166 seconds and resumes at paused offset',()=>{
  const {audio:a,sources}=audio();a.syncMusic('mine',false);
  assert.equal(sources[0].buffer.id,'mine');assert.equal(sources[0].loop,true);assert.equal(sources[0].loopStart,0);assert.equal(sources[0].loopEnd,166);
  a.context.currentTime=170;a.syncMusic('mine',true);assert.equal(sources[0].stopped,true);
  a.syncMusic('mine',false);assert.equal(sources[1].offset,4);
});
test('switching stage stops old track and starts correct music from zero',()=>{
  const {audio:a,sources}=audio();a.syncMusic('desert',false);a.context.currentTime=20;a.syncMusic('mine',false);
  assert.equal(sources[0].stopped,true);assert.equal(sources[1].buffer.id,'mine');assert.equal(sources[1].offset,0);
  a.syncMusic('menu',false);assert.equal(sources[1].stopped,true);
});
