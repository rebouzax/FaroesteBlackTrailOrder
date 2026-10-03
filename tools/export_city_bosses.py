"""Export the three supplied city bosses; source .blend files are never saved."""
import bpy, hashlib, json, math
from mathutils import Vector, Quaternion
from pathlib import Path

source = Path(r'C:\Users\JC INFORMATICA\Downloads\Modelos Psx 3d')
workspace = Path(__file__).resolve().parents[1]
specs = [('cerberus_v002.blend', 'city-cerberus.glb', 'cerberus_texture.png'),
         ('gob_bod4_non5_rig3_a10.blend', 'city-devourer.glb', 'materialtexture_skullflesh1.png'),
         ('ChainedDemon.blend', 'city-chained-demon.glb', 'diffuse.png')]
receipts = []
for filename, output, texture in specs:
    bpy.ops.wm.open_mainfile(filepath=str(source / filename), load_ui=False, use_scripts=False)
    for action in bpy.data.actions:
        for slot in action.slots:
            if slot.target_id_type == 'UNSPECIFIED':
                slot.target_id_type = 'OBJECT'
    image = bpy.data.images.load(str(source / texture), check_existing=True)
    if max(image.size) > 512:
        factor = 512 / max(image.size)
        image.scale(max(1, round(image.size[0]*factor)), max(1, round(image.size[1]*factor)))
    image.pack()
    for material in bpy.data.materials:
        material.use_nodes = True
        nodes = material.node_tree.nodes
        nodes.clear()
        shader = nodes.new('ShaderNodeBsdfPrincipled')
        out = nodes.new('ShaderNodeOutputMaterial')
        material.node_tree.links.new(shader.outputs['BSDF'], out.inputs['Surface'])
        tex = nodes.new('ShaderNodeTexImage'); tex.image = image; tex.interpolation = 'Closest'
        material.node_tree.links.new(tex.outputs['Color'], shader.inputs['Base Color'])
        shader.inputs['Roughness'].default_value = 1
        shader.inputs['Metallic'].default_value = 0
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT')
    for collection in bpy.data.collections:
        collection.hide_viewport = False
    for obj in bpy.data.objects:
        if obj.type in {'MESH', 'ARMATURE'}:
            if obj.name not in bpy.context.scene.objects:
                bpy.context.scene.collection.objects.link(obj)
            obj.hide_set(False); obj.hide_viewport = False; obj.select_set(True)
    if filename == 'ChainedDemon.blend':
        # Its old Action targets another rig and exports only constant transforms.
        rig = bpy.data.objects['Rig']
        rig.animation_data_clear()
        for action in list(bpy.data.actions):
            bpy.data.actions.remove(action)
        rig.animation_data_create()
        for clip, frames in [('Idle',49),('Walk',33),('Attack',25),('Hit',13)]:
            action = bpy.data.actions.new(clip)
            rig.animation_data.action = action
            for frame in range(1,frames+1,2):
                t=(frame-1)/(frames-1); gait=math.sin(t*math.tau)
                strike=math.sin(t*math.pi) if clip=='Attack' else 0
                hurt=math.sin(t*math.pi) if clip=='Hit' else 0
                for bone in rig.pose.bones:
                    bone.rotation_mode='QUATERNION';q=Quaternion()
                    side=1 if bone.bone.head_local.x>=0 else -1
                    basis=bone.bone.matrix_local.to_quaternion().inverted()
                    axis_x=basis @ Vector((1,0,0));axis_y=basis @ Vector((0,1,0))
                    if bone.name in ['Arm.L','Arm.R']:
                        q=Quaternion(axis_y,side*.95) @ Quaternion(axis_x,(gait*side*.18 if clip=='Walk' else 0)-strike*.85)
                    elif bone.name in ['Forearm.L','Forearm.R']:
                        q=Quaternion(axis_x,-.15-strike*.25)
                    elif bone.name in ['Thigh.L','Thigh.R']:
                        q=Quaternion(axis_x,gait*side*.3 if clip=='Walk' else 0)
                    elif bone.name=='Spine2':
                        q=Quaternion(axis_x,.05+gait*.015+strike*.18-hurt*.2)
                    elif bone.name=='Head':
                        q=Quaternion(axis_y,gait*.03)
                    bone.rotation_quaternion=q
                    bone.keyframe_insert(data_path='rotation_quaternion',frame=frame,group=bone.name)
            bpy.context.scene.frame_set(1)
    destination = workspace / 'public/models' / output
    bpy.ops.export_scene.gltf(filepath=str(destination), export_format='GLB', use_selection=True,
                             export_animations=True, export_animation_mode='ACTIONS',
                             export_force_sampling=True, export_anim_single_armature=True, export_cameras=False, export_lights=False)
    receipts.append({'source':filename, 'sourceSha256':hashlib.sha256((source/filename).read_bytes()).hexdigest(),
                     'output':output, 'outputSha256':hashlib.sha256(destination.read_bytes()).hexdigest(),
                     'texture':texture, 'role':'city boss', 'license':'user-supplied; unspecified'})
(workspace / 'docs/assets/city-boss-exports.json').write_text(json.dumps(receipts, indent=2), encoding='utf-8')
