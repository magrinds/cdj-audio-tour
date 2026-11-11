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
$('qrBtn').onclick = ()=>$('shareTour').click();
$('shareTour').onclick = ()=>{
  const url = tourLink(T.id), text = `${T.title} audio tour: open in Chrome, tap Start tour, allow location.`;
  $('pickSheet').classList.remove('open'); $('shareSheet').classList.add('open');
  $('shareUrl').textContent = url;
  try{ const q = qrcode(0, 'M'); q.addData(url); q.make(); $('qrBox').innerHTML = q.createSvgTag({cellSize:7, margin:2, scalable:true});
    const svg=$('qrBox').querySelector('svg'); if(svg){ svg.style.width='min(72vw,300px)'; svg.style.height='auto'; svg.style.display='block'; } }
  catch(e){ $('qrBox').textContent='Could not draw the QR code.'; }
  $('shareSys').style.display = navigator.share ? '' : 'none';
  $('shareSys').onclick = async ()=>{ try{ await navigator.share({title:T.title, text, url}); }catch(e){} };
  $('shareCopy').onclick = async ()=>{ try{ await navigator.clipboard.writeText(url); toast('Link copied'); }catch(e){ prompt('Copy this link', url); } };
  // Web NFC: only Chrome on Android supports it; it writes the link to a blank NFC sticker or card
  const nfcOk = 'NDEFReader' in window;
  $('nfcWrite').disabled = !nfcOk; $('nfcWrite').style.opacity = nfcOk ? '' : .5;
  $('nfcMsg').textContent = nfcOk ? 'Writes the link to a blank NFC sticker or card. Anyone who taps it with their phone opens the tour.' : 'NFC writing needs Chrome on Android. Phones can\'t send links to each other over NFC anymore, so the QR code is the quickest way.';
  $('nfcWrite').onclick = async ()=>{ if(!nfcOk) return;
    try{ const w = new NDEFReader(); $('nfcMsg').textContent='Hold a blank NFC sticker or card to the back of your phone…';
      await w.write({records:[{recordType:'url', data:url}]}); $('nfcMsg').innerHTML='<span class="ok">Done.</span> Tapping that tag now opens this tour.'; }
    catch(e){ $('nfcMsg').innerHTML='<span class="bad">Could not write the tag: '+esc(e.message||e)+'</span>'; } };
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
    // start the route planning in the background, then poll for it (survives signal drops)
    let start=null; for(let a=0;a<3 && !start;a++){ try{ const r=await fn(Object.assign({mode:'create_outline_job'}, form), 30000); if(r.ok && r.j.job) start=r.j.job; }catch(e){ await new Promise(ok=>setTimeout(ok,3000)); } }
    if(!start) throw new Error('could not reach the server; check signal and try again');
    let res=null; const until=Date.now()+300000;
    while(!res && Date.now()<until){ await new Promise(ok=>setTimeout(ok,4000));
      try{ const r=await fetch(`${SB}/rest/v1/rhrn_jobs?id=eq.${start}&select=status,result,error`,{headers:{apikey:SBK,Authorization:'Bearer '+SBK},cache:'no-store'}); const rows=await r.json();
        if(rows && rows[0]){ if(rows[0].status==='done') res=rows[0].result; else if(rows[0].status==='error') throw new Error(rows[0].error||'could not plan the route'); } }
      catch(e){ if(e && e.message && !/fetch|network/i.test(e.message)) throw e; } }
    if(!res || !res.outline) throw new Error('route planning took too long; try again');
    const {outline, ctx, jobs} = res;
    step=1; stage=`Writing the stories for ${outline.stops.length} places and ${outline.story_topics.length} travel stories (0/${jobs.length})`;
    const geoP = fn({mode:'create_geocode', items:outline.stops, city:outline.city}, 120000).then(r=>r.ok?r.j.items:[]).catch(()=>[]);
    const texts={}; let done=0; const batches=[]; for(let i=0;i<jobs.length;i+=3) batches.push(jobs.slice(i,i+3));
    let next=0; await Promise.all(Array.from({length:Math.min(5,batches.length)}, async()=>{ while(next<batches.length){ const bt=batches[next++];
      for(let attempt=0; attempt<2; attempt++){ try{ const r=await fn({mode:'create_narrate', ctx, jobs:bt}, 120000); if(r.ok){ Object.assign(texts, r.j.texts||{}); break; } }catch(e){} }
      done+=bt.length; frac=done/jobs.length; stage=stage.replace(/\(\d+\/\d+\)/, `(${done}/${jobs.length})`); } }));
    step=2; stage='Placing everything on the map'; show(); const geo=await geoP;
    step=3; stage='Saving the tour'; show();
    let s2=null; for(let a=0;a<3;a++){ try{ s2=await fn({mode:'create_assemble', outline, texts, geo, where, group:form.group, form}, 60000); if(s2.ok) break; }catch(e){ await new Promise(ok=>setTimeout(ok,3000)); } }
    if(!s2) throw new Error('could not save; check signal and try again');
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


// ---------- schedule ----------
async function runJob(body, maxMs){
  let id=null; for(let a=0;a<3 && !id;a++){ try{ const r=await fn(body, 30000); if(r.ok && r.j.job) id=r.j.job; else if(!r.ok) throw new Error(r.j.detail||r.j.error||'server error'); }catch(e){ if(a===2) throw e; await new Promise(ok=>setTimeout(ok,3000)); } }
  if(!id) throw new Error('could not reach the server');
  const until=Date.now()+(maxMs||240000);
  while(Date.now()<until){ await new Promise(ok=>setTimeout(ok,3000));
    try{ const r=await fetch(`${SB}/rest/v1/rhrn_jobs?id=eq.${id}&select=status,result,error`,{headers:{apikey:SBK,Authorization:'Bearer '+SBK},cache:'no-store'}); const rows=await r.json();
      if(rows && rows[0]){ if(rows[0].status==='done') return rows[0].result; if(rows[0].status==='error') throw new Error(rows[0].error||'failed'); } }
    catch(e){ if(e && e.message && !/fetch|network/i.test(e.message)) throw e; } }
  throw new Error('took too long; try again');
}
(function initSchedule(){
  const p=n=>String(n).padStart(2,'0'); const now=new Date(); const today=`${now.getFullYear()}-${p(now.getMonth()+1)}-${p(now.getDate())}`;
  const req=T.request||{}; const started=STOPS.some(s=>played.has(s.id));
  $('sDate').value = req.date && req.date>=today ? req.date : today;
  $('sRemaining').checked = started;
  const setDefaultTime=()=>{ if($('sAnchor').value==='end') $('sTime').value = req.end || '17:00';
    else $('sTime').value = $('sRemaining').checked ? `${p(now.getHours())}:${p(Math.ceil(now.getMinutes()/5)*5%60)}` : (req.time || '10:00'); };
  setDefaultTime(); $('sAnchor').onchange=setDefaultTime; $('sRemaining').onchange=setDefaultTime;
  const saved=store.get(SK+'sched',null); if(saved && !saved.cleared) renderSchedule(saved);
  $('sGo').onclick=async ()=>{
    if(!navigator.onLine){ $('schedOut').innerHTML='<div class="status bad">Building a schedule needs signal. Your last schedule stays here offline.</div>'; return; }
    let list=STOPS.filter(s=>isFinite(s.lat));
    if($('sRemaining').checked){ list=list.filter(s=>!played.has(s.id)); if(lastFix) list=[{id:'here', name:'Where you are now', lat:lastFix.lat, lng:lastFix.lng}].concat(list); }
    if(list.length<2){ $('schedOut').innerHTML='<div class="status">Not enough stops left to schedule.</div>'; return; }
    $('sGo').disabled=true; const t0=Date.now(); const tick=setInterval(()=>{ $('sGo').textContent=`Checking routes and traffic… ${Math.round((Date.now()-t0)/1000)}s`; },1000);
    try{
      const res=await runJob({mode:'schedule_job', stops:list.map(s=>({id:s.id, name:s.name.replace(/\s*\(passing\)/,''), lat:s.lat, lng:s.lng, pass:/\(passing\)|drive-by/i.test(s.name), note:s.note||''})),
        anchor:$('sAnchor').value, time:$('sTime').value, date:$('sDate').value, city:T.city||T.title, transport:(T.request&&T.request.transport)||({walk:'Walking',walk_ride:'Walking + Uber',car:'Car'}[T.mode]||'Walking + Uber'), group:T.guestNotes||''});
      res.madeAt=new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); res.v=Date.now(); res.by=store.get('cdj_who','')||''; store.set(SK+'sched', res); renderSchedule(res); shareSchedule(res);
      if(res.summary) speak(res.summary);
    }catch(e){ $('schedOut').innerHTML='<div class="status bad">Could not build the schedule: '+esc(e.message||e)+'</div>'; }
    finally{ clearInterval(tick); $('sGo').disabled=false; $('sGo').textContent='Build schedule'; }
  };
})();
const toM = t => { const m=/^(\d{1,2}):(\d{2})/.exec(t||''); return m ? +m[1]*60 + +m[2] : NaN; };
const fmtM = m => { m=((Math.round(m)%1440)+1440)%1440; return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); };
const durTxt = d => d<60 ? `${d} min` : `${Math.floor(d/60)} h ${d%60} min`;
const relTxt = d => { d=Math.round(d); if(d<=0) return 'now'; if(d<60) return `in ${d} min`; return `in ${Math.floor(d/60)} h ${d%60} min`; };
function renderSchedule(r){
  const icon=l=>l.mode==='walk'?'🚶':'🚗';
  const legTxt=l=>l.mode==='walk' ? `Walk about ${l.min} min (${l.km.toFixed(1)} km)` : `Ride about ${l.min} min (${l.km.toFixed(1)} km): ~${l.wait} min to get a car, traffic ×${(+l.factor).toFixed(1)}`;
  $('schedMeta').textContent = r.madeAt ? 'made '+r.madeAt : '';
  $('schedOut').innerHTML = `<div class="sched">
    <div id="liveBox"></div>
    <div class="status" style="margin:0 0 4px">Plan: <b>${esc(r.start)} → ${esc(r.finish)}</b> · ${Math.floor(r.total/60)} h ${r.total%60} min, plus ${r.cushion} min spare (done by ${esc(r.finishWithCushion)})</div>
    ${r.summary?`<div style="margin:4px 0 6px">${esc(r.summary)}</div>`:''}
    ${(r.warnings||[]).map(w=>`<div class="warn">⚠️ ${esc(w)}</div>`).join('')}
    ${r.rows.map((x,i)=>`<div class="r" data-row="${i}"><div class="t">${esc(x.arrive)}<div class="eta" style="font-size:11px;font-weight:600"></div></div><div class="n">${esc(x.name)}${x.pass?' <small style="display:inline">(passing)</small>':''}<small>${x.visit?`Stay ~${x.visit} min, leave ${esc(x.depart)}`:''}${x.note?(x.visit?' · ':'')+esc(x.note):''}</small><small class="rel" style="font-weight:700"></small></div></div>${x.leg?`<div class="leg">${icon(x.leg)} ${esc(legTxt(x.leg))}${x.leg.note?' · '+esc(x.leg.note):''}</div>`:''}`).join('')}
    <div class="status" style="margin-top:8px">Buffers included: walking +25%, rides +20% plus pickup wait, stops +10%, and ${r.cushion} min spare at the end.${r.routed?'':' Some legs used straight-line estimates.'} Live times update every 30 seconds from your GPS and the stops you've heard.</div>
  </div>`;
  liveSchedule();
}
// Live ETAs: worked out on the phone (offline) from the clock, GPS, and which stops have played.
function liveSchedule(){
  const r = store.get(SK+'sched', null); const box=$('liveBox'); if(!r || r.cleared || !box) return;
  const now=new Date(), p=n=>String(n).padStart(2,'0');
  const today=`${now.getFullYear()}-${p(now.getMonth()+1)}-${p(now.getDate())}`;
  if(r.date && r.date!==today){ box.innerHTML=`<div class="status" style="margin:0 0 6px">Live times start on ${esc(r.date)}.</div>`; return; }
  const nowM = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60;
  const rows=r.rows, playedAt=store.get(SK+'playedAt',{});
  const isDone = (x,i) => (x.id && x.id!=='here' && played.has(x.id)) || (x.id==='here' && i===0);
  // last row reached and the next one to reach
  let k=-1; rows.forEach((x,i)=>{ if(isDone(x,i)) k=i; });
  const startM = toM(r.start);
  if(k<0 && nowM < startM - 1){ // not started yet
    box.innerHTML=`<div class="status" style="margin:0 0 6px;font-weight:700">Starts ${relTxt(startM-nowM)} at ${esc(r.start)}.</div>`;
    rows.forEach((x,i)=>{ const el=document.querySelector(`#schedOut [data-row="${i}"]`); if(!el) return; el.querySelector('.eta').textContent=''; el.querySelector('.rel').textContent=''; el.style.opacity=''; });
    return;
  }
  const eta = new Array(rows.length).fill(null);
  let n;
  if(k<0){ n=0; eta[0]=Math.max(nowM, startM); }
  else {
    n=k+1;
    const x=rows[k]; const t0 = playedAt[x.id] ? (new Date(playedAt[x.id]).getHours()*60 + new Date(playedAt[x.id]).getMinutes()) : nowM;
    const st = STOPS.find(s=>s.id===x.id);
    const atStop = st && lastFix && dist(lastFix.lat,lastFix.lng,st.lat,st.lng) < 250;
    if(n<rows.length){
      const leg=x.leg||{min:0};
      if(atStop || !lastFix){ const leave=Math.max(nowM, t0 + (x.visit||0)); eta[n]=leave + leg.min; }
      else { const nx=STOPS.find(s=>s.id===rows[n].id) || rows[n]; const from=st||x;
        const full = (nx && from && isFinite(nx.lat)) ? Math.max(0.05, dist(from.lat,from.lng,nx.lat,nx.lng)) : 1;
        const left = (nx && isFinite(nx.lat)) ? dist(lastFix.lat,lastFix.lng,nx.lat,nx.lng) : full;
        eta[n] = nowM + leg.min * Math.min(1, Math.max(0.1, left/full)); }
    }
  }
  for(let i=n+1;i<rows.length;i++) eta[i] = eta[i-1] + (rows[i-1].visit||0) + ((rows[i-1].leg||{}).min||0);
  const lastI=rows.length-1;
  const finishEta = n<=lastI ? eta[lastI] + (rows[lastI].visit||0) : nowM;
  const delay = n<=lastI ? Math.round(eta[n] - toM(rows[n].arrive)) : Math.round(finishEta - toM(r.finish));
  const doneBy = toM(r.finishWithCushion);
  const late = finishEta > doneBy;
  const status = n>lastI ? '✅ Tour complete' : Math.abs(delay)<=5 ? '🟢 On track' : delay>0 ? `🟠 Running ${durTxt(delay)} behind` : `🔵 ${durTxt(-delay)} ahead`;
  box.innerHTML = `<div style="margin:0 0 8px;padding:10px 12px;border-radius:12px;background:${late?'#fde8e8':delay>5?'#fff7e6':'#eaf6ee'};border:1px solid ${late?'#f5b5b5':delay>5?'#fcd38a':'#bfe3c9'}">
    <div style="font-weight:800">${status}</div>
    ${n<=lastI?`<div style="font-size:14px">Next: <b>${esc(rows[n].name)}</b> ${relTxt(eta[n]-nowM)} (about ${fmtM(eta[n])})</div>
    <div style="font-size:13px;color:var(--mute)">Estimated finish ${fmtM(finishEta)}${r.anchor==='end'?` · must be done by ${esc(fmtM(toM(r.finish)+r.cushion))}`:''}${late?' · <b style="color:#b42318">past your spare time: skip a stop or ask the guide to trim the plan</b>':''}</div>`:''}
  </div>`;
  rows.forEach((x,i)=>{ const el=document.querySelector(`#schedOut [data-row="${i}"]`); if(!el) return;
    const e=el.querySelector('.eta'), rel=el.querySelector('.rel');
    if(i<n || (i===k)){ el.style.opacity=.55; e.textContent='✓'; rel.textContent=''; return; }
    el.style.opacity=''; const d=Math.round(eta[i]-toM(x.arrive));
    e.textContent = Math.abs(d)>=3 ? fmtM(eta[i]) : ''; e.style.color = d>5?'#b45309':d<-5?'#1d4ed8':'#2c7a3f';
    rel.textContent = `${relTxt(eta[i]-nowM)}${Math.abs(d)>=3?` · ${d>0?durTxt(d)+' late':durTxt(-d)+' early'}`:''}`; rel.style.color = d>5?'#b45309':'var(--accent)'; });
}
window.liveSchedule = liveSchedule;
setInterval(liveSchedule, 30000);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) liveSchedule(); });

