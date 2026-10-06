# Faroeste: Black Trail Order

Continuação de **Faroeste Survivors** em formato **FPS bullet-hell**, com gráficos inspirados no PlayStation original e uma mistura de faroeste com fantasia sombria. Feito para navegador com **Three.js**, **Vite** e arquitetura **MVVM**, com controles para computadores, tablets e smartphones.

O projeto está em desenvolvimento. Atualmente conta com quatro fases (capítulos I, II, III e IV), quatro campeões, ataques automáticos, evolução por cartas e uma campanha com desbloqueios persistentes.

## O jogo atual

- **Campanha:** partidas de 15 minutos, com três chefes por fase e submissões que desbloqueiam conteúdo.
- **Modo livre:** hordas sem limite de tempo, usando o conteúdo conquistado; não concede progressão da campanha.
- **Combate em primeira pessoa:** movimentação relativa à direção da câmera e ataques automáticos contra inimigos à frente, dentro do alcance da arma.
- **Evolução:** todos os inimigos derrotados deixam experiência; ao subir de nível, o jogador escolhe uma carta de habilidade.
- **Coleta:** alguns inimigos comuns deixam moedas no valor base de 15. Em cada fase, o primeiro chefe deixa 100 moedas, o segundo 300 e o terceiro 700. O atributo de fortuna aumenta o valor recebido. Bandagens recuperam vida e baús temporários concedem moedas.
- **Chefes:** o relógio da campanha e das submissões pausa durante o confronto. A barra de vida acompanha o chefe e aparece quando o jogador se aproxima.
- **Dificuldade dos chefes:** vida aumentada em 50% e dano em 25% (arredondado para cima) nos nove chefes dos capítulos I–III; o capítulo IV tem três chefes próprios. Os valores estão centralizados em `src/config/stages.js`.
- **Armas na tela:** chicote, revólver e escopeta com animações de movimentação e ataque, sem mãos visíveis. O chicote empurra os inimigos atingidos.
- **Áudio:** trilhas por fase, passos de botas, disparos e efeitos de habilidades.
- **Física de projéteis:** colisão contínua em 3D com inimigos e cenário, dispersão e perda de dano da escopeta com distância, arremessos em arco, bumerangues com retorno gradual e balas mágicas com atração limitada ao alvo.
- **Colisão da horda:** corpos proporcionais ao modelo, desvio entre vizinhos, separação de sobreposições e respeito aos obstáculos. Chefes têm maior resistência ao deslocamento.
- **Sinergias de cartas:** Disparo Duplicado repete ataques completos de armas e habilidades de projéteis, incluindo salvas de escopeta, magias e bumerangues. Molotov e dinamite se espalham à frente, atrás, nas laterais e nas diagonais, até sete arremessos em círculo no nível máximo. Bônus de dano, alcance, cadência e crítico também interagem com os ataques compatíveis. Chicote, auras e ferraduras não são duplicados.
- **Clima:** somente no Deserto dos Condenados e na Cidade Fantasma, com chuva e raios sinalizados no chão, tempestades de areia e pequenos tornados que atraem e ferem jogador e inimigos próximos. Mina e Salão Fantasma não têm eventos climáticos.
- **Fim da jornada:** vitória retorna à escolha de campeão pelo botão Voltar. A morte mostra uma animação de “Você morreu” antes do modal; Voltar abre a escolha de mapa. É possível começar outra partida sem recarregar a página, mantendo o progresso salvo.

### Fases

