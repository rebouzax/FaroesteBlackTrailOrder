# Capítulo IV — Salão Fantasma

O mapa é um interior de saloon western assombrado, inspirado na referência conceitual fornecida pelo usuário. Para jogar o capítulo IV na campanha ou no modo livre, conclua a Cidade Fantasma; o acesso depende do progresso salvo no navegador.

## Espaço e combate

- Salão de 48 × 58 metros com pista central, bar com garrafas e bancos, piano com teclas, palco com cortinas, mesas e colunas.
- Galeria em U a 4,4 metros do chão, ligada por uma escada de 28 degraus à direita. A navegação usa uma malha de rotas que conecta os dois pisos e contorna obstáculos.
- Colisões por altura permitem circular sob a galeria e impedem atravessar paredes, móveis e guarda-corpos. Projéteis atingem pisos, obstáculos e alvos em 3D.
- Experiência, moedas, bandagens, baús e Bento permanecem no piso em que aparecem. A coleta exige proximidade em altura.
- Luar frio, lamparinas oscilantes, madeira com texturas de 64 pixels, teias e poeira usam a mesma renderização PSX das outras fases. Não há chuva, areia ou tornado dentro do salão.
- Inimigos: cobras, morcegos, aranhas, esqueletos, zumbis e fantasmas; até 48 criaturas simultâneas. As ondas se intensificam ao longo dos 15 minutos.

## Chefes

| Tempo de fase | Chefe | Vida | Dano de contato | Comportamento |
| --- | --- | --- | --- | --- |
| 03:00 | Viúva do Salão | 1.800 | 36 | Aranha gigante, perseguição e contato |
| 07:00 | Barman das Cinzas | 2.450 | 42 | Esqueleto 30% maior; marca o local do jogador por 0,85 s antes de lançar Molotov em arco; fogo por 4,5 s |
| 13:00 | Dama Malvina | 3.600 | 48 | Levitação, flanqueamento, dança, bola de fogo, invocação e aura; retirada para cobertura após dano concentrado |

O tempo da fase pausa enquanto há chefes vivos. As barras acompanham cada chefe e aparecem de perto. Recompensas base: 100, 300 e 700 moedas, além de experiência.

Malvina alterna os três ataques, com preparação de 0,8 s. A aura tem raio de 4,2 metros e duração de 5 s. Mais de 12% de sua vida em dano acumulado recentemente provoca retirada e invocação de reforços; o intervalo mínimo entre retiradas é 14 s. As invocações respeitam o limite de criaturas. O dano de fogo considera altura, obstáculos e a proteção temporária após sofrer dano.

Submissões: abater 12 aranhas, abater 15 esqueletos e libertar 10 fantasmas nas janelas de tempo indicadas. Chefes e conclusão liberam cartas do catálogo, incluindo Tempestade do Saloon, Fogo do Pântano e Nuvem de Corvos.

## Assets e áudio

`public/models/saloon-malvina.glb` deriva de `wizard2.blend` e `texture_low.png`, fornecidos pelo usuário. A fonte não tinha rig nem ações; a exportação cria um rig espacial e clips Hover, Cast, Dance e Hurt. A textura é embutida com 512 pixels. O original não foi salvo ou alterado. Os recibos de exportação e inspeção ficam em `docs/assets/malvina-*.json`; o script reproduzível é `tools/export_malvina.py`.

A arte do menu é `public/art/menu/saloon.png`, gerada para esta fase; a procedência e o prompt estão em `docs/assets/saloon-art.md`. Os modelos de inimigos existentes são reutilizados, e a estrutura do saloon é construída em Three.js.

A música própria ainda será enviada pelo usuário. O capítulo IV mantém efeitos sonoros e não reproduz uma trilha de outra fase como substituição.

Prévia visual local, disponível apenas em desenvolvimento: `/?preview=saloon`, com `&angle=upper` para a galeria e `&angle=witch` para o modelo animado. Não modifica o progresso da campanha.
