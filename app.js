// Right Here, Right Now: tour engine. The active tour is window.TOUR (set by the loader in index.html).
const T = window.TOUR;
const STOPS = T.stops;
const GROUPS = T.groups || [];
const MUSEUM = GROUPS.flatMap(g=>g.items);
const FILLERS = T.fillers || [];
const WALKSTORIES = T.walkStories || [];
const QUIZ = T.quiz || {};
const LOOK = T.look || {};
const LOOKDETAIL = T.lookDetail || {};
const SCENES = T.scenes || {};
const SCENE_ALIAS = T.sceneAlias || {};
const SK = T.storePrefix || ('rhrn_'+T.id+'_');
let planEdited = !!window.TOUR_PLAN_EDITED;
let START_ID = T.startId && STOPS.find(s=>s.id===T.startId) ? T.startId : (STOPS[0] && STOPS[0].id);
function photoQ(){ const q=Object.assign({}, T.photoQ||{}); for(const s of STOPS) if(!q[s.id]) q[s.id]=s.photoQ || (s.name.replace(/\s*\(.*\)/,'')+' '+(T.title||'')); return q; }
function findAny(id){ return STOPS.find(x=>x.id===id)||MUSEUM.find(x=>x.id===id)||WALKSTORIES.find(x=>x.id===id)||FILLERS.find(x=>x.id===id); }
function showLook(id){ const l=LOOKDETAIL[id]; $('lookCard').style.display=l?'':'none'; if(l){ $('lookSign').innerHTML=l.sign; $('lookArt').innerHTML=l.art; } }
function genericScene(){ return `<defs><linearGradient id="gsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc6e8"/><stop offset="1" stop-color="#eef4fb"/></linearGradient></defs><rect width="400" height="225" fill="url(#gsk)"/>
  <path d="M0,160 L50,120 L90,140 L140,95 L200,135 L250,100 L310,130 L360,105 L400,125 L400,225 L0,225Z" fill="#9db7d6"/>
  <g fill="#6f8fb8"><rect x="40" y="140" width="26" height="85"/><rect x="72" y="120" width="20" height="105"/><rect x="98" y="150" width="30" height="75"/><rect x="270" y="130" width="24" height="95"/><rect x="300" y="110" width="18" height="115"/><rect x="324" y="145" width="34" height="80"/></g>
  <rect y="200" width="400" height="25" fill="#5f7ea8"/>
  <g transform="translate(200,150) scale(.55)"><path d="M0 60 C -28 20, -56 -6, -56 -38 A 56 56 0 0 1 56 -38 C 56 -6, 28 20, 0 60 Z" fill="#fff"/><circle cx="0" cy="-38" r="24" fill="#1d4ed8"/><path d="M-8 -50 L12 -38 L-8 -26 Z" fill="#fff"/></g>`; }
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function showScene(id){
  const it=findAny(id)||{};
  const alias=SCENE_ALIAS[id] || (T.sceneFallback && T.sceneFallback(id));
  const s=SCENES[id]||SCENES[alias]||{c:'',ox:'50%',oy:'55%',tx:'-3%',ty:'-2%',svg:genericScene()};
  const ph=PHOTOS[id] || (SCENE_ALIAS[id] && PHOTOS[SCENE_ALIAS[id]]) || (T.photoFallback && T.photoFallback(id) && PHOTOS[T.photoFallback(id)]) || null;
  const sub=LOOK[id] || it.look || (FILLERS.includes(it)?'Story time while we ride': WALKSTORIES.includes(it)?'Story time while we walk':'');
  const cap=`<div class="cap fade">${esc(it.name||s.c||T.title)}<small>${esc(sub)}</small></div>`;
  if(ph){
    $('stage').innerHTML = `<img class="scene fade" src="${ph.url}" alt="" style="--ox:${s.ox};--oy:${s.oy};--tx:${s.tx};--ty:${s.ty}"><div class="credit">${esc(ph.credit)}</div>`+cap;
    $('stage').querySelector('img').onerror=()=>{ delete PHOTOS[id]; showScene(id); };
    return;
  }
  $('stage').innerHTML = `<svg class="scene fade" viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" style="--ox:${s.ox};--oy:${s.oy};--tx:${s.tx};--ty:${s.ty}">${s.svg}</svg>`+cap;
}
let PHOTOS = {};
function strip(s){ const d=document.createElement('div'); d.innerHTML=s||''; return (d.textContent||'').trim(); }
async function fetchPhotos(){
  if(!navigator.onLine) return;
  for(const [id,q] of Object.entries(photoQ())){
    if(PHOTOS[id]) { new Image().src=PHOTOS[id].url; continue; }
    try{
      const u='https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=1000&gsrsearch='+encodeURIComponent(q+' filetype:bitmap');
      const r=await fetch(u); const j=await r.json(); const pages=Object.values((j.query||{}).pages||{}).sort((a,b)=>(a.index||0)-(b.index||0));
      const pg=pages.find(p=>p.imageinfo&&p.imageinfo[0].thumburl&&/jpe?g|png|webp/i.test(p.imageinfo[0].mime||''));
      if(!pg) continue;
      const ii=pg.imageinfo[0], m=ii.extmetadata||{};
      PHOTOS[id]={url:ii.thumburl, credit:'Photo: '+(strip(m.Artist&&m.Artist.value)||'Wikimedia Commons').slice(0,40)+' · '+(strip(m.LicenseShortName&&m.LicenseShortName.value)||'')+' · Wikimedia Commons'};
      store.set(SK+'photos',PHOTOS);
      new Image().src=ii.thumburl;
      if(current && current.stop.id===id) showScene(id);
    }catch(e){}
  }
}

let qTimer=null;
function quizUI(mode, id, n){
  const q=QUIZ[id]; const box=$('quiz');
  if(mode==='hide'){ box.style.display='none'; return; }
  box.style.display='block'; $('qt').textContent=q.ask;
  if(mode==='ask'){ $('qa').style.display='none'; $('qc').textContent=''; }
  if(mode==='count'){ $('qc').textContent=n; }
  if(mode==='answer'){ $('qc').textContent=''; $('qa').style.display='block'; $('qa').textContent='✅ '+q.ans; }
}

// ---------- state ----------
const $ = id => document.getElementById(id);
const store = { get(k,d){ try{ const v=localStorage.getItem(k); return v===null?d:JSON.parse(v);}catch(e){return d;} },
                set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} } };
PHOTOS = store.get(SK+'photos', {});
let played = new Set(store.get(SK+'played', []));
let queue = [];          // stop ids waiting
let current = null;      // {stop, sentences, idx}
let paused = false;
let voices = [];
let lastFix = null, prevFix = null;
let started = false;
let lastActivity = Date.now();
let wakeLock = null;
const synth = window.speechSynthesis;

// ---------- geo helpers ----------
function dist(a,b,c,d){ const R=6371000, t=Math.PI/180; const dLa=(c-a)*t, dLo=(d-b)*t;
  const x=Math.sin(dLa/2)**2+Math.cos(a*t)*Math.cos(c*t)*Math.sin(dLo/2)**2; return 2*R*Math.asin(Math.sqrt(x)); }
function fmt(m){ return m<1000? Math.round(m)+' m' : (m/1000).toFixed(1)+' km'; }

// ---------- map ----------
const W=400, H=260; let BB=null;
function bounds(){ const pts=STOPS.filter(p=>isFinite(p.lat)&&isFinite(p.lng)); if(!pts.length){ BB={minLat:0,maxLat:1,minLng:0,maxLng:1,kx:1,s:1,ox:0,oy:0}; return; }
  const lats=pts.map(p=>p.lat), lngs=pts.map(p=>p.lng), pad=0.004;
  const minLat=Math.min(...lats)-pad, maxLat=Math.max(...lats)+pad, minLng=Math.min(...lngs)-pad, maxLng=Math.max(...lngs)+pad;
  const kx=Math.cos(((minLat+maxLat)/2)*Math.PI/180), s=Math.min(W/((maxLng-minLng)*kx), H/(maxLat-minLat));
  BB={minLat,maxLat,minLng,maxLng,kx,s,ox:(W-(maxLng-minLng)*kx*s)/2,oy:(H-(maxLat-minLat)*s)/2}; }
