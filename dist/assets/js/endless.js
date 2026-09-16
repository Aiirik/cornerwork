(() => {
  let api;
  let modeButton;
  let setup;
  let points;
  let pointsDivider;
  let coachingButton;
  let syncTimer = 0;
  let enabled = false;

  const $ = (selector, root = document) => root.querySelector(selector);
  const fmt = (seconds) => Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');

  function parseTime(value) {
    const text = String(value).trim();
    if (/^\d+:\d{1,2}$/.test(text)) {
      const [minutes, seconds] = text.split(':').map(Number);
      return minutes * 60 + seconds;
    }
    const seconds = Number(text);
    return Number.isFinite(seconds) ? seconds : null;
  }

  function initialize(attempt = 0) {
    api = window.CornerworkApp;
    const launch = $('.feature-launch');
    const workoutDisplay = $('.workout-display');
    const controls = $('.controls');
    if ((!api || !launch || !workoutDisplay || !controls) && attempt < 100) {
      setTimeout(() => initialize(attempt + 1), 50);
      return;
    }
    if (!api || !launch || !workoutDisplay || !controls || $('#endlessMode')) return;

    buildModeButton(launch);
    buildSetup(launch);
    buildPoints(workoutDisplay);
    watchOtherWorkoutTypes(launch);
    syncMode(true);
    window.addEventListener('cornerwork-endless-mode', () => syncMode(true));
    window.addEventListener('cornerwork-config-applied', () => syncMode(true));
    syncTimer = window.setInterval(sync, 200);
  }

  function buildModeButton(launch) {
    modeButton = document.createElement('button');
    modeButton.id = 'endlessMode';
    modeButton.type = 'button';
    modeButton.className = 'endless-launch';
    modeButton.textContent = 'Endless';
    modeButton.setAttribute('aria-pressed', 'false');
    modeButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!['ready', 'complete'].includes(api.phase)) return;
      api.setEndlessMode(true);
    });
    launch.querySelector('.feature-grid')?.insertAdjacentElement('afterend', modeButton);
  }

  function buildSetup(launch) {
    setup = document.createElement('section');
    setup.className = 'endless-setup';
    setup.innerHTML =
      '<div class="endless-setup-head"><div><h2>Endless</h2><p>Clear levels, earn points, and keep going until you end the run.</p></div><span class="endless-badge">No limit</span></div>' +
      '<div class="endless-progression field"><div><label>Progression</label><p class="endless-note">Basic builds gradually. Advanced reaches difficult combinations sooner.</p></div><div class="segmented endless-progression-toggle" role="group" aria-label="Endless progression"><button type="button" data-value="basic">Basic</button><button type="button" data-value="advanced">Advanced</button></div></div>' +
      '<div class="endless-warmup field"><div><label for="endlessWarmup">Warm-up</label><p class="endless-note">This is the only adjustable timing setting. Every level after it follows the same progression.</p></div><div class="number-control workout-timing-control"><button class="step-btn" id="endlessWarmupDown" type="button" aria-label="Decrease Endless warm-up">−</button><input class="time-input" id="endlessWarmup" type="text" inputmode="numeric" data-min="0" data-max="300" data-step="5" aria-label="Endless warm-up time"><button class="step-btn" id="endlessWarmupUp" type="button" aria-label="Increase Endless warm-up">+</button></div></div>' +
      '<div class="endless-coaching field"><div><label for="endlessEditCoaching">Voice coach</label><p class="endless-note">Turn on technique reminders and recovery encouragement.</p></div><button class="workout-option-button" id="endlessEditCoaching" type="button">Edit coaching</button></div>' +
      '<div class="endless-next"><span>Current level rules</span><strong id="endlessNextRules"></strong></div>' +
      '<details class="endless-rules"><summary><span class="endless-rules-title">How difficulty grows</span><i class="collapse-indicator" aria-hidden="true"></i></summary><div class="endless-rules-body"><div class="endless-rule endless-scoring-rule"><b>PTS</b><div><strong>Points per called action</strong><small>Add every action in the combination together.</small><div class="endless-points-grid"><div><span>Jab, cross, feint, defense or movement</span><b>1 point</b></div><div><span>Hook or uppercut</span><b>2 points</b></div><div><span>Any body punch</span><b>+1 bonus</b></div></div></div></div><div class="endless-rule"><b>2</b><div><strong>Longer levels and recovery</strong><small>Every three levels add 0:15 work. Every four levels add 0:05 rest, capped at 5:00 and 1:00.</small></div></div><div class="endless-rule"><b>3</b><div><strong>Random focus levels</strong><small>Most levels mix combinations. Occasionally a level emphasizes one punch or repeats one combination.</small></div></div></div></details>';
    launch.insertAdjacentElement('afterend', setup);

    const input = $('#endlessWarmup', setup);
    const commit = (seconds) => {
      const next = Math.min(300, Math.max(0, Math.round(seconds)));
      api.setEndlessWarmup(next);
      input.value = fmt(api.settings.endlessWarmup);
    };
    $('#endlessWarmupDown', setup).onclick = () => commit(Number(api.settings.endlessWarmup) - 5);
    $('#endlessWarmupUp', setup).onclick = () => commit(Number(api.settings.endlessWarmup) + 5);
    input.addEventListener('change', () => {
      const parsed = parseTime(input.value);
      commit(parsed === null ? api.settings.endlessWarmup : parsed);
    });
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      input.blur();
    });
    setup.querySelectorAll('.endless-progression-toggle button').forEach((button) => {
      button.onclick = () => api.setEndlessDifficulty(button.dataset.value);
    });
    coachingButton = $('#endlessEditCoaching', setup);
    coachingButton.onclick = () =>
      window.dispatchEvent(new CustomEvent('cornerwork-open-coaching'));
  }

  function buildPoints(workoutDisplay) {
    const stats = $('.workout-stats', workoutDisplay);
    if (!stats) return;
    pointsDivider = document.createElement('i');
    pointsDivider.className = 'endless-points-divider';
    points = document.createElement('span');
    points.className = 'endless-points';
    points.innerHTML = 'Points: <strong id="endlessScore">0</strong>';
    stats.append(pointsDivider, points);
  }

  function watchOtherWorkoutTypes(launch) {
    launch.addEventListener(
      'click',
      (event) => {
        const otherMode = event.target.closest(
          '#customWorkout,#programStudio,#quickStart,#workoutPresets,#programs',
        );
        if (otherMode && api.settings.endlessMode) api.setEndlessMode(false);
      },
      true,
    );
  }

  function syncMode(force = false) {
    const next = !!api.settings.endlessMode;
    if (!force && next === enabled) return;
    enabled = next;
    document.body.classList.toggle('endless-mode', enabled);
    modeButton.classList.toggle('active', enabled);
    modeButton.setAttribute('aria-pressed', String(enabled));
    setup.setAttribute('aria-hidden', String(!enabled));
    points?.setAttribute('aria-hidden', String(!enabled));
    pointsDivider?.setAttribute('aria-hidden', String(!enabled));
    ['#restart', '#skip'].forEach((selector) => {
      const control = $(selector);
      if (control) control.disabled = enabled;
    });
    if (enabled) {
      $('.feature-launch')
        ?.querySelectorAll('button:not(#endlessMode)')
        .forEach((button) => button.classList.remove('active'));
    }
    sync();
  }

  function sync() {
    if (!api || !modeButton) return;
    const state = api.workoutState;
    const profile = api.endlessProfile;
    const input = $('#endlessWarmup', setup);
    if (document.activeElement !== input) input.value = fmt(api.settings.endlessWarmup);
    setup.querySelectorAll('.endless-progression-toggle button').forEach((button) => {
      const active = button.dataset.value === api.settings.endlessDifficulty;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $('#endlessNextRules', setup).textContent =
      'Level ' +
      profile.level +
      ' · ' +
      fmt(profile.roundTime) +
      ' work · ' +
      fmt(profile.restTime) +
      ' rest · callouts every ' +
      profile.pace +
      's';
    const frequency =
      { 3: 'Often', 5: 'Balanced', 8: 'Occasional' }[Number(api.settings.cueFrequency)] || 'Custom';
    coachingButton.textContent = api.settings.coachCues
      ? 'On · ' + frequency
      : 'Off · Edit coaching';
    const score = $('#endlessScore', points);
    if (score) score.textContent = String(state.score);
  }

  window.addEventListener('pagehide', () => clearInterval(syncTimer));
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', () => initialize(), { once: true });
  else initialize();
})();
