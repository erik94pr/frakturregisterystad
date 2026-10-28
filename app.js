import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const $ = id => document.getElementById(id);
const months = ['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'];
const now = new Date();
let year = now.getFullYear(), month = now.getMonth(), name = '';
let uid = '', db = null, auth = null, detach = null, detachProfile = null, detachAdmin = null, detachRole = null, entries = [], annualEntries = [], selectedDate = '', approved = false, administrator = false, currentUser = null, authMode = 'login';
const iso = (y,m,d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const currentMonth = () => `${year}-${String(month+1).padStart(2,'0')}`;
const formatDate = value => { const [y,m,d] = value.split('-').map(Number); return `${d} ${months[m-1]} ${y}`; };
const html = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function showModal(id) { $(id).hidden = false; }
function hideModal(id) { $(id).hidden = true; }
function setStatus(text, kind='') { $('connection').textContent = text; $('connection').className = `status ${kind}`; }

function loadMonth() {
  if(detach) {detach();detach=null;}
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
  const namesByDay=new Map();
  for(const entry of entries){
    sums.set(entry.date,(sums.get(entry.date)||0)+entry.count);
    if(entry.count>0){
      if(!namesByDay.has(entry.date))namesByDay.set(entry.date,new Set());
      namesByDay.get(entry.date).add(entry.name||'Okänd');
    }
  }
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
    const registrants=[...(namesByDay.get(date)||[])].sort((a,b)=>a.localeCompare(b,'sv'));
    button.setAttribute('aria-label',`${formatDate(date)}, ${count} registrerade frakturer${registrants.length?', registrerat av '+registrants.join(', '):''}`);
    button.innerHTML=`<span class="day-number">${d}</span>${count?`<span class="count-pill">${count} st</span><span class="day-names">${registrants.map(n=>`<span class="day-registrant">${html(n)}</span>`).join('')}</span>`:''}`;
    button.addEventListener('click',()=>openDay(date));grid.append(button);
  }
  if(selectedDate && selectedDate.startsWith(currentMonth()))renderDayDetails();
}
function openDay(date){selectedDate=date;$('day-title').textContent=formatDate(date);$('save-error').textContent='';renderDayDetails();const canWrite=!!currentUser&&(approved||administrator);$('read-only-message').hidden=canWrite;$('day-login').hidden=!!currentUser;$('day-form').hidden=!canWrite;showModal('day-modal');}
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
$('close-day').addEventListener('click',()=>hideModal('day-modal'));
$('minus').addEventListener('click',()=>{$('count-input').value=Math.max(0,Number($('count-input').value||0)-1);});
$('plus').addEventListener('click',()=>{$('count-input').value=Math.min(9999,Number($('count-input').value||0)+1);});
$('day-form').addEventListener('submit',async e=>{
  e.preventDefault();const count=Number($('count-input').value);
  if(!Number.isInteger(count)||count<0||count>9999){$('save-error').textContent='Ange ett heltal mellan 0 och 9999.';return;}
  if(!(approved||administrator)){$('save-error').textContent='Kontot måste vara godkänt.';return;}
  const id=`${uid}_${selectedDate}`, record={uid,name,date:selectedDate,month:selectedDate.slice(0,7),count};
  $('save-button').disabled=true;$('save-error').textContent='';
  try{
    if(!db||!uid)throw new Error('Anslutningen är inte klar.');if(!name)throw new Error('Din användarprofil har inte laddats. Uppdatera sidan och försök igen.');if(count)await setDoc(doc(db,'registrations',id),record);else await deleteDoc(doc(db,'registrations',id));
    hideModal('day-modal');
  }catch(err){$('save-error').textContent=err.code==='permission-denied'?'Sparning nekades av Firestore. Kontrollera att de senaste reglerna är publicerade och att kontot är godkänt.':`Kunde inte spara: ${err.message}`;console.error('Registration save failed',err);}
  finally{$('save-button').disabled=false;}
});
$('day-modal').addEventListener('click',e=>{if(e.target===$('day-modal'))hideModal('day-modal');});
// Administratorns behörighet kontrolleras i Firestore, inte med e-post eller användarnamn.
// Firebase Email/Password kräver ett e-postformat. Vanliga användare loggar in
// med användarnamn som översätts deterministiskt till en intern identifierare.
// Den separata återställningsadressen används endast för manuell kontakt.
const loginAddress = username => username.includes('@') ? username.toLowerCase() : `${username.trim().toLowerCase()}@users.frakturkalender.invalid`;
const isAdmin = () => administrator;
const authError = error => ({'auth/email-already-in-use':'Användarnamnet används redan.','auth/invalid-email':'Ogiltigt användarnamn.','auth/weak-password':'Använd ett längre lösenord.','auth/invalid-credential':'Fel användarnamn eller lösenord.','auth/too-many-requests':'För många försök. Försök igen senare.'}[error.code] || error.message);
function setAuthMode(mode){
  authMode=mode;
  $('auth-title').textContent=mode==='register'?'Skapa konto':'Logga in';
  $('auth-submit').textContent=mode==='register'?'Skapa konto':'Logga in';
  for(const id of ['auth-name','name-label','auth-recovery','recovery-label'])$(id).hidden=mode!=='register';
  $('auth-name').required=mode==='register';
  $('auth-password').autocomplete=mode==='register'?'new-password':'current-password';
  $('auth-toggle').textContent=mode==='register'?'Har du redan ett konto? Logga in':'Skapa konto';
  $('auth-error').textContent='';
}
function openLogin(){ setAuthMode('login'); showModal('auth-modal'); }
$('sign-in').addEventListener('click',openLogin);
$('account-login').addEventListener('click',openLogin);
$('day-login').addEventListener('click',()=>{hideModal('day-modal');openLogin();});
$('close-auth').addEventListener('click',()=>hideModal('auth-modal'));
$('auth-modal').addEventListener('click',e=>{if(e.target===$('auth-modal'))hideModal('auth-modal');});
$('auth-toggle').addEventListener('click',()=>setAuthMode(authMode==='login'?'register':'login'));
$('auth-form').addEventListener('submit',async event=>{
  event.preventDefault();$('auth-error').textContent='';$('auth-submit').disabled=true;
  const username=$('auth-email').value.trim().toLowerCase(),password=$('auth-password').value;
  try{
    if(authMode==='register'){
      if(!/^[a-z0-9._-]{3,30}$/.test(username))throw Error('Användarnamn måste vara 3–30 tecken: a–z, 0–9, punkt, understreck eller bindestreck.');
      const displayName=$('auth-name').value.trim();
      if(!displayName||displayName.length>60)throw Error('Ange ditt namn (högst 60 tecken).');
      const recoveryEmail=$('auth-recovery').value.trim().toLowerCase();
      if(recoveryEmail && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)||recoveryEmail.length>254))throw Error('Ange en giltig återställningsadress.');
      const credential=await createUserWithEmailAndPassword(auth,loginAddress(username),password);
      await setDoc(doc(db,'users',credential.user.uid),{email:credential.user.email,name:displayName,username,recoveryEmail,approved:false});
      $('account-message').textContent='Kontot har skapats och väntar på administratörens godkännande.';
    }else{
      if(!username.includes('@') && !/^[a-z0-9._-]{3,30}$/.test(username))throw Error('Ogiltigt användarnamn.');
      await signInWithEmailAndPassword(auth,loginAddress(username),password);
    }
    hideModal('auth-modal');
  }catch(error){$('auth-error').textContent=authError(error);}finally{$('auth-submit').disabled=false;}
});
$('auth-reset').addEventListener('click',()=>{
  $('auth-error').textContent='Kontakta administratören för återställning av lösenord. Den frivilliga mejladressen är en kontaktadress, inte en automatisk Firebase-återställning.';
});
$('sign-out').addEventListener('click',()=>signOut(auth));
function refreshAccount(){
  const u=currentUser;
  $('sign-out').hidden=!u;$('sign-in').hidden=!!u;$('account-login').hidden=!!u;$('active-name').textContent=u?(name||u.email):'Ej inloggad';

  $('request-email').hidden=true;
  if(!u){$('account-message').textContent='Kalendern är öppen för alla, utan inloggning. Logga in eller skapa ett konto endast om du vill registrera frakturer.';}
  else if(administrator){$('account-message').textContent='Administratör: här kan du godkänna och spärra användare.';hideModal('auth-modal');}
  else if(approved){$('account-message').textContent='Ditt konto är godkänt. Du kan registrera frakturer.';hideModal('auth-modal');}
  else{$('account-message').textContent='Kontot väntar på godkännande av administratören.';hideModal('auth-modal');}
  if(!$('day-modal').hidden && selectedDate)openDay(selectedDate);
  // Profile approval is separate from admin role. Admin can register after UID authorization.
  $('admin-panel').hidden=!administrator;
  if(administrator)startAdmin();else if(detachAdmin){detachAdmin();detachAdmin=null;}
}
function startAdmin(){if(detachAdmin)return;detachAdmin=onSnapshot(collection(db,'users'),snapshot=>{
 const users=snapshot.docs.map(d=>({uid:d.id,...d.data()})).sort((a,b)=>Number(a.approved)-Number(b.approved));
 const el=$('admin-users');el.replaceChildren();for(const user of users){const row=document.createElement('div');row.className='admin-row';const info=document.createElement('span');info.textContent=`${user.name} (@${user.username||user.email}; återställning: ${user.recoveryEmail||"ej angiven"}) – ${user.approved?'Godkänd':'Väntar'}`;const button=document.createElement('button');button.textContent=user.approved?'Spärra':'Godkänn';button.onclick=async()=>{button.disabled=true;try{await updateDoc(doc(db,'users',user.uid),{approved:!user.approved});}catch(e){$('admin-error').textContent=e.message;}finally{button.disabled=false;}};row.append(info,button);el.append(row);}
 },error=>{$('admin-error').textContent=error.message;});}
