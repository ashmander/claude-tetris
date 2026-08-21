'use strict';

// Local scoreboard: top-5 records + lifetime bests, persisted in localStorage.
// Loaded before game.js, so this file only *defines* things at load time.

const RECORDS_KEY = 'tetris-records';
const BEST_COMBO_KEY = 'tetris-best-combo';
const BEST_LINES_KEY = 'tetris-best-lines';
const MAX_RECORDS = 5;
const MAX_NAME_LEN = 12;

function getRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

function getBestCombo() {
  return Number(localStorage.getItem(BEST_COMBO_KEY)) || 0;
}

function getBestLines() {
  return Number(localStorage.getItem(BEST_LINES_KEY)) || 0;
}

function updateLifetimeBests(runMaxCombo, runLines) {
  const bestCombo = Math.max(getBestCombo(), runMaxCombo || 0);
  const bestLines = Math.max(getBestLines(), runLines || 0);
  localStorage.setItem(BEST_COMBO_KEY, String(bestCombo));
  localStorage.setItem(BEST_LINES_KEY, String(bestLines));
}

function sanitizeName(name) {
  const trimmed = (name || '').trim().slice(0, MAX_NAME_LEN);
  return trimmed || 'ANON';
}

function qualifiesForTop(score) {
  const records = getRecords();
  if (records.length < MAX_RECORDS) return true;
  return records.some(r => score > r.score);
}

function addRecord(name, score, lines, maxCombo) {
  const records = getRecords();
  const entry = {
    name: sanitizeName(name),
    score: score || 0,
    lines: lines || 0,
    maxCombo: maxCombo || 0,
    date: new Date().toISOString(),
  };
  records.push(entry);
  records.sort((a, b) => b.score - a.score);
  const trimmed = records.slice(0, MAX_RECORDS);
  saveRecords(trimmed);
  return { records: trimmed, index: trimmed.indexOf(entry) };
}

function resetRecords() {
  localStorage.removeItem(RECORDS_KEY);
  localStorage.removeItem(BEST_COMBO_KEY);
  localStorage.removeItem(BEST_LINES_KEY);
}

function renderRecordsTable(container, records, highlightIndex) {
  container.textContent = '';
  if (!records.length) {
    const empty = document.createElement('p');
    empty.className = 'records-empty';
    empty.textContent = 'Sin récords todavía.';
    container.appendChild(empty);
    return;
  }
  const table = document.createElement('table');
  table.className = 'records-table';
  const tbody = document.createElement('tbody');
  records.forEach((r, i) => {
    const tr = document.createElement('tr');
    if (i === highlightIndex) tr.classList.add('records-highlight');

    const posTd = document.createElement('td');
    posTd.textContent = String(i + 1);
    tr.appendChild(posTd);

    const nameTd = document.createElement('td');
    nameTd.textContent = r.name;
    tr.appendChild(nameTd);

    const scoreTd = document.createElement('td');
    scoreTd.textContent = r.score.toLocaleString();
    tr.appendChild(scoreTd);

    const linesTd = document.createElement('td');
    linesTd.textContent = `${r.lines} L`;
    tr.appendChild(linesTd);

    const comboTd = document.createElement('td');
    comboTd.textContent = `x${r.maxCombo}`;
    tr.appendChild(comboTd);

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

function renderLifetimeBests(container) {
  container.textContent = '';
  const comboSpan = document.createElement('span');
  comboSpan.textContent = `Mejor combo: x${getBestCombo()}`;
  const linesSpan = document.createElement('span');
  linesSpan.textContent = `Máx. líneas: ${getBestLines()}`;
  container.appendChild(comboSpan);
  container.appendChild(linesSpan);
}

function refreshRecordsUI() {
  const startTable = document.getElementById('start-records-table');
  const startBests = document.getElementById('start-best-stats');
  if (startTable) renderRecordsTable(startTable, getRecords(), -1);
  if (startBests) renderLifetimeBests(startBests);

  const goTable = document.getElementById('gameover-records-table');
  const goBests = document.getElementById('gameover-best-stats');
  if (goTable) renderRecordsTable(goTable, getRecords(), -1);
  if (goBests) renderLifetimeBests(goBests);
}

// Holds the score/lines/combo of the run currently offered for saving, so the
// single persistent save-button handler always reflects the latest game over.
let pendingRun = null;

function showGameOverRecords(runScore, runLines, runMaxCombo) {
  updateLifetimeBests(runMaxCombo, runLines);

  const goTable = document.getElementById('gameover-records-table');
  const goBests = document.getElementById('gameover-best-stats');
  const saveForm = document.getElementById('save-record-form');
  const nameInput = document.getElementById('record-name-input');

  if (goBests) renderLifetimeBests(goBests);

  if (qualifiesForTop(runScore)) {
    pendingRun = { score: runScore || 0, lines: runLines || 0, maxCombo: runMaxCombo || 0 };
    if (saveForm) saveForm.classList.remove('hidden');
    if (nameInput) nameInput.value = '';
    if (goTable) renderRecordsTable(goTable, getRecords(), -1);
  } else {
    pendingRun = null;
    if (saveForm) saveForm.classList.add('hidden');
    if (goTable) renderRecordsTable(goTable, getRecords(), -1);
  }
}

function handleSaveRecordClick() {
  if (!pendingRun) return;
  const nameInput = document.getElementById('record-name-input');
  const goTable = document.getElementById('gameover-records-table');
  const saveForm = document.getElementById('save-record-form');
  const name = nameInput ? nameInput.value : '';
  const { records: updated, index: idx } = addRecord(name, pendingRun.score, pendingRun.lines, pendingRun.maxCombo);
  if (goTable) renderRecordsTable(goTable, updated, idx);
  if (saveForm) saveForm.classList.add('hidden');
  pendingRun = null;
  refreshRecordsUI();
}

document.addEventListener('DOMContentLoaded', () => {
  refreshRecordsUI();

  const startScreen = document.getElementById('start-screen');
  const playBtn = document.getElementById('play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (startScreen) startScreen.classList.add('hidden');
      init();
    });
  }

  const saveBtn = document.getElementById('save-record-btn');
  if (saveBtn) saveBtn.addEventListener('click', handleSaveRecordClick);

  const resetButtons = document.querySelectorAll('.reset-records-btn');
  resetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('¿Seguro que quieres borrar todos los récords?')) {
        resetRecords();
        refreshRecordsUI();
      }
    });
  });
});
