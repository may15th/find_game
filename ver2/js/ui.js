window.UI={
 image(n){return 'ver2/assets/case02/characters/ParkJimin_'+String(n+1).padStart(2,'0')+'_'+CASE.expressions[n]+'.png'},
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
  return `<section class="case-heading"><small>조사 파일 · 박지민</small><h1>${CASE.title}</h1><p>같은 외형, 다른 조건. 증거로 진실을 구별하세요.</p></section><section class="scene ${active?'subject-speaking':'subject-listening'} ${changed?'focus-changing':''}"><img class="character" src="${UI.image(line[2])}" alt="박지민 — ${['기본','설명','당혹','불안','억울','방어','압박','체념'][line[2]]} 표정"><div class="speaker"><b>박지민</b><span>미래정보 대표</span></div></section><section class="speech" aria-live="polite"><div class="speech-meta"><small>${label}</small><b class="current-speaker">${line[0]}</b></div><p>${UI.highlight(line[1])}</p><div class="color-legend" aria-label="정보 유형별 강조색"><span class="info-time">시간·날짜</span><span class="info-price">가격·수량</span><span class="info-entity">기업·인물</span><span class="info-rule">규정·조건</span></div></section><div class="dialog-controls">${controls}</div>`;
 },
 document(id,selection){const d=CASE.docs.find(d=>d.id===id);const content=document.querySelector('#document-content');
  function paint(){content.innerHTML=`<small>${d.source}</small><h2 id="document-title">${d.title}</h2>${UI.highlight(d.body)}${d.facts&&selection?`<section class="collect-facts"><h3>주요 정보 기록</h3><p>정보를 눌러 조사 노트에 담으세요. 다시 누르면 해제됩니다.</p>${d.facts.map(f=>`<button type="button" class="fact-button ${selection.has(f.id)?'selected':''}" data-collect="${f.id}" aria-pressed="${selection.has(f.id)}"><span class="fact-state" aria-hidden="true">${selection.has(f.id)?'✓':'＋'}</span><span class="fact-text">${UI.highlight(f.text)}</span></button>`).join('')}<small id="collection-status" role="status">${d.facts.filter(f=>selection.has(f.id)).length}개 정보 기록됨</small></section>`:''}`;
   content.querySelectorAll('[data-collect]').forEach(b=>b.onclick=()=>{const id=b.dataset.collect;selection.has(id)?selection.delete(id):selection.add(id);if(UI.onCollectionChange)UI.onCollectionChange();paint();content.querySelector(`[data-collect="${id}"]`)?.focus();if(UI.notify)UI.notify(selection.has(id)?'조사 노트에 기록했습니다. 요건 검증에서 근거로 채택할 수 있습니다.':'기록을 해제했습니다. 이 정보의 근거 채택도 해제되었습니다.')});
  }paint();document.querySelector('#document').showModal();
 }
};
