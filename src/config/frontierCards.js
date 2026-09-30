// Card catalog imported from Faroeste Survivors.
export const FRONTIER_CARDS = {
  saltWard:{name:"Pele de Sal",suit:"DEFESA",color:"heart",icon:"⬟",stats:{armor:2,health:8},after:"saltFlats",description:"+{armor} de armadura e +{health} de vida máxima."},
  emberHeart:{name:"Coração da Fornalha",suit:"FOGO",color:"fire",icon:"♨",stats:{damage:5,health:6},after:"emberFoundry",description:"+{damage} de dano principal e +{health} de vida máxima."},
  moonLens:{name:"Lente Lunar",suit:"PRATA",color:"steel",icon:"✧",stats:{range:2,crit:.04},after:"moonMonastery",description:"+{range} m de alcance e +{critPercent}% de crítico."},
  thornMail:{name:"Cota de Espinhos",suit:"DEFESA",color:"heart",icon:"✷",stats:{armor:3,damage:2},after:"thornGarden",description:"+{armor} de armadura e +{damage} de dano principal."},
  dawnSeal:{name:"Selo da Aurora",suit:"ALMA",color:"fire",icon:"✺",stats:{haste:.05,damage:4},after:"lastDawn",description:"+{haste}% de velocidade de ataque e +{damage} de dano principal."},
  returningBlade:{name:"Lâmina Retornante",suit:"FERRO",color:"steel",icon:"⌁",active:true,mission:"saltFlats:1",description:"Bumerangue: {damage} de dano por passagem, a cada {cooldown} s. Atravessa alvos na ida e na volta."},
  bentoSaltCompass:{name:"Bússola de Sal",suit:"MERCADOR",color:"steel",icon:"✣",stats:{magnet:.7,range:1},after:"saltFlats",price:650,description:"+{magnet} m de coleta e +{range} m de alcance."},
  bentoFurnaceBadge:{name:"Insígnia da Fornalha",suit:"MERCADOR",color:"fire",icon:"⬟",stats:{armor:2,haste:.04},after:"emberFoundry",price:700,description:"+{armor} de armadura e +{haste}% de velocidade de ataque."},
  bentoMoonDial:{name:"Relógio Lunar",suit:"MERCADOR",color:"steel",icon:"⌛",stats:{haste:.06,range:1},after:"moonMonastery",price:750,description:"+{haste}% de velocidade de ataque e +{range} m de alcance."},
  bentoRootFlask:{name:"Cantil de Seiva",suit:"MERCADOR",color:"heart",icon:"♥",stats:{health:14,regen:1},after:"thornGarden",price:800,description:"+{health} de vida máxima e +{regen} de regeneração por ciclo."},
  bentoDawnCoin:{name:"Moeda do Amanhecer",suit:"MERCADOR",color:"fire",icon:"✣",stats:{fortune:.08,damage:4},after:"lastDawn",price:850,description:"+{fortune}% de ouro e experiência e +{damage} de dano principal."},
  saltBastion:{name:"Bastião de Cristal",suit:"DEFESA",color:"heart",icon:"⬟",stats:{armor:4,health:12},after:"saltFlats",ingredients:["saltWard","ironWill"],description:"+{armor} de armadura e +{health} de vida máxima."},
  furnaceOath:{name:"Juramento da Fornalha",suit:"FOGO",color:"fire",icon:"♨",stats:{damage:7,haste:.03},after:"emberFoundry",ingredients:["emberHeart","saltedRounds"],description:"+{damage} de dano principal e +{haste}% de velocidade de ataque."},
  lunarReturn:{name:"Retorno Lunar",suit:"PRATA",color:"steel",icon:"⌁",active:true,after:"moonMonastery",ingredients:["returningBlade","moonLens"],description:"Bumerangue lunar: {damage} de dano por passagem, a cada {cooldown} s; atravessa todos os alvos."},
  livingBriar:{name:"Sarça Viva",suit:"VIDA",color:"heart",icon:"♥",stats:{armor:2,regen:2},after:"thornGarden",ingredients:["thornMail","blueTonic"],description:"+{armor} de armadura e +{regen} de regeneração por ciclo."},
  dawnTempest:{name:"Tempestade da Aurora",suit:"ALMA",color:"fire",icon:"✺",stats:{damage:6,crit:.06,speed:.04},after:"lastDawn",ingredients:["dawnSeal","requiem"],description:"+{damage} de dano principal, +{critPercent}% de crítico e +{speed}% de movimento."},
};