function proj(lat,lng){ if(!BB) bounds(); return [BB.ox+(lng-BB.minLng)*BB.kx*BB.s, BB.oy+(BB.maxLat-lat)*BB.s]; }
function drawMap(){
  const svg=$('map'); let h=''; bounds();
  const route = ((T.mapRoute && !planEdited) ? T.mapRoute : STOPS.map(p=>p.id)).map(id=>STOPS.find(x=>x.id===id)).filter(p=>p&&isFinite(p.lat));
  h+=`<polyline points="${route.map(p=>proj(p.lat,p.lng).join(',')).join(' ')}" fill="none" stroke="#7ea6e0" stroke-width="3" stroke-dasharray="6 5"/>`;
  STOPS.forEach((p,i)=>{ if(!isFinite(p.lat)) return; const [x,y]=proj(p.lat,p.lng);
    if(p.radius>0){ const r=Math.max(4,p.radius*BB.s/111320); h+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#1d4ed8" opacity=".08"/>`; }
    const done=played.has(p.id);
    h+=`<circle cx="${x}" cy="${y}" r="9" fill="${done?'#a8b6c9':'#1d4ed8'}"/><text x="${x}" y="${y+4}" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">${i+1}</text>`;
    if(p.mapLabel){ const below=(T.labelBelow||[]).includes(p.id); h+=`<text x="${x}" y="${below?y+23:y-13}" text-anchor="middle" font-size="11" fill="#1d2420">${esc(p.mapLabel)}</text>`; }
  });
  if(lastFix){ const [x,y]=proj(lastFix.lat,lastFix.lng);
    const inside = x>-20&&x<W+20&&y>-20&&y<H+20;
    if(inside){ h+=`<circle cx="${x}" cy="${y}" r="14" fill="#2b6cb0" opacity=".2"/><circle cx="${x}" cy="${y}" r="6" fill="#2b6cb0" stroke="#fff" stroke-width="2"/>`; }
  }
  svg.innerHTML=h;
}


// two-tap confirm when something is already playing (keyed, survives list redraws)
let armed=null; // {key,label,until}
function isArmed(key){ return armed && armed.key===key && Date.now()<armed.until; }
function confirmTap(key, label, action, refresh){
  if(isArmed(key)){ armed=null; action(); refresh&&refresh(); return; }
  armed={key,label,until:Date.now()+3500}; refresh&&refresh();
  setTimeout(()=>{ if(armed && armed.key===key && Date.now()>=armed.until){ armed=null; refresh&&refresh(); } }, 3600);
}
function armBtn(btn,key,label,orig){ if(isArmed(key)){ btn.innerHTML=label; btn.style.background='var(--accent2)'; btn.style.color='#fff'; } else { btn.innerHTML=orig; btn.style.background=''; btn.style.color=''; } }
// ---------- stop list ----------
function renderStops(){
  try{ renderRide(); }catch(e){}
  const btn=(id)=>`<button data-play="${id}" ${isArmed('play:'+id)?'style="background:var(--accent2)"':''}>${isArmed('play:'+id)?armed.label:'▶'}</button>`;
  const hide = store.get('cdj_hideplayed', true);
  const row=(id,badge,name,meta,done)=> (hide && done) ? '' : `<div class="stop" data-id="${id}"><div class="num ${done?'done':''}">${badge}</div><div class="info"><div class="name">${esc(name)}</div><div class="meta">${meta}</div></div>${btn(id)}</div>`;
  const moving = lastFix && lastFix.speed!=null && lastFix.speed>4;
  const tourRows = STOPS.map((p,i)=>{ const d = lastFix ? fmt(dist(lastFix.lat,lastFix.lng,p.lat,p.lng)) : ''; const done=played.has(p.id);
    const trig = p.radius ? (p.walk? 'plays on arrival (walking)':'plays as you pass') : 'plays when you tap Start';
    return row(p.id, i+1, p.name, `${p.custom?'✨ added · ':''}${d?d+' away · ':''}${done?'played · ':''}${trig}${p.approx?' · location approximate':''}`, done); }).join('');
  const groupRows = GROUPS.map(g=>g.items.map((m,i)=>row(m.id, g.letters?String.fromCharCode(65+i):'•', m.name, `${played.has(m.id)?'played · ':''}${(m.look||'').replace('Look for: ','')}`, played.has(m.id))).join(''));
  const walkRows = WALKSTORIES.map(f=>row(f.id,'👣', f.name.replace('Walk: ','').replace(/^./,c=>c.toUpperCase()), played.has(f.id)?'played':'plays while walking, between stops', played.has(f.id))).join('');
  const roadRows = FILLERS.map(f=>row(f.id,'★', f.name.replace('Story: ','').replace(/^./,c=>c.toUpperCase()), played.has(f.id)?'played':'plays when nothing else is', played.has(f.id))).join('');
  const cnt=(arr)=>`${arr.filter(x=>played.has(x.id)).length}/${arr.length}`;
  const open = store.get(SK+'open2', {});
  const isOpen=(k,auto)=> open[k]!==undefined ? open[k] : auto;
  const sec=(k,title,arr,rows,auto)=> !arr.length ? '' : `<details class="sec" data-sec="${k}" ${isOpen(k,auto)?'open':''}><summary><span>${title}</span><span class="cnt">${cnt(arr)} played</span></summary>${rows || '<div class="status">All played. Long-press a stop to reset it, or turn off Hide played.</div>'}</details>`;
  // up next: first unplayed eligible tour stop by order
  const next = STOPS.find(p=>!played.has(p.id) && (!p.after || played.has(p.after)) && (!p.before || !played.has(p.before)));
  $('stops').innerHTML =
    (next ? `<div class="upnext"><div class="lbl">Up next</div>${row(next.id,'▸',next.name, (lastFix?fmt(dist(lastFix.lat,lastFix.lng,next.lat,next.lng))+' away · ':'')+(next.radius?(next.walk?'plays on arrival':'plays as you pass'):'tap to play'), false)}</div>` : '') +
    `<label class="hidep"><input type="checkbox" id="hidePlayed" ${hide?'checked':''}> Hide played (uncheck to replay or reset)</label>` +
    sec('tour','📍 Tour stops',STOPS,tourRows,false) +
    GROUPS.map((g,gi)=>sec(g.key,g.title,g.items,groupRows[gi], !!(g.near && lastFix && dist(lastFix.lat,lastFix.lng,g.near.lat,g.near.lng)<g.near.r))).join('') +
    sec('walk','🚶 Walking stories',WALKSTORIES,walkRows,false) +
    sec('road','🚗 Road stories',FILLERS,roadRows,false);
  $('hidePlayed').onchange=()=>{ store.set('cdj_hideplayed',$('hidePlayed').checked); renderStops(); };
  $('stops').querySelectorAll('details.sec').forEach(d=>d.addEventListener('toggle',()=>{ const o=store.get(SK+'open2',{}); o[d.dataset.sec]=d.open; store.set(SK+'open2',o); }));
  document.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>{ if(Date.now()<suppressClickUntil) return; unlockAudio();
    const id=b.dataset.play;
    if(current){ confirmTap('play:'+id, current.stop.id===id?'Restart?':'Switch?', ()=>playNow(id), renderStops); return; }
    playNow(id); });
}
function renderScripts(){ $('scripts').innerHTML = STOPS.concat(MUSEUM,WALKSTORIES,FILLERS).map((p,i)=>`<h3 style="margin:14px 0 0;font-size:15px">${i+1}. ${esc(p.name)}</h3><div class="script">${esc(p.text)}</div>`).join(''); }
renderScripts();

