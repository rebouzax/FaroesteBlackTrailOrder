"""Read user-supplied Blender scenes without changing their source files."""
import bpy
import hashlib
import json
from pathlib import Path

SOURCE = Path(r'C:\Users\JC INFORMATICA\Downloads\Modelos Psx 3d')
OUTPUT = Path(__file__).resolve().parents[1] / 'docs/assets/future-bosses.json'
FILES = ['werebear.blend', 'TheMobileCactus.blend', 'gob_bod4_non5_rig3_a10.blend',
         'wizard2.blend', 'cerberus_v002.blend', 'ChainedDemon.blend', 'low_poly_raptor.blend']
report = []
for filename in FILES:
    source = SOURCE / filename
    record = {'source': filename, 'role': 'boss', 'futureCommonEnemyStages': [3, 4], 'spawnEnabled': False,
              'status': 'source-inspected', 'license': 'user-supplied; unspecified',
              'sha256': hashlib.sha256(source.read_bytes()).hexdigest()}
    try:
        bpy.ops.wm.open_mainfile(filepath=str(source), load_ui=False, use_scripts=False)
        record['meshes'] = [{'name': o.name, 'vertices': len(o.data.vertices),
                             'dimensions': [round(v, 4) for v in o.dimensions]}
                            for o in bpy.data.objects if o.type == 'MESH']
        record['rigs'] = [{'name': o.name, 'bones': len(o.data.bones)}
                          for o in bpy.data.objects if o.type == 'ARMATURE']
        record['actions'] = [{'name': a.name, 'frames': list(a.frame_range)} for a in bpy.data.actions]
        record['textures'] = []
        for image in bpy.data.images:
            if image.source != 'FILE':
                continue
            raw = Path(bpy.path.abspath(image.filepath))
            local = SOURCE / raw.name
            record['textures'].append({'name': image.name, 'packed': bool(image.packed_file),
                                       'exists': raw.is_file(), 'localMatch': local.name if local.is_file() else None})
    except Exception as error:
        record['status'] = 'inspection-failed'
        record['error'] = str(error)
    report.append(record)
OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print('BOSS_INSPECTION ' + str(OUTPUT))
