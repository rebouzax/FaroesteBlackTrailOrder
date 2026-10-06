# Vida e dano dos chefes

Ajuste de 2026-10-05: +50% de vida e +25% de dano, arredondado para cima.
Valores centralizados em `src/config/stages.js`. O dano abaixo é o valor base;
armadura do campeão reduz o dano recebido e os projéteis dos chefes usam uma
fração desse valor, conforme o sistema de combate.

| Fase | Chefe | Vida | Dano base |
| --- | --- | ---: | ---: |
| Deserto | Morcego Gigante | 675 | 27 |
| Deserto | Chupacabra de Fogo | 1050 | 34 |
| Deserto | Marechal das Sombras | 1425 | 43 |
| Mina | Ghoul | 825 | 29 |
| Mina | Wendigo | 1275 | 37 |
| Mina | General Mineiro | 1800 | 44 |
| Cidade | Cerberus | 1575 | 33 |
| Cidade | Devorador de Almas | 2250 | 39 |
| Cidade | Carrasco Acorrentado | 3300 | 48 |

Horários de aparição, velocidade e recompensas permanecem definidos por chefe.
