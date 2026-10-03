import { INITIAL_CARDS, MISSIONS, BOSS_REWARDS, CLEAR_REWARDS, unlockHint } from '../config/campaign.js';
import { STAGES } from '../config/stages.js';
import { ABILITIES, cardDescription, abilityMaxLevel } from '../config/abilityConfig.js';
import { CHAMPIONS } from '../config/champions.js';
const ART = `${import.meta.env.BASE_URL}art/menu/`;
const CREATURES = [
  ['ghoul','Ghoul da Cidade','Vagueia pelas ruas abandonadas.','Persegue quem invade a cidade.',null],
  ['axeSkeleton','Esqueleto Lançador','Espreita a avenida da cidade.','Arremessa machados em arco.','skeleton'],
  ['cityCerberus','Cerberus','Primeiro chefe da Cidade Fantasma.','Três cabeças guardam a fronteira morta.',null],
  ['cityDevourer','Devorador de Almas','Segundo chefe da Cidade Fantasma.','Uma criatura que se alimenta dos condenados.',null],
  ['cityChainedDemon','Carrasco Acorrentado','Chefe final da Cidade Fantasma.','Suas correntes ainda prendem a cidade.',null],
  ['snake','Cobra da Mina','Rasteja pelos trilhos.','Ataca junto às pedras.','rattlesnake'],
  ['scorpion','Escorpião','Habita os veios de ouro.','Carapaça resistente.','redScorpion'],
  ['spider','Aranha da Mina','Surge nas galerias.','Pequena e veloz.','mineSpider'],
  ['miner','Mineiro Condenado','Um trabalhador que nunca saiu.','Avança com sua ferramenta.','miner'],
  ['ghost','Fantasma da Mina','Assombra as escavações.','Flutua sobre o chão.','wraith'],
  ['mineGhoul','Ghoul','Primeiro chefe da mina.','Protege as profundezas.',null],
  ['mineWendigo','Wendigo da Mina','Segundo chefe da mina.','Fome nas trevas.',null],
  ['minerGeneral','General Mineiro','Chefe final da mina.','Comanda os condenados do ouro.',null],
  ['bat', 'Morcego', 'Surge no início da noite.', 'Voa baixo e investe contra viajantes.'],
  ['dog', 'Cão das Cinzas', 'Chega após o primeiro minuto.', 'Rápido e resistente, persegue pela estrada.'],
  ['skeleton', 'Esqueleto', 'Sai da terra após três minutos.', 'O deserto não deixa seus mortos descansarem.'],
  ['giantBat', 'Morcego Gigante', 'Chefe da primeira onda.', 'A sombra que cobre a lua.'],
  ['fireChupacabra', 'Chupacabra de Fogo', 'Chefe da segunda onda.', 'Fera ardente da fronteira.'],
  ['shadowMarshal', 'Marechal das Sombras', 'Chefe da última onda.', 'Comanda os condenados sob a lua.'],
  ['zombie', 'Morto da Fronteira', 'Vagueia perto das casas abandonadas.', 'Avança devagar e resiste aos golpes.'],
  ['bonewalker', 'Caminhante de Ossos', 'Surge entre as covas.', 'Os ossos não aceitaram o descanso.', 'skeleton'],
  ['snatcher', 'Raptor das Sombras', 'Aparece nas horas mais escuras.', 'Persegue viajantes com investidas repentinas.', null],
  ['wendigo', 'Wendigo', 'Uma fera rara do ermo.', 'Mais forte que os condenados comuns.', null],
];

