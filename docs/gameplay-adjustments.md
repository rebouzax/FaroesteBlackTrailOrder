# Clima, arremessos e retorno à preparação

## Ambientes

Eventos climáticos são permitidos somente em `desert` e `ghostTown`.
O sistema de simulação limpa qualquer evento residual nos interiores e a view
não renderiza partículas, funil, raios ou luz de relâmpago na Mina e no Salão.
Os ataques de fogo de Malvina continuam pertencendo ao combate.

Na Mina, cobras e escorpiões usam escala **1,8**. Na Cidade Fantasma, usam
escala **2,1**, para ficarem mais visíveis nas ruas abertas. Altura, posicionamento
no chão, raio da horda e margem de spawn acompanham a escala do modelo.
Deserto e Salão mantêm o tamanho habitual desses inimigos.

Os três chefes da Cidade Fantasma usam escala **2,3**, em vez de **2,7**:
uma redução de aproximadamente 15%, com altura e colisores calculados a partir
dos modelos redimensionados.

## Disparo Duplicado e bombas

Molotov, Bomba Pirata e Pavio do Condenado compartilham a distribuição:

| Nível de Disparo Duplicado | Arremessos por ativação | Distribuição |
| ---: | ---: | --- |
| 0 | 1 | Mira automática no alvo |
| 1 | 2 | Frente e trás |
| 2 | 3 | Acrescenta a esquerda |
| 3 | 4 | Acrescenta a direita |
| 4 | 5 | Acrescenta uma diagonal |
| 5 | 6 | Acrescenta outra diagonal |
| 6 | 7 | Círculo completo com ângulos igualmente espaçados |

A orientação é capturada no início da ativação. Cada lançamento sai da posição
atual do campeão com intervalo de 0,12 s e trajetória balística. O raio depende
do alcance da habilidade e da distância inicial do alvo. Os objetos do cenário
e os pisos continuam bloqueando a trajetória; uma parede próxima pode antecipar
a explosão. Há limites de 32 arremessos simultâneos e 32 áreas de fogo para
manter os efeitos visuais e o custo de simulação limitados.

## Vitória e derrota

- Vitória: o botão **Voltar · Escolher campeão** abre a seleção de campeão.
- Derrota: uma inscrição **Você morreu** aparece por 2,6 s, seguida do modal.
  **Voltar · Escolher mapa** abre a seleção do mapa com o campeão atual.
- Com redução de movimento, a inscrição fica estática por 1,4 s.
- A volta limpa inimigos, drops, projéteis, itens e efeitos da execução anterior,
  reinicia os temporizadores e mantém o perfil persistente.
- Chefes e submissões continuam desbloqueando conteúdo, sem toasts de liberação
  durante o gameplay. Avisos de clima, bandagem e tesouro permanecem.

## Cidade Fantasma e Bento

A cidade recebeu cercas de quintais com entradas e cruzamentos livres,
árvores secas, barris e caixões. Os cânions ficam fora da área caminhável.
No lado oeste há trilhos, um pequeno depósito, locomotiva, tender e vagões
abandonados. Peças repetidas dos trilhos, trens, cercas e cânions usam instâncias;
os objetos sólidos possuem colisores. A luz da locomotiva oscila e uma névoa
sutil sobe da chaminé.

O rig procedural de Bento possui braços e antebraços separados, com cotovelos
dobrados e mãos à frente do torso. A animação mantém os braços cruzados e inclui
respiração e pequenos movimentos de cabeça. Ao se aproximar, um marcador
flutuante oscila acima dele. Uma seta na HUD indica sua direção e distância
quando está a até 65 m, incluindo indicação de piso diferente no Salão.