// ---------- speech ----------
function splitSentences(t){ return t.replace(/\n+/g,' ').match(/[^.!?]+[.!?]+["”]?|[^.!?]+$/g).map(s=>s.trim()).filter(Boolean); }
function loadVoices(){
  voices = synth ? synth.getVoices() : [];
  const en = voices.filter(v=>/^en/i.test(v.lang));
  const list = en.length?en:voices;
  const saved = store.get('cdj_voice', null);
  $('voiceWrap').style.display = list.length>1 ? '' : 'none';
  $('voice').innerHTML = list.map(v=>`<option value="${v.name}" ${v.name===saved?'selected':''}>${v.name} (${v.lang})${v.localService?' · offline':''}</option>`).join('');
  if(!saved){ const pref = list.find(v=>v.localService && /en[-_]US/i.test(v.lang)) || list.find(v=>v.localService) || list[0]; if(pref) $('voice').value=pref.name; }
}
if(synth){ loadVoices(); synth.onvoiceschanged = loadVoices; }
$('hoh').checked = store.get('cdj_hoh',false); document.body.classList.toggle('hoh',$('hoh').checked);
$('hoh').onchange = ()=>{ document.body.classList.toggle('hoh',$('hoh').checked); store.set('cdj_hoh',$('hoh').checked); if($('hoh').checked) hush(); if(current){ current.token=Math.random(); speakNext(); } };
$('voice').onchange = ()=>store.set('cdj_voice',$('voice').value);
$('rate').oninput = ()=>{ $('rateVal').textContent=(+$('rate').value).toFixed(2); store.set('cdj_rate',$('rate').value); };
$('premium').checked = store.get('rhrn_premium', true); $('premium').onchange=()=>{ store.set('rhrn_premium',$('premium').checked); if(!$('premium').checked) try{ AUD.pause(); }catch(e){} };
$('rate').value = store.get('cdj_rate','1'); $('rateVal').textContent=(+$('rate').value).toFixed(2);

// ---------- premium voice (ElevenLabs via the tour-tts function), phone voice as fallback ----------
const AUD = new Audio(); AUD.preload='auto';
const TTS_KEY = 'rhrn_tts_urls';
let ttsUrls = {}; try{ ttsUrls = JSON.parse(localStorage.getItem(TTS_KEY)||'{}'); }catch(e){}
let ttsOff = false;                       // set when the server says premium voice isn't configured
const ttsPending = {};
function premiumOn(){ return $('premium') && $('premium').checked && !ttsOff && !document.body.classList.contains('hoh'); }
function ttsKey(text){ let h=0; for(let i=0;i<text.length;i++){ h=((h<<5)-h+text.charCodeAt(i))|0; } return (h>>>0).toString(36)+'_'+text.length; }
function saveTtsUrls(){ try{ const k=Object.keys(ttsUrls); if(k.length>3000) k.slice(0,k.length-3000).forEach(x=>delete ttsUrls[x]); localStorage.setItem(TTS_KEY, JSON.stringify(ttsUrls)); }catch(e){} }
function ttsUrl(text, prev, next){
  const k=ttsKey(text); if(ttsUrls[k]) return Promise.resolve(ttsUrls[k]);
  if(!navigator.onLine || ttsOff) return Promise.resolve(null);
  if(ttsPending[k]) return ttsPending[k];
  ttsPending[k] = fetch(`${SB}/functions/v1/tour-tts`, {method:'POST', headers:{apikey:SBK, Authorization:'Bearer '+SBK, 'Content-Type':'application/json'},
      body:JSON.stringify({text, prev:prev||'', next:next||''})})
    .then(r=>r.json().then(j=>({r,j}))).then(({r,j})=>{ if(j.error==='not_configured'){ ttsOff=true; premiumNote('Premium voice is not set up yet, using the phone voice.'); }
      if(r.ok && j.url){ ttsUrls[k]=j.url; saveTtsUrls(); fetch(j.url).catch(()=>{}); return j.url; } return null; })
    .catch(()=>null).finally(()=>{ delete ttsPending[k]; });
  return ttsPending[k];
}
function premiumNote(t){ const n=$('premiumNote'); if(n) n.textContent=t; }
const seqText = it => typeof it==='object' ? (it.t||'') : it;
function prefetchSeq(seq, from){ if(!premiumOn() || !navigator.onLine) return;
  const items=seq.map(seqText); let i=from||0;
  const run=async()=>{ while(i<items.length){ const j=i++; if(items[j]) await ttsUrl(items[j], items[j-1], items[j+1]); } };
  run(); }
function hush(){ if(synth) synth.cancel(); try{ AUD.pause(); }catch(e){} AUD.onended=AUD.onerror=null; }
function speakNext(){
  if(!current || paused) return;
  if(current.idx >= current.sentences.length){ finishCurrent(); return; }
  saveState();
  const item = current.sentences[current.idx];
  const myTok = current.token;
  if(typeof item==='object' && item.pause){
    let n=item.pause; quizUI('count', current.stop.id, n);
    const tick=()=>{ if(!current||current.token!==myTok||paused) return; n--; if(n<=0){ current.idx++; speakNext(); } else { quizUI('count', current.stop.id, n); qTimer=setTimeout(tick,1000);} };
    qTimer=setTimeout(tick,1000); return;
  }
  let text = item;
  if(typeof item==='object'){ text=item.t; quizUI(item.quiz, current.stop.id); }
  const u = new SpeechSynthesisUtterance(text);
  const v = voices.find(v=>v.name===$('voice').value); if(v){ u.voice=v; u.lang=v.lang; } else u.lang='en-US';
  u.rate = +$('rate').value;
  const myToken = current.token;
  u.onend = ()=>{ if(!current||current.token!==myToken||paused) return; current.idx++; speakNext(); };
  u.onerror = (e)=>{ if(!current||current.token!==myToken||paused) return; if(e.error==='interrupted'||e.error==='canceled') return; current.idx++; speakNext(); };
  $('nowLine').textContent = text;
  if(document.body.classList.contains('hoh')){
    const ms = Math.max(2200, text.length*70/(+$('rate').value));
    qTimer = setTimeout(()=>{ if(!current||current.token!==myToken||paused) return; current.idx++; speakNext(); }, ms);
    return;
  }
  if(premiumOn()){
    const seq=current.sentences, i=current.idx;
    let fellBack=false;
    const phone=()=>{ if(fellBack||!current||current.token!==myToken||paused) return; fellBack=true; synth.cancel(); synth.speak(u); };
    const timer=setTimeout(phone, 6000); // slow network: don't leave silence, fall back for this sentence
    ttsUrl(text, seqText(seq[i-1]||''), seqText(seq[i+1]||'')).then(url=>{
      clearTimeout(timer);
      if(!current||current.token!==myToken||paused) return;
      if(!url){ phone(); return; }
      if(fellBack) return; // the phone voice already took this sentence
      AUD.onended=()=>{ if(!current||current.token!==myToken||paused) return; current.idx++; speakNext(); };
      AUD.onerror=()=>{ AUD.onended=AUD.onerror=null; phone(); };
      AUD.src=url; AUD.playbackRate=+$('rate').value; current.audioIdx=i;
      AUD.play().catch(()=>{ AUD.onended=AUD.onerror=null; phone(); });
    });
    return;
  }
  synth.speak(u);
}
function buildSeq(id, stop){ const seq = splitSentences(stop.text);
  if(stop.quiz && !QUIZ[id]) QUIZ[id]=stop.quiz;
  if(QUIZ[id]){ seq.push({quiz:'ask', t:'Quiz time! '+QUIZ[id].ask}); seq.push({pause:8}); seq.push({quiz:'answer', t:'The answer: '+QUIZ[id].ans}); }
  return seq; }
function saveState(){ store.set(SK+'state',{ started, paused, queue, cur: current?{id:current.stop.id, idx:current.idx}:null, t:Date.now() }); }
function startStop(id){
  const stop = findAny(id); if(!stop) return;
  lastActivity=Date.now();
  hush();
  paused=false;
  current = { stop, sentences: buildSeq(id, stop), idx:0, token:Math.random(), audioIdx:-1 };
  prefetchSeq(current.sentences, 0);
  showScene(id); quizUI('hide'); showLook(id);
  played.add(id); store.set(SK+'played',[...played]);
  $('nowTitle').textContent = '🔊 '+stop.name; $('pauseBtn').textContent='Pause';
  ['pauseBtn','stopBtn','skipBtn'].forEach(b=>$(b).disabled=false);
  renderStops(); drawMap();
  if(document.body.classList.contains('hoh') && navigator.vibrate){ try{ navigator.vibrate([200,100,200]); }catch(e){} }
  if(!synth && !document.body.classList.contains('hoh')){ $('nowLine').textContent='Speech not supported in this browser.'; return; }
  syncPause();
  setTimeout(speakNext, 150);
}
function finishCurrent(){
  if(current && T.onFinish){ try{ T.onFinish(current.stop.id); }catch(e){} }
  lastActivity=Date.now(); current=null; clearTimeout(qTimer); saveState(); $('nowTitle').textContent='Nothing playing'; $('nowLine').textContent='';
  ['pauseBtn','stopBtn','skipBtn'].forEach(b=>$(b).disabled=true);
  syncPause();
  if(queue.length){ const n=queue.shift(); setTimeout(()=>startStop(n),800); }
}
function playNow(id){ queue = queue.filter(q=>q!==id); startStop(id); }
function enqueue(id){
  if(played.has(id) || queue.includes(id) || (current && current.stop.id===id)) return;
  if(!current) startStop(id); else queue.push(id);
}
function togglePause(){ if(!current) return; unlockAudio();
  if(!paused){ paused=true; clearTimeout(qTimer); synth && synth.cancel(); try{ AUD.pause(); }catch(e){} $('pauseBtn').textContent='Resume'; }
  else { paused=false; $('pauseBtn').textContent='Pause';
    if(current.audioIdx===current.idx && AUD.src && !AUD.ended && AUD.currentTime>0 && premiumOn()){ const tok=current.token; AUD.play().catch(()=>{ current.token=Math.random(); speakNext(); }); }
    else { current.token=Math.random(); speakNext(); } }
  syncPause(); }
function estSec(it){ if(typeof it==='object'){ if(it.pause) return it.pause; it=it.t; } return Math.max(1.5, (it||'').length*0.065/(+$('rate').value||1)); }
function rewind(){ if(!current) return;
  clearTimeout(qTimer); hush(); current.audioIdx=-1;
  let i=current.idx, acc=0; // restart current sentence, then step back until ~10s covered
  while(i>0 && acc<10){ i--; acc+=estSec(current.sentences[i]); }
  current.idx=i; current.token=Math.random();
  if(!paused) setTimeout(speakNext,120); else { const it=current.sentences[i]; $('nowLine').textContent=typeof it==='object'?(it.t||''):it; }
}
$('rewBtn').onclick=rewind;
function syncPause(){ const f=$('fabPause'); f.style.display=current?'':'none'; $('fabRew').style.display=current?'':'none'; $('rewBtn').disabled=!current; f.textContent=paused?'▶ Resume':'⏸ Pause'; f.classList.toggle('resume',paused); }
$('pauseBtn').onclick=togglePause; $('fabPause').onclick=togglePause; $('fabRew').onclick=rewind;
$('stopBtn').onclick = ()=>confirmTap('stop','Stop?',doStop,()=>armBtn($('stopBtn'),'stop','Stop?','Stop'));
function doStop(){ queue=[]; hush(); current=null; paused=false; finishCurrent(); }
$('skipBtn').onclick = ()=>confirmTap('skip','Skip?',doSkip,()=>armBtn($('skipBtn'),'skip','Skip?','Skip ▸'));
function doSkip(){ hush(); current=null; paused=false; finishCurrent(); };
$('testVoice').onclick = ()=>{ unlockAudio(); synth.cancel(); const u=new SpeechSynthesisUtterance(T.testPhrase||('Welcome to '+T.title+'.')); const v=voices.find(v=>v.name===$('voice').value); if(v){u.voice=v;u.lang=v.lang;} u.rate=+$('rate').value; synth.speak(u); };
$('resetPlayed').onclick = ()=>{ played=new Set(); store.set(SK+'played',[]); renderStops(); drawMap(); };

let unlocked=false;
function unlockAudio(){ if(unlocked||!synth) return; const u=new SpeechSynthesisUtterance(' '); u.volume=0; synth.speak(u); unlocked=true; }

// ---------- GPS ----------
function onFix(pos){
  const c=pos.coords; prevFix=lastFix;
  lastFix={lat:c.latitude,lng:c.longitude,acc:c.accuracy,t:pos.timestamp,speed:c.speed};
  let spd = (c.speed!=null && !isNaN(c.speed)) ? c.speed : null;
  if(spd===null && prevFix){ const dt=(lastFix.t-prevFix.t)/1000; if(dt>0) spd=dist(prevFix.lat,prevFix.lng,lastFix.lat,lastFix.lng)/dt; }
  $('gpsInfo').innerHTML = `GPS: <span class="ok">on</span> · accuracy ±${Math.round(c.accuracy)} m${spd!=null?' · '+(spd*3.6).toFixed(0)+' km/h':''}`;
  if($('auto').checked && c.accuracy<120){
    for(const p of STOPS){
      if(!p.radius || played.has(p.id)) continue;
      if(p.after && !played.has(p.after)) continue;
      if(p.before && played.has(p.before)) continue;
      const d=dist(c.latitude,c.longitude,p.lat,p.lng);
      if(d<=p.radius){
        if(p.walk && spd!=null && spd>3.5) continue; // still in a car, wait until walking
        enqueue(p.id);
      }
    }
  }
  if($('auto').checked && !current && !queue.length && spd!=null && spd>4 && Date.now()-lastActivity>25000){
    // seconds until we reach the edge of the next stop that could auto-play
    let eta=Infinity;
    for(const p of STOPS){ if(!p.radius || played.has(p.id)) continue; if(p.after && !played.has(p.after)) continue; if(p.before && played.has(p.before)) continue;
      const edge=Math.max(0, dist(c.latitude,c.longitude,p.lat,p.lng)-p.radius); eta=Math.min(eta, edge/spd); }
    const dur=f=>buildSeq(f.id,f).reduce((a,it)=>a+estSec(it),0);
    const fits = FILLERS.filter(f=>!played.has(f.id)).map(f=>({f,d:dur(f)})).filter(x=>x.d+20<eta);
    if(fits.length){ fits.sort((a,b)=>b.d-a.d); startStop(fits[0].f.id); }
  }
  if($('auto').checked && !current && !queue.length && spd!=null && spd>0.4 && spd<2.5 && Date.now()-lastActivity>40000 && WALKSTORIES.length
     && (!T.walkStoriesOk || T.walkStoriesOk(c))){
    let eta=Infinity;
    for(const p of STOPS){ if(!p.radius || played.has(p.id)) continue; if(p.after && !played.has(p.after)) continue; if(p.before && played.has(p.before)) continue;
      eta=Math.min(eta, Math.max(0, dist(c.latitude,c.longitude,p.lat,p.lng)-p.radius)/spd); }
    const w = WALKSTORIES.find(f=>!played.has(f.id) && buildSeq(f.id,f).reduce((a,it)=>a+estSec(it),0)+15<eta);
    if(w) startStop(w.id);
  }
  if(c.heading!=null && !isNaN(c.heading) && spd!=null && spd>0.8 && !compassActive()) heading=c.heading;
  try{ renderWalk(); }catch(e){}
  renderStops(); drawMap();
}
function compassActive(){ return $('compassBtn').textContent==='Compass on'; }
function onGeoErr(e){ $('gpsInfo').innerHTML = `GPS: <span class="bad">${e.message||'unavailable'}</span>. You can still tap ▶ on any stop.`; }

async function keepAwake(){ try{ if('wakeLock' in navigator){ wakeLock = await navigator.wakeLock.request('screen'); } }catch(e){} }
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible' && started) keepAwake(); });

let watching=false;
async function beginTracking(){ await keepAwake(); if(watching) return; watching=true;
  if('geolocation' in navigator){ navigator.geolocation.watchPosition(onFix,onGeoErr,{enableHighAccuracy:true,maximumAge:5000,timeout:30000}); }
  else onGeoErr({message:'not supported'}); }
$('start').onclick = async ()=>{
  unlockAudio();
  if(started){ // tour already running (or restored after refresh): never auto-replay the intro
    await beginTracking();
    if(current && paused) togglePause();
    $('status').innerHTML='<span class="ok">Tour running.</span> To hear the intro again, tap ▶ on stop 1.';
    return;
  }
  started=true;
  $('start').textContent='Tour running'; $('start').classList.add('secondary');
  await beginTracking();
  const sw = navigator.serviceWorker && navigator.serviceWorker.controller;
  $('status').innerHTML = `${sw?'<span class="ok">Saved for offline use.</span>':'Offline copy is being saved; reload once while online to be sure.'} Screen will stay on while this page is open.`;
  playNow(START_ID); saveState();
};

// ---------- offline ----------
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').then(()=>{
    if(!started) $('status').innerHTML = (navigator.serviceWorker.controller?'<span class="ok">Saved for offline use.</span> ':'Saving offline copy… ') + 'Tap Start when you leave the hotel.';
  }).catch(()=>{});
}



