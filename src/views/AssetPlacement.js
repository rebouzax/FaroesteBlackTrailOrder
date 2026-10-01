import * as THREE from 'three';

// Imported glTF roots already encode their source coordinate system.
// Apply game placement to a wrapper instead of overwriting those transforms.
export function placeAsset(scene, { size, dimension='width', x=0, z=0, yaw=0 }) {
  const root=new THREE.Group();root.add(scene);root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(scene),extent=box.getSize(new THREE.Vector3());
  const measure=dimension==='height'?extent.y:Math.max(extent.x,extent.z);
  root.scale.setScalar(size/Math.max(.001,measure));
  root.rotation.y=yaw;root.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(root),center=bounds.getCenter(new THREE.Vector3());
  root.position.set(x-center.x,-bounds.min.y,z-center.z);root.updateMatrixWorld(true);
  return root;
}

export function rigBento(scene) {
  const meshes=[];scene.traverse(node=>{if(node.isMesh&&!node.isSkinnedMesh)meshes.push(node);});
  for(const source of meshes){
    const geometry=source.geometry.clone(),positions=geometry.attributes.position;
    geometry.computeBoundingBox();const box=geometry.boundingBox;
    const height=box.max.z-box.min.z,shoulderZ=box.min.z+height*.73;
    const center=(box.min.x+box.max.x)/2,half=(box.max.x-box.min.x)/2;
    const root=new THREE.Bone();root.name='BentoRoot';
    const left=new THREE.Bone(),right=new THREE.Bone(),head=new THREE.Bone();
    left.name='BentoArmLeft';right.name='BentoArmRight';head.name='BentoHead';
    left.position.set(center-half*.25,0,shoulderZ);right.position.set(center+half*.25,0,shoulderZ);
    head.position.set(center,0,box.min.z+height*.84);root.add(left,right,head);
    const indices=[],weights=[];
    for(let i=0;i<positions.count;i++){
      const px=positions.getX(i)-center,pz=positions.getZ(i),width=Math.abs(px)/half;
      const arm=pz>box.min.z+height*.56&&pz<box.min.z+height*.89;
      const weight=arm?THREE.MathUtils.smoothstep(width,.21,.40):0;
      const headWeight=weight===0&&width<.25?THREE.MathUtils.smoothstep(pz,box.min.z+height*.84,box.min.z+height*.91):0;
      indices.push(0,px<0?1:2,3,0);weights.push(1-weight-headWeight,weight,headWeight,0);
    }
    geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
    geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
    const mesh=new THREE.SkinnedMesh(geometry,source.material);mesh.name=source.name;
    mesh.position.copy(source.position);mesh.quaternion.copy(source.quaternion);mesh.scale.copy(source.scale);
    source.parent.add(mesh);source.parent.remove(source);mesh.add(root);scene.updateMatrixWorld(true);
    mesh.bind(new THREE.Skeleton([root,left,right,head]));
    left.rotation.y=-1.2;right.rotation.y=1.2;mesh.frustumCulled=false;
  }
  scene.updateMatrixWorld(true);
}

export function animateBento(root,time) {
  const left=root.getObjectByName('BentoArmLeft'),right=root.getObjectByName('BentoArmRight'),head=root.getObjectByName('BentoHead');
  if(left)left.rotation.y=-1.2+Math.sin(time*1.4)*.025;
  if(right)right.rotation.y=1.2+Math.sin(time*1.4+.5)*.025;
  if(head)head.rotation.z=Math.sin(time*.6)*.035;
}