// Grow the release catalog from reusable, balanced stat families instead of
// placeholder cards. Every generated card has a stage gate, localized title,
// icon glyph, gameplay stats, and a real fusion recipe where applicable.
const cardStages=["desert","mine","town","canyon","cemetery","bellTown","glassMarsh","midnightSaloon","forsakenRail","crowFortress","saltFlats","emberFoundry","moonMonastery","thornGarden","lastDawn"];
const statFamilies=[
  {damage:2.4,range:.7},{health:9,armor:.45},{haste:.026,crit:.012},
  {speed:.035,magnet:.35},{regen:.7,health:6},{fortune:.045,magnet:.2},
  {damage:1.4,armor:.6},{range:1.1,crit:.018},{haste:.018,regen:.45},
  {speed:.025,fortune:.025},
];
const statSteps={damage:.1,health:.5,armor:.05,range:.1,haste:.001,crit:.001,speed:.001,magnet:.05,fortune:.001,regen:.05,heal:.5};
const cardWords={
  pt:{prefixes:["Selo","Cartucho","Amuleto","Relíquia","Voto","Totem","Marca","Runa","Medalhão","Lâmina","Sigilo","Tônico","Broche","Talismã","Emblema","Fetiche","Encanto","Rosário","Cantil","Fivela","Pena","Olho","Coração","Brasa","Espora","Estrela","Lacre","Cálice","Placa","Compasso"],suffixes:["da Lua","de Prata","do Trovão","das Cinzas","da Fronteira","de Sal","do Corvo","do Deserto","da Fornalha","do Eclipse","das Sarças","da Aurora","do Pântano","da Ferrovia","da Meia-Noite","do Coiote","do Abismo","do Vendaval","dos Ossos","da Miragem","do Xerife","do Vaqueiro","do Garimpo","do Carrasco","do Relâmpago","da Névoa","do Peregrino","da Vigília","da Salvação","do Crepúsculo"]},
  en:{prefixes:["Seal","Round","Charm","Relic","Oath","Totem","Mark","Rune","Medallion","Blade","Sigil","Tonic","Brooch","Talisman","Emblem","Fetish","Hex","Rosary","Canteen","Buckle","Feather","Eye","Heart","Ember","Spur","Star","Locket","Chalice","Plate","Compass"],suffixes:["of the Moon","of Silver","of Thunder","of Ash","of the Frontier","of Salt","of the Crow","of the Desert","of the Furnace","of Eclipse","of Briars","of Dawn","of the Marsh","of the Railway","of Midnight","of the Coyote","of the Abyss","of the Gale","of Bones","of the Mirage","of the Sheriff","of the Cowboy","of the Prospector","of the Hangman","of Lightning","of Mist","of the Pilgrim","of Vigil","of Mercy","of Dusk"]},
  es:{prefixes:["Sello","Cartucho","Amuleto","Reliquia","Voto","Tótem","Marca","Runa","Medallón","Hoja","Sigilo","Tónico","Broche","Talismán","Emblema","Fetiche","Hechizo","Rosario","Cantimplora","Hebilla","Pluma","Ojo","Corazón","Ascua","Espuela","Estrella","Relicario","Cáliz","Placa","Brújula"],suffixes:["de la Luna","de Plata","del Trueno","de Ceniza","de la Frontera","de Sal","del Cuervo","del Desierto","del Horno","del Eclipse","de Zarzas","del Alba","del Pantano","del Ferrocarril","de Medianoche","del Coyote","del Abismo","del Vendaval","de Huesos","del Espejismo","del Alguacil","del Vaquero","del Minero","del Verdugo","del Relámpago","de la Niebla","del Peregrino","de la Vigilia","de la Piedad","del Ocaso"]},
};
const statLabels={
  pt:{damage:"dano principal",health:"vida máxima",armor:"armadura",range:"alcance (m)",haste:"velocidade de ataque (%)",critPercent:"acerto crítico (%)",speed:"movimento (%)",magnet:"atração de itens (m)",fortune:"ouro e XP (%)",regen:"regeneração",heal:"cura imediata"},
  en:{damage:"weapon damage",health:"maximum health",armor:"armor",range:"weapon range (m)",haste:"attack speed (%)",critPercent:"critical chance (%)",speed:"movement (%)",magnet:"pickup radius (m)",fortune:"gold and XP (%)",regen:"regeneration",heal:"instant healing"},
  es:{damage:"daño del arma",health:"vida máxima",armor:"armadura",range:"alcance del arma (m)",haste:"velocidad de ataque (%)",critPercent:"probabilidad crítica (%)",speed:"movimiento (%)",magnet:"radio de objetos (m)",fortune:"oro y XP (%)",regen:"regeneración",heal:"curación inmediata"},
};
const cardGlyphs=["✦","⬟","♨","✧","✷","✺","⌁","♥","➶","◎","☥","✣"];
function roundStat(value,key){const step=statSteps[key]||.01;return Number((Math.round(value/step)*step).toFixed(3));}
function cardStats(index,scale=1){
  const primary=statFamilies[index%statFamilies.length],secondary=statFamilies[(index*7+3)%statFamilies.length];
  const strength=scale*(.82+(index%6)*.075),stats={};
  for(const [family,weight] of [[primary,1],[secondary,.42]])for(const [key,value] of Object.entries(family))
    stats[key]=roundStat((stats[key]||0)+value*strength*weight,key);
  return stats;
}
function localizedName(index){
  return Object.fromEntries(Object.entries(cardWords).map(([language,words])=>[
    language,`${words.prefixes[index%30]} ${words.suffixes[Math.floor(index/30)%30]}`,
  ]));
}
function localizedDescription(stats){
  return Object.fromEntries(Object.entries(statLabels).map(([language,labels])=>[
    language,Object.keys(stats).map(key=>`+{${key==="crit"?"critPercent":key}} ${labels[key==="crit"?"critPercent":key]}`).join(" · "),
  ]));
}
function createCatalogCard(id,index,{price,after,ingredients,merchant=false,stats}={}){
  const names=localizedName(index),descriptions=localizedDescription(stats);
  const card={name:names.pt,names,description:descriptions.pt,descriptions,stats,after,
    suit:merchant?"MERCADOR":index%3===0?"FERRO":index%3===1?"VIDA":"PRATA",
    color:["steel","fire","heart"][index%3],icon:cardGlyphs[index%cardGlyphs.length],generated:true};
  if(price)card.price=price;
  if(ingredients)card.ingredients=ingredients;
  if(merchant)card.shopDescriptions=Object.fromEntries(["pt","en","es"].map(language=>[
    language,`${language==="pt"?"Carta permanente do mercador":language==="es"?"Carta permanente del mercader":"Permanent merchant card"}: ${descriptions[language]}.`,
  ]));
  return [id,card];
}
const campaignCardCount=127,merchantCardCount=87,standardFusionCount=487,merchantFusionCount=150;
const generatedCampaign=Array.from({length:campaignCardCount},(_,i)=>{
  const id=`frontierSigil${String(i+1).padStart(3,"0")}`;
  const after=cardStages[(i*5+Math.floor(i/10))%cardStages.length];
  return createCatalogCard(id,i,{after,stats:cardStats(i)});
});
const generatedMerchant=Array.from({length:merchantCardCount},(_,i)=>{
  const index=campaignCardCount+i,id=`bentoArchive${String(i+1).padStart(3,"0")}`;
  const after=cardStages[(i*7+Math.floor(i/8))%cardStages.length];
  return createCatalogCard(id,index,{after,price:390+(i%15)*35+Math.floor(i/15)*20,merchant:true,stats:cardStats(index,.88)});
});
Object.assign(FRONTIER_CARDS,Object.fromEntries([...generatedCampaign,...generatedMerchant]));
function laterStage(a,b){return cardStages[Math.max(cardStages.indexOf(a||"desert"),cardStages.indexOf(b||"desert"))];}
function combinedStats(a,b){
  const result={};
  for(const key of new Set([...Object.keys(a),...Object.keys(b)]))result[key]=roundStat(((a[key]||0)+(b[key]||0))*.55,key);
  return result;
}
const standardIngredients=Object.entries(FRONTIER_CARDS).filter(([,card])=>card.stats&&!card.price&&!card.ingredients);
const rankedPairs=(cards)=>{
  const pairs=[];
  for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++){
    const value=Math.sin((i+1)*12.9898+(j+1)*78.233)*43758.5453;
    pairs.push({i,j,rank:value-Math.floor(value)});
  }
  return pairs.sort((a,b)=>a.rank-b.rank);
};
const standardPairs=rankedPairs(standardIngredients);
let standardFusionIndex=0;
for(const {i,j} of standardPairs.slice(0,standardFusionCount)){
  const [leftId,left]=standardIngredients[i],[rightId,right]=standardIngredients[j],index=campaignCardCount+merchantCardCount+standardFusionIndex;
  const id=`frontierFusion${String(standardFusionIndex+1).padStart(3,"0")}`;
  const entry=createCatalogCard(id,index,{after:laterStage(left.after,right.after),ingredients:[leftId,rightId],stats:combinedStats(left.stats,right.stats)});
  FRONTIER_CARDS[entry[0]]=entry[1];
  standardFusionIndex++;
}
const legacyMerchantStats={
  ironCharm:{armor:2,after:"desert"},deadeye:{damage:4,after:"mine"},bloodOath:{health:12,regen:1,after:"town"},
  bentoHourglass:{haste:.04,after:"bellTown"},bentoLuckyStar:{fortune:.1,after:"glassMarsh"},
  bentoSaddle:{speed:.05,after:"midnightSaloon"},bentoMercyCoin:{heal:3,after:"forsakenRail"},
  bentoGhostLead:{damage:2,after:"crowFortress"},
};
const merchantIngredients=[
  ...Object.entries(FRONTIER_CARDS).filter(([,card])=>card.price&&card.stats),
  ...Object.entries(legacyMerchantStats).map(([id,{after,...stats}])=>[id,{after,stats}]),
];
const merchantPairs=rankedPairs(merchantIngredients);
let merchantFusionIndex=0;
for(const {i,j} of merchantPairs.slice(0,merchantFusionCount)){
  const [leftId,left]=merchantIngredients[i],[rightId,right]=merchantIngredients[j],index=campaignCardCount+merchantCardCount+standardFusionCount+merchantFusionIndex;
  const id=`bentoFusion${String(merchantFusionIndex+1).padStart(3,"0")}`;
  const entry=createCatalogCard(id,index,{after:laterStage(left.after,right.after),ingredients:[leftId,rightId],merchant:true,stats:combinedStats(left.stats,right.stats)});
  FRONTIER_CARDS[entry[0]]=entry[1];
  merchantFusionIndex++;
}
if(standardFusionIndex!==standardFusionCount||merchantFusionIndex!==merchantFusionCount)
  throw new Error("Could not produce the configured unique card-fusion catalog.");
FRONTIER_CARDS.pirateBomb={name:'Bomba de Dinamite',names:{pt:'Bomba de Dinamite',en:'Dynamite Bomb',es:'Bomba de Dinamita'},suit:'FOGO',color:'fire',icon:'✹',active:true,mission:'glassMarsh:4',description:'Arremessa uma bomba: {damage} de dano em área, a cada {cooldown} s.',descriptions:{en:'Throws a bomb for {damage} area damage every {cooldown} s.',es:'Lanza una bomba: {damage} de daño en área cada {cooldown} s.'}};
export const frontierCardStats = (id,level) => id==='pirateBomb'?{damage:30+10*(level-1),cooldown:Math.max(2,5-.35*level),range:14}:FRONTIER_CARDS[id]?.active
  ? {damage:(id==="lunarReturn"?32:20)+8*(level-1),cooldown:Math.max(1.6,3.6-level*.25),range:id==="lunarReturn"?17:13}
  : Object.fromEntries(Object.entries(FRONTIER_CARDS[id]?.stats||{}).map(([key,value])=>[key,value*level]));
