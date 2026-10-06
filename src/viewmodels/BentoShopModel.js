import { abilityMaxLevel, cardDescription } from '../config/abilityConfig.js';
import { PERMANENT_UPGRADES, RUN_UPGRADES, BENTO_CARD_STOCK, shopEligible, shopRequirement, upgradeLimit, nextUpgradeRequirement, upgradeBonus } from '../config/bentoShop.js';

export function permanentProducts(menu){
  const profile=menu.profile,limit=upgradeLimit(profile);
  return Object.entries(PERMANENT_UPGRADES).map(([id,item])=>{
    const rank=profile.purchases[id]||0,eligible=shopEligible(profile,item),max=rank>=item.max,cap=rank>=limit;
    return {id,name:item.name,icon:item.icon,known:eligible||rank>0,rank,max:item.max,price:menu.price(id),owned:rank>0,
      tag:'PERMANENTE',description:`${upgradeBonus(item,1)} por nível. Vale para todos os campeões nas próximas jornadas.`,
      current:upgradeBonus(item,rank),next:max?'Nível máximo':upgradeBonus(item,rank+1),
      requirement:!eligible?shopRequirement(item):cap&&!max?nextUpgradeRequirement(profile):'',
      status:max?'NÍVEL MÁXIMO':!eligible?'BLOQUEADO':cap?'AVANCE NA CAMPANHA':profile.coins<menu.price(id)?'MOEDAS INSUFICIENTES':'COMPRAR MELHORIA',
      enabled:eligible&&!max&&!cap&&profile.coins>=menu.price(id)};
  });
}
export function licenseProducts(menu,world=null){
  return Object.entries(BENTO_CARD_STOCK).map(([id,card])=>{
    const owned=menu.profile.bentoCards.includes(id),eligible=owned||shopEligible(menu.profile,card),rank=world?.abilities[id]||0;
    const max=abilityMaxLevel(id),price=world&&owned?90+70*rank:card.price,full=world?rank>=max:owned;
    const wallet=world?Math.min(world.coins,menu.profile.coins):menu.profile.coins;
    return {id,name:card.name,icon:card.icon,known:eligible,owned,rank,max,price,tag:'EXCLUSIVA DE BENTO',
      description:eligible?cardDescription(id,world?Math.min(max,rank+1):1,world?.attributes().attack||1,world?.champion||menu.champion):'Um segredo do mercador aguarda sua próxima conquista.',
      current:world?`Nível ${rank}/${max} nesta partida`:owned?'Disponível no Arsernal':'Ainda não adquirida',
      next:world?rank>=max?'Nível máximo':`Nível ${rank+1}/${max} · efeito imediato`:'Licença permanente · equipe no Arsernal',
      requirement:eligible?'':shopRequirement(card),
      status:full?world?'NÍVEL MÁXIMO':'CARTA ADQUIRIDA':!eligible?'BLOQUEADA':wallet<price?'MOEDAS INSUFICIENTES':world&&owned?rank?'EVOLUIR CARTA':'ATIVAR NESTA PARTIDA':'COMPRAR CARTA',
      enabled:eligible&&!full&&wallet>=price};
  });
}
export function runProducts(menu,world){
  return Object.entries(RUN_UPGRADES).map(([id,item])=>{
    const rank=world.runShopPurchases[id]||0,price=item.base+item.step*rank,full=rank>=item.max,healthy=id==='health'&&world.health>=world.maxHealth;
    return {id,name:item.name,icon:item.icon,known:true,owned:rank>0,rank,max:Number.isFinite(item.max)?item.max:null,price,
      tag:'SÓ NESTA PARTIDA',description:item.detail,current:id==='health'?`${Math.ceil(world.health)}/${world.maxHealth} de vida`:`${rank} melhorias aplicadas`,
      next:item.detail,requirement:'',status:full?'NÍVEL MÁXIMO':healthy?'VIDA COMPLETA':Math.min(world.coins,menu.profile.coins)<price?'MOEDAS INSUFICIENTES':'COMPRAR SUPRIMENTO',
      enabled:!full&&!healthy&&Math.min(world.coins,menu.profile.coins)>=price};
  });
}
