'use strict';
const KEY='djplanner.v1';
const TYPES={shaadi:'Shaadi / Wedding',birthday:'Birthday',club:'Club / Party',corporate:'Corporate',other:'Other'};
const PHASES=['Warm-up','Baraat / Entry','Varmala / Special','Dance floor','Peak hour','Slow / Romantic','Cool-down','Last song'];
const GEAR={
 common:['Laptop / controller charged','Headphones','Main speakers + stands','Mixer / controller','Mic + spare batteries','Power strip + extension','XLR / RCA / aux cables','Backup pen drive with songs','Laptop charger','Gaffer tape'],
 shaadi:['Cordless mic for host / pandit','DJ lights + stand','Fog / smoke machine','Dhol sample pack ready','Baraat portable speaker','Wedding timeline from family'],
 birthday:['Birthday song + cake cutting track','Party lights','Hosting mic','Kids-safe song list'],
 club:['Booth monitor','Spare USB drives','Venue sound check done','Set time confirmed with manager'],
 corporate:['Clean (no abuse) song list','Background playlist','Podium mic','Sound check before guests arrive'],
 other:[]};
const STARTER={
 shaadi:[['Warm-up','Tum Hi Ho (soft mix)','Arijit Singh',130,4.0],['Baraat / Entry','Baraat dhol mix','Dhol',140,5.0],['Varmala / Special','Kal Ho Naa Ho','Sonu Nigam',70,5.2],['Dance floor','London Thumakda','Labh Janjua',140,4.0],['Peak hour','Gallan Goodiyan','Various',112,4.5],['Last song','Tujhe Dekha To','Kumar Sanu',90,5.3]],
 birthday:[['Warm-up','Happy Birthday (mix)','',100,2.0],['Dance floor','Badtameez Dil','Benny Dayal',112,4.0],['Peak hour','Kala Chashma','Badshah',105,3.5],['Last song','Dil Chahta Hai','',95,5.0]],
 club:[['Warm-up','Deep house intro','',120,5.0],['Peak hour','Big room drop','',128,5.0],['Cool-down','Chill closer','',110,5.0]],
 corporate:[['Warm-up','Soft instrumental','',90,5.0],['Dance floor','Feel good Bollywood','',110,4.0]],
 other:[]};