// ---------- walking guide ----------
let walkSel = store.get(SK+'walk','auto'), heading=null;
function walkList(){ const base=(T.walk||[]).slice();
  for(const s of STOPS) if(isFinite(s.lat) && !base.find(w=>w.id===s.id) && (!T.walk || s.custom)) base.push({id:s.id, name:s.name.replace(/\s*\(.*\)/,''), lat:s.lat, lng:s.lng});
  return base.filter(w=>{ const s=STOPS.find(x=>x.id===w.id); return s || !(T.walk||[]).some(t=>t.id===w.id && w.stop); }); }
function fillWalkSel(){ const L=walkList(); $('walkSel').innerHTML = '<option value="auto">Automatic (nearest next stop)</option>' + L.map(w=>`<option value="${w.id}">${esc(w.name)}</option>`).join('');
  if(walkSel!=='auto' && !L.find(w=>w.id===walkSel)) walkSel='auto'; $('walkSel').value = walkSel; }
fillWalkSel();
$('walkSel').onchange = ()=>{ walkSel=$('walkSel').value; store.set(SK+'walk',walkSel); renderWalk(); };
function bearing(a,b,c,d){ const t=Math.PI/180, y=Math.sin((d-b)*t)*Math.cos(c*t), x=Math.cos(a*t)*Math.sin(c*t)-Math.sin(a*t)*Math.cos(c*t)*Math.cos((d-b)*t); return (Math.atan2(y,x)/t+360)%360; }
const DIRS=['north','northeast','east','southeast','south','southwest','west','northwest'];
function walkTarget(){
  if(walkSel!=='auto') return walkList().find(w=>w.id===walkSel);
  if(!lastFix) return null;
  const cands = walkList().filter(w=>{ const s=STOPS.find(x=>x.id===w.id); return !s || (!played.has(s.id) && s.radius>0); }).filter(w=>!(T.walkExclude||[]).includes(w.id));
  let best=null,bd=1e9; for(const w of cands){ const d=dist(lastFix.lat,lastFix.lng,w.lat,w.lng); if(d<bd){bd=d;best=w;} }
  return bd<2500?best:null;
}
function renderWalk(){
  const w=walkTarget();
  if(!w || !lastFix){ $('walkTo').textContent = w? w.name : 'nothing nearby'; $('walkDist').textContent=''; $('walkHint').textContent = lastFix? 'No walking stop within 2.5 km. Pick a destination below.' : 'Waiting for GPS…'; $('walkNote').textContent=''; return; }
  const d=dist(lastFix.lat,lastFix.lng,w.lat,w.lng), b=bearing(lastFix.lat,lastFix.lng,w.lat,w.lng);
  $('walkTo').textContent=w.name; $('walkDist').textContent='· '+fmt(d);
  const mins=Math.max(1,Math.round(d/75));
  if(d<40){ $('walkHint').textContent='📍 You are here!'; $('arrowG').style.transform='rotate(0deg)'; }
  else if(heading!=null){ const rel=((b-heading)+360)%360; $('arrowG').style.transform=`rotate(${rel}deg)`; $('walkHint').textContent = rel<25||rel>335 ? 'Straight ahead' : rel<180 ? (rel<70?'Bear right':'Turn right') : (rel>290?'Bear left':'Turn left'); }
  else { $('arrowG').style.transform=`rotate(${b}deg)`; $('walkHint').textContent='Head '+DIRS[Math.round(b/45)%8]+' (arrow points north-up)'; }
  $('walkNote').textContent=`About ${mins} min on foot, as the crow flies. Streets may wind; use Walking directions with signal.`;
  $('walkMaps').href=`https://www.google.com/maps/dir/?api=1&destination=${w.lat},${w.lng}&travelmode=walking`;
}
function onOrient(e){ let hd=null; if(e.webkitCompassHeading!=null) hd=e.webkitCompassHeading; else if(e.absolute && e.alpha!=null) hd=(360-e.alpha)%360; if(hd!=null){ heading=hd; renderWalk(); } }
$('compassBtn').onclick=async()=>{
  try{ if(window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission==='function'){ const r=await DeviceOrientationEvent.requestPermission(); if(r!=='granted') throw 0; }
    window.addEventListener('deviceorientationabsolute', onOrient, true); window.addEventListener('deviceorientation', onOrient, true);
    $('compassBtn').textContent='Compass on'; }catch(e){ $('compassBtn').textContent='Compass unavailable'; }
};

