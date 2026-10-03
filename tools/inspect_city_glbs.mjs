import fs from 'node:fs';
import crypto from 'node:crypto';
const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};
const report=[];
for(const filename of ['city-cerberus.glb','city-devourer.glb','city-chained-demon.glb']){
  const bytes=fs.readFileSync(`public/models/${filename}`),jsonSize=bytes.readUInt32LE(12);
  if(bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length)throw new Error(`Invalid GLB: ${filename}`);
  const gltf=JSON.parse(bytes.subarray(20,20+jsonSize).toString()),binStart=28+jsonSize;
  for(const accessor of gltf.accessors||[]){
    if(accessor.bufferView===undefined||accessor.componentType!==5126)continue;
    const view=gltf.bufferViews[accessor.bufferView],size=components[accessor.type],stride=view.byteStride||size*4;
    const start=binStart+(view.byteOffset||0)+(accessor.byteOffset||0);
    for(let i=0;i<accessor.count;i++)for(let j=0;j<size;j++)if(!Number.isFinite(bytes.readFloatLE(start+i*stride+j*4)))throw new Error(`Non-finite accessor: ${filename}`);
  }
  if(!gltf.skins?.length||!gltf.animations?.length||!gltf.images?.every(i=>i.bufferView!==undefined))throw new Error(`Missing embedded rig/animations/textures: ${filename}`);
  report.push({filename,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),skins:gltf.skins.length,
    textures:gltf.images.length,animations:gltf.animations.map(a=>a.name),finiteFloatAccessors:true});
}
fs.writeFileSync('docs/assets/city-glb-inspection.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.map(({filename,skins,textures,animations})=>({filename,skins,textures,animations}))));
