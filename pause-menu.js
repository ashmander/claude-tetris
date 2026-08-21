'use strict';

const START_LEVEL_KEY = 'tetris-start-level';

function getStartLevel() {
  const saved = parseInt(localStorage.getItem(START_LEVEL_KEY), 10);
  if (Number.isInteger(saved) && saved >= 1 && saved <= 15) return saved;
  return 1;
}

let pmStartLevel = 1;

// clearLines() (in game.js, out of scope for this unit) always computes
// level as floor(lines/10)+1, ignoring a configured start level > 1. That
// would silently regress the level (and speed/score) mid-game. Wrapping
// updateHUD here (called after every level-affecting change) reapplies the
// start-level offset without editing clearLines itself.
function wrapUpdateHUDForStartLevel() {
  if (typeof updateHUD !== 'function' || updateHUD.__pmStartLevelWrapped) return;
  const original = updateHUD;
  const wrapped = function () {
    if (typeof lines === 'number') {
      const computedLevel = pmStartLevel + Math.floor(lines / 10);
      if (computedLevel !== level) {
        level = computedLevel;
        dropInterval = Math.max(100, 1000 - (level - 1) * 90);
      }
    }
    original();
  };
  wrapped.__pmStartLevelWrapped = true;
  updateHUD = wrapped;
}

function setPauseMenuStartLevel(v) {
  pmStartLevel = v;
  wrapUpdateHUDForStartLevel();
}

function isPauseMenuOpen() {
  const el = document.getElementById('pause-menu');
  return !!el && !el.classList.contains('hidden');
}

function openPauseMenu() {
  const el = document.getElementById('pause-menu');
  const controls = document.getElementById('pause-controls');
  const select = document.getElementById('start-level');
  if (select) select.value = String(getStartLevel());
  if (controls) controls.classList.add('hidden');
  if (el) el.classList.remove('hidden');
}

function closePauseMenu() {
  const el = document.getElementById('pause-menu');
  if (el) el.classList.add('hidden');
}

function initPauseMenu() {
  const resumeBtn = document.getElementById('pause-resume-btn');
  const restartBtn = document.getElementById('pause-restart-btn');
  const controlsBtn = document.getElementById('pause-controls-btn');
  const controls = document.getElementById('pause-controls');
  const select = document.getElementById('start-level');

  if (select) {
    select.innerHTML = '';
    for (let i = 1; i <= 15; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = String(i);
      select.appendChild(opt);
    }
    select.value = String(getStartLevel());
    select.addEventListener('change', () => {
      localStorage.setItem(START_LEVEL_KEY, select.value);
    });
  }

  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      if (typeof togglePause === 'function') togglePause();
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      closePauseMenu();
      if (typeof init === 'function') init();
    });
  }

  if (controlsBtn && controls) {
    controlsBtn.addEventListener('click', () => {
      controls.classList.toggle('hidden');
    });
  }
}

document.addEventListener('DOMContentLoaded', initPauseMenu);
