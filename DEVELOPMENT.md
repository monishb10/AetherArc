# Developing AETHER ARC

Start with the three setup commands in `README.md`. The app uses TypeScript, React, Canvas 2D, Web Audio, Vinext/Vite, and a local Cloudflare D1 emulator.

## Change attack feel

Edit `moveFor()` in `game/motion.ts`:

| Field | Meaning |
|---|---|
| `duration` | Entire move length, in seconds |
| `contact` | Fraction of the move when the strike releases (0–1) |
| `lunge` | Forward root travel, in canvas pixels |
| `reach` | Descriptive move range; hit rules currently live in `release()` |
| `technique` | Visual/choreography family |

`BattleEngine.release()` owns skill delivery and hit range. `BattleEngine.hit()` owns damage, guard, recoil, launch speed, hit stop, and energy. If you change an action's timing, keep its `contact` frame and the pose sampling aligned. The simulation uses steps of at most 1/120 second; rendering runs with requestAnimationFrame.

`samplePose()` samples keyed windup/contact/recovery values, a distance-based run cycle, and states for guard, recoil, airborne movement, awakening, and victory. `buildRig()` in `game/rig.ts` rotates connected bone segments. Keep deformation modest so weapons and faces stay recognizable. `sprites.ts` skins a 20×28 mesh into a bounded cache, then places it using the source foot anchor.

For a unique character move, add an explicit character-ID branch in `moveFor()` or `ultimateFor()`. Add its delivery in `release()` and its drawing in `effects.ts`. Reuse existing families where appropriate. The current families are rush, slash, beam, volley, blink, quake, uppercut, and vortex.

## Add better source animation frames

Source images live in `public/art/fighters/`. Each character's manifest entry in `game/sprite-manifest.json` provides six slots:

0. Ready
1. Movement / air
2. Light strike
3. Heavy / power strike
4. Dash
5. Recoil / defeat

The 57 two-pose characters intentionally reuse images across those slots. Replace those slots with additional consistent transparent paintings to increase animation detail. Each frame has `src`, `w`, `h`, `ax`, and `ay`; `ax/ay` are the anchor in source pixels. Keep feet aligned when switching poses. `height/sourceHeight` controls display scale.

Naruto, Ichigo, and Tanjiro now override those slots with 12-frame sequences in `game/clip-manifest.json`. `game/clips.ts` selects run frames from stride, synchronizes strikes with `moveFor().contact`, and selects recoil, airborne knockdown, and prone frames. These paintings draw directly without bending weapons through a mesh. `public/art/animation/` holds the cropped runtime images. Original transparent atlases and anchor coordinates are in `assets/animation-source/`; `scripts/prepare-starter-clips.py` reproduces the crops with Pillow, NumPy, and SciPy.

## Tune defeats

`checkEnd()` converts the loser's foot origin to a hip origin and applies the finishing launch velocity. `updateKnockout()` integrates gravity, a single rebound, floor contact, and friction. Mesh fighters rotate around the hip; the three starter clips switch through drawn recoil, airborne, and prone poses. `knockoutFloorOffset()` accounts for the actual prone frame's bottom edge. Results settle after 3.4 seconds, once the body has landed. Do not resume normal fighter control after a knockout.

Test fighters of different heights. In the lab select an opponent, use **Preview knockout**, and inspect at quarter speed. Pause then use **Step frame** for precise observation. Reset before another preview.

## Visual effects

`effects.ts` uses canvas geometry for transient combat effects. Effect positions are world coordinates. Beams have endpoints; sword arcs sweep during their lifetime; quakes originate at the floor; charge effects are tied to the move clock. Keep particle and effect counts bounded. Campaign Settings can reduce particles and disable camera/trail motion.

## Saves and data

Campaign save updates live in `app/api/game/route.ts` and `game/progression.ts`. Do not implement reward balances only in React. The API uses request receipts and an optimistic version check to prevent duplicate settlement. Keep IDs stable when changing characters or arenas so existing saves continue to resolve them.

The animation lab creates a temporary in-memory match and never calls the save API. Campaign progression intentionally remains locked even though the lab can preview every fighter.

## Useful checks

```bash
pnpm test:game
pnpm exec tsc --noEmit
pnpm build
```

For visual checks, try a sword fighter (Ichigo), a rush fighter (Naruto), a beam fighter (Goku), and a two-pose fighter (Nezuko). Inspect basic attacks, both skills, ultimate, recoil, guard, air movement, and knockout. Check a full campaign match after combat changes, including saved rewards.

## Included and excluded

The source archive includes application code, all 77 fighter assets, all 25 arena paintings, fonts, dependency lockfile, migrations, tests, and these instructions. Install dependencies locally. The `play/` browser build is included for immediate play. Runtime caches, `node_modules`, server build output, Git history, credentials, and player saves are excluded.

## Complete edition: GitHub Pages and local play

The easiest development loop is now `pnpm dev:pages`. It runs `standalone/main.tsx` with the same `Home`, `BattleEngine`, and progression rules as the server edition. `pnpm build:pages` writes `play/`; `pnpm play` serves that prebuilt directory using Node's HTTP module alone.

`game/runtime.ts` resolves assets relative to the deployed document in this edition. Always use `assetUrl()` for images loaded from TypeScript, and `gameHome()` for home/navigation links. Do not introduce root-absolute `/art/...` URLs in browser-edition UI code.

`game/request.ts` selects the save implementation. Sites uses `/api/game`; the standalone entry opts into browser storage. The browser adapter calls the same `applyAction()` rules and saves request receipts. Web Locks serialize saves across tabs where supported. Storage errors are shown and never silently reset a corrupted save. Treat local saves as player-controlled; they are not suitable for competitive rankings.

`.github/workflows/pages.yml` builds and deploys from `main`/`master`. Pages must be enabled with GitHub Actions as the publishing source. The Actions workflow builds `play/` itself, so that generated directory should not be committed.

## Skeletal animation renderer

`game/rig.ts` now supplies a forward-kinematics rig with 11 bones: torso/neck/head and two segments per arm and leg. Run cycles alternate thigh and knee movement; strikes, guard, recoil, jump, and defeat have their own joint angles. Bone lengths remain fixed. Adjust `buildRig()` joint placements or angles to fit a new character costume.

`game/sprites.ts` assigns normalized weights on a 20×28 mesh and transforms vertices using that rig. `game/mesh-renderer.ts` rasterizes the mesh through one shared WebGL context at 2x resolution for cleaner edges, with a Canvas 2D fallback. Texture and frame caches are bounded. This improves edge rendering; it does not invent missing detail in the source painting. Add higher-resolution source frames when you need more painted detail.
