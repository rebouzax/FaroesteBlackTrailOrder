# Bosses reservados para fases futuras

Sete arquivos `.blend` fornecidos pelo jogador foram inspecionados com Blender 5.2.2, sem salvar alterações nos originais. O utilitário `game-dev` não está instalado; a inspeção usou a API local do Blender. O relatório `future-bosses.json` registra hashes, malhas, rigs, ações e referências de textura.

Estes modelos ainda não estão integrados às ondas, ao bestiário ou aos chefes das duas fases atuais. São candidatos a bosses; a possibilidade de virarem inimigos comuns depende das futuras fases III e IV. Nenhum desbloqueio novo foi definido.

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
