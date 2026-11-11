// Right Here, Right Now: tour picker, AI tour creation, and live AI replanning.
// Runs after app.js and uses its globals (T, STOPS, played, store, SK, SB, SBK, $, esc, ...).

const ORIGINAL_STOPS = (window.TOUR_ORIGINAL_STOPS || []).slice();
const tourLink = id => location.origin + location.pathname + '?tour=' + encodeURIComponent(id);
async function fn(body, ms){
  const ctl = new AbortController(); const t = setTimeout(()=>ctl.abort(), ms||150000);
  try{ const r = await fetch(`${SB}/functions/v1/tour-ask`, {method:'POST', signal:ctl.signal, headers:{apikey:SBK, Authorization:'Bearer '+SBK, 'Content-Type':'application/json'}, body:JSON.stringify(body)});
    const j = await r.json().catch(()=>({})); return {ok:r.ok, status:r.status, j}; }
  finally{ clearTimeout(t); }
}
const slugify = s => (s||'tour').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40) || 'tour';
function speak(text, onend){ if(!text){ onend && setTimeout(onend,300); return; } sayText(text, onend); }

// ---------- header + tour bar ----------
document.title = 'Right Here, Right Now · ' + T.title;
$('sub').textContent = T.title + ' audio tour · works offline once loaded';
$('tourName').textContent = T.title;
$('tourBlurb').textContent = T.blurb || T.city || '';
if(T.stopsTip) $('stopsTip').textContent = T.stopsTip;
if(T.walkFootnote) $('walkFoot').textContent = T.walkFootnote; else $('walkFoot').style.display='none';
function planBadge(){ $('planBadge').style.display = planEdited ? '' : 'none'; }
planBadge();

// ---------- tour picker ----------
function localTours(){ return store.get('rhrn_mytours', []); }
function rememberTour(t){ store.set('rhrn_hidden', store.get('rhrn_hidden', []).filter(x=>x!==t.id)); const L = localTours().filter(x=>x.id!==t.id); L.unshift({id:t.id, title:t.title, city:t.city, blurb:t.blurb, request:t.request||null}); store.set('rhrn_mytours', L.slice(0,30)); }
if(!T.builtin) rememberTour(T);
let reqs = {};
async function openPicker(){
  $('recreate').style.display = T.request ? '' : 'none';
  $('pickSheet').classList.add('open');
  const builtins = Object.values(window.TOUR_DEFS||{}).map(t=>({id:t.id, title:t.title, city:t.city, blurb:t.blurb, tag:'Built in'}));
  let shared = [];
  const render = ()=>{
    const seen = new Set(store.get('rhrn_hidden', [])); const all = [];
    for(const t of builtins.concat(shared, localTours().map(x=>Object.assign({tag:'Saved on this phone'},x)))) if(!seen.has(t.id)){ seen.add(t.id); all.push(t); }
    reqs = {}; all.forEach(t=>{ if(t.request) reqs[t.id]=t.request; }); if(T.request) reqs[T.id]=T.request;
    $('pickList').innerHTML = all.map(t=>`<div class="dest" data-tour="${esc(t.id)}"><div class="n">${esc(t.title)}${t.id===T.id?' <span style="color:var(--accent)">· current</span>':''}<div class="m">${esc(t.blurb||t.city||'')}${t.tag?' · '+esc(t.tag):''}</div></div>${reqs[t.id]?`<button class="secondary" data-recreate="${esc(t.id)}" style="padding:8px 10px;margin-right:4px" title="Recreate with the same answers">↻</button>`:''}${t.tag==='Built in'?'':`<button class="secondary" data-del="${esc(t.id)}" style="padding:8px 10px;margin-right:4px" title="Delete">🗑</button>`}${t.id===T.id?'':`<button class="secondary" data-open="${esc(t.id)}" style="padding:8px 12px">Open</button>`}</div>`).join('');
    $('pickList').querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>switchTour(b.dataset.open));
    $('pickList').querySelectorAll('[data-recreate]').forEach(b=>b.onclick=()=>openCreate(reqs[b.dataset.recreate]));
    $('pickList').querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>deleteTour(b.dataset.del, all.find(t=>t.id===b.dataset.del), ()=>{ shared=shared.filter(t=>t.id!==b.dataset.del); render(); }));
  };
  render();
  if(navigator.onLine){ $('pickStatus').textContent='Loading shared tours…';
    try{ const r = await fetch(`${SB}/rest/v1/rhrn_tours?select=id,title,city,blurb,created_at,request:data->request&order=created_at.desc&limit=50`, {headers:{apikey:SBK, Authorization:'Bearer '+SBK}});
      const j = await r.json(); if(Array.isArray(j)) shared = j.map(t=>Object.assign({tag:'Shared'}, t)); $('pickStatus').textContent=''; render(); }
    catch(e){ $('pickStatus').textContent='Could not load shared tours.'; } }
  else $('pickStatus').textContent='Offline: showing tours saved on this phone.';
}
async function deleteTour(id, t, done){
  const name = (t && t.title) || id, pin = ownerPin();
  const forgetHere = ()=>{ store.set('rhrn_mytours', localTours().filter(x=>x.id!==id)); store.set('rhrn_hidden', store.get('rhrn_hidden', []).concat(id).slice(-200)); try{ localStorage.removeItem('rhrn_tourdata_'+id); }catch(e){} };
  if(!pin){
    if(!confirm(`Remove "${name}" from this phone?\n\nIt stays in the shared list for others. To delete it for everyone, turn on Owner mode in Settings first.`)) return;
    forgetHere(); toast('Removed from this phone');
  } else {
    if(!confirm(`Delete "${name}" for everyone? This can't be undone.`)) return;
    if(!navigator.onLine){ toast('Deleting needs signal'); return; }
    try{ const {ok,status} = await fn({mode:'delete_tour', tour_id:id, pin}, 20000);
      if(status===401){ toast('Owner PIN no longer valid'); return; }
      if(!ok) throw 0; forgetHere(); toast('Tour deleted'); }
    catch(e){ toast('Could not delete. Try again with signal.'); return; }
  }
  if(id===T.id){ switchTour('campos-do-jordao'); return; }
  done && done();
}
function switchTour(id){
  if(current && !paused) togglePause();
  store.set('rhrn_tour', id); location.href = tourLink(id);
}
$('tourBtn').onclick = openPicker;
$('shareTour').onclick = async ()=>{
  const url = tourLink(T.id), text = `${T.title} audio tour: open in Chrome, tap Start tour, allow location.`;
  try{ if(navigator.share){ await navigator.share({title:T.title, text, url}); return; } }catch(e){ if(e && e.name==='AbortError') return; }
  try{ await navigator.clipboard.writeText(url); toast('Link copied'); }catch(e){ prompt('Copy this link', url); }
};
$('resetPlan').onclick = ()=>{
  if(!planEdited){ toast('This tour is already on its original plan'); return; }
  if(!confirm('Go back to the original plan for everyone on this tour?')) return;
  store.set(SK+'plan', null); savePlanRemote(null); location.reload();
};

