# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A single-page Tetris implementation in vanilla JavaScript with HTML5 Canvas — no dependencies, no build step, no package.json. Three files: `index.html`, `style.css`, `game.js` (~300 lines).

## Running / testing

There is no build, lint, or test tooling. To run the game, open `index.html` directly in a browser, or serve it locally:

```bash
python3 -m http.server 8000   # or: npx serve .
```

Verify changes manually in a browser — there is no automated test suite.

## Architecture

Everything lives in `game.js` as top-level state and functions (no classes, no modules).

- **Board model**: `board` is a `ROWS × COLS` array of arrays; each cell is `0` (empty) or a piece color index `1–7`.
- **Pieces**: `PIECES` defines each tetromino as a square matrix. Rotation is done by `rotateCW` (transpose + reverse), not by precomputed rotation states.
- **Collision** (`collide`): checks a shape against board bounds and already-locked cells; reused for movement, rotation, ghost-piece projection, and lock detection.
- **Wall kicks** (`tryRotate`): after rotating, tries horizontal offsets `[0, -1, 1, -2, 2]` until one doesn't collide.
- **Game loop** (`loop`): driven by `requestAnimationFrame`; accumulates elapsed time in `dropAccum` and advances the piece one row when it exceeds `dropInterval`.
- **Locking/scoring flow**: `lockPiece` → `merge` (writes piece into `board`) → `clearLines` (removes full rows, shifts scoring/level/speed) → `spawn` (promotes `next` to `current`, generates a new `next`, and calls `endGame` if the new piece immediately collides).
- **Speed curve**: level increases every 10 lines; `dropInterval = max(100, 1000 - (level - 1) * 90)` ms.
- **Rendering**: `draw()` clears and redraws the grid, locked board, ghost piece (`ghostY`, alpha 0.2), and current piece every frame on `#board`; `drawNext()` renders the next piece on the separate `#next-canvas`.

Tunable constants live at the top of `game.js`: `COLS`, `ROWS`, `BLOCK`, `COLORS`, `LINE_SCORES`, `dropInterval`. If `COLS`, `ROWS`, or `BLOCK` change, update the `#board` canvas `width`/`height` in `index.html` to match (`COLS × BLOCK`, `ROWS × BLOCK`).

The README (in Spanish) has a more detailed walkthrough of the game flow if deeper context is needed.