| Capítulo | Cenário | Inimigos e chefes |
| --- | --- | --- |
| I — Deserto dos Condenados | Estrada sob a lua, casas abandonadas, postes, cercas, cactos, covas e cânions | Morcegos, cães, esqueletos e mortos da fronteira. Chefes: Morcego Gigante, Chupacabra de Fogo e Marechal das Sombras. |
| II — Mina dos Condenados | Caverna de mineração com trilhos, objetos de mina e ouro amaldiçoado, sem clima externo | Cobras e escorpiões ampliados em 80%, aranhas, mineiros, zumbis e fantasmas. Chefes: Ghoul, Wendigo da Mina e General Mineiro. |
| III — Cidade Fantasma | Mapa maior que o Deserto, com avenida, ruas laterais, 43 construções, saloons, igreja, mais cercas e árvores, cemitério, cânions e uma estação com locomotiva e vagões abandonados no lado oeste | Fantasmas, cobras e escorpiões em escala 2,1×, morcegos, ghouls, zumbis e esqueletos que arremessam machados. Chefes: Cerberus, Devorador de Almas e Carrasco Acorrentado, com tamanho reduzido em aproximadamente 15%. |
| IV — Salão Fantasma | Interior macabro com bar, piano, palco, mesas, janelas de luar, escada e uma galeria no segundo andar | Cobras, morcegos, esqueletos, zumbis, fantasmas e aranhas. Chefes: Viúva do Salão (aranha gigante), Barman das Cinzas (esqueleto com Molotov) e Dama Malvina. |

O capítulo IV, Salão Fantasma, fica disponível ao concluir a Cidade Fantasma. Quatro dos sete modelos de bosses fornecidos já estão integrados, incluindo `wizard2.blend` como base de Malvina. Consulte o [catálogo de bosses](docs/assets/future-bosses.md).

No **Salão Fantasma**, colisões e navegação consideram a altura dos pisos: jogador e inimigos podem usar a escada, e projéteis respeitam a galeria e os obstáculos. O esqueleto chefe marca a posição do jogador antes de lançar Molotov em arco; as chamas ficam no piso atingido. **Malvina** levita, dança, flanqueia e alterna bolas de fogo, invocação de esqueletos e aura de fogo. Ao receber muito dano em pouco tempo, procura cobertura e chama reforços. O interior tem poeira, teias e luzes oscilantes, sem eventos climáticos externos. Detalhes em [Salão Fantasma](docs/salao-fantasma.md).

### Campeões

| Campeão | Arma base | Como desbloquear |
| --- | --- | --- |
| João Vaqueiro | Chicote | Disponível no início |
| Maria Bonita | Revólver | Completar a submissão de abater 10 morcegos no Deserto |
| Labuta | Escopeta | Completar a submissão de recolher 8 moedas no Deserto |
| Ana Tiro Certo | Duas pistolas, com tiros e recuo alternados | Concluir os 15 minutos da Cidade Fantasma e derrotar seus três chefes |

Todas as cartas liberadas podem integrar o deck de qualquer campeão. A **Pistola do Sertão** adapta sua apresentação: João e Labuta usam uma arma auxiliar; Maria dispara uma rajada com seu próprio revólver; Ana ganha dano e cadência nas duas pistolas existentes, sem invocar uma terceira arma. As descrições no Arsenal e na escolha de nível refletem o campeão selecionado.

## Campanha e preparação

Um perfil novo começa com **João Vaqueiro**, o **Deserto dos Condenados**, o bestiário vazio e seis cartas liberadas: Pistola do Sertão, Molotov, Coração de Vaqueiro, Ferraduras Malditas, Disparo Duplicado e Olho de Chumbo.

Concluir submissões e derrotar chefes libera campeões, cartas e acesso ao mercador. Para abrir a Mina, é necessário sobreviver aos 15 minutos do Deserto e derrotar seus três chefes. Concluir a Mina libera a Cidade Fantasma; concluir a Cidade Fantasma libera o Salão Fantasma. Cada fase segue a estrutura de 15 minutos e três chefes. A descoberta de criaturas no bestiário acontece ao derrotá-las na campanha.

O fluxo dos menus é **Novo Jogo → Modo → Campeão → Mapa → Começar Partida**. Na seleção de mapa, também estão disponíveis:

