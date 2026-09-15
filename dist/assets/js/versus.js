(() => {
  let api;
  let toggle;
  let opponent;
  let animationFrame = 0;
  let enabled = false;
  let health = 100;
  let score = 0;
  let chain = 0;
  let lastComboCount = 0;
  let lastMoveCount = 0;
  let lastPhase = 'ready';
  let impactTimer = 0;

  const $ = (selector, root = document) => root.querySelector(selector);

  function initialize(attempt = 0) {
    api = window.CornerworkApp;
    const workoutTiming = $('#workoutTiming');
    const workoutDisplay = $('.workout-display');
    if ((!api || !workoutTiming || !workoutDisplay) && attempt < 80) {
      setTimeout(() => initialize(attempt + 1), 50);
      return;
    }
    if (!api || !workoutTiming || !workoutDisplay || $('#versusToggle')) return;

    buildToggle(workoutTiming);
    buildOpponent(workoutDisplay);
    syncMode(true);
    window.addEventListener('cornerwork-config-applied', () => syncMode());
    window.addEventListener('cornerwork-versus-mode', () => syncMode());
    animationFrame = requestAnimationFrame(frame);
  }

  function buildToggle(workoutTiming) {
    toggle = document.createElement('button');
    toggle.id = 'versusToggle';
    toggle.type = 'button';
    toggle.className = 'versus-toggle';
    toggle.innerHTML =
      '<span><strong>VS Computer</strong><small>Turn this workout into a virtual fight</small></span><b>Off</b>';
    toggle.setAttribute('aria-pressed', 'false');
    toggle.addEventListener('click', () => {
      api.setVersusMode(!api.settings.versusMode);
    });
    workoutTiming.querySelector('.workout-total')?.insertAdjacentElement('afterend', toggle);
  }

  function buildOpponent(workoutDisplay) {
    opponent = document.createElement('section');
    opponent.className = 'versus-opponent';
    opponent.setAttribute('aria-label', 'Computer opponent');
    opponent.innerHTML =
      '<div class="versus-opponent-head"><span>CPU opponent</span><strong id="versusOpponentState">Ready</strong></div>' +
      '<div class="versus-health"><div><span>Health</span><strong id="versusHealthValue">100%</strong></div><div class="versus-health-track"><i id="versusHealthBar"></i></div></div>' +
      '<div class="versus-ring" aria-hidden="true"><div class="versus-impact" id="versusImpact"></div><div class="versus-fighter"><i class="versus-head"></i><i class="versus-body"></i><i class="versus-glove versus-glove-left"></i><i class="versus-glove versus-glove-right"></i></div><div class="versus-floor"></div></div>' +
      '<div class="versus-scoreboard"><span>Score <strong id="versusScore">0</strong></span><span>Combo chain <strong id="versusChain">0</strong></span></div>';
    workoutDisplay.prepend(opponent);
  }

  function frame() {
    syncMode();
    if (enabled) syncFight(api.workoutState);
    animationFrame = requestAnimationFrame(frame);
  }

  function syncMode(force = false) {
    const next = !!api.settings.versusMode;
    if (!force && next === enabled) return;
    enabled = next;
    document.body.classList.toggle('versus-mode', enabled);
    opponent?.setAttribute('aria-hidden', String(!enabled));
    toggle?.classList.toggle('active', enabled);
    toggle?.setAttribute('aria-pressed', String(enabled));
    const status = toggle?.querySelector('b');
    if (status) status.textContent = enabled ? 'On' : 'Off';
    if (enabled) resetFight(api.workoutState);
  }

  function syncFight(state) {
    if (!state) return;
    opponent.dataset.phase = state.phase;
    opponent.classList.toggle(
      'paused',
      !state.running && !['ready', 'complete'].includes(state.phase),
    );

    if (
      state.phase === 'ready' &&
      (lastPhase !== 'ready' ||
        state.comboCount < lastComboCount ||
        state.moveCount < lastMoveCount)
    ) {
      resetFight(state);
    }

    const comboDelta = Math.max(0, state.comboCount - lastComboCount);
    const moveDelta = Math.max(0, state.moveCount - lastMoveCount);
    if (state.running && state.phase === 'work' && state.comboVisible && comboDelta > 0) {
      landAttack(state, comboDelta, Math.max(comboDelta, moveDelta));
    }

    if (state.phase === 'complete' && lastPhase !== 'complete') {
      health = 0;
      chain = Math.max(chain, state.comboCount);
      opponent.classList.add('knockout');
      setOpponentState('Knockout');
      renderFight();
    } else if (state.phase === 'rest') {
      setOpponentState('Corner break');
    } else if (state.phase === 'warmup') {
      setOpponentState('Get ready');
    } else if (!state.running && !['ready', 'complete'].includes(state.phase)) {
      setOpponentState('Fight paused');
    } else if (state.phase === 'work') {
      setOpponentState(`Round ${state.round}`);
    } else if (state.phase === 'ready') {
      setOpponentState('Ready');
    }

    lastComboCount = state.comboCount;
    lastMoveCount = state.moveCount;
    lastPhase = state.phase;
  }

  function landAttack(state, comboDelta, moves) {
    const workout = api.settings.workout || {};
    const rounds = Math.max(1, Number(state.rounds) || Number(workout.rounds) || 1);
    const roundLength = Math.max(10, Number(workout.roundTime) || 180);
    const pace = Math.max(2, Number(workout.pace) || 6);
    const expectedCalls = Math.max(1, (rounds * roundLength) / pace);
    const comboDamage = (92 / expectedCalls) * comboDelta * (0.72 + Math.min(moves, 10) * 0.14);
    const completedWork =
      (Math.max(1, state.round) - 1) * roundLength +
      Math.max(0, roundLength - (state.phase === 'work' ? state.seconds : roundLength));
    const progress = Math.max(0, Math.min(1, completedWork / (rounds * roundLength)));
    const pacedHealth = 100 - progress * 88;
    const previousHealth = health;
    health = Math.max(4, Math.min(health - comboDamage, pacedHealth));
    chain += comboDelta;
    score += moves * 100 + Math.min(chain, 20) * 15;
    showImpact(Math.max(1, Math.round(previousHealth - health)));
    renderFight();
  }

  function showImpact(damage) {
    clearTimeout(impactTimer);
    const impact = $('#versusImpact', opponent);
    impact.textContent = `-${damage}`;
    opponent.classList.remove('struck');
    void opponent.offsetWidth;
    opponent.classList.add('struck');
    impactTimer = setTimeout(() => opponent.classList.remove('struck'), 360);
  }

  function resetFight(state = api.workoutState) {
    clearTimeout(impactTimer);
    health = 100;
    score = 0;
    chain = 0;
    lastComboCount = state?.comboCount || 0;
    lastMoveCount = state?.moveCount || 0;
    lastPhase = state?.phase || 'ready';
    opponent?.classList.remove('struck', 'knockout');
    setOpponentState('Ready');
    renderFight();
  }

  function renderFight() {
    if (!opponent) return;
    const roundedHealth = Math.max(0, Math.round(health));
    opponent.dataset.health =
      roundedHealth <= 25 ? 'critical' : roundedHealth <= 55 ? 'warning' : 'healthy';
    $('#versusHealthValue', opponent).textContent = `${roundedHealth}%`;
    $('#versusHealthBar', opponent).style.width = `${health}%`;
    $('#versusScore', opponent).textContent = score.toLocaleString();
    $('#versusChain', opponent).textContent = String(chain);
  }

  function setOpponentState(label) {
    const state = $('#versusOpponentState', opponent);
    if (state && state.textContent !== label) state.textContent = label;
  }

  window.addEventListener('pagehide', () => cancelAnimationFrame(animationFrame));
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', () => initialize(), { once: true });
  else initialize();
})();
