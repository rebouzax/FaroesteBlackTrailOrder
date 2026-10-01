export const STAGES = {
  desert: { name:'Deserto dos Condenados', chapter:'I', description:'Casas esquecidas, cânions e uma horda sob a luz da lua.', spawn:{x:0,z:218} },
  mine: { name:'Mina dos Condenados', chapter:'II', description:'Trilhos abandonados, ouro amaldiçoado e mortos nas profundezas.', spawn:{x:0,z:45} },
};
export const MINE_BOSSES = [
  { at:180,type:'mineGhoul',visual:'ghoul',hp:550,damage:23,speed:1.8,xp:420 },
  { at:360,type:'mineWendigo',visual:'wendigo',hp:850,damage:29,speed:2.1,xp:550 },
  { at:780,type:'minerGeneral',visual:'miner',hp:1200,damage:35,speed:1.7,xp:800 },
];
