"""Derived PSX witch rig and clips. Never saves the supplied Blender source."""
import bpy, math, json, hashlib
from pathlib import Path
from mathutils import Vector, Quaternion
src=Path(r'C:\Users\JC INFORMATICA\Downloads\Modelos Psx 3d')
root=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(src/'wizard2.blend'),load_ui=False,use_scripts=False)
mesh=bpy.data.objects['wizard']
if mesh.mode!='OBJECT':bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);bpy.context.view_layer.objects.active=mesh
bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
points=[v.co for v in mesh.data.vertices];lo=Vector(tuple(min(v[i] for v in points) for i in range(3)));hi=Vector(tuple(max(v[i] for v in points) for i in range(3)))
center=(lo+hi)/2;h=hi.z-lo.z;half=(hi.x-lo.x)/2
rigdata=bpy.data.armatures.new('MalvinaRig');rig=bpy.data.objects.new('MalvinaRig',rigdata);bpy.context.collection.objects.link(rig);rig.location=mesh.location.copy()
mesh.select_set(False);rig.select_set(True);bpy.context.view_layer.objects.active=rig;bpy.ops.object.mode_set(mode='EDIT')
def bone(name,head,tail,parent=None):
    b=rigdata.edit_bones.new(name);b.head=head;b.tail=tail
    if parent:b.parent=rigdata.edit_bones[parent]
bone('Root',(center.x,center.y,lo.z),(center.x,center.y,lo.z+h*.22))
bone('Spine',(center.x,center.y,lo.z+h*.3),(center.x,center.y,lo.z+h*.72),'Root')
bone('Head',(center.x,center.y,lo.z+h*.76),(center.x,center.y,hi.z),'Spine')
for side,label in [(-1,'L'),(1,'R')]:bone('Arm.'+label,(center.x+side*half*.2,center.y,lo.z+h*.66),(center.x+side*half*.75,center.y,lo.z+h*.5),'Spine')
bpy.ops.object.mode_set(mode='OBJECT')
groups={name:mesh.vertex_groups.new(name=name) for name in ['Root','Spine','Head','Arm.L','Arm.R']}
for v in mesh.data.vertices:
    z=(v.co.z-lo.z)/h;x=(v.co.x-center.x)/max(half,.001)
    arm=max(0,min(1,(abs(x)-.24)/.35)) if .43<z<.79 else 0
    head=max(0,min(1,(z-.76)/.1))*(1-arm)
    spine=max(0,min(1,(z-.25)/.22))*(1-arm-head)
    weights={'Root':max(0,1-arm-head-spine),'Spine':spine,'Head':head,'Arm.L' if x<0 else 'Arm.R':arm}
    for name,weight in weights.items():
        if weight>0:groups[name].add([v.index],weight,'REPLACE')
modifier=mesh.modifiers.new('MalvinaSkin','ARMATURE');modifier.object=rig
mesh.parent=rig;mesh.matrix_parent_inverse=rig.matrix_world.inverted()
texture=bpy.data.images.load(str(src/'texture_low.png'),check_existing=True);texture.scale(512,512);texture.pack()
for material in mesh.data.materials:
    material.use_nodes=True;nodes=material.node_tree.nodes;nodes.clear();shader=nodes.new('ShaderNodeBsdfPrincipled');out=nodes.new('ShaderNodeOutputMaterial');tex=nodes.new('ShaderNodeTexImage');tex.image=texture;tex.interpolation='Closest';shader.inputs['Roughness'].default_value=1
    material.node_tree.links.new(tex.outputs['Color'],shader.inputs['Base Color']);material.node_tree.links.new(shader.outputs['BSDF'],out.inputs['Surface'])
rig.animation_data_create()
for name,frames in [('Hover',61),('Cast',41),('Dance',81),('Hurt',21)]:
    action=bpy.data.actions.new(name);rig.animation_data.action=action
    for frame in range(1,frames+1,2):
        t=(frame-1)/(frames-1);wave=math.sin(t*math.tau);pulse=math.sin(t*math.pi)
        for b in rig.pose.bones:
            b.rotation_mode='XYZ';b.rotation_euler=(0,0,0);b.location=(0,0,0)
            if b.name=='Root':b.rotation_euler.y=t*math.tau if name=='Dance' else wave*.035
            elif b.name=='Spine':b.rotation_euler.x=wave*.035-(pulse*.2 if name=='Hurt' else 0)
            elif b.name=='Head':b.rotation_euler.y=wave*.07
            elif b.name.startswith('Arm'):
                side=-1 if b.name.endswith('L') else 1
                rest=b.bone.matrix_local.to_quaternion()
                lower=side*(.8-(pulse*.7 if name=='Cast' else 0)+wave*.06)
                b.rotation_euler=(rest.inverted() @ Quaternion(Vector((0,1,0)),lower) @ rest).to_euler()
                b.rotation_euler.y+=wave*.08 if name=='Dance' else 0
            b.keyframe_insert(data_path='rotation_euler',frame=frame,group=b.name)
bpy.context.scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);rig.select_set(True)
destination=root/'public/models/saloon-malvina.glb'
bpy.ops.export_scene.gltf(filepath=str(destination),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_anim_single_armature=True,export_force_sampling=True,export_cameras=False,export_lights=False)
receipt={'source':'wizard2.blend','sourceSha256':hashlib.sha256((src/'wizard2.blend').read_bytes()).hexdigest(),'output':destination.name,'outputSha256':hashlib.sha256(destination.read_bytes()).hexdigest(),'bytes':destination.stat().st_size,'texture':'texture_low.png','textureLimit':512,'rig':'generated spatial skin','clips':['Hover','Cast','Dance','Hurt'],'license':'user-supplied; unspecified'}
(root/'docs/assets/malvina-export.json').write_text(json.dumps(receipt,indent=2),encoding='utf-8')
print('MALVINA_EXPORT',json.dumps(receipt))
