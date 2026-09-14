(() => {
  const VISION_MODULE =
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';
  const VISION_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
  const POSE_MODEL =
    'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
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
  const ARM_LANDMARKS = {
    left: [11, 13, 15],
    right: [12, 14, 16],
  };

  let api;
  let stage;
  let video;
  let canvas;
  let context;
  let toggle;
  let stream;
  let poseLandmarker;
  let active = false;
  let loading = false;
  let animationFrame = 0;
  let lastInferenceAt = 0;
  let lastVideoTime = -1;
  let lastComboRevision = -1;
  let lastPhase = '';
  let expected = [];
  let expectedIndex = 0;
  let targetStartedAt = 0;
  let score = 0;
  let streak = 0;
  let hits = 0;
  let misses = 0;
  const arms = {
    left: { armed: false, minAngle: 180, lastHitAt: 0 },
    right: { armed: false, minAngle: 180, lastHitAt: 0 },
  };

  const $ = (selector, root = document) => root.querySelector(selector);

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
    toggle.className = 'padwork-launch';
    toggle.innerHTML =
      '<span><strong>Padwork beta</strong><small>Camera game · jabs &amp; crosses</small></span><b>Enable</b>';
    toggle.addEventListener('click', () => (active ? disable() : enable()));
    launch.appendChild(toggle);

    stage = document.createElement('section');
    stage.className = 'padwork-stage';
    stage.setAttribute('aria-hidden', 'true');
    stage.innerHTML =
      '<video id="padworkVideo" autoplay muted playsinline aria-label="Front camera preview"></video>' +
      '<canvas id="padworkCanvas" aria-hidden="true"></canvas>' +
      '<div class="padwork-vignette" aria-hidden="true"></div>' +
      '<div class="padwork-hud">' +
      '<div class="padwork-topline"><div class="padwork-stat"><span>Score</span><strong id="padworkScore">0</strong></div>' +
      '<div class="padwork-clock"><span id="padworkPhase">Ready</span><strong id="padworkClock">3:00</strong></div>' +
      '<div class="padwork-stat padwork-streak"><span>Streak</span><strong id="padworkStreak">0</strong></div>' +
      '<button class="padwork-exit" id="padworkExit" type="button">Exit camera</button></div>' +
      '<div class="padwork-message" id="padworkMessage">Camera model loading…</div>' +
      '<div class="padwork-callout" id="padworkCallout">Jab · Cross</div>' +
      '<div class="padwork-target" id="padworkTarget" aria-live="polite"><i></i><span id="padworkSide">Next</span><strong id="padworkPunch">Get ready</strong></div>' +
      '<div class="padwork-queue" id="padworkQueue" aria-label="Current punch sequence"></div>' +
      '<div class="padwork-bottom"><div class="padwork-accuracy"><span>Accuracy</span><strong id="padworkAccuracy">100%</strong></div>' +
      '<div class="padwork-meter"><i id="padworkMeter"></i></div><small>Keep your upper body and hands in frame</small></div>' +
      '</div>';
    workout.prepend(stage);

    video = $('#padworkVideo', stage);
    canvas = $('#padworkCanvas', stage);
    context = canvas.getContext('2d');
    $('#padworkExit', stage).addEventListener('click', disable);
    window.addEventListener('pagehide', stopCamera);
    document.addEventListener('visibilitychange', () => {
      if (!active) return;
      if (document.hidden) cancelAnimationFrame(animationFrame);
      else animationFrame = requestAnimationFrame(frame);
    });
  }

  async function enable() {
    if (loading || active) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setLaunchError('Camera unavailable');
      return;
    }
    loading = true;
    active = true;
    resetScore();
    document.body.classList.add('padwork-active');
    stage.setAttribute('aria-hidden', 'false');
    toggle.classList.add('active');
    setLaunchLabel('Starting…');
    setMessage('Allow camera access, then step into frame.', 'loading');

    try {
      const cameraTask = startCamera();
      const poseTask = loadPoseLandmarker();
      await Promise.all([cameraTask, poseTask]);
      if (!active) {
        stopCamera();
        return;
      }
      loading = false;
      setLaunchLabel('Enabled');
      setMessage('Finding your stance…', 'loading');
      closeWorkoutDrawer();
      animationFrame = requestAnimationFrame(frame);
    } catch (error) {
      console.error('Padwork could not start:', error);
      const denied = error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError';
      disable();
      setLaunchError(denied ? 'Camera blocked' : 'Could not start');
    }
  }

  function disable() {
    active = false;
    loading = false;
    cancelAnimationFrame(animationFrame);
    stopCamera();
    clearCanvas();
    document.body.classList.remove('padwork-active');
    stage?.setAttribute('aria-hidden', 'true');
    toggle?.classList.remove('active', 'error');
    setLaunchLabel('Enable');
  }

  function stopCamera() {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (video) video.srcObject = null;
  }

  async function startCamera() {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        width: { ideal: 720 },
        height: { ideal: 1280 },
        frameRate: { ideal: 30, max: 30 },
      },
    });
    video.srcObject = stream;
    await video.play();
    if (video.readyState < 2)
      await new Promise((resolve) => video.addEventListener('loadeddata', resolve, { once: true }));
    resizeCanvas();
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
    if (
      poseLandmarker &&
      video.readyState >= 2 &&
      video.currentTime !== lastVideoTime &&
      now - lastInferenceAt >= 80
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
    const width = video.videoWidth || 720;
    const height = video.videoHeight || 1280;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function processPose(landmarks, now) {
    clearCanvas();
    if (!landmarks || !upperBodyVisible(landmarks)) {
      setMessage('Step back until your shoulders and hands are visible.', 'warning');
      return;
    }
    drawSkeleton(landmarks);
    setMessage('Tracking', 'ready');
    if (!canScore()) return;
    detectArm('left', landmarks, now);
    detectArm('right', landmarks, now);
  }

  function upperBodyVisible(landmarks) {
    return [11, 12, 13, 14, 15, 16].every(
      (index) => landmarks[index] && (landmarks[index].visibility ?? 1) > 0.48,
    );
  }

  function drawSkeleton(landmarks) {
    const width = canvas.width;
    const height = canvas.height;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = Math.max(3, width * 0.006);
    context.strokeStyle = 'rgba(255, 55, 48, .92)';
    context.shadowColor = 'rgba(255, 35, 35, .65)';
    context.shadowBlur = 10;
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
      context.arc(point.x * width, point.y * height, Math.max(3, width * 0.007), 0, Math.PI * 2);
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

    if (bend < 128) {
      arm.armed = true;
      arm.minAngle = Math.min(arm.minAngle, bend);
      return;
    }
    if (arm.armed && bend > 158 && arm.minAngle < 128 && now - arm.lastHitAt > 380) {
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

  function registerPunch(code, now) {
    const target = expected[expectedIndex];
    if (!target) return;
    if (target.code !== code) {
      misses++;
      streak = 0;
      flashTarget('miss');
      updateScoreboard();
      return;
    }

    const responseTime = now - targetStartedAt;
    const points = responseTime < 700 ? 1000 : responseTime < 1250 ? 750 : 500;
    score += points + Math.min(streak, 10) * 25;
    streak++;
    hits++;
    expectedIndex++;
    targetStartedAt = now;
    flashTarget('hit');
    updateTarget();
    updateScoreboard();
    if (navigator.vibrate) navigator.vibrate(18);
  }

  function syncWorkout(now) {
    const state = api.workoutState;
    if (
      (lastPhase && state.phase === 'ready' && lastPhase !== 'ready') ||
      (lastPhase === 'complete' && state.phase !== 'complete')
    )
      resetScore();
    lastPhase = state.phase;
    setText($('#padworkClock', stage), state.clock);
    setText($('#padworkPhase', stage), phaseLabel(state));

    if (state.comboRevision !== lastComboRevision) {
      if (lastComboRevision >= 0 && expectedIndex < expected.length && canScore())
        misses += expected.length - expectedIndex;
      lastComboRevision = state.comboRevision;
      setText(
        $('#padworkCallout', stage),
        api.activeCombo.map((move) => move.label).join(' · ') || 'Follow the coach',
      );
      expected = api.activeCombo.map(toTarget).filter(Boolean);
      expectedIndex = 0;
      targetStartedAt = now;
      updateTarget();
      updateScoreboard();
    } else updateTargetStateOnly();
  }

  function toTarget(move) {
    const raw = move.raw;
    if (raw === 1) return { code: 1, name: 'Jab', side: 'Lead hand' };
    if (raw === 2) return { code: 2, name: 'Cross', side: 'Rear hand' };
    return null;
  }

  function canScore() {
    const state = api.workoutState;
    return (
      state.running &&
      state.phase === 'work' &&
      state.comboVisible &&
      expectedIndex < expected.length
    );
  }

  function phaseLabel(state) {
    if (!state.running && state.phase === 'work') return 'Paused';
    if (state.phase === 'work') return `Round ${state.round} of ${state.rounds}`;
    if (state.phase === 'warmup') return 'Warmup';
    if (state.phase === 'rest') return 'Recovery';
    if (state.phase === 'complete') return 'Complete';
    return 'Ready';
  }

  function updateTargetStateOnly() {
    const state = api.workoutState;
    const target = $('#padworkTarget', stage);
    target.classList.toggle('inactive', !canScore());
    if (canScore()) return;
    if (!state.running && state.phase === 'work') setTargetText('Paused', 'Resume workout');
    else if (state.phase === 'work' && !state.comboVisible)
      setTargetText('Get ready', 'Listen for the callout');
    else if (state.phase === 'warmup') setTargetText('Warm up', 'Get loose');
    else if (state.phase === 'rest') setTargetText('Recover', 'Next round soon');
    else if (state.phase === 'complete') setTargetText('Complete', 'Great work');
    else if (state.phase === 'ready') setTargetText('Start round', 'Camera ready');
    else if (!expected.length) setTargetText('Follow callout', 'Unscored move');
  }

  function updateTarget() {
    renderQueue();
    const target = expected[expectedIndex];
    if (target && canScore()) {
      setTargetText(target.name, target.side);
      $('#padworkTarget', stage).classList.remove('inactive');
    } else if (expected.length && expectedIndex >= expected.length) {
      setTargetText('Combo clear', 'Keep your guard up');
      $('#padworkTarget', stage).classList.add('inactive');
    } else updateTargetStateOnly();
  }

  function setTargetText(punch, side) {
    setText($('#padworkPunch', stage), punch);
    setText($('#padworkSide', stage), side);
  }

  function renderQueue() {
    const queue = $('#padworkQueue', stage);
    queue.innerHTML = expected
      .map(
        (target, index) =>
          `<span class="${index < expectedIndex ? 'done' : index === expectedIndex ? 'current' : ''}">${target.name}</span>`,
      )
      .join('');
  }

  function updateScoreboard() {
    const attempts = hits + misses;
    const accuracy = attempts ? Math.round((hits / attempts) * 100) : 100;
    $('#padworkScore', stage).textContent = score.toLocaleString();
    $('#padworkStreak', stage).textContent = String(streak);
    $('#padworkAccuracy', stage).textContent = `${accuracy}%`;
    $('#padworkMeter', stage).style.width = `${accuracy}%`;
  }

  function resetScore() {
    score = 0;
    streak = 0;
    hits = 0;
    misses = 0;
    expected = [];
    expectedIndex = 0;
    lastComboRevision = -1;
    Object.values(arms).forEach((arm) => {
      arm.armed = false;
      arm.minAngle = 180;
      arm.lastHitAt = 0;
    });
    updateScoreboard();
  }

  function flashTarget(className) {
    const target = $('#padworkTarget', stage);
    target.classList.remove('hit', 'miss');
    void target.offsetWidth;
    target.classList.add(className);
    setTimeout(() => target.classList.remove(className), 280);
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
    if (element.textContent !== text) element.textContent = text;
  }

  function setLaunchLabel(label) {
    const status = toggle?.querySelector('b');
    if (status) status.textContent = label;
  }

  function setLaunchError(label) {
    toggle?.classList.add('error');
    setLaunchLabel(label);
    setTimeout(() => {
      if (!active) {
        toggle?.classList.remove('error');
        setLaunchLabel('Enable');
      }
    }, 3500);
  }

  function closeWorkoutDrawer() {
    const drawer = $('#setup');
    if (drawer?.classList.contains('drawer')) $('#openSettings')?.click();
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', () => initialize(), { once: true });
  else initialize();
})();