const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);
onAuthStateChanged(auth,user=>{
  if(detachProfile){detachProfile();detachProfile=null;}
  if(detachRole){detachRole();detachRole=null;}
  currentUser=user;uid=user?.uid||'';approved=false;administrator=false;name='';
  if(!user){refreshAccount();loadMonth();return;}
  detachRole=onSnapshot(doc(db,'administrators',uid), snap=>{administrator=snap.exists() && snap.data()?.active===true;refreshAccount();}, error=>{console.error('Admin role:',error);});
  detachProfile=onSnapshot(doc(db,'users',uid),snap=>{
    if(!snap.exists()){
      // Existing legacy admin account may predate user profiles. Create its own
      // restricted profile; this does NOT grant administrator privileges.
      const internalEmail=user.email||'';
      const username=internalEmail.split('@')[0];
      if(/^[a-z0-9._-]{3,30}$/.test(username) && internalEmail===`${username}@users.frakturkalender.invalid`){
        setDoc(doc(db,'users',uid),{email:internalEmail,name:username,username,recoveryEmail:'',approved:false}).catch(error=>{$('account-message').textContent='Kunde inte skapa användarprofil: '+error.message;});
      }
    }
    const data=snap.data();name=data?.name||'';approved=data?.approved===true;refreshAccount();
  },error=>{$('account-message').textContent='Kunde inte läsa användarkontot: '+error.message;});
  refreshAccount();loadMonth();
});
loadMonth();
