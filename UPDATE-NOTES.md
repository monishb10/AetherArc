# AETHER ARC — Combat Upgrade

Built from your attached AetherArc-main source on 22 September 2026.

## What changed

- Distance-driven footwork, acceleration and braking, and slower backsteps replace abrupt starts and wide swinging knees. The shared rig uses two-bone inverse kinematics; its sole constraint keeps shoes level. Dedicated Naruto, Ichigo, and Tanjiro run frames retain their original artwork and reverse correctly during backsteps.
- CPU fighters move into their actual attack range, react to visible windups, block, dodge heavy attacks and projectiles, counter recovery, use awakening, and connect short combos. Reactions include delay and probability. Difficulty options remain available.
- Base health is 18% higher and damage before defense is 24% lower. Long combos have damage scaling. Ultimate charging is slower.
- Fixed invalid opponent HP when a team has no individual level array. Replacement menus reject combat input and allow defeated bodies to finish landing.
- Animation memory now has both a frame-count limit and a pixel budget. GPU surfaces only resize when dimensions change.
- Corrected the replacement snapshot element type so TypeScript builds successfully.

## Verification

- 43 existing and new automated regression checks passed, covering progression, saves, all 77 fighters, all 25 arenas, all skills, guard/dodge, contact timing, knockout settlement, three-fighter elimination, replacement selection, and grounded run joints.
- Eight deterministic full 3v3 matches completed with no stalled match. Using the same scripted player and teams, the attachment averaged 43 simulated seconds; this update averaged 98 seconds. The scripted player won 8/8 before and 2/8 after. This is a balance check, not a promised duration or a human difficulty rating.
- TypeScript checking and the static production build passed.
- The included Node launcher served the build entry files and all 298 unique fighter, animation, lobby, and arena artwork URLs successfully as images. Root and repository-subfolder asset resolution checks passed.
- Five representative fighters were rendered directly through the Canvas 2D path for movement inspection. The contact sheet is in docs/combat-run-preview.png.
- Interactive browser testing was unavailable because this environment blocked the local preview URL. The GPU path and physical keyboard/touch play still need a check on your own device.

## Play and edit

Extract the complete archive. With Node.js 22.13 or newer installed, double-click PLAY.bat on Windows, or run node scripts/play.mjs. No dependency installation is needed to play the included build.

For editing, use pnpm install --frozen-lockfile, then pnpm dev:pages. After editing, run pnpm test:game and pnpm build:pages to update play/. The GitHub Pages workflow is included.

All 77 fighters, 25 arenas, your upright lobby, and 3v3 elimination remain. Existing save keys and formats are unchanged. Local progress belongs to its browser origin, so a different host or port has a separate save.

## Artwork scope

This improves the existing 2D artwork and shared rig. It does not add new hand-drawn run/attack sequences for all 77 characters. Naruto, Ichigo, and Tanjiro retain their 12-frame sets; most other fighters still use the attachment's smaller pose sets with procedural animation. More unique source frames will further improve character-specific combat.
