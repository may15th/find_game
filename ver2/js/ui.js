window.UI={
 originalImage(n){return 'ver2/assets/case02/characters/ParkJimin_'+String(n+1).padStart(2,'0')+'_'+CASE.expressions[n]+'.png'},
 image(n){return UI.originalImage(n).replace('/characters/','/characters/optimized/').replace('.png','.webp')},
 highlight(html){
  const plain=html.replace(/<\/?mark\b[^>]*>/g,'');
  const tokens=/(4월 18일|[\d,]+원|박지민|미래정보|나라장터|A-100[PL]|A-100 시리즈|RAM(?:과 보증기간|\s*(?:16|8)GB)?|(?:16|8)GB|보증기간|보증\s*[13]년|[13]년|제품 사양|모델 코드|동등 이상|우대가격 위반|계약규격 위반|위반 확인 안 됨)/g;
  return plain.split(/(<[^>]+>)/g).map(part=>part.startsWith('<')?part:part.replace(tokens,text=>{
   const type=/월.*일/.test(text)?'time':/원$/.test(text)?'price':/^(박지민|미래정보|나라장터)$/.test(text)?'entity':'rule';
   return `<mark class="info-${type}">${text}</mark>`;
  })).join('');
 },
 scene(line,label,controls){
  const active=line[0].startsWith('박지민');
  const changed=UI.lastActive!==undefined&&UI.lastActive!==active;
  UI.lastActive=active;
  return `<section class="case-heading"><small>조사 파일 · 박지민</small><h1>${CASE.title}</h1><p>같은 외형, 다른 조건. 증거로 진실을 구별하세요.</p></section><section class="scene ${active?'subject-speaking':'subject-listening'} ${changed?'focus-changing':''}"><div class="character portrait" role="img" data-expression="${line[2]}" aria-label="박지민"></div><div class="speaker"><b>박지민</b><span>미래정보 대표</span></div></section><section class="speech" aria-live="polite">${UI.speechContent(line,label)}</section><div class="dialog-controls">${controls}</div>`;
 },
 speechContent(line,label){return `<div class="speech-meta"><small>${label}</small><b class="current-speaker">${line[0]}</b></div><p>${UI.highlight(line[1])}</p><div class="color-legend" aria-label="정보 유형별 강조색"><span class="info-time">시간·날짜</span><span class="info-price">가격·수량</span><span class="info-entity">기업·인물</span><span class="info-rule">규정·조건</span></div>`},
 renderScene(main,line,label,controls){
  const scene=main.querySelector('.scene');
  if(!scene){main.innerHTML=UI.scene(line,label,controls);UI.portraits.mount(main.querySelector('.portrait'),line[2]);return}
  const active=line[0].startsWith('박지민');
  scene.classList.toggle('focus-changing',UI.lastActive!==active);
  scene.classList.toggle('subject-speaking',active);
  scene.classList.toggle('subject-listening',!active);
  UI.lastActive=active;
  main.querySelector('.speech').innerHTML=UI.speechContent(line,label);
  main.querySelector('.dialog-controls').innerHTML=controls;
  // No fetch, decode, DOM replacement, timer or animation frame on a ready turn.
  UI.portraits.show(line[2]);
 },
 document(id,selection){const d=CASE.docs.find(d=>d.id===id);const content=document.querySelector('#document-content');
  function paint(){content.innerHTML=`<small>${d.source}</small><h2 id="document-title">${d.title}</h2>${UI.highlight(d.body)}${d.facts&&selection?`<section class="collect-facts"><h3>주요 정보 기록</h3><p>정보를 눌러 조사 노트에 담으세요. 다시 누르면 해제됩니다.</p>${d.facts.map(f=>`<button type="button" class="fact-button ${selection.has(f.id)?'selected':''}" data-collect="${f.id}" aria-pressed="${selection.has(f.id)}"><span class="fact-state" aria-hidden="true">${selection.has(f.id)?'✓':'＋'}</span><span class="fact-text">${UI.highlight(f.text)}</span></button>`).join('')}<small id="collection-status" role="status">${d.facts.filter(f=>selection.has(f.id)).length}개 정보 기록됨</small></section>`:''}`;
   content.querySelectorAll('[data-collect]').forEach(b=>b.onclick=()=>{const id=b.dataset.collect;selection.has(id)?selection.delete(id):selection.add(id);if(UI.onCollectionChange)UI.onCollectionChange();paint();content.querySelector(`[data-collect="${id}"]`)?.focus();if(UI.notify)UI.notify(selection.has(id)?'조사 노트에 기록했습니다. 요건 검증에서 근거로 채택할 수 있습니다.':'기록을 해제했습니다. 이 정보의 근거 채택도 해제되었습니다.')});
  }paint();document.querySelector('#document').showModal();
 }
};

