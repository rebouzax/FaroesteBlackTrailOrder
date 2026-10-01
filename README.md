# Faroeste: Black Trail Order

Continuação de **Faroeste Survivors** em formato **FPS bullet-hell**, com gráficos inspirados no PlayStation original e uma mistura de faroeste com fantasia sombria. Feito para navegador com **Three.js**, **Vite** e arquitetura **MVVM**, com controles para computadores, tablets e smartphones.

O projeto está em desenvolvimento. Atualmente conta com duas fases, três campeões, ataques automáticos, evolução por cartas e uma campanha com desbloqueios persistentes.

## O jogo atual

- **Campanha:** partidas de 15 minutos, com três chefes por fase e submissões que desbloqueiam conteúdo.
- **Modo livre:** hordas sem limite de tempo, usando o conteúdo conquistado; não concede progressão da campanha.
- **Combate em primeira pessoa:** movimentação relativa à direção da câmera e ataques automáticos contra inimigos à frente, dentro do alcance da arma.
- **Evolução:** todos os inimigos derrotados deixam experiência; ao subir de nível, o jogador escolhe uma carta de habilidade.
- **Coleta:** alguns inimigos comuns deixam moedas no valor base de 15. Em cada fase, o primeiro chefe deixa 100 moedas, o segundo 300 e o terceiro 700. O atributo de fortuna aumenta o valor recebido. Bandagens recuperam vida e baús temporários concedem moedas.
- **Chefes:** o relógio da campanha e das submissões pausa durante o confronto. A barra de vida acompanha o chefe e aparece quando o jogador se aproxima.
- **Armas na tela:** chicote, revólver e escopeta com animações de movimentação e ataque, sem mãos visíveis. O chicote empurra os inimigos atingidos.
- **Áudio:** trilhas por fase, passos de botas, disparos e efeitos de habilidades.

### Fases

| Capítulo | Cenário | Inimigos e chefes |
| --- | --- | --- |
| I — Deserto dos Condenados | Estrada sob a lua, casas abandonadas, postes, cercas, cactos, covas e cânions | Morcegos, cães, esqueletos e mortos da fronteira. Chefes: Morcego Gigante, Chupacabra de Fogo e Marechal das Sombras. |
| II — Mina dos Condenados | Caverna de mineração com trilhos, objetos de mina e ouro amaldiçoado | Cobras, escorpiões, aranhas, mineiros, zumbis e fantasmas. Chefes: Ghoul, Wendigo da Mina e General Mineiro. |

As fases III e IV ainda não estão implementadas. Sete novos modelos foram inspecionados como candidatos a bosses dessas fases; alguns precisam de ajustes de texturas, rigs ou recuperação de animações. Eles ainda não participam das partidas. Consulte o [catálogo de bosses futuros](docs/assets/future-bosses.md).

### Campeões

| Campeão | Arma base | Como desbloquear |
| --- | --- | --- |
| João Vaqueiro | Chicote | Disponível no início |
| Maria Bonita | Revólver | Completar a submissão de abater 10 morcegos no Deserto |
| Labuta | Escopeta | Completar a submissão de recolher 8 moedas no Deserto |

## Campanha e preparação

Um perfil novo começa com **João Vaqueiro**, o **Deserto dos Condenados**, o bestiário vazio e seis cartas liberadas: Pistola do Sertão, Molotov, Coração de Vaqueiro, Ferraduras Malditas, Disparo Duplicado e Olho de Chumbo.

Concluir submissões e derrotar chefes libera campeões, cartas e acesso ao mercador. Para abrir a Mina, é necessário sobreviver aos 15 minutos do Deserto e derrotar seus três chefes. A descoberta de criaturas no bestiário acontece ao derrotá-las na campanha.

O fluxo dos menus é **Novo Jogo → Modo → Campeão → Mapa → Começar Partida**. Na seleção de mapa, também estão disponíveis:

- **Arsernal:** consultar cartas e montar um deck de 3 a 8 cartas para as ofertas de evolução durante a partida.
- **Bestiário:** consultar as criaturas já descobertas.
- **Bento:** comprar melhorias permanentes de dano, vida e velocidade com moedas, após desbloquear o mercador. Bento também aparece no mapa para oferecer melhorias da partida.

Os menus usam páginas e encaixe na tela para dispensar rolagem. Os cartões dos campeões exibem somente o retrato em pose heroica e o nome; campeões bloqueados permanecem indisponíveis. Bento possui um retrato próprio em estilo PSX de vendedor nômade.

O progresso e as configurações são salvos no **armazenamento local do navegador**, sem conta ou sincronização entre aparelhos. Conquistas, moedas, compras e descobertas permanecem após uma derrota. As regras e recompensas detalhadas estão em [Progressão da campanha](docs/campaign-progression.md).

## Controles

| Ação | Computador | Smartphone / tablet |
| --- | --- | --- |
| Andar | W / S: frente / trás; A / D: esquerda / direita. Também aceita setas. | Controle virtual à esquerda |
| Olhar | Mouse | Arrastar a metade direita da tela |
| Atacar | Automático, na direção da visão e dentro do alcance | Automático |
| Pausar / liberar cursor | Esc | Botão Ⅱ |
| Ajustar sensibilidade | Configuração → sensibilidade do mouse | Configuração → sensibilidade do toque |

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
| `src/views/AbilityEffectsView.js` | Efeitos visuais das habilidades |
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

Os arquivos usados pelo jogo estão em `public/audio/`.

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