// ---------- rides ----------

function destMap(){ const d=Object.assign({}, T.dest||{});
  for(const s of STOPS) if(isFinite(s.lat) && (!T.dest || s.custom) && !d[s.id]) d[s.id]={name:s.name.replace(/\s*\(.*\)/,''), note:s.note||(s.look||'').replace('Look for: ',''), lat:s.lat, lng:s.lng};
  return d; }
function rideWarnFor(k){ try{ return T.rideWarning ? (T.rideWarning(k)||'') : ''; }catch(e){ return ''; } }
function nextRide(){ const D=destMap(); const o=store.get(SK+'ride','auto'); if(o!=='auto' && D[o]) return o;
  if(T.nextRide){ try{ const k=T.nextRide(); if(D[k] && (!STOPS.find(x=>x.id===k) || !played.has(k))) return k; }catch(e){} }
  const n=STOPS.find(p=>!played.has(p.id) && p.id!==START_ID && D[p.id]); if(n) return n.id;
  return D[START_ID] ? START_ID : Object.keys(D)[0]; }
function renderRide(){
  const D=destMap(), keys=Object.keys(D); $('rideCard').style.display=keys.length?'':'none'; if(!keys.length) return;
  const sig=keys.join('|'); if($('rideSel').dataset.sig!==sig){ $('rideSel').dataset.sig=sig; $('rideSel').innerHTML='<option value="auto">Automatic (follow the tour)</option>'+Object.entries(D).map(([k,v])=>`<option value="${k}">${esc(v.name)}</option>`).join(''); $('rideSel').value=D[store.get(SK+'ride','auto')]?store.get(SK+'ride','auto'):'auto'; $('rideSel').onchange=()=>{ store.set(SK+'ride',$('rideSel').value); renderRide(); }; }
  const k=nextRide(), d=D[k];
  $('rideTo').textContent = d.name;
  const away = lastFix ? ' · '+fmt(dist(lastFix.lat,lastFix.lng,d.lat,d.lng))+' away' : '';
  $('rideNote').textContent = (d.note||'') + away;
  $('rideUber').href=uberUrl(d); $('rideMaps').href=mapsUrl(d);
  const w=rideWarnFor(k); $('rideWarn').style.display=w?'block':'none'; $('rideWarn').innerHTML=w; $('rideFlag').textContent=w?' ⚠️':'';
  $('rideList').innerHTML = Object.entries(D).filter(([kk])=>kk!==k).map(([kk,v])=>`<div class="dest"><div class="n">${esc(v.name)}<div class="m">${esc(v.note||'')}</div></div>${v.remote?'<span title="Return rides may be hard" style="margin-right:4px">⚠️</span>':''}<a class="mini" href="${uberUrl(v)}">Uber</a><a class="mini sec" href="${mapsUrl(v)}">Maps</a></div>`).join('');
}
const uberUrl=d=>`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${d.lat}&dropoff[longitude]=${d.lng}&dropoff[nickname]=${encodeURIComponent(d.name)}`;
const mapsUrl=d=>`https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}&travelmode=driving`;


// ---------- google map ----------
function gmapFromStops(){ const P=STOPS.filter(p=>isFinite(p.lat)).slice(0,10).map(p=>p.lat.toFixed(6)+','+p.lng.toFixed(6)); if(!P.length) return null;
  const mode=T.mode==='walk'?'walking':'driving';
  return { embed:`https://maps.google.com/maps?saddr=${P[0]}&daddr=${P.slice(1).join('+to:')}&output=embed${T.mode==='walk'?'&dirflg=w':''}`,
    open:`https://www.google.com/maps/dir/?api=1&origin=${P[0]}&destination=${P[P.length-1]}${P.length>2?'&waypoints='+encodeURIComponent(P.slice(1,-1).join('|')):''}&travelmode=${mode}`,
    note:'Route: '+STOPS.filter(p=>isFinite(p.lat)).slice(0,10).map(p=>p.name.replace(/\s*\(.*\)/,'')).join(', ')+'.' }; }
function setGmap(){ const g=(T.gmap && !planEdited) ? T.gmap : gmapFromStops(); if(!g) return;
  if($('gmap').dataset.src!==g.embed){ $('gmap').dataset.src=g.embed; $('gmap').src=g.embed; }
  $('gOpen').href=g.open; $('gNoteTxt').textContent=g.note||''; }
(function(){
  setGmap();
  function show(g){ $('gwrap').style.display=g?'':'none'; $('map').style.display=g?'none':''; $('tabG').classList.toggle('on',g); $('tabL').classList.toggle('on',!g); store.set(SK+'maptab',g?'g':'l'); }
  $('tabG').onclick=()=>show(true); $('tabL').onclick=()=>show(false);
  const pref=store.get(SK+'maptab', navigator.onLine?'g':'l');
  show(navigator.onLine && pref==='g');
  window.addEventListener('offline',()=>show(false));
  if(!navigator.onLine) $('gNoteTxt').textContent='Google map needs signal. Showing the offline map.';
})();

