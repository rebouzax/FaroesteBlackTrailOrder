import { FRONTIER_CARDS, frontierCardStats } from "./frontierCards.js";
export const ABILITY_IDS = [...Object.keys(FRONTIER_CARDS), "pistol", "molotov", "heart", "horseshoe", "ghostShot", "requiem", "silverRain", "lantern", "soulHarvest", "boneStorm", "ironWill", "lastStand", "bulwark", "inferno", "silverStorm", "ironCharm", "deadeye", "bloodOath", "saltedRounds", "dustWaltz", "ironRosary", "blueTonic", "longshot", "bentoHourglass", "bentoLuckyStar", "bentoSaddle", "bentoMercyCoin", "bentoGhostLead", "windwardOath", "saloonTempest", "marshfire", "railbreaker", "crowstorm"];
export const abilityMaxLevel = id => id === 'doubleShot' ? 6 : 4;
ABILITY_IDS.push('doubleShot');
export const ABILITIES = {
  doubleShot: {name:'Disparo Duplicado',icon:'⇶',suit:'FERRO',color:'steel'},
  ...FRONTIER_CARDS,
  pistol: {
    name: "Pistola do Sertão",
    icon: "✦",
    suit: "FERRO",
    color: "steel",
  },
  molotov: { name: "Coquetel Molotov", icon: "♨", suit: "FOGO", color: "fire" },
  heart: {
    name: "Coração de Vaqueiro",
    icon: "♥",
    suit: "VIDA",
    color: "heart",
  },
  horseshoe: { name: "Ferraduras Malditas", icon: "♧", suit: "SOMBRA", color: "steel" },
  ghostShot: { name: "Bala Fantasma", icon: "✧", suit: "ALMA", color: "steel" },
  requiem: { name: "Réquiem da Poeira", icon: "◎", suit: "VENTO", color: "fire" },
  silverRain: { name: "Chuva de Prata", icon: "✺", suit: "PRATA", color: "steel" },
  lantern: { name: "Lampião Maldito", icon: "♨", suit: "MALDIÇÃO", color: "fire" },
  soulHarvest: { name: "Colheita de Almas", icon: "☥", suit: "ALMA", color: "heart" },
  boneStorm: { name: "Estilhaços de Ossos", icon: "✷", suit: "OSSO", color: "steel" },
  ironWill: { name: "Vontade de Ferro", icon: "⬟", suit: "DEFESA", color: "heart" },
  lastStand: { name: "Último Disparo", icon: "♠", suit: "CORAGEM", color: "fire" },
  bulwark: { name: "Bastião de Ferro", icon: "⬟", suit: "DEFESA", color: "heart" },
  inferno: { name: "Fogo Profano", icon: "♨", suit: "FOGO", color: "fire" },
  silverStorm: { name: "Tempestade de Prata", icon: "✺", suit: "PRATA", color: "steel" },
  ironCharm: { name: "Amuleto do Bento", icon: "⬟", suit: "DEFESA", color: "heart" },
  deadeye: { name: "Olho de Chumbo", icon: "✦", suit: "FERRO", color: "steel" },
  bloodOath: { name: "Pacto da Fronteira", icon: "♥", suit: "VIDA", color: "heart" },
  saltedRounds: { name: "Cartuchos Salmourados", icon: "✦", suit: "FERRO", color: "steel" },
  dustWaltz: { name: "Valsa da Poeira", icon: "◌", suit: "VENTO", color: "fire" },
  ironRosary: { name: "Rosário de Ferro", icon: "⬟", suit: "DEFESA", color: "heart" },
  blueTonic: { name: "Tônico Azul", icon: "♥", suit: "VIDA", color: "heart" },
  longshot: { name: "Mira do Horizonte", icon: "➶", suit: "FERRO", color: "steel" },
  bentoHourglass: { name: "Ampulheta de Bento", icon: "⌛", suit: "MERCADOR", color: "steel" },
  bentoLuckyStar: { name: "Estrela da Sorte", icon: "✣", suit: "MERCADOR", color: "heart" },
  bentoSaddle: { name: "Sela do Relâmpago", icon: "➤", suit: "MERCADOR", color: "fire" },
  bentoMercyCoin: { name: "Moeda da Misericórdia", icon: "☥", suit: "MERCADOR", color: "heart" },
  bentoGhostLead: { name: "Chumbo Fantasma", icon: "✧", suit: "MERCADOR", color: "steel" },
  windwardOath: { name: "Juramento do Vendaval", icon: "◌", suit: "VENTO", color: "fire" },
  saloonTempest: { name: "Tempestade do Saloon", icon: "✺", suit: "FOGO", color: "steel" },
  marshfire: { name: "Fogo do Pântano", icon: "♨", suit: "MALDIÇÃO", color: "fire" },
  railbreaker: { name: "Quebra-Trilhos", icon: "➤", suit: "FERRO", color: "steel" },
  crowstorm: { name: "Nuvem de Corvos", icon: "✷", suit: "SOMBRA", color: "heart" },
};
export function abilityStats(id, level) {
  if(id==='doubleShot')return {count:Math.min(6,Math.max(0,level))};
  if (FRONTIER_CARDS[id]) return frontierCardStats(id, level);
  const extra = Math.max(0, level - 1);
  if (id === "pistol")
    return {
      damage: 15 + 5 * extra,
      cooldown: Math.max(0.65, 1.7 - 0.08 * extra),
      range: 18,
    };
  if (id === "molotov")
    return {
      damage: 10 + 3 * extra,
      cooldown: Math.max(3, 5 - 0.15 * extra),
      duration: Math.min(6, 4 + 0.25 * extra),
      radius: Math.min(4, 2.8 + 0.15 * extra),
      range: 12,
    };
  if (id === "horseshoe") return { damage: 8 + extra * 3, count: Math.min(6, 2 + Math.floor(extra / 2)), radius: 2.5 + Math.min(1.2, extra * 0.2) };
  if (id === "ghostShot") return { damage: 18 + extra * 5, cooldown: Math.max(1.2, 3.5 - extra * 0.2), pierce: Math.min(6, 2 + extra), range: 17 };
  if (id === "requiem") return { damage: 12 + extra * 4, cooldown: Math.max(2.5, 6 - extra * 0.3), radius: Math.min(7, 4.3 + extra * 0.35), push: 1.8 };
  if (id === "silverRain") return { damage: 9 + extra * 3, count: Math.min(14, 6 + extra * 2), cooldown: Math.max(2.2, 4 - extra * 0.18) };
  if (id === "lantern") return { damage: 4 + extra * 2, radius: Math.min(6, 3.2 + extra * 0.3) };
  if (id === "soulHarvest") return { heal: Math.min(4,2 + extra) };
  if (id === "boneStorm") return { damage: 12 + 4*extra, count: Math.min(14,6+extra*2), cooldown: Math.max(2,5-extra*0.2) };
  if (id === "ironWill") return { armor: 3*level };
  if (id === "lastStand") return { attack: 0.2*level };
  if (id === "bulwark") return { armor: 2 * level, health: 10 * level };
  if (id === "inferno") return { damage: 4 * level, radius: 0.35 * level };
  if (id === "silverStorm") return { damage: 4 * level, count: 2 + level * 2 };
  if (id === "ironCharm") return { armor: 2 * level };
  if (id === "deadeye") return { damage: 4 * level };
  if (id === "bloodOath") return { health: 12 * level, heal: level };
  if (id === "saltedRounds") return { damage: 3 * level };
  if (id === "dustWaltz") return { speed: 0.06 * level };
  if (id === "ironRosary") return { armor: 2 * level };
  if (id === "blueTonic") return { health: 18 * level, heal: 12 * level };
  if (id === "longshot") return { range: 2 * level };
  if (id === "bentoHourglass") return { haste: 0.04 * level };
  if (id === "bentoLuckyStar") return { fortune: 0.1 * level };
  if (id === "bentoSaddle") return { speed: 0.05 * level };
  if (id === "bentoMercyCoin") return { heal: 3 * level };
  if (id === "bentoGhostLead") return { damage: 2 * level };
  if (id === "windwardOath") return { speed: 0.08 * level, armor: level };
  if (id === "saloonTempest") return { damage: 5 * level };
  if (id === "marshfire") return { damage: 3 * level, heal: level };
  if (id === "railbreaker") return { damage: 4 * level, range: 2 * level };
  if (id === "crowstorm") return { crit: 0.05 * level, speed: 0.04 * level };
  return { health: 20 };
}
export function cardDescription(id, nextLevel, attackRate = 1) {
  const stats = abilityStats(id, nextLevel);
  if (FRONTIER_CARDS[id]?.stats || !['doubleShot','pistol','molotov','horseshoe','ghostShot','requiem','silverRain','lantern','soulHarvest','boneStorm','ironWill','lastStand','bulwark','inferno','silverStorm','ironCharm','deadeye','bloodOath','heart'].includes(id)) {
    const labels = { damage:'dano',health:'vida máxima',armor:'armadura',range:'alcance (m)',haste:'velocidade de ataque',crit:'chance crítica',speed:'velocidade',magnet:'atração (m)',fortune:'moedas e XP',regen:'regeneração/s',heal:'cura',cooldown:'intervalo (s)' };
    return Object.entries(stats).map(([key,value]) => { const percent=['haste','crit','speed','fortune'].includes(key); return `${Number((value*(percent?100:1)).toFixed(2))}${percent?'%':''} ${labels[key]||key}`; }).join(' · ');
  }
  if(id==='doubleShot')return `+${stats.count} projéteis da arma principal por ataque, lançados em sequência (máximo +6). Não afeta golpes corpo a corpo.`;
  if (id === "pistol")
    return `${stats.damage} de dano · um tiro a cada ${Math.max(0.15, stats.cooldown / attackRate).toFixed(2)} s.`;
  if (id === "molotov")
    return `${stats.damage} de dano/s · fogo por ${stats.duration.toFixed(2)} s · arremesso a cada ${Math.max(0.7, stats.cooldown / attackRate).toFixed(2)} s.`;
  if (id === "horseshoe") return `${stats.count} ferraduras giram ao redor do campeão · ${stats.damage} de dano por contato.`;
  if (id === "ghostShot") return `${stats.damage} de dano · atravessa ${stats.pierce} inimigos · a cada ${(stats.cooldown / attackRate).toFixed(2)} s.`;
  if (id === "requiem") return `Onda de poeira de ${stats.radius.toFixed(1)} m · ${stats.damage} de dano e empurra inimigos · a cada ${(stats.cooldown / attackRate).toFixed(2)} s.`;
  if (id === "silverRain") return `${stats.count} balas em círculo · ${stats.damage} de dano por projétil · a cada ${(stats.cooldown / attackRate).toFixed(2)} s.`;
  if (id === "lantern") return `A luz profana queima inimigos próximos: ${stats.damage} de dano/s até ${stats.radius.toFixed(1)} m.`;
  if (id === "soulHarvest") return `Recupera ${stats.heal} de vida ao abater um inimigo (até a vida máxima).`;
  if (id === "boneStorm") return `${stats.count} estilhaços em círculo · ${stats.damage} de dano · a cada ${(stats.cooldown/attackRate).toFixed(2)} s.`;
  if (id === "ironWill") return `+3 de armadura permanente nesta partida · total da carta: ${stats.armor}.`;
  if (id === "lastStand") return `Abaixo de 35% de vida: +${Math.round(stats.attack*100)}% de velocidade de ataque.`;
  if (id === "bulwark") return `+2 de armadura e +10 de vida máxima por nível.`;
  if (id === "inferno") return `Fogo e lampião causam +${stats.damage} de dano/s; a área cresce.`;
  if (id === "silverStorm") return `+${stats.count} balas e +${stats.damage} de dano na chuva de prata.`;
  if (id === "ironCharm") return `+2 de armadura por nível; o amuleto rebate parte dos ataques.`;
  if (id === "deadeye") return `+4 de dano da arma principal por nível.`;
  if (id === "bloodOath") return `+12 de vida máxima e recuperação lenta por nível.`;
  return "+20 de vida máxima e recupera 20 de vida nesta partida.";
}
