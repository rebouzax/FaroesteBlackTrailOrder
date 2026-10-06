// Exclusive licenses are bought from Bento; levelling them is local to each run.
export const BENTO_CARDS={
  bentoHourglass:{name:'Ampulheta de Bento',icon:'⌛',suit:'MERCADOR',color:'steel',price:300,stats:{haste:.04},description:'Acelera armas e ataques automáticos.'},
  bentoMercyCoin:{name:'Moeda da Misericórdia',icon:'☥',suit:'MERCADOR',color:'heart',price:380,after:'desert',description:'Recolher moedas recupera vida.'},
  bentoLuckyStar:{name:'Estrela da Sorte',icon:'✣',suit:'MERCADOR',color:'heart',price:420,after:'desert',stats:{fortune:.08},description:'Aumenta moedas e experiência recebidas.'},
  bentoAshBell:{name:'Sino das Cinzas',icon:'♧',suit:'MERCADOR',color:'fire',price:480,after:'desert',active:true,description:'Uma onda de cinzas fere e empurra inimigos próximos.'},
  bentoSaddle:{name:'Sela do Relâmpago',icon:'➤',suit:'MERCADOR',color:'steel',price:500,after:'mine',stats:{speed:.05},description:'Mais mobilidade para qualquer campeão.'},
  bentoRailShot:{name:'Bala do Trem Negro',icon:'➶',suit:'MERCADOR',color:'steel',price:650,after:'mine',active:true,description:'Dispara chumbo espectral que atravessa inimigos.'},
  bentoGhostLead:{name:'Chumbo Fantasma',icon:'✧',suit:'MERCADOR',color:'steel',price:620,after:'ghostTown',description:'Fortalece projéteis e permite atravessar mais inimigos.'},
  bentoGraveLantern:{name:'Lanterna do Túmulo',icon:'✺',suit:'MERCADOR',color:'heart',price:720,after:'ghostTown',active:true,description:'Chamas espectrais orbitam o campeão e ferem ao tocar.'},
  bentoFuse:{name:'Pavio do Condenado',icon:'✹',suit:'MERCADOR',color:'fire',price:760,boss:'saloonSpider',active:true,description:'Dinamite que explode e deixa fogo no chão.'},
  bentoBloodPact:{name:'Contrato de Sangue',icon:'♥',suit:'MERCADOR',color:'heart',price:820,boss:'saloonSkeleton',stats:{health:8},description:'Mais vida máxima e cura ao derrotar inimigos.'},
  bentoMoonMirror:{name:'Espelho da Meia-Noite',icon:'◇',suit:'MERCADOR',color:'steel',price:900,boss:'damaMalvina',stats:{armor:1},description:'Receber dano dispara uma onda de retaliação.'},
};
export function bentoCardStats(id,level){
  const card=BENTO_CARDS[id],extra=Math.max(0,level-1);
  if(card?.stats)return Object.fromEntries(Object.entries(card.stats).map(([key,value])=>[key,value*level]));
  if(id==='bentoMercyCoin')return {heal:Math.min(5,level)};
  if(id==='bentoGhostLead')return {damage:2*level,range:.5*level,pierce:Math.floor(level/2)};
  if(id==='bentoRailShot')return {damage:24+8*extra,cooldown:Math.max(2.4,3.2-.15*extra),range:24,pierce:2+Math.floor(level/2)};
  if(id==='bentoAshBell')return {damage:16+6*extra,cooldown:Math.max(4.5,6-.3*extra),radius:4+.3*extra};
  if(id==='bentoGraveLantern')return {damage:10+3*extra,count:2+Math.floor(level/2),radius:3+.2*extra};
  if(id==='bentoFuse')return {damage:32+9*extra,cooldown:Math.max(4.5,6-.25*extra),radius:3.2+.2*extra,range:16,duration:3,fireDamage:4+2*extra};
  return {};
}
export function bentoCardDescription(id,level,attackRate=1){
  const s=bentoCardStats(id,level);
  if(id==='bentoHourglass')return `+${Math.round(s.haste*100)}% de cadência para armas e habilidades.`;
  if(id==='bentoMercyCoin')return `Recolher um drop de moedas cura ${s.heal} de vida, até a vida máxima.`;
  if(id==='bentoLuckyStar')return `+${Math.round(s.fortune*100)}% de moedas e experiência.`;
  if(id==='bentoSaddle')return `+${Math.round(s.speed*100)}% de velocidade de movimento.`;
  if(id==='bentoGhostLead')return `+${s.damage} de dano · +${s.range} m de alcance · projéteis atravessam ${s.pierce} alvos extras.`;
  if(id==='bentoRailShot')return `${s.damage} de dano · atravessa ${s.pierce} inimigos · a cada ${(s.cooldown/attackRate).toFixed(1)} s. Combina com Disparo Duplicado.`;
  if(id==='bentoAshBell')return `${s.damage} de dano e empurrão em ${s.radius.toFixed(1)} m · a cada ${(s.cooldown/attackRate).toFixed(1)} s.`;
  if(id==='bentoGraveLantern')return `${s.count} chamas orbitam em ${s.radius.toFixed(1)} m · ${s.damage} de dano por toque.`;
  if(id==='bentoFuse')return `${s.damage} de dano na explosão e ${s.fireDamage} de dano/s por ${s.duration} s · a cada ${(s.cooldown/attackRate).toFixed(1)} s. Combina com Disparo Duplicado.`;
  if(id==='bentoBloodPact')return `+${s.health} de vida máxima · abates recuperam ${level} de vida.`;
  if(id==='bentoMoonMirror')return `+${s.armor} de armadura · sofrer dano libera uma onda de ${18+6*(level-1)} de dano em 4 m, no máximo a cada 7 s.`;
  return '';
}