- **Arsernal:** consultar cartas e montar um deck de 3 a 8 cartas para as ofertas de evolução durante a partida.
- **Bestiário:** consultar as criaturas já descobertas.
- **Bento:** loja paginada com nove melhorias permanentes, até 10 níveis liberados conforme a campanha, e cartas exclusivas compradas com moedas. Durante a partida, oferece sete suprimentos e permite comprar, ativar e evoluir cartas. Consulte a [loja do Bento](docs/bento-shop.md).

As onze relíquias próprias de Bento incluem **Bala do Trem Negro**, **Sino das Cinzas**, **Lanterna do Túmulo**, **Pavio do Condenado**, **Contrato de Sangue** e **Espelho da Meia-Noite**. Conquistas liberam seu estoque; as cartas só entram no Arsernal após a compra. As licenças ficam salvas no perfil, e as relíquias evoluem até o nível 5 em cada partida. As cartas do catálogo importado do mercador também respeitam seus requisitos de campanha.

Os menus usam páginas e encaixe na tela para dispensar rolagem. A escolha de campeão e de mapa mostra um item por vez, com setas laterais clicáveis e suporte às teclas ← / →. Campeões exibem somente retrato em pose heroica e nome. Campeões, mapas, cartas e criaturas ainda não descobertos aparecem como “?” sobre fundo cinza; a confirmação permanece bloqueada até cumprir os requisitos. Bento possui um retrato próprio em estilo PSX de vendedor nômade.

No mapa, Bento mantém os braços cruzados com movimentos sutis de postura e um marcador flutuante que oscila quando o jogador se aproxima. Um indicador com seta e distância mostra sua direção a até 65 m. Avisos de desbloqueio de recompensas não interrompem a partida; as conquistas continuam sendo salvas.

O progresso e as configurações são salvos no **armazenamento local do navegador**, sem conta ou sincronização entre aparelhos. Conquistas, moedas, compras e descobertas permanecem após uma derrota. As regras e recompensas detalhadas estão em [Progressão da campanha](docs/campaign-progression.md).

## Controles

| Ação | Computador | Smartphone / tablet |
| --- | --- | --- |
| Andar | W / S: frente / trás; A / D: esquerda / direita. Também aceita setas. | Controle virtual à esquerda |
| Olhar | Mouse | Arrastar a metade direita da tela |
| Atacar | Automático, na direção da visão e dentro do alcance | Automático |
| Pausar / liberar cursor | Esc | Botão Ⅱ |
| Ajustar sensibilidade | Configuração → sensibilidade do mouse | Configuração → sensibilidade do toque |
| Ajustar áudio | Configuração → volumes de música e efeitos (0–100%) | Mesmos controles, com ajustes salvos no aparelho |

Ao começar uma partida em dispositivo móvel, o jogo solicita **tela cheia e orientação horizontal**. Se o navegador não permitir travar a orientação, um aviso pede para girar o aparelho e a simulação pausa enquanto a tela estiver em retrato. A disponibilidade de tela cheia depende do navegador. No iPhone/iPad, use **Compartilhar → Adicionar à Tela de Início** e abra pelo ícone para jogar sem a barra do navegador.

O áudio é liberado após uma interação com a página, conforme as restrições do navegador.

## Rodar localmente

Use **Node.js 22** e npm, seguindo a versão utilizada pelo workflow de publicação.

