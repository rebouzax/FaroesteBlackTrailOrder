# Bosses reservados para fases futuras

Sete arquivos `.blend` fornecidos pelo jogador foram inspecionados com Blender 5.2.2, sem salvar alterações nos originais. O utilitário `game-dev` não está instalado; a inspeção usou a API local do Blender. O relatório `future-bosses.json` registra hashes, malhas, rigs, ações e referências de textura.

Cerberus, o modelo `gob_bod4_non5_rig3_a10` (Devorador de Almas) e ChainedDemon (Carrasco Acorrentado) estão integrados como chefes da fase III, Cidade Fantasma. `wizard2.blend` é a base da Dama Malvina no capítulo IV, Salão Fantasma, com rig e clips gerados no GLB derivado. Os demais continuam reservados para futuras fases. Nenhum desses novos bosses participa das ondas de inimigos comuns.

As exportações preservam os arquivos originais e usam texturas embutidas de até 512 pixels. Os slots antigos de animação sem tipo de alvo foram convertidos para objetos, recuperando as cinco ações do Cerberus. `city-boss-exports.json` registra origem/texturas/hashes; `city-glb-inspection.json` registra inspeção dos GLBs, rigs, animações, imagens embutidas e valores numéricos finitos. A importação visual em Three.js é conferida separadamente.

A ação original do ChainedDemon referenciava ossos de outro rig e exportava apenas transformações constantes. Foram criados clips próprios `Idle`, `Walk`, `Attack` e `Hit`, com os braços baixos e movimento de pernas, tronco e cabeça, no arquivo GLB derivado. O original `.blend` foi preservado. O eixo frontal do Devorador foi corrigido em +90° no wrapper visual do jogo.

| Fonte | Situação observada |
| --- | --- |
| `werebear.blend` | Rig com 35 ossos; ações carregadas sem duração. Referência `werebear_texture.png` não encontrada. A plataforma de apresentação deve ser excluída da futura exportação. |
| `TheMobileCactus.blend` | Rig com 28 ossos e textura embutida; nenhuma ação carregada. |
| `gob_bod4_non5_rig3_a10.blend` | Rig com 40 ossos e 21 ações, incluindo corrida, voo, ataque e dano. Referência antiga `Texture_SkullFlesh1.png`; conferir correspondência com `materialtexture_skullflesh1.png` antes da exportação. |
| `wizard2.blend` | Malha sem armature nem ações. Texturas principais disponíveis; referência adicional `sorcerer-spider_0.png` ausente. Precisa de rig ou animação própria. |
| `cerberus_v002.blend` | Rig com 48 ossos, textura disponível e ações `Walk`, `Idle`, `Attack`, `hit`, `die`. |
| `ChainedDemon.blend` | Rig com 73 ossos, duas ações e textura disponível/embutida. Identificar o conteúdo das ações antes de mapear estados de combate. |
| `low_poly_raptor.blend` | Duas variantes, cada uma com rig de 41 ossos. Texturas locais disponíveis, mas nenhuma ação carregada. |

O Blender informou incompatibilidade de animação em arquivo anterior à versão 2.50 e recomendou uma conversão intermediária no Blender 4.5. A ausência de ações no relatório não garante que o arquivo original não tenha animações antigas.

Os arquivos `.blend1`, `.blend2`, `.DS_Store` e previews não são modelos adicionais. O OBJ do ChainedDemon não é a fonte preferencial para animação porque não transporta o rig do `.blend`.

Próxima integração: recuperar referências de textura, preservar ações antigas, definir postura/eixo frontal, exportar GLB e conferir movimento, ataques, dano e escala antes de associar cada criatura a uma fase.