// ---------- photo album ----------
const SB='https://otlbfbqdwygrkxtvgfyp.supabase.co', SBK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90bGJmYnFkd3lncmt4dHZnZnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDI0MTksImV4cCI6MjA5NzI3ODQxOX0.9D-bMdK6At0CQijs27z0IT8-lpUEu6I4bZrdPko6PQU';
const BUCKET='tour-photos', ALBUM=T.album||T.id;
let dbp=null;
function idb(){ if(dbp) return dbp; dbp=new Promise((res,rej)=>{ try{ const r=indexedDB.open('cdj-photos',1); r.onupgradeneeded=()=>r.result.createObjectStore('q',{keyPath:'path'}); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error);}catch(e){rej(e);} }); return dbp; }
async function qAll(){ try{ const d=await idb(); return await new Promise(r=>{ const t=d.transaction('q').objectStore('q').getAll(); t.onsuccess=()=>r(t.result||[]); t.onerror=()=>r([]); }); }catch(e){ return []; } }
async function qPut(o){ const d=await idb(); return new Promise((r,j)=>{ const t=d.transaction('q','readwrite'); t.objectStore('q').put(o); t.oncomplete=r; t.onerror=()=>j(t.error); }); }
async function qDel(k){ const d=await idb(); return new Promise(r=>{ const t=d.transaction('q','readwrite'); t.objectStore('q').delete(k); t.oncomplete=r; t.onerror=r; }); }
const slug=s=>(s||'guest').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,24)||'guest';
async function shrink(file){
  try{ const bmp=await createImageBitmap(file); const k=Math.min(1,1600/Math.max(bmp.width,bmp.height));
    const c=document.createElement('canvas'); c.width=Math.round(bmp.width*k); c.height=Math.round(bmp.height*k); c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
    return await new Promise(r=>c.toBlob(b=>r(b||file),'image/jpeg',0.82)); }catch(e){ return file; }
}
function nearestStop(){ if(!lastFix) return current?current.stop.id:'tour'; let best='tour',bd=1e9; for(const p of STOPS){ if(!isFinite(p.lat)) continue; const d=dist(lastFix.lat,lastFix.lng,p.lat,p.lng); if(d<bd){bd=d;best=p.id;} } return bd<800?best:'tour'; }
let review=[];
async function addFiles(files){
  if(!files.length) return;
  $('addSheet').classList.remove('open');
  $('reviewGrid').innerHTML='<div class="status">Preparing…</div>'; $('reviewSheet').classList.add('open');
  review=[]; for(const f of files){ const blob=await shrink(f); review.push({blob, url:URL.createObjectURL(blob), keep:true}); }
  renderReview();
}
function renderReview(){
  $('reviewGrid').innerHTML = review.map((r,i)=>`<div data-i="${i}" class="${r.keep?'':'off'}"><img src="${r.url}"><span class="x">${r.keep?'✕':'↺'}</span></div>`).join('');
  $('reviewGrid').querySelectorAll('[data-i]').forEach(d=>d.onclick=()=>{ const r=review[+d.dataset.i]; r.keep=!r.keep; renderReview(); });
  const n=review.filter(r=>r.keep).length; $('acceptBtn').textContent = n? `Upload ${n} photo${n===1?'':'s'}` : 'Nothing selected'; $('acceptBtn').disabled=!n;
}
$('rejectBtn').onclick=()=>{ review.forEach(r=>URL.revokeObjectURL(r.url)); review=[]; $('reviewSheet').classList.remove('open'); };
$('acceptBtn').onclick=async()=>{ const keep=review.filter(r=>r.keep).map(r=>r.blob); review.forEach(r=>URL.revokeObjectURL(r.url)); review=[]; $('reviewSheet').classList.remove('open'); $('addSheet').classList.add('open'); await queueBlobs(keep); };
async function queueBlobs(blobs){
  const who=slug($('who').value); store.set('cdj_who',$('who').value);
  let n=0;
  for(const blob of blobs){ const stop=current?current.stop.id:nearestStop();
    const path=`${ALBUM}/${Date.now()}-${Math.random().toString(36).slice(2,6)}__${who}__${stop}.jpg`;
    try{ await qPut({path, blob, t:Date.now()}); n++; }catch(e){ $('upStatus').textContent='Could not save photo on this phone: '+e; } }
  $('upStatus').innerHTML=`<span class="ok">${n} photo${n===1?'':'s'} saved.</span> Uploading…`; updateBadge(); flush();
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).classList.remove('open'));
}
let flushing=false;
async function flush(){
  if(flushing) return; flushing=true;
  try{ const items=await qAll();
    for(const it of items){ if(!navigator.onLine) break;
      try{ const r=await fetch(`${SB}/storage/v1/object/${BUCKET}/${it.path}`,{method:'POST',headers:{apikey:SBK,Authorization:'Bearer '+SBK,'Content-Type':'image/jpeg'},body:it.blob});
        if(r.ok || r.status===409){ await qDel(it.path); } else { $('upStatus').textContent='Upload paused (server said '+r.status+'). Will retry.'; break; } }catch(e){ break; } }
  }finally{ flushing=false; }
  const left=(await qAll()).length; updateBadge();
  if(left===0) $('upStatus').innerHTML='<span class="ok">All photos uploaded to the album.</span>'; else $('upStatus').textContent=`${left} waiting for signal. They'll upload automatically.`;
}
async function updateBadge(){ const n=(await qAll()).length; $('badge').style.display=n?'block':'none'; $('badge').textContent=n; }
window.addEventListener('online',flush); setInterval(flush,30000);
const nice=id=>{ const s=findAny(id); return s? s.name.replace(/\s*\(.*\)/,'') : 'On the road'; };
async function openAlbum(){
  $('albumSheet').classList.add('open'); $('albumStatus').textContent='Loading…';
  const local=await qAll(); let tiles=local.map(it=>({src:URL.createObjectURL(it.blob), name:it.path.split('/').pop(), pend:true, path:it.path}));
  try{ const r=await fetch(`${SB}/storage/v1/object/list/${BUCKET}`,{method:'POST',headers:{apikey:SBK,Authorization:'Bearer '+SBK,'Content-Type':'application/json'},body:JSON.stringify({prefix:ALBUM,limit:500,sortBy:{column:'name',order:'desc'}})});
    const j=await r.json(); if(Array.isArray(j)){ tiles=tiles.concat(j.filter(o=>o.name&&o.name.endsWith('.jpg')).map(o=>({src:`${SB}/storage/v1/object/public/${BUCKET}/${ALBUM}/${o.name}`, name:o.name, path:`${ALBUM}/${o.name}`}))); }
    $('albumStatus').textContent = tiles.length? `${tiles.length} photo${tiles.length===1?'':'s'} from the group`:'No photos yet. Tap 📷 to add the first!';
  }catch(e){ $('albumStatus').textContent = (tiles.length?'Showing photos on this phone. ':'')+'Offline: the shared album loads when you have signal.'; }
  $('grid').innerHTML = tiles.map(t=>{ const parts=t.name.replace('.jpg','').split('__'); const who=(parts[1]||'').replace(/-/g,' '); return `<div><img loading="lazy" crossorigin="anonymous" src="${t.src}" data-full="${t.src}" data-path="${t.path}" data-pend="${t.pend?1:0}">${t.pend?'<span class="pend">waiting</span>':''}<span class="tag">${who} · ${nice(parts[2])}</span></div>`; }).join('');
  $('grid').querySelectorAll('img').forEach(i=>i.onclick=()=>{ $('viewImg').src=i.dataset.full; viewPath=i.dataset.path; viewPend=i.dataset.pend==='1'; $('vDel').textContent='🗑 Delete'; delArmed=false; $('vDel').style.display=(ownerPin()||viewPend)?'':'none'; $('viewer').classList.add('open'); });
}


// ---------- owner moderation ----------
let viewPath=null, viewPend=false, delArmed=false;
const ownerPin=()=>store.get('cdj_owner_pin','');
function ownerUI(){ $('ownerBtn').textContent = ownerPin()? '🔓 Owner (on)' : '🔒 Owner'; }
async function adminCall(pin, path){ const r=await fetch(`${SB}/functions/v1/album-admin`,{method:'POST',headers:{apikey:SBK,Authorization:'Bearer '+SBK,'Content-Type':'application/json'},body:JSON.stringify({pin,path})}); return r; }
$('ownerBtn').onclick=()=>{ if(ownerPin()){ store.set('cdj_owner_pin',''); ownerUI(); $('ownerBox').style.display='none'; return; } $('ownerBox').style.display=$('ownerBox').style.display==='none'?'block':'none'; };
$('ownerGo').onclick=async()=>{ const pin=$('ownerPin').value.trim(); if(!pin) return; $('ownerMsg').textContent='Checking…';
  try{ const r=await adminCall(pin,'__check'); if(r.ok){ store.set('cdj_owner_pin',pin); $('ownerMsg').innerHTML='<span class="ok">Owner mode on.</span> Open any album photo to delete it.'; $('ownerPin').value=''; ownerUI(); }
    else $('ownerMsg').innerHTML='<span class="bad">Wrong PIN.</span>'; }catch(e){ $('ownerMsg').textContent='Needs signal to check the PIN.'; } };
$('vDel').onclick=async e=>{ e.stopPropagation();
  if(!delArmed){ delArmed=true; $('vDel').textContent='Tap again to delete'; return; }
  $('vMsg').textContent='Deleting…';
  try{
    if(viewPend){ await qDel(viewPath); updateBadge(); }
    else { const r=await adminCall(ownerPin(), viewPath); if(r.status===401){ store.set('cdj_owner_pin',''); ownerUI(); throw new Error('PIN no longer valid'); } if(!r.ok) throw new Error('server '+r.status); }
    $('viewer').classList.remove('open'); $('vMsg').textContent=''; openAlbum();
  }catch(err){ $('vMsg').textContent='Could not delete: '+err.message; delArmed=false; $('vDel').textContent='🗑 Delete'; }
};
ownerUI();


