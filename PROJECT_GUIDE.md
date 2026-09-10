# Cornerwork Project Guide

This is the durable product and engineering reference for Cornerwork. Read it before planning or implementing changes. Update it when the product direction, architecture, or important behavior changes.

## Product purpose

Cornerwork is a glove-friendly boxing combo coach and workout timer for heavy-bag work, shadowboxing, kickboxing, pad work, and general striking practice.

The app should feel like a focused coach in the corner. It should reduce the need to touch or study the screen during a workout, keep instructions readable from a distance, and create useful variety without producing nonsensical combinations.

## Product lane

Cornerwork should remain:

- Fast to start without requiring an account
- Useful to beginners while still configurable for experienced users
- Clear enough to operate while wearing boxing gloves
- Reliable when installed as a mobile PWA
- Private by default, with normal preferences stored on the device
- Practical and training-focused rather than game-like
- Visually consistent with the established dark boxing-gym interface

Cornerwork is not intended to become a social network, competitive leaderboard, video-streaming platform, or replacement for qualified coaching. New features should directly improve workout setup, coaching, execution, review, or continuity.

## Design principles

1. **Workout reliability comes first.** Timer, phase navigation, audio, Wake Lock, and saved settings must keep working after every change.
2. **Glanceability matters.** The clock, current phase, and combination are the visual priorities during a workout.
3. **Audio should reduce screen dependence.** Spoken combinations and phase announcements must be understandable at realistic training volume and pace.
4. **Controls must be glove-friendly.** Primary workout actions need generous targets and must remain reachable on small screens.
5. **Advanced options should not overwhelm setup.** Keep common choices visible and place detailed controls in clearly labelled collapsible groups.
6. **Help controls are quiet and consistent.** Use the shared optically aligned help glyph beside labels, with clear hover, focus, and touch behavior.
7. **Mobile and desktop share behavior.** Layout may adapt, but workout rules and settings must remain consistent.
8. **Local-first is the default.** An account is optional. Saved workout presets and completed program sessions sync through Firebase; general preferences remain browser-specific.
9. **Preserve user choices.** Existing local storage data and older saved workouts should continue to load when settings evolve.

## Product terminology

Use these labels consistently in the interface and documentation:

| Concept | Preferred label |
| --- | --- |
| User-created configuration | Custom workout |
| Guided one-time generator | Quick Start |
| Multi-session progression | Training Program |
| Editable starting configuration | Workout Preset |
| Main configuration drawer | Workout |
| Global preferences popup | Settings |
| Active work period | Round |
| Transition between timed periods | Phase |
| Spoken and displayed sequence | Combo or combination |
| Optional tactical theme | Round focus |
| Timed focus subdivision | Structured block |

## Current feature map

### Workout setup

- Workout type: Custom workout, Quick Start, Presets, and Programs
- Programs are grouped into Focus drills, Heavy bag, Shadowboxing, and Foundations tabs so users can browse by training purpose and equipment.
- Selecting a program opens its details before loading a workout. Show every session, its teaching goal, individually completed sessions, the next suggested session, and allow the user to select any session.
- Keep program details compact: shared drill instructions belong in the program header, each selectable card contains only its own session details, and the selected card is the summary above the Start button.
- Program progress records exact completed sessions. Selecting or skipping ahead does not complete earlier sessions; completion is recorded only after the chosen workout finishes.
- Programs are authored, focused workouts with a deliberate training method, progression, interval protocol, or fight structure. After loading one, lock its workout, combo, coaching, and focus controls while leaving the Workout Type section available so the user can switch away.
- Progressive Combinations, Technical Round Themes, Tabata Boxing, Punch-Out Intervals, and Fight Simulation belong in Programs rather than Presets.
- Presets are generic editable starting configurations built from the normal Cornerwork controls and combo library. Selecting one always reloads its complete default configuration; users must save the workout to keep their edits. Quick Start and Presets remain editable after loading.
- Focused bag programs can assign one sustained technique for a randomized block. Explain the drill once, then announce only each new assignment. Shuffle every available assignment before repeating one, avoid immediate repeats across shuffle cycles, and rebuild the order for every workout.
- Every focus drill offers separately tracked 10, 15, and 20-minute versions. The 10-minute version preserves the original two-round class format. Longer versions use two-round work blocks with short rests inside a block and a longer recovery between blocks.
- Focused programs currently cover jab variations, high-low straights, hooks, inside fighting, speed and power changes, defense and counters, and footwork entries. Their short on-screen directions must state what the boxer repeats.
- Dedicated focus drills do not use the normal random round-focus planner. Their assignment system governs every round, so their timeline pips remain unlabeled unless a future drill defines a genuine round-specific change.
- Quick Start generates a varied setup from duration, goal, main focus, skill level, equipment, round style, technique mix, and coaching preference, then leaves that setup editable
- Timing: rounds, warmup, round length, rest, and combo frequency
- The Workout timing grid includes an Edit coaching button that opens workout-specific coaching controls
- Training modes: Bag, Shadowboxing, and General
- Skill levels: Basic, Intermediate, and Advanced
- Included techniques: punches, body shots, defense, footwork, kicks, knees, and elbows
- Advanced combo setup: complexity, repeats, movement between combos, and unique rounds
- Allowed-combo selection and custom combo creation
- Optional round focuses and 30 or 60-second structured blocks

