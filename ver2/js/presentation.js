// Presentation preferences never change evidence, answers, or outcomes.
(() => {
 const root=document.documentElement;
 const large=document.querySelector('#large-text');
 const effects=document.querySelector('#reduce-effects');
 large.onchange=()=>{root.dataset.largeText=String(large.checked)};
 effects.onchange=()=>{root.dataset.reduceEffects=String(effects.checked)};
 root.dataset.largeText='false';
 root.dataset.reduceEffects='false';
 UI.notify=message=>{
  const status=document.querySelector('#feedback');
  status.textContent=message;
  clearTimeout(UI.feedbackTimer);
  UI.feedbackTimer=setTimeout(()=>{status.textContent=''},4200);
 };
})();