// ---------- shared schedule: everyone on the tour sees the latest one built ----------
async function shareSchedule(res){
  store.set(SK+'schedPending', true);
  try{ const r=await fetch(`${SB}/rest/v1/rhrn_schedules?on_conflict=tour_id`, {method:'POST', headers:{apikey:SBK, Authorization:'Bearer '+SBK, 'Content-Type':'application/json', Prefer:'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify({tour_id:T.id, v:res.v, sched:res, updated_by:res.by||'', updated_at:new Date().toISOString()})});
    if(r.ok) store.set(SK+'schedPending', false); }catch(e){}
}
async function syncSchedule(){
  if(!navigator.onLine) return;
  const mine=store.get(SK+'sched',null);
  if(store.get(SK+'schedPending',false) && mine){ await shareSchedule(mine); return; }
  try{ const r=await fetch(`${SB}/rest/v1/rhrn_schedules?tour_id=eq.${encodeURIComponent(T.id)}&select=v,sched,updated_by`, {headers:{apikey:SBK, Authorization:'Bearer '+SBK}, cache:'no-store'});
    const rows=await r.json(); if(!Array.isArray(rows)) return;
    // a schedule built on this phone that the server doesn't have yet (e.g. built before sharing existed): upload it
    if(mine && !mine.cleared && (!rows.length || ((mine.v||0) > rows[0].v))){ if(!mine.v){ mine.v=1; store.set(SK+'sched', mine); } await shareSchedule(mine); return; }
    if(!rows.length) return;
    const row=rows[0];
    if(row.v > ((mine&&mine.v)||0) && row.sched && row.sched.cleared){ store.set(SK+'sched', {cleared:true, v:row.v}); clearScheduleUI(); if(mine && !mine.cleared) toast('🕒 Schedule cleared'); return; }
    if(row.v > ((mine&&mine.v)||0) && row.sched){ row.sched.v=row.v; store.set(SK+'sched', row.sched); renderSchedule(row.sched);
      $('schedMeta').textContent = 'shared'+(row.updated_by?' by '+row.updated_by:'')+(row.sched.madeAt?' · '+row.sched.madeAt:'');
      if(mine) toast('🕒 Schedule updated'+(row.updated_by?' by '+row.updated_by:'')); }
  }catch(e){}
}
setTimeout(syncSchedule, 2500); setInterval(syncSchedule, 45000); window.addEventListener('online', syncSchedule);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) { syncSchedule(); syncPlan(); } });

function clearScheduleUI(){ $('schedOut').innerHTML=''; $('schedMeta').innerHTML=''; }
// Clear: wipes the schedule on every phone on this tour (a newer "cleared" marker wins everywhere)
$('sClear').onclick = async ()=>{
  if(!confirm('Clear the schedule for everyone on this tour?')) return;
  const mark={cleared:true, v:Date.now()}; store.set(SK+'sched', mark); clearScheduleUI();
  try{ await fetch(`${SB}/rest/v1/rhrn_schedules?on_conflict=tour_id`, {method:'POST', headers:{apikey:SBK, Authorization:'Bearer '+SBK, 'Content-Type':'application/json', Prefer:'resolution=merge-duplicates,return=minimal'},
    body:JSON.stringify({tour_id:T.id, v:mark.v, sched:mark, updated_by:'', updated_at:new Date().toISOString()})}); toast('Schedule cleared'); }
  catch(e){ store.set(SK+'schedPending', true); toast('Cleared here; will clear for others when you have signal'); }
};