// ---------- ask your guide ----------
function nearestStopInfo(){
  if(!lastFix) return null; let best=null,bd=1e9;
  for(const p of STOPS){ if(!isFinite(p.lat)) continue; const d=dist(lastFix.lat,lastFix.lng,p.lat,p.lng); if(d<bd){bd=d;best=p;} }
  return best?{stop:best,d:bd}:null;
}
function localAnswer(q){
  const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const stop=new Set(['what','where','when','which','with','that','this','there','about','tell','from','have','does','they','their','here','were','would','could','should','long','many','much','some']);
  const syn={statue:'sculpt',statues:'sculpt',sculptures:'sculpt',sculpture:'sculpt',church:'igreja',train:'railway',food:'eat',snack:'eat'};
  const words=[...new Set(norm(q).split(/[^a-z0-9]+/).filter(w=>w.length>3 && !stop.has(w)).map(w=>syn[w]||w))];
  if(!words.length) return '';
  const n=nearestStopInfo(); const pool=STOPS.concat(MUSEUM,WALKSTORIES,FILLERS);
  const sens=[]; for(const s of pool) for(const sen of splitSentences(s.text)) sens.push({id:s.id,sen,t:norm(sen)});
  const stem=w=>w.slice(0,Math.max(4,w.length-2)); const df={}; for(const w of words) df[w]=sens.filter(x=>x.t.includes(stem(w))).length||1;
  const scored=sens.map(x=>{ let sc=0, hit=0; for(const w of words){ if(x.t.includes(stem(w))){ sc+=Math.min(9,1/df[w]); hit++; } } sc+=hit*10;
    if(sc && n && x.id===n.stop.id) sc*=1.4; if(sc && current && x.id===current.stop.id) sc*=1.4; return {sc,x}; }).filter(o=>o.sc>0);
  const need=Math.max(1,Math.ceil(words.length*0.5));
  scored.sort((a,b)=>b.sc-a.sc); if(!scored.length || Math.floor(scored[0].sc/10)<need) return '';
  const top=scored[0].x; const same=scored.filter(o=>o.x.id===top.id).slice(0,3).map(o=>o.x.sen);
  return same.join(' ');
}
function sayAnswer(text){
  if(!text) return;
  if(current && !paused) togglePause();
  sayText(text);
}
function sayText(text, onend){
  if(document.body.classList.contains('hoh') || !synth){ onend && setTimeout(onend,300); return; }
  hush();
  const phone=()=>{ synth.cancel(); const u=new SpeechSynthesisUtterance(text); const v=voices.find(v=>v.name===$('voice').value); if(v){u.voice=v;u.lang=v.lang;} u.rate=+$('rate').value; if(onend){ u.onend=onend; u.onerror=onend; } synth.speak(u); };
  if(!premiumOn() || text.length>2400){ phone(); return; }
  const my=Math.random(); sayText.tok=my;
  ttsUrl(text).then(url=>{ if(sayText.tok!==my) return; if(!url){ phone(); return; }
    AUD.onended=()=>{ AUD.onended=null; onend&&onend(); }; AUD.onerror=()=>{ AUD.onerror=null; phone(); };
    AUD.src=url; AUD.playbackRate=+$('rate').value; AUD.play().catch(phone); });
}
let askHist=[]; try{ askHist=JSON.parse(sessionStorage.getItem(SK+'askhist')||'[]'); }catch(e){}
function tourOverview(){
  const first=t=>splitSentences(t).slice(0,2).join(' ').slice(0,280);
  const line=(p,kind)=>`- ${p.name}${kind?' ['+kind+']':''}${played.has(p.id)?' (already heard)':''}: ${first(p.text)}`;
  return STOPS.map(p=>line(p,'stop')).concat(MUSEUM.map(p=>line(p,'museum walk')), WALKSTORIES.map(p=>line(p,'walking story')), FILLERS.map(p=>line(p,'road story'))).join('\n');
}
function askContext(){
  const n=nearestStopInfo();
  return { lat:lastFix?lastFix.lat:null, lng:lastFix?lastFix.lng:null, near:n?n.stop.name:'', nearDist:n?fmt(n.d):'',
    playing: current?current.stop.name:'', local:new Date().toLocaleString('en-US',{timeZone:T.tz||undefined,weekday:'short',hour:'2-digit',minute:'2-digit'}),
    script: (current?current.stop.text:'') + '\n' + (n && n.d<1500 ? n.stop.text : ''),
    trip: T.trip||'', city:T.city||T.title, guestNotes:T.guestNotes||'', overview: tourOverview(), history: askHist.slice(-4) };
}
let askViaVoice=false, askSearched=false;
// one question at a time: lock Ask, the mic and the chips until the answer (or plan) comes back
let asking=false;
function askBusy(on){ asking=on; ['askGo','micBtn'].forEach(id=>{ const b=$(id); if(b){ b.disabled=on; b.style.opacity=on?.5:''; } });
  $('askGo').textContent = on ? 'Thinking…' : 'Ask'; $('askChips').querySelectorAll('button').forEach(b=>{ b.disabled=on; b.style.opacity=on?.5:''; }); }
async function ask(){
  if(asking) return;
  const q=$('askIn').value.trim(); if(!q) return;
  askBusy(true);
  try{ await askInner(q); } finally { askBusy(false); }
}
async function askInner(q){
  const viaVoice=askViaVoice; askViaVoice=false; askSearched=false;
  $('askAns').textContent = /plan|skip|add|instead|change|reorder|back (at|to|by)|time|hour|minutes|tired|hungry/i.test(q) ? 'Thinking… (plan changes take about 30 seconds)' : 'Thinking…'; $('askSay').style.display='none';
  let ans='', src='', errMsg='';
  if(navigator.onLine){
    try{ const body=Object.assign({question:q, tour_id:T.id}, askContext(), (window.planContext?window.planContext():{}));
      const r=await fetch(`${SB}/functions/v1/tour-ask`,{method:'POST',headers:{apikey:SBK,Authorization:'Bearer '+SBK,'Content-Type':'application/json'},body:JSON.stringify(body)});
      const j=await r.json();
      if(r.ok && j.type==='plan' && window.onPlanProposal){ askHist.push({q, a:j.summary||'I proposed a new plan.'}); askHist=askHist.slice(-6); try{ sessionStorage.setItem(SK+'askhist',JSON.stringify(askHist)); }catch(e){} window.onPlanProposal(j, viaVoice); return; }
      if(r.ok && j.answer){ ans=j.answer; src='Claude'; askSearched=!!j.searched; } else if(j.error==='not_configured'){ src='notcfg'; } else { src='err'; errMsg=(j.detail||j.error||('HTTP '+r.status)); } }catch(e){ src='err'; errMsg=String(e); }
  }
  if(!ans){ ans=localAnswer(q); if(ans) ans=(src==='notcfg'?'':'')+ans; }
  if(!ans) ans = navigator.onLine ? "That one isn't covered in my tour notes, and I can't reach Claude right now. Try asking staff nearby, or rephrase the question." : "I can't reach Claude without signal, and I didn't find that in the tour notes. Try again when you have signal.";
  $('askAns').innerHTML = ans.replace(/</g,'&lt;') + `<div class="status" style="margin-top:8px">${src==='Claude'?(askSearched?'Answered by Claude, checked on the web.':'Answered by Claude using your location.'):'From the tour notes on this phone (offline answer).'}${src==='notcfg'?' Claude answers need setup: see the owner note.':''}${src==='err'?' (Claude unavailable: '+errMsg.replace(/</g,'&lt;').slice(0,120)+')':''}</div>`;
  if(src==='Claude'){ askHist.push({q, a:ans}); askHist=askHist.slice(-6); try{ sessionStorage.setItem(SK+'askhist',JSON.stringify(askHist)); }catch(e){} }
  $('askSay').style.display=''; $('askSay').onclick=()=>sayAnswer(ans);
  sayAnswer(ans);
}
$('askGo').onclick=()=>{ unlockAudio(); ask(); };
$('askBtn').onclick=()=>{ const n=nearestStopInfo();
  $('askWhere').textContent = n? `Near: ${n.stop.name} (${fmt(n.d)})${current?' · playing: '+current.stop.name:''}` : 'Location unknown. Tap Start tour to turn on GPS.';
  const chips=['What am I looking at?','Where can we get a light snack nearby?','Tell me a fun fact about this place','How long should we spend here?'];
  $('askChips').innerHTML='<button class="planchip">🗺 Change the plan…</button>'+chips.map(c=>`<button>${c}</button>`).join('');
  $('askChips').querySelectorAll('button').forEach(b=>b.onclick=()=>{ if(b.classList.contains('planchip')){ $('askIn').value=''; $('askIn').placeholder='e.g. Skip the monastery, find a coffee near here, and get us back to the hotel by 5'; $('askIn').focus(); $('askAns').innerHTML='<div class="status">Say or type what you want to change: skip, add, reorder, or a time to be back. I\'ll propose a new plan for you to approve.</div>'; return; } $('askIn').value=b.textContent; unlockAudio(); ask(); });
  $('askSheet').classList.add('open'); };
