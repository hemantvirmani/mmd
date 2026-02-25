# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

No build step or package manager. Open `index.html` directly in a browser:
- Double-click `index.html`, or
- Serve locally with any static file server (e.g., `python -m http.server`)

## Architecture

This is a fully client-side, zero-dependency (no npm) Mermaid diagram editor. All logic is in three plain JS/CSS files loaded by `index.html`.

**Script load order matters** — `constants.js` must load before `app.js`:
- `constants.js` — defines the single global `APP_CONST` object: all string labels, localStorage keys, layout constraints, and the default diagram code.
- `app.js` — entire application logic wrapped in an IIFE. Reads from `APP_CONST`. No modules, no imports.
- `styles.css` — CSS custom properties for the color theme, split-layout grid (using CSS `fr` units via `--left-pane-width` / `--right-pane-width`), and responsive breakpoint at 980px.

**External CDN dependencies** (pinned versions, no local copies):
- Mermaid `10.9.1` from `cdn.jsdelivr.net`
- Font Awesome `6.5.1` from `cdnjs.cloudflare.com`

**State managed in `app.js`:**
- `state.fileLoaded` / `state.currentFile` — tracks whether a disk file or draft is active; controls whether "Save to Disk" is enabled.
- `state.splitRatio` — panel split position (0.25–0.75), persisted to `localStorage`.
- Three `localStorage` keys defined in `APP_CONST.storage`: `mmd_code` (source text), `mmd_file_meta` (JSON with `source` and `name`), `mmd_split_ratio`.

**Shareable URLs** — the current diagram is always reflected in `window.location.hash` as `#code=<base64url>`. The base64 encoding handles Unicode via `TextEncoder`/`TextDecoder`.

**Render flow** — `renderAndPersist()` is the central function: saves to localStorage, updates URL hash, then calls `mermaid.render()` and injects the returned SVG into `#mermaidOutput`.

**File source states** — `currentFile.source` is either `"disk"` (loaded via File API) or `"draft"` (typed by user). Disk files enable Save; typing in the editor while no disk file is loaded transitions to draft state.
