# Starter animation source artwork

These three transparent PNG atlases were generated with the built-in image generation tool for this project. They are included so the animation frames can be recropped or replaced when developing the game. The web runtime loads only the WebP crops in `public/art/animation/`.

## Generation brief

Create a square transparent atlas with 4 columns and 3 rows, twelve isolated full-body right-facing poses. Use detailed cel-shaded anime artwork, consistent proportions and clothing, complete feet/hands/weapons, transparent gutters, no effects, no text and no grid. The rows are:

1. Four consecutive running poses: extension, passing, opposite extension, passing.
2. Attack anticipation, extended strike, follow-through, ready recovery.
3. Crouched guard, backward recoil, curled airborne knockout, horizontal prone knockout with head left and feet right.

Character variants: Naruto Uzumaki in orange/black with a punch sequence; Ichigo Kurosaki in black shihakusho with his large sword; Tanjiro Kamado in his checkered haori and dark uniform with katana. Existing character art supplied identity references. Tanjiro's final prompt further requested burgundy hair, an overhead sword windup, horizontal slash, low follow-through, and broad gutters. Artwork may need additional artist cleanup for a commercial production.

## Rebuild the runtime frames

Install Pillow, NumPy, and SciPy, then run `python scripts/prepare-starter-clips.py` from the project root. The script only crops the original alpha silhouettes; it does not generate or redraw art. `anchors.json` records origin and scale adjustments. The Tanjiro atlas has one touching blade/boot at a cell boundary; the script separates that gutter for extraction.

Frame order and combat timing are defined in `game/clips.ts`. Use the animation lab to check changes before rebuilding the game.
