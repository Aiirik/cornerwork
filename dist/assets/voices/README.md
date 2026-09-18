# Cornerwork bundled voices

Cornerwork ships compressed offline voice packs generated with Kokoro 82M v1.0. The model and
`kokoro-js` are licensed under Apache 2.0. The generated packs are maintained as Cornerwork assets.

## Adding or changing spoken text

Whenever a spoken combo move, announcement, coaching cue, focus, drill instruction, or other voice
line changes:

1. Update `.github/scripts/voice-lines.mjs` with the exact new phrase. Keep useful multi-word lines
   together so they sound natural.
2. Run `npm install`. On CPU-only Linux, use
   `ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm install`.
3. Run `npm run voice:generate`. This regenerates every bundled voice sprite and its clip manifest.
4. Run `npm run voice:check`.
5. Test the new line with every bundled voice and with Device voice selected.
6. Increment the script versions in `dist/index.html`, the enhancement version in
   `dist/assets/js/bootstrap.js`, and the cache version in `dist/sw.js` before publishing.

If a bundled voice cannot resolve a line, Cornerwork deliberately falls back to the selected device
voice instead of dropping the instruction.

Bundled playback uses the Web Audio sprite engine. Tempo-adjusted combo readouts are assembled into
a temporary WAV and use the browser's native pitch-preserving media playback, with Web Audio as the
reliability fallback. Test both Cornerwork and Device voice modes on mobile whenever this changes.

## Adding another bundled voice

Add an entry to `VOICE_PACKS` in `.github/scripts/voice-lines.mjs`, regenerate, and add the new
choice to `#bundledVoice` in `dist/index.html`. A voice pack is one Opus audio sprite, so adding a
voice does not create hundreds of network requests.

Model: <https://huggingface.co/hexgrad/Kokoro-82M>
