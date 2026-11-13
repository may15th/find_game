// Dependency-free interaction harness. Run: node ver2/test-flow.cjs
const fs=require('fs'),vm=require('vm'),assert=require('assert');
function setup(){
 const nodes=new Map();const main={html:'',set innerHTML(v){this.html=v;for(const k of nodes.keys())if(!["#close-doc","#document","#document-content","#verdict-dialog","#verdict-content","#verdict-cancel","#verdict-confirm","#large-text","#reduce-effects","#feedback"].includes(k))nodes.delete(k)},get innerHTML(){return this.html},querySelector(){return null},querySelectorAll(s){return select(s)},addEventListener(){}};
 function node(s){if(!nodes.has(s))nodes.set(s,{innerHTML:'',textContent:'',classList:{toggle(){}},setAttribute(){},focus(){},showModal(){this.open=true},close(){this.open=false},querySelector(s){return node(s)},querySelectorAll(s){return select(s)}});return nodes.get(s)}
 const tabs=['story','evidence','verify'].map(t=>({dataset:{tab:t},classList:{toggle(){}},setAttribute(){}}));
 function select(s){if(s==='[data-tab]')return tabs;if(s==='[data-doc]')return context.CASE.docs.filter(d=>d.facts).map(d=>{const b=node('doc-'+d.id);b.dataset={doc:d.id};return b});if(s==='[data-collect]')return [...node('#document-content').innerHTML.matchAll(/data-collect="([^"]+)"/g)].map(m=>{const b=node('collect-'+m[1]);b.dataset={collect:m[1]};return b});return []}
 const context={window:{scrollTo(){}},document:{documentElement:{dataset:{}},querySelector:s=>s==='#main'?main:node(s),querySelectorAll:select},Set,console,setTimeout:()=>1,clearTimeout(){},setInterval:fn=>{context.tick=fn;return 1},clearInterval:()=>{context.tick=null}};context.window=context;context.scrollTo=()=>{};vm.createContext(context);
 // Asset transport/DOM persistence is exercised separately in test-portraits.
 const progress={ready:8,failed:0,total:8,settled:true};const listeners=[];
 for(const f of ['case02','ui','presentation','game']){
  if(f==='game')context.UI.portraits={status:()=>progress,subscribe:fn=>listeners.push(fn),preload(){},retry(){},mount(){},show(){}};
  vm.runInContext(fs.readFileSync(`ver2/js/${f}.js`,'utf8'),context);
 }
 return {context,main,node,tabs,progress,emit:()=>listeners.forEach(fn=>fn(progress)),click:s=>{assert(main.html.includes(`id="${s}"`),`missing ${s}`);node('#'+s).onclick()},tab:t=>tabs.find(b=>b.dataset.tab===t).onclick()};
}
let runs=0;
const loading=setup();loading.progress.ready=0;loading.progress.settled=false;loading.emit();loading.click('intro-reveal');loading.click('intro-start');assert(loading.main.html.includes('intro-screen'));
loading.progress.ready=7;loading.emit();assert(loading.node('#intro-start').disabled,'all expressions must settle before initial dialogue');
loading.progress.ready=8;loading.progress.settled=true;loading.emit();assert(!loading.node('#intro-start').disabled);loading.click('intro-start');assert(loading.main.html.includes('subject-listening'));
const failed=setup();failed.progress.ready=0;failed.progress.failed=8;failed.emit();failed.click('intro-reveal');assert(failed.node('#intro-start').disabled);assert(!failed.node('#portrait-retry').hidden);
failed.progress.ready=7;failed.progress.failed=1;failed.emit();assert(!failed.node('#intro-start').disabled,'allow prepared fallback when only some expressions fail');
const intro=setup();
assert(intro.main.html.includes('intro-screen'));
intro.tab('evidence');assert(intro.main.html.includes('intro-screen'));
intro.click('intro-start');assert(intro.main.html.includes('intro-screen'));
intro.context.tick();assert.equal(intro.node('#intro-copy').textContent.length,1);
while(intro.context.tick)intro.context.tick();
assert.equal(intro.node('#intro-copy').textContent,intro.context.CASE.intro);
intro.click('intro-start');assert(intro.main.html.includes('subject-listening'));
intro.click('next');assert(intro.main.html.includes('subject-speaking'));
assert(!intro.main.html.includes('scene-label'));
assert(intro.main.html.includes('<b>박지민</b><span>미래정보 대표</span>'));
intro.node('#large-text').checked=true;intro.node('#large-text').onchange();assert.equal(intro.context.document.documentElement.dataset.largeText,'true');
intro.node('#reduce-effects').checked=true;intro.node('#reduce-effects').onchange();assert.equal(intro.context.document.documentElement.dataset.reduceEffects,'true');
const highlighted=intro.context.UI.highlight('4월 18일 420,000원 박지민 RAM 16GB 보증 3년');
for(const kind of ['time','price','entity','rule'])assert(highlighted.includes('info-'+kind));
for(const verdict of ['위반 확인 안 됨','우대가격 위반','계약규격 위반']){
 const h=setup();h.click('intro-reveal');h.click('intro-start');for(let i=0;i<8;i++){assert(h.main.html.includes(`data-expression="${i}"`));h.click('next')}
 assert(h.main.html.includes('자료실'));
 h.tab('verify');assert(h.main.html.includes('기록한 정보가 없습니다'));h.tab('evidence');
 h.click('evidence-manual');assert(h.main.html.includes('manual-paper'));h.click('evidence-docs');
 for(const d of h.context.CASE.docs.filter(d=>d.facts)){h.node('doc-'+d.id).onclick();assert(h.node('#document').open);for(const f of d.facts)h.node('collect-'+f.id).onclick();h.node('#close-doc').onclick();assert(!h.node('#document').open)}
 h.click('to-verify');const form=h.node('#form');for(let i=0;i<3;i++){form.onchange({target:{name:`answer${i}`,value:i===1?'no':'yes'}});const proofs=h.context.CASE.questions[i].proof;form.querySelectorAll=s=>s==='details'?[]:proofs.map(value=>({value}));form.onchange({target:{name:'',dataset:{question:String(i)}}})}
 form.onchange({target:{name:'verdict',value:verdict}});form.onsubmit({preventDefault(){}});
 assert(h.node('#verdict-dialog').open);assert(h.node('#verdict-content').innerHTML.includes(verdict));h.node('#verdict-cancel').onclick();assert(!h.node('#verdict-dialog').open);assert(h.main.html.includes('판정 준비'));form.onsubmit({preventDefault(){}});h.node('#verdict-confirm').onclick();
 for(let i=0;i<4;i++){assert(h.main.html.includes(['최종 판정','당사자 반응','후속조치','에필로그'][i]));h.click('end-next')}
 assert(h.main.html.includes('박지민 사건 조사 완료'));h.click('review');assert(h.main.html.includes('핵심 근거'));h.click('replay');h.click('intro-reveal');h.click('intro-start');assert(h.main.html.includes('인물 진술 · 1 / 8'));runs++;
}
const h=setup();h.click('intro-reveal');h.click('intro-start');h.tab('verify');const form=h.node('#form');form.onsubmit({preventDefault(){}});assert(h.node('#error').textContent.includes('근거로 채택'));
// Only explicitly recorded documents and facts become selectable proof.
h.tab('evidence');h.node('doc-contract').onclick();h.node('collect-contract-price').onclick();h.node('#close-doc').onclick();h.tab('verify');
assert(h.main.html.includes('value="contract-price"'));assert(!h.main.html.includes('value="contract-model"'));assert(!h.main.html.includes('<summary>온라인 판매가격 자료'));
const collectedForm=h.node('#form');collectedForm.querySelectorAll=s=>s==='details'?[]:[{value:'contract-price'}];collectedForm.onchange({target:{name:'',dataset:{question:'0'}}});assert(h.node('#adopted-0').innerHTML.includes('420,000원'));
h.tab('evidence');h.node('doc-contract').onclick();h.node('collect-contract-price').onclick();h.node('#close-doc').onclick();h.tab('verify');assert(h.main.html.includes('기록한 정보가 없습니다'));assert(!h.main.html.includes('value="contract-price"'));assert(h.main.html.includes('채택한 근거 · 0개'));
for(const file of ['index_ver2.html','ver2/js/case02.js','ver2/js/game.js','ver2/js/ui.js','ver2/css/style.css'])assert(fs.existsSync(file));
for(const d of h.context.CASE.expressions.map((_,i)=>h.context.UI.image(i)))assert(fs.existsSync(d));
assert(fs.existsSync('ver2/assets/case02/background/interview-room.png'));
assert(fs.existsSync('ver2/assets/case02/background/interview-room-v2.svg'));
const entry=fs.readFileSync('index_ver2.html','utf8');
for(const [,path] of entry.matchAll(/(?:src|href)="(ver2\/[^"#]+)"/g))assert(fs.existsSync(path),'Missing '+path);
const design=fs.readFileSync('ver2/css/design-system.css','utf8');
for(const [,path] of design.matchAll(/url\('([^']+)'\)/g))assert(fs.existsSync(require('path').resolve('ver2/css',path)));
function luminance(hex){const c=hex.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722}
for(const [foreground,background] of [['203746','f7efdd'],['52626a','f7efdd'],['b5c5cd','142e3c'],['eac782','142e3c'],['245b9f','dceaff'],['704713','ffe5a0'],['266541','d9efdf'],['743a8d','eeddf4'],['326d51','e5f0e3']]){const a=luminance(foreground),b=luminance(background),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert(ratio>=4.5,`Contrast ${foreground}/${background}: ${ratio}`)}
console.log(`PASS: ${runs} verdict flows, intro, 8 expressions, fact collection/filter/removal, review/cancel, report/replay, display settings, 9 contrast pairs and asset paths. Browser layout not covered.`);



