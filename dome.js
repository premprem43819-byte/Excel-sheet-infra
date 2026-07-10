'use strict';
const DRAFT_KEY='ssi_lg_sawdamman_bw_v1';
const MIN_ROWS=12;
const tbody=document.getElementById('tbody');
const grandTotalEl=document.getElementById('grandTotal');
const qtyTotalEl=document.getElementById('qtyTotal');
const amountWordsEl=document.getElementById('amountWords');
const statusDot=document.getElementById('statusDot');
const statusTxt=document.getElementById('statusTxt');
const printArea=document.getElementById('printArea');

/* UTILS */
function debounce(fn,ms){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);};}
function money(v){return'₹\u00a0'+(+v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});}
function qtyText(v){return (+v||0).toLocaleString('en-IN',{maximumFractionDigits:2});}
function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function todayStr(){const d=new Date();return`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;}
function currentDayName(){return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];}
function currentMonthName(){return ['January','February','March','April','May','June','July','August','September','October','November','December'][new Date().getMonth()];}
function daysInMonth(year,monthIndex){return new Date(year,monthIndex+1,0).getDate();}
function monthWeekNumber(d){
  /* Every month is treated as ONLY 4 weeks.
     The month is divided into 4 parts based on its total days, so it never shows Week 5. */
  const totalDays=daysInMonth(d.getFullYear(),d.getMonth());
  const week=Math.ceil((d.getDate()*4)/totalDays);
  return Math.min(4,Math.max(1,week));
}
function weekStartDay(year,monthIndex,weekNo){
  const totalDays=daysInMonth(year,monthIndex);
  return Math.floor(((weekNo-1)*totalDays)/4)+1;
}
function currentWeekLabel(){return weekLabelFromDate(new Date());}
function dateToDMY(d){return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;}
function parseDMYDate(s){const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s||'').trim());if(!m)return new Date();const d=new Date(+m[3],+m[2]-1,+m[1]);if(Number.isNaN(d.getTime()))return new Date();return d;}
function dayNameFromDate(d){return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];}
function monthNameFromDate(d){return ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()];}
function weekLabelFromDate(d){return 'Week '+monthWeekNumber(d);}
function syncPeriodFromDocDate(saveNow=false){const doc=document.getElementById('docDate');const d=parseDMYDate(doc?doc.value:'');const day=dayNameFromDate(d), week=weekLabelFromDate(d), month=monthNameFromDate(d);const dayEl=document.getElementById('dayField'), weekEl=document.getElementById('weekField'), monthEl=document.getElementById('monthField');if(dayEl)dayEl.value=day;if(weekEl)weekEl.value=week;if(monthEl)monthEl.value=month;const dt=document.getElementById('dayText'), wt=document.getElementById('weekText'), mt=document.getElementById('monthText');if(dt)dt.textContent='Day: '+day;if(wt)wt.textContent='Week: '+week;if(mt)mt.textContent='Month: '+month;if(saveNow)saveDraft();}
function setDocDateObject(d){document.getElementById('docDate').value=dateToDMY(d);syncPeriodFromDocDate(true);}
function moveReceiptDate(days=0,months=0){const d=parseDMYDate(document.getElementById('docDate').value||todayStr());if(months){const keepWeek=monthWeekNumber(d);d.setMonth(d.getMonth()+months,1);d.setDate(weekStartDay(d.getFullYear(),d.getMonth(),keepWeek));}if(days)d.setDate(d.getDate()+days);setDocDateObject(d);}
function moveReceiptWeek(step){
  const d=parseDMYDate(document.getElementById('docDate').value||todayStr());
  let week=monthWeekNumber(d)+step;
  if(week<1){d.setMonth(d.getMonth()-1,1);week=4;}
  if(week>4){d.setMonth(d.getMonth()+1,1);week=1;}
  d.setDate(weekStartDay(d.getFullYear(),d.getMonth(),week));
  setDocDateObject(d);
}
function applyDefaultPeriodFields(force=false){syncPeriodFromDocDate(false);}

function formatDateValue(v){
  const digits=String(v||'').replace(/\D/g,'').slice(0,8);
  if(digits.length<=2)return digits;
  if(digits.length<=4)return digits.slice(0,2)+'/'+digits.slice(2);
  return digits.slice(0,2)+'/'+digits.slice(2,4)+'/'+digits.slice(4);
}
function placeDateCaret(input,digitsBefore){
  let pos=input.value.length, seen=0;
  for(let i=0;i<input.value.length;i++){
    if(/\d/.test(input.value[i]))seen++;
    if(seen>=digitsBefore){pos=i+1;break;}
  }
  try{input.setSelectionRange(pos,pos);}catch(e){}
}
function autoSlashDate(input){
  const before=input.value;
  const start=input.selectionStart||before.length;
  const digitsBefore=before.slice(0,start).replace(/\D/g,'').length;
  input.value=formatDateValue(before);
  placeDateCaret(input,digitsBefore);
}
function fixDateOnBlur(input){
  const digits=String(input.value||'').replace(/\D/g,'');
  if(!digits){input.value='';return;}
  input.value=formatDateValue(digits);
}

const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent);
const isAndroid=()=>/Android/.test(navigator.userAgent);
const isMobile=()=>isIOS()||isAndroid();

/* STATUS */
function setStatus(msg,cls=''){statusTxt.textContent=msg;statusDot.className='status-dot'+(cls?' '+cls:'');}

/* TOAST */
let _tt;
function showToast(msg,cls=''){
  const el=document.getElementById('toast');
  el.textContent=msg;el.className='show'+(cls?' '+cls:'');
  clearTimeout(_tt);_tt=setTimeout(()=>el.className='',2800);
}

/* ROWS */
function makeRow(d={}){
  const tr=document.createElement('tr');
  tr.innerHTML=`
    <td class="sn">1</td>
    <td><input type="text"   class="rdate"  placeholder="DD/MM/YYYY" value="${esc(formatDateValue(d.date||''))}" inputmode="numeric" maxlength="10" autocomplete="off"></td>
    <td><input type="text"   class="rmat"   placeholder="Material…"   value="${esc(d.material||'')}"></td>
    <td><input type="number" class="rqty"   min="0" step="0.01" placeholder="0"    value="${esc(d.qty||'')}"   inputmode="decimal"></td>
    <td><input type="number" class="rprice" min="0" step="0.01" placeholder="0.00" value="${esc(d.price||'')}" inputmode="decimal"></td>
    <td class="rtotal empty">—</td>
    <td class="rdel"><button class="dbtn" type="button">×</button></td>`;
  return tr;
}
function addRow(d={}){const r=makeRow(d);tbody.appendChild(r);renumber();bindRow(r);}
function renumber(){[...tbody.rows].forEach((r,i)=>r.querySelector('.sn').textContent=i+1);}

/* TOTALS */
function updateTotals(){
  let grand=0, qtyGrand=0;
  [...tbody.rows].forEach(row=>{
    const q=parseFloat(row.querySelector('.rqty').value)||0;
    const p=parseFloat(row.querySelector('.rprice').value)||0;
    qtyGrand+=q;
    const t=q*p;const cel=row.querySelector('.rtotal');
    if(t>0){cel.textContent=money(t);cel.className='rtotal';grand+=t;}
    else{cel.textContent='—';cel.className='rtotal empty';}
  });
  if(qtyTotalEl) qtyTotalEl.textContent=qtyText(qtyGrand);
  grandTotalEl.textContent=money(grand);
  if(amountWordsEl) amountWordsEl.textContent='';
}

/* ROW EVENTS */
function bindRow(row){
  row.querySelectorAll('input').forEach(inp=>{
    inp.addEventListener('input',()=>{
      if(inp.classList.contains('rdate'))autoSlashDate(inp);
      debouncedRefresh();
    });
    if(inp.classList.contains('rdate'))inp.addEventListener('blur',()=>{fixDateOnBlur(inp);debouncedSave();});
    inp.addEventListener('keydown',e=>{
      if(e.key!=='Enter')return;e.preventDefault();
      const all=[...document.querySelectorAll('#receiptTable input')];
      const i=all.indexOf(inp);if(i<all.length-1)all[i+1].focus();
    });
  });
  row.querySelector('.dbtn').addEventListener('click',()=>{
    if(tbody.rows.length===1)row.querySelectorAll('input').forEach(i=>i.value='');
    else row.remove();
    renumber();updateTotals();debouncedSave();
  });
}
const debouncedRefresh=debounce(()=>{updateTotals();debouncedSave();},180);

/* DATA */
function readInfo(){syncPeriodFromDocDate(false);const o={};document.querySelectorAll('[data-key]').forEach(el=>o[el.dataset.key]=el.value);return o;}
function writeInfo(d={}){document.querySelectorAll('[data-key]').forEach(el=>{if(d[el.dataset.key]!==undefined)el.value=el.id==='docDate'?formatDateValue(d[el.dataset.key]):d[el.dataset.key];});}
function readRows(all=true){return[...tbody.rows].map(r=>({date:r.querySelector('.rdate').value.trim(),material:r.querySelector('.rmat').value.trim(),qty:r.querySelector('.rqty').value.trim(),price:r.querySelector('.rprice').value.trim()})).filter(r=>all||r.date||r.material||r.qty||r.price);}

/* DRAFT */
function saveDraft(){
  try{
    setStatus('Saving…','saving');
    localStorage.setItem(DRAFT_KEY,JSON.stringify({info:readInfo(),rows:readRows(true),ts:Date.now()}));
    setStatus('Saved '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),'saved');
  }catch(e){setStatus('Save failed');}
}
const debouncedSave=debounce(saveDraft,450);

function loadDraft(){
  try{
    const raw=localStorage.getItem(DRAFT_KEY);if(!raw)return false;
    const d=JSON.parse(raw);
    if(d.info)writeInfo(d.info);
    tbody.innerHTML='';
    if(Array.isArray(d.rows)&&d.rows.length)d.rows.forEach(r=>addRow(r));
    while(tbody.rows.length<MIN_ROWS)addRow();
    updateTotals();setStatus('Draft restored','saved');return true;
  }catch{return false;}
}

/* ADD ROW */
document.getElementById('addRowBtn').addEventListener('click',()=>{
  addRow();saveDraft();
  if(isMobile())setTimeout(()=>tbody.lastElementChild?.scrollIntoView({behavior:'smooth',block:'center'}),80);
});

/* CLEAR */
document.getElementById('clearBtn').addEventListener('click',()=>{
  if(!confirm('Clear all data?'))return;
  localStorage.removeItem(DRAFT_KEY);
  writeInfo({from:'',to:'',docDate:todayStr(),day:currentDayName(),week:currentWeekLabel(),month:currentMonthName(),
    place1:'Kendaigoundanur',place2:'Sullerumbu',place3:'Dindigul, Tamilnadu 624710',
    cell1:'7904689983',cell2:'6369477188'});
  tbody.innerHTML='';
  for(let i=0;i<MIN_ROWS;i++)addRow();
  updateTotals();saveDraft();showToast('✅ Cleared!','ok');
});



/* IMAGE OCR AUTO FILL - Tamil + English + Normal Image + Separate Preview Table */
let pendingOcrRows=[];

function loadScriptOnce(src,key,globalName){
  return new Promise((resolve,reject)=>{
    if(globalName && window[globalName]){resolve();return;}
    const existing=document.querySelector(`script[data-lib="${key}"]`);
    if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}
    const s=document.createElement('script');
    s.src=src;s.async=true;s.defer=true;s.dataset.lib=key;
    s.onload=resolve;s.onerror=()=>reject(new Error(key+' library load failed'));
    document.head.appendChild(s);
  });
}
function loadExternalScript(src){return loadScriptOnce(src,'tesseract','Tesseract');}
function normalDateFromAny(s){
  s=String(s||'').trim();
  let m=s.match(/(\d{4})[\/\-. ]+(\d{1,2})[\/\-. ]+(\d{1,2})/);
  if(m)return `${String(m[3]).padStart(2,'0')}/${String(m[2]).padStart(2,'0')}/${m[1]}`;
  m=s.match(/(\d{1,2})[\/\-. ]+(\d{1,2})[\/\-. ]+(\d{2,4})/);
  if(m){let y=m[3].length===2?'20'+m[3]:m[3];return `${String(m[1]).padStart(2,'0')}/${String(m[2]).padStart(2,'0')}/${y}`;}
  m=s.match(/\b(\d{2})(\d{2})(\d{4})\b/);
  if(m)return `${m[1]}/${m[2]}/${m[3]}`;
  return '';
}
function findDateInLine(line){
  const patterns=[
    /(\d{4}[\/\-. ]+\d{1,2}[\/\-. ]+\d{1,2})/,
    /(\d{1,2}[\/\-. ]+\d{1,2}[\/\-. ]+\d{2,4})/,
    /\b(\d{2}\d{2}\d{4})\b/
  ];
  for(const re of patterns){const m=line.match(re);if(m)return{raw:m[1],date:normalDateFromAny(m[1]),index:m.index,length:m[1].length};}
  return null;
}
function hasTamilOrEnglish(s){return /[A-Za-z\u0B80-\u0BFF]/.test(String(s||''));}
function cleanOcrLine(line){
  return String(line||'')
    .replace(/[|]/g,' ')
    .replace(/[₹,]/g,' ')
    .replace(/[–—]/g,'-')
    .replace(/[“”]/g,'"')
    .replace(/[‘’]/g,"'")
    .replace(/\bRs\.?\b/ig,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function cleanMaterialName(s){
  return String(s||'')
    .replace(/\b(no|date|material|qty|price|total|rs|grand)\b/ig,' ')
    .replace(/^[\s:;\-]+|[\s:;\-]+$/g,'')
    .replace(/\s{2,}/g,' ')
    .trim();
}
function cleanNumber(s){
  s=String(s||'').replace(/[^0-9.]/g,'');
  const first=s.indexOf('.');
  if(first>=0)s=s.slice(0,first+1)+s.slice(first+1).replace(/\./g,'');
  return s;
}
function parseOneOcrLine(line, defaultDate=''){
  line=cleanOcrLine(line);
  if(!line)return null;
  const low=line.toLowerCase();
  if(/grand\s*total|amount\s*in\s*words|prepared\s*by|authorised|authorized|thank|business|sawdamman|sawdaman|sawdammal/.test(low))return null;
  if(/^(no\s+)?date\s+material|material\s+qty|qty\s+price|cell\s*no|from\s*:|to\s*:|place\s*:|voucher|vehicle|driver|receipt$/.test(low))return null;

  const dm=findDateInLine(line);
  let date=dm?dm.date:defaultDate;
  let tail=dm?line.slice(dm.index+dm.length).trim():line;
  // remove row number only after date is safely separated
  tail=tail.replace(/^\s*\d{1,3}\s+/, '');
  tail=tail.replace(/\b(total|price|qty|date|material|no|amount|rs)\b/ig,' ');
  tail=tail.replace(/\s+/g,' ').trim();

  const nums=[...tail.matchAll(/\b\d+(?:\.\d+)?\b/g)].map(m=>({raw:m[0],index:m.index,value:cleanNumber(m[0])})).filter(n=>n.value);
  if(nums.length<2)return null;

  // Bill tables normally end as: Material | Qty | Price | Total.
  // Use the last three numeric values when possible. This keeps material values like "1/2 ஜல்லி" safely inside material.
  let qtyM, priceM, totalM=null;
  if(nums.length>=3){qtyM=nums[nums.length-3];priceM=nums[nums.length-2];totalM=nums[nums.length-1];}
  else{qtyM=nums[nums.length-2];priceM=nums[nums.length-1];}
  let material=cleanMaterialName(tail.slice(0,qtyM.index));
  material=material.replace(/^\d{1,3}\s+/,'').trim();
  if(!material || !hasTamilOrEnglish(material))return null;
  return {date,material,qty:qtyM.value,price:priceM.value,total:totalM?totalM.value:''};
}
function linesFromTesseractResult(result){
  const out=[];const data=result&&result.data?result.data:{};
  if(Array.isArray(data.lines)&&data.lines.length){data.lines.forEach(l=>{if(l&&l.text)out.push(cleanOcrLine(l.text));});}
  if(!out.length && data.text){data.text.split(/\n+/).map(cleanOcrLine).filter(Boolean).forEach(l=>out.push(l));}
  return out;
}
function median(nums){
  nums=nums.filter(n=>Number.isFinite(n)).sort((a,b)=>a-b);
  if(!nums.length)return 16;
  const m=Math.floor(nums.length/2);return nums.length%2?nums[m]:(nums[m-1]+nums[m])/2;
}
function normalizedWords(result){
  return (result?.data?.words||[])
    .filter(w=>w&&w.text&&cleanOcrLine(w.text))
    .map(w=>({text:cleanOcrLine(w.text),x0:w.bbox?.x0??0,x1:w.bbox?.x1??0,y0:w.bbox?.y0??0,y1:w.bbox?.y1??0}))
    .filter(w=>w.text && w.y1>=w.y0 && w.x1>=w.x0);
}
function rowsFromWords(result, defaultDate=''){
  const words=normalizedWords(result);
  if(!words.length)return [];
  const h=median(words.map(w=>w.y1-w.y0));
  const threshold=Math.max(16,h*1.15);
  words.sort((a,b)=>((a.y0+a.y1)/2)-((b.y0+b.y1)/2));
  const groups=[];
  for(const w of words){
    const cy=(w.y0+w.y1)/2;
    let g=groups.find(g=>Math.abs(g.cy-cy)<=threshold);
    if(!g){g={cy,words:[]};groups.push(g);}
    g.words.push(w);g.cy=(g.cy*(g.words.length-1)+cy)/g.words.length;
  }
  const parsed=[];
  for(const g of groups){
    g.words.sort((a,b)=>a.x0-b.x0);
    const line=g.words.map(w=>w.text).join(' ');
    const row=parseOneOcrLine(line, defaultDate);
    if(row)parsed.push(row);
  }
  return parsed;
}
function rowsFromDateAnchors(result, defaultDate=''){
  const words=normalizedWords(result);
  if(!words.length)return [];
  const h=median(words.map(w=>w.y1-w.y0));
  const rowTol=Math.max(18,h*1.35);
  const dateWords=words.filter(w=>findDateInLine(w.text));
  const parsed=[];
  for(const dw of dateWords){
    const cy=(dw.y0+dw.y1)/2;
    const near=words.filter(w=>Math.abs(((w.y0+w.y1)/2)-cy)<=rowTol).sort((a,b)=>a.x0-b.x0);
    const line=near.map(w=>w.text).join(' ');
    const row=parseOneOcrLine(line, defaultDate);
    if(row)parsed.push(row);
  }
  return parsed;
}
function rowsFromTextColumns(rawText, defaultDate=''){
  const text=String(rawText||'');
  const clean=text.split(/\n+/).map(cleanOcrLine).filter(Boolean);
  const lines=[];
  for(let i=0;i<clean.length;i++){
    let l=clean[i];
    if(findDateInLine(l) && i+1<clean.length && !parseOneOcrLine(l,defaultDate)){
      l=[clean[i],clean[i+1],clean[i+2]||'',clean[i+3]||''].join(' ');
    }
    lines.push(l);
  }
  return lines.map(l=>parseOneOcrLine(l,defaultDate)).filter(Boolean);
}
function uniqueRows(rows){
  const seen=new Set(), out=[];
  for(const r of rows){
    const key=[r.date,r.material,r.qty,r.price].join('|').toLowerCase();
    if(seen.has(key))continue;
    seen.add(key);out.push(r);
  }
  return out;
}
function rowScore(rows){
  return rows.reduce((s,r)=>s+1+(r.date?1:0)+(r.material?1:0)+(r.qty?1:0)+(r.price?1:0),0);
}

function wordCenterX(w){return ((w.x0||0)+(w.x1||0))/2;}
function wordCenterY(w){return ((w.y0||0)+(w.y1||0))/2;}
function groupWordsByLine(words){
  const h=median(words.map(w=>w.y1-w.y0));
  const threshold=Math.max(14,h*1.05);
  const groups=[];
  words.slice().sort((a,b)=>wordCenterY(a)-wordCenterY(b)).forEach(w=>{
    const cy=wordCenterY(w);
    let g=groups.find(g=>Math.abs(g.cy-cy)<=threshold);
    if(!g){g={cy,words:[]};groups.push(g);}
    g.words.push(w);g.cy=(g.cy*(g.words.length-1)+cy)/g.words.length;
  });
  groups.forEach(g=>g.words.sort((a,b)=>a.x0-b.x0));
  return groups.sort((a,b)=>a.cy-b.cy);
}
function firstNumFromText(s){
  const m=String(s||'').replace(/,/g,' ').match(/\b\d+(?:\.\d+)?\b/);
  return m?cleanNumber(m[0]):'';
}
function rowsFromHeaderColumns(result, defaultDate=''){
  const words=normalizedWords(result);
  if(words.length<4)return [];
  const lines=groupWordsByLine(words);
  let header=null;
  for(const g of lines){
    const t=g.words.map(w=>w.text).join(' ').toLowerCase();
    const score=(/date|தேதி/.test(t)?1:0)+(/material|பொருள்|item/.test(t)?1:0)+(/qty|quantity|அளவு/.test(t)?1:0)+(/price|rate|விலை/.test(t)?1:0)+(/total|தொகை/.test(t)?1:0);
    if(score>=3){header=g;break;}
  }
  if(!header)return [];
  const hx={};
  for(const w of header.words){
    const t=w.text.toLowerCase();
    const cx=wordCenterX(w);
    if(/date|தேதி/.test(t))hx.date=cx;
    else if(/material|பொருள்|item/.test(t))hx.material=cx;
    else if(/qty|quantity|அளவு/.test(t))hx.qty=cx;
    else if(/price|rate|விலை/.test(t))hx.price=cx;
    else if(/total|தொகை/.test(t))hx.total=cx;
  }
  const allX=words.map(wordCenterX).filter(Number.isFinite);
  const minX=Math.min(...allX), maxX=Math.max(...allX), width=Math.max(1,maxX-minX);
  hx.date ??= minX+width*0.20; hx.material ??= minX+width*0.45; hx.qty ??= minX+width*0.68; hx.price ??= minX+width*0.80; hx.total ??= minX+width*0.92;
  const cols=[['date',hx.date],['material',hx.material],['qty',hx.qty],['price',hx.price],['total',hx.total]].sort((a,b)=>a[1]-b[1]);
  const bounds=[];
  for(let i=0;i<cols.length-1;i++)bounds.push((cols[i][1]+cols[i+1][1])/2);
  function colNameForX(x){
    let idx=0; while(idx<bounds.length && x>bounds[idx])idx++;
    return cols[idx][0];
  }
  const parsed=[];
  for(const g of lines){
    if(g.cy<=header.cy+8)continue;
    const lineText=g.words.map(w=>w.text).join(' ');
    if(/grand|prepared|checked|author/i.test(lineText))continue;
    const bucket={date:[],material:[],qty:[],price:[],total:[],all:g.words};
    for(const w of g.words){
      // Ignore serial number on far left before date column.
      if(wordCenterX(w)<Math.min(hx.date,hx.material)-35 && /^\d{1,3}$/.test(w.text))continue;
      bucket[colNameForX(wordCenterX(w))].push(w.text);
    }
    let date=normalDateFromAny(bucket.date.join(' '))||normalDateFromAny(lineText)||defaultDate;
    let material=cleanMaterialName(bucket.material.join(' '));
    let qty=firstNumFromText(bucket.qty.join(' '));
    let price=firstNumFromText(bucket.price.join(' '));
    // Fallback when OCR assigns numbers wrongly: use last numeric values from full row.
    const nums=[...lineText.matchAll(/\b\d+(?:\.\d+)?\b/g)].map(m=>cleanNumber(m[0])).filter(Boolean);
    if((!qty||!price) && nums.length>=2){
      if(nums.length>=3){qty=qty||nums[nums.length-3];price=price||nums[nums.length-2];}
      else{qty=qty||nums[nums.length-2];price=price||nums[nums.length-1];}
    }
    if(!material){
      const wordsBeforeQty=g.words.filter(w=>wordCenterX(w)>hx.date && wordCenterX(w)<hx.qty).map(w=>w.text).join(' ');
      material=cleanMaterialName(wordsBeforeQty.replace(/\b\d{1,2}[\/\-. ]+\d{1,2}[\/\-. ]+\d{2,4}\b/g,'').replace(/^\d{1,3}\s+/,''));
    }
    if(material && hasTamilOrEnglish(material) && (qty||price)) parsed.push({date,material,qty,price,total:firstNumFromText(bucket.total.join(' '))});
  }
  return parsed;
}
function parseTesseractResultToRows(result){
  const rawText=result?.data?.text||'';
  const docDate=readInfo().docDate||'';
  const dateFromText=normalDateFromAny(rawText)||docDate;
  const fromHeaderColumns=rowsFromHeaderColumns(result,dateFromText);
  const fromWordRows=rowsFromWords(result,dateFromText);
  const fromAnchorRows=rowsFromDateAnchors(result,dateFromText);
  const fromLineRows=linesFromTesseractResult(result).map(l=>parseOneOcrLine(l,dateFromText)).filter(Boolean);
  const fromTextRows=rowsFromTextColumns(rawText,dateFromText);
  return uniqueRows([...fromHeaderColumns,...fromAnchorRows,...fromWordRows,...fromLineRows,...fromTextRows]);
}
function loadImageElement(file){
  return new Promise((resolve,reject)=>{
    const img=new Image();const u=URL.createObjectURL(file);
    img.onload=()=>{URL.revokeObjectURL(u);resolve(img);};
    img.onerror=()=>{URL.revokeObjectURL(u);reject(new Error('Image load failed'));};
    img.src=u;
  });
}
function processedImageDataFromImage(img,rotation=0){
  const maxSide=isMobile()?2200:2600;
  const iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height;
  const scale=Math.min(1,maxSide/Math.max(iw,ih));
  const sw=Math.round(iw*scale), sh=Math.round(ih*scale);
  const rot=((+rotation||0)%360+360)%360;
  const canvas=document.createElement('canvas');
  canvas.width=(rot===90||rot===270)?sh:sw;
  canvas.height=(rot===90||rot===270)?sw:sh;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.save();
  if(rot===90){ctx.translate(canvas.width,0);ctx.rotate(Math.PI/2);}
  else if(rot===180){ctx.translate(canvas.width,canvas.height);ctx.rotate(Math.PI);}
  else if(rot===270){ctx.translate(0,canvas.height);ctx.rotate(-Math.PI/2);}
  ctx.drawImage(img,0,0,sw,sh);
  ctx.restore();
  const data=ctx.getImageData(0,0,canvas.width,canvas.height);const p=data.data;
  for(let i=0;i<p.length;i+=4){
    let g=0.299*p[i]+0.587*p[i+1]+0.114*p[i+2];
    g=((g-128)*1.65)+128;
    g=Math.max(0,Math.min(255,g));
    if(g>225)g=255;
    if(g<55)g=0;
    p[i]=p[i+1]=p[i+2]=g;p[i+3]=255;
  }
  ctx.putImageData(data,0,0);
  return canvas.toDataURL('image/png');
}
async function recognizeBestRotation(file,lang,opts){
  const img=await loadImageElement(file);
  // Image removed as requested. OCR now reads the image in the same direction you upload.
  const rot=0;
  setStatus('OCR reading image…','saving');
  const imgData=processedImageDataFromImage(img,rot);
  const result=await Tesseract.recognize(imgData,lang,opts);
  const rows=parseTesseractResultToRows(result);
  return {rows,result,text:result?.data?.text||'',rotation:rot,score:rowScore(rows)};
}
function calcPreviewTotal(row){
  const q=parseFloat(cleanNumber(row.qty))||0,p=parseFloat(cleanNumber(row.price))||0;
  return q*p>0?money(q*p):(row.total?money(parseFloat(cleanNumber(row.total))||0):'—');
}
function showOcrPreview(rows,rawText='',lang='eng+tam',rotation=''){
  pendingOcrRows=rows.map(r=>({...r}));
  const box=document.getElementById('ocrPreviewBox');
  const body=document.getElementById('ocrPreviewBody');
  const info=document.getElementById('ocrPreviewInfo');
  body.innerHTML=pendingOcrRows.map((r,i)=>`<tr>
    <td style="text-align:center;font-weight:900;color:#fff;">${i+1}</td>
    <td><input class="pdate" data-i="${i}" value="${esc(formatDateValue(r.date||''))}" inputmode="numeric" maxlength="10"></td>
    <td><input class="pmat" data-i="${i}" value="${esc(r.material||'')}"></td>
    <td><input class="pqty" data-i="${i}" value="${esc(r.qty||'')}" inputmode="decimal"></td>
    <td><input class="pprice" data-i="${i}" value="${esc(r.price||'')}" inputmode="decimal"></td>
    <td class="ocr-total-cell">${calcPreviewTotal(r)}</td>
  </tr>`).join('');
  const langText=lang==='tam'?'Tamil only':(lang==='eng'?'English only':'Tamil + English');
  const rotText=rotation!==''?` • Rotation: ${rotation}°`:'';
  info.textContent=`${rows.length} row${rows.length>1?'s':''} found • Language: ${langText}${rotText}`;
  box.classList.add('show');
  body.querySelectorAll('input').forEach(inp=>{
    inp.addEventListener('input',()=>{
      const i=+inp.dataset.i;
      if(inp.classList.contains('pdate')){autoSlashDate(inp);pendingOcrRows[i].date=inp.value;}
      if(inp.classList.contains('pmat'))pendingOcrRows[i].material=inp.value;
      if(inp.classList.contains('pqty'))pendingOcrRows[i].qty=cleanNumber(inp.value);
      if(inp.classList.contains('pprice'))pendingOcrRows[i].price=cleanNumber(inp.value);
      inp.closest('tr').querySelector('.ocr-total-cell').textContent=calcPreviewTotal(pendingOcrRows[i]);
    });
  });
  setTimeout(()=>box.scrollIntoView({behavior:'smooth',block:'start'}),150);
}
function readPreviewRows(){
  return [...document.querySelectorAll('#ocrPreviewBody tr')].map(tr=>({
    date:tr.querySelector('.pdate').value.trim(),
    material:tr.querySelector('.pmat').value.trim(),
    qty:cleanNumber(tr.querySelector('.pqty').value.trim()),
    price:cleanNumber(tr.querySelector('.pprice').value.trim())
  })).filter(r=>r.date||r.material||r.qty||r.price);
}
function rowHasData(row){return [...row.querySelectorAll('input')].some(i=>i.value.trim());}
function fillRowsFromImage(rows){
  let start=[...tbody.rows].findIndex(r=>!rowHasData(r));
  if(start<0)start=tbody.rows.length;
  rows.forEach((data,i)=>{
    while(tbody.rows.length<=start+i)addRow();
    const row=tbody.rows[start+i];
    row.querySelector('.rdate').value=formatDateValue(data.date||'');
    row.querySelector('.rmat').value=data.material||'';
    row.querySelector('.rqty').value=cleanNumber(data.qty||'');
    row.querySelector('.rprice').value=cleanNumber(data.price||'');
  });
  updateTotals();saveDraft();
  showToast(`✅ ${rows.length} row${rows.length>1?'s':''} added to receipt table`,'ok');
}
async function runImageOCR(file){
  if(!file)return;
  try{
    setStatus('Loading OCR…','saving');showToast('📷 Reading image. Keep the table straight and clear.');
    await loadExternalScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
    const lang=document.getElementById('ocrLangSelect')?.value||'eng+tam';
    const opts={logger:m=>{if(m.status){const p=m.progress?Math.round(m.progress*100):0;setStatus(`OCR ${p}%`,'saving');}}};
    let best;
    try{best=await recognizeBestRotation(file,lang,opts);}catch(e){
      console.warn('Selected language failed. Fallback to English.',e);
      best=await recognizeBestRotation(file,'eng',opts);
    }
    if(!best.rows.length){console.log('OCR text:',best.text);showToast('No rows found. Take photo straight and crop only the table area.','err');setStatus('OCR not found');return;}
    fillRowsFromImage(best.rows);
    showOcrPreview(best.rows,best.text,lang,best.rotation);
    setStatus('Image added to table','saved');
    showToast('✅ Image scanned and added directly to correct rows/columns. Preview is also shown below.','ok');
  }catch(err){console.error(err);showToast('Image reading failed. Use clear photo and internet for Tamil/English OCR.','err');setStatus('OCR failed');}
  finally{document.getElementById('imageInput').value='';}
}
document.getElementById('imageBtn').addEventListener('click',()=>document.getElementById('imageInput').click());
document.getElementById('imageInput').addEventListener('change',e=>runImageOCR(e.target.files&&e.target.files[0]));
document.getElementById('ocrApplyBtn').addEventListener('click',()=>{
  const rows=readPreviewRows();
  if(!rows.length){showToast('No preview rows to add','err');return;}
  fillRowsFromImage(rows);
});
document.getElementById('ocrClearBtn').addEventListener('click',()=>{
  pendingOcrRows=[];document.getElementById('ocrPreviewBody').innerHTML='';document.getElementById('ocrPreviewBox').classList.remove('show');
});

/* LIVE SAVE */
document.addEventListener('input',e=>{if(e.target.id==='docDate'){autoSlashDate(e.target);syncPeriodFromDocDate(false);}if(e.target.dataset.key)debouncedSave();});
document.getElementById('docDate').addEventListener('blur',e=>{fixDateOnBlur(e.target);syncPeriodFromDocDate(true);debouncedSave();});
['prevDayBtn','todayDateBtn','nextDayBtn','prevWeekBtn','nextWeekBtn','prevMonthBtn','nextMonthBtn'].forEach(id=>{
  const el=document.getElementById(id);
  if(!el)return;
  el.addEventListener('click',()=>{
    if(id==='prevDayBtn')moveReceiptDate(-1,0);
    if(id==='todayDateBtn')setDocDateObject(new Date());
    if(id==='nextDayBtn')moveReceiptDate(1,0);
    if(id==='prevWeekBtn')moveReceiptWeek(-1);
    if(id==='nextWeekBtn')moveReceiptWeek(1);
    if(id==='prevMonthBtn')moveReceiptDate(0,-1);
    if(id==='nextMonthBtn')moveReceiptDate(0,1);
    showToast('Date updated: '+document.getElementById('docDate').value,'ok');
  });
});

/* BUILD PRINT HTML - corrected: no label wrapping, no date wrapping, fuller A4 */
const PRINT_CSS=`
@page{size:A4 portrait;margin:4mm;}
:root{color-scheme:light only!important;}
html,body{
  margin:0!important;padding:0!important;background:#fff!important;color:#000!important;
  -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;
}
*{box-sizing:border-box!important;color:#000!important;box-shadow:none!important;text-shadow:none!important;}
body{
  font-family:"Noto Sans Tamil","Nirmala UI",Latha,Arial,Helvetica,sans-serif;
  font-size:21px;line-height:1.22;background:#fff!important;
}
.pp{
  width:202mm;height:289mm;min-height:289mm;margin:0 auto;border:1.2px solid #000!important;
  background:#fff!important;overflow:hidden;display:flex;flex-direction:column;
}
.pp,.pp *{background:#fff!important;color:#000!important;}
.pp-title{border-bottom:1.2px solid #000!important;text-align:center;padding:8px 4px;background:#fff!important;flex:0 0 auto;}
.pp-title h1{margin:0;font-size:48px;font-style:italic;font-weight:900;line-height:1.05;color:#000!important;}
.sub{font-size:19px;letter-spacing:1.2px;text-transform:uppercase;margin-top:2px;color:#000!important;font-weight:800;}
table{width:100%;border-collapse:collapse;table-layout:fixed;background:#fff!important;}
td,th{
  border:.85px solid #000!important;padding:4px 5px;font-size:20px;color:#000!important;
  vertical-align:middle;overflow:hidden;word-break:break-word;background:#fff!important;
}
th,.pp-lbl{font-weight:900;text-align:center;background:#fff!important;color:#000!important;}
.pp-empty{background:#fff!important;width:52px;}
.pp-mat{text-align:center;font-weight:900;letter-spacing:.8px;background:#fff!important;}
.pp-meta{flex:0 0 auto;}
.pp-meta{table-layout:fixed!important;}
.pp-meta td{height:9mm;background:#fff!important;font-size:16px!important;white-space:nowrap!important;word-break:normal!important;line-height:1.05!important;padding:2px 4px!important;}
.pp-meta .pp-lbl{font-size:16px!important;font-weight:900!important;}
.pp-meta .date-val{font-size:18px!important;font-weight:700!important;}
.pp-meta .pp-meta-small{font-size:16px!important;}
.pp-info{flex:0 0 auto;}
.pp-info td{height:10mm;background:#fff!important;font-size:18px!important;line-height:1.08!important;}
.pp-info .pp-lbl{width:20mm!important;white-space:nowrap!important;word-break:normal!important;font-size:18px!important;padding:2px 3px!important;}
.pp-items{flex:0 0 auto;height:auto;}
.pp-items th{height:10mm;background:#fff!important;font-size:20px!important;white-space:nowrap!important;word-break:normal!important;}
.pp-items td{height:var(--item-row-h,12mm)!important;background:#fff!important;font-size:20px!important;}
.pp-items td:nth-child(2){white-space:nowrap!important;word-break:normal!important;font-size:18px!important;line-height:1.05!important;}
.pp-items td:nth-child(3){font-size:20px!important;font-weight:500!important;}
.pp-items td:nth-child(1),.pp-items td:nth-child(2),.pp-items td:nth-child(4),.pp-items td:nth-child(5),.pp-items td:nth-child(6){text-align:center;}
.pp-items td:nth-child(6){text-align:right;font-weight:700;}
.pp-gl{text-align:center!important;font-size:24px!important;font-weight:900;padding-right:0!important;}
.pp-gt{text-align:center!important;font-size:24px!important;font-weight:900;}
.words-line{font-size:15px!important;font-style:normal!important;font-weight:700!important;line-height:1.35!important;padding:7px 9px!important;}
.pp-sign{width:100%;border-collapse:collapse;table-layout:fixed;flex:0 0 auto;margin-top:auto;}
.pp-sign td{height:24mm;vertical-align:top;text-align:center;font-size:20px!important;padding-top:6px!important;font-weight:800;background:#fff!important;}
thead{display:table-header-group;}tfoot{display:table-footer-group;}tr{page-break-inside:avoid;break-inside:avoid;}
@media screen{
  body{padding:10px!important;background:#eee!important;}
  .screen-note{max-width:202mm;margin:0 auto 8px auto;padding:10px 12px;border:1px solid #000;background:#fff!important;color:#000!important;font-family:Arial,sans-serif;font-size:20px;font-weight:800;border-radius:6px;}
  .pp{box-shadow:0 2px 12px rgba(0,0,0,.15)!important;}
}
@media print{.screen-note{display:none!important;}}
@media print{
  html,body{background:#fff!important;color:#000!important;}
  body{padding:0!important;}
  .pp{box-shadow:none!important;margin:0!important;width:202mm!important;height:289mm!important;min-height:289mm!important;}
  .pp,.pp *{background:#fff!important;color:#000!important;border-color:#000!important;}
}
`;

function buildPrintBody(){
  const info=readInfo();
  // Print/PDF only the rows where you typed something. No empty placeholder rows.
  let rows=readRows(false);
  if(!rows.length) rows=[{date:'',material:'',qty:'',price:''}];
  const rowCount=Math.max(rows.length,1);
  // Keep signature visible. Rows are big, but never so tall that they push signatures out.
  const itemRowH=Math.max(9.5,Math.min(15,130/rowCount)).toFixed(1);
  const rowsHTML=rows.map((r,i)=>{
    const t=(parseFloat(r.qty)||0)*(parseFloat(r.price)||0);
    const has=r.date||r.material||r.qty||r.price;
    return`<tr><td style="text-align:center;">${i+1}</td><td style="text-align:center;">${esc(r.date)}</td><td>${esc(r.material)}</td><td style="text-align:center;">${esc(r.qty)}</td><td style="text-align:center;">${esc(r.price)}</td><td style="text-align:right;font-weight:600;">${has&&t>0?money(t):''}</td></tr>`;
  }).join('');
  return`<div class="pp">
  <div class="pp-title"><h1>Sri Sawdamman Infra</h1><div class="sub">MATERIAL INPUT RECEIPT</div></div>
  <table class="pp-meta"><tr>
    <td class="pp-lbl" style="width:18%;">Date :</td><td class="date-val" style="width:82%;">${esc(info.docDate)}</td>
  </tr></table>
  <table class="pp-info">
    <tr><td class="pp-lbl" style="width:20mm;">From :</td><td>${esc(info.from)}</td><td rowspan="5" class="pp-empty"></td><td class="pp-lbl" style="width:20mm;">Place :</td><td>${esc(info.place1)}</td></tr>
    <tr><td></td><td></td><td></td><td>${esc(info.place2)}</td></tr>
    <tr><td class="pp-lbl">To :</td><td>${esc(info.to)}</td><td></td><td>${esc(info.place3)}</td></tr>
    <tr><td></td><td class="pp-mat">MATERIAL INPUT</td><td class="pp-lbl">Cell No :</td><td>${esc(info.cell1)}<br>${esc(info.cell2)}</td></tr>
    <tr><td></td><td class="pp-dwm">Day: ${esc(info.day)} &nbsp;&nbsp; Week: ${esc(info.week)} &nbsp;&nbsp; Month: ${esc(info.month)}</td><td></td><td></td></tr>
  </table>
  <table class="pp-items" style="--item-row-h:${itemRowH}mm">
    <thead><tr><th style="width:6%">NO</th><th style="width:17%">Date</th><th style="width:37%">Material</th><th style="width:9%">Qty</th><th style="width:13%">Price</th><th style="width:18%">Total (₹)</th></tr></thead>
    <tbody>${rowsHTML}</tbody>
    <tfoot>
      <tr><td colspan="3" class="pp-gl">Qty Total</td><td class="pp-gt">${esc(qtyTotalEl ? qtyTotalEl.textContent : '')}</td><td class="pp-gl">Grand Total</td><td class="pp-gt">${esc(grandTotalEl.textContent)}</td></tr>
    </tfoot>
  </table>
  <table class="pp-sign">
    <tr>
      <td>Prepared By<br><br><br>________________________</td>
      <td>Checked By<br><br><br>________________________</td>
      <td>Authorised Signatory<br><br><br>________________________</td>
    </tr>
  </table></div>`;
}


/* FULL A4 PRINT / DIRECT PDF DOWNLOAD */
function receiptFileName(ext='pdf'){
  const d=(readInfo().docDate||todayStr()).replace(/\D/g,'').slice(0,8)||new Date().toISOString().slice(0,10).replace(/-/g,'');
  return `Sri_Sawdamman_Infra_${d}.${ext}`;
}
function openA4Receipt(action='print'){
  updateTotals();
  const body=buildPrintBody();
  const note='<div class="screen-note">Print: Choose A4 → Portrait → Fit to page / 100%. Keep this page open until preview loads.</div>';
  const title='Print Receipt — Sri Sawdamman Infra';
  const htmlDoc=`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${title}</title><style>
/* ALL PRINTER VERSION: Sri Sawdamman Infra */${PRINT_CSS}</style></head><body>${note}${body}<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},1000);};<\/script></body></html>`;
  const win=window.open('','_blank','width=980,height=760');
  if(!win){
    printArea.innerHTML=body;
    showToast('Popup blocked. Using direct print…');
    setTimeout(()=>window.print(),300);
    return;
  }
  win.document.open();win.document.write(htmlDoc);win.document.close();
  showToast('🖨️ Opening print screen for all printers…');
}
async function createPDFBlob(){
  updateTotals();
  await loadScriptOnce('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js','html2canvas','html2canvas');
  await loadScriptOnce('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js','jspdf','jspdf');
  const stage=document.createElement('div');
  stage.style.cssText='position:fixed;left:-99999px;top:0;width:210mm;background:#fff;z-index:-1;pointer-events:none;';
  stage.innerHTML=`<style>${PRINT_CSS}</style>${buildPrintBody()}`;
  document.body.appendChild(stage);
  try{
    await new Promise(r=>setTimeout(r,300));
    const receipt=stage.querySelector('.pp');
    const canvas=await html2canvas(receipt,{scale:isMobile()?1.45:2,backgroundColor:'#ffffff',useCORS:true,logging:false,windowWidth:receipt.scrollWidth,windowHeight:receipt.scrollHeight});
    const img=canvas.toDataURL('image/jpeg',0.96);
    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
    pdf.addImage(img,'JPEG',4,4,202,289,undefined,'FAST');
    return pdf.output('blob');
  }finally{
    document.body.removeChild(stage);
  }
}
async function downloadPDFDirect(){
  const fname=receiptFileName('pdf');
  try{
    setStatus('PDF loading…','saving');
    showToast('📄 Creating PDF file…');
    const blob=await createPDFBlob();
    dlAnchorBlob(blob,fname);
    setStatus('PDF downloaded','saved');
    showToast('✅ PDF downloaded to mobile Downloads / browser download folder','ok');
  }catch(err){
    console.error(err);
    setStatus('PDF fallback');
    showToast('Direct PDF failed. Opening print screen: choose Save as PDF.','err');
    setTimeout(()=>openA4Receipt('print'),500);
  }
}

document.getElementById('printBtn').addEventListener('click',()=>openA4Receipt('print'));
document.getElementById('saveBtn').addEventListener('click',()=>downloadPDFDirect());

/* DIRECT BROWSER PRINT */
window.addEventListener('beforeprint',()=>{
  updateTotals();
  printArea.innerHTML=buildPrintBody();
});

/* OPTIONAL HTML BACKUP SAVE - used only if opened manually from console/older browser fallback */
function buildFullReceiptHTML(){
  const body=buildPrintBody();
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>Sri Sawdamman Infra Full A4 Receipt</title><style>
/* FINAL BIG LETTER VERSION: Sri Sawdamman Infra */${PRINT_CSS}</style></head><body>${body}</body></html>`;
}
function dlAnchorBlob(blob,fname){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=fname;a.rel='noopener';a.style.display='none';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),45000);
  setTimeout(()=>showToast('✅ Saved to Downloads!','ok'),700);
}
function showIOSModal(url,fname){
  const m=document.getElementById('saveModal');
  document.getElementById('modalText').textContent=fname;
  document.getElementById('modalSteps').innerHTML=
    ['Tap <b>Open Receipt</b> below','Tap the <b>Share ⬆</b> icon','Tap <b>Print</b> or <b>Save to Files</b>','Choose folder / PDF → tap <b>Save</b>']
    .map((s,i)=>`<div class="step"><span class="step-n">${i+1}</span><span>${s}</span></div>`).join('');
  m.classList.add('show');
  document.getElementById('modalOpenBtn').onclick=()=>{window.open(url,'_blank');m.classList.remove('show');};
  document.getElementById('modalCloseBtn').onclick=()=>{m.classList.remove('show');URL.revokeObjectURL(url);};
  m.onclick=e=>{if(e.target===m){m.classList.remove('show');URL.revokeObjectURL(url);}};
}

/* SHARE - shares PDF file on supported mobile browsers, otherwise shares/copies text */
function buildShareText(){
  updateTotals();
  const info=readInfo();const rows=readRows(false);
  const lines=[
    'Sri Sawdamman Infra','Material Input Receipt','━━━━━━━━━━━━━━━━━━━━',
    `From: ${info.from||'—'}`,`To: ${info.to||'—'}`,
    `Place: ${[info.place1,info.place2,info.place3].filter(Boolean).join(', ')}`,
    `Date: ${info.docDate||'—'}`,
    `Day: ${info.day||'—'} | Week: ${info.week||'—'} | Month: ${info.month||'—'}`,
    `Cell: ${[info.cell1,info.cell2].filter(Boolean).join(' / ')}`,
    '━━━━━━━━━━━━━━━━━━━━'
  ];
  rows.forEach((r,i)=>{const t=(parseFloat(r.qty)||0)*(parseFloat(r.price)||0);lines.push(`${i+1}. ${r.date||'-'} | ${r.material||'-'} | Qty:${r.qty||0} | Price:${r.price||0} | Total:${t>0?money(t):'-'}`);});
  lines.push('━━━━━━━━━━━━━━━━━━━━',`Qty Total: ${qtyTotalEl ? qtyTotalEl.textContent : '0'}`,`Grand Total: ${grandTotalEl.textContent}`);
  return lines.join('\n');
}
document.getElementById('shareBtn').addEventListener('click',async()=>{
  const text=buildShareText();
  const fname=receiptFileName('pdf');
  try{
    showToast('Preparing receipt for sharing…');
    let shared=false;
    if(navigator.canShare && navigator.share && window.File){
      try{
        const blob=await createPDFBlob();
        const file=new File([blob],fname,{type:'application/pdf'});
        if(navigator.canShare({files:[file]})){
          await navigator.share({title:'Sri Sawdamman Infra Receipt',text:'Sri Sawdamman Infra receipt PDF attached.',files:[file]});
          shared=true;
        }
      }catch(pdfErr){console.warn('PDF share fallback:',pdfErr);}
    }
    if(!shared && navigator.share){await navigator.share({title:'Sri Sawdamman Infra Receipt',text});shared=true;}
    if(!shared && navigator.clipboard){await navigator.clipboard.writeText(text);showToast('✅ Receipt text copied','ok');}
    else if(shared){showToast('✅ Shared successfully','ok');}
    else alert(text);
  }catch(e){
    if(e.name==='AbortError')return;
    try{await navigator.clipboard.writeText(text);showToast('✅ Receipt text copied','ok');}catch{alert(text);}
  }
});

/* KEYBOARD SHORTCUTS */
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='p'){e.preventDefault();document.getElementById('printBtn').click();}
  if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();document.getElementById('saveBtn').click();}
  if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){document.getElementById('addRowBtn').click();}
});

/* AMOUNT IN WORDS */
function toWords(n){
  if(!n)return'Zero';
  const ones=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function two(n){return n<20?ones[n]:tens[~~(n/10)]+(n%10?' '+ones[n%10]:'');}
  function three(n){let w='';if(n>=100){w+=ones[~~(n/100)]+' Hundred';n%=100;if(n)w+=' and ';}if(n)w+=two(n);return w;}
  let w='',cr=~~(n/1e7);n%=1e7;let la=~~(n/1e5);n%=1e5;let th=~~(n/1e3);n%=1e3;
  if(cr)w+=three(cr)+' Crore ';if(la)w+=three(la)+' Lakh ';if(th)w+=three(th)+' Thousand ';if(n)w+=three(n);
  return w.trim();
}

/* AUTO-SAVE */
setInterval(saveDraft,30000);
window.addEventListener('beforeunload',saveDraft);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveDraft();});

/* INIT */
(function init(){
  document.getElementById('docDate').value=todayStr();
  const loaded=loadDraft();
  applyDefaultPeriodFields();syncPeriodFromDocDate(false);
  if(!loaded){for(let i=0;i<MIN_ROWS;i++)addRow();updateTotals();saveDraft();}
  else{updateTotals();saveDraft();}
})();