### Workout execution

- Ready, warmup, work, rest, and complete phases
- Spoken round announcements followed by the configured start sound
- First combo hidden until the round announcement and start sound finish
- Randomized compatible combos with duplicate avoidance and optional repeats
- Optional coaching cues and compatible between-combo movement
- Final-seconds warning and configurable round bells
- Punch-out intervals, round focus labels, progress markers, and completion statistics
- Start/pause, previous phase, next phase, and hold-to-restart controls
- Remappable keyboard shortcuts and screen Wake Lock while running
- Standard and compact main-page layouts with the same workout information and controls
- Full round-focus labels wrap to two lines inside timeline pips, with an optional compact abbreviated-label display setting

### Saving and continuity

- Browser-local settings, custom combos, presets, history, program progress, and panel state
- Saved workouts and account controls remain visible at the bottom of the Workout panel and are not part of its collapsible tab state
- Optional Google sign-in and Firebase syncing for saved workout presets and completed program sessions
- Coaching reminders, cue frequency, recovery instructions, and guided-beginner choices are included in saved and shared workouts
- Saved-workout notes, favourites, duplication, search, links, and QR sharing
- Backup and restore for local settings, workouts, custom combos, history, and program progress
- Share links import a workout only after the user chooses Save or Use

### Additional tools

- Technique catalogue
- Camera mirror and optional local recording download
- Workout history and streak statistics
- PWA installation and offline support
- Appearance, accessibility, audio, and display preferences

## Behavioral invariants

These rules are easy to break and should be deliberately verified after related changes.

### Timer and phases

- Phase order is Ready, optional Warmup, Round, optional Rest, next Round, then Complete.
- Previous and Next move one phase at a time.
- Workouts may define a per-round rest schedule. Time remaining, total duration, phase navigation, history, saving, and sharing must use that schedule rather than assuming every rest is the same length.
- Pausing stops timers, combo cadence, and active speech.
- Holding the paused primary button for 1.2 seconds resets the entire workout.
- Workout time remaining includes the current phase and all remaining work and rest periods.
- Settings that define a workout are locked while a workout is active.

### Combo generation

- A combo must match the selected skill level, complexity, included technique types, and allowed-combo list.
- Training mode and active focus adjust selection preference without allowing incompatible combos.
- The same sequence should not be selected twice consecutively when alternatives exist.
- With Unique rounds enabled, used-combo memory continues across round breaks until the compatible pool is exhausted.
- Focus planning is built when Start is pressed. Focus labels are not revealed on the ready screen.
- Structured blocks announce focus changes and then resume the combo cadence.

### Audio

- Voice volume follows the main workout volume.
- Number speed and word speed are independent.
- Normal combo frequency begins after the complete spoken combination and any attached coaching cue finishes.
- iPhone and iPad speech rate is compensated so it better matches desktop playback.
- Round announcements use normal announcement timing, not combo readout speed.
- Warning audio interrupts the current callout near the end of the round and then restores cadence.
- Custom workouts, Quick Start, Presets, and Programs all use the same configured round-start, final-warning, and round-end sound sequence. Starting a workout unlocks one reusable audio engine so delayed program instructions cannot prevent later bells on mobile.
- Sound tests must use the currently selected fine-tuning values.

### Mobile layout

