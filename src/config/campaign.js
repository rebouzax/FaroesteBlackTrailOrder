import { ABILITIES } from './abilityConfig.js';
export const INITIAL_CARDS=['pistol','molotov','heart','horseshoe','doubleShot','deadeye'];
export const MISSIONS={
  desert:[
    {id:'desert:1',at:45,duration:120,kind:'bat',target:10,title:'Abata 10 morcegos',hero:'maria',cards:['ghostShot']},
    {id:'desert:2',at:250,duration:150,kind:'coins',target:8,title:'Recolha 8 moedas',hero:'labuta',cards:['ironWill']},
    {id:'desert:3',at:500,duration:150,kind:'skeleton',target:7,title:'Abata 7 esqueletos',cards:['lantern']},
  ],
  mine:[
    {id:'mine:1',at:80,duration:145,kind:'spider',target:8,title:'Abata 8 aranhas',cards:['silverRain']},
    {id:'mine:2',at:325,duration:155,kind:'coins',target:12,title:'Recolha 12 moedas',cards:['soulHarvest']},
    {id:'mine:3',at:550,duration:165,kind:'miner',target:8,title:'Abata 8 mineiros',cards:['boneStorm']},
  ],
};
export const BOSS_REWARDS={giantBat:['requiem'],fireChupacabra:['saltedRounds'],shadowMarshal:['lastStand'],mineGhoul:['ironCharm'],mineWendigo:['returningBlade'],minerGeneral:['pirateBomb']};
export const CLEAR_REWARDS={desert:['bloodOath','dustWaltz'],mine:['blueTonic','longshot','inferno','silverStorm']};
export function cardUnlocked(profile,id){
  if(!ABILITIES[id])return false;
  return INITIAL_CARDS.includes(id)||profile.unlockedCards.includes(id);
}
export function refreshCardRewards(profile){
  // Admit catalog cards only when their actual stage/recipe requirements exist.
  let changed=true;
  while(changed){changed=false;for(const [id,card] of Object.entries(ABILITIES)){
    if(profile.unlockedCards.includes(id)||INITIAL_CARDS.includes(id)||card.price)continue;
    if(!card.after&&!card.mission&&!card.ingredients)continue;
    if(card.after&&!profile.storyClears[card.after])continue;
    if(card.mission&&!profile.missionClears.includes(card.mission))continue;
    if(card.ingredients&&!card.ingredients.every(part=>cardUnlocked(profile,part)))continue;
    profile.unlockedCards.push(id);changed=true;
  }}
}
export function unlockHint(id){
  const mission=Object.values(MISSIONS).flat().find(m=>m.hero===id||m.cards.includes(id));
  if(mission)return `${mission.id.startsWith('desert')?'Deserto':'Mina'} · ${mission.title}`;
  const boss=Object.entries(BOSS_REWARDS).find(([,cards])=>cards.includes(id));
  if(boss)return `Derrote ${ {giantBat:'o Morcego Gigante',fireChupacabra:'o Chupacabra',shadowMarshal:'o Marechal',mineGhoul:'o Ghoul',mineWendigo:'o Wendigo',minerGeneral:'o General Mineiro'}[boss[0]] }`;
  const clear=Object.entries(CLEAR_REWARDS).find(([,cards])=>cards.includes(id));
  if(clear)return `Conclua ${clear[0]==='desert'?'o Deserto':'a Mina'}`;
  return 'Avance na campanha para conquistar esta carta';
}
