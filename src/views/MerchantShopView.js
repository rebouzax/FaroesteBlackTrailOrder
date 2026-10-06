const ART=`${import.meta.env.BASE_URL}art/menu/`;
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Shared presentation; purchases and campaign rules stay in the view models.
export function merchantShop({products,state,wallet,caption,progress,notice='',run=false}){
  const perPage=window.innerWidth<650||window.innerHeight<540?2:4,pages=Math.max(1,Math.ceil(products.length/perPage));
  state.shopPage=Math.min(Math.max(0,state.shopPage),pages-1);
  const items=products.slice(state.shopPage*perPage,(state.shopPage+1)*perPage);
  if(!items.some(item=>item.id===state.shopFocus))state.shopFocus=items[0]?.id;
  const selected=items.find(item=>item.id===state.shopFocus);
  const attr=run?'data-run-shop':'data-menu-action',action=command=>`${attr}="shop:${command}"`;
  return `<div class="bento-shop">
    <aside class="bento-host"><img src="${ART}bento-psx.png" alt="Bento, mercador nômade"><div class="bento-host-caption"><small>MERCADOR DA FRONTEIRA</small><b>BENTO</b><span>Relíquias para quem volta vivo.</span></div></aside>
    <div class="bento-counter">
      <header class="bento-title"><div><small>${escape(caption)}</small><h1>OS ACHADOS DE BENTO</h1></div><div class="bento-wallet"><small>MOEDAS</small><b>◈ ${wallet.toLocaleString('pt-BR')}</b></div></header>
      <p class="bento-progress">${escape(progress)}</p>
      <nav class="bento-tabs" aria-label="Seções da loja">${[['upgrades',run?'SUPRIMENTOS':'MELHORIAS'],['cards','CARTAS EXCLUSIVAS']].map(([id,name])=>`<button type="button" ${action(`tab:${id}`)} aria-pressed="${state.shopTab===id}">${name}</button>`).join('')}</nav>
      <div class="bento-stock">${items.map(item=>`<button type="button" class="bento-item ${item.id===state.shopFocus?'is-selected':''} ${item.known?'':'is-locked'}" ${action(`focus:${item.id}`)} aria-pressed="${item.id===state.shopFocus}"><span class="bento-sigil" aria-hidden="true">${item.known?escape(item.icon):'?'}</span><span class="bento-item-copy"><small>${escape(item.tag)}</small><b>${item.known?escape(item.name):'???'}</b><span>${item.rank&&state.shopTab==='upgrades'?`Nível ${item.rank}/${item.max||'∞'}`:item.owned?'✓ ADQUIRIDA':item.known?`◈ ${item.price}`:'NÃO DESCOBERTA'}</span></span></button>`).join('')}</div>
      <nav class="bento-pages" aria-label="Páginas da loja"><button type="button" ${action('page:-1')} ${!state.shopPage?'disabled':''} aria-label="Página anterior">‹</button><span>${state.shopPage+1} / ${pages}</span><button type="button" ${action('page:1')} ${state.shopPage===pages-1?'disabled':''} aria-label="Próxima página">›</button></nav>
      ${selected?`<section class="bento-detail" aria-label="Item selecionado"><div class="bento-detail-copy"><h2>${selected.known?escape(selected.name):'Relíquia desconhecida'}</h2><p>${escape(selected.requirement||selected.description)}</p><div class="bento-comparison"><span>${escape(selected.current)}</span><span aria-hidden="true">→</span><strong>${escape(selected.next)}</strong></div></div><button type="button" class="bento-purchase" ${action(`buy:${selected.id}`)} ${selected.enabled?'':'disabled'}><b>${selected.known&&!['NÍVEL MÁXIMO','CARTA ADQUIRIDA'].includes(selected.status)?`◈ ${selected.price}`:''}</b><span>${escape(selected.status)}</span></button></section>`:''}
      <div class="bento-feedback" role="status">${escape(notice|| (state.shopTab==='cards'?run?'Cartas compradas são ativadas agora e ficam disponíveis no Arsernal.':'Compre uma vez. Equipe no Arsernal para as próximas jornadas.':run?'Suprimentos valem somente até o fim desta partida.':'Melhorias permanentes acompanham todos os campeões.'))}</div>
    </div>
  </div>`;
}
