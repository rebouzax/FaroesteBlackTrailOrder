export const STAGES = {
  desert: { name:'Deserto dos Condenados', chapter:'I', description:'Casas esquecidas, cânions e uma horda sob a luz da lua.', spawn:{x:0,z:218}, bounds:{radius:238}, art:'desert.webp' },
  mine: { name:'Mina dos Condenados', chapter:'II', description:'Trilhos abandonados, ouro amaldiçoado e mortos nas profundezas.', spawn:{x:0,z:45}, bounds:{ellipse:[38,76]}, enemyScales:{snake:1.8,scorpion:1.8}, art:'mine.webp' },
  ghostTown: { name:'Cidade Fantasma', chapter:'III', description:'Saloons vazios, uma igreja esquecida e tempestades sobre a fronteira morta.', spawn:{x:0,z:215}, bounds:{x:265,z:275}, enemyScales:{snake:2.1,scorpion:2.1}, art:'../menu-black-trail.png' },
  saloon: { name:'Salão Fantasma', chapter:'IV', after:'ghostTown', description:'Um último baile entre o bar, o piano e as galerias de um saloon amaldiçoado.', spawn:{x:0,z:22}, bounds:{x:23.7,z:28.7}, art:'saloon.png' },
};
export const DESERT_BOSSES = [
  {at:180,type:'giantBat',visual:'bat',hp:675,damage:27,speed:1.55,xp:380},
  {at:360,type:'fireChupacabra',visual:'dog',hp:1050,damage:34,speed:1.65,xp:480},
  {at:660,type:'shadowMarshal',visual:'marshal',hp:1425,damage:43,speed:2.35,xp:650},
];
export const MINE_BOSSES = [
  { at:180,type:'mineGhoul',visual:'ghoul',hp:825,damage:29,speed:1.8,xp:420 },
  { at:360,type:'mineWendigo',visual:'wendigo',hp:1275,damage:37,speed:2.1,xp:550 },
  { at:780,type:'minerGeneral',visual:'miner',hp:1800,damage:44,speed:1.7,xp:800 },
];
export const CITY_BOSSES = [
  {at:180,type:'cityCerberus',visual:'cerberus',hp:1575,damage:33,speed:2.2,xp:600,scale:2.3},
  {at:420,type:'cityDevourer',visual:'devourer',hp:2250,damage:39,speed:2.3,xp:850,scale:2.3},
  {at:780,type:'cityChainedDemon',visual:'chainedDemon',hp:3300,damage:48,speed:1.8,xp:1200,scale:2.3},
];
export const SALOON_BOSSES = [
  {at:180,type:'saloonSpider',visual:'spider',hp:1800,damage:36,speed:2.05,xp:700,scale:3.2,bodyRadius:1.45},
  {at:420,type:'saloonSkeleton',visual:'skeleton',hp:2450,damage:42,speed:1.55,xp:1000,scale:1.3},
  {at:780,type:'damaMalvina',visual:'witch',hp:3600,damage:48,speed:2.6,xp:1500,scale:1.25},
];