// ---------- create a tour ----------
const chipSets = { len:['1 hour','2 hours','3 hours','Half day'], mode:['Walking','Walking + Uber','Car'], pace:['Easy','Moderate','Active'],
  likes:['Food & snacks','History','Architecture','Art','Local shopping','Nature & views','Quirky stories','Surprise me'] };
const pickState = { len:'3 hours', mode:'Walking + Uber', pace:'Easy', likes:new Set(['Food & snacks','History']) };
function renderChips(){
  for(const k of Object.keys(chipSets)){
    $('c_'+k).innerHTML = chipSets[k].map(v=>{ const on = k==='likes' ? pickState.likes.has(v) : pickState[k]===v; return `<button class="${on?'on':''}" data-k="${k}" data-v="${esc(v)}">${esc(v)}</button>`; }).join('');
  }
  document.querySelectorAll('#createSheet .chips button').forEach(b=>b.onclick=()=>{ const k=b.dataset.k, v=b.dataset.v;
    if(k==='likes'){ pickState.likes.has(v)?pickState.likes.delete(v):pickState.likes.add(v); } else pickState[k]=v; renderChips(); });
}
function defaultWhen(){ const d=new Date(); if(d.getHours()>=17) d.setDate(d.getDate()+1);
  const p=n=>String(n).padStart(2,'0'); return { date:`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`, time: d.getHours()>=17||d.getHours()<9 ? '10:00' : `${p(d.getHours()+1)}:00` }; }
