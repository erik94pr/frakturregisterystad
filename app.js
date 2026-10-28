import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const $ = id => document.getElementById(id);
const months = ['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'];
const now = new Date();
let year = now.getFullYear(), month = now.getMonth(), name = localStorage.getItem('frakturkalender-name') || '';
let uid = '', db = null, detach = null, entries = [], annualEntries = [], selectedDate = '', demo = !firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId;
const iso = (y,m,d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const currentMonth = () => `${year}-${String(month+1).padStart(2,'0')}`;
const formatDate = value => { const [y,m,d] = value.split('-').map(Number); return `${d} ${months[m-1]} ${y}`; };
const html = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function showModal(id) { $(id).hidden = false; }
function hideModal(id) { $(id).hidden = true; }
function setStatus(text, kind='') { $('connection').textContent = text; $('connection').className = `status ${kind}`; }
function demoRead() { try {return JSON.parse(localStorage.getItem('frakturkalender-demo') || '[]');} catch {return [];} }
function loadMonth() {
  if(detach) {detach();detach=null;}
  if(demo){annualEntries=demoRead().filter(e=>e.month?.startsWith(`${year}-`));entries=annualEntries.filter(e=>e.month===currentMonth());render();return;}
  if(!db)return;
  setStatus('Synkroniserar …');
  // One live listener for the selected year: month view and annual statistics stay in sync.
  detach=onSnapshot(query(collection(db,'registrations'),where('month','>=',`${year}-01`),where('month','<=',`${year}-12`)), snapshot=>{
    annualEntries=snapshot.docs.map(d=>({id:d.id,...d.data()}));
    entries=annualEntries.filter(e=>e.month===currentMonth());render();setStatus('Synkroniserad','online');
  }, err=>{setStatus('Kunde inte läsa databasen','status-error');console.error(err);});
}
function renderAnnual() {
  const daysInYear=new Date(year,1,29).getMonth()===1?366:365;
  const countByDay=new Map();
  for(const e of annualEntries) if(e.count>0)countByDay.set(e.date,(countByDay.get(e.date)||0)+e.count);
  const registered=[...countByDay.values()].filter(n=>n>0).length;
  $('annual-heading').textContent=`Årsöversikt ${year}`;
  $('annual-percent').textContent=`${(100*registered/daysInYear).toLocaleString('sv-SE',{maximumFractionDigits:1})} %`;
  $('annual-days').textContent=`${registered} / ${daysInYear}`;
  $('annual-fractures').textContent=annualEntries.reduce((s,e)=>s+(e.count||0),0).toLocaleString('sv-SE');
}
function exportYear() {
  $('export-error').textContent='';
  if(!window.XLSX){$('export-error').textContent='Excel-biblioteket kunde inte laddas. Kontrollera internetanslutningen och försök igen.';return;}
  const today=new Date();
  const rows=[['Datum','Veckodag','Månad','Registrerat datum','Antal frakturer','Antal registrerare','Registrerare']];
  const perDay=new Map();
  for(const e of annualEntries){if(e.count<=0)continue;if(!perDay.has(e.date))perDay.set(e.date,[]);perDay.get(e.date).push(e);}
  const monthly=[];
  for(let m=0;m<12;m++){
    const length=new Date(year,m+1,0).getDate();let active=0,fractures=0;
    for(let d=1;d<=length;d++){
      const date=iso(year,m,d), items=perDay.get(date)||[], count=items.reduce((s,e)=>s+e.count,0);
      if(count>0)active++;
      fractures+=count;
      const jsDate=new Date(year,m,d);
      rows.push([date,['söndag','måndag','tisdag','onsdag','torsdag','fredag','lördag'][jsDate.getDay()],months[m],count>0?'Ja':'Nej',count,items.length,items.map(e=>e.name).sort((a,b)=>a.localeCompare(b,'sv')).join(', ')]);
    }
    monthly.push([months[m],active,length,active/length,fractures]);
  }
  const days=new Date(year,1,29).getMonth()===1?366:365;
  const activeDays=monthly.reduce((sum,row)=>sum+row[1],0);
  const total=monthly.reduce((sum,row)=>sum+row[4],0);
  const book=XLSX.utils.book_new();
  const daily=XLSX.utils.aoa_to_sheet(rows);
  daily['!cols']=[{wch:15},{wch:14},{wch:16},{wch:20},{wch:19},{wch:20},{wch:40}];
  XLSX.utils.book_append_sheet(book,daily,'Alla datum');
  const summary=XLSX.utils.aoa_to_sheet([['Månad','Registrerade datum','Totalt datum','Täckningsgrad','Frakturer'],...monthly,['HELA ÅRET',activeDays,days,activeDays/days,total]]);
  for(let r=2;r<=14;r++){const cell=summary[`D${r}`];if(cell)cell.z='0.0%';}
  summary['!cols']=[{wch:18},{wch:22},{wch:18},{wch:20},{wch:16}];
  XLSX.utils.book_append_sheet(book,summary,'Årsöversikt');
  const detailed=XLSX.utils.aoa_to_sheet([['Datum','Namn','Antal frakturer'],...annualEntries.filter(e=>e.count>0).sort((a,b)=>a.date.localeCompare(b.date)).map(e=>[e.date,e.name,e.count])]);
  detailed['!cols']=[{wch:16},{wch:35},{wch:20}];
  XLSX.utils.book_append_sheet(book,detailed,'Per registrerare');
  XLSX.writeFile(book,`Frakturkalender_${year}.xlsx`);
}
$('export-year').addEventListener('click',exportYear);
function render() {
  renderAnnual();
  $('month-heading').textContent=`${months[month][0].toUpperCase()+months[month].slice(1)} ${year}`;
  $('month-select').value=String(month);$('year-select').value=String(year);
  const sums=new Map();
  for(const entry of entries)sums.set(entry.date,(sums.get(entry.date)||0)+entry.count);
  $('total-count').textContent=entries.reduce((s,e)=>s+e.count,0).toLocaleString('sv-SE');
  $('days-count').textContent=[...sums.values()].filter(n=>n>0).length;
  $('mine-count').textContent=entries.filter(e=>e.uid===uid).reduce((s,e)=>s+e.count,0).toLocaleString('sv-SE');
  const grid=$('calendar');grid.replaceChildren();
  const offset=(new Date(year,month,1).getDay()+6)%7;
  const days=new Date(year,month+1,0).getDate();
  for(let i=0;i<offset;i++){const blank=document.createElement('div');blank.className='day-blank';grid.append(blank);}
  for(let d=1;d<=days;d++){
    const date=iso(year,month,d), count=sums.get(date)||0;
    const button=document.createElement('button');button.type='button';button.className=`day${count?' has-data':''}${date===iso(now.getFullYear(),now.getMonth(),now.getDate())?' today':''}`;
    button.setAttribute('aria-label',`${formatDate(date)}, ${count} registrerade frakturer`);
    button.innerHTML=`<span class="day-number">${d}</span>${count?`<span class="count-pill">${count} st</span><span class="mini-label">Registrerat</span>`:''}`;
    button.addEventListener('click',()=>openDay(date));grid.append(button);
  }
  if(selectedDate && selectedDate.startsWith(currentMonth()))renderDayDetails();
}
function openDay(date){selectedDate=date;$('day-title').textContent=formatDate(date);$('save-error').textContent='';renderDayDetails();showModal('day-modal');}
function renderDayDetails(){
  const list=entries.filter(e=>e.date===selectedDate).sort((a,b)=>a.name.localeCompare(b.name,'sv'));
  const mine=list.find(e=>e.uid===uid);
  $('count-input').value=mine?.count ?? 0;
  $('day-total').textContent=`${list.reduce((s,e)=>s+e.count,0)} st`;
  $('day-entries').innerHTML=list.length?list.map(e=>`<div class="entry"><span>${html(e.name)}${e.uid===uid?' (du)':''}</span><b>${e.count} st</b></div>`).join(''):'<div class="empty-entry">Inga registreringar ännu.</div>';
}
function navigate(delta){month+=delta;if(month<0){month=11;year--;}if(month>11){month=0;year++;}ensureYear();loadMonth();}
function ensureYear(){if(!$('year-select').querySelector(`option[value="${year}"]`)){const opt=document.createElement('option');opt.value=year;opt.textContent=year;$('year-select').append(opt);}}
months.forEach((m,i)=>{const opt=document.createElement('option');opt.value=i;opt.textContent=m[0].toUpperCase()+m.slice(1);$('month-select').append(opt);});
for(let y=2020;y<=Math.max(2035,year+5);y++){const opt=document.createElement('option');opt.value=y;opt.textContent=y;$('year-select').append(opt);}
$('previous').addEventListener('click',()=>navigate(-1));$('next').addEventListener('click',()=>navigate(1));
$('month-select').addEventListener('change',e=>{month=Number(e.target.value);entries=annualEntries.filter(x=>x.month===currentMonth());render();});
$('year-select').addEventListener('change',e=>{year=Number(e.target.value);loadMonth();});
$('today').addEventListener('click',()=>{year=now.getFullYear();month=now.getMonth();loadMonth();});
$('change-name').addEventListener('click',()=>{$('name-input').value=name;showModal('name-modal');$('name-input').focus();});
$('name-form').addEventListener('submit',e=>{e.preventDefault();const value=$('name-input').value.trim();if(!value)return;name=value;localStorage.setItem('frakturkalender-name',name);$('active-name').textContent=name;hideModal('name-modal');});
$('close-day').addEventListener('click',()=>hideModal('day-modal'));
$('minus').addEventListener('click',()=>{$('count-input').value=Math.max(0,Number($('count-input').value||0)-1);});
$('plus').addEventListener('click',()=>{$('count-input').value=Math.min(9999,Number($('count-input').value||0)+1);});
$('day-form').addEventListener('submit',async e=>{
  e.preventDefault();const count=Number($('count-input').value);
  if(!Number.isInteger(count)||count<0||count>9999){$('save-error').textContent='Ange ett heltal mellan 0 och 9999.';return;}
  if(!name){hideModal('day-modal');showModal('name-modal');return;}
  const id=`${uid}_${selectedDate}`, record={uid,name,date:selectedDate,month:selectedDate.slice(0,7),count};
  $('save-button').disabled=true;$('save-error').textContent='';
  try{
    if(demo){let all=demoRead().filter(e=>e.id!==id);if(count)all.push({id,...record});localStorage.setItem('frakturkalender-demo',JSON.stringify(all));loadMonth();}
    else{if(!db||!uid)throw new Error('Anslutningen är inte klar.');if(count)await setDoc(doc(db,'registrations',id),record);else await deleteDoc(doc(db,'registrations',id));}
    hideModal('day-modal');
  }catch(err){$('save-error').textContent=`Kunde inte spara: ${err.message}`;}
  finally{$('save-button').disabled=false;}
});
for(const id of ['day-modal','name-modal'])$(id).addEventListener('click',e=>{if(e.target===$(id)&&id==='day-modal')hideModal(id);});
if(name)$('active-name').textContent=name;else{showModal('name-modal');setTimeout(()=>$('name-input').focus(),0);}
if(demo){uid=localStorage.getItem('frakturkalender-demo-uid')||crypto.randomUUID();localStorage.setItem('frakturkalender-demo-uid',uid);setStatus('Demoläge · endast denna webbläsare','demo');loadMonth();}
else{
  try{
    const app=initializeApp(firebaseConfig),auth=getAuth(app);db=getFirestore(app);
    onAuthStateChanged(auth,async user=>{if(!user){try{await signInAnonymously(auth);}catch(err){setStatus('Inloggning misslyckades','status-error');console.error(err);}return;}uid=user.uid;loadMonth();});
  }catch(err){setStatus('Felaktig Firebase-konfiguration','status-error');console.error(err);}
}
