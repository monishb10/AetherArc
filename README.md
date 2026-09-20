# AETHER ARC — Complete Edition

One project for **playing, editing, and publishing**. Includes all 77 fighters, 25 arenas, combat/progression code, artwork, and the animation lab.

This edition adds 12 illustrated animation frames each for Naruto, Ichigo, and Tanjiro, including running, strike anticipation/contact/recovery, guard, recoil, airborne defeat, and a prone landing. The other 74 fighters use the improved joint-driven renderer. Attack frames follow combat contact timing; knockouts include a launch, rebound, and grounded finish.

## 1. Play the included game

The ZIP includes a ready-built `play/` folder. Install Node.js 22.13 or newer, extract the ZIP, then:

- **Windows:** double-click `PLAY.bat`.
- **macOS:** run `sh PLAY.command` from the extracted project folder.
- **Any platform:** run `node scripts/play.mjs`.

The launcher opens the game in your browser. Keep its terminal open while playing. No dependency installation, cloud account, database setup, or API key is required for this prebuilt edition. Open the printed local address manually if the browser does not open automatically. Do not double-click `play/index.html`: browsers restrict JavaScript modules opened as local files.

Progress for this edition is saved on the same browser and device. The launcher keeps a stable address at `http://127.0.0.1:4174/` so your save returns when you reopen it. Clearing site data removes that save. It is separate from the hosted Sites edition's server save.

## 2. Publish on GitHub Pages

1. Create your GitHub repository. Extract the ZIP and push the **contents of the `aether-arc` folder** to the repository root. `package.json` and `.github/workflows/pages.yml` must be at that root.
2. In the repository, open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Open **Actions → Publish playable game → Run workflow** if the initial push happened before enabling Pages. Future pushes to `main` or `master` trigger it automatically.
4. Wait for the workflow to succeed. Open the deployment link shown in the workflow or Settings → Pages.

The included workflow installs the pinned dependencies, runs the game checks, builds the static edition, and publishes it. The build uses relative paths so images and fonts work both on a repository subfolder and on a custom domain. You do not need to edit a repository name in the source. The generated `play/` directory is ignored by Git because Actions rebuilds it from source.

GitHub Pages hosts the browser edition: campaign, boxes, roster, battles, settings, and local progression all work without a backend. The `api/game` server is not required for that edition. Your repository must have Pages available for its visibility/account plan. See [GitHub's workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## 3. Modify the game

Install Node.js 22.13+ and pnpm 11.25.0. In the project folder:

```bash
pnpm install --frozen-lockfile
pnpm dev:pages
```

Open the address printed in the terminal. Changes reload automatically. To rebuild the included playable edition:

```bash
pnpm test:game
pnpm build:pages
pnpm play
```

If pnpm is missing: `npm install --global pnpm@11.25.0`. On Windows, use Command Prompt or `pnpm.cmd` if PowerShell blocks scripts. You do not need to weaken the computer's execution policy.

See **DEVELOPMENT.md** for animation, combat, character, and save-system files.

## Animation lab

Add `?lab` to the browser edition URL, for example `http://localhost:5173/?lab`. In the server edition, use `/lab`.

Choose any fighter and arena; trigger attacks, skills, ultimate, run cycle, and knockout. Use half/quarter speed or pause and **Step frame**. The lab never edits campaign progress.

## Controls

| Key | Action |
|---|---|
| A / D or arrows | Move |
| Space / W | Jump |
| J → J → J | Three-hit light chain |
| K | Heavy attack / launcher |
| S / down | Guard |
| Shift / X | Dodge / dash |
| Q / E | Character skills |
| R | Awakening |
| F | Ultimate at 100% energy |
| C / T | Support / tag |
| Escape | Pause |

Campaign controls also support touch/mouse. Start with Naruto, Ichigo, and Tanjiro; complete training for Luffy and a Rare Box. Unlock other fighters through play. All 25 arenas are immediately available.

## Optional server-backed edition

The existing Sites/Cloudflare Worker edition remains in the same source tree. To work on its persistent API locally:

```bash
pnpm setup:local
pnpm dev
```

Its local D1 data lives in `.wrangler/state`. Build with `pnpm build`, then `pnpm start` to serve the built Worker locally. The `.openai/hosting.json` file identifies the original Site and its logical database binding; it is not a credential. A separate server deployment needs its own database and trusted identity configuration.

## Scope and included files

This is a 2D illustrated fighting game, with shared skeletal animation and pose artwork. It is not a 3D commercial fighting-game engine or 77 individually hand-keyed rigs. There is no online multiplayer or competitive anticheat server.

The ZIP contains editable source, the ready-built browser game, all artwork and fonts, the dependency lockfile, tests, launchers, and GitHub Pages automation. It excludes account tokens, private environment files, installed dependencies, Git history, and player saves. Anime characters belong to their respective rights holders; included art is for this fan prototype. Dependencies retain their own licenses.
