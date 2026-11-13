(() => {
 const main=document.querySelector('#main');
 let state;
 let introTimer=null;
 let refreshIntroAssets=null;
 UI.portraits.subscribe(()=>{if(refreshIntroAssets)refreshIntroAssets()});
 UI.portraits.preload();
 function reset(){clearInterval(introTimer);UI.lastActive=undefined;state={intro:true,tab:'story',line:0,read:new Set(),collected:new Set(),evidenceTab:'docs',answers:CASE.questions.map(()=>({answer:'',proof:[]})),verdict:'',ending:null,step:0,done:false,review:false};render()}
 function tabs(){document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===state.tab);b.setAttribute('aria-pressed',b.dataset.tab===state.tab);b.disabled=!!state.ending||state.intro});updateWorkflow()}
 function updateWorkflow(){const hints={story:'진술을 듣고, 확인할 쟁점을 찾으세요.',evidence:'서류에서 정보를 기록한 뒤 요건에 연결하세요.',verify:'기록한 정보를 각 요건의 근거로 채택하세요.'};document.querySelector('#workflow').innerHTML=state.intro?'':`<span>${state.ending?'판정 이후의 이야기를 확인하세요.':hints[state.tab]}</span><b>${state.ending?'종결 기록':state.tab==='story'?`진술 ${state.line+1} / ${CASE.story.length}`:`조사 노트 ${state.collected.size}개`}</b>`}
 function go(tab){if(state.intro)return;state.tab=tab;render();window.scrollTo(0,0)}
 function render(){document.querySelector('.app').classList.toggle('intro-mode',state.intro);tabs();if(state.intro){renderIntro();return}if(state.ending){renderEnding();return}if(state.tab==='story')renderStory();if(state.tab==='evidence')renderEvidence();if(state.tab==='verify')renderVerify()}
 function renderIntro(){
  const overview=CASE.intro;
  main.innerHTML=`<section class="intro-screen" aria-labelledby="intro-title"><small>FIND!! / 사건 접수</small><h1 id="intro-title">${CASE.title}</h1><p class="intro-copy" id="intro-copy" aria-hidden="true"></p><p class="sr-only">${overview}</p><p id="portrait-load-status" class="portrait-load-status" role="status"></p><button id="portrait-retry" hidden>표정 이미지 다시 준비하기</button><div class="intro-actions"><button id="intro-reveal">전체 내용 보기</button><button class="primary" id="intro-start" disabled>조사 시작 →</button></div></section>`;
  const copy=document.querySelector('#intro-copy'),start=document.querySelector('#intro-start'),reveal=document.querySelector('#intro-reveal');
  start.disabled=true;
  let textComplete=false;
  refreshIntroAssets=()=>{
   const progress=UI.portraits.status();
   document.querySelector('#portrait-load-status').textContent=progress.settled?(progress.failed?`표정 ${progress.ready} / ${progress.total} 준비 · 실패한 표정은 기존 이미지를 유지합니다.`:`표정 ${progress.total}종 준비 완료`):`표정 준비 중 · ${progress.ready} / ${progress.total}`;
   document.querySelector('#portrait-retry').hidden=!progress.settled||!progress.failed;
   start.disabled=!textComplete||!progress.settled||progress.ready===0;
  };
  document.querySelector('#portrait-retry').onclick=()=>{UI.portraits.retry();refreshIntroAssets()};
  refreshIntroAssets();
  const letters=Array.from(overview);let count=0;
  function complete(){clearInterval(introTimer);introTimer=null;copy.textContent=overview;textComplete=true;reveal.disabled=true;refreshIntroAssets()}
  reveal.onclick=complete;
  start.onclick=()=>{if(start.disabled)return;clearInterval(introTimer);refreshIntroAssets=null;state.intro=false;render();window.scrollTo(0,0)};
  if(document.documentElement.dataset.reduceEffects==='true'||window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){complete();return}
  introTimer=setInterval(()=>{count+=1;copy.textContent=letters.slice(0,count).join('');if(count>=letters.length)complete()},35);
 }
 function renderStory(){UI.renderScene(main,CASE.story[state.line],`人物 진술 · ${state.line+1} / ${CASE.story.length}`.replace('人物','인물'),`<button id="prev" ${state.line===0?'disabled':''}>← 이전 대화</button><button class="primary" id="next">${state.line===CASE.story.length-1?'증거 조사하기 →':'다음 대화 →'}</button>`);document.querySelector('#prev').onclick=()=>{state.line--;render()};document.querySelector('#next').onclick=()=>{if(state.line<CASE.story.length-1){state.line++;render()}else go('evidence')}}

 function fact(id){for(const d of CASE.docs){const f=(d.facts||[]).find(f=>f.id===id);if(f)return {doc:d,...f}}}
 function note(){const entries=[...state.collected].map(fact);return '<section class="investigation-note"><h2>나의 조사 노트 · '+entries.length+'개 기록</h2>'+(entries.length?entries.map(f=>'<article>'+UI.highlight(f.text)+'<small>'+f.doc.title+'</small></article>').join(''):'<p>서류를 열고 주요 정보를 눌러 기록하세요.</p>')+'</section>'}
 function syncCollection(){state.answers.forEach(a=>a.proof=a.proof.filter(id=>state.collected.has(id)));updateWorkflow();if(state.tab==='evidence')renderEvidence()}
 UI.onCollectionChange=syncCollection;
 function renderEvidence(){
  const docs=CASE.docs.filter(d=>d.facts),manual=CASE.docs.find(d=>d.id==='manual');
  main.innerHTML='<section class="paper"><small>자료실 · '+state.read.size+' / 5 열람</small><h1>기록을 열고, 차이를 찾으세요.</h1><p>서류의 주요 정보를 선택해 조사 노트에 기록하세요.</p><div class="evidence-tabs" role="group" aria-label="자료 종류"><button id="evidence-docs" aria-pressed="'+(state.evidenceTab==='docs')+'">계약·증빙 서류</button><button id="evidence-manual" aria-pressed="'+(state.evidenceTab==='manual')+'">업무 매뉴얼</button></div>'+
  (state.evidenceTab==='docs'?'<div class="documents">'+docs.map((d,i)=>'<button class="doc" data-doc="'+d.id+'"><img src="ver2/assets/case02/ui/UI_25_icon_document.png" alt=""><span><small>DOCUMENT 0'+(i+1)+' · '+(state.read.has(d.id)?'열람 완료':'미열람')+' · '+d.facts.filter(f=>state.collected.has(f.id)).length+'개 기록</small><b>'+d.title+'</b><em>'+d.source+'</em></span><strong>↗</strong></button>').join('')+'</div>':'<article class="manual-paper"><small>'+manual.source+'</small><h2>'+manual.title+'</h2>'+UI.highlight(manual.body)+'</article>')+
  note()+'<button class="primary wide" id="to-verify">요건 검증 시작 →</button></section>';
  main.querySelectorAll('[data-doc]').forEach(b=>b.onclick=()=>{state.read.add(b.dataset.doc);renderEvidence();UI.document(b.dataset.doc,state.collected)});
  document.querySelector('#evidence-docs').onclick=()=>{state.evidenceTab='docs';renderEvidence()};
  document.querySelector('#evidence-manual').onclick=()=>{state.evidenceTab='manual';state.read.add('manual');renderEvidence()};
  document.querySelector('#to-verify').onclick=()=>go('verify');
 }
 function renderVerify(){
  const available=CASE.docs.filter(d=>(d.facts||[]).some(f=>state.collected.has(f.id)));
  main.innerHTML='<section class="paper"><small>판정 준비</small><h1>주장보다, 근거.</h1><p>기록한 문서를 펼친 뒤, 하부 정보를 눌러 해당 요건의 근거로 채택하세요.</p><button type="button" id="back-evidence">서류에서 정보 더 기록하기 →</button><form id="form">'+CASE.questions.map((q,i)=>'<fieldset id="question-'+i+'"><legend><span>0'+(i+1)+'</span> '+q.q+'</legend><p>'+q.hint+'</p><div class="answer-row">'+[['yes','예'],['no','아니요']].map(([v,t])=>'<label><input type="radio" name="answer'+i+'" value="'+v+'" '+(state.answers[i].answer===v?'checked':'')+' required> '+t+'</label>').join('')+'</div><small>근거 문서 선택 · 문서를 펼쳐 기록한 정보를 선택하세요</small><div class="proof-documents">'+(available.length?available.map(d=>'<details class="proof-document"><summary>'+d.title+' <span>'+state.answers[i].proof.filter(id=>d.facts.some(f=>f.id===id)).length+'개 채택</span></summary><div>'+d.facts.filter(f=>state.collected.has(f.id)).map(f=>'<label class="proof-fact"><input type="checkbox" data-question="'+i+'" value="'+f.id+'" '+(state.answers[i].proof.includes(f.id)?'checked':'')+'>'+'<span class="fact-text">'+UI.highlight(f.text)+'</span></label>').join('')+'</div></details>').join(''):'<p class="empty-note">기록한 정보가 없습니다. 계약·증빙 서류에서 정보를 먼저 선택하세요.</p>')+'</div><div class="adopted" id="adopted-'+i+'">'+adopted(i)+'</div></fieldset>').join('')+'<div class="verification-readiness"><span>요건 작성 상태</span><b id="readiness-count"></b></div><fieldset><legend>최종 판정</legend>'+CASE.verdicts.map(v=>'<label class="verdict"><input required type="radio" name="verdict" value="'+v+'" '+(state.verdict===v?'checked':'')+'>'+v+'</label>').join('')+'</fieldset><p id="error" role="alert"></p><p class="submit-hint">제출 전 선택한 답변과 근거를 한 번 더 확인합니다.</p><button class="primary wide" type="submit">판정서 검토 →</button></form></section>';
  document.querySelector('#back-evidence').onclick=()=>go('evidence');
  const form=document.querySelector('#form');
  form.onchange=e=>{const t=e.target;if(t.name.startsWith('answer'))state.answers[Number(t.name.slice(6))].answer=t.value;else if(t.name==='verdict')state.verdict=t.value;else if(t.dataset.question!==undefined){const i=Number(t.dataset.question);state.answers[i].proof=[...form.querySelectorAll('[data-question="'+i+'"]:checked')].map(c=>c.value).filter(id=>state.collected.has(id));document.querySelector('#adopted-'+i).innerHTML=adopted(i);form.querySelectorAll('details').forEach(detail=>{const count=detail.querySelectorAll('input:checked').length;detail.querySelector('summary span').textContent=count+'개 채택'})}updateReadiness()};
  form.onsubmit=e=>{e.preventDefault();if(state.answers.some(a=>!a.answer||!a.proof.length)||!state.verdict){document.querySelector('#error').textContent='각 요건에 답하고, 기록한 하부 정보를 하나 이상 근거로 채택한 뒤 최종 판정을 선택해 주세요.';return}reviewVerdict()};
  updateReadiness();
 }
 function updateReadiness(){const count=state.answers.filter(a=>a.answer&&a.proof.length).length;document.querySelector('#readiness-count').textContent=`${count} / 3 작성`;CASE.questions.forEach((q,i)=>document.querySelector(`#question-${i}`).classList.toggle('question-filled',!!state.answers[i].answer&&!!state.answers[i].proof.length))}
 function reviewVerdict(){document.querySelector('#verdict-content').innerHTML=`<small>제출 전 최종 검토</small><h2 id="verdict-title">이 판정으로 기록할까요?</h2><p class="review-verdict">${state.verdict}</p><p>선택한 답변과 근거를 확인하세요. 최종 제출하면 당사자의 반응과 후속 절차가 이어집니다.</p>${CASE.questions.map((q,i)=>`<article class="review-item"><h3>${q.q}</h3><p>내 판단: <b>${state.answers[i].answer==='yes'?'예':'아니요'}</b></p><ul>${state.answers[i].proof.map(id=>{const f=fact(id);return `<li>${f.doc.title} — ${f.text}</li>`}).join('')}</ul></article>`).join('')}`;document.querySelector('#verdict-dialog').showModal();document.querySelector('#verdict-cancel').onclick=()=>document.querySelector('#verdict-dialog').close();document.querySelector('#verdict-confirm').onclick=()=>{document.querySelector('#verdict-dialog').close();finish()}}
 function adopted(i){return '<small>채택한 근거 · '+state.answers[i].proof.length+'개</small>'+state.answers[i].proof.map(id=>{const f=fact(id);return '<p>'+UI.highlight(f.text)+'<small>'+f.doc.title+'</small></p>'}).join('')}
 function finish(){const supported=state.answers.every((a,i)=>a.answer===CASE.questions[i].answer&&CASE.questions[i].proof.every(p=>a.proof.includes(p))&&a.proof.every(p=>CASE.questions[i].proof.includes(p)));const right=state.verdict===CASE.verdicts[0];state.ending={right,supported};state.step=0;go('story')}
 function endingLines(){const {right,supported}=state.ending;
 if(right)return [
 ['감사관 · 최종 판정','<mark>위반 확인 안 됨</mark>. 온라인 가격은 낮지만, RAM과 보증이 낮아 동등 이상의 상품으로 볼 수 없습니다. 실제 납품품은 계약과 일치합니다.',1],
 ['박지민 · 당사자 반응','제품의 차이를 확인해 주셔서 감사합니다. 가격표만으로 저희의 납품까지 의심받을까 두려웠어요.',0],
 ['조사실 · 후속조치',supported?'가격·사양·납품 기록을 첨부해 신고 건을 종결했습니다. 신고인에게 비교 사양과 추가 자료 제출 방법을 안내했습니다.':'결론은 타당하지만 요건 답변 또는 근거 지정에 미흡한 부분이 있습니다. 담당자는 제조사 비교표와 계약·검수자료를 보완해 종결 기록을 정리했습니다.',1],
 ['에필로그 · 다른 조건을 읽는 일','면담실의 불이 꺼집니다. 같은 모양의 태블릿 두 대, 그러나 같은 상품은 아니었습니다. 차이를 읽어 낸 기록이 한 사람의 신뢰를 지켰습니다.',0]
 ];
 const price=state.verdict===CASE.verdicts[1];return [
 ['감사관 · 최종 판정',`<mark>${state.verdict}</mark>으로 판정서를 제출했습니다. 하지만 그 결론은 제출된 자료와 맞지 않습니다.`,6],
 ['박지민 · 당사자 반응',price?'낮은 가격만 보신 건가요? A-100L은 RAM 8GB, 보증 1년입니다. 같은 조건이 아닌데요. 정식으로 이의를 제기하겠습니다.':'검수서에 A-100P라고 적혀 있습니다. 계약과 같은 제품을 납품했는데 규격 위반이라니요. 다시 확인해 주세요.',4],
 ['조사실 · 후속조치',price?'이의신청으로 제조사 비교표가 재검토되었습니다. 동등성 요건이 충족되지 않아 최초 판정을 정정하고 신고 건을 종결했습니다.':'계약내역과 납품검수 확인서를 다시 대조했습니다. 모델·RAM·보증이 모두 일치하여 규격 위반 판정을 철회하고 기록을 정정했습니다.',5],
 ['에필로그 · 다시 펼친 서류','박지민은 정정 통지를 받고 조용히 고개를 끄덕였습니다. 기록은 바로잡혔지만 설명해야 했던 시간은 남았습니다. 다음 판정에서는 가격과 사양, 실제 납품을 함께 읽어야 합니다.',7]
 ]}
 function report(){return `<div class="report"><h2>조사 결과</h2><p>제출 판정: <b>${state.verdict}</b></p><p>${state.ending.right?'판정이 자료와 일치합니다.':'재검토 후 판정 정정: 위반 확인 안 됨'}</p>${CASE.questions.map((q,i)=>`<article><h3>${q.q}</h3><p>내 판단: ${state.answers[i].answer==='yes'?'예':'아니요'} · 자료상 판단: ${q.answer==='yes'?'예':'아니요'}</p><p>지정 근거: ${state.answers[i].proof.map(p=>fact(p).doc.title+' — '+fact(p).text).join(', ')}</p><p>핵심 근거: ${q.proof.map(p=>fact(p).doc.title+' — '+fact(p).text).join(', ')}</p></article>`).join('')}<p>385,000원 &lt; 420,000원. 하지만 시장상품은 RAM 8GB·보증 1년으로 계약의 16GB·3년보다 낮습니다. 납품품 A-100P는 계약과 일치합니다.</p></div>`}
 function renderEnding(){if(state.done){main.innerHTML=`<section class="paper result"><small>INVESTIGATION COMPLETE</small><div class="seal">✓</div><h1>박지민 사건 조사 완료</h1><p>${state.ending.right?'차이를 확인하고, 기록을 남겼습니다.':'판정을 정정하고, 조사 기록을 마무리했습니다.'}</p><p class="outcome">${state.ending.right&&state.ending.supported?'증거에 기반한 판정':state.ending.right?'판정 타당 · 검증 근거 보완':'재검토를 통한 기록 정정'}</p>${state.review?report():''}<div class="result-actions"><button class="primary" id="replay">사건 다시 플레이하기</button><button id="review">조사 결과 ${state.review?'접기':'다시 보기'}</button></div></section>`;document.querySelector('#replay').onclick=reset;document.querySelector('#review').onclick=()=>{state.review=!state.review;render()};return}const lines=endingLines();UI.renderScene(main,lines[state.step],`${['최종 판정','당사자 반응','후속조치','에필로그'][state.step]} · ${state.step+1} / 4`,`<button id="end-prev" ${state.step===0?'disabled':''}>← 이전</button><button class="primary" id="end-next">${state.step===3?'조사 완료 →':'다음 이야기 →'}</button>`);document.querySelector('#end-prev').onclick=()=>{state.step--;render()};document.querySelector('#end-next').onclick=()=>{if(state.step<3)state.step++;else state.done=true;render();window.scrollTo(0,0)}}
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>go(b.dataset.tab));document.querySelector('#close-doc').onclick=()=>document.querySelector('#document').close();let start=null;main.addEventListener('touchstart',e=>{if(e.target.closest('input,label,button'))return;start={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY}},{passive:true});main.addEventListener('touchend',e=>{if(!start||state.ending||state.intro)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;start=null;if(Math.abs(dx)>90&&Math.abs(dx)>Math.abs(dy)*1.5){const t=['story','evidence','verify'];go(t[Math.max(0,Math.min(2,t.indexOf(state.tab)+(dx<0?1:-1)))])}},{passive:true});reset();
})();