$('micBtn').onclick=()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ $('askAns').textContent='Voice input is not supported in this browser. Type instead, or use your keyboard\'s microphone.'; return; }
  const r=new SR(); r.lang='en-US'; r.interimResults=true; $('micBtn').textContent='🎙 Listening…';
  r.onresult=e=>{ $('askIn').value=[...e.results].map(x=>x[0].transcript).join(''); };
  r.onend=()=>{ $('micBtn').textContent='🎤 Speak'; if($('askIn').value.trim()){ askViaVoice=true; ask(); } };
  r.onerror=()=>{ $('micBtn').textContent='🎤 Speak'; };
  if(current && !paused) togglePause();
  r.start();
};


// ---------- long press a stop to reset it ----------
let suppressClickUntil=0, lp=null;
function toast(msg){ const t=$('toast'); t.textContent=msg; t.style.display='block'; clearTimeout(t._h); t._h=setTimeout(()=>t.style.display='none',2600); }
$('stops').addEventListener('pointerdown', e=>{
  const row=e.target.closest('.stop[data-id]'); if(!row) return;
  const id=row.dataset.id; row.classList.add('pressing');
  lp={id, x:e.clientX, y:e.clientY, t:setTimeout(()=>{
    lp=null; suppressClickUntil=Date.now()+700;
    played.delete(id); store.set(SK+'played',[...played]); queue=queue.filter(q=>q!==id); saveState();
    if(navigator.vibrate){ try{ navigator.vibrate(60); }catch(err){} }
    const s=findAny(id);
    toast(`↺ Reset: "${s?s.name:id}" will play again`); renderStops(); drawMap();
  }, 650)};
});
function lpCancel(e){ if(!lp) { document.querySelectorAll('.stop.pressing').forEach(r=>r.classList.remove('pressing')); return; }
  if(e && e.type==='pointermove' && Math.hypot(e.clientX-lp.x,e.clientY-lp.y)<10) return;
  clearTimeout(lp.t); lp=null; document.querySelectorAll('.stop.pressing').forEach(r=>r.classList.remove('pressing')); }
['pointerup','pointercancel','pointermove'].forEach(ev=>document.addEventListener(ev,lpCancel,{passive:true}));
$('stops').addEventListener('contextmenu', e=>e.preventDefault());

// ---------- branded share ----------
const PIN = new Path2D('M120 186 C 92 146, 64 120, 64 88 A 56 56 0 0 1 176 88 C 176 120, 148 146, 120 186 Z');
async function brandedBlob(src){
  const img = await new Promise((res,rej)=>{ const i=new Image(); i.crossOrigin='anonymous'; i.onload=()=>res(i); i.onerror=rej; i.src=src; });
  const c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight; const x=c.getContext('2d');
  x.drawImage(img,0,0);
  const u=Math.max(c.width,c.height)/1000; // scale unit
  const f1=Math.round(26*u), f2=Math.round(17*u), pad=Math.round(16*u);
  x.font=`700 ${f1}px -apple-system,Segoe UI,Roboto,sans-serif`; const t1=T.title;
  x.font=`600 ${f2}px -apple-system,Segoe UI,Roboto,sans-serif`; const t2='Right Here, Right Now';
  x.font=`700 ${f1}px -apple-system,Segoe UI,Roboto,sans-serif`; const w1=x.measureText(t1).width;
  x.font=`600 ${f2}px -apple-system,Segoe UI,Roboto,sans-serif`; const w2=x.measureText(t2).width;
  const iconW=Math.round(34*u), bw=pad*3+iconW+Math.max(w1,w2), bh=pad*2+f1+f2+Math.round(4*u);
  const bx=Math.round(22*u), by=c.height-bh-Math.round(22*u), r=bh/2;
  x.fillStyle='rgba(11,42,91,.72)'; x.beginPath(); x.moveTo(bx+r,by); x.arcTo(bx+bw,by,bx+bw,by+bh,r); x.arcTo(bx+bw,by+bh,bx,by+bh,r); x.arcTo(bx,by+bh,bx,by,r); x.arcTo(bx,by,bx+bw,by,r); x.fill();
  x.save(); const sc=iconW/120; x.translate(bx+pad-64*sc+Math.round(4*u), by+(bh-160*sc)/2-30*sc); x.scale(sc,sc); x.fillStyle='#fff'; x.fill(PIN); x.fillStyle='#1d4ed8'; x.beginPath(); x.arc(120,88,24,0,7); x.fill(); x.restore();
  const tx=bx+pad*2+iconW;
  x.fillStyle='#fff'; x.font=`700 ${f1}px -apple-system,Segoe UI,Roboto,sans-serif`; x.textBaseline='top'; x.fillText(t1,tx,by+pad);
  x.fillStyle='#bfdbfe'; x.font=`600 ${f2}px -apple-system,Segoe UI,Roboto,sans-serif`; x.fillText(t2,tx,by+pad+f1+Math.round(4*u));
  x.fillStyle='#f59e0b'; x.fillText('.', tx+w2+1, by+pad+f1+Math.round(4*u));
  return await new Promise(r=>c.toBlob(r,'image/jpeg',0.9));
}
async function shareCurrent(save){
  $('vMsg').textContent='Preparing…';
  try{ const blob=await brandedBlob($('viewImg').src); const file=new File([blob],slug(T.title)+'.jpg',{type:'image/jpeg'});
    if(!save && navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file], title:T.title, text:'📍 '+T.title+' · Right Here, Right Now'}); $('vMsg').textContent=''; return; }
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=slug(T.title)+'.jpg'; document.body.appendChild(a); a.click(); a.remove(); $('vMsg').textContent='Saved to your downloads.';
  }catch(e){ $('vMsg').textContent = (e && e.name==='AbortError') ? '' : 'Could not prepare this photo. Try again with signal.'; }
}
$('vShare').onclick=e=>{ e.stopPropagation(); shareCurrent(false); };
$('vSave').onclick=e=>{ e.stopPropagation(); shareCurrent(true); };
$('vClose').onclick=e=>{ e.stopPropagation(); $('viewer').classList.remove('open'); $('vMsg').textContent=''; };

$('fab').onclick=()=>{ $('who').value=store.get('cdj_who',''); $('addSheet').classList.add('open'); };
$('albumBtn').onclick=openAlbum;
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).classList.remove('open'));
$('takeBtn').onclick=()=>$('camIn').click(); $('pickBtn').onclick=()=>$('galIn').click();
$('camIn').onchange=e=>{ addFiles([...e.target.files]); e.target.value=''; };
$('galIn').onchange=e=>{ addFiles([...e.target.files]); e.target.value=''; };
updateBadge(); flush();

showScene(START_ID); renderStops(); drawMap(); try{ renderWalk(); }catch(e){}

// ---------- restore after refresh ----------
(function(){
  const st=store.get(SK+'state',null); if(!st || !st.started || Date.now()-(st.t||0)>12*3600*1000) return;
  started=true; $('start').textContent='Tour running'; $('start').classList.add('secondary');
  queue=(st.queue||[]).filter(id=>findAny(id));
  beginTracking();
  if(st.cur){ const stop=findAny(st.cur.id);
    if(stop){ current={stop, sentences:buildSeq(stop.id,stop), idx:Math.min(st.cur.idx||0, 999), token:Math.random()};
      current.idx=Math.min(current.idx, current.sentences.length-1); paused=true;
      showScene(stop.id); showLook(stop.id); $('nowTitle').textContent='🔊 '+stop.name;
      const it=current.sentences[current.idx]; $('nowLine').textContent=typeof it==='object'?(it.t||''):it;
      ['pauseBtn','stopBtn','skipBtn'].forEach(b=>$(b).disabled=false); $('pauseBtn').textContent='Resume';
      syncPause();
      $('status').innerHTML='<span class="ok">Tour restored.</span> Tap ▶ Resume to continue where you left off.';
    } }
  else $('status').innerHTML='<span class="ok">Tour restored.</span> GPS is back on; stops will play as you arrive.';
})();

fetchPhotos().then(()=>{ if(!current) showScene(START_ID); });