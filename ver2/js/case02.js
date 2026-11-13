window.CASE = {
 intro:'공공기관에 납품된 태블릿이 온라인에서는 더 싸게 팔리고 있다는 신고가 접수됐다.\n\n계약가격은 420,000원. 온라인 판매가격은 385,000원. 사진 속 두 제품의 외형은 같아 보인다.\n\n납품업체 미래정보의 대표 박지민은 계약대로 납품했다고 주장한다.\n\n당신은 이 사건을 맡은 감사관이다. 진술과 계약·판매·검수 자료를 대조하고, 규정을 검증해 판정을 내려야 한다.',
 title:'CASE 02 — 태블릿 납품',
 expressions:['neutral','explaining','surprised','anxious','indignant','defensive','pressured','resigned'],
 story:[
 ['조사 개시','동일한 외형의 태블릿. 온라인에서는 <mark>385,000원</mark>, 공공계약에서는 <mark>420,000원</mark>. 가격 차이는 무엇을 말하고 있을까?',0],
 ['박지민 · 미래정보 대표','저희는 계약대로 납품했습니다. A-100 시리즈는 외형이 같아도 <mark>제품 사양</mark>이 달라요.',1],
 ['박지민 · 미래정보 대표','사진만 보고 같은 제품이라고 신고한 건가요? 온라인 제품의 <mark>모델 코드</mark>도 확인하셨나요?',2],
 ['박지민 · 미래정보 대표','가격만 비교한 보고서가 나가면 회사의 신뢰가 무너질까 걱정됩니다.',3],
 ['박지민 · 미래정보 대표','공공기관에 더 비싸게 팔았다는 말은 억울합니다. <mark>RAM과 보증기간</mark>을 비교해 주세요.',4],
 ['박지민 · 미래정보 대표','계약 모델은 <mark>A-100P</mark>입니다. 온라인의 A-100L과는 구성이 다릅니다.',5],
 ['감사관','설명만으로 결론을 내릴 수는 없습니다. <mark>4월 18일</mark> 검수된 실제 납품 모델도 서류와 대조하겠습니다.',6],
 ['박지민 · 미래정보 대표','네. 계약서와 검수 기록을 제출하겠습니다. 부디 모든 자료를 확인하고 판단해 주세요.',7]
 ],
 docs:[
 {id:'contract',title:'MAS 계약내역',source:'나라장터 · 계약자료',body:'<p>계약 모델 <mark>A-100P</mark></p><p>계약 단가 <mark>420,000원</mark></p><p>RAM <b>16GB</b> · 보증 <b>3년</b></p><p>공공기관 납품은 위 모델과 조건을 충족해야 한다.</p>'},
 {id:'market',title:'온라인 판매가격 자료',source:'신고인 · 판매화면 캡처',body:'<p>판매 모델 <mark>A-100L</mark></p><p>표시 판매가격 <mark>385,000원</mark></p><p>계약가보다 <b>35,000원 낮다.</b></p><p>가격 화면만으로 두 모델의 성능이 같다고 단정할 수 없다.</p>'},
 {id:'spec',title:'제조사 제품 사양 비교표',source:'제조사 · 기술자료',body:'<table><tr><th>항목</th><th>계약 A-100P</th><th>시장 A-100L</th></tr><tr><td>RAM</td><td>16GB</td><td>8GB</td></tr><tr><td>보증</td><td>3년</td><td>1년</td></tr><tr><td>외형</td><td colspan="2">A-100 시리즈 · 동일</td></tr></table><p>외형은 같지만 시장상품의 RAM과 보증 조건은 계약상품보다 낮다.</p>'},
 {id:'delivery',title:'납품검수 확인서',source:'수요기관 · 검수기록',body:'<p>납품·검수일 <mark>4월 18일</mark></p><p>출고 및 검수 모델 <mark>A-100P</mark></p><p>RAM <b>16GB</b> · 보증 <b>3년</b></p><p>계약과 일치하는 제품의 납품 및 검수가 완료되었다.</p>'},
 {id:'manual',title:'우대가격 관련 업무 매뉴얼',source:'조사실 · 게임 내 판단 규칙',body:'<ol><li>계약가보다 낮은 시장가격이 존재하는지 확인한다.</li><li>시장상품의 성능·사양이 계약상품과 <b>동등 이상</b>인지 비교한다. 외형이나 시리즈명만으로 판단하지 않는다.</li><li>실제 납품품이 계약 모델과 조건에 맞는지 별도로 확인한다.</li></ol><p>가격과 동등성 요건이 모두 확인되어야 우대가격 위반을 인정한다. 납품 불일치는 계약규격 문제로 구별한다.</p><small>이 프로토타입의 교육용 규칙이며 실제 법률 판단 자료가 아니다.</small>'}
 ],
 questions:[
 {q:'계약가보다 낮은 시장가격이 존재하는가?',hint:'MAS 계약내역과 온라인 가격을 비교하세요.',answer:'yes',proof:['contract-price','market-price']},
 {q:'시장상품은 계약상품과 동등 이상의 사양인가?',hint:'외형 대신 RAM과 보증기간을 확인하세요.',answer:'no',proof:['spec-ram','spec-warranty']},
 {q:'실제 납품한 제품이 계약과 일치하는가?',hint:'계약 조건과 납품검수 기록을 대조하세요.',answer:'yes',proof:['contract-model','contract-spec','delivery-model','delivery-spec']}
 ],
 verdicts:['위반 확인 안 됨','우대가격 위반','계약규격 위반']
};
// Individually collectible statements; the manual is a separate reference.
CASE.docs.find(d=>d.id==='contract').facts=[
 {id:'contract-model',text:'계약 모델 A-100P'},
 {id:'contract-price',text:'계약 단가 420,000원'},
 {id:'contract-spec',text:'계약 사양 RAM 16GB · 보증 3년'}
];
CASE.docs.find(d=>d.id==='market').facts=[
 {id:'market-model',text:'판매 모델 A-100L'},
 {id:'market-price',text:'온라인 판매가격 385,000원'}
];
CASE.docs.find(d=>d.id==='spec').facts=[
 {id:'spec-ram',text:'RAM 비교: 계약 A-100P 16GB / 시장 A-100L 8GB'},
 {id:'spec-warranty',text:'보증 비교: 계약 A-100P 3년 / 시장 A-100L 1년'},
 {id:'spec-shape',text:'두 모델은 A-100 시리즈로 외형이 동일하다'}
];
CASE.docs.find(d=>d.id==='delivery').facts=[
 {id:'delivery-date',text:'납품·검수일 4월 18일'},
 {id:'delivery-model',text:'출고 및 검수 모델 A-100P'},
 {id:'delivery-spec',text:'검수 사양 RAM 16GB · 보증 3년'}
];