function openCreate(req){
  $('pickSheet').classList.remove('open'); $('createSheet').classList.add('open');
  const w=defaultWhen(); $('cDate').value=w.date; $('cTime').value=w.time; $('cEnd').value='';
  if(req){ if(req.time) $('cTime').value=req.time; if(req.end) $('cEnd').value=req.end; }
  if(req){
    $('cWhere').value=req.where||''; $('cStart').value=req.start||''; $('cGroup').value=req.group||''; $('cMore').value=req.more||'';
    if(chipSets.len.includes(req.length)) pickState.len=req.length;
    if(chipSets.mode.includes(req.transport)) pickState.mode=req.transport;
    if(chipSets.pace.includes(req.pace)) pickState.pace=req.pace;
    if(Array.isArray(req.interests)) pickState.likes=new Set(req.interests.filter(x=>chipSets.likes.includes(x)));
    $('cStatus').innerHTML='Same answers as before. Change anything you like, then tap <b>Create tour</b>.';
  } else {
    $('cWhere').value = store.get('rhrn_c_where',''); $('cStart').value = store.get('rhrn_c_start',''); $('cGroup').value = store.get('rhrn_c_group',''); $('cMore').value = store.get('rhrn_c_more','');
  }
  renderChips();
}
$('newTour').onclick = ()=>openCreate(null);
$('recreate').onclick = ()=>openCreate(T.request);
$('cMic').onclick = ()=>{ const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR){ toast('Voice input not supported here'); return; }
  const r=new SR(); r.lang='en-US'; r.interimResults=true; const base=$('cMore').value; $('cMic').textContent='🎙 Listening…';
  r.onresult=e=>{ $('cMore').value=(base?base+' ':'')+[...e.results].map(x=>x[0].transcript).join(''); }; r.onend=()=>{ $('cMic').textContent='🎤 Speak'; }; r.onerror=r.onend; r.start(); };
$('cGo').onclick = async ()=>{
  const where=$('cWhere').value.trim(); if(!where){ $('cStatus').innerHTML='<span class="bad">Tell me where the tour is.</span>'; return; }
  if(!navigator.onLine){ $('cStatus').innerHTML='<span class="bad">Creating a tour needs signal.</span>'; return; }
  store.set('rhrn_c_where',where); store.set('rhrn_c_start',$('cStart').value); store.set('rhrn_c_group',$('cGroup').value); store.set('rhrn_c_more',$('cMore').value);
  $('cGo').disabled=true; const t0=Date.now(); let stage='Claude is researching places and planning the route';
  // progress bar: planning creeps 2-25% over ~90s, writing 25-88% by stories done, map 88-95, save 95-100
  let step=0, frac=0;
  const pct=()=>{ const el=(Date.now()-t0)/1000; return step===0 ? 2+23*(1-Math.exp(-el/45)) : step===1 ? 25+63*frac : step===2 ? 90 : 97; };
  const show=()=>{ $('cProg').style.display=''; $('cBar').style.width=pct().toFixed(1)+'%';
    document.querySelectorAll('#cProg [data-s]').forEach(e=>{ const i=+e.dataset.s; e.className = i<step?'done':i===step?'on':''; });
    $('cStatus').textContent=`${stage}… ${Math.round((Date.now()-t0)/1000)}s. Usually 2 to 3 minutes; keep this screen open.`; };
  const tick=setInterval(show,1000); show();
  const form={where, start:$('cStart').value.trim(), date:$('cDate').value, time:$('cTime').value, end:$('cEnd').value, length:pickState.len, transport:pickState.mode, pace:pickState.pace,
    interests:[...pickState.likes], group:$('cGroup').value.trim(), more:$('cMore').value.trim(), lat:lastFix?lastFix.lat:null, lng:lastFix?lastFix.lng:null,
    local:new Date().toString().slice(0,24)};
  try{
    const o = await fn(Object.assign({mode:'create_outline'}, form), 150000);
    if(!o.ok || !o.j.outline) throw new Error(o.j.detail||o.j.error||'could not plan the route');
    const {outline, ctx, jobs} = o.j;
    step=1; stage=`Writing the stories for ${outline.stops.length} places and ${outline.story_topics.length} travel stories (0/${jobs.length})`;
    const geoP = fn({mode:'create_geocode', items:outline.stops, city:outline.city}, 120000).then(r=>r.ok?r.j.items:[]).catch(()=>[]);
    const texts={}; let done=0; const batches=[]; for(let i=0;i<jobs.length;i+=3) batches.push(jobs.slice(i,i+3));
    let next=0; await Promise.all(Array.from({length:Math.min(5,batches.length)}, async()=>{ while(next<batches.length){ const bt=batches[next++];
      for(let attempt=0; attempt<2; attempt++){ try{ const r=await fn({mode:'create_narrate', ctx, jobs:bt}, 120000); if(r.ok){ Object.assign(texts, r.j.texts||{}); break; } }catch(e){} }
      done+=bt.length; frac=done/jobs.length; stage=stage.replace(/\(\d+\/\d+\)/, `(${done}/${jobs.length})`); } }));
    step=2; stage='Placing everything on the map'; show(); const geo=await geoP;
    step=3; stage='Saving the tour'; show();
    const s2 = await fn({mode:'create_assemble', outline, texts, geo, where, group:form.group, form}, 60000);
    if(!s2.ok || !s2.j.tour) throw new Error(s2.j.detail||s2.j.error||'could not save');
    const tour=s2.j.tour;
    store.set('rhrn_tourdata_'+tour.id, tour); rememberTour(tour);
    step=4; $('cBar').style.width='100%'; document.querySelectorAll('#cProg [data-s]').forEach(e=>e.className='done');
    $('cStatus').innerHTML=`<span class="ok">Done: ${esc(tour.title)}, ${tour.stops.length} places and ${(tour.fillers.length+tour.walkStories.length)} stories.</span> Opening…`;
    setTimeout(()=>switchTour(tour.id), 900);
  }catch(e){ $('cProg').style.display='none'; $('cStatus').innerHTML='<span class="bad">Could not create the tour: '+esc(e.name==='AbortError'?'it took too long; try again or pick a shorter tour':e.message).slice(0,200)+'</span>'; }
  finally{ clearInterval(tick); $('cGo').disabled=false; }
};