- The complete workout display scales down as one unit when the available window cannot contain the selected clock and callout sizes.
- Compact layout reorganizes the same phase, timer, callout, statistics, timeline, and controls without removing workout functions.
- Resizing, rotating the device, or changing display-size settings must not introduce page scrollbars or push workout controls offscreen.
- The main workout must fit inside the visible mobile viewport without the top being pushed offscreen.
- Normal page scrolling and overscroll are suppressed during the workout interface.
- The Workout drawer and Settings popup must scroll internally when their content exceeds the viewport.
- The volume panel overlays the interface instead of pushing controls or content.
- Pinch zoom is locked by default, with an Accessibility setting to allow it.
- Desktop behavior must remain stable when a fix targets mobile.

## Runtime architecture

Cornerwork is a static application with no build step.

```text
cornerwork/
├── AGENTS.md                 Repository workflow rules for coding agents
├── PROJECT_GUIDE.md          Product direction and behavioral reference
├── README.md                 Public project overview and setup
├── CONTRIBUTING.md           Contribution expectations
├── .github/workflows/        GitHub Pages deployment
└── dist/                     Complete deployable website
    ├── index.html            Semantic page structure and controls
    ├── manifest.webmanifest  PWA metadata
    ├── sw.js                 Offline cache and update handling
    └── assets/
        ├── css/
        │   ├── app.css       Core interface and responsive layout
        │   └── features.css  Enhanced tools and component styling
        ├── js/
        │   ├── app.js        Timer, combos, audio, settings, persistence, and sync
        │   ├── bootstrap.js  Early mobile behavior and enhancement loader
        │   └── enhancements.js Additional workout types, tools, history, and UI
        └── icons/            Browser and installable-app icons
```

### Script responsibilities

`app.js` owns the core application state and publishes `window.CornerworkApp`. It also dispatches `cornerwork-ready` after initialization.

`bootstrap.js` installs behavior that must exist early, including the mobile zoom lock, then loads `enhancements.js`.

`enhancements.js` consumes `window.CornerworkApp`. It initializes immediately when the API is available or waits for `cornerwork-ready`.

Keep this boundary stable until a deliberate module migration is planned and tested. Do not casually duplicate core state inside the enhancement layer.

### Persistent storage

| Key | Purpose |
| --- | --- |
| `cornerwork-settings` | Workout, display, audio, accessibility, and shortcut settings |
| `cornerwork-presets` | Locally saved workout presets |
| `cornerwork-custom-combos` | User-created combinations |
| `cornerwork-history` | Completed workout records |
| `cornerwork-program-progress` | Completed program sessions |
| `cornerwork-setup-mode` | Current custom, quick, program, or mode selection |
| `cornerwork-active-selection` | Selected preset description |
| `cornerwork-custom-workout` | Last custom setup before loading a preset |
| `cornerwork-workout-fold-state` | Last open Workout panel groups |
| `cornerwork-allow-page-zoom` | Mobile zoom accessibility preference |

Session storage is used for pending shared workouts, active program sessions, and service-worker update coordination.

## Change workflow

Before changing code:

1. Read this guide and `AGENTS.md`.
2. Identify which behavioral invariants are affected.
3. Check the current mobile and desktop behavior before assuming it is broken.
4. Make the smallest coherent change.

Before publishing:

1. Run `node --check dist/assets/js/app.js`.
2. Run `node --check dist/assets/js/bootstrap.js`.
3. Run `node --check dist/assets/js/enhancements.js`.
4. Run `node --check dist/sw.js`.
5. Run `git diff --check`.
6. Verify every local asset referenced by HTML, CSS, the manifest, and the service worker exists.
7. Test setup, start, pause, resume, previous, next, reset, and workout completion.
8. Test the affected flow at desktop width and iPhone-sized width.
9. When page scripts or styles change, update their query-string versions in `index.html`, update the enhancement version in `bootstrap.js`, and increment the cache name in `sw.js`.
10. After pushing, confirm the GitHub Pages workflow succeeds and the deployed app serves the new cache version.

## Decision test for new ideas

Before adding a feature, ask:

- Does it improve workout setup, coaching, execution, review, or continuity?
- Can it be understood without adding clutter to the primary workout screen?
- Does it work without an account whenever practical?
- Will it remain reliable on mobile Safari and as an installed PWA?
- Is its training behavior practical and explainable?
- Can it be added without weakening timer, audio, persistence, or offline behavior?

If most answers are no, the feature is outside Cornerwork's current lane.