let S=load();let view={tab:'events',ev:null,sub:'songs',edit:null};
function load(){const d=store.get(KEY,null);return d&&d.events?d:{events:[]}}
function save(){store.set(KEY,S)}
const fmtDur=s=>{s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+'h ':'')+m+'m'+(x?' '+x+'s':'')};
const mmss=s=>Math.floor(s/60)+':'+String(Math.round(s%60)).padStart(2,'0');
function parseDur(v){v=String(v).trim();if(!v)return 240;if(v.includes(':')){const[a,b]=v.split(':');return (+a||0)*60+(+b||0)}const n=parseFloat(v.replace(',','.'));return isFinite(n)?Math.round(n*60):240}
function toMin(t){if(!t)return null;const[a,b]=t.split(':');return (+a)*60+(+b)}
function clock(mins){mins=((Math.round(mins)%1440)+1440)%1440;const h=Math.floor(mins/60),m=mins%60;const ap=h>=12?'PM':'AM';return ((h%12)||12)+':'+String(m).padStart(2,'0')+' '+ap}
function getEv(){return S.events.find(e=>e.id===view.ev)}
function evSummary(e){
 const total=e.songs.reduce((a,s)=>a+s.dur,0);
 const st=toMin(e.start),en=toMin(e.end);let window=null;
 if(st!=null&&en!=null){window=(en-st+1440)%1440*60;if(window===0)window=null}
 return{total,window,count:e.songs.length,bpm:e.songs.filter(s=>s.bpm).length?Math.round(e.songs.filter(s=>s.bpm).reduce((a,s)=>a+s.bpm,0)/e.songs.filter(s=>s.bpm).length):0};
}
function dateBox(d){if(!d)return '<div class="date">--<small>date</small></div>';const x=new Date(d+'T00:00:00');return `<div class="date">${x.getDate()}<small>${x.toLocaleString('en-IN',{month:'short'})}</small></div>`}
function daysTo(d){if(!d)return '';const n=Math.round((new Date(d+'T00:00:00')-new Date(new Date().toDateString()))/864e5);return n===0?'Aaj!':n>0?n+' din baaki':Math.abs(n)+' din pehle'}
function render(){
 const app=$('#app');
 if(view.tab==='backup')return app.innerHTML=backupHTML(),bindBackup();
 if(view.ev&&getEv())return renderEvent(app);
 view.ev=null;
 const evs=[...S.events].sort((a,b)=>(a.date||'9')<(b.date||'9')?-1:1);
 app.innerHTML=`<div class="tabs"><button class="on">Mere Events</button><button data-go="backup">Backup</button></div>
 <div class="card"><h2>Naya event</h2><form id="newEv" class="grid">
  <div><label class="f">Event ka naam</label><input name="name" required maxlength="80" placeholder="e.g. Sharma Shaadi Sangeet"></div>
  <div><label class="f">Type</label><select name="type">${Object.entries(TYPES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div>
  <div><label class="f">Date</label><input type="date" name="date"></div>
  <div><label class="f">Venue</label><input name="venue" maxlength="100" placeholder="Hall / hotel / club"></div>
  <div><label class="f">Start time</label><input type="time" name="start" value="20:00"></div>
  <div><label class="f">End time</label><input type="time" name="end" value="23:30"></div>
  <div style="align-self:end"><label class="row" style="gap:8px"><input type="checkbox" name="starter" checked> Starter songs + gear daalo (edit kar sakte ho)</label></div>
  <div style="align-self:end"><button class="btn pri" style="width:100%">Event banao</button></div></form></div>
 <h2>Events (${evs.length})</h2>
 ${evs.length?evs.map(e=>{const s=evSummary(e);return `<div class="card ev" data-open="${e.id}"><div style="display:contents">${dateBox(e.date)}<div class="grow"><b>${esc(e.name)}</b><div class="muted" style="font-size:.85rem">${TYPES[e.type]||''}${e.venue?' · '+esc(e.venue):''}</div><div class="muted" style="font-size:.8rem">${s.count} songs · ${fmtDur(s.total)} · ${daysTo(e.date)}</div></div><span class="pill">${doneCount(e)}/${e.gear.length} gear</span></div></div>`}).join(''):'<div class="empty card">Abhi koi event nahi. Upar se pehla event banao.</div>'}`;
 $('#newEv').onsubmit=ev=>{ev.preventDefault();const f=new FormData(ev.target);const type=f.get('type');
  const e={id:uid(),name:f.get('name').trim(),type,date:f.get('date'),venue:f.get('venue').trim(),start:f.get('start'),end:f.get('end'),notes:'',songs:[],gear:[],must:'',avoid:''};
  if(f.get('starter')){e.songs=STARTER[type].map(([p,t,a,b,d])=>({id:uid(),phase:p,title:t,artist:a,bpm:b,dur:Math.round(d*60),key:'',note:''}));e.gear=[...GEAR.common,...GEAR[type]].map(t=>({id:uid(),t,done:false}))}
  S.events.push(e);save();view.ev=e.id;view.sub='songs';render();toast('Event ban gaya')};
 $$('[data-open]').forEach(el=>el.onclick=()=>{view.ev=el.dataset.open;view.sub='songs';render();scrollTo(0,0)});
 $$('[data-go]').forEach(b=>b.onclick=()=>{view.tab=b.dataset.go;render()});
}
const doneCount=e=>e.gear.filter(g=>g.done).length;
function renderEvent(app){
 const e=getEv(),sm=evSummary(e);
 const subs=[['songs','Setlist'],['timeline','Timeline'],['gear','Gear checklist'],['info','Event info'],['share','Share / Print']];
 app.innerHTML=`<div class="row noprint" style="margin-bottom:10px"><button class="btn" id="back">← Sab events</button><div class="grow"></div></div>
 <div class="card"><div class="ev" style="cursor:default">${dateBox(e.date)}<div class="grow"><h2 style="margin:0">${esc(e.name)}</h2><div class="muted">${TYPES[e.type]||''}${e.venue?' · '+esc(e.venue):''} · ${e.start?clock(toMin(e.start)):''}${e.end?' - '+clock(toMin(e.end)):''}</div></div></div>
 <div class="stat" style="margin-top:12px"><div><b>${sm.count}</b><span>Songs</span></div><div><b>${fmtDur(sm.total)}</b><span>Total music</span></div><div><b>${sm.window?fmtDur(sm.window):'--'}</b><span>Event time</span></div><div><b>${sm.bpm||'--'}</b><span>Avg BPM</span></div></div>${fitAlert(sm)}</div>
 <div class="tabs">${subs.map(([k,l])=>`<button data-sub="${k}" class="${view.sub===k?'on':''}">${l}</button>`).join('')}</div><div id="sub"></div>`;
 $('#back').onclick=()=>{view.ev=null;render()};
 $$('[data-sub]').forEach(b=>b.onclick=()=>{view.sub=b.dataset.sub;view.edit=null;render()});
 ({songs:subSongs,timeline:subTimeline,gear:subGear,info:subInfo,share:subShare})[view.sub](e,$('#sub'));
}
function fitAlert(sm){
 if(!sm.window||!sm.count)return '';
 const d=sm.total-sm.window;
 if(d>60)return `<div class="alert warn">Setlist event se <b>${fmtDur(d)}</b> lamba hai. Kuch songs kam karo.</div>`;
 if(d<-600)return `<div class="alert warn">Abhi ${fmtDur(-d)} ka music baaki hai (event ${fmtDur(sm.window)} ka hai). Aur songs add karo.</div>`;
 return `<div class="alert ok">Setlist event time ke hisaab se sahi hai.</div>`;
}
function songForm(s){
 s=s||{phase:'Dance floor',title:'',artist:'',bpm:'',dur:240,key:'',note:''};
 return `<form id="songForm" class="grid">
 <div><label class="f">Song ka naam *</label><input name="title" required maxlength="100" value="${esc(s.title)}"></div>
 <div><label class="f">Artist</label><input name="artist" maxlength="80" value="${esc(s.artist)}"></div>
 <div><label class="f">Phase / Moment</label><input name="phase" list="phases" maxlength="40" value="${esc(s.phase)}"><datalist id="phases">${PHASES.map(p=>`<option>${p}</option>`).join('')}</datalist></div>
 <div><label class="f">Length (mm:ss ya minutes)</label><input name="dur" value="${mmss(s.dur)}" inputmode="text" placeholder="4:30"></div>
 <div><label class="f">BPM</label><input name="bpm" type="number" min="40" max="220" value="${s.bpm||''}"></div>
 <div><label class="f">Key (optional)</label><input name="key" maxlength="6" value="${esc(s.key)}" placeholder="8A"></div>
 <div style="grid-column:1/-1"><label class="f">Note (mic announcement, drop point...)</label><input name="note" maxlength="160" value="${esc(s.note)}"></div>
 <div class="row" style="grid-column:1/-1"><button class="btn pri">${view.edit?'Save karo':'Song add karo'}</button>${view.edit?'<button type="button" class="btn" id="cancelEdit">Cancel</button>':''}</div></form>`;
}
function subSongs(e,el){
 const edit=view.edit&&e.songs.find(x=>x.id===view.edit);
 let phase=null;
 el.innerHTML=`<div class="card"><h3>${edit?'Song edit':'Song add karo'}</h3>${songForm(edit)}</div>
 <div class="card"><h3>Setlist</h3>${e.songs.length?e.songs.map((s,i)=>{let h='';if(s.phase&&s.phase!==phase){phase=s.phase;h=`<div class="phase">${esc(phase)}</div>`}
  return h+`<div class="song"><div class="no">${i+1}</div><div><div class="t">${esc(s.title)}${s.artist?' <span class="muted" style="font-weight:500">- '+esc(s.artist)+'</span>':''}</div><div class="m">${mmss(s.dur)}${s.bpm?' · '+s.bpm+' BPM':''}${s.key?' · key '+esc(s.key):''}${s.note?' · '+esc(s.note):''}</div></div>
  <div class="acts"><button class="btn sm icon" data-up="${s.id}" aria-label="Upar" ${i?'':'disabled'}>↑</button><button class="btn sm icon" data-dn="${s.id}" aria-label="Neeche" ${i<e.songs.length-1?'':'disabled'}>↓</button><button class="btn sm" data-ed="${s.id}">Edit</button><button class="btn sm bad" data-rm="${s.id}">Hatao</button></div></div>`}).join(''):'<div class="empty">Koi song nahi. Upar se add karo.</div>'}
 ${e.songs.length?'<div class="row" style="margin-top:8px"><button class="btn sm bad" id="clearSongs">Poori list saaf karo</button></div>':''}</div>
 <div class="card"><div class="grid"><div><label class="f">Zaroor bajane wale gaane (Must play)</label><textarea id="must" rows="3" maxlength="800">${esc(e.must)}</textarea></div><div><label class="f">Bilkul nahi bajane (Do not play)</label><textarea id="avoid" rows="3" maxlength="800">${esc(e.avoid)}</textarea></div></div></div>`;
 $('#songForm').onsubmit=ev=>{ev.preventDefault();const f=new FormData(ev.target);
  const o={title:f.get('title').trim(),artist:f.get('artist').trim(),phase:f.get('phase').trim(),dur:Math.max(10,parseDur(f.get('dur'))),bpm:+f.get('bpm')||0,key:f.get('key').trim(),note:f.get('note').trim()};
  if(!o.title)return;
  if(edit)Object.assign(edit,o);else e.songs.push({id:uid(),...o});
  view.edit=null;save();render();toast(edit?'Save ho gaya':'Song add ho gaya')};
 if($('#cancelEdit'))$('#cancelEdit').onclick=()=>{view.edit=null;render()};
 const mv=(id,d)=>{const i=e.songs.findIndex(x=>x.id===id),j=i+d;if(j<0||j>=e.songs.length)return;[e.songs[i],e.songs[j]]=[e.songs[j],e.songs[i]];save();render()};
 $$('[data-up]',el).forEach(b=>b.onclick=()=>mv(b.dataset.up,-1));$$('[data-dn]',el).forEach(b=>b.onclick=()=>mv(b.dataset.dn,1));
 $$('[data-ed]',el).forEach(b=>b.onclick=()=>{view.edit=b.dataset.ed;render();scrollTo(0,$('#sub').offsetTop-80)});
 $$('[data-rm]',el).forEach(b=>b.onclick=()=>{e.songs=e.songs.filter(x=>x.id!==b.dataset.rm);save();render()});
 if($('#clearSongs'))$('#clearSongs').onclick=()=>{if(confirm('Poori setlist hata dein?')){e.songs=[];save();render()}};
 $('#must').onchange=x=>{e.must=x.target.value;save()};$('#avoid').onchange=x=>{e.avoid=x.target.value;save()};
}
function timeline(e){
 let t=toMin(e.start),rows=[];const base=t;
 e.songs.forEach(s=>{rows.push({s,from:t==null?null:t});if(t!=null)t+=s.dur/60;});
 return{rows,end:t,base};
}
function subTimeline(e,el){
 const tl=timeline(e);
 if(!e.songs.length)return el.innerHTML='<div class="card empty">Pehle setlist me songs add karo.</div>';
 if(tl.base==null)return el.innerHTML='<div class="card empty">Event info me start time daalo.</div>';
 const en=toMin(e.end);
 el.innerHTML=`<div class="card"><h3>Kaun sa gaana kab</h3><table><thead><tr><th>Time</th><th>Song</th><th>Phase</th></tr></thead><tbody>${tl.rows.map(r=>`<tr><td style="white-space:nowrap;font-weight:700;color:var(--accent2)">${clock(r.from)}</td><td>${esc(r.s.title)}<div class="muted" style="font-size:.78rem">${mmss(r.s.dur)}${r.s.note?' · '+esc(r.s.note):''}</div></td><td class="muted">${esc(r.s.phase)}</td></tr>`).join('')}</tbody></table>
 <p style="margin-top:12px"><b>Music khatam:</b> ${clock(tl.end)}${en!=null?` &nbsp;·&nbsp; <b>Event end:</b> ${clock(en)}`:''}</p>
 ${en!=null?(()=>{const gap=((en-tl.end+1440)%1440);const over=gap>720;return over?`<div class="alert warn">Music event end se ${fmtDur((tl.end-en)*60)} aage chala gaya.</div>`:`<div class="alert ${gap>10?'warn':'ok'}">${gap>10?fmtDur(gap*60)+' ka gap baaki hai - aur songs ya buffer add karo.':'Timing sahi baithi hai.'}</div>`})():''}</div>`;
}
function subGear(e,el){
 const p=e.gear.length?Math.round(doneCount(e)/e.gear.length*100):0;
 el.innerHTML=`<div class="card"><div class="row"><h3 style="margin:0">Equipment checklist</h3><span class="pill right ${p===100?'ok':''}">${doneCount(e)}/${e.gear.length}</span></div>
 <div class="bar" style="margin:10px 0"><i style="width:${p}%"></i></div>
 <form id="gearForm" class="row"><input class="grow" name="t" maxlength="80" placeholder="Naya item (e.g. Extra mic stand)" required><button class="btn pri">Add</button></form>
 ${e.gear.length?e.gear.map(g=>`<div class="chk ${g.done?'done':''}"><input type="checkbox" data-g="${g.id}" ${g.done?'checked':''} aria-label="${esc(g.t)}"><span class="l">${esc(g.t)}</span><button class="btn sm bad" data-rg="${g.id}" aria-label="Hatao">✕</button></div>`).join(''):'<div class="empty">Checklist khali hai.</div>'}
 <div class="row noprint" style="margin-top:10px"><button class="btn sm" id="addDefault">Default gear list daalo</button><button class="btn sm" id="resetChecks">Sab untick karo</button></div></div>`;
 $('#gearForm').onsubmit=x=>{x.preventDefault();const t=new FormData(x.target).get('t').trim();if(t){e.gear.push({id:uid(),t,done:false});save();render()}};
 $$('[data-g]',el).forEach(c=>c.onchange=()=>{e.gear.find(g=>g.id===c.dataset.g).done=c.checked;save();render()});
 $$('[data-rg]',el).forEach(b=>b.onclick=()=>{e.gear=e.gear.filter(g=>g.id!==b.dataset.rg);save();render()});
 $('#addDefault').onclick=()=>{const have=new Set(e.gear.map(g=>g.t));[...GEAR.common,...GEAR[e.type]].forEach(t=>{if(!have.has(t))e.gear.push({id:uid(),t,done:false})});save();render()};
 $('#resetChecks').onclick=()=>{e.gear.forEach(g=>g.done=false);save();render()};
}
function subInfo(e,el){
 el.innerHTML=`<div class="card"><form id="infoForm" class="grid">
 <div><label class="f">Naam</label><input name="name" required maxlength="80" value="${esc(e.name)}"></div>
 <div><label class="f">Type</label><select name="type">${Object.entries(TYPES).map(([k,v])=>`<option value="${k}" ${k===e.type?'selected':''}>${v}</option>`).join('')}</select></div>
 <div><label class="f">Date</label><input type="date" name="date" value="${esc(e.date)}"></div><div><label class="f">Venue</label><input name="venue" maxlength="100" value="${esc(e.venue)}"></div>
 <div><label class="f">Start</label><input type="time" name="start" value="${esc(e.start)}"></div><div><label class="f">End</label><input type="time" name="end" value="${esc(e.end)}"></div>
 <div style="grid-column:1/-1"><label class="f">Notes (contact, sound cheque time, special requests)</label><textarea name="notes" rows="4" maxlength="1500">${esc(e.notes)}</textarea></div>
 <div class="row" style="grid-column:1/-1"><button class="btn pri">Save</button><button type="button" class="btn" id="dup">Event copy karo</button><button type="button" class="btn bad right" id="del">Event delete</button></div></form></div>`;
 $('#infoForm').onsubmit=x=>{x.preventDefault();const f=new FormData(x.target);['name','type','date','venue','start','end','notes'].forEach(k=>e[k]=(f.get(k)||'').trim());save();render();toast('Save ho gaya')};
 $('#dup').onclick=()=>{const c=JSON.parse(JSON.stringify(e));c.id=uid();c.name+=' (copy)';c.songs.forEach(s=>s.id=uid());c.gear.forEach(g=>{g.id=uid();g.done=false});S.events.push(c);save();view.ev=c.id;render();toast('Copy ban gayi')};
 $('#del').onclick=()=>{if(confirm('"'+e.name+'" hamesha ke liye delete karein?')){S.events=S.events.filter(x=>x.id!==e.id);save();view.ev=null;render()}};
}
function planText(e){
 const tl=timeline(e),L=[];
 L.push(e.name.toUpperCase());L.push([TYPES[e.type],e.date,e.venue].filter(Boolean).join(' | '));
 if(e.start)L.push('Time: '+clock(toMin(e.start))+(e.end?' - '+clock(toMin(e.end)):''));
 L.push('');L.push('SETLIST');
 tl.rows.forEach((r,i)=>L.push(`${i+1}. ${tl.base!=null?clock(r.from)+'  ':''}${r.s.title}${r.s.artist?' - '+r.s.artist:''} (${mmss(r.s.dur)}${r.s.bpm?', '+r.s.bpm+' BPM':''})${r.s.note?' [' +r.s.note+']':''}`));
 if(e.must)L.push('','MUST PLAY: '+e.must.replace(/\n/g,'; '));if(e.avoid)L.push('DO NOT PLAY: '+e.avoid.replace(/\n/g,'; '));
 if(e.gear.length){L.push('','GEAR');e.gear.forEach(g=>L.push((g.done?'[x] ':'[ ] ')+g.t))}
 if(e.notes)L.push('','NOTES: '+e.notes);
 return L.join('\n');
}
function subShare(e,el){
 el.innerHTML=`<div class="card"><h3>Share / Print</h3><div class="row"><button class="btn pri" id="pr">Print / PDF save</button><button class="btn" id="cp">Text copy</button><button class="btn" id="wa">WhatsApp pe bhejo</button><button class="btn" id="tx">.txt download</button></div></div>
 <div class="card"><pre id="pv" style="white-space:pre-wrap;margin:0;font-family:inherit">${esc(planText(e))}</pre></div>`;
 $('#pr').onclick=()=>print();$('#cp').onclick=()=>copyText(planText(e));
 $('#tx').onclick=()=>download((e.name.replace(/[^\w]+/g,'-')||'setlist')+'.txt',planText(e));
 $('#wa').onclick=()=>window.open('https://wa.me/?text='+encodeURIComponent(planText(e)),'_blank','noopener');
}
function backupHTML(){return `<div class="tabs"><button data-go="events">Mere Events</button><button class="on">Backup</button></div>
<div class="card"><h2>Backup &amp; restore</h2><p class="muted">Data sirf is browser me hai. Phone badalne ya browser data clear karne se pehle backup lo.</p>
<div class="row"><button class="btn pri" id="exp">Backup download (.json)</button><label class="btn" style="display:inline-block">Backup restore<input type="file" id="imp" accept=".json,application/json" class="hide"></label></div></div>`}
function bindBackup(){
 $$('[data-go]').forEach(b=>b.onclick=()=>{view.tab=b.dataset.go;render()});
 $('#exp').onclick=()=>download('dj-planner-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(S),'application/json');
 $('#imp').onchange=async x=>{const f=x.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!d||!Array.isArray(d.events))throw 0;
  d.events=d.events.map(e=>({id:String(e.id||uid()),name:String(e.name||'Event').slice(0,80),type:TYPES[e.type]?e.type:'other',date:String(e.date||''),venue:String(e.venue||''),start:String(e.start||''),end:String(e.end||''),notes:String(e.notes||''),must:String(e.must||''),avoid:String(e.avoid||''),
   songs:(Array.isArray(e.songs)?e.songs:[]).map(s=>({id:String(s.id||uid()),title:String(s.title||''),artist:String(s.artist||''),phase:String(s.phase||''),dur:+s.dur||240,bpm:+s.bpm||0,key:String(s.key||''),note:String(s.note||'')})),
   gear:(Array.isArray(e.gear)?e.gear:[]).map(g=>({id:String(g.id||uid()),t:String(g.t||''),done:!!g.done}))}));
  if(!confirm(d.events.length+' event(s) mile. Abhi ka data replace karein?'))return;S=d;save();view.tab='events';render();toast('Restore ho gaya')}catch(_){toast('Ye valid backup file nahi hai')}};
}
render();
