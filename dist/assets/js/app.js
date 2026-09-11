import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
(() => {
  // Core combo library and workout defaults.
  const $ = (s) => document.querySelector(s),
    $$ = (s) => [...document.querySelectorAll(s)];
  const names = {
    1: 'Jab',
    2: 'Cross',
    3: 'Lead hook',
    4: 'Rear hook',
    5: 'Lead uppercut',
    6: 'Rear uppercut',
  };
  const combos = [
    { id: 'jab', n: 'Jab', m: [1], types: ['punch'], level: 1 },
    { id: 'double-jab-only', n: 'Double jab', m: [1, 1], types: ['punch'], level: 1 },
    { id: 'one-two', n: 'One two', m: [1, 2], types: ['punch'], level: 1 },
    { id: 'double-jab', n: 'Double jab cross', m: [1, 1, 2], types: ['punch'], level: 1 },
    { id: 'triple-jab', n: 'Triple jab', m: [1, 1, 1], types: ['punch'], level: 1 },
    { id: 'jab-reset', n: 'Jab cross jab', m: [1, 2, 1], types: ['punch'], level: 1 },
    { id: 'jab-rear-hook', n: 'Jab rear hook', m: [1, 4], types: ['punch'], level: 1 },
    { id: 'jab-rear-uppercut', n: 'Jab rear uppercut', m: [1, 6], types: ['punch'], level: 1 },
    {
      id: 'long-jab-hook',
      n: 'Double jab cross hook',
      m: [1, 1, 2, 3],
      types: ['punch'],
      level: 2,
    },
    {
      id: 'body-jab-cross',
      n: 'Body jab cross',
      m: ['body 1', 2],
      types: ['punch', 'body'],
      level: 1,
    },
    { id: 'body-cross', n: 'Jab body cross', m: [1, 'body 2'], types: ['punch', 'body'], level: 1 },
    {
      id: 'jab-cross-body-hook',
      n: 'Jab cross body hook',
      m: [1, 2, 'body 3'],
      types: ['punch', 'body'],
      level: 1,
    },
    {
      id: 'double-jab-body-hook',
      n: 'Double jab rear body hook',
      m: [1, 1, 'body 4'],
      types: ['punch', 'body'],
      level: 1,
    },
    {
      id: 'triple-jab-body-cross',
      n: 'Triple jab body cross',
      m: [1, 1, 1, 'body 2'],
      types: ['punch', 'body'],
      level: 2,
    },
    {
      id: 'jab-body-cross-hook',
      n: 'Jab body cross lead hook',
      m: [1, 'body 2', 3],
      types: ['punch', 'body'],
      level: 2,
    },
    {
      id: 'rear-hook-body-jab',
      n: 'Rear hook body jab',
      m: [4, 'body 1'],
      types: ['punch', 'body'],
      level: 2,
    },
    {
      id: 'basic-slip',
      n: 'Jab slip cross',
      m: [1, 'slip', 2],
      types: ['punch', 'defense'],
      level: 1,
    },
    { id: 'hook-finish', n: 'One two hook', m: [1, 2, 3], types: ['punch'], level: 1 },
    { id: 'hook-cross', n: 'Jab hook cross', m: [1, 3, 2], types: ['punch'], level: 1 },
    {
      id: 'slip-return',
      n: 'Slip and return',
      m: [1, 2, 'slip outside', 2],
      types: ['punch', 'defense'],
      level: 2,
    },
    {
      id: 'roll-return',
      n: 'Hook roll hook cross',
      m: [1, 3, 'roll', 3, 2],
      types: ['punch', 'defense'],
      level: 2,
    },
    {
      id: 'pull-counter',
      n: 'Pull counter',
      m: [1, 2, 'pull', 2],
      types: ['punch', 'defense'],
      level: 2,
    },
    {
      id: 'one-two-slip-six',
      n: 'One two slip rear uppercut',
      m: [1, 2, 'slip lead', 6],
      types: ['punch', 'defense'],
      level: 2,
    },
    {
      id: 'one-two-pull-six',
      n: 'One two pull rear uppercut',
      m: [1, 2, 'pull', 6],
      types: ['punch', 'defense'],
      level: 2,
    },
    {
      id: 'slip-slip-body-upper-hook',
      n: 'Slip slip body hook uppercut hook',
      m: ['slip lead', 'slip rear', 'body 3', 6, 3],
      types: ['punch', 'body', 'defense'],
      level: 2,
    },
    {
      id: 'roll-counter-chain',
      n: 'Cross hook roll counter chain',
      m: [2, 3, 'roll lead', 3, 2, 'roll rear'],
      types: ['punch', 'defense'],
      level: 3,
    },
    {
      id: 'full-defense-chain',
      n: 'Punches into defensive flow',
      m: [1, 2, 3, 'slip lead', 'slip rear', 'roll lead', 'roll rear'],
      types: ['punch', 'defense'],
      level: 3,
    },
    {
      id: 'step-out',
      n: 'One two step out',
      m: [1, 2, 'step out'],
      types: ['punch', 'footwork'],
      level: 1,
    },
    {
      id: 'step-in-jab',
      n: 'Step in jab',
      m: ['step in', 1],
      types: ['punch', 'footwork'],
      level: 1,
    },
    {
      id: 'pivot-exit',
      n: 'One two hook pivot',
      m: [1, 2, 3, 'pivot'],
      types: ['punch', 'footwork'],
      level: 2,
    },
    {
      id: 'angle-out',
      n: 'Combination angle out',
      m: [2, 3, 2, 'angle out'],
      types: ['punch', 'footwork'],
      level: 2,
    },
    {
      id: 'step-back-cross',
      n: 'Cross hook cross step back cross',
      m: [2, 3, 2, 'step back', 2],
      types: ['punch', 'footwork'],
      level: 2,
    },
    {
      id: 'movement-flow',
      n: 'Defensive movement flow',
      m: ['slip lead', 'slip rear', 'roll lead', 'roll rear', 'shuffle back', 'shuffle forward'],
      types: ['defense', 'footwork'],
      level: 2,
    },
    { id: 'uppercuts', n: 'Uppercut combination', m: [1, 6, 3, 2], types: ['punch'], level: 2 },
    {
      id: 'close-body-return',
      n: 'Rear body hook uppercut hook cross',
      m: ['body 4', 6, 3, 2],
      types: ['punch', 'body'],
      level: 3,
    },
    {
      id: 'body-hooks-return',
      n: 'Body hooks cross jab cross',
      m: ['body 4', 'body 3', 2, 1, 2],
      types: ['punch', 'body'],
      level: 3,
    },
    {
      id: 'body-hooks-uppercut',
      n: 'Jab body hooks uppercut jab',
      m: [1, 'body 4', 'body 3', 6, 1],
      types: ['punch', 'body'],
      level: 3,
    },
    {
      id: 'advanced-box',
      n: 'Slip roll exit',
      m: [1, 'slip', 2, 3, 'roll', 3, 2, 'angle out'],
      types: ['punch', 'defense', 'footwork'],
      level: 3,
    },
    {
      id: 'defense-only',
      n: 'Slip roll reset',
      m: ['slip', 'roll', 'guard'],
      types: ['defense'],
      level: 1,
    },
    {
      id: 'movement-only',
      n: 'Step pivot reset',
      m: ['step in', 'pivot', 'step out'],
      types: ['footwork'],
      level: 1,
    },
    {
      id: 'kick-only',
      n: 'Lead rear kick',
      m: ['lead kick', 'rear kick'],
      types: ['kick'],
      level: 1,
    },
    {
      id: 'rear-kick',
      n: 'Cross lead hook rear kick',
      m: [2, 3, 'rear kick'],
      types: ['punch', 'kick'],
      level: 2,
    },
    {
      id: 'jab-kick',
      n: 'Jab cross lead kick',
      m: [1, 2, 'lead kick'],
      types: ['punch', 'kick'],
      level: 1,
    },
    {
      id: 'jab-cross-hook-rear-kick',
      n: 'Jab cross hook rear kick',
      m: [1, 2, 3, 'rear kick'],
      types: ['punch', 'kick'],
      level: 1,
    },
    {
      id: 'double-jab-double-kick',
      n: 'Double jab lead kick rear kick',
      m: [1, 1, 'lead kick', 'rear kick'],
      types: ['punch', 'kick'],
      level: 2,
    },
    {
      id: 'cross-hook-cross-lead-kick',
      n: 'Cross hook cross lead kick',
      m: [2, 3, 2, 'lead kick'],
      types: ['punch', 'kick'],
      level: 2,
    },
    {
      id: 'jab-cross-jab-rear-kick',
      n: 'Jab cross jab rear kick',
      m: [1, 2, 1, 'rear kick'],
      types: ['punch', 'kick'],
      level: 2,
    },
    {
      id: 'mixed-kick-chain',
      n: 'Jab lead kick cross rear hook rear kick',
      m: [1, 'lead kick', 2, 4, 'rear kick'],
      types: ['punch', 'kick'],
      level: 3,
    },
    {
      id: 'advanced-kick-chain',
      n: 'Front kick step punches elbow hook rear kick',
      m: ['front kick', 'step in', 2, 3, 'rear elbow', 3, 'rear kick'],
      types: ['punch', 'kick', 'knee', 'footwork'],
      level: 3,
    },
    {
      id: 'kick-return',
      n: 'Check and return',
      m: ['check kick', 2, 3, 'rear kick'],
      types: ['defense', 'punch', 'kick'],
      level: 3,
    },
    {
      id: 'uppercut-speed',
      n: 'Jab cross lead uppercut rear uppercut',
      m: [1, 2, 5, 6],
      types: ['punch'],
      level: 2,
    },
    {
      id: 'knees-only',
      n: 'Lead rear knee',
      m: ['lead knee', 'rear knee'],
      types: ['knee'],
      level: 1,
    },
    {
      id: 'knee-entry',
      n: 'Punches to knee',
      m: [1, 2, 3, 'rear knee'],
      types: ['punch', 'knee'],
      level: 2,
    },
    {
      id: 'elbow-exit',
      n: 'Elbow and exit',
      m: [2, 'lead elbow', 'step out'],
      types: ['punch', 'knee', 'footwork'],
      level: 2,
    },
    {
      id: 'clinch-work',
      n: 'Knee elbow combination',
      m: ['lead knee', 'rear knee', 'lead elbow'],
      types: ['knee'],
      level: 3,
    },
  ];
  let customCombos = [];
  try {
    const stored = JSON.parse(localStorage.getItem('cornerwork-custom-combos'));
    if (Array.isArray(stored))
      customCombos = stored.filter(
        (c) => c && c.id && c.n && Array.isArray(c.m) && Array.isArray(c.types),
      );
  } catch (e) {}
  combos.push(...customCombos);
  const bodyComboIds = [
    'body-jab-cross',
    'body-cross',
    'jab-cross-body-hook',
    'double-jab-body-hook',
    'triple-jab-body-cross',
    'jab-body-cross-hook',
    'rear-hook-body-jab',
    'close-body-return',
    'body-hooks-return',
    'body-hooks-uppercut',
  ];
  const catalogAdditions = [
    'one-two-slip-six',
    'one-two-pull-six',
    'slip-slip-body-upper-hook',
    'roll-counter-chain',
    'full-defense-chain',
    'step-in-jab',
    'step-back-cross',
    'movement-flow',
    'jab-cross-hook-rear-kick',
    'double-jab-double-kick',
    'cross-hook-cross-lead-kick',
    'jab-cross-jab-rear-kick',
    'mixed-kick-chain',
    'advanced-kick-chain',
    'uppercut-speed',
  ];
  const clockFonts = {
    league: '"Cornerwork League Spartan"',
    montserrat: '"Cornerwork Montserrat"',
    barlow: '"Cornerwork Barlow Condensed"',
    allerta: '"Allerta Stencil"',
    keania: '"Keania One"',
  };
  const headerIcons = {
    bold: 'assets/icons/icon.png',
    inset: 'assets/icons/apple-touch-icon.png',
  };
  const displayDefaults = { clockSize: 100, calloutSize: 100, clockFont: 'league' };
  const soundDefaults = {
    warning: {
      warningSound: 'wood',
      warningVolume: 150,
      warningHits: 2,
      warningSpacing: 200,
      warningPitch: 75,
    },
    start: {
      roundStartSound: 'classic',
      roundStartVolume: 100,
      roundStartHits: 1,
      roundStartSpacing: 300,
      roundStartPitch: 100,
      roundStartDecay: 1000,
    },
    end: {
      roundEndSound: 'boxing',
      roundEndVolume: 100,
      roundEndHits: 2,
      roundEndSpacing: 300,
      roundEndPitch: 100,
      roundEndDecay: 1100,
    },
  };
  let settings = {
    comboCatalogVersion: 3,
    roundStartDefaultV2: true,
    wordSpeechRateScaleV2: true,
    speechGapControlsV2: true,
    trainingMode: 'bag',
    structured: 'off',
    focusedDrill: null,
    skill: 'basic',
    complexity: 'low',
    repeats: 'none',
    movementBetween: 'off',
    progressiveCombos: false,
    technicalThemes: false,
    unique: 'yes',
    focusEnabled: 'no',
    focuses: ['jabs', 'short', 'mixed'],
    stance: 'orthodox',
    format: 'numbers',
    displayMode: 'standard',
    headerIconStyle: 'bold',
    brandLayout: 'compact',
    compactRoundLabels: false,
    shortcutLabels: true,
    sidebarShortcuts: false,
    showFullscreen: false,
    voice: true,
    speechRate: 5,
    wordSpeechRate: 5,
    targetGap: 0,
    wordMoveGap: 90,
    volume: 80,
    ...displayDefaults,
    clapperEnabled: true,
    clapperTime: '10',
    ...soundDefaults.warning,
    ...soundDefaults.start,
    ...soundDefaults.end,
    showTimeLeft: true,
    secondary: false,
    coachCues: false,
    cueFrequency: 5,
    recoveryInstructions: false,
    guidedBeginner: false,
    haptics: true,
    highContrast: false,
    buttonTextBrightness: 98,
    whiteOutlineText: false,
    accentColor: 'red',
    includeTypes: ['punch', 'defense', 'footwork'],
    workout: { rounds: 6, warmupTime: 45, roundTime: 180, restTime: 30, pace: 6 },
    allowedCombos: null,
    shortcuts: { start: 'Space', next: 'N', restart: 'R', mute: 'M' },
  };
  const appleMobile =
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let running = false,
    phase = 'ready',
    round = 1,
    time = 180,
    tick = null,
    comboTick = null,
    primaryHoldTimer = null,
    primaryHoldTriggered = false,
    primaryHoldResetTimer = null,
    wakeLock = null,
    wakeLockPending = false,
    audioContext = null,
    speechTimers = [],
    speechSequence = 0,
    soundTimers = [],
    current = [],
    focusedAssignment = null,
    focusedAssignmentIndex = -1,
    focusedAssignmentDeck = [],
    focusedAssignmentDrillId = '',
    betweenCue = '',
    pendingMovement = '',
    comboVisible = true,
    roundAnnouncementActive = false,
    lastKey = '',
    roundUsed = new Set(),
    repeatLeft = 0,
    comboTotal = 0,
    moveTotal = 0,
    locked = new Set(combos.map((c) => c.id)),
    focusPlan = {},
    blockPlan = {},
    blockIndex = 0,
    combosSinceCue = 0,
    punchOutActive = false,
    punchOutAt = -1,
    punchOutUntil = -1,
    workoutStartedAt = 0,
    activeSeconds = 0,
    completionReported = false;
  function val(id) {
    const el = $('#' + id);
    return el.classList.contains('time-input') ? +(el.dataset.seconds || 0) : +el.value;
  }
  function restAfterRound(roundNumber) {
    const schedule = settings.workout?.restSchedule,
      value = Array.isArray(schedule) ? +schedule[roundNumber - 1] : NaN;
    return Number.isFinite(value) ? Math.max(0, value) : val('restTime');
  }
  function restTotal(firstRound = 1, lastRound = val('rounds') - 1) {
    let total = 0;
    for (
      let currentRound = Math.max(1, firstRound);
      currentRound <= Math.min(lastRound, val('rounds') - 1);
      currentRound++
    )
      total += restAfterRound(currentRound);
    return total;
  }
  function saveSettings() {
    try {
      localStorage.setItem('cornerwork-settings', JSON.stringify(settings));
    } catch (e) {}
  }
  const presetFields = [
    'trainingMode',
    'structured',
    'focusedDrill',
    'skill',
    'complexity',
    'repeats',
    'movementBetween',
    'progressiveCombos',
    'technicalThemes',
    'unique',
    'focusEnabled',
    'stance',
    'format',
    'displayMode',
    'compactRoundLabels',
    'speechRate',
    'wordSpeechRate',
    'targetGap',
    'wordMoveGap',
    'clockSize',
    'clockFont',
    'calloutSize',
    'clapperEnabled',
    'clapperTime',
    'warningSound',
    'warningVolume',
    'warningHits',
    'warningSpacing',
    'warningPitch',
    'roundStartSound',
    'roundStartVolume',
    'roundStartHits',
    'roundStartSpacing',
    'roundStartPitch',
    'roundStartDecay',
    'roundEndSound',
    'roundEndVolume',
    'roundEndHits',
    'roundEndSpacing',
    'roundEndPitch',
    'roundEndDecay',
    'coachCues',
    'cueFrequency',
    'recoveryInstructions',
    'guidedBeginner',
    'haptics',
    'highContrast',
  ];
  let presets = [];
  try {
    const stored = JSON.parse(localStorage.getItem('cornerwork-presets'));
    if (Array.isArray(stored))
      presets = stored.map((p) => ({ ...p, updatedAt: Number(p.updatedAt) || 0 }));
  } catch (e) {}
  // Optional account sync and saved workout persistence.
  const firebaseConfig = {
    apiKey: 'AIzaSyBauaNiL69nGyj_ZJiZB91ienhipHGjU1M',
    authDomain: 'cornerwork-c8e9b.firebaseapp.com',
    projectId: 'cornerwork-c8e9b',
    storageBucket: 'cornerwork-c8e9b.firebasestorage.app',
    messagingSenderId: '420962558840',
    appId: '1:420962558840:web:91b294b3e3db551fe49e8d',
  };
  const googleClientId = '420962558840-fisu6dai881btckmoi34pqg5a6f7j678.apps.googleusercontent.com';
  let auth = null,
    db = null,
    cloudUser = null,
    cloudReady = false,
    cloudUnsubscribe = null,
    googleButtonReady = false;
  const cloudDeletes = new Set(),
    programProgressDocument = '__program_progress__';
  function workoutSnapshot() {
    const config = {};
    presetFields.forEach((k) => (config[k] = settings[k]));
    config.focuses = [...settings.focuses];
    config.includeTypes = [...settings.includeTypes];
    config.workout = { ...settings.workout };
    config.allowedCombos = Array.isArray(settings.allowedCombos)
      ? [...settings.allowedCombos]
      : null;
    return config;
  }
  function applyWorkout(config) {
    if (!config || typeof config !== 'object') return false;
    if (!('focusedDrill' in config)) settings.focusedDrill = null;
    presetFields.forEach((k) => {
      if (k in config) settings[k] = config[k];
    });
    if (Array.isArray(config.focuses)) settings.focuses = [...config.focuses];
    if (config.punchOuts) {
      settings.focuses = [
        ...new Set([
          ...(settings.focuses || []),
          Number(config.punchOutDuration) >= 30 ? 'punchout30' : 'punchout15',
        ]),
      ];
      settings.focusEnabled = 'yes';
    }
    if (Array.isArray(config.includeTypes) && config.includeTypes.length)
      settings.includeTypes = [...config.includeTypes];
    if (config.workout && typeof config.workout === 'object') {
      settings.workout = { ...settings.workout, ...config.workout };
      if (!Array.isArray(config.workout.restSchedule)) delete settings.workout.restSchedule;
    }
    if (config.allowedCombos === null || Array.isArray(config.allowedCombos))
      settings.allowedCombos = config.allowedCombos === null ? null : [...config.allowedCombos];
    saveSettings();
    return true;
  }
  function savePresets() {
    try {
      localStorage.setItem('cornerwork-presets', JSON.stringify(presets));
    } catch (e) {}
  }
  function normalizeProgramProgress(value) {
    const normalized = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return normalized;
    Object.entries(value).forEach(([programId, sessions]) => {
      const indexes = Array.isArray(sessions)
        ? sessions.map(Number)
        : Array.from({ length: Math.max(0, Number(sessions) || 0) }, (_, index) => index);
      normalized[programId] = [
        ...new Set(indexes.filter((index) => Number.isInteger(index) && index >= 0)),
      ].sort((a, b) => a - b);
    });
    return normalized;
  }
  function mergeProgramProgress(local, remote) {
    const merged = normalizeProgramProgress(local);
    Object.entries(normalizeProgramProgress(remote)).forEach(([programId, sessions]) => {
      merged[programId] = [...new Set([...(merged[programId] || []), ...sessions])].sort(
        (a, b) => a - b,
      );
    });
    return merged;
  }
  function readProgramProgressLocal() {
    try {
      return normalizeProgramProgress(
        JSON.parse(localStorage.getItem('cornerwork-program-progress')),
      );
    } catch (e) {
      return {};
    }
  }
  function sameProgramProgress(left, right) {
    left = normalizeProgramProgress(left);
    right = normalizeProgramProgress(right);
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    return [...keys].every((key) => (left[key] || []).join(',') === (right[key] || []).join(','));
  }
  function saveProgramProgressLocal(progress) {
    const normalized = normalizeProgramProgress(progress);
    try {
      localStorage.setItem('cornerwork-program-progress', JSON.stringify(normalized));
    } catch (e) {}
    return normalized;
  }
  function cloudStatus(title, detail, error = false) {
    const el = $('#cloudStatus');
    el.classList.toggle('cloud-error', error);
    $('#cloudAccount').classList.toggle('connected', !!cloudUser && !error);
    el.innerHTML = '<strong>' + safeText(title) + '</strong>' + safeText(detail);
  }
  async function savePresetToCloud(preset) {
    if (!cloudUser || !db) return;
    try {
      await setDoc(doc(db, 'users', cloudUser.uid, 'workouts', preset.id), {
        name: preset.name,
        config: preset.config,
        note: preset.note || '',
        favorite: !!preset.favorite,
        updatedAt: preset.updatedAt || Date.now(),
      });
      cloudStatus('Workouts and progress synced', cloudUser.email || 'Google account connected');
    } catch (e) {
      cloudStatus('Sync needs setup', 'Check Firebase configuration', true);
    }
  }
  async function saveProgramProgressToCloud(progress) {
    if (!cloudUser || !db) return;
    try {
      await setDoc(doc(db, 'users', cloudUser.uid, 'workouts', programProgressDocument), {
        type: 'program-progress',
        progress: normalizeProgramProgress(progress),
        updatedAt: Date.now(),
      });
      cloudStatus('Workouts and progress synced', cloudUser.email || 'Google account connected');
    } catch (e) {
      cloudStatus('Progress saved on this device', 'Cloud progress sync is unavailable', true);
    }
  }
  async function deletePresetFromCloud(id) {
    if (!cloudUser || !db) return;
    cloudDeletes.add(id);
    try {
      await deleteDoc(doc(db, 'users', cloudUser.uid, 'workouts', id));
    } catch (e) {
      cloudStatus('Could not delete from cloud', 'Saved locally on this device', true);
    } finally {
      setTimeout(() => cloudDeletes.delete(id), 1500);
    }
  }
  function beginCloudSync(user) {
    if (cloudUnsubscribe) cloudUnsubscribe();
    cloudUser = user;
    cloudReady = false;
    cloudStatus('Syncing workouts and progress…', user.email || 'Google account connected');
    const ref = collection(db, 'users', user.uid, 'workouts');
    cloudUnsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const progressSnapshot = snapshot.docs.find((item) => item.id === programProgressDocument),
          remoteProgress = normalizeProgramProgress(progressSnapshot?.data()?.progress),
          mergedProgress = mergeProgramProgress(readProgramProgressLocal(), remoteProgress),
          cloud = snapshot.docs
            .filter((item) => item.id !== programProgressDocument)
            .map((item) => ({
              id: item.id,
              ...item.data(),
              updatedAt: Number(item.data().updatedAt) || 0,
            }))
            .filter((preset) => preset.name && preset.config && !cloudDeletes.has(preset.id));
        const merged = new Map(cloud.map((preset) => [preset.id, preset]));
        presets.forEach((local) => {
          const remote = merged.get(local.id);
          if (!remote || Number(local.updatedAt) >= Number(remote.updatedAt))
            merged.set(local.id, local);
        });
        presets = [...merged.values()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        savePresets();
        renderPresets();
        saveProgramProgressLocal(mergedProgress);
        window.dispatchEvent(
          new CustomEvent('cornerwork-program-progress-sync', { detail: mergedProgress }),
        );
        cloudReady = true;
        cloudStatus('Workouts and progress synced', user.email || 'Google account connected');
        const remoteIds = new Set(cloud.map((preset) => preset.id));
        presets.filter((preset) => !remoteIds.has(preset.id)).forEach(savePresetToCloud);
        if (!sameProgramProgress(remoteProgress, mergedProgress))
          saveProgramProgressToCloud(mergedProgress);
      },
      () => cloudStatus('Cloud sync unavailable', 'Workouts and progress still save here', true),
    );
  }
  async function acceptGoogleCredential(response) {
    if (!response?.credential || !auth) return;
    cloudStatus('Signing in…', 'Connecting workouts and program progress');
    try {
      const result = await signInWithCredential(
        auth,
        GoogleAuthProvider.credential(response.credential),
      );
      if (result.user) beginCloudSync(result.user);
    } catch (e) {
      cloudStatus('Could not sign in', 'Please try again', true);
    }
  }
  function initGoogleSignIn() {
    if (googleButtonReady || !auth) return;
    if (!window.google?.accounts?.id) {
      $('#googleIdentityScript').addEventListener('load', initGoogleSignIn, { once: true });
      return;
    }
    google.accounts.id.initialize({
      client_id: googleClientId,
      callback: acceptGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    google.accounts.id.renderButton($('#googleSignIn'), {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: 'signin_with',
      logo_alignment: 'left',
      width: 250,
    });
    googleButtonReady = true;
  }
  function initCloud() {
    try {
      const app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      initGoogleSignIn();
      onAuthStateChanged(auth, (user) => {
        if (user) {
          $('#googleSignIn').classList.add('hidden');
          $('#googleSignOut').classList.remove('hidden');
          beginCloudSync(user);
        } else {
          if (cloudUnsubscribe) {
            cloudUnsubscribe();
            cloudUnsubscribe = null;
          }
          cloudUser = null;
          cloudReady = false;
          $('#googleSignIn').classList.remove('hidden');
          $('#googleSignOut').classList.add('hidden');
          cloudStatus('Saved on this device', 'Google sign-in is optional');
          initGoogleSignIn();
        }
      });
    } catch (e) {
      cloudStatus(
        'Cloud sync unavailable',
        'Workouts and progress still save on this device',
        true,
      );
    }
  }
  function shareCode(value) {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function readShare(code) {
    try {
      const binary = atob(code.replace(/-/g, '+').replace(/_/g, '/')),
        bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (e) {
      return null;
    }
  }
  function safeText(value) {
    return String(value).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }
  function renderPresets() {
    const list = $('#presetList');
    if (!presets.length) {
      list.innerHTML = '<div class="preset-empty">Your saved workouts will appear here.</div>';
      return;
    }
    list.innerHTML = presets
      .map(
        (p) =>
          '<div class="preset-item"><span class="preset-name" title="' +
          safeText(p.name) +
          '">' +
          safeText(p.name) +
          '</span><span class="preset-actions"><button data-load="' +
          p.id +
          '">Load</button><button data-share="' +
          p.id +
          '">Share</button><button class="delete-preset" data-delete="' +
          p.id +
          '" aria-label="Delete ' +
          safeText(p.name) +
          '">×</button></span></div>',
      )
      .join('');
    list.querySelectorAll('[data-load]').forEach(
      (b) =>
        (b.onclick = () => {
          const p = presets.find((x) => x.id === b.dataset.load);
          if (p && applyWorkout(p.config)) location.reload();
        }),
    );
    list.querySelectorAll('[data-share]').forEach(
      (b) =>
        (b.onclick = async () => {
          const p = presets.find((x) => x.id === b.dataset.share);
          if (!p) return;
          const url =
            location.origin +
            location.pathname +
            '#workout=' +
            shareCode({ name: p.name, config: p.config });
          try {
            await navigator.clipboard.writeText(url);
            const old = b.textContent;
            b.textContent = 'Copied';
            setTimeout(() => (b.textContent = old), 1400);
          } catch (e) {
            prompt('Copy this workout link', url);
          }
        }),
    );
    list.querySelectorAll('[data-delete]').forEach(
      (b) =>
        (b.onclick = () => {
          const p = presets.find((x) => x.id === b.dataset.delete);
          if (p && confirm('Delete "' + p.name + '"?')) {
            presets = presets.filter((x) => x.id !== p.id);
            savePresets();
            deletePresetFromCloud(p.id);
            renderPresets();
            render();
          }
        }),
    );
  }
  async function syncWakeLock() {
    if (!('wakeLock' in navigator)) return;
    if (running && document.visibilityState === 'visible') {
      if (wakeLock || wakeLockPending) return;
      wakeLockPending = true;
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (running && document.visibilityState === 'visible') {
          wakeLock = lock;
          lock.addEventListener('release', () => {
            if (wakeLock === lock) wakeLock = null;
          });
        } else await lock.release();
      } catch (e) {
      } finally {
        wakeLockPending = false;
      }
    } else if (wakeLock) {
      const lock = wakeLock;
      wakeLock = null;
      try {
        await lock.release();
      } catch (e) {}
    }
  }
  function fmt(s) {
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function parseTime(raw) {
    const text = String(raw).trim();
    if (/^\d+:\d{1,2}$/.test(text)) {
      const [m, s] = text.split(':').map(Number);
      return m * 60 + s;
    }
    const n = Number(text);
    return Number.isFinite(n) ? n : null;
  }
  function totalFmt(s) {
    const h = Math.floor(s / 3600),
      m = Math.floor((s % 3600) / 60),
      sec = s % 60;
    return h
      ? h + ':' + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0')
      : m + ':' + String(sec).padStart(2, '0');
  }
  function isOn(id) {
    return $('#' + id).classList.contains('on');
  }
  function orient(text) {
    const lead = settings.stance === 'southpaw' ? 'Right' : 'Left',
      rear = settings.stance === 'southpaw' ? 'Left' : 'Right';
    return text.replace(/\bLead\b/g, lead).replace(/\bRear\b/g, rear);
  }
  function phrase(x) {
    let text;
    if (typeof x === 'number') text = names[x];
    else if (x.startsWith('body ')) text = names[+x.slice(-1)] + ' to body';
    else text = x.replace(/\b\w/g, (c) => c.toUpperCase());
    return orient(text);
  }
  function numbered(x) {
    if (typeof x === 'number') return String(x);
    if (x.startsWith('body ')) return x.slice(-1) + ' Body';
    if (x.startsWith('head ')) return x.slice(-1) + ' Head';
    return phrase(x);
  }
  function spoken(c) {
    return c.map(settings.format === 'numbers' ? numbered : phrase).join(', ');
  }
  function displayKey(k) {
    return k === 'Space' ? 'Space' : k.replace('Arrow', '');
  }
  function keyOf(c) {
    return c.join('|');
  }
  function included() {
    return new Set($$('#include .active').map((b) => b.dataset.type));
  }
  function selectedLevel() {
    return { basic: 1, intermediate: 2, advanced: 3 }[settings.skill];
  }
  function visibleCombos() {
    const inc = included(),
      level = selectedLevel();
    return combos.filter((c) => c.level <= level && c.types.every((t) => inc.has(t)));
  }
  const defenseMove = (x) =>
      typeof x === 'string' && /(slip|roll|pull|block|parry|check|catch)/i.test(x),
    footworkMove = (x) =>
      typeof x === 'string' && /(step|pivot|circle|angle|shuffle|cut off)/i.test(x),
    bodyMove = (x) => typeof x === 'string' && x.startsWith('body '),
    punchMove = (x) =>
      typeof x === 'number' || bodyMove(x) || (typeof x === 'string' && x.startsWith('head '));
  function movementCompatible(c, movement) {
    if (!movement) return true;
    if (movement === 'circle' || movement === 'angle') return c.types.includes('footwork');
    if (movement === 'head') return c.types.includes('defense');
    if (movement === 'attack' || movement === 'feint') return c.types.includes('punch');
    return true;
  }
  function equipmentWeight(c) {
    if (settings.trainingMode === 'bag') {
      let weight = 1;
      if (c.types.includes('body')) weight += 2;
      if (c.m.some((x) => [2, 3, 4, 5, 6, 'body 2', 'body 3', 'body 4'].includes(x))) weight += 1.2;
      if (matchesFocus(c, 'inside')) weight += 0.8;
      if (c.types.includes('footwork')) weight *= 0.65;
      if (c.types.includes('defense')) weight *= 0.8;
      return Math.max(0.25, weight);
    }
    if (settings.trainingMode === 'shadow') {
      let weight = 1;
      if (c.types.includes('defense')) weight += 2;
      if (c.types.includes('footwork')) weight += 2;
      if (matchesFocus(c, 'enterexit') || matchesFocus(c, 'finishfootwork')) weight += 1;
      if (matchesFocus(c, 'inside')) weight *= 0.7;
      return Math.max(0.3, weight);
    }
    return 1;
  }
  function equipmentSubset(pool) {
    if (settings.trainingMode === 'general' || pool.length < 2) return pool;
    const preferred = pool.filter((c) =>
        settings.trainingMode === 'bag'
          ? c.types.includes('body') ||
            matchesFocus(c, 'inside') ||
            (!c.types.includes('defense') && !c.types.includes('footwork'))
          : c.types.includes('defense') || c.types.includes('footwork'),
      ),
      other = pool.filter((c) => !preferred.includes(c));
    if (preferred.length < 2 || !other.length) return pool;
    return Math.random() < 0.75 ? preferred : other;
  }
  function weightedPick(pool) {
    const weights = pool.map(equipmentWeight),
      total = weights.reduce((sum, value) => sum + value, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }
  // Combo filtering, weighting, and focus planning.
  function available() {
    const inc = included(),
      level = selectedLevel(),
      max = { low: 3, medium: 5, high: 9 }[settings.complexity];
    let pool = combos.filter(
      (c) =>
        c.level <= level &&
        c.m.length <= max &&
        c.types.every((t) => inc.has(t)) &&
        locked.has(c.id),
    );
    if (!pool.length)
      pool = combos.filter((c) => c.types.every((t) => inc.has(t)) && locked.has(c.id));
    const focuses = activeFocuses();
    if (focuses.length && !focuses.includes('freestyle')) {
      const focused = pool.filter((c) => focuses.some((f) => matchesFocus(c, f)));
      if (focused.length) pool = focused;
    }
    if (settings.progressiveCombos) {
      const total = Math.max(1, val('rounds')),
        cap = Math.min(
          max,
          2 + Math.floor(((round - 1) * Math.max(0, max - 2)) / Math.max(1, total - 1)),
        ),
        floor = Math.max(1, cap - 1),
        progressive = pool.filter((c) => c.m.length >= floor && c.m.length <= cap);
      if (progressive.length) pool = progressive;
    }
    if (pendingMovement) {
      const compatible = pool.filter((c) => movementCompatible(c, pendingMovement));
      if (compatible.length) pool = compatible;
    }
    return pool;
  }
  function activeFocuses() {
    if (settings.structured !== 'off' && phase === 'work')
      return blockPlan[round]?.[blockIndex] || [];
    return focusPlan[round] || [];
  }
  function matchesFocus(c, f) {
    const firstBody = c.m.findIndex(bodyMove),
      lastBody = c.m.findLastIndex
        ? c.m.findLastIndex(bodyMove)
        : c.m.map(bodyMove).lastIndexOf(true),
      firstDefense = c.m.findIndex(defenseMove),
      last = c.m[c.m.length - 1];
    if (f === 'jabs') return c.m.filter((x) => x === 1 || x === 'body 1').length >= 2;
    if (f === 'straight')
      return c.m.some((x) => x === 1 || x === 2 || x === 'body 1' || x === 'body 2');
    if (f === 'hooks')
      return c.m.some((x) => x === 3 || x === 4 || x === 'body 3' || x === 'body 4');
    if (f === 'short' || f === 'speed') return c.m.length <= 3;
    if (f === 'mixed') return c.types.length > 1 || c.m.length >= 3;
    if (f === 'explosive' || f === 'punchout15' || f === 'punchout30')
      return c.m.length >= 2 && c.m.length <= 3 && c.types.includes('punch');
    if (f === 'high') return c.m.length >= 3;
    if (f === 'power')
      return c.m.some((x) => [2, 3, 4, 'body 3', 'body 4', 'rear kick'].includes(x));
    if (f === 'defense') return c.types.includes('defense');
    if (f === 'footwork' || f === 'movement') return c.types.includes('footwork');
    if (f === 'body') return firstBody >= 0;
    if (f === 'headbody') return firstBody > 0 && c.m.slice(0, firstBody).some(punchMove);
    if (f === 'bodyhead') return lastBody >= 0 && c.m.slice(lastBody + 1).some(punchMove);
    if (f === 'enterexit')
      return (
        c.m.some((x) => typeof x === 'string' && /step in/i.test(x)) &&
        c.m.some((x) => typeof x === 'string' && /(step out|pivot|angle)/i.test(x))
      );
    if (f === 'counterdefense')
      return firstDefense >= 0 && c.m.slice(firstDefense + 1).some(punchMove);
    if (f === 'finishdefense') return defenseMove(last);
    if (f === 'finishfootwork') return footworkMove(last);
    if (f === 'doublelead')
      return c.m.filter((x) => [1, 3, 5, 'body 1', 'body 3'].includes(x)).length >= 2;
    if (f === 'rearcounter')
      return (
        firstDefense >= 0 &&
        c.m.slice(firstDefense + 1).some((x) => [2, 4, 6, 'body 2', 'body 4'].includes(x))
      );
    if (f === 'backward')
      return (
        c.m.some((x) => typeof x === 'string' && /(step back|step out)/i.test(x)) &&
        c.types.includes('punch')
      );
    if (f === 'cutoff')
      return (
        c.m.some(
          (x) => typeof x === 'string' && /(pivot|circle|angle|step (left|right))/i.test(x),
        ) && c.types.includes('punch')
      );
    if (f === 'longrange')
      return c.m.some((x) => x === 1 || x === 2) && !c.m.some((x) => [3, 4, 5, 6].includes(x));
    if (f === 'uppercuts') return c.m.some((x) => x === 5 || x === 6);
    if (f === 'inside')
      return c.m.some((x) =>
        [
          3,
          4,
          5,
          6,
          'body 3',
          'body 4',
          'lead knee',
          'rear knee',
          'lead elbow',
          'rear elbow',
        ].includes(x),
      );
    if (f === 'kicks') return c.types.includes('kick');
    if (f === 'kickmix') return c.types.includes('kick') && c.types.includes('punch');
    if (f === 'knees') return c.types.includes('knee');
    if (f === 'kickflow') return c.types.includes('kick') && c.m.length >= 3;
    if (f === 'freestyle') return true;
    return false;
  }
  function focusName(f) {
    return (
      {
        jabs: 'Focus jabs',
        straight: 'Straight punches',
        hooks: 'Hooks',
        short: 'Short combos',
        mixed: 'Mix up combos',
        explosive: 'Explosive bursts',
        punchout15: 'Punch-out · 15 sec',
        punchout30: 'Punch-out · 30 sec',
        high: 'High intensity',
        speed: 'Speed',
        power: 'Power',
        defense: 'Defense & counters',
        footwork: 'Footwork & angles',
        movement: 'Movement',
        body: 'Body work',
        headbody: 'Head-to-body',
        bodyhead: 'Body-to-head',
        enterexit: 'Enter and exit',
        counterdefense: 'Counter after defense',
        finishdefense: 'Finish with defense',
        finishfootwork: 'Finish with footwork',
        doublelead: 'Double lead hand',
        rearcounter: 'Rear-hand counters',
        backward: 'Moving backward',
        cutoff: 'Cut off the ring',
        longrange: 'Long-range boxing',
        uppercuts: 'Uppercuts',
        inside: 'Inside fighting',
        kicks: 'Kicks',
        kickmix: 'Punch-to-kick',
        knees: 'Knees and elbows',
        kickflow: 'Kickboxing flow',
        freestyle: 'Freestyle',
      }[f] || f
    );
  }
  function shortFocusName(f) {
    return (
      {
        jabs: 'Jabs',
        straight: 'Straights',
        hooks: 'Hooks',
        short: 'Short',
        mixed: 'Mix',
        explosive: 'Burst',
        punchout15: '15s PO',
        punchout30: '30s PO',
        high: 'High',
        speed: 'Speed',
        power: 'Power',
        defense: 'Defense',
        footwork: 'Angles',
        movement: 'Move',
        body: 'Body',
        headbody: 'Head/body',
        bodyhead: 'Body/head',
        enterexit: 'In/out',
        counterdefense: 'Counter',
        finishdefense: 'Def. finish',
        finishfootwork: 'Move finish',
        doublelead: 'Lead hand',
        rearcounter: 'Rear counter',
        backward: 'Back foot',
        cutoff: 'Cut ring',
        longrange: 'Long range',
        uppercuts: 'Uppers',
        inside: 'Inside',
        kicks: 'Kicks',
        kickmix: 'Kick mix',
        knees: 'Knees',
        kickflow: 'Kick flow',
        freestyle: 'Free',
      }[f] || f
    );
  }
  function callCombo(combo, options) {
    comboTotal++;
    moveTotal += combo.length;
    $('#comboTotal').textContent = comboTotal;
    $('#moveTotal').textContent = moveTotal;
    sayCombo(combo, options);
  }
  const standardCues = [
      'Hands back to guard',
      'Move after the combination',
      'Change levels',
      'Relax your shoulders',
      'Breathe with every punch',
      'Finish with an angle',
    ],
    bagCues = [
      'Turn the punch over',
      'Drive through the target',
      'Do not push the bag',
      'Reset after the power shot',
      'Keep the bag under control',
    ],
    shadowCues = [
      'Visualize your opponent',
      'Stay balanced while moving',
      'Finish at an angle',
      'Keep your feet under you',
      'Make the defense small',
    ],
    beginnerCues = [
      'Keep your chin tucked',
      'Return every punch to guard',
      'Stay balanced',
      'Exhale on each punch',
      'Keep your hands relaxed',
    ],
    movementCues = [
      ['Circle left', 'circle'],
      ['Circle right', 'circle'],
      ['Reset your stance', 'reset'],
      ['Move your head', 'head'],
      ['Step out', 'attack'],
      ['Change angle', 'angle'],
      ['Feint', 'feint'],
      ['Keep your guard up', 'guard'],
    ],
    recoveryCues = [
      'Breathe slowly',
      'Shake out your shoulders',
      'Reset your stance',
      'Stay loose',
      'Deep breath and recover',
      'Keep moving lightly',
    ];
  // Spoken coaching, cadence, and workout audio.
  function deliverCombo(combo, options = {}) {
    combosSinceCue++;
    const frequency = Math.max(2, +settings.cueFrequency || 5),
      modeCues =
        settings.trainingMode === 'bag'
          ? bagCues
          : settings.trainingMode === 'shadow'
            ? shadowCues
            : standardCues,
      cuePool = settings.guidedBeginner ? beginnerCues : modeCues,
      probability =
        { off: 0, occasional: 0.2, balanced: 0.4, often: 0.65 }[settings.movementBetween] || 0,
      canSpeak = isOn('voice') && settings.volume > 0 && 'speechSynthesis' in window,
      movement =
        canSpeak && Math.random() < probability
          ? movementCues[Math.floor(Math.random() * movementCues.length)]
          : null,
      cueDue = !movement && settings.coachCues && combosSinceCue >= frequency && canSpeak,
      post = movement
        ? movement[0]
        : cueDue
          ? cuePool[Math.floor(Math.random() * cuePool.length)]
          : '';
    if (movement) pendingMovement = movement[1];
    if (cueDue) combosSinceCue = 0;
    callCombo(combo, {
      ...options,
      onend: () => {
        options.onend?.();
        const finish = () => {
          if (options.schedule !== false && running && phase === 'work') beginComboCadence();
        };
        if (post && running && phase === 'work') {
          betweenCue = post;
          renderCombo();
          say(post, finish);
        } else finish();
      },
    });
  }
  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }
  function buildFocusPlan() {
    focusPlan = {};
    blockPlan = {};
    blockIndex = 0;
    if (activeFocusedDrill() || settings.focusEnabled !== 'yes' || !settings.focuses.length) return;
    const inc = included(),
      level = selectedLevel(),
      max = { low: 3, medium: 5, high: 9 }[settings.complexity],
      valid = settings.focuses.filter(
        (f) =>
          (f !== 'power' || settings.trainingMode === 'bag') &&
          (f === 'freestyle' ||
            combos.some(
              (c) =>
                c.level <= level &&
                c.m.length <= max &&
                c.types.every((t) => inc.has(t)) &&
                locked.has(c.id) &&
                matchesFocus(c, f),
            )),
      );
    if (!valid.length) return;
    const total = Math.max(1, val('rounds'));
    if (settings.technicalThemes) {
      const themes = shuffle([...valid]);
      for (let r = 1; r <= total; r++) focusPlan[r] = [themes[(r - 1) % themes.length]];
      return;
    }
    if (settings.structured !== 'off') {
      const size = +settings.structured,
        count = Math.max(1, Math.ceil(val('roundTime') / size)),
        slots = shuffle(Array.from({ length: total * count }, (_, i) => i));
      for (let r = 1; r <= total; r++) blockPlan[r] = Array.from({ length: count }, () => []);
      valid.forEach((f, i) => {
        const slot = slots[i % slots.length],
          r = Math.floor(slot / count) + 1,
          b = slot % count;
        blockPlan[r][b] = [f];
      });
      slots.slice(valid.length).forEach((slot) => {
        if (Math.random() < 0.35) {
          const r = Math.floor(slot / count) + 1,
            b = slot % count;
          blockPlan[r][b] = [valid[Math.floor(Math.random() * valid.length)]];
        }
      });
      for (let r = 1; r <= total; r++) {
        const used = [...new Set(blockPlan[r].flat())];
        if (used.length) focusPlan[r] = used;
      }
      return;
    }
    const slots = shuffle(Array.from({ length: total }, (_, i) => i + 1)),
      usable = total > 1 ? slots.slice(0, total - 1) : slots;
    valid.forEach((f, i) => {
      const slot = usable[i % usable.length];
      (focusPlan[slot] || (focusPlan[slot] = [])).push(f);
    });
  }
  function activeFocusedDrill() {
    const drill = settings.focusedDrill;
    return drill && Array.isArray(drill.assignments) && drill.assignments.length ? drill : null;
  }
  function focusedDelay() {
    const drill = activeFocusedDrill(),
      min = Math.max(20, +drill?.minInterval || 27),
      max = Math.max(min, +drill?.maxInterval || 35);
    return min + Math.floor(Math.random() * (max - min + 1));
  }
  function announceFocusedAssignment() {
    if (!focusedAssignment || !running || phase !== 'work') return;
    comboTotal++;
    moveTotal += Math.max(1, +focusedAssignment.moves || 1);
    $('#comboTotal').textContent = comboTotal;
    $('#moveTotal').textContent = moveTotal;
    say(focusedAssignment.speech, () => {
      if (running && phase === 'work') beginComboCadence();
    });
  }
  function newFocusedAssignment(speak = true) {
    const drill = activeFocusedDrill();
    if (!drill) return;
    if (focusedAssignmentDrillId !== drill.id) {
      focusedAssignmentDeck = [];
      focusedAssignmentDrillId = drill.id;
    }
    if (!focusedAssignmentDeck.length) {
      focusedAssignmentDeck = shuffle(drill.assignments.map((assignment, index) => index));
      if (focusedAssignmentDeck.length > 1 && focusedAssignmentDeck[0] === focusedAssignmentIndex)
        [focusedAssignmentDeck[0], focusedAssignmentDeck[1]] = [
          focusedAssignmentDeck[1],
          focusedAssignmentDeck[0],
        ];
    }
    focusedAssignmentIndex = focusedAssignmentDeck.shift();
    focusedAssignment = drill.assignments[focusedAssignmentIndex];
    current = [];
    betweenCue = '';
    renderCombo();
    if (speak) announceFocusedAssignment();
  }
  function newCombo(speak = true) {
    if (activeFocusedDrill()) {
      newFocusedAssignment(speak);
      return;
    }
    betweenCue = '';
    if (activeFocuses().includes('freestyle')) {
      current = ['freestyle'];
      repeatLeft = 0;
      renderCombo();
      if (speak && running && phase === 'work')
        deliverCombo(current, { schedule: !punchOutActive });
      return;
    }
    if (!available().length) {
      current = [];
      $('#combo').textContent = 'Select at least one combo';
      $('#comboNumbers').style.display = 'none';
      return;
    }
    if (repeatLeft > 0 && !pendingMovement) {
      repeatLeft--;
      renderCombo();
      if (speak && running && phase === 'work')
        deliverCombo(current, { schedule: !punchOutActive });
      return;
    } else if (pendingMovement) repeatLeft = 0;
    let pool = equipmentSubset(available());
    if (settings.unique === 'yes' && pool.length > 1) {
      const fresh = pool.filter((c) => !roundUsed.has(c.id));
      if (fresh.length) pool = fresh;
      else roundUsed.clear();
    }
    let pick = weightedPick(pool);
    if (pool.length > 1 && keyOf(pick.m) === lastKey) {
      const others = pool.filter((c) => keyOf(c.m) !== lastKey);
      pick = weightedPick(others);
    }
    current = pick.m;
    pendingMovement = '';
    lastKey = keyOf(current);
    roundUsed.add(pick.id);
    repeatLeft =
      settings.repeats === 'more' ? 2 : settings.repeats === 'some' && Math.random() < 0.5 ? 1 : 0;
    renderCombo();
    if (speak && running && phase === 'work') deliverCombo(current, { schedule: !punchOutActive });
  }
  function renderCombo() {
    if (!comboVisible) {
      $('#combo').textContent = '';
      $('#comboNumbers').textContent = '';
      $('#comboNumbers').style.display = 'none';
      return;
    }
    if (activeFocusedDrill() && focusedAssignment) {
      $('#combo').textContent = focusedAssignment.display;
      $('#comboNumbers').textContent =
        activeFocusedDrill().shortInstruction || 'Keep going until the next callout';
      $('#comboNumbers').style.display = 'block';
      return;
    }
    if (betweenCue) {
      $('#combo').textContent = betweenCue;
      $('#comboNumbers').style.display = 'none';
      return;
    }
    const primary = settings.format === 'numbers' ? current.map(numbered) : current.map(phrase),
      secondary = settings.format === 'numbers' ? current.map(phrase) : current.map(numbered);
    $('#combo').textContent = primary.join(' · ');
    $('#comboNumbers').textContent = secondary.join(' · ');
    $('#comboNumbers').style.display = isOn('secondary') ? 'block' : 'none';
  }
  function cadence() {
    const focuses = activeFocuses();
    if (focuses.includes('freestyle'))
      return settings.structured === 'off' ? 15 : +settings.structured;
    if (focuses.includes('power')) return Math.max(3, Math.round(val('pace') * 1.35));
    const fast =
      focuses.includes('high') || focuses.includes('speed') || focuses.includes('explosive');
    return Math.max(2, Math.round(val('pace') * (fast ? 0.65 : 1)));
  }
  function workoutRemaining() {
    const rounds = val('rounds'),
      roundTime = val('roundTime');
    if (phase === 'complete') return 0;
    if (phase === 'ready') return val('warmupTime') + rounds * roundTime + restTotal();
    if (phase === 'warmup') return time + rounds * roundTime + restTotal();
    if (phase === 'work') return time + (rounds - round) * roundTime + restTotal(round, rounds - 1);
    return time + (rounds - round) * roundTime + restTotal(round + 1, rounds - 1);
  }
  function cancelSpeech() {
    speechSequence++;
    speechTimers.forEach(clearTimeout);
    speechTimers = [];
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }
  function speakUtterance(text, onend, rate = 0.95) {
    if (!isOn('voice') || settings.volume <= 0 || !('speechSynthesis' in window)) {
      onend?.();
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = appleMobile ? Math.max(0.5, rate * 0.82) : rate;
    u.pitch = 0.88;
    u.volume = settings.volume / 100;
    if (onend) {
      u.onend = onend;
      u.onerror = onend;
    }
    speechSynthesis.speak(u);
  }
  function say(text, onend) {
    cancelSpeech();
    speakUtterance(text, onend);
  }
  function comboSpeechSegments(combo) {
    if (settings.format === 'names')
      return combo.map((move) => ({ kind: 'word', text: phrase(move) }));
    const segments = [];
    combo.forEach((move) => {
      const targeted =
        typeof move === 'string' && (move.startsWith('body ') || move.startsWith('head '));
      if (typeof move === 'number' || targeted) {
        const targetBreak = [' ', ', ', '; ', '... '][settings.targetGap] || ' ',
          text =
            typeof move === 'number'
              ? String(move)
              : move.slice(-1) + targetBreak + (move.startsWith('body ') ? 'body' : 'head'),
          last = segments[segments.length - 1];
        if (last && last.comboSequence) {
          last.text += ' ' + text;
          last.kind = last.kind === 'mixed' || targeted ? 'mixed' : 'number';
          last.endsWith = targeted ? 'word' : 'number';
        } else
          segments.push({
            kind: targeted ? 'mixed' : 'number',
            text,
            comboSequence: true,
            endsWith: targeted ? 'word' : 'number',
          });
      } else segments.push({ kind: 'word', text: phrase(move), endsWith: 'word' });
    });
    return segments;
  }
  function sayCombo(combo, { cancel = true, onend } = {}) {
    if (cancel) cancelSpeech();
    const sequence = speechSequence,
      numberRate = 1.485 + (settings.speechRate - 5) * 0.14,
      wordRate = 0.9 + (settings.wordSpeechRate - 1) * 0.1,
      segments = comboSpeechSegments(combo).map((segment) => ({
        ...segment,
        rate:
          segment.kind === 'number'
            ? numberRate
            : segment.kind === 'mixed'
              ? (numberRate + wordRate) / 2
              : wordRate,
      }));
    const speakNext = (index) => {
      if (sequence !== speechSequence) return;
      if (index >= segments.length) {
        if (onend) onend();
        return;
      }
      const segment = segments[index];
      speakUtterance(
        segment.text,
        () => {
          if (sequence !== speechSequence) return;
          const next = segments[index + 1],
            delay = next?.kind === 'word' && segment.endsWith === 'word' ? settings.wordMoveGap : 0;
          if (delay) speechTimers.push(setTimeout(() => speakNext(index + 1), delay));
          else speakNext(index + 1);
        },
        segment.rate,
      );
    };
    speakNext(0);
  }
  function beginComboCadence() {
    clearTimeout(comboTick);
    comboTick = setTimeout(
      () => newCombo(true),
      (activeFocusedDrill() ? focusedDelay() : cadence()) * 1000,
    );
  }
  function maybeAdvanceBlock() {
    if (settings.structured === 'off' || phase !== 'work') return;
    const next = Math.min(
      (blockPlan[round]?.length || 1) - 1,
      Math.floor((val('roundTime') - time) / +settings.structured),
    );
    if (next === blockIndex) return;
    blockIndex = next;
    clearTimeout(comboTick);
    repeatLeft = 0;
    const label = activeFocuses().map(focusName).join(' and ') || 'Open boxing',
      resume = () => {
        if (running && phase === 'work') newCombo(true);
      };
    if (!isOn('voice') || settings.volume <= 0 || !('speechSynthesis' in window)) resume();
    else say(label, resume);
    render();
  }
  function finishRoundAnnouncement() {
    if (!roundAnnouncementActive) return;
    roundAnnouncementActive = false;
    if (!running || phase !== 'work') return;
    startDing(() => {
      if (!running || phase !== 'work') return;
      comboVisible = true;
      renderCombo();
      clearInterval(tick);
      tick = setInterval(step, 1000);
      if (activeFocusedDrill()) announceFocusedAssignment();
      else deliverCombo(current, { cancel: false });
    });
  }
  function announceRound() {
    const drill = activeFocusedDrill(),
      focus = activeFocuses().map(focusName).join(' and '),
      message =
        drill && round === 1
          ? 'Round 1. ' + drill.name + '. ' + drill.instructions
          : 'Round ' + round + (drill ? '' : focus ? '. ' + focus : '') + '.';
    roundAnnouncementActive = true;
    comboVisible = false;
    renderCombo();
    if (!isOn('voice') || settings.volume <= 0 || !('speechSynthesis' in window)) {
      finishRoundAnnouncement();
      return;
    }
    say(message, finishRoundAnnouncement);
  }
  function vibrate(pattern) {
    if (settings.haptics && navigator.vibrate) navigator.vibrate(pattern);
  }
  function activateRound() {
    phase = 'work';
    time = val('roundTime');
    blockIndex = 0;
    running = true;
    comboVisible = false;
    betweenCue = '';
    pendingMovement = '';
    punchOutActive = false;
    punchOutUntil = -1;
    const planned = focusPlan[round] || [],
      requested = planned.includes('punchout30') ? 30 : planned.includes('punchout15') ? 15 : 0,
      duration = Math.min(requested, Math.max(5, val('roundTime') - 10));
    punchOutAt =
      requested && val('roundTime') > duration + 20
        ? Math.floor(val('roundTime') * (0.42 + Math.random() * 0.25))
        : -1;
    newCombo(false);
    vibrate([100, 60, 100]);
    announceRound();
  }
  function audioEngine() {
    try {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) return null;
      if (!audioContext || audioContext.state === 'closed') audioContext = new AudioEngine();
      if (audioContext.state !== 'running') audioContext.resume().catch(() => {});
      return audioContext;
    } catch (e) {
      return null;
    }
  }
  function unlockAudio() {
    const a = audioEngine();
    if (!a) return;
    try {
      const source = a.createBufferSource(),
        gain = a.createGain();
      source.buffer = a.createBuffer(1, 1, a.sampleRate);
      gain.gain.value = 0;
      source.connect(gain);
      gain.connect(a.destination);
      source.start();
    } catch (e) {}
  }
  function beep(freq = 720, dur = 0.11) {
    if (settings.volume <= 0) return;
    try {
      const a = audioEngine();
      if (!a) return;
      const o = a.createOscillator(),
        g = a.createGain();
      o.connect(g);
      g.connect(a.destination);
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.12 * (settings.volume / 100), a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
      o.start();
      o.stop(a.currentTime + dur);
    } catch (e) {}
  }
  function soundLevel(relative) {
    return (settings.volume / 100) * (relative / 100);
  }
  function clapper() {
    if (settings.volume <= 0) return;
    try {
      const a = audioEngine();
      if (!a) return;
      const master = a.createGain(),
        compressor = a.createDynamicsCompressor(),
        style =
          settings.warningSound === 'sharp' ? 1.22 : settings.warningSound === 'deep' ? 0.76 : 1,
        pitchScale = style * (settings.warningPitch / 100),
        hit = (when, pitch) => {
          const length = Math.ceil(a.sampleRate * 0.105),
            buffer = a.createBuffer(1, length, a.sampleRate),
            data = buffer.getChannelData(0);
          for (let i = 0; i < length; i++)
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 1.3);
          const noise = a.createBufferSource(),
            high = a.createBiquadFilter(),
            band = a.createBiquadFilter(),
            ng = a.createGain();
          noise.buffer = buffer;
          high.type = 'highpass';
          high.frequency.value = 330 * pitchScale;
          band.type = 'bandpass';
          band.frequency.value = pitch * pitchScale;
          band.Q.value = 0.42;
          ng.gain.setValueAtTime(1, when);
          ng.gain.exponentialRampToValueAtTime(0.001, when + 0.105);
          noise.connect(high);
          high.connect(band);
          band.connect(ng);
          ng.connect(master);
          noise.start(when);
          const knock = a.createOscillator(),
            kg = a.createGain();
          knock.type = 'square';
          knock.frequency.setValueAtTime(pitch * 0.5 * pitchScale, when);
          knock.frequency.exponentialRampToValueAtTime(175 * pitchScale, when + 0.075);
          kg.gain.setValueAtTime(0.7, when);
          kg.gain.exponentialRampToValueAtTime(0.001, when + 0.085);
          knock.connect(kg);
          kg.connect(master);
          knock.start(when);
          knock.stop(when + 0.09);
        };
      compressor.threshold.value = -14;
      compressor.ratio.value = 18;
      master.gain.value = 0.76 * soundLevel(settings.warningVolume);
      master.connect(compressor);
      compressor.connect(a.destination);
      for (let i = 0; i < settings.warningHits; i++)
        hit(a.currentTime + (i * settings.warningSpacing) / 1000, i % 2 ? 1250 : 1500);
    } catch (e) {}
  }
  function buzzer(relative = settings.warningVolume, duration = 0.7, pitch = 100) {
    if (settings.volume <= 0) return;
    try {
      const a = audioEngine();
      if (!a) return;
      const master = a.createGain(),
        compressor = a.createDynamicsCompressor(),
        now = a.currentTime;
      master.gain.value = 0.38 * soundLevel(relative);
      master.connect(compressor);
      compressor.connect(a.destination);
      [185, 370, 555].forEach((freq, i) => {
        const o = a.createOscillator(),
          g = a.createGain();
        o.type = i ? 'square' : 'sawtooth';
        o.frequency.value = (freq * pitch) / 100;
        g.gain.value = 1 / (i + 1);
        o.connect(g);
        g.connect(master);
        o.start(now);
        o.stop(now + duration);
      });
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.exponentialRampToValueAtTime(0.001, now + duration);
    } catch (e) {}
  }
  function playWarning() {
    clapper();
  }
  function bellTone(
    style = 'boxing',
    relative = settings.roundEndVolume,
    pitch = settings.roundEndPitch,
    decay = settings.roundEndDecay,
  ) {
    if (settings.volume <= 0) return;
    try {
      const a = audioEngine();
      if (!a) return;
      const master = a.createGain(),
        compressor = a.createDynamicsCompressor(),
        now = a.currentTime,
        partials =
          style === 'classic'
            ? [
                [660, 1],
                [1320, 0.52],
                [1980, 0.28],
                [2700, 0.14],
              ]
            : [
                [505, 1],
                [815, 0.7],
                [1195, 0.46],
                [1665, 0.31],
                [2340, 0.2],
                [3170, 0.11],
              ],
        duration = decay / 1000;
      master.gain.value = 0.34 * soundLevel(relative);
      master.connect(compressor);
      compressor.connect(a.destination);
      partials.forEach(([freq, level], i) => {
        const o = a.createOscillator(),
          g = a.createGain();
        o.type = i < 2 ? 'triangle' : 'sine';
        o.frequency.value = (freq * pitch) / 100;
        g.gain.setValueAtTime(level, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + Math.max(0.2, duration - i * 0.06));
        o.connect(g);
        g.connect(master);
        o.start(now);
        o.stop(now + duration);
      });
      const length = Math.ceil(a.sampleRate * 0.025),
        buffer = a.createBuffer(1, length, a.sampleRate),
        data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const strike = a.createBufferSource(),
        sg = a.createGain();
      strike.buffer = buffer;
      sg.gain.setValueAtTime(0.7, now);
      sg.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      strike.connect(sg);
      sg.connect(master);
      strike.start(now);
    } catch (e) {}
  }
  function playConfiguredHit(prefix) {
    const style = settings[prefix + 'Sound'],
      volume = settings[prefix + 'Volume'],
      pitch = settings[prefix + 'Pitch'],
      decay = settings[prefix + 'Decay'];
    if (style === 'buzzer') buzzer(volume, decay / 1000, pitch);
    else bellTone(style === 'classic' ? 'classic' : 'boxing', volume, pitch, decay);
  }
  function playConfiguredSequence(prefix, onend) {
    playConfiguredHit(prefix);
    const hits = settings[prefix + 'Hits'],
      spacing = settings[prefix + 'Spacing'],
      decay = settings[prefix + 'Decay'];
    for (let i = 1; i < hits; i++)
      soundTimers.push(setTimeout(() => playConfiguredHit(prefix), i * spacing));
    if (onend) soundTimers.push(setTimeout(onend, (hits - 1) * spacing + decay + 120));
  }
  function startDing(onend) {
    playConfiguredSequence('roundStart', onend);
  }
  function playRoundEndSequence(onend) {
    playConfiguredSequence('roundEnd', onend);
  }
  function roundEndBell(onend) {
    playRoundEndSequence(onend);
  }
  // Workout rendering and phase control.
  function render() {
    syncWakeLock();
    document.body.dataset.phase = phase;
    document.body.classList.toggle('high-contrast', !!settings.highContrast);
    document.body.classList.toggle('white-outline-text', !!settings.whiteOutlineText);
    document.body.classList.toggle('show-fullscreen-button', !!settings.showFullscreen);
    document.body.classList.toggle('compact-workout', settings.displayMode === 'compact');
    document.body.classList.toggle('large-brand', settings.brandLayout === 'large');
    document.body.classList.toggle('compact-round-labels', !!settings.compactRoundLabels);
    const brandIcon = $('#brandIcon'),
      brandIconSource = headerIcons[settings.headerIconStyle] || headerIcons.bold;
    if (brandIcon.getAttribute('src') !== brandIconSource) brandIcon.src = brandIconSource;
    document.documentElement.style.setProperty(
      '--button-text',
      'rgb(255 255 255 / ' +
        Math.min(100, Math.max(65, +settings.buttonTextBrightness || 98)) +
        '%)',
    );
    document.documentElement.style.setProperty(
      '--red',
      { red: '#ff3b30', orange: '#ff7a1a', blue: '#438cff', green: '#24b86a', purple: '#9b6cff' }[
        settings.accentColor
      ] || '#ff3b30',
    );
    const workoutLocked = !['ready', 'complete'].includes(phase);
    $('#setup').classList.toggle('workout-locked', workoutLocked);
    $$('#setup button:not(.close),#setup input,#setup select').forEach(
      (el) => (el.disabled = workoutLocked || !!el.closest('.config-locked')),
    );
    const clockText = fmt(time);
    $('#timer').innerHTML = [...clockText]
      .map(
        (character) =>
          '<span class="' +
          (character === ':' ? 'timer-colon' : 'timer-digit') +
          '">' +
          character +
          '</span>',
      )
      .join('');
    $('#timer').setAttribute('aria-label', clockText);
    $('#comboTotal').textContent = comboTotal;
    $('#moveTotal').textContent = moveTotal;
    $('#workoutLeft').textContent = 'Workout time left: ' + totalFmt(workoutRemaining());
    $('#workoutLeft').style.display = settings.showTimeLeft ? 'block' : 'none';
    const warmup = val('warmupTime'),
      work = val('rounds') * val('roundTime'),
      rest = restTotal(),
      variedRest =
        Array.isArray(settings.workout.restSchedule) && settings.workout.restSchedule.length;
    $('#totalTime').textContent = totalFmt(warmup + work + rest);
    $('#totalDetail').textContent =
      totalFmt(warmup) +
      ' warmup + ' +
      totalFmt(work) +
      ' work + ' +
      totalFmt(rest) +
      (variedRest ? ' varied rest' : ' rest');
    $('#stage').className =
      'stage ' +
      (phase === 'warmup'
        ? 'warming'
        : phase === 'rest'
          ? 'resting'
          : phase === 'complete'
            ? 'complete'
            : punchOutActive
              ? 'punchout'
              : '');
    $('#phase').textContent =
      phase === 'warmup'
        ? 'Warmup'
        : phase === 'rest'
          ? restAfterRound(round) > val('restTime')
            ? 'Long recovery'
            : 'Rest and reset'
          : phase === 'complete'
            ? 'Workout complete'
            : 'Round ' + round + ' of ' + val('rounds');
    const action = running
        ? 'Pause'
        : phase === 'complete'
          ? 'Start again'
          : phase === 'ready'
            ? 'Start round'
            : 'Resume',
      showKeys = settings.shortcutLabels,
      sc = settings.shortcuts,
      canHoldRestart = !running && !['ready', 'complete'].includes(phase),
      meta =
        (showKeys ? '<span class="keycap">' + displayKey(sc.start) + '</span>' : '') +
        (canHoldRestart ? '<span class="hold-restart">Hold to restart</span>' : '');
    $('#start').innerHTML =
      '<span>' +
      action +
      '</span>' +
      (meta ? '<span class="primary-meta">' + meta + '</span>' : '');
    $('#start').classList.toggle('restart-ready', canHoldRestart);
    $('#start').classList.toggle('is-pause', running);
    $('#start').classList.toggle('is-resume', canHoldRestart);
    $('#start').setAttribute(
      'aria-label',
      canHoldRestart ? 'Resume workout. Hold to restart workout' : action,
    );
    $('#restart').innerHTML =
      '<span aria-hidden="true">←</span>' +
      (showKeys ? '<span class="keycap">' + displayKey(sc.restart) + '</span>' : '');
    $('#skip').innerHTML =
      (showKeys ? '<span class="keycap">' + displayKey(sc.next) + '</span>' : '') +
      '<span aria-hidden="true">→</span>';
    $('.keys').innerHTML =
      '<kbd>' +
      displayKey(sc.start) +
      '</kbd><span>Start or pause</span><kbd>' +
      displayKey(sc.next) +
      '</kbd><span>Next phase</span><kbd>' +
      displayKey(sc.restart) +
      '</kbd><span>Previous phase</span><kbd>' +
      displayKey(sc.mute) +
      '</kbd><span>Mute voice</span>';
    if (phase === 'ready') {
      $('#combo').textContent = 'Workout ready';
      $('#comboNumbers').style.display = 'none';
    } else if (phase === 'warmup') {
      $('#combo').textContent = 'Get ready';
      $('#comboNumbers').style.display = 'none';
    } else if (phase === 'rest' || phase === 'complete') {
      $('#combo').textContent = '';
      $('#comboNumbers').textContent = '';
      $('#comboNumbers').style.display = 'none';
    }
    const summary = [
      settings.trainingMode === 'bag'
        ? 'Bag'
        : settings.trainingMode === 'shadow'
          ? 'Shadowboxing'
          : 'General',
      settings.skill,
      settings.complexity + ' complexity',
    ];
    if (settings.progressiveCombos) summary.push('Progressive combinations');
    if (activeFocuses().length) summary.push(...activeFocuses().map(focusName));
    if (settings.structured !== 'off' && Object.keys(blockPlan).length) {
      summary.push(settings.structured + ' sec blocks');
      if (phase === 'work') {
        const size = +settings.structured,
          totalBlocks = blockPlan[round]?.length || 1,
          elapsed = val('roundTime') - time,
          left = Math.max(0, Math.min(time, (blockIndex + 1) * size - elapsed));
        summary.push(
          'Block ' + (blockIndex + 1) + ' of ' + totalBlocks + ' · ' + fmt(left) + ' left',
        );
      }
    }
    $('#summary').innerHTML = summary
      .map(
        (x) =>
          '<span class="summary-pill ' +
          (summary.indexOf(x) > 2 ? 'focus-label' : '') +
          '">' +
          x +
          '</span>',
      )
      .join('');
    const total = val('rounds'),
      planVisible = phase !== 'ready' && Object.keys(focusPlan).length > 0,
      warmupPip =
        val('warmupTime') > 0
          ? '<span class="phase-pip warmup-pip ' +
            (phase === 'warmup' ? 'current' : '') +
            '" aria-label="Warmup"></span>'
          : '';
    $('#timeline').style.gridTemplateColumns = '';
    $('#timeline').innerHTML =
      warmupPip +
      Array.from({ length: total }, (_, i) => {
        const r = i + 1,
          roundFocuses = planVisible && focusPlan[r] ? focusPlan[r] : [],
          focus = roundFocuses.map(focusName).join(' + '),
          shortFocus = roundFocuses.map(shortFocusName).join(' + '),
          done = r < round || (r === round && (phase === 'rest' || phase === 'complete')),
          current = r === round && phase === 'work',
          resting = r === round && phase === 'rest' && r < total;
        return (
          '<span class="round-marker"><span class="round-pip ' +
          (done ? 'done' : current ? 'current' : '') +
          '"><span class="round-focus-label" title="' +
          focus +
          '"><span class="round-focus-full">' +
          focus +
          '</span><span class="round-focus-short">' +
          shortFocus +
          '</span></span></span></span>' +
          (resting
            ? '<span class="phase-pip rest-pip current" aria-label="Rest period"></span>'
            : '')
        );
      }).join('');
    if (phase === 'complete' && !completionReported) {
      completionReported = true;
      setTimeout(
        () =>
          window.dispatchEvent(
            new CustomEvent('cornerwork-complete', {
              detail: {
                date: Date.now(),
                startedAt: workoutStartedAt || Date.now(),
                duration: activeSeconds,
                plannedDuration: val('warmupTime') + val('rounds') * val('roundTime') + restTotal(),
                rounds: val('rounds'),
                combos: comboTotal,
                moves: moveTotal,
                focuses: [...new Set(Object.values(focusPlan).flat())].map(focusName),
                mode: settings.trainingMode,
                skill: settings.skill,
              },
            }),
          ),
        0,
      );
    }
  }
  function clear() {
    clearInterval(tick);
    clearInterval(comboTick);
    soundTimers.forEach(clearTimeout);
    soundTimers = [];
    tick = comboTick = null;
  }
  function start() {
    unlockAudio();
    if (phase === 'ready' && !available().length) {
      $('#combo').textContent = 'Select at least one combo';
      $('#comboNumbers').style.display = 'none';
      return;
    }
    if (phase === 'complete') {
      round = 1;
      phase = 'ready';
      time = val('roundTime');
      newCombo(false);
    }
    if (phase === 'ready') {
      comboTotal = 0;
      moveTotal = 0;
      completionReported = false;
      workoutStartedAt = Date.now();
      activeSeconds = 0;
      combosSinceCue = 0;
      focusedAssignmentDeck = [];
      focusedAssignmentDrillId = '';
      buildFocusPlan();
      roundUsed.clear();
      repeatLeft = 0;
      if (val('warmupTime') > 0) {
        phase = 'warmup';
        time = val('warmupTime');
        say('Warmup. Get ready.');
        beep(650, 0.2);
      } else {
        comboVisible = false;
        newCombo(false);
        phase = 'work';
        time = val('roundTime');
        beep(850, 0.25);
      }
    }
    running = !running;
    clear();
    if (running) {
      if (phase === 'work') {
        if (comboVisible) {
          tick = setInterval(step, 1000);
          beginComboCadence();
        } else if (!roundAnnouncementActive) announceRound();
      } else tick = setInterval(step, 1000);
    } else {
      cancelSpeech();
      roundAnnouncementActive = false;
    }
    render();
  }
  function step() {
    activeSeconds++;
    time--;
    if (phase === 'work' && time > 0 && punchOutAt >= 0 && time === punchOutAt) {
      const planned = focusPlan[round] || [],
        duration = planned.includes('punchout30') ? 30 : 15;
      punchOutActive = true;
      punchOutUntil = Math.max(1, time - duration);
      clearInterval(comboTick);
      const beginBurst = () => {
        if (running && phase === 'work') {
          newCombo(true);
          comboTick = setInterval(() => newCombo(true), 2000);
        }
      };
      if (isOn('voice') && settings.volume > 0 && 'speechSynthesis' in window)
        say('Punch out', beginBurst);
      else beginBurst();
      vibrate([80, 40, 80, 40, 120]);
    }
    if (phase === 'work' && punchOutActive && time === punchOutUntil) {
      punchOutActive = false;
      clearInterval(comboTick);
      const endBurst = () => {
        if (running && phase === 'work') beginComboCadence();
      };
      if (isOn('voice') && settings.volume > 0 && 'speechSynthesis' in window)
        say('Back to boxing', endBurst);
      else endBurst();
    }
    if (phase === 'work' && time > 0 && settings.clapperEnabled && time === +settings.clapperTime) {
      cancelSpeech();
      clearInterval(comboTick);
      playWarning();
      vibrate([140, 80, 140]);
      const resume = setTimeout(
        () => {
          if (running && phase === 'work') beginComboCadence();
        },
        (settings.warningHits - 1) * settings.warningSpacing + 300,
      );
      soundTimers.push(resume);
    }
    if (time <= 0) {
      clear();
      running = false;
      if (phase === 'warmup') activateRound();
      else if (phase === 'work') {
        comboVisible = false;
        betweenCue = '';
        pendingMovement = '';
        punchOutActive = false;
        const nextRest = restAfterRound(round),
          restCall = nextRest > val('restTime') ? 'Long recovery' : 'Rest';
        if (round >= val('rounds')) {
          phase = 'complete';
          time = 0;
          vibrate([180, 90, 180]);
          roundEndBell(() => say('Workout complete. Great work.'));
        } else if (nextRest > 0) {
          phase = 'rest';
          time = nextRest;
          running = true;
          vibrate([160, 80, 160]);
          roundEndBell(() =>
            say(restCall, () => {
              if (settings.recoveryInstructions && running && phase === 'rest')
                say(recoveryCues[Math.floor(Math.random() * recoveryCues.length)]);
            }),
          );
          tick = setInterval(step, 1000);
        } else {
          roundEndBell(() => {
            round++;
            activateRound();
          });
        }
      } else {
        round++;
        activateRound();
      }
    } else maybeAdvanceBlock();
    render();
  }
  function restart() {
    if (phase === 'ready') return;
    clear();
    cancelSpeech();
    roundAnnouncementActive = false;
    comboVisible = true;
    repeatLeft = 0;
    if (phase === 'warmup') {
      running = false;
      phase = 'ready';
      round = 1;
      time = val('roundTime');
      newCombo(false);
    } else if (phase === 'work' && round === 1 && val('warmupTime') > 0) {
      running = true;
      phase = 'warmup';
      time = val('warmupTime');
      comboVisible = false;
      say('Warmup. Get ready.');
      beep(650, 0.2);
      tick = setInterval(step, 1000);
    } else if (phase === 'work' && round === 1) {
      running = false;
      phase = 'ready';
      time = val('roundTime');
      newCombo(false);
    } else if (phase === 'work') {
      round--;
      phase = 'rest';
      time = restAfterRound(round);
      running = true;
      comboVisible = false;
      tick = setInterval(step, 1000);
    } else if (phase === 'rest') {
      activateRound();
    } else if (phase === 'complete') {
      round = val('rounds');
      activateRound();
    }
    render();
  }
  function resetWorkout() {
    clear();
    cancelSpeech();
    running = false;
    phase = 'ready';
    round = 1;
    time = val('roundTime');
    repeatLeft = 0;
    comboTotal = 0;
    moveTotal = 0;
    roundUsed.clear();
    focusPlan = {};
    blockPlan = {};
    blockIndex = 0;
    focusedAssignmentDeck = [];
    focusedAssignmentDrillId = '';
    betweenCue = '';
    pendingMovement = '';
    comboVisible = true;
    roundAnnouncementActive = false;
    punchOutActive = false;
    workoutStartedAt = 0;
    activeSeconds = 0;
    completionReported = false;
    newCombo(false);
    render();
  }
  function cancelPrimaryHold() {
    clearTimeout(primaryHoldTimer);
    primaryHoldTimer = null;
    $('#start').classList.remove('holding');
  }
  function startPrimaryHold() {
    if (running || ['ready', 'complete'].includes(phase) || primaryHoldTimer) return;
    primaryHoldTriggered = false;
    clearTimeout(primaryHoldResetTimer);
    $('#start').classList.add('holding');
    primaryHoldTimer = setTimeout(() => {
      primaryHoldTimer = null;
      primaryHoldTriggered = true;
      $('#start').classList.remove('holding');
      resetWorkout();
      primaryHoldResetTimer = setTimeout(() => (primaryHoldTriggered = false), 700);
    }, 1200);
  }
  function nextAction() {
    if (phase === 'ready' || phase === 'complete') return;
    clear();
    cancelSpeech();
    roundAnnouncementActive = false;
    comboVisible = false;
    repeatLeft = 0;
    if (phase === 'warmup') {
      round = 1;
      activateRound();
    } else if (phase === 'rest') {
      round++;
      activateRound();
    } else if (phase === 'work' && round < val('rounds') && restAfterRound(round) > 0) {
      phase = 'rest';
      time = restAfterRound(round);
      running = true;
      tick = setInterval(step, 1000);
    } else if (phase === 'work' && round < val('rounds')) {
      round++;
      activateRound();
    } else {
      running = false;
      phase = 'complete';
      time = 0;
      say('Workout complete. Great work.');
    }
    render();
  }
  try {
    const saved = JSON.parse(localStorage.getItem('cornerwork-settings'));
    if (saved) {
      settings = {
        ...settings,
        ...saved,
        shortcuts: { ...settings.shortcuts, ...(saved.shortcuts || {}) },
        workout: { ...settings.workout, ...(saved.workout || {}) },
      };
      if (!saved.speechGapControlsV2) {
        settings.numberWordGap = 0;
        settings.wordMoveGap = 90;
        delete settings.wordGap;
        settings.speechGapControlsV2 = true;
        saveSettings();
      }
      if (!saved.wordSpeechRateScaleV2) {
        const oldRate = 0.96 + ((Number(saved.wordSpeechRate) || 5) - 5) * 0.085;
        settings.wordSpeechRate = Math.min(10, Math.max(1, Math.round(1 + (oldRate - 0.9) / 0.1)));
        settings.wordSpeechRateScaleV2 = true;
        saveSettings();
      }
      if (!saved.roundStartDefaultV2) {
        if (saved.roundStartDecay === 700) settings.roundStartDecay = 1000;
        settings.roundStartDefaultV2 = true;
        saveSettings();
      }
      if (saved.comboCatalogVersion !== 3) {
        if (Array.isArray(settings.allowedCombos))
          settings.allowedCombos = [
            ...new Set([...settings.allowedCombos, ...bodyComboIds, ...catalogAdditions]),
          ];
        settings.comboCatalogVersion = 3;
        saveSettings();
      }
    }
  } catch (e) {}
  const clampedNumberWordGap = Math.min(100, Math.max(0, +settings.numberWordGap || 0)),
    clampedWordMoveGap = Math.min(300, Math.max(0, +settings.wordMoveGap || 0));
  if (
    clampedNumberWordGap !== settings.numberWordGap ||
    clampedWordMoveGap !== settings.wordMoveGap
  ) {
    settings.numberWordGap = clampedNumberWordGap;
    settings.wordMoveGap = clampedWordMoveGap;
    saveSettings();
  }
  if ('showStatus' in settings) {
    delete settings.showStatus;
    saveSettings();
  }
  if ('leftControls' in settings) {
    delete settings.leftControls;
    saveSettings();
  }
  if ('colorBlind' in settings) {
    delete settings.colorBlind;
    saveSettings();
  }
  if (!headerIcons[settings.headerIconStyle]) {
    settings.headerIconStyle = 'bold';
    saveSettings();
  }
  if (!['compact', 'large'].includes(settings.brandLayout)) {
    settings.brandLayout = 'compact';
    saveSettings();
  }
  if (!['wood', 'sharp', 'deep'].includes(settings.warningSound)) {
    settings.warningSound = 'wood';
    settings.warningHits = 2;
    saveSettings();
  }
  const sharedMatch = location.hash.match(/^#workout=([A-Za-z0-9_-]+)$/);
  if (sharedMatch) {
    const shared = readShare(sharedMatch[1]);
    if (shared?.config) {
      sessionStorage.setItem('cornerwork-pending-shared', JSON.stringify(shared));
      history.replaceState(null, '', location.pathname + location.search);
    }
  }
  if (settings.punchOuts) {
    settings.focuses = [
      ...new Set([
        ...(settings.focuses || []),
        Number(settings.punchOutDuration) >= 30 ? 'punchout30' : 'punchout15',
      ]),
    ];
    settings.focusEnabled = 'yes';
  }
  if ('punchOuts' in settings || 'punchOutDuration' in settings) {
    delete settings.punchOuts;
    delete settings.punchOutDuration;
    saveSettings();
  }
  if (Array.isArray(settings.allowedCombos))
    locked = new Set(settings.allowedCombos.filter((id) => combos.some((c) => c.id === id)));
  // Settings controls and interface event wiring.
  const displayGroup = $$('.settings-group').find(
    (group) => group.querySelector('h2')?.textContent === 'Display',
  );
  if (displayGroup) {
    displayGroup
      .querySelector('.settings-tip')
      ?.insertAdjacentHTML(
        'beforeend',
        '<span><strong>Clock font:</strong> Uses a bundled timer font so the clock and colon look the same on every device.</span><span><strong>Workout panel shortcuts:</strong> Shows or hides the full keyboard shortcut reference at the bottom of the workout panel.</span>',
      );
    displayGroup.insertAdjacentHTML(
      'beforeend',
      '<div class="setting-row"><span>Show shortcuts in workout panel</span><button class="switch" id="sidebarShortcutToggle" aria-label="Show keyboard shortcuts in workout panel" aria-pressed="false"><i></i></button></div>',
    );
  }
  $$('#include .check').forEach((b) =>
    b.classList.toggle('active', settings.includeTypes.includes(b.dataset.type)),
  );
  Object.entries(settings.workout).forEach(([id, value]) => {
    const el = $('#' + id);
    if (!el) return;
    if (el.classList.contains('time-input')) {
      el.dataset.seconds = value;
      el.value = fmt(value);
    } else el.value = value;
  });
  time = val('roundTime');
  [
    ['shortcutLabels', settings.shortcutLabels],
    ['sidebarShortcutToggle', settings.sidebarShortcuts],
    ['showFullscreen', settings.showFullscreen],
    ['compactRoundLabels', settings.compactRoundLabels],
    ['voice', settings.voice],
    ['clapperEnabled', settings.clapperEnabled],
    ['showTimeLeft', settings.showTimeLeft],
    ['secondary', settings.secondary],
  ].forEach(([id, on]) => {
    $('#' + id).classList.toggle('on', !!on);
    $('#' + id).setAttribute('aria-pressed', String(!!on));
  });
  $('#sidebarShortcuts').classList.toggle('hidden', !settings.sidebarShortcuts);
  function applyDisplaySizes() {
    if (!clockFonts[settings.clockFont]) settings.clockFont = displayDefaults.clockFont;
    document.documentElement.style.setProperty('--clock-font', clockFonts[settings.clockFont]);
    document.documentElement.style.setProperty('--clock-scale', settings.clockSize / 100);
    document.documentElement.style.setProperty('--callout-scale', settings.calloutSize / 100);
    $('#clockFont').value = settings.clockFont;
    $('#clockFont')._syncCustomSelect?.();
    $('#clockSize').value = settings.clockSize;
    $('#clockSizeValue').textContent = settings.clockSize + '%';
    $('#calloutSize').value = settings.calloutSize;
    $('#calloutSizeValue').textContent = settings.calloutSize + '%';
    fitWorkoutToViewport();
  }
  let workoutFitFrame = 0;
  function fitWorkoutToViewport() {
    cancelAnimationFrame(workoutFitFrame);
    workoutFitFrame = requestAnimationFrame(() => {
      const viewport = $('.workout'),
        content = $('.center');
      if (!viewport || !content) return;
      content.style.setProperty('--workout-fit', '1');
      const style = getComputedStyle(viewport),
        availableWidth = Math.max(
          1,
          viewport.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 8,
        ),
        availableHeight = Math.max(
          1,
          viewport.clientHeight -
            parseFloat(style.paddingTop) -
            parseFloat(style.paddingBottom) -
            8,
        ),
        contentRect = content.getBoundingClientRect();
      let left = contentRect.left,
        right = contentRect.right,
        top = contentRect.top,
        bottom = contentRect.bottom;
      content.querySelectorAll('*').forEach((element) => {
        if (!element.getClientRects().length) return;
        const rect = element.getBoundingClientRect();
        left = Math.min(left, rect.left);
        right = Math.max(right, rect.right);
        top = Math.min(top, rect.top);
        bottom = Math.max(bottom, rect.bottom);
      });
      const contentWidth = Math.max(1, content.scrollWidth, right - left),
        contentHeight = Math.max(1, content.scrollHeight, bottom - top),
        scale = Math.min(1, availableWidth / contentWidth, availableHeight / contentHeight);
      content.style.setProperty('--workout-fit', String(Math.max(0.1, scale)));
    });
  }
  function syncSoundControls(prefix) {
    const decayKey = prefix + 'Decay';
    [prefix + 'Sound', prefix + 'Volume', prefix + 'Hits', prefix + 'Spacing', prefix + 'Pitch']
      .concat(decayKey in settings ? [decayKey] : [])
      .forEach((id) => {
        const el = $('#' + id);
        if (el) {
          el.value = settings[id];
          el._syncCustomSelect?.();
        }
      });
    $('#' + prefix + 'VolumeValue').textContent = settings[prefix + 'Volume'] + '%';
    $('#' + prefix + 'HitsValue').textContent = settings[prefix + 'Hits'];
    $('#' + prefix + 'SpacingValue').textContent = settings[prefix + 'Spacing'] + ' ms';
    $('#' + prefix + 'PitchValue').textContent = settings[prefix + 'Pitch'] + '%';
    if (decayKey in settings)
      $('#' + prefix + 'DecayValue').textContent = (settings[decayKey] / 1000).toFixed(1) + ' sec';
  }
  const targetGapLabels = ['Tight', 'Light', 'Clear', 'Extra'];
  $('#speechRate').value = settings.speechRate;
  $('#speechRateValue').textContent = settings.speechRate;
  $('#wordSpeechRate').value = settings.wordSpeechRate;
  $('#wordSpeechRateValue').textContent = settings.wordSpeechRate;
  $('#targetGap').value = settings.targetGap;
  $('#targetGapValue').textContent = targetGapLabels[settings.targetGap] || 'Tight';
  $('#wordMoveGap').value = settings.wordMoveGap;
  $('#wordMoveGapValue').textContent = settings.wordMoveGap + ' ms';
  $('#volume').value = settings.volume;
  $('#volumeValue').textContent = settings.volume + '%';
  $('#volumeIcon').textContent = settings.volume === 0 ? '🔇' : settings.volume < 50 ? '🔉' : '🔊';
  applyDisplaySizes();
  syncSoundControls('warning');
  syncSoundControls('roundStart');
  syncSoundControls('roundEnd');
  $('#warningOptions').classList.toggle('hidden', !settings.clapperEnabled);
  $('#focusChoices').classList.toggle('show', settings.focusEnabled === 'yes');
  $('#structuredOptions').classList.toggle('show', settings.focusEnabled === 'yes');
  $$('#focusChoices .check').forEach((b) =>
    b.classList.toggle('active', settings.focuses.includes(b.dataset.focus)),
  );
  $$('.segmented').forEach((group) => {
    const selected = group.querySelector('[data-value="' + settings[group.dataset.setting] + '"]');
    if (selected) {
      group.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
      selected.classList.add('active');
    }
    group.querySelectorAll('button').forEach(
      (b) =>
        (b.onclick = () => {
          const workoutControl = !!group.closest('#setup');
          if (workoutControl && !['ready', 'complete'].includes(phase)) return;
          group.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
          b.classList.add('active');
          settings[group.dataset.setting] = b.dataset.value;
          if (group.dataset.setting === 'focusEnabled') {
            const show = b.dataset.value === 'yes';
            $('#focusChoices').classList.toggle('show', show);
            $('#structuredOptions').classList.toggle('show', show);
          }
          if (workoutControl) {
            focusPlan = {};
            blockPlan = {};
            repeatLeft = 0;
            newCombo(false);
          }
          try {
            localStorage.setItem('cornerwork-settings', JSON.stringify(settings));
          } catch (e) {}
          renderComboList();
          renderCombo();
          render();
          if (['displayMode', 'brandLayout'].includes(group.dataset.setting))
            fitWorkoutToViewport();
        }),
    );
  });
  $$('#include .check').forEach(
    (b) =>
      (b.onclick = () => {
        if (b.classList.contains('active') && $$('#include .active').length === 1) return;
        b.classList.toggle('active');
        settings.includeTypes = $$('#include .active').map((x) => x.dataset.type);
        saveSettings();
        focusPlan = {};
        blockPlan = {};
        repeatLeft = 0;
        newCombo(false);
        renderComboList();
        render();
      }),
  );
  $$('#focusChoices .check').forEach(
    (b) =>
      (b.onclick = () => {
        b.classList.toggle('active');
        settings.focuses = $$('#focusChoices .active').map((x) => x.dataset.focus);
        if (!settings.focuses.length) {
          b.classList.add('active');
          settings.focuses = [b.dataset.focus];
        }
        try {
          localStorage.setItem('cornerwork-settings', JSON.stringify(settings));
        } catch (e) {}
        focusPlan = {};
        blockPlan = {};
        render();
      }),
  );
  $('#rounds').onchange = () => {
    const el = $('#rounds');
    el.value = Math.min(
      +el.max,
      Math.max(+el.min, Math.round(+el.value || settings.workout.rounds)),
    );
    settings.workout.rounds = +el.value;
    saveSettings();
    focusPlan = {};
    blockPlan = {};
    render();
  };
  ['warmupTime', 'roundTime', 'restTime', 'pace'].forEach((id) => {
    const el = $('#' + id);
    el.onfocus = () => el.select();
    el.onchange = () => {
      const parsed = parseTime(el.value),
        seconds = Math.min(
          +el.dataset.max,
          Math.max(+el.dataset.min, parsed === null ? +el.dataset.seconds : parsed),
        );
      el.dataset.seconds = seconds;
      el.value = fmt(seconds);
      settings.workout[id] = seconds;
      if (id === 'restTime') delete settings.workout.restSchedule;
      saveSettings();
      focusPlan = {};
      blockPlan = {};
      if (id === 'roundTime' && !running && phase === 'ready') time = seconds;
      if (id === 'pace' && running && phase === 'work') beginComboCadence();
      render();
    };
  });
  $$('.step-btn').forEach(
    (b) =>
      (b.onclick = () => {
        const el = $('#' + b.dataset.for);
        if (el.classList.contains('time-input')) {
          const dir = b.dataset.dir === 'up' ? 1 : -1,
            seconds = Math.min(
              +el.dataset.max,
              Math.max(+el.dataset.min, val(el.id) + dir * +el.dataset.step),
            );
          el.dataset.seconds = seconds;
          el.value = fmt(seconds);
          el.dispatchEvent(new Event('change'));
        } else {
          b.dataset.dir === 'up' ? el.stepUp() : el.stepDown();
          el.dispatchEvent(new Event('change'));
        }
      }),
  );
  $$('.switch').forEach(
    (b) =>
      (b.onclick = () => {
        b.classList.toggle('on');
        const on = b.classList.contains('on');
        b.setAttribute('aria-pressed', on);
        if (b.id === 'secondary') {
          settings.secondary = on;
          renderCombo();
          renderComboList();
        }
        if (b.id === 'voice') {
          settings.voice = on;
          if (!on) {
            cancelSpeech();
            if (roundAnnouncementActive) finishRoundAnnouncement();
          }
        }
        if (b.id === 'clapperEnabled') {
          settings.clapperEnabled = on;
          $('#warningOptions').classList.toggle('hidden', !on);
        }
        if (b.id === 'showTimeLeft') settings.showTimeLeft = on;
        if (b.id === 'shortcutLabels') settings.shortcutLabels = on;
        if (b.id === 'showFullscreen') settings.showFullscreen = on;
        if (b.id === 'compactRoundLabels') settings.compactRoundLabels = on;
        if (b.id === 'sidebarShortcutToggle') {
          settings.sidebarShortcuts = on;
          $('#sidebarShortcuts').classList.toggle('hidden', !on);
        }
        render();
        saveSettings();
      }),
  );
  $('#speechRate').oninput = () => {
    settings.speechRate = +$('#speechRate').value;
    $('#speechRateValue').textContent = settings.speechRate;
    saveSettings();
  };
  $('#wordSpeechRate').oninput = () => {
    settings.wordSpeechRate = +$('#wordSpeechRate').value;
    $('#wordSpeechRateValue').textContent = settings.wordSpeechRate;
    saveSettings();
  };
  $('#targetGap').oninput = () => {
    settings.targetGap = +$('#targetGap').value;
    $('#targetGapValue').textContent = targetGapLabels[settings.targetGap];
    saveSettings();
  };
  $('#wordMoveGap').oninput = () => {
    settings.wordMoveGap = +$('#wordMoveGap').value;
    $('#wordMoveGapValue').textContent = settings.wordMoveGap + ' ms';
    saveSettings();
  };
  $('#testComboSpeed').onclick = () =>
    sayCombo([1, 2, 'body 3', 'slip outside', 'step in', 'pivot', 'step out']);
  ['clockSize', 'calloutSize'].forEach((id) => {
    $('#' + id).oninput = () => {
      settings[id] = +$('#' + id).value;
      applyDisplaySizes();
      saveSettings();
    };
  });
  $('#clockFont').onchange = () => {
    settings.clockFont = $('#clockFont').value;
    applyDisplaySizes();
    saveSettings();
  };
  ['warning', 'roundStart', 'roundEnd'].forEach((prefix) => {
    $('#' + prefix + 'Sound').onchange = () => {
      settings[prefix + 'Sound'] = $('#' + prefix + 'Sound').value;
      saveSettings();
    };
    ['Volume', 'Hits', 'Spacing', 'Pitch']
      .concat(prefix === 'warning' ? [] : ['Decay'])
      .forEach((part) => {
        const id = prefix + part;
        $('#' + id).oninput = () => {
          settings[id] = +$('#' + id).value;
          syncSoundControls(prefix);
          saveSettings();
        };
      });
  });
  function toggleFine(buttonId, panelId) {
    const b = $('#' + buttonId),
      p = $('#' + panelId);
    b.onclick = () => {
      const open = p.classList.toggle('open');
      b.classList.toggle('active', open);
      b.setAttribute('aria-expanded', String(open));
    };
  }
  toggleFine('warningGear', 'warningFine');
  toggleFine('roundStartGear', 'roundStartFine');
  toggleFine('roundEndGear', 'roundEndFine');
  function resetSound(prefix, defaults) {
    Object.assign(settings, defaults);
    syncSoundControls(prefix);
    saveSettings();
  }
  $('#resetWarningSound').onclick = () => resetSound('warning', soundDefaults.warning);
  $('#resetRoundStartSound').onclick = () => resetSound('roundStart', soundDefaults.start);
  $('#resetRoundEndSound').onclick = () => resetSound('roundEnd', soundDefaults.end);
  $('#testWarning').onclick = playWarning;
  $('#testRoundStart').onclick = () => startDing();
  $('#testRoundEnd').onclick = () => playRoundEndSequence();
  $('#volume').oninput = () => {
    settings.volume = +$('#volume').value;
    $('#volumeValue').textContent = settings.volume + '%';
    $('#volumeIcon').textContent =
      settings.volume === 0 ? '🔇' : settings.volume < 50 ? '🔉' : '🔊';
    saveSettings();
  };
  $('#volumeToggle').onclick = (e) => {
    e.stopPropagation();
    const open = $('#volumeControl').classList.toggle('open');
    $('#volumeToggle').setAttribute('aria-expanded', String(open));
    $('#volumeToggle').setAttribute(
      'aria-label',
      open ? 'Close volume control' : 'Open volume control',
    );
    if (!open) $('#volumeToggle').blur();
  };
  $('#volumeControl').onclick = (e) => e.stopPropagation();
  const primaryControl = $('#start');
  primaryControl.onclick = (e) => {
    if (primaryHoldTriggered) {
      primaryHoldTriggered = false;
      e.preventDefault();
      return;
    }
    start();
  };
  primaryControl.onpointerdown = startPrimaryHold;
  primaryControl.onpointerup = cancelPrimaryHold;
  primaryControl.onpointercancel = cancelPrimaryHold;
  primaryControl.onpointerleave = (e) => {
    if (e.pointerType === 'mouse') cancelPrimaryHold();
  };
  primaryControl.oncontextmenu = (e) => {
    if (primaryHoldTimer) e.preventDefault();
  };
  $('#restart').onclick = restart;
  $('#skip').onclick = nextAction;
  function renderComboList() {
    const shown = visibleCombos(),
      labelFor = (c) => {
        const nums = c.m.map(numbered).join('-'),
          words = c.m.map(phrase).join(' · ');
        return settings.format === 'numbers'
          ? isOn('secondary')
            ? nums + ' | ' + words
            : nums
          : isOn('secondary')
            ? words + ' | ' + nums
            : words;
      },
      standard = shown.filter((c) => !c.custom),
      custom = shown.filter((c) => c.custom),
      standardRows = standard
        .map(
          (c) =>
            '<label class="combo-choice"><input type="checkbox" data-combo="' +
            c.id +
            '" ' +
            (locked.has(c.id) ? 'checked' : '') +
            '><span>' +
            labelFor(c) +
            '</span></label>',
        )
        .join(''),
      customRows = custom
        .map(
          (c) =>
            '<div class="combo-choice custom-combo-choice"><label><input type="checkbox" data-combo="' +
            c.id +
            '" ' +
            (locked.has(c.id) ? 'checked' : '') +
            '><span><strong>' +
            safeText(c.n) +
            '</strong><small>' +
            labelFor(c) +
            '</small></span></label><button type="button" data-edit-custom="' +
            c.id +
            '">Edit</button></div>',
        )
        .join('');
    $('#comboList').innerHTML =
      standardRows +
      (customRows
        ? '<div class="combo-group-title"><span>Custom combos</span><i></i></div>' + customRows
        : '');
    $('#comboList')
      .querySelectorAll('input')
      .forEach(
        (i) =>
          (i.onchange = () => {
            if (i.checked) locked.add(i.dataset.combo);
            else locked.delete(i.dataset.combo);
            settings.allowedCombos = [...locked];
            saveSettings();
            repeatLeft = 0;
            newCombo(false);
            renderComboList();
            render();
          }),
      );
    $('#comboList')
      .querySelectorAll('[data-edit-custom]')
      .forEach(
        (button) =>
          (button.onclick = () =>
            window.dispatchEvent(
              new CustomEvent('cornerwork-edit-combo', {
                detail: { id: button.dataset.editCustom },
              }),
            )),
      );
    const enabled = shown.filter((c) => locked.has(c.id)).length,
      level = settings.skill[0].toUpperCase() + settings.skill.slice(1);
    $('#comboCount').textContent =
      enabled === shown.length
        ? 'All ' + shown.length + ' ' + level + ' combos are enabled.'
        : enabled + ' of ' + shown.length + ' ' + level + ' combos enabled.';
  }
  function refreshShortcutInputs() {
    $$('.shortcut-input').forEach(
      (i) => (i.value = displayKey(settings.shortcuts[i.dataset.action])),
    );
    const keys = ['start', 'next', 'restart', 'mute'];
    $$('#sidebarShortcuts kbd').forEach(
      (kbd, i) => (kbd.textContent = displayKey(settings.shortcuts[keys[i]])),
    );
  }
  function normalizedKey(e) {
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return null;
    if (e.key === ' ') return 'Space';
    return e.key.length === 1 ? e.key.toUpperCase() : e.key;
  }
  $$('.shortcut-input').forEach((i) =>
    i.addEventListener('keydown', (e) => {
      e.preventDefault();
      const key = normalizedKey(e);
      if (!key) return;
      const action = i.dataset.action,
        old = settings.shortcuts[action],
        taken = Object.keys(settings.shortcuts).find(
          (a) => a !== action && settings.shortcuts[a] === key,
        );
      if (taken) settings.shortcuts[taken] = old;
      settings.shortcuts[action] = key;
      try {
        localStorage.setItem('cornerwork-settings', JSON.stringify(settings));
      } catch (err) {}
      refreshShortcutInputs();
      render();
    }),
  );
  $('#customize').onclick = () => {
    const open = $('#comboList').classList.toggle('open');
    $('#comboBulk').classList.toggle('open', open);
    $('#customize').textContent = open ? 'Done' : 'Customize';
  };
  $('#selectAllCombos').onclick = () => {
    visibleCombos().forEach((c) => locked.add(c.id));
    settings.allowedCombos = [...locked];
    saveSettings();
    renderComboList();
    newCombo(false);
  };
  $('#clearAllCombos').onclick = () => {
    visibleCombos().forEach((c) => locked.delete(c.id));
    settings.allowedCombos = [...locked];
    saveSettings();
    renderComboList();
    newCombo(false);
  };
  function openPresetModal(id) {
    showWorkoutPanel(false);
    showPreferences(false);
    const modal = $('#' + id);
    modal.tabIndex = -1;
    if (!modal.open) {
      modal.showModal();
      modal.focus({ preventScroll: true });
    }
  }
  $('#openSavePreset').onclick = () => {
    openPresetModal('savePresetModal');
    setTimeout(() => $('#presetName').focus(), 0);
  };
  $('#openLoadPreset').onclick = () => {
    renderPresets();
    openPresetModal('loadPresetModal');
  };
  $$('[data-close-modal]').forEach(
    (button) => (button.onclick = () => $('#' + button.dataset.closeModal).close()),
  );
  $$('.preset-modal').forEach(
    (modal) =>
      (modal.onclick = (e) => {
        if (e.target === modal) modal.close();
      }),
  );
  $('#savePreset').onclick = () => {
    const input = $('#presetName'),
      name = input.value.trim() || 'My workout',
      note = $('#presetNote')?.value.trim() || '',
      preset = {
        id: Date.now().toString(36),
        name: name.slice(0, 36),
        note: note.slice(0, 160),
        favorite: false,
        config: workoutSnapshot(),
        updatedAt: Date.now(),
      };
    presets.unshift(preset);
    savePresets();
    savePresetToCloud(preset);
    input.value = '';
    if ($('#presetNote')) $('#presetNote').value = '';
    renderPresets();
    $('#savePresetModal').close();
    render();
  };
  $('#presetName').onkeydown = (e) => {
    if (e.key === 'Enter') {
      $('#savePreset').click();
      e.preventDefault();
    }
  };
  function showWorkoutPanel(show) {
    const s = $('#setup'),
      button = $('#openSettings'),
      oldClose = s.querySelector('.close');
    if (oldClose) oldClose.remove();
    s.classList.toggle('drawer', show);
    button.classList.toggle('active', show);
    button.setAttribute('aria-expanded', String(show));
    if (show) {
      showPreferences(false);
      s.scrollTop = 0;
    }
  }
  $('#openSettings').onclick = () => showWorkoutPanel(!$('#setup').classList.contains('drawer'));
  function showPreferences(show) {
    if (show) showWorkoutPanel(false);
    $('#settingsPage').classList.toggle('open', show);
    $('#settingsPage').setAttribute('aria-hidden', String(!show));
    $('#preferences').classList.toggle('active', show);
    $('#preferences').setAttribute('aria-expanded', String(show));
  }
  $('#preferences').onclick = () => showPreferences(!$('#settingsPage').classList.contains('open'));
  $('#closePreferences').onclick = () => showPreferences(false);
  $('#resetAll').onclick = () => $('#resetConfirm').classList.add('show');
  $('#cancelReset').onclick = () => $('#resetConfirm').classList.remove('show');
  $('#confirmReset').onclick = () => {
    localStorage.removeItem('cornerwork-settings');
    location.reload();
  };
  $('#googleSignOut').onclick = async () => {
    try {
      if (window.google?.accounts?.id) google.accounts.id.disableAutoSelect();
      await signOut(auth);
    } catch (e) {
      cloudStatus('Could not sign out', 'Please try again', true);
    }
  };
  $$('.help').forEach(
    (b) =>
      (b.onclick = (e) => {
        e.stopPropagation();
        $$('.help')
          .filter((x) => x !== b)
          .forEach((x) => x.classList.remove('open'));
        b.classList.toggle('open');
      }),
  );
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.help')) $$('.help').forEach((x) => x.classList.remove('open'));
    if ($('#volumeControl').classList.contains('open')) {
      $('#volumeControl').classList.remove('open');
      $('#volumeToggle').setAttribute('aria-expanded', 'false');
      $('#volumeToggle').setAttribute('aria-label', 'Open volume control');
      $('#volumeToggle').blur();
    }
    if (
      $('#settingsPage').classList.contains('open') &&
      !$('#settingsPage').contains(e.target) &&
      !$('#preferences').contains(e.target)
    )
      showPreferences(false);
  });
  document.addEventListener('visibilitychange', syncWakeLock);
  document.addEventListener('keydown', (e) => {
    if ($$('dialog').some((modal) => modal.open)) return;
    if ($('#settingsPage').classList.contains('open')) {
      if (e.key === 'Escape') showPreferences(false);
      return;
    }
    if (['SELECT', 'INPUT'].includes(document.activeElement.tagName)) return;
    const key = normalizedKey(e);
    if (key === settings.shortcuts.start) {
      e.preventDefault();
      start();
    } else if (key === settings.shortcuts.next) nextAction();
    else if (key === settings.shortcuts.restart) restart();
    else if (key === settings.shortcuts.mute) $('#voice').click();
  });
  // Public API consumed by enhancements.js.
  window.CornerworkApp = {
    get settings() {
      return settings;
    },
    get phase() {
      return phase;
    },
    get presets() {
      return presets.map((p) => ({ ...p }));
    },
    get customCombos() {
      return customCombos.map((combo) => ({ ...combo, m: [...combo.m], types: [...combo.types] }));
    },
    snapshot: workoutSnapshot,
    applyConfig(config) {
      if (applyWorkout(config)) location.reload();
    },
    startWorkout: start,
    resetWorkout,
    upsertPreset(preset) {
      const clean = { ...preset, id: preset.id || Date.now().toString(36), updatedAt: Date.now() };
      const index = presets.findIndex((p) => p.id === clean.id);
      if (index >= 0) presets[index] = clean;
      else presets.unshift(clean);
      presets.sort(
        (a, b) =>
          (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0) || (b.updatedAt || 0) - (a.updatedAt || 0),
      );
      savePresets();
      savePresetToCloud(clean);
      renderPresets();
      return clean;
    },
    syncProgramProgress(progress) {
      const normalized = saveProgramProgressLocal(progress);
      saveProgramProgressToCloud(normalized);
      return normalized;
    },
    addCustomCombo(combo) {
      const clean = {
        id: 'custom-' + Date.now().toString(36),
        n: String(combo.n || 'Custom combo').slice(0, 60),
        m: combo.m.slice(0, 12),
        types: [...new Set(combo.types)],
        level: Math.min(3, Math.max(1, +combo.level || 1)),
        custom: true,
      };
      customCombos.push(clean);
      localStorage.setItem('cornerwork-custom-combos', JSON.stringify(customCombos));
      if (Array.isArray(settings.allowedCombos) && !settings.allowedCombos.includes(clean.id)) {
        settings.allowedCombos.push(clean.id);
        saveSettings();
      }
      location.reload();
    },
    updateCustomCombo(id, combo) {
      const index = customCombos.findIndex((c) => c.id === id);
      if (index < 0) return;
      customCombos[index] = {
        ...customCombos[index],
        n: String(combo.n || 'Custom combo').slice(0, 60),
        m: combo.m.slice(0, 12),
        types: [...new Set(combo.types)],
        level: Math.min(3, Math.max(1, +combo.level || 1)),
        custom: true,
      };
      localStorage.setItem('cornerwork-custom-combos', JSON.stringify(customCombos));
      location.reload();
    },
    removeCustomCombo(id) {
      customCombos = customCombos.filter((c) => c.id !== id);
      localStorage.setItem('cornerwork-custom-combos', JSON.stringify(customCombos));
      locked.delete(id);
      if (Array.isArray(settings.allowedCombos)) {
        settings.allowedCombos = settings.allowedCombos.filter((comboId) => comboId !== id);
        saveSettings();
      }
      location.reload();
    },
    exportData() {
      return {
        version: 1,
        settings,
        workouts: presets,
        customCombos,
        history: JSON.parse(localStorage.getItem('cornerwork-history') || '[]'),
        programProgress: readProgramProgressLocal(),
      };
    },
    importData(data) {
      if (data.settings) localStorage.setItem('cornerwork-settings', JSON.stringify(data.settings));
      if (Array.isArray(data.workouts))
        localStorage.setItem('cornerwork-presets', JSON.stringify(data.workouts));
      if (Array.isArray(data.customCombos))
        localStorage.setItem('cornerwork-custom-combos', JSON.stringify(data.customCombos));
      if (Array.isArray(data.history))
        localStorage.setItem('cornerwork-history', JSON.stringify(data.history));
      if (data.programProgress)
        saveProgramProgressLocal(
          mergeProgramProgress(readProgramProgressLocal(), data.programProgress),
        );
      location.reload();
    },
  };
  const fitObserver = 'ResizeObserver' in window ? new ResizeObserver(fitWorkoutToViewport) : null;
  if (fitObserver) {
    fitObserver.observe($('.workout'));
    fitObserver.observe($('.center'));
  }
  window.addEventListener('resize', fitWorkoutToViewport);
  window.addEventListener('orientationchange', fitWorkoutToViewport);
  window.visualViewport?.addEventListener('resize', fitWorkoutToViewport);
  document.fonts?.ready.then(fitWorkoutToViewport);
  refreshShortcutInputs();
  renderPresets();
  renderComboList();
  newCombo(false);
  render();
  fitWorkoutToViewport();
  initCloud();
  window.dispatchEvent(new Event('cornerwork-ready'));
})();