// Retain the decoded Image objects themselves, not just their URLs. Browsers may
// evict an HTTP cache entry; these mounted objects still need no new src request.
UI.portraits={
 entries:CASE.expressions.map(()=>({state:'idle',image:null,promise:null,error:null})),
 listeners:new Set(),settled:false,host:null,current:null,sequence:0,errors:[],
 status(){return {ready:this.entries.filter(e=>e.state==='ready').length,failed:this.entries.filter(e=>e.state==='failed').length,total:this.entries.length,settled:this.settled}},
 emit(){for(const listener of this.listeners)listener(this.status())},
 subscribe(listener){this.listeners.add(listener);listener(this.status());return ()=>this.listeners.delete(listener)},
 log(index,url,error){const detail={expression:index,path:url,message:String(error.message||error),time:new Date().toISOString()};this.errors.push(detail);console.warn('[FIND portrait]',detail)},
 loadDecoded(url,priority){return new Promise((resolve,reject)=>{
  const img=new Image();let finished=false;
  const timeout=setTimeout(()=>finish(new Error('Image load/decode timeout')),12000);
  const finish=error=>{if(finished)return;finished=true;clearTimeout(timeout);img.onload=null;img.onerror=null;error?reject(error):resolve(img)};
  img.decoding='async';img.fetchPriority=priority?'high':'low';
  img.onerror=()=>finish(new Error('Image request failed'));
  img.onload=async()=>{try{if(typeof img.decode==='function')await img.decode();if(!img.naturalWidth||!img.naturalHeight)throw new Error('Empty image');finish()}catch(error){finish(error)}};
  img.src=url;
 })},
 load(index){
  const entry=this.entries[index];if(entry.promise)return entry.promise;
  entry.state='loading';
  entry.promise=(async()=>{
   for(const url of [UI.image(index),UI.originalImage(index)]){
    try{const image=await this.loadDecoded(url,index===0);entry.image=image;entry.state='ready';entry.error=null;this.emit();return image}
    catch(error){entry.error=error;this.log(index,url,error)}
   }
   entry.state='failed';this.emit();return null;
  })();return entry.promise;
 },
 preload(){
  if(!this.preparing){this.settled=false;this.preparing=this.load(0).then(()=>Promise.all(this.entries.map((_,i)=>this.load(i)))).then(()=>{this.settled=true;this.emit();return this.status()})}
  return this.preparing;
 },
 retry(){for(const entry of this.entries)if(entry.state==='failed'){entry.state='idle';entry.promise=null}this.preparing=null;return this.preload()},
 mount(host,index){
  this.sequence++;this.host=host;this.current=null;
  for(const entry of this.entries)if(entry.image){
   const img=entry.image;img.className='expression-frame';img.alt='';img.setAttribute('aria-hidden','true');img.style.opacity='0';img.style.zIndex='0';host.appendChild(img);
  }
  this.show(index);
 },
 show(index){
  const ticket=++this.sequence;
  const commit=()=>{
   if(ticket!==this.sequence||!this.host||!this.host.isConnected)return;
   const entry=this.entries[index];
   if(entry.state!=='ready'){
    this.log(index,UI.image(index),new Error('Expression unavailable; retaining previous portrait'));
    if(this.current===null){const fallback=this.entries.findIndex(e=>e.state==='ready');if(fallback>=0)this.show(fallback)}
    return;
   }
   if(this.current===index)return;
   if(entry.image.parentNode!==this.host){entry.image.className='expression-frame';entry.image.alt='';entry.image.setAttribute('aria-hidden','true');entry.image.style.opacity='0';this.host.appendChild(entry.image)}
   // All previous images remain mounted through the 180ms crossfade. Rapid
   // clicks retarget opacity immediately; there are no stale completion timers.
   for(let i=0;i<this.entries.length;i++)if(this.entries[i].image){const img=this.entries[i].image;img.style.opacity=i===index?'1':'0';img.style.zIndex=i===index?'1':'0'}
   this.current=index;this.host.dataset.expression=String(index);
   this.host.setAttribute('aria-label','박지민 — '+['기본','설명','당혹','불안','억울','방어','압박','체념'][index]+' 표정');
  };
  if(this.entries[index].state==='loading')this.entries[index].promise.then(commit);else commit();
 }
};
