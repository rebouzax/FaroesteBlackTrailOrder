import { ABILITIES, cardDescription, abilityMaxLevel } from '../config/abilityConfig.js';
import { CHAMPIONS } from '../config/champions.js';
const ART = `${import.meta.env.BASE_URL}art/menu/`;
const CREATURES = [
  ['bat', 'Morcego', 'Surge no início da noite.', 'Voa baixo e investe contra viajantes.'],
  ['dog', 'Cão das Cinzas', 'Chega após o primeiro minuto.', 'Rápido e resistente, persegue pela estrada.'],
  ['skeleton', 'Esqueleto', 'Sai da terra após três minutos.', 'O deserto não deixa seus mortos descansarem.'],
  ['giantBat', 'Morcego Gigante', 'Chefe da primeira onda.', 'A sombra que cobre a lua.'],
  ['fireChupacabra', 'Chupacabra de Fogo', 'Chefe da segunda onda.', 'Fera ardente da fronteira.'],
  ['shadowMarshal', 'Marechal das Sombras', 'Chefe da última onda.', 'Comanda os condenados sob a lua.'],
  ['crow', 'Corvo da Estrada', 'Uma sombra de asas sobre o deserto.', 'Ataca em rasantes rápidos.'],
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
        this.root.querySelector('output').textContent=`${Number(event.target.value).toFixed(1)}×`;
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
    if(screen==='champion')content=wrap(`${back('modes',state.mode==='campaign'?'CAMPANHA':'MODO LIVRE')}<h1>ESCOLHA O CAMPEÃO</h1><div class="hero-layout menu-fill">${Object.entries(CHAMPIONS).map(([id,h])=>`<button class="hero-choice ${state.champion===id?'is-selected':''}" data-menu-action="champion:${id}" aria-pressed="${state.champion===id}"><img src="${ART}${id}.webp" alt="${h.name}"><span class="hero-copy"><small>${h.primary==='whip'?'CHICOTE':'REVÓLVER'}</small><b>${h.name}</b><span class="hero-stats">♥ ${h.hp} VIDA · ✦ ${h.damage} DANO<br>➤ ${h.speed} VELOCIDADE · ${h.range} m<br>⬟ ${h.armor} ARMADURA · ${Math.round(h.crit*100)}% CRÍTICO</span></span></button>`).join('')}</div>${button('map',`CONTINUAR COM ${state.champion==='maria'?'MARIA':'JOÃO'}`,true)}`);
    if(screen==='map')content=wrap(`${back('champion',CHAMPIONS[state.champion].name)}<h1>ESCOLHA O MAPA</h1><div class="map-layout menu-fill"><div class="map-art"><img src="${ART}desert.webp" alt="Deserto dos Condenados"></div><div class="map-details"><small>CAPÍTULO I</small><h2>DESERTO DOS CONDENADOS</h2><p class="map-description">Casas esquecidas, cânions e uma horda sob a luz da lua.</p><p class="map-mode">${state.mode==='campaign'?'15 MINUTOS · 3 CHEFES':'HORDA SEM FIM'}</p>${button('play','COMEÇAR PARTIDA',true)}</div></div><nav class="menu-tools" aria-label="Preparação">${button('arsenal','ARSERNAL')}${button('bestiary','BESTIÁRIO')}${button('merchant','BENTO')}</nav>`,'map-window');
    if(screen==='arsenal'){
      const active=['pistol','molotov','horseshoe','ghostShot','requiem','silverRain','lantern','boneStorm','returningBlade','lunarReturn','pirateBomb'];
      const ordered=[...new Set([...active,'heart','doubleShot','ironWill','soulHarvest','lastStand',...Object.keys(ABILITIES)])];
      const query=vm.search.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu,'');
      const filtered=ordered.filter(id=>(vm.filter!=='equipped'||profile.deck.includes(id))&&(vm.filter!=='active'||active.includes(id))&&ABILITIES[id].name.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu,'').includes(query));
      const page=pageItems(filtered,compact?2:4);
      content=wrap(`${back(state.returnScreen,'PREPARAÇÃO')}<div class="menu-title-row"><h1>ARSERNAL</h1><span>${profile.deck.length}/8 EQUIPADAS</span></div><div class="catalog-tools"><input data-card-search placeholder="Buscar carta…" aria-label="Buscar carta"><div>${[['all','TODAS'],['active','ATAQUES'],['equipped','DECK']].map(([id,label])=>`<button data-menu-action="filter:${id}" aria-pressed="${vm.filter===id}">${label}</button>`).join('')}</div></div><p class="menu-lead">Equipe de 3 a 8 cartas. Elas evoluem nas ofertas de nível.</p><div class="arsenal-grid menu-fill">${page.items.map(id=>{const c=ABILITIES[id],selected=profile.deck.includes(id);return `<button class="arsenal-choice ${selected?'is-selected':''}" data-menu-action="deck:${id}" aria-pressed="${selected}" ${selected&&profile.deck.length<=3||!selected&&profile.deck.length>=8?'disabled':''}><span class="card-mark">${c.icon}</span><span><b>${c.name}</b><small>${cardDescription(id,1)}</small></span><em>${selected?'EQUIPADA':'EQUIPAR'} · MÁX. ${abilityMaxLevel(id)}</em></button>`;}).join('')||'<p>Nenhuma carta encontrada.</p>'}</div>${page.nav}`,'catalog-window');
    }
    if(screen==='bestiary'){
      const page=pageItems(CREATURES,compact?2:4);
      content=wrap(`${back(state.returnScreen,'PREPARAÇÃO')}<h1>BESTIÁRIO</h1><p class="menu-lead">${profile.discoveries.filter(id=>CREATURES.some(c=>c[0]===id)).length}/${CREATURES.length} criaturas descobertas</p><div class="bestiary-grid menu-fill">${page.items.map(([id,name,hint,lore,art])=>{const known=profile.discoveries.includes(id);return `<article class="creature-card ${known?'':'is-undiscovered'}">${art===null?'<span class="creature-sigil">☠</span>':`<img src="${ART}${art||id}.svg" alt="${known?name:''}">`}<div><small>${known?'DESCOBERTO':'NÃO DESCOBERTO'}</small><h2>${known?name:'???'}</h2><p>${known?lore:hint}</p></div></article>`;}).join('')}</div>${page.nav}`);
    }
    if(screen==='merchant')content=wrap(`${back(state.returnScreen,'PREPARAÇÃO')}<div class="merchant-layout menu-fill"><div class="merchant-portrait"><img src="${ART}bento.webp" alt="Bento"></div><div class="merchant-content"><h1>BENTO</h1><p class="menu-wallet">◈ ${profile.coins} MOEDAS</p><div class="merchant-products">${[['damage','Arma temperada','+2 de dano inicial'],['health','Fôlego da fronteira','+10 de vida inicial'],['speed','Botas de viagem','+0,25 de velocidade']].map(([id,name,desc])=>{const rank=profile.purchases[id]||0,price=state.price(id);return `<article><div><small>NÍVEL ${rank}/5 · PERMANENTE</small><h2>${name}</h2><p>${desc}</p></div><button data-menu-action="buy:${id}" ${rank>=5||profile.coins<price?'disabled':''}>${rank>=5?'MÁXIMO':`◈ ${price}`}</button></article>`;}).join('')}</div></div></div>`);
    if(screen==='settings'){
      const touch=vm.gameViewModel.touchDevice,value=vm.gameViewModel.sensitivity();
      content=wrap(`${back('home','MENU PRINCIPAL')}<h1>CONFIGURAÇÃO</h1><div class="settings-list menu-fill"><label class="sensitivity-setting"><span>Sensibilidade ${touch?'do toque':'do mouse'}<output>${value.toFixed(1)}×</output></span><input data-sensitivity type="range" min="0.2" max="3" step="0.1" value="${value}" aria-label="Sensibilidade ${touch?'do toque':'do mouse'}"><small>Menor: mais precisão · Maior: giro mais rápido</small></label>${[['effects','Vento e luzes'],['grain','Granulação PSX']].map(([id,label])=>`<button data-menu-action="setting:${id}" aria-pressed="${state.settings[id]}"><span>${label}</span><b>${state.settings[id]?'LIGADO':'DESLIGADO'}</b></button>`).join('')}${touch?`<button data-menu-action="fullscreen"><span>Jogar em tela cheia</span><b>ATIVAR ↗</b></button><p class="install-tip">No iPhone/iPad: Compartilhar → Adicionar à Tela de Início → abrir pelo ícone para jogar sem a barra do navegador.</p>`:''}</div>`,'settings-window');
    }
    if(screen==='exit')content=wrap(`${logo}<h1>ATÉ A PRÓXIMA JORNADA</h1><p>Seu progresso foi guardado neste navegador.</p>${button('home','VOLTAR AO MENU',true)}`,'exit-window');
    this.root.innerHTML=content;
    const search=this.root.querySelector('[data-card-search]');if(search)search.value=vm.search;
  }
}

