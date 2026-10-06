import { BENTO_CARDS } from './bentoCards.js';
import { FRONTIER_CARDS } from './frontierCards.js';

export const PERMANENT_UPGRADES={
  damage:{name:'Arma temperada',icon:'✦',base:18,stat:'damage',amount:2,max:10,unit:'dano'},
  health:{name:'Fôlego da fronteira',icon:'♥',base:15,stat:'health',amount:10,max:10,unit:'vida máxima'},
  speed:{name:'Botas de viagem',icon:'➤',base:14,stat:'speed',amount:.25,max:10,unit:'velocidade'},
  armor:{name:'Couro dos condenados',icon:'⬟',base:75,stat:'armor',amount:1,max:10,unit:'armadura',after:'desert'},
  attack:{name:'Mecanismo de prata',icon:'⌛',base:90,stat:'attack',amount:.025,max:10,unit:'cadência',percent:true,after:'desert'},
  crit:{name:'Mira de caçador',icon:'✧',base:110,stat:'crit',amount:.008,max:10,unit:'chance crítica',percent:true,after:'mine'},
  magnet:{name:'Bússola das almas',icon:'✣',base:65,stat:'magnet',amount:.35,max:10,unit:'m de coleta',after:'mine'},
  fortune:{name:'Bolsa do garimpeiro',icon:'◈',base:95,stat:'fortune',amount:.025,max:10,unit:'moedas',percent:true,after:'ghostTown'},
  regen:{name:'Cantil do peregrino',icon:'☥',base:130,stat:'regen',amount:.08,max:10,unit:'vida/s',after:'ghostTown'},
};
const existingStages=['desert','mine','town','ghostTown','saloon','midnightSaloon'];
export const BENTO_CARD_STOCK={...BENTO_CARDS,...Object.fromEntries(Object.entries(FRONTIER_CARDS).filter(([,card])=>card.price&&existingStages.includes(card.after)))};
export const RUN_UPGRADES={
  whip:{name:'Arma reforçada',icon:'✦',base:60,step:40,max:5,detail:'+5 de dano nesta partida',stat:'damage'},
  health:{name:'Bandagem de Bento',icon:'♥',base:45,step:15,max:Infinity,detail:'Recupera 25 de vida agora'},
  speed:{name:'Botas ligeiras',icon:'➤',base:65,step:35,max:5,detail:'+0,5 de velocidade nesta partida',stat:'speed'},
  armor:{name:'Colete remendado',icon:'⬟',base:75,step:40,max:5,detail:'+2 de armadura nesta partida',stat:'armor'},
  haste:{name:'Gatilho benzido',icon:'⌛',base:80,step:45,max:5,detail:'+6% de cadência nesta partida',stat:'haste'},
  range:{name:'Lente de Bento',icon:'➶',base:70,step:35,max:5,detail:'+1 m de alcance nesta partida',stat:'range'},
  magnet:{name:'Ímã de prata',icon:'✣',base:55,step:30,max:5,detail:'+0,5 m de coleta nesta partida',stat:'magnet'},
};
const stageNames={desert:'Deserto dos Condenados',mine:'Mina dos Condenados',town:'Cidade Fantasma',ghostTown:'Cidade Fantasma',saloon:'Salão Fantasma',midnightSaloon:'Salão Fantasma'};
const bossNames={saloonSpider:'a Viúva do Salão',saloonSkeleton:'o Barman das Cinzas',damaMalvina:'a Dama Malvina'};
export function shopOpen(profile){return profile.bossKills.length>0||['desert','mine','ghostTown','saloon'].some(id=>profile.storyClears[id]);}
export function shopEligible(profile,item){return shopOpen(profile)&&(!item.after||profile.storyClears[item.after])&&(!item.boss||profile.bossKills.includes(item.boss));}
export function shopRequirement(item){return item.boss?`Derrote ${bossNames[item.boss]||item.boss}.`:item.after?`Conclua ${stageNames[item.after]||item.after}.`:'Derrote o primeiro chefe da campanha.';}
export function upgradeLimit(profile){return profile.storyClears.saloon?10:profile.storyClears.ghostTown?9:profile.storyClears.mine?7:profile.storyClears.desert?5:3;}
export function nextUpgradeRequirement(profile){return !profile.storyClears.desert?'Conclua o Deserto para liberar o nível 5.':!profile.storyClears.mine?'Conclua a Mina para liberar o nível 7.':!profile.storyClears.ghostTown?'Conclua a Cidade Fantasma para liberar o nível 9.':'Conclua o Salão Fantasma para liberar o nível 10.';}
export function upgradePrice(id,rank){return PERMANENT_UPGRADES[id].base*(rank+1)+15*rank*rank;}
export function upgradeBonus(item,rank){const value=Number((item.amount*rank*(item.percent?100:1)).toFixed(2));return `+${value.toLocaleString('pt-BR')}${item.percent?'%':''} ${item.unit}`;}
export function permanentBonuses(purchases={}){
  const result={};for(const [id,item] of Object.entries(PERMANENT_UPGRADES))result[item.stat]=(result[item.stat]||0)+(purchases[id]||0)*item.amount;
  return result;
}
