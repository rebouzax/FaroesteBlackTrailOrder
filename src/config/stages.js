export const STAGES = {
  desert: { name:'Deserto dos Condenados', chapter:'I', description:'Casas esquecidas, cânions e uma horda sob a luz da lua.', spawn:{x:0,z:218}, bounds:{radius:238}, art:'desert.webp' },
  mine: { name:'Mina dos Condenados', chapter:'II', description:'Trilhos abandonados, ouro amaldiçoado e mortos nas profundezas.', spawn:{x:0,z:45}, bounds:{ellipse:[38,76]}, art:'mine.webp' },
  ghostTown: { name:'Cidade Fantasma', chapter:'III', description:'Saloons vazios, uma igreja esquecida e tempestades sobre a fronteira morta.', spawn:{x:0,z:215}, bounds:{x:265,z:275}, art:'../menu-black-trail.png' },
};
export const MINE_BOSSES = [
  { at:180,type:'mineGhoul',visual:'ghoul',hp:550,damage:23,speed:1.8,xp:420 },
  { at:360,type:'mineWendigo',visual:'wendigo',hp:850,damage:29,speed:2.1,xp:550 },
  { at:780,type:'minerGeneral',visual:'miner',hp:1200,damage:35,speed:1.7,xp:800 },
];
export const CITY_BOSSES = [
  {at:180,type:'cityCerberus',visual:'cerberus',hp:1050,damage:26,speed:2.2,xp:600},
  {at:420,type:'cityDevourer',visual:'devourer',hp:1500,damage:31,speed:2.3,xp:850},
  {at:780,type:'cityChainedDemon',visual:'chainedDemon',hp:2200,damage:38,speed:1.8,xp:1200},
];
