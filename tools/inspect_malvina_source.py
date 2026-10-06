import bpy, json
from pathlib import Path
source=Path(r'C:\Users\JC INFORMATICA\Downloads\Modelos Psx 3d\wizard2.blend')
bpy.ops.wm.open_mainfile(filepath=str(source),load_ui=False,use_scripts=False)
print('MALVINA_SOURCE',json.dumps({'objects':[(o.name,o.type) for o in bpy.data.objects],
  'actions':[(a.name,list(a.frame_range)) for a in bpy.data.actions],
  'images':[(i.name,i.filepath,list(i.size)) for i in bpy.data.images],
  'bones':[(o.name,[b.name for b in o.data.bones]) for o in bpy.data.objects if o.type=='ARMATURE']}))
