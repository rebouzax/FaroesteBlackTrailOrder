# Bento — loja e cartas exclusivas

A loja usa duas abas, seleção de produto, comparação do bônus atual com o próximo,
preço, requisito da campanha e retorno da compra. O estoque usa páginas com quatro
itens, ou dois em telas compactas. A preparação e o encontro no mapa compartilham
o mesmo layout, com retrato PSX, couro, ferro e dourado. Conteúdo ainda não
descoberto aparece em cinza com `?`.

## Melhorias permanentes

Bento abre após derrotar o primeiro chefe na campanha. As nove melhorias são
compradas com o saldo salvo e aplicadas no início das próximas jornadas.

| Melhoria | Bônus por nível | Disponibilidade |
| --- | --- | --- |
| Arma temperada | +2 de dano | Primeiro chefe |
| Fôlego da fronteira | +10 de vida máxima | Primeiro chefe |
| Botas de viagem | +0,25 de velocidade | Primeiro chefe |
| Couro dos condenados | +1 de armadura | Concluir Deserto |
| Mecanismo de prata | +2,5% de cadência | Concluir Deserto |
| Mira de caçador | +0,8 ponto percentual de chance crítica | Concluir Mina |
| Bússola das almas | +0,35 m de coleta | Concluir Mina |
| Bolsa do garimpeiro | +2,5% de moedas | Concluir Cidade Fantasma |
| Cantil do peregrino | +0,08 de vida/s | Concluir Cidade Fantasma |

Todas chegam ao nível 10. O limite de compra progride com a campanha:
nível 3 após o primeiro chefe, 5 após o Deserto, 7 após a Mina, 9 após a Cidade
Fantasma e 10 após o Salão Fantasma (capítulo IV). O preço sobe com o nível:
`preço-base × (nível atual + 1) + 15 × nível atual²`.

## Onze relíquias de Bento

As conquistas liberam o estoque; a carta só passa a pertencer ao jogador **após a
compra**. Cada licença é comprada uma única vez. Depois, equipe a carta no
Arsernal para recebê-la nas ofertas de nível. As onze relíquias evoluem até o
nível 5 em cada partida.

| Carta | Moedas | Estoque liberado após | Efeito |
| --- | ---: | --- | --- |
| Ampulheta de Bento | 300 | Primeiro chefe | +4% de cadência por nível |
| Moeda da Misericórdia | 380 | Deserto | Drops de moeda curam 1–5 de vida |
| Estrela da Sorte | 420 | Deserto | +8% de moedas e XP por nível |
| Sino das Cinzas | 480 | Deserto | Onda periódica com dano e empurrão |
| Sela do Relâmpago | 500 | Mina | +5% de velocidade por nível |
| Bala do Trem Negro | 650 | Mina | Projétil espectral que atravessa inimigos |
| Chumbo Fantasma | 620 | Cidade Fantasma | Dano, alcance e perfuração adicional dos projéteis |
| Lanterna do Túmulo | 720 | Cidade Fantasma | Chamas espectrais orbitam e causam dano por contato |
| Pavio do Condenado | 760 | Viúva do Salão | Dinamite em arco, explosão e fogo residual |
| Contrato de Sangue | 820 | Barman das Cinzas | +8 de vida máxima por nível e cura por abate |
| Espelho da Meia-Noite | 900 | Dama Malvina | Armadura e onda de retaliação ao sofrer dano; intervalo de 7 s |

O catálogo do mercador importado de Faroeste Survivors também pode ser comprado
quando seu requisito corresponde a um dos capítulos implementados. Cartas de
capítulos futuros continuam fora do estoque. As fusões existentes mantêm suas
receitas e requisitos; a compra atualiza as receitas disponíveis.

Bala do Trem Negro e Pavio do Condenado combinam com Disparo Duplicado. Os
arremessos de Pavio se espalham em direções distintas e formam um círculo no
nível máximo de Disparo Duplicado, assim como Molotov e Bomba Pirata. Bônus
globais compatíveis de dano, alcance, cadência e crítico são aplicados aos
ataques. Ondas e órbitas não são duplicadas. Paredes e pisos bloqueiam tiros,
explosões e as novas ondas; a lanterna não acerta através de uma parede.

## Bento durante a partida

O encontro pausa a simulação e oferece sete suprimentos: dano, bandagem,
velocidade, armadura, cadência, alcance e coleta. Cada melhoria tem cinco níveis;
a bandagem pode ser comprada novamente quando a vida estiver incompleta. Esses
bônus terminam com a partida.

Na aba de cartas, comprar uma licença nova ativa o nível 1 imediatamente e
guarda a licença no perfil. Cartas já adquiridas podem ser ativadas ou evoluídas
por `90 + 70 × nível atual` moedas. Também entram nas ofertas de evolução da
partida atual; o deck persistente de 3–8 cartas continua sendo montado no
Arsernal pelo jogador.

Somente moedas ganhas na partida podem ser gastas no encontro do mapa. O mesmo
valor também é descontado do saldo salvo, pois os drops já são creditados nele.
O saldo nunca é descontado duas vezes pela mesma compra. Compras anteriores,
moedas, descobertas e deck são preservados na migração do perfil existente.

## Organização

- `src/config/bentoShop.js`: estoque, preços, progressão e bônus permanentes.
- `src/config/bentoCards.js`: relíquias e descrição dos efeitos por nível.
- `src/viewmodels/BentoShopModel.js`: apresentação dos produtos e disponibilidade.
- `src/views/MerchantShopView.js` / `src/bento-shop.css`: layout compartilhado.
- `MenuModel`, `WorldModel`, `GameViewModel` e `AbilitySystem`: salvamento,
  aplicação dos bônus, compras durante a partida e combate.
