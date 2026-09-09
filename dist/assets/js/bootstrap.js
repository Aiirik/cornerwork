(() => {
  const KEY='cornerwork-allow-page-zoom';
  const zoomAllowed=()=>localStorage.getItem(KEY)==='true';
  const blockGesture=e=>{if(!zoomAllowed())e.preventDefault()};
  const blockMultiTouch=e=>{if(!zoomAllowed()&&e.touches&&e.touches.length>1)e.preventDefault()};
  document.addEventListener('gesturestart',blockGesture,{passive:false});
  document.addEventListener('gesturechange',blockGesture,{passive:false});
  document.addEventListener('gestureend',blockGesture,{passive:false});
  document.addEventListener('touchmove',blockMultiTouch,{passive:false});

  // Keep help bubbles above nested workout groups and allow them to escape
  // the Advanced options container instead of being clipped by it.
  const tooltipStyle=document.createElement('style');
  tooltipStyle.textContent='.advanced-fold[open],.advanced-fold[open]>.advanced-fold-body{overflow:visible!important}.advanced-fold-body>section{position:relative}.advanced-fold-body>section:has(.help.open){z-index:100}.advanced-fold-body .help.open:after{z-index:1000}';
  document.head.appendChild(tooltipStyle);

  function addAccessibilitySetting(){
    if(document.getElementById('allowPageZoom'))return;
    const groups=[...document.querySelectorAll('#settingsPage .settings-group')];
    const group=groups.find(el=>el.querySelector('h2')?.textContent.trim()==='Accessibility');
    if(!group)return;
    const row=document.createElement('div');
    row.className='enhanced-row';
    row.innerHTML='<label>Allow page zoom</label><button class="enhanced-switch" id="allowPageZoom" type="button" role="switch" aria-checked="false" aria-label="Allow page zoom"><i></i></button>';
    group.appendChild(row);
    const tip=group.querySelector('.settings-tip');
    tip?.insertAdjacentHTML('beforeend','<span><strong>Allow page zoom:</strong> Enables pinch-to-zoom on mobile. Zoom is locked by default to prevent accidental scaling during workouts.</span>');
    const toggle=row.querySelector('#allowPageZoom');
    const sync=()=>{const on=zoomAllowed();toggle.classList.toggle('on',on);toggle.setAttribute('aria-checked',String(on))};
    toggle.addEventListener('click',()=>{localStorage.setItem(KEY,String(!zoomAllowed()));sync()});
    sync();
  }
  const observer=new MutationObserver(()=>addAccessibilitySetting());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addAccessibilitySetting,{once:true});else addAccessibilitySetting();
  const core=document.createElement('script');
  core.src='assets/js/enhancements.js?v=140';
  core.defer=true;
  document.head.appendChild(core);
})();
