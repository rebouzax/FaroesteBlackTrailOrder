// Continuous collision helpers: fast bullets cannot skip a thin wall or target.
export function segmentSphere(a,b,center,radius) {
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;
  const ox=a.x-center.x,oy=a.y-center.y,oz=a.z-center.z;
  const length=dx*dx+dy*dy+dz*dz,c=ox*ox+oy*oy+oz*oz-radius*radius;
  if(c<=0)return 0;
  if(length<1e-10)return null;
  const dot=ox*dx+oy*dy+oz*dz,disc=dot*dot-length*c;
  if(disc<0)return null;
  const t=(-dot-Math.sqrt(disc))/length;
  return t>=0&&t<=1?t:null;
}
export function segmentBox(a,b,box,padding=0) {
  let enter=0,exit=1;
  for(const [axis,min,max] of [['x',box.minX-padding,box.maxX+padding],['y',(box.minY??0)-padding,(box.maxY??4)+padding],['z',box.minZ-padding,box.maxZ+padding]]) {
    const delta=b[axis]-a[axis];
    if(Math.abs(delta)<1e-9){if(a[axis]<min||a[axis]>max)return null;continue;}
    const t1=(min-a[axis])/delta,t2=(max-a[axis])/delta;
    enter=Math.max(enter,Math.min(t1,t2));exit=Math.min(exit,Math.max(t1,t2));
    if(enter>exit)return null;
  }
  return enter;
}
export function obstacleHit(a,b,colliders,padding=.05) {
  let first=null;
  for(const collider of colliders) {
    let t;
    if(collider.kind==='box')t=segmentBox(a,b,collider,padding);
    else {
      // Trees and posts have vertical trunks, not spherical walls at ground level.
      t=segmentSphere({x:a.x,y:0,z:a.z},{x:b.x,y:0,z:b.z},{x:collider.x,y:0,z:collider.z},collider.radius+padding);
      if(t!==null){const y=a.y+(b.y-a.y)*t;if(y<0||y>(collider.maxY??5))t=null;}
    }
    if(t!==null&&(first===null||t<first))first=t;
  }
  return first;
}
export function enemyShape(enemy) {
  const height=enemy.height||({snake:.65,scorpion:.6,spider:.7,bat:1.1}[enemy.visual]??2.3)*(enemy.boss?2.7:1);
  const bottom=enemy.y+(enemy.bottom||0);
  return {center:{x:enemy.x,y:bottom+height*.5,z:enemy.z},radius:enemy.bodyRadius||Math.max(.3,Math.min(enemy.boss?1.8:.65,height*.55)),height,bottom};
}
export function enemyHit(a,b,enemy,radius=.04) {
  const shape=enemyShape(enemy),r=shape.radius+radius;
  return segmentBox(a,b,{minX:enemy.x-r,maxX:enemy.x+r,minY:shape.bottom,maxY:shape.bottom+shape.height,minZ:enemy.z-r,maxZ:enemy.z+r});
}
