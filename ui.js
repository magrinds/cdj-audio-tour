// ---------- tabbed layout: Listen / Map / Plan / Ask ----------
(function(){
  const body=document.body, tabs=[...document.querySelectorAll('#tabs button')];
  let view=sessionStorage.getItem('rhrn_view')||'listen', prev='listen';
  function mark(v){ tabs.forEach(b=>b.classList.toggle('on', b.dataset.v===v)); }
  function show(v){
    if(v==='ask'){ if(!$('askSheet').classList.contains('open')) $('askBtn').click(); mark('ask'); return; }
    $('askSheet').classList.remove('open');
    if(view!==v) window.scrollTo(0,0);
    view=v; prev=v; body.dataset.v=v; mark(v); sessionStorage.setItem('rhrn_view', v);
    if(v==='map'){ try{ drawMap(); }catch(e){} }
    if(v==='plan'){ try{ window.liveSchedule && window.liveSchedule(); }catch(e){} }
    refresh();
  }
  window.showView=show;
  tabs.forEach(b=>b.onclick=()=>show(b.dataset.v));
  // closing the Ask screen returns to the tab you came from
  new MutationObserver(()=>{ mark($('askSheet').classList.contains('open') ? 'ask' : view); }).observe($('askSheet'), {attributes:true, attributeFilter:['class']});
  $('seeAlbum').onclick=()=>{ $('addSheet').classList.remove('open'); $('albumBtn').click(); };
  $('camBtn').onclick=()=>$('fab').click();
  $('upNext').onclick=()=>show('plan');
  $('miniPause').onclick=()=>$('fabPause').click();
  $('miniRew').onclick=()=>$('fabRew').click();
  const p2=n=>String(n).padStart(2,'0');
  const hm=m=>{ m=((Math.round(m)%1440)+1440)%1440; return p2(Math.floor(m/60))+':'+p2(m%60); };
  const rel=d=>{ d=Math.round(d); if(!isFinite(d)) return ''; if(d<=0) return 'now'; return d<60?`in ${d} min`:`in ${Math.floor(d/60)} h ${d%60} min`; };
  function refresh(){
    try{
      // mini player on Map and Plan
      const m=$('mini'); m.classList.toggle('has', !!current);
      if(current){ $('miniT').textContent=current.stop.name; $('miniPause').textContent=paused?'▶ Play':'Pause'; }
      // up next: first stop not heard yet and not playing now
      const nx=STOPS.find(s=>!played.has(s.id) && !(current && current.stop.id===s.id));
      const box=$('upNext');
      if(nx){ box.classList.add('has'); $('unName').textContent=nx.name;
        const now=new Date(), nowM=now.getHours()*60+now.getMinutes();
        const eta=(window.schedEta||{})[nx.id];
        let meta=[];
        if(eta!=null && isFinite(eta)) meta.push(`${rel(eta-nowM)}, about ${hm(eta)}`);
        if(lastFix && isFinite(nx.lat)) meta.push(fmt(dist(lastFix.lat,lastFix.lng,nx.lat,nx.lng))+' away');
        $('unMeta').textContent=meta.join(' · ') || 'Tap to see the plan';
      } else box.classList.remove('has');
      // schedule status pill on Listen
      const pill=$('schedPill'), st=window.schedStatus;
      if(st && store.get(SK+'sched',null) && !(store.get(SK+'sched',{}).cleared)){ pill.style.display='inline-block'; pill.textContent=st; pill.classList.toggle('late', !!window.schedLate); }
      else pill.style.display='none';
    }catch(e){}
  }
  setInterval(refresh, 5000);
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) refresh(); });
  try{ window.liveSchedule && window.liveSchedule(); }catch(e){}
  show(view==='ask'?'listen':view);
})();
