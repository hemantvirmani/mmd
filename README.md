# Mermaid Editor

A lightweight, fully client-side Mermaid diagram editor with live preview.

## Features
- Side-by-side editor and preview panels
- Syntax highlighting in the editor (Prism)
- Live Mermaid rendering as you type
- Load diagram files from disk (`.mmd`, `.mermaid`)
- Save current diagram back to disk
- Shareable URL (diagram source in URL hash)
- Local persistence (`localStorage`) for code, file metadata, and split-pane ratio
- Resizable desktop split pane (mouse + keyboard)

## Run Locally
No build step is required.

1. Clone or download this folder.
2. Open `index.html` in a browser.

You can also serve it with any static file server if preferred.

## Usage
- `Load from Disk`: opens `.mmd` / `.mermaid` files.
- `Save to Disk`: saves current content to the loaded filename (or `diagram.mmd` for drafts).
- `Copy Share URL`: copies a link containing the current diagram source.
- `Tab` inside the editor inserts 4 spaces.

## Layout Controls
- Desktop only (`window.innerWidth > 980`): drag the center splitter.
- Keyboard resize: focus splitter and press `ArrowLeft` / `ArrowRight`.
- Split ratio is fixed at `40%` (editor) / `60%` (preview).

## Share URL Format
Diagram source is stored in the URL hash:

`#code=<base64-utf8>`

The value is UTF-8 encoded, then Base64 encoded, then URL-escaped.

## Persistence
The app stores data in `localStorage` under these keys:
- `mmd_code`
- `mmd_file_meta`
- `mmd_split_ratio`

## Dependencies (CDN)
- Mermaid `10.9.1`
- Prism `1.29.0`
- Font Awesome `6.5.1`

## Hosted URL
https://h.virmani.cc/mmd/

## Notes
- No backend services are used.

## License
- This project is licensed under the MIT License. See `LICENSE`.
- Mermaid.js is MIT licensed: https://github.com/mermaid-js/mermaid/blob/develop/LICENSE
