(() => {
  const VISION_MODULE =
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';
  const VISION_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
  const POSE_MODEL =
    'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
  const SETTINGS_KEY = 'cornerwork-padwork-settings';
  const CONNECTORS = [
    [11, 12],
    [11, 13],
    [13, 15],
    [12, 14],
    [14, 16],
    [11, 23],
    [12, 24],
    [23, 24],
    [23, 25],
    [25, 27],
    [24, 26],
    [26, 28],
  ];
  const ARM_LANDMARKS = { left: [11, 13, 15], right: [12, 14, 16] };
  const PUNCHES = {
    1: { id: 'jab', name: 'Jab', short: 'JAB', lane: 29, height: 33 },
    2: { id: 'cross', name: 'Cross', short: 'CROSS', lane: 71, height: 33 },
    3: { id: 'hook', name: 'Hook', short: 'HOOK', lane: 50, height: 45 },
  };
  const SPEEDS = {
    easy: { travel: 3200, gap: 1700 },
    standard: { travel: 2500, gap: 1250 },
    fast: { travel: 1900, gap: 900 },
  };
  const DEFAULT_SETTINGS = {
    speed: 'standard',
    labelMode: 'names',
    framing: 'fit',
    enabled: ['jab', 'cross', 'hook'],
    colors: { jab: '#199ee8', cross: '#f3c742', hook: '#ef4444' },
    deviceId: '',
  };
  const HIT_EARLY = 650;
  const HIT_LATE = 700;
  const LAUNCH_LABEL = 'Padwork game (Beta)';

  let api;
  let stage;
  let video;
  let canvas;
  let context;
  let toggle;
  let optionsPanel;
  let settingsDialog;
  let stream;
  let cameraTrack;
  let poseLandmarker;
  let active = false;
  let loading = false;
  let switchingCamera = false;
  let animationFrame = 0;
  let lastInferenceAt = 0;
  let lastVideoTime = -1;
  let lastPhase = '';
  let nextSpawnAt = 0;
  let targetId = 0;
  let previousPunch = 0;
  let poseReady = false;
  let playableLastFrame = false;
  let gamePausedAt = 0;
  let previousModeButton;
  let score = 0;
  let streak = 0;
  let hits = 0;
  let misses = 0;
  let settings = readSettings();
  const targets = [];
  const arms = { left: armState(), right: armState() };

  const $ = (selector, root = document) => root.querySelector(selector);

  function armState() {
    return {
      armed: false,
      minAngle: 180,
      lastHitAt: 0,
      previousWrist: null,
      previousAt: 0,
    };
  }

  function initialize(attempt = 0) {
    api = window.CornerworkApp;
    const launch = $('.feature-launch');
    const workout = $('.workout');
    if ((!api || !launch || !workout) && attempt < 80) {
      setTimeout(() => initialize(attempt + 1), 50);
      return;
    }
    if (!api || !launch || !workout || $('#padworkToggle')) return;

    toggle = document.createElement('button');
    toggle.id = 'padworkToggle';
    toggle.type = 'button';
    toggle.className = 'custom-workout padwork-launch';
    toggle.textContent = LAUNCH_LABEL;
    toggle.setAttribute('aria-pressed', 'false');
    toggle.addEventListener('click', () => {
      if (!active && !loading) enable();
    });
    launch.appendChild(toggle);
    launch
      .querySelectorAll('#customWorkout,#programStudio,#quickStart,#programs,#workoutPresets')
      .forEach((button) =>
        button.addEventListener(
          'click',
          () => {
            if (active || loading) disable();
          },
          { capture: true },
        ),
      );

    buildOptionsPanel(launch);
    buildStage(workout);
    applySettings();
    window.addEventListener('pagehide', stopCamera);
    document.addEventListener('visibilitychange', () => {
      if (!active) return;
      if (document.hidden) cancelAnimationFrame(animationFrame);
      else animationFrame = requestAnimationFrame(frame);
    });
  }

  function buildOptionsPanel(launch) {
    optionsPanel = document.createElement('section');
    optionsPanel.className = 'padwork-options';
    optionsPanel.innerHTML =
      '<div class="padwork-options-head"><div><strong>Game setup</strong><small>Choose the targets and camera view.</small></div><button class="padwork-settings-button" id="padworkSettings" type="button" aria-label="Open Padwork settings"><svg class="ui-icon" aria-hidden="true"><use href="assets/icons/ui-icons.svg#icon-settings"></use></svg></button></div>' +
      '<label class="padwork-field"><span>Target speed</span><select id="padworkSpeed"><option value="easy">Easy</option><option value="standard">Standard</option><option value="fast">Fast</option></select></label>' +
      '<fieldset class="padwork-punches"><legend>Included punches</legend><label><input type="checkbox" value="jab"><i style="--punch-color:#199ee8"></i>Jab</label><label><input type="checkbox" value="cross"><i style="--punch-color:#f3c742"></i>Cross</label><label><input type="checkbox" value="hook"><i style="--punch-color:#ef4444"></i>Hook</label></fieldset>' +
      '<div class="padwork-camera-options"><div class="padwork-option-label">Camera</div><label class="padwork-field"><span>Available lens</span><select id="padworkCamera"><option value="">Front camera</option></select></label><div class="padwork-camera-row"><div class="padwork-framing" role="group" aria-label="Camera framing"><button id="padworkFit" type="button">Fit</button><button id="padworkFill" type="button">Fill</button></div><label class="padwork-zoom hidden-feature" id="padworkZoomRow"><span>Zoom <output id="padworkZoomValue">1×</output></span><input id="padworkZoom" type="range"></label></div><small id="padworkCameraNote">Enable Padwork to detect the lenses and zoom controls Safari provides.</small></div>';
    launch.after(optionsPanel);

    settingsDialog = document.createElement('dialog');
    settingsDialog.id = 'padworkSettingsDialog';
    settingsDialog.className = 'feature-dialog padwork-settings-dialog';
    settingsDialog.tabIndex = -1;
    settingsDialog.innerHTML =
      '<div class="feature-shell"><div class="feature-head"><h2>Padwork settings</h2><button class="feature-close" id="padworkSettingsClose" type="button" aria-label="Close"></button></div><p class="feature-note">Customize how targets appear during the game.</p><label class="padwork-field"><span>Target labels</span><select id="padworkLabels"><option value="names">Punch names</option><option value="numbers">Boxing numbers</option></select></label><div class="padwork-colors"><div class="padwork-option-label">Target colors</div><label><span>Jab</span><input id="padworkJabColor" type="color"></label><label><span>Cross</span><input id="padworkCrossColor" type="color"></label><label><span>Hook</span><input id="padworkHookColor" type="color"></label><button class="feature-secondary" id="padworkResetColors" type="button">Reset colors</button></div></div>';
    document.body.appendChild(settingsDialog);

    $('#padworkSettings', optionsPanel).addEventListener('click', () => {
      if (!settingsDialog.open) settingsDialog.showModal();
      settingsDialog.focus({ preventScroll: true });
    });
    $('#padworkSettingsClose', settingsDialog).addEventListener('click', () =>
      settingsDialog.close(),
    );
    settingsDialog.addEventListener('click', (event) => {
      if (event.target === settingsDialog) settingsDialog.close();
    });

    $('#padworkSpeed', optionsPanel).addEventListener('change', (event) => {
      settings.speed = event.target.value;
      saveSettings();
    });
    $('#padworkLabels', settingsDialog).addEventListener('change', (event) => {
      settings.labelMode = event.target.value === 'numbers' ? 'numbers' : 'names';
      saveSettings();
    });
    optionsPanel.querySelectorAll('.padwork-punches input').forEach((input) => {
      input.addEventListener('change', () => {
        const selected = [...optionsPanel.querySelectorAll('.padwork-punches input:checked')].map(
          (item) => item.value,
        );
        if (!selected.length) {
          input.checked = true;
          return;
        }
        settings.enabled = selected;
        saveSettings();
      });
    });
    ['jab', 'cross', 'hook'].forEach((name) => {
      $(`#padwork${capitalize(name)}Color`, settingsDialog).addEventListener('input', (event) => {
        settings.colors[name] = event.target.value;
        applyTargetColors();
        saveSettings();
      });
    });
    $('#padworkResetColors', settingsDialog).addEventListener('click', () => {
      settings.colors = { ...DEFAULT_SETTINGS.colors };
      applySettings();
      saveSettings();
    });
    $('#padworkFit', optionsPanel).addEventListener('click', () => setFraming('fit'));
    $('#padworkFill', optionsPanel).addEventListener('click', () => setFraming('fill'));
    $('#padworkCamera', optionsPanel).addEventListener('change', (event) => {
      settings.deviceId = event.target.value;
      saveSettings();
      if (active) switchCamera(settings.deviceId);
    });
    $('#padworkZoom', optionsPanel).addEventListener('input', (event) => {
      applyHardwareZoom(Number(event.target.value));
    });
    window.dispatchEvent(
      new CustomEvent('cornerwork-enhance-content', { detail: { root: optionsPanel } }),
    );
  }

  function buildStage(workout) {
    stage = document.createElement('section');
    stage.className = 'padwork-stage';
    stage.dataset.sessionState = 'ready';
    stage.setAttribute('aria-hidden', 'true');
    stage.innerHTML =
      '<video id="padworkVideo" autoplay muted playsinline aria-label="Camera preview"></video>' +
      '<canvas id="padworkCanvas" aria-hidden="true"></canvas>' +
      '<div class="padwork-vignette" aria-hidden="true"></div>' +
      '<div class="padwork-hud">' +
      '<div class="padwork-topline"><div class="padwork-stat"><span>Score</span><strong id="padworkScore">0</strong></div><div class="padwork-clock"><span id="padworkPhase">Ready</span><strong id="padworkClock">3:00</strong></div><div class="padwork-stat padwork-streak"><span>Streak</span><strong id="padworkStreak">0</strong></div><button class="padwork-control" id="padworkControl" type="button">Start</button></div>' +
      '<div class="padwork-message" id="padworkMessage" data-state="loading">Camera model loading…</div>' +
      '<div class="padwork-arena" id="padworkArena"></div>' +
      '<div class="padwork-bottom"><div class="padwork-accuracy"><span>Accuracy</span><strong id="padworkAccuracy">—</strong></div><div class="padwork-meter"><i id="padworkMeter"></i></div></div>' +
      '</div>';
    workout.prepend(stage);
    video = $('#padworkVideo', stage);
    canvas = $('#padworkCanvas', stage);
    context = canvas.getContext('2d');
    $('#padworkControl', stage).addEventListener('click', () => api.startWorkout());
  }

  async function enable() {
    if (loading || active) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setLaunchError('Camera unavailable');
      return;
    }
    loading = true;
    active = true;
    previousModeButton = $('.feature-launch .active');
    $('.feature-launch')
      ?.querySelectorAll('#customWorkout,#programStudio,#quickStart,#programs,#workoutPresets')
      .forEach((button) => button.classList.remove('active'));
    api.resetWorkout();
    api.setPadworkMode(true);
    resetGame();
    document.body.classList.add('padwork-active');
    stage.setAttribute('aria-hidden', 'false');
    toggle.classList.add('active');
    toggle.setAttribute('aria-pressed', 'true');
    setLaunchLabel('Starting…');
    setMessage('Allow camera access, then step into frame.', 'loading');

    try {
      await Promise.all([startPreferredCamera(), loadPoseLandmarker()]);
      if (!active) {
        stopCamera();
        return;
      }
      loading = false;
      setLaunchLabel(LAUNCH_LABEL);
      setMessage('Finding your shoulders and hands…', 'loading');
      animationFrame = requestAnimationFrame(frame);
    } catch (error) {
      console.error('Padwork could not start:', error);
      const denied = error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError';
      disable();
      setLaunchError(denied ? 'Camera blocked' : 'Could not start');
    }
  }

  function disable() {
    const wasActive = active;
    active = false;
    loading = false;
    poseReady = false;
    cancelAnimationFrame(animationFrame);
    clearTargets();
    stopCamera();
    clearCanvas();
    if (settingsDialog?.open) settingsDialog.close();
    if (wasActive) api.resetWorkout();
    api.setPadworkMode(false);
    document.body.classList.remove('padwork-active');
    stage?.setAttribute('aria-hidden', 'true');
    toggle?.classList.remove('active', 'error');
    toggle?.setAttribute('aria-pressed', 'false');
    previousModeButton?.classList.add('active');
    setLaunchLabel(LAUNCH_LABEL);
  }

  function stopCamera() {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    cameraTrack = null;
    if (video) video.srcObject = null;
  }

  async function startCamera(deviceId = '') {
    const videoConstraints = deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' };
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        ...videoConstraints,
        width: { ideal: 1280 },
        height: { ideal: 1280 },
        aspectRatio: { ideal: 1 },
        frameRate: { ideal: 30, max: 30 },
      },
    });
    cameraTrack = stream.getVideoTracks()[0];
    video.srcObject = stream;
    await video.play();
    if (video.readyState < 2)
      await new Promise((resolve) => video.addEventListener('loadeddata', resolve, { once: true }));
    resizeCanvas();
    await refreshCameraOptions();
  }

  async function startPreferredCamera() {
    try {
      await startCamera(settings.deviceId);
    } catch (error) {
      if (!settings.deviceId) throw error;
      settings.deviceId = '';
      saveSettings();
      await startCamera('');
    }
  }

  async function switchCamera(deviceId) {
    if (switchingCamera) return;
    switchingCamera = true;
    setMessage('Switching camera…', 'loading');
    stopCamera();
    try {
      await startCamera(deviceId);
      setMessage('Camera ready', 'ready');
    } catch (error) {
      console.warn('Could not switch Padwork camera:', error);
      settings.deviceId = '';
      saveSettings();
      await startCamera('');
      setMessage('That lens was unavailable. Using the front camera.', 'warning');
    } finally {
      switchingCamera = false;
    }
  }

  async function refreshCameraOptions() {
    const select = $('#padworkCamera', optionsPanel);
    const devices = (await navigator.mediaDevices.enumerateDevices()).filter(
      (device) => device.kind === 'videoinput',
    );
    const currentId = cameraTrack?.getSettings?.().deviceId || settings.deviceId;
    select.innerHTML = devices
      .map(
        (device, index) =>
          `<option value="${escapeAttribute(device.deviceId)}">${escapeHtml(device.label || `Camera ${index + 1}`)}</option>`,
      )
      .join('');
    if (devices.some((device) => device.deviceId === currentId)) select.value = currentId;
    settings.deviceId = select.value;
    saveSettings();
    refreshZoomControl();
  }

  function refreshZoomControl() {
    const row = $('#padworkZoomRow', optionsPanel);
    const input = $('#padworkZoom', optionsPanel);
    const note = $('#padworkCameraNote', optionsPanel);
    const capabilities = cameraTrack?.getCapabilities?.() || {};
    const current = cameraTrack?.getSettings?.().zoom;
    if (capabilities.zoom && Number.isFinite(capabilities.zoom.min)) {
      input.min = capabilities.zoom.min;
      input.max = capabilities.zoom.max;
      input.step = capabilities.zoom.step || 0.1;
      input.value = Number.isFinite(current) ? current : capabilities.zoom.min;
      row.classList.remove('hidden-feature');
      note.textContent = `This lens provides ${formatZoom(capabilities.zoom.min)}–${formatZoom(capabilities.zoom.max)} zoom.`;
      updateZoomOutput(Number(input.value));
    } else {
      row.classList.add('hidden-feature');
      note.textContent =
        'Safari does not expose zoom for this lens. Try another available lens for a wider view.';
    }
  }

  async function applyHardwareZoom(value) {
    if (!cameraTrack) return;
    try {
      await cameraTrack.applyConstraints({ advanced: [{ zoom: value }] });
      updateZoomOutput(value);
    } catch (error) {
      console.warn('Camera zoom was rejected:', error);
      refreshZoomControl();
    }
  }

  function updateZoomOutput(value) {
    $('#padworkZoomValue', optionsPanel).textContent = formatZoom(value);
  }

  function formatZoom(value) {
    return `${Number(value).toFixed(Number(value) % 1 ? 1 : 0)}×`;
  }

  async function loadPoseLandmarker() {
    if (poseLandmarker) return;
    const { FilesetResolver, PoseLandmarker } = await import(VISION_MODULE);
    const vision = await FilesetResolver.forVisionTasks(VISION_WASM);
    const options = (delegate) => ({
      baseOptions: { modelAssetPath: POSE_MODEL, delegate },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.55,
      minPosePresenceConfidence: 0.55,
      minTrackingConfidence: 0.55,
    });
    try {
      poseLandmarker = await PoseLandmarker.createFromOptions(vision, options('GPU'));
    } catch (gpuError) {
      console.warn('Padwork GPU setup failed; using CPU tracking.', gpuError);
      poseLandmarker = await PoseLandmarker.createFromOptions(vision, options('CPU'));
    }
  }

  function frame(now) {
    if (!active || document.hidden) return;
    syncWorkout(now);
    if (canAdvanceGame()) updateTargets(now);
    if (
      poseLandmarker &&
      video.readyState >= 2 &&
      video.currentTime !== lastVideoTime &&
      now - lastInferenceAt >= 60
    ) {
      lastInferenceAt = now;
      lastVideoTime = video.currentTime;
      resizeCanvas();
      try {
        const result = poseLandmarker.detectForVideo(video, now);
        processPose(result?.landmarks?.[0], now);
      } catch (error) {
        console.warn('Padwork frame skipped:', error);
      }
    }
    animationFrame = requestAnimationFrame(frame);
  }

  function resizeCanvas() {
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 1280;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function processPose(landmarks, now) {
    clearCanvas();
    if (!landmarks || !upperBodyVisible(landmarks)) {
      poseReady = false;
      setMessage('Keep your shoulders and hands in view so punches can score.', 'warning');
      return;
    }
    drawSkeleton(landmarks);
    if (!poseReady) setMessage('Tracking ready', 'tracking');
    poseReady = true;
    if (!canPlay()) return;
    detectArm('left', landmarks, now);
    detectArm('right', landmarks, now);
  }

  function upperBodyVisible(landmarks) {
    return [11, 12, 13, 14, 15, 16].every(
      (index) => landmarks[index] && (landmarks[index].visibility ?? 1) > 0.32,
    );
  }

  function drawSkeleton(landmarks) {
    const width = canvas.width;
    const height = canvas.height;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = Math.max(3, width * 0.005);
    context.strokeStyle = 'rgba(255, 55, 48, .9)';
    context.shadowColor = 'rgba(255, 35, 35, .55)';
    context.shadowBlur = 9;
    CONNECTORS.forEach(([start, end]) => {
      const a = landmarks[start];
      const b = landmarks[end];
      if (!a || !b || (a.visibility ?? 1) < 0.35 || (b.visibility ?? 1) < 0.35) return;
      context.beginPath();
      context.moveTo(a.x * width, a.y * height);
      context.lineTo(b.x * width, b.y * height);
      context.stroke();
    });
    context.shadowBlur = 0;
    context.fillStyle = '#f7f9fb';
    [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach((index) => {
      const point = landmarks[index];
      if (!point || (point.visibility ?? 1) < 0.35) return;
      context.beginPath();
      context.arc(point.x * width, point.y * height, Math.max(3, width * 0.006), 0, Math.PI * 2);
      context.fill();
    });
  }

  function detectArm(side, landmarks, now) {
    const [shoulderIndex, elbowIndex, wristIndex] = ARM_LANDMARKS[side];
    const shoulder = landmarks[shoulderIndex];
    const elbow = landmarks[elbowIndex];
    const wrist = landmarks[wristIndex];
    const arm = arms[side];
    const bend = jointAngle(shoulder, elbow, wrist);
    if (!Number.isFinite(bend)) return;
    const elapsed = Math.max(16, now - arm.previousAt);
    const lateralSpeed = arm.previousWrist
      ? Math.abs(wrist.x - arm.previousWrist.x) / (elapsed / 1000)
      : 0;
    const hookMotion =
      bend > 45 && bend < 150 && Math.abs(wrist.y - shoulder.y) < 0.3 && lateralSpeed > 0.38;
    arm.previousWrist = { x: wrist.x, y: wrist.y };
    arm.previousAt = now;
    if (hookMotion && now - arm.lastHitAt > 480) {
      arm.armed = false;
      arm.minAngle = 180;
      arm.lastHitAt = now;
      registerPunch(3, now);
      return;
    }
    if (bend < 145) {
      arm.armed = true;
      arm.minAngle = Math.min(arm.minAngle, bend);
      return;
    }
    if (arm.armed && bend > 150 && arm.minAngle < 145 && now - arm.lastHitAt > 320) {
      arm.armed = false;
      arm.minAngle = 180;
      arm.lastHitAt = now;
      registerPunch(punchForArm(side), now);
    }
  }

  function jointAngle(a, b, c) {
    const width = canvas.width;
    const height = canvas.height;
    const ab = { x: (a.x - b.x) * width, y: (a.y - b.y) * height };
    const cb = { x: (c.x - b.x) * width, y: (c.y - b.y) * height };
    const denominator = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
    if (!denominator) return NaN;
    const cosine = Math.max(-1, Math.min(1, (ab.x * cb.x + ab.y * cb.y) / denominator));
    return (Math.acos(cosine) * 180) / Math.PI;
  }

  function punchForArm(side) {
    const lead = api.settings.stance === 'southpaw' ? 'right' : 'left';
    return side === lead ? 1 : 2;
  }

  function syncWorkout(now) {
    const state = api.workoutState;
    stage.dataset.sessionState = state.phase;
    setText($('#padworkClock', stage), state.clock);
    setText($('#padworkPhase', stage), phaseLabel(state));
    const control = $('#padworkControl', stage);
    setText(
      control,
      state.running
        ? 'Pause'
        : state.phase === 'ready'
          ? 'Start'
          : state.phase === 'complete'
            ? 'Again'
            : 'Resume',
    );
    control.classList.toggle('is-pause', state.running);
    const playable = canAdvanceGame();
    if (state.phase !== lastPhase) {
      clearTargets();
      nextSpawnAt = state.phase === 'work' ? now + 600 : 0;
      playableLastFrame = playable;
      gamePausedAt = 0;
      if (state.phase === 'complete') setMessage('Session complete', 'ready');
      else if (state.phase === 'rest') setMessage('Recover. Targets resume next round.', 'ready');
      else if (state.phase === 'warmup')
        setMessage('Warm up and settle into your stance.', 'ready');
      else if (state.phase === 'ready')
        setMessage('Press Start when you are in position.', 'ready');
      lastPhase = state.phase;
    } else {
      if (!playable && playableLastFrame) gamePausedAt = now;
      else if (playable && !playableLastFrame && gamePausedAt) {
        const pausedFor = now - gamePausedAt;
        targets.forEach((target) => {
          target.spawnedAt += pausedFor;
          target.dueAt += pausedFor;
        });
        if (nextSpawnAt) nextSpawnAt += pausedFor;
        gamePausedAt = 0;
      }
      playableLastFrame = playable;
    }
    if (canAdvanceGame() && (!nextSpawnAt || now >= nextSpawnAt)) spawnTarget(now);
  }

  function canPlay() {
    const state = api.workoutState;
    return state.running && state.phase === 'work' && state.comboVisible;
  }

  function canAdvanceGame() {
    return canPlay();
  }

  function phaseLabel(state) {
    if (!state.running && state.phase === 'work') return 'Paused';
    if (state.phase === 'work') return `Round ${state.round} of ${state.rounds}`;
    if (state.phase === 'warmup') return 'Warmup';
    if (state.phase === 'rest') return 'Recovery';
    if (state.phase === 'complete') return 'Complete';
    return 'Ready';
  }

  function spawnTarget(now) {
    const pool = Object.entries(PUNCHES)
      .filter(([, punch]) => settings.enabled.includes(punch.id))
      .map(([code]) => Number(code));
    if (!pool.length) return;
    let code = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && code === previousPunch)
      code =
        pool[
          (pool.indexOf(code) + 1 + Math.floor(Math.random() * (pool.length - 1))) % pool.length
        ];
    previousPunch = code;
    const punch = PUNCHES[code];
    const speed = SPEEDS[settings.speed] || SPEEDS.standard;
    const element = document.createElement('div');
    const sideOffset = code === 3 ? (Math.random() < 0.5 ? -23 : 23) : 0;
    element.className = `padwork-flying-target punch-${punch.id}`;
    element.dataset.labelMode = settings.labelMode;
    element.style.setProperty('--target-color', settings.colors[punch.id]);
    element.innerHTML = `<i></i><strong>${settings.labelMode === 'numbers' ? code : punch.short}</strong>`;
    element.setAttribute('aria-label', `${punch.name} target`);
    $('#padworkArena', stage).appendChild(element);
    targets.push({
      id: ++targetId,
      code,
      element,
      spawnedAt: now,
      dueAt: now + speed.travel,
      destinationX: punch.lane + sideOffset,
      destinationY: punch.height,
      state: 'flying',
    });
    nextSpawnAt = now + speed.gap;
  }

  function updateTargets(now) {
    for (let index = targets.length - 1; index >= 0; index--) {
      const target = targets[index];
      if (target.state !== 'flying') continue;
      const duration = target.dueAt - target.spawnedAt;
      const raw = Math.max(0, Math.min(1.16, (now - target.spawnedAt) / duration));
      const depth = Math.pow(Math.min(1, raw), 2.1);
      const x = 50 + (target.destinationX - 50) * depth;
      const y = 38 + (target.destinationY - 38) * depth;
      const scale = 0.34 + depth * 0.92;
      target.element.style.left = `${x}%`;
      target.element.style.top = `${y}%`;
      target.element.style.opacity = String(Math.min(1, 0.42 + raw * 1.1));
      target.element.style.transform = `translate(-50%, -50%) scale(${scale})`;
      target.element.classList.toggle(
        'in-window',
        now >= target.dueAt - HIT_EARLY && now <= target.dueAt + HIT_LATE,
      );
      if (now > target.dueAt + HIT_LATE) resolveTarget(target, false);
    }
  }

  function registerPunch(code, now) {
    const eligible = targets
      .filter(
        (item) =>
          item.state === 'flying' && now >= item.dueAt - HIT_EARLY && now <= item.dueAt + HIT_LATE,
      )
      .sort((a, b) => Math.abs(now - a.dueAt) - Math.abs(now - b.dueAt));
    const target = eligible.find((item) => item.code === code) || eligible[0];
    if (!target) return;
    if (target.code !== code) {
      misses++;
      streak = 0;
      target.element.classList.add('wrong');
      setTimeout(() => target.element.classList.remove('wrong'), 220);
      updateScoreboard();
      return;
    }
    const timing = Math.abs(now - target.dueAt);
    const points = timing < 120 ? 1000 : timing < 280 ? 750 : 500;
    score += points + Math.min(streak, 10) * 25;
    streak++;
    hits++;
    resolveTarget(target, true);
    if (navigator.vibrate) navigator.vibrate(18);
  }

  function resolveTarget(target, hit) {
    if (target.state !== 'flying') return;
    target.state = hit ? 'hit' : 'miss';
    target.element.classList.add(target.state);
    if (!hit) {
      misses++;
      streak = 0;
    }
    updateScoreboard();
    setTimeout(() => removeTarget(target), hit ? 260 : 380);
  }

  function removeTarget(target) {
    target.element.remove();
    const index = targets.indexOf(target);
    if (index >= 0) targets.splice(index, 1);
  }

  function clearTargets() {
    targets.splice(0).forEach((target) => target.element.remove());
  }

  function updateScoreboard() {
    const attempts = hits + misses;
    const accuracy = attempts ? Math.round((hits / attempts) * 100) : 0;
    stage.classList.toggle('has-attempts', attempts > 0);
    $('#padworkScore', stage).textContent = score.toLocaleString();
    $('#padworkStreak', stage).textContent = String(streak);
    $('#padworkAccuracy', stage).textContent = attempts ? `${accuracy}%` : '—';
    $('#padworkMeter', stage).style.width = `${accuracy}%`;
  }

  function resetGame() {
    score = 0;
    streak = 0;
    hits = 0;
    misses = 0;
    previousPunch = 0;
    lastPhase = '';
    nextSpawnAt = 0;
    playableLastFrame = false;
    gamePausedAt = 0;
    clearTargets();
    Object.assign(arms.left, armState());
    Object.assign(arms.right, armState());
    updateScoreboard();
  }

  function readSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
      return {
        ...DEFAULT_SETTINGS,
        ...(saved || {}),
        colors: { ...DEFAULT_SETTINGS.colors, ...(saved?.colors || {}) },
        enabled:
          Array.isArray(saved?.enabled) && saved.enabled.length
            ? saved.enabled
            : DEFAULT_SETTINGS.enabled,
      };
    } catch (error) {
      return {
        ...DEFAULT_SETTINGS,
        colors: { ...DEFAULT_SETTINGS.colors },
        enabled: [...DEFAULT_SETTINGS.enabled],
      };
    }
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function applySettings() {
    $('#padworkSpeed', optionsPanel).value = settings.speed;
    $('#padworkLabels', settingsDialog).value = settings.labelMode;
    optionsPanel.querySelectorAll('.padwork-punches input').forEach((input) => {
      input.checked = settings.enabled.includes(input.value);
    });
    ['jab', 'cross', 'hook'].forEach((name) => {
      $(`#padwork${capitalize(name)}Color`, settingsDialog).value = settings.colors[name];
    });
    setFraming(settings.framing, false);
    applyTargetColors();
  }

  function applyTargetColors() {
    Object.entries(settings.colors).forEach(([name, color]) => {
      stage?.style.setProperty(`--padwork-${name}`, color);
      const swatch = optionsPanel?.querySelector(`.padwork-punches input[value="${name}"] + i`);
      swatch?.style.setProperty('--punch-color', color);
    });
  }

  function setFraming(mode, persist = true) {
    settings.framing = mode === 'fill' ? 'fill' : 'fit';
    if (stage) stage.dataset.framing = settings.framing;
    ['fit', 'fill'].forEach((name) => {
      const button = $(`#padwork${capitalize(name)}`, optionsPanel);
      button?.classList.toggle('active', settings.framing === name);
      button?.setAttribute('aria-pressed', String(settings.framing === name));
    });
    if (persist) saveSettings();
  }

  function clearCanvas() {
    if (context) context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function setMessage(text, state) {
    const message = $('#padworkMessage', stage);
    setText(message, text);
    if (message.dataset.state !== state) message.dataset.state = state;
  }

  function setText(element, text) {
    if (element && element.textContent !== text) element.textContent = text;
  }

  function setLaunchLabel(label) {
    if (toggle) toggle.textContent = label;
  }

  function setLaunchError(label) {
    toggle?.classList.add('error');
    setLaunchLabel(label);
    setTimeout(() => {
      if (!active) {
        toggle?.classList.remove('error');
        setLaunchLabel(LAUNCH_LABEL);
      }
    }, 3500);
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function escapeHtml(value) {
    const node = document.createElement('span');
    node.textContent = value;
    return node.innerHTML;
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/"/g, '&quot;');
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', () => initialize(), { once: true });
  else initialize();
})();