export class MenuView {
  constructor(root) { this.root=root; }
  mount(viewModel) {
    this.viewModel=viewModel;
    this.root.addEventListener('click',event=>{
      const button=event.target.closest('[data-menu-action]');
      if(button&&this.root.contains(button))viewModel.action(button.dataset.menuAction);
    });
    this.root.addEventListener('input',event=>{
      if(event.target.matches('[data-sensitivity]')){
        viewModel.setSensitivity(event.target.value);
        event.target.closest('label').querySelector('output').textContent=`${Number(event.target.value).toFixed(1)}×`;
      }
      if(event.target.matches('[data-volume]')){
        viewModel.setVolume(event.target.dataset.volume,event.target.value);
        event.target.closest('label').querySelector('output').textContent=Number(event.target.value)+'%';
      }
      if(event.target.matches('[data-card-search]')){
        const value=event.target.value,position=event.target.selectionStart;
        viewModel.search=value;viewModel.page=0;this.render();
        const input=this.root.querySelector('[data-card-search]');input.focus();input.setSelectionRange(position,position);
      }
    });
    window.addEventListener('resize',()=>{if(this.viewModel.gameViewModel.model.phase==='menu')this.render();});
    this.render();
  }
  render() {
    const vm=this.viewModel,state=vm.model,{profile,screen}=state;
    this.root.dataset.screen=screen;
    const logo=`<img class="game-logo" src="${import.meta.env.BASE_URL}art/logo-black-trail-order.png" alt="Faroeste Black Trail Order">`;
    const back=(target,title)=>`<header class="menu-heading"><button class="menu-back" data-menu-action="${target}">← VOLTAR</button><span>${title}</span></header>`;
    const button=(action,label,primary=false)=>`<button class="menu-action ${primary?'is-primary':''}" data-menu-action="${action}">${label}<span aria-hidden="true">↗</span></button>`;
    const pageItems=(items,count)=>{
      const pages=Math.max(1,Math.ceil(items.length/count));vm.page=Math.min(vm.page,pages-1);
      return {items:items.slice(vm.page*count,(vm.page+1)*count),nav:`<nav class="menu-pagination" aria-label="Páginas"><button data-menu-action="page:-1" ${vm.page===0?'disabled':''}>← ANTERIOR</button><span>${vm.page+1} / ${pages}</span><button data-menu-action="page:1" ${vm.page===pages-1?'disabled':''}>PRÓXIMA →</button></nav>`};
    };
    const compact=window.innerWidth<600||window.innerHeight<500;
    const wrap=(body,classes='')=>`<section class="menu-window ${classes}">${body}</section>`;
    let content='';
    if(screen==='home')content=`<div class="menu-home">${logo}<nav aria-label="Menu principal">${button('modes','NOVO JOGO',true)}${button('settings','CONFIGURAÇÃO')}${button('exit','SAIR')}</nav></div>`;
    if(screen==='modes')content=wrap(`${back('home','NOVA JORNADA')}<h1>ESCOLHA O MODO</h1><div class="menu-choice-grid menu-fill"><button class="mode-choice" data-menu-action="mode:campaign"><img src="${ART}desert.webp" alt="Deserto à noite"><span><b>CAMPANHA</b><small>15 minutos · chefes · evolução por cartas</small></span></button><button class="mode-choice mode-free" data-menu-action="mode:free"><img src="${ART}bat.svg" alt="Morcego"><span><b>MODO LIVRE</b><small>Hordas sem limite de tempo</small></span></button></div>`);
    if(screen==='champion')content=wrap(`${back('modes',state.mode==='campaign'?'CAMPANHA':'MODO LIVRE')}<h1>ESCOLHA O CAMPEÃO</h1><div class="hero-layout menu-fill">${Object.entries(CHAMPIONS).map(([id,h])=>`<button class="hero-choice ${state.champion===id?'is-selected':''}" data-menu-action="champion:${id}" ${state.heroUnlocked(id)?'':'disabled'} aria-label="${h.name}${state.heroUnlocked(id)?'':` · Bloqueado: ${unlockHint(id)}`}" aria-pressed="${state.champion===id}"><img src="${ART}${id}.${id==='ana'?'png':'webp'}" alt=""><span class="hero-copy"><b>${h.name}</b></span></button>`).join('')}</div>${button('map',`CONTINUAR COM ${CHAMPIONS[state.champion].name.toUpperCase()}`,true)}`);
    if(screen==='map')content=wrap(`${back('champion',CHAMPIONS[state.champion].name)}<h1>ESCOLHA O MAPA</h1><nav class="stage-select">${Object.entries(STAGES).map(([id,stage])=>`<button data-menu-action="stage:${id}" ${state.stageUnlocked(id)?'':'disabled'} aria-pressed="${state.map===id}">${state.stageUnlocked(id)?'':'🔒 '}${stage.chapter} · ${stage.name}</button>`).join('')}</nav><div class="map-layout menu-fill"><div class="map-art"><img src="${ART}${STAGES[state.map].art}" alt="${STAGES[state.map].name}"></div><div class="map-details"><small>CAPÍTULO ${STAGES[state.map].chapter} · ${profile.storyClears[state.map]?'CONCLUÍDO':'EM ABERTO'}</small><h2>${STAGES[state.map].name.toUpperCase()}</h2><p class="map-description">${STAGES[state.map].description}</p><div class="campaign-contracts">${(MISSIONS[state.map]||[]).map(m=>`<span class="${profile.missionClears.includes(m.id)?'is-complete':''}">${profile.missionClears.includes(m.id)?'✓':'◇'} ${m.title}</span>`).join('')}</div><p class="map-mode">${state.mode==='campaign'?'15 MINUTOS · 3 CHEFES':'HORDA SEM FIM'}</p>${button('play','COMEÇAR PARTIDA',true)}${!state.stageUnlocked('mine')?'<small class="unlock-hint">Conclua o Deserto para abrir a Mina.</small>':''}</div></div><nav class="menu-tools" aria-label="Preparação">${button('arsenal','ARSERNAL')}${button('bestiary','BESTIÁRIO')}${button('merchant','BENTO')}</nav>`,'map-window');
    if(screen==='arsenal'){
      const active=['pistol','molotov','horseshoe','ghostShot','requiem','silverRain','lantern','boneStorm','returningBlade','lunarReturn','pirateBomb'];
      const ordered=[...new Set([...active,'heart','doubleShot','ironWill','soulHarvest','lastStand',...Object.keys(ABILITIES)])];
      const query=vm.search.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu,'');
      const catalog=ordered.filter(id=>state.cardUnlocked(id)||[...Object.values(BOSS_REWARDS).flat(),...Object.values(CLEAR_REWARDS).flat(),...Object.values(MISSIONS).flatMap(ms=>ms.flatMap(m=>m.cards))].includes(id)||['desert','mine','town','ghostTown'].includes(ABILITIES[id].after));
      const filtered=catalog.filter(id=>(vm.filter!=='unlocked'||state.cardUnlocked(id))&&(vm.filter!=='equipped'||profile.deck.includes(id))&&(vm.filter!=='active'||active.includes(id))&&ABILITIES[id].name.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu,'').includes(query));
      const page=pageItems(filtered,compact?2:4);
      content=wrap(`${back(state.returnScreen,'PREPARAÇÃO')}<div class="menu-title-row"><h1>ARSERNAL</h1><span>${profile.deck.length}/8 EQUIPADAS</span></div><div class="catalog-tools"><input data-card-search placeholder="Buscar carta…" aria-label="Buscar carta"><div>${[['unlocked','LIBERADAS'],['all','TODAS'],['active','ATAQUES'],['equipped','DECK']].map(([id,label])=>`<button data-menu-action="filter:${id}" aria-pressed="${vm.filter===id}">${label}</button>`).join('')}</div></div><p class="menu-lead">${catalog.filter(id=>state.cardUnlocked(id)).length} cartas liberadas · Equipe de 3 a 8 cartas. Elas evoluem nas ofertas de nível.</p><div class="arsenal-grid menu-fill">${page.items.map(id=>{const c=ABILITIES[id],selected=profile.deck.includes(id);return `<button class="arsenal-choice ${selected?'is-selected':''}" data-menu-action="deck:${id}" aria-pressed="${selected}" ${!state.cardUnlocked(id)||selected&&profile.deck.length<=3||!selected&&profile.deck.length>=8?'disabled':''}><span class="card-mark">${c.icon}</span><span><b>${c.name}</b><small>${state.cardUnlocked(id)?cardDescription(id,1,1,state.champion):`🔒 ${unlockHint(id)}`}</small></span><em>${!state.cardUnlocked(id)?'BLOQUEADA':selected?'EQUIPADA':'EQUIPAR'} · MÁX. ${abilityMaxLevel(id)}</em></button>`;}).join('')||'<p>Nenhuma carta encontrada.</p>'}</div>${page.nav}`,'catalog-window');
    }
    if(screen==='bestiary'){
      const page=pageItems(CREATURES,compact?2:4);
      content=wrap(`${back(state.returnScreen,'PREPARAÇÃO')}<h1>BESTIÁRIO</h1><p class="menu-lead">${profile.discoveries.filter(id=>CREATURES.some(c=>c[0]===id)).length}/${CREATURES.length} criaturas descobertas</p><div class="bestiary-grid menu-fill">${page.items.map(([id,name,hint,lore,art])=>{const known=profile.discoveries.includes(id);return `<article class="creature-card ${known?'':'is-undiscovered'}">${art===null?'<span class="creature-sigil">☠</span>':`<img src="${ART}${art||id}.svg" alt="${known?name:''}">`}<div><small>${known?'DESCOBERTO':'NÃO DESCOBERTO'}</small><h2>${known?name:'???'}</h2><p>${known?lore:hint}</p></div></article>`;}).join('')}</div>${page.nav}`);
    }
    if(screen==='merchant')content=wrap(`${back(state.returnScreen,'PREPARAÇÃO')}<div class="merchant-layout menu-fill"><div class="merchant-portrait"><img src="${ART}bento-psx.png" alt="Bento"></div><div class="merchant-content"><h1>BENTO</h1><p class="menu-wallet">${state.merchantUnlocked()?`◈ ${profile.coins} MOEDAS`:'🔒 DERROTE O PRIMEIRO CHEFE PARA NEGOCIAR'}</p><div class="merchant-products">${[['damage','Arma temperada','+2 de dano inicial'],['health','Fôlego da fronteira','+10 de vida inicial'],['speed','Botas de viagem','+0,25 de velocidade']].map(([id,name,desc])=>{const rank=profile.purchases[id]||0,price=state.price(id);return `<article><div><small>NÍVEL ${rank}/5 · PERMANENTE</small><h2>${name}</h2><p>${desc}</p></div><button data-menu-action="buy:${id}" ${!state.merchantUnlocked()||rank>=5||profile.coins<price?'disabled':''}>${rank>=5?'MÁXIMO':`◈ ${price}`}</button></article>`;}).join('')}</div></div></div>`);
    if(screen==='settings'){
      const touch=vm.gameViewModel.touchDevice,value=vm.gameViewModel.sensitivity();
      content=wrap(`${back('home','MENU PRINCIPAL')}<h1>CONFIGURAÇÃO</h1><div class="settings-list menu-fill"><label class="sensitivity-setting"><span>Sensibilidade ${touch?'do toque':'do mouse'}<output>${value.toFixed(1)}×</output></span><input data-sensitivity type="range" min="0.2" max="3" step="0.1" value="${value}" aria-label="Sensibilidade ${touch?'do toque':'do mouse'}"><small>Menor: mais precisão · Maior: giro mais rápido</small></label><div class="audio-settings">${[['music','Volume da música'],['effects','Volume dos efeitos']].map(([id,label])=>`<label class="volume-setting"><span>${label}<output>${Math.round(state.settings[`${id}Volume`]*100)}%</output></span><input data-volume="${id}" type="range" min="0" max="100" step="1" value="${Math.round(state.settings[`${id}Volume`]*100)}" aria-label="${label}"></label>`).join('')}</div>${[['effects','Vento e luzes'],['grain','Granulação PSX']].map(([id,label])=>`<button data-menu-action="setting:${id}" aria-pressed="${state.settings[id]}"><span>${label}</span><b>${state.settings[id]?'LIGADO':'DESLIGADO'}</b></button>`).join('')}${touch?`<button data-menu-action="fullscreen"><span>Jogar em tela cheia</span><b>ATIVAR ↗</b></button><p class="install-tip">No iPhone/iPad: Compartilhar → Adicionar à Tela de Início → abrir pelo ícone para jogar sem a barra do navegador.</p>`:''}</div>`,'settings-window');
    }
    if(screen==='exit')content=wrap(`${logo}<h1>ATÉ A PRÓXIMA JORNADA</h1><p>Seu progresso foi guardado neste navegador.</p>${button('home','VOLTAR AO MENU',true)}`,'exit-window');
    this.root.innerHTML=content;
    const search=this.root.querySelector('[data-card-search]');if(search)search.value=vm.search;
  }
}

