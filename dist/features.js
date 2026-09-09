(() => {
  const KEY='cornerwork-allow-page-zoom';
  const zoomAllowed=()=>localStorage.getItem(KEY)==='true';
  const blockGesture=e=>{if(!zoomAllowed())e.preventDefault()};
  const blockMultiTouch=e=>{if(!zoomAllowed()&&e.touches&&e.touches.length>1)e.preventDefault()};

  // Lock pinch zoom without changing the viewport meta tag. This preserves
  // Cornerwork's existing iPhone/PWA sizing and safe-area layout.
  document.addEventListener('gesturestart',blockGesture,{passive:false});
  document.addEventListener('gesturechange',blockGesture,{passive:false});
  document.addEventListener('gestureend',blockGesture,{passive:false});
  document.addEventListener('touchmove',blockMultiTouch,{passive:false});

  function addAccessibilitySetting(){
    if(document.getElementById('allowPageZoom'))return;
    const settings=document.querySelector('.settings-shell');
    if(!settings)return;
    const group=document.createElement('section');
    group.className='settings-group';
    group.dataset.zoomAccessibility='true';
    group.innerHTML='<h2>Accessibility</h2><p>Optional controls that make Cornerwork easier to use for different needs.</p><div class="setting-row"><span>Allow page zoom</span><button class="switch" id="allowPageZoom" type="button" role="switch" aria-checked="false" aria-label="Allow page zoom"><i></i></button></div>';
    const toggle=group.querySelector('#allowPageZoom');
    const sync=()=>{const on=zoomAllowed();toggle.classList.toggle('on',on);toggle.setAttribute('aria-checked',String(on))};
    toggle.addEventListener('click',()=>{localStorage.setItem(KEY,String(!zoomAllowed()));sync()});
    sync();
    const groups=[...settings.querySelectorAll('.settings-group')];
    const keyboard=groups.find(el=>/keyboard shortcuts/i.test(el.textContent));
    const danger=settings.querySelector('.danger-zone');
    if(keyboard)settings.insertBefore(group,keyboard);else if(danger)settings.insertBefore(group,danger);else settings.appendChild(group);
  }

  const observer=new MutationObserver(()=>addAccessibilitySetting());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addAccessibilitySetting,{once:true});else addAccessibilitySetting();

  const core=document.createElement('script');
  core.src='features-core.js?v=125';
  core.defer=true;
  document.head.appendChild(core);
})();
