# Visual Illusions Lab

A self-contained outreach web app with eleven browser-generated visual illusion demos. The animation surface is driven by jsPsych 8 and `@kurokida/jspsych-psychophysics` 5.1 in PIXI mode, with PixiJS 8 providing WebGL/GPU rendering.

## Structure

- `dist/index.html` — application shell
- `dist/js/app.js` — navigation, controls, presentation mode, and psychophysics timeline
- `dist/js/illusions/*.js` — independent metadata, controls, defaults, and Canvas fallbacks
- `dist/js/pixi-scenes.js` — persistent PIXI stimulus factories and the small Canvas fallback bridge
- `dist/js/utils.js` — shared drawing helpers
- `dist/vendor/` — pinned browser bundles for jsPsych, the psychophysics plugin, and PixiJS

Each demonstration has its own state and controls. jspsych-psychophysics receives one plain built-in stimulus per illusion; its `change_attr` callback updates a persistent PIXI scene containing the textures, geometry, transforms, and visibility. PIXI display trees stay outside the jsPsych parameter resolver to avoid circular-object recursion in Firefox. There is no top-level `raf_func` Canvas animation loop.

## Source-derived assets and behaviour

- Change-blindness pairs are extracted from [Ronald Rensink's downloadable flicker examples](https://www.cs.ubc.ca/~rensink/flicker/download/index.html) and enlarged with deterministic Lanczos resampling so the A/B differences remain unchanged.
- Stepping Feet defaults to eight bars per equal-length foot and supports every integer bar count for both the stepping and rectangular “worms” variants.
- The Pac-Man demo follows [Infinite Maze](https://github.com/smathot/infinitemaze): run at the source's six-frame cadence, blink multicoloured pearls, and generate a fresh random maze while preserving the local region around and behind Pac-Man.
- Flash Grab reproduces the reference sequence with counter-rotating pinwheels and alternating green/red aligned flashes at each reversal.
- Breathing Square follows Michael Bach's reference geometry: a constant rigid square rotates behind four opaque quadrants separated by a cross-shaped opening.

## Keyboard controls

- Left / right arrows: previous / next illusion
- Space: pause / resume
- P: presentation / explore mode
- F: fullscreen
- Escape: leave presentation mode