```sh
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite. No menu principal, escolha **Novo Jogo** para iniciar a preparação da partida.

Para gerar e visualizar a versão de produção:

```sh
npm run build
npm run preview
```

O build é gerado em `dist/`. Os modelos e as músicas utilizados pelo jogo ficam no próprio projeto; não é necessário ter as pastas originais de Downloads para jogar.

## Arquitetura e renderização

| Camada / módulo | Responsabilidade |
| --- | --- |
| `src/models/WorldModel.js` | Estado da partida, vida, experiência, habilidades, inimigos e progresso da execução |
| `src/models/MenuModel.js` | Perfil persistente, desbloqueios, deck, compras e configurações |
| `src/viewmodels/GameViewModel.js` | Entrada, movimentação, colisões, combate, ondas, chefes, coleta e submissões |
| `src/viewmodels/MenuViewModel.js` | Navegação dos menus, preparação e ações do perfil |
| `src/views/GameView.js` | Cena Three.js, câmera, armas, inimigos, animações e HUD |
| `src/views/MenuView.js` | Interface dos menus e catálogos paginados |
| `src/views/MineStage.js` | Construção do cenário da Mina |
| `src/views/GhostTownStage.js` | Construção da Cidade Fantasma e colisões das construções |
| `src/views/AbilityEffectsView.js` | Efeitos visuais das habilidades |
| `src/systems/ProjectilePhysics.js` | Interseção contínua de trajetórias com alvos e obstáculos em 3D |
| `src/systems/EnemySeparation.js` | Colisores da horda, desvio entre vizinhos e separação dos corpos |
| `src/systems/WeatherSystem.js` / `src/views/WeatherView.js` | Eventos climáticos, dano, atração e efeitos PSX |
| `src/services/GameAudio.js` | Músicas e efeitos sonoros |
| `src/config/` | Campeões, fases, habilidades, progressão e orientação dos inimigos |
| `src/app/GameApplication.js` | Composição e inicialização da aplicação |

O pipeline PSX combina resolução virtual reduzida, dithering, paleta limitada, neblina e vertex snapping. A biblioteca de referência e sua licença MIT estão preservadas em `src/vendor/threejs-psx-shader`. Os assets compactados usam o decoder Draco local em `public/draco/`.

### Trilhas sonoras

| Tela / fase | Música | Reprodução |
| --- | --- | --- |
| Menu | Seven Graves West | Loop da faixa |
| Deserto | Iron Boots on Barren Ground | Loop de 00:00 até 02:46 |
| Mina | The Prospector's Last Strike | Loop de 00:00 até 02:46 |
| Cidade Fantasma | Midnight at Gallows Creek | Primeira reprodução de 00:00 a 02:54; depois repete de 00:11 a 02:54 |
| Salão Fantasma | Aguardando nova composição | Efeitos sonoros ativos, sem trilha substituta |

Os arquivos usados pelo jogo estão em `public/audio/`.
Os pontos de loop estão em `src/config/music.js`. Pausar e retomar preserva a posição da música, inclusive a introdução exclusiva da primeira reprodução da Cidade Fantasma.

## Publicar no GitHub Pages

O workflow [Deploy Faroeste Black Trail Order](.github/workflows/deploy.yml) instala as dependências, compila e publica `dist/`.

1. No GitHub, abra **Settings → Pages** do repositório.
2. Em **Build and deployment**, selecione **GitHub Actions**.
3. Envie as alterações para `main` ou `faroesteblackroadorder`, branches configuradas no workflow. Também é possível executar o workflow manualmente em **Actions**.
4. Aguarde o deploy terminar e abra o endereço apresentado pela execução.

O Vite utiliza `base: './'` e os recursos da aplicação respeitam esse caminho, permitindo carregar arte, áudio, modelos e Draco no subdiretório do GitHub Pages.

## Arte e origem dos recursos

- Gameplay, campeões e habilidades adaptados de **Faroeste Survivors**.
- Pipeline visual baseado em **threejs-psx-shader**, com ajustes para o FPS.
- Modelos 3D e músicas fornecidos para o projeto.
- Logo, fundo dos menus e retratos adaptados à identidade de faroeste e fantasia sombria. O [registro do retrato do Bento](docs/assets/bento-portrait.md) inclui o prompt utilizado.
- O [registro de Ana Tiro Certo](docs/assets/ana-character-art.md) documenta o retrato gerado com ImageGen e seu prompt final.
