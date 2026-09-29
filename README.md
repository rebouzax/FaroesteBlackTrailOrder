# Faroeste: Black Trail Order

Jogo web em Three.js e Vite para a continuação FPS bullet-hell de Faroeste Survivors. A primeira fase é o **Deserto dos Condenados**, jogada à noite em primeira pessoa com renderização PSX.

## Rodar

```sh
npm install
npm run dev
```

No menu principal, clique em **Nova Jornada**. O jogo tenta capturar o cursor para controlar a câmera; se o navegador impedir a captura, o mouse continua movendo a visão dentro da janela.

Em celulares e tablets, a partida solicita tela cheia e orientação horizontal. Se o navegador não permitir travar a orientação, o jogo mostra um aviso em retrato e pausa a simulação até o aparelho ser girado para a horizontal.

| Ação | Controle |
| --- | --- |
| Andar | W, A, S, D ou setas; controle virtual à esquerda no celular/tablet |
| Olhar | Mouse; arraste a metade direita da tela no celular/tablet |
| Chicote do João | Automático ao se aproximar de um inimigo à frente |
| Liberar cursor | Esc |
| Pausar no celular/tablet | Botão Ⅱ |

## Arquitetura

- `src/models/WorldModel.js`: tempo da fase, vida, experiência, cartas, inimigos e chicote.
- `src/viewmodels/GameViewModel.js`: entrada, movimentação FPS, colisões, ataque automático, hordas, chefes e coleta.
- `src/views/GameView.js`: Three.js, menu, cenário, HUD, câmera, animações, cartas e pipeline PSX.
- `src/app/GameApplication.js`: composição da aplicação.

O renderizador segue as recomendações de `threejs-psx-shader`: antialias desligado, framebuffer virtual de 240 linhas, dithering, paleta reduzida, fog e vertex snapping. A lib original e sua licença MIT estão preservadas em `src/vendor/threejs-psx-shader`. Os modelos deste protótipo são carregados com Draco pelo decoder local em `public/draco`.

O cenário contém estrada reta de uma ponta à outra, linha telegráfica, cercas, cactos, casas velhas com luz de lampião, carroças, lápides e cânions ao fundo. A área caminhável é ampla. A arte de fundo do menu foi criada para este jogo.

O chicote automático usa alcance de cinco metros, intervalo base de 1,05 s e animação de 0,38 s, seguindo o João Vaqueiro original. Morcegos aparecem primeiro; cães entram após um minuto e esqueletos após três minutos. Todos os inimigos deixam experiência e alguns deixam moedas. A barra inferior mostra o nível e a experiência até o próximo; ao subir de nível, o jogador escolhe uma carta. Há chefes temporizados com projéteis e objetivo de sobreviver 15 minutos.

## GitHub Pages

O workflow `.github/workflows/deploy.yml` compila e publica o conteúdo de `dist` a cada push nas branches `faroesteblackroadorder` ou `main`. No repositório do GitHub, abra **Settings → Pages** e selecione **GitHub Actions** em *Build and deployment*. Depois de enviar os arquivos para uma dessas branches, a página ficará disponível no endereço informado pela execução **Deploy Faroeste Black Trail Order**. O Vite usa caminhos relativos para que arte, modelos e decoder Draco carreguem também no subdiretório do GitHub Pages.

## Inspirações e origem dos recursos

- Jogo de origem: `C:\projetos\webjogos\FaroesteSuvivors`.
- Pipeline PSX: `C:\projetos\webjogos\Thees.js\psx\threejs-psx-shader-main`.
- Modelos: pasta de modelos 3D fornecida pelo usuário.
- Controles de câmera: `PointerLockControls` do Three.js.

Esta versão reproduz o ciclo principal da primeira fase em FPS. Os valores e padrões avançados dos chefes, missões secundárias e o catálogo completo de cartas do jogo original ainda precisam de adaptação individual para o novo formato.