// ---------- live replanning ----------
window.planContext = function(){
  const inPlan = new Set(STOPS.map(s=>s.id));
  return {
    plan: STOPS.map(s=>({id:s.id, name:s.name, lat:isFinite(s.lat)?+s.lat.toFixed(5):null, lng:isFinite(s.lng)?+s.lng.toFixed(5):null, played:played.has(s.id), trigger:s.radius?(s.walk?'on arrival on foot':'as you pass'):'when tapped', added:!!s.custom})),
    removed: ORIGINAL_STOPS.filter(s=>!inPlan.has(s.id)).map(s=>({id:s.id, name:s.name})),
    transport: T.mode || ''
  };
};
let proposal = null;
function buildProposal(j){
  const byId = id => { const s = STOPS.find(s=>s.id===id) || ORIGINAL_STOPS.find(s=>s.id===id); return s ? Object.assign({}, s) : null; };
  const inPlan = id => STOPS.some(s=>s.id===id);
  const keepPlayed = STOPS.filter(s=>played.has(s.id)).map(s=>Object.assign({}, s));
  const out = keepPlayed.slice(); const used = new Set(out.map(s=>s.id)); const items = [];
  for(const it of (j.plan||[])){
    if(it.id){ const s = byId(it.id); if(!s || used.has(s.id)) continue; out.push(s); used.add(s.id); items.push({kind: inPlan(s.id)?'keep':'back', s}); }
    else if(it.new){ const n=it.new; if(!isFinite(n.lat)||!isFinite(n.lng)||!n.name) continue;
      const s = {id:'x_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5), name:String(n.name).slice(0,80), lat:+n.lat, lng:+n.lng,
        radius:Math.max(40, Math.min(400, +n.radius||(n.arrive==='ride'?200:80))), walk:n.arrive!=='ride', text:String(n.text||'').trim()||('Welcome to '+n.name+'.'),
        look:n.look?String(n.look).slice(0,120):'', note:n.note?String(n.note).slice(0,140):'', custom:true, approx:!!n.approx };
      out.push(s); used.add(s.id); items.push({kind:'new', s}); }
  }
  const removed = STOPS.filter(s=>!used.has(s.id));
  // drop ordering rules that point at stops no longer in the plan
  for(const s of out){ if(s.before && !used.has(s.before)) { s.before=undefined; } if(s.after && !used.has(s.after)) { s.after=undefined; } }
  return {stops:out, items, removed, summary:j.summary||'Here is the new plan.'};
}
window.onPlanProposal = function(j, viaVoice){
  proposal = buildProposal(j);
  if(!proposal.items.length && !proposal.removed.length){ $('askAns').textContent = j.summary || 'No change needed.'; speak(j.summary); return; }
  const li = (icon, s, extra)=>`<div class="stop"><div class="num" style="font-size:15px">${icon}</div><div class="info"><div class="name">${esc(s.name)}</div><div class="meta">${extra}</div></div></div>`;
  $('askAns').innerHTML = (`<div style="font-size:18px">${esc(proposal.summary)}</div>
    <div class="card" style="margin:10px 0 0;padding:8px 12px">
      <div class="status" style="margin:0 0 4px;font-weight:700">Proposed plan from here</div>
      ${proposal.items.map(it=>li(it.kind==='new'?'✨':it.kind==='back'?'↺':'✓', it.s, it.kind==='new'?('new stop'+(it.s.approx?' · location approximate':'')+(it.s.note?' · '+esc(it.s.note):'')):it.kind==='back'?'back in the plan':'kept')).join('') || '<div class="status">No stops left after this change.</div>'}
      ${proposal.removed.length?`<div class="status" style="margin-top:6px">Removed: ${proposal.removed.map(s=>'<s>'+esc(s.name)+'</s>').join(', ')}</div>`:''}
    </div>
    <div class="row" style="margin-top:10px"><button id="planYes" style="flex:2">✅ Apply</button><button id="planNo" class="secondary" style="flex:1">Cancel</button></div>
    <div class="status" id="planMsg">${viaVoice?'Listening for "yes" or "no" after I read this…':'Applies for everyone on this tour.'}</div>`).replace(/\n\s*/g,'');
  $('planYes').onclick = ()=>applyProposal();
  $('planNo').onclick = ()=>{ proposal=null; $('askAns').innerHTML='<div class="status">Kept the current plan.</div>'; speak('Okay, keeping the current plan.'); };
  if(current && !paused) togglePause();
  speak(proposal.summary + ' Should I apply it?', viaVoice ? listenYesNo : null);
};
function listenYesNo(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR || !proposal) return;
  const r=new SR(); r.lang='en-US'; r.interimResults=false; let heard='';
  $('planMsg') && ($('planMsg').textContent='🎙 Listening: say "yes" to apply or "no" to cancel…');
  r.onresult=e=>{ heard=[...e.results].map(x=>x[0].transcript).join(' ').toLowerCase(); };
  r.onend=()=>{ if(!proposal) return;
    if(/\b(yes|yeah|yep|sure|ok|okay|apply|do it|go ahead|sim)\b/.test(heard)) applyProposal();
    else if(/\b(no|nope|cancel|don'?t|keep|não)\b/.test(heard)) $('planNo').click();
    else if($('planMsg')) $('planMsg').textContent = heard ? `Heard "${heard}". Tap Apply or Cancel.` : 'Tap Apply or Cancel.'; };
  r.onerror=()=>{}; try{ r.start(); }catch(e){}
}
function applyStops(newStops, opts){
  STOPS.splice(0, STOPS.length, ...newStops);
  planEdited = true; planBadge();
  if(!STOPS.find(s=>s.id===START_ID) && STOPS[0]) START_ID = STOPS[0].id;
  queue = queue.filter(id=>findAny(id));
  BB=null; renderScripts(); fillWalkSel(); setGmap(); renderStops(); drawMap(); try{ renderWalk(); }catch(e){}
  if(!(opts&&opts.quiet)) fetchPhotos();
}
function applyProposal(){
  if(!proposal) return;
  const p = proposal; proposal = null;
  applyStops(p.stops);
  const plan = {v:Date.now(), by:store.get('cdj_who','')||'', stops:JSON.parse(JSON.stringify(STOPS))};
  store.set(SK+'plan', plan); savePlanRemote(plan);
  $('askAns').innerHTML = `<div class="status"><span class="ok">Plan updated.</span> ${navigator.onLine?'Everyone on this tour gets it within a minute.':'It will sync to the group when you have signal.'}</div>`;
  speak('Done. The plan is updated.');
  toast('🗺 Plan updated');
}
async function savePlanRemote(plan){
  store.set(SK+'planPending', plan===null ? {clear:true} : plan);
  if(!navigator.onLine) return;
  try{ const {ok} = await fn({mode:'save_plan', tour_id:T.id, plan}, 20000); if(ok) store.set(SK+'planPending', null); }catch(e){}
}
async function syncPlan(){
  if(!navigator.onLine) return;
  const pend = store.get(SK+'planPending', null);
  if(pend){ await savePlanRemote(pend.clear ? null : pend); return; }
  try{ const r = await fetch(`${SB}/rest/v1/rhrn_tour_plans?tour_id=eq.${encodeURIComponent(T.id)}&select=v,plan,updated_by`, {headers:{apikey:SBK, Authorization:'Bearer '+SBK}, cache:'no-store'});
    const rows = await r.json(); if(!Array.isArray(rows) || !rows.length) return;
    const row = rows[0], mine = store.get(SK+'plan', null), myV = mine ? mine.v : 0;
    if(row.v > myV){
      if(row.plan && row.plan.stops){ store.set(SK+'plan', row.plan); applyStops(row.plan.stops); toast('🗺 Plan updated'+(row.updated_by?' by '+row.updated_by:'')); }
      else if(mine){ store.set(SK+'plan', null); toast('Plan reset to the original. Reloading…'); setTimeout(()=>location.reload(), 1500); }
    }
  }catch(e){}
}
setInterval(syncPlan, 45000); window.addEventListener('online', syncPlan); setTimeout(syncPlan, 4000);
