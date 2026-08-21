'use strict';

// Palette shape matches game.js COLORS: index 0 unused, 1-8 hex colors.
const SKINS = {
  retro: {
    palette: [
      null,
      '#4dd0e1', '#ffd54f', '#ba68c8', '#81c784',
      '#e57373', '#90caf9', '#ffb74d', '#f06292',
    ],
    drawBlock(context, x, y, colorIndex, size, alpha) {
      const palette = SKINS.retro.palette;
      const color = palette[colorIndex];
      if (!color) return;
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = color;
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      // highlight
      context.fillStyle = 'rgba(255,255,255,0.12)';
      context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
      context.globalAlpha = 1;
    },
  },

  neon: {
    palette: [
      null,
      '#00f6ff', '#fff700', '#ff00ea', '#39ff14',
      '#ff3131', '#00aaff', '#ff9100', '#ff2fb3',
    ],
    drawBlock(context, x, y, colorIndex, size, alpha) {
      const palette = SKINS.neon.palette;
      const color = palette[colorIndex];
      if (!color) return;
      context.save();
      context.globalAlpha = alpha ?? 1;
      context.shadowBlur = 12;
      context.shadowColor = color;
      context.fillStyle = color;
      context.fillRect(x * size + 2, y * size + 2, size - 4, size - 4);
      context.restore();
      // context.restore() already reverts shadowBlur/shadowColor to their
      // pre-save values, so no glow bleeds into subsequently drawn
      // primitives (grid lines, ghost piece, etc.) in the same frame.
    },
  },

  pastel: {
    palette: [
      null,
      '#a8e6ea', '#fff2b2', '#dcb8e8', '#c1e8c1',
      '#f2b8b8', '#c2dcf7', '#ffd9ab', '#f7c2d9',
    ],
    drawBlock(context, x, y, colorIndex, size, alpha) {
      const palette = SKINS.pastel.palette;
      const color = palette[colorIndex];
      if (!color) return;
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = color;
      const px = x * size + 1.5;
      const py = y * size + 1.5;
      const s = size - 3;
      const radius = Math.max(2, size * 0.22);
      if (typeof context.roundRect === 'function') {
        context.beginPath();
        context.roundRect(px, py, s, s, radius);
        context.fill();
      } else {
        context.fillRect(px, py, s, s);
      }
      // soft highlight
      context.fillStyle = 'rgba(255,255,255,0.35)';
      if (typeof context.roundRect === 'function') {
        context.beginPath();
        context.roundRect(px, py, s, s * 0.35, radius);
        context.fill();
      } else {
        context.fillRect(px, py, s, s * 0.35);
      }
      context.globalAlpha = 1;
    },
  },

  pixel: {
    get palette() { return SKINS.retro.palette; },
    drawBlock(context, x, y, colorIndex, size, alpha) {
      const palette = SKINS.pixel.palette;
      const color = palette[colorIndex];
      if (!color) return;
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = color;
      const px = x * size + 1;
      const py = y * size + 1;
      const s = size - 2;
      context.fillRect(px, py, s, s);
      // checkerboard dither texture on top
      const cell = Math.max(2, Math.floor(s / 4));
      context.fillStyle = 'rgba(0,0,0,0.14)';
      for (let ry = 0; ry * cell < s; ry++) {
        for (let rx = 0; rx * cell < s; rx++) {
          if ((rx + ry) % 2 === 0) continue;
          const cw = Math.min(cell, s - rx * cell);
          const ch = Math.min(cell, s - ry * cell);
          context.fillRect(px + rx * cell, py + ry * cell, cw, ch);
        }
      }
      // 1px border for a "pixel art" outline
      context.strokeStyle = 'rgba(0,0,0,0.35)';
      context.lineWidth = 1;
      context.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
      context.globalAlpha = 1;
    },
  },
};

const SKIN_KEY = 'tetris-skin';
let activeSkin = 'retro';

function getActiveSkin() {
  return SKINS[activeSkin] || SKINS.retro;
}

function setSkin(name) {
  if (!SKINS[name]) name = 'retro';
  activeSkin = name;
  document.documentElement.setAttribute('data-skin', name);
  localStorage.setItem(SKIN_KEY, name);
  const select = document.getElementById('skin-select');
  if (select && select.value !== name) select.value = name;
  // Redraw immediately if game state is ready (avoid crashing on initial load
  // before game.js has run its init()).
  if (typeof current !== 'undefined' && current) {
    if (typeof draw === 'function') draw();
    if (typeof drawNext === 'function') drawNext();
  }
}

function initSkin() {
  const saved = localStorage.getItem(SKIN_KEY);
  const name = SKINS[saved] ? saved : 'retro';
  activeSkin = name;
  document.documentElement.setAttribute('data-skin', name);
  const select = document.getElementById('skin-select');
  if (select) {
    select.value = name;
    select.addEventListener('change', e => setSkin(e.target.value));
  }
}

// skins.js is loaded (in index.html) after the panel markup exists but
// before game.js runs, so the DOM (including #skin-select) is already
// available here — no need to wait for DOMContentLoaded.
initSkin();
