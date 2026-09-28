# Faroeste: Black Road Order

Protótipo web em Three.js e Vite para a continuação FPS bullet-hell de Faroeste Survivors. Esta primeira entrega cobre a exploração em primeira pessoa da fase **Deserto dos Condenados**, com ambientação inspirada na primeira fase do jogo original, **Deserto dos Esquecidos**.

## Rodar

```sh
npm install
npm run dev
```

Clique em **Entrar no deserto** para capturar o mouse.

| Ação | Controle |
| --- | --- |
| Andar | W, A, S, D ou setas |
| Olhar | Mouse |
| Correr | Shift |
| Liberar cursor | Esc |

## Arquitetura

- `src/models/WorldModel.js`: estado da fase e do jogador.
- `src/viewmodels/GameViewModel.js`: entrada, movimento e colisões.
- `src/views/GameView.js`: Three.js, cenário, HUD, câmera e pipeline PSX.
- `src/app/GameApplication.js`: composição da aplicação.

O renderizador segue as recomendações de `threejs-psx-shader`: antialias desligado, framebuffer virtual de 240 linhas, dithering, paleta reduzida, fog e vertex snapping. A lib original e sua licença MIT estão preservadas em `src/vendor/threejs-psx-shader`. Os modelos deste protótipo são carregados com Draco pelo decoder local em `public/draco`.

O cenário mistura relevo low-poly procedural, carroças, linha telegráfica, cactos, dunas e marcos de cemitério. Os GLBs compactos de dunas, estrada, poste, árvore seca, lápide e caixão foram selecionados da pasta de modelos fornecida para o projeto.

## Inspirações e origem dos recursos

- Jogo de origem: `C:\projetos\webjogos\FaroesteSuvivors`.
- Pipeline PSX: `C:\projetos\webjogos\Thees.js\psx\threejs-psx-shader-main`.
- Modelos: pasta de modelos 3D fornecida pelo usuário.
- Controles de câmera: `PointerLockControls` do Three.js.

O combate bullet-hell, campeões, chefes, cartas e progressão ficam para etapas seguintes; esta versão estabelece a base de navegação e identidade visual da primeira fase.
