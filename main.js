import { GameRunner } from './game.js';
import { CHAPTERS, UPGRADES, STAT_COLORS } from './data.js';

// ─── SAVE / STATE ─────────────────────────────────────────
const SAVE_KEY = 'rbr_save_v2';

function defaultSave() {
  return {
    chapterIdx: 0,
    stars: 0,
    totalYards: 0,
    stats: {
      sprintRegen: 0,
      lateralSpeed: 0,
      breakTackle: 0,
      defenderSlow: 0,
      maxHealth: 0,
      hitboxShrink: 0,
      stiffArm: 0,
      freeLane: 0,
    },
    upgrades: {},
    completedChapters: {},
    chapterStars: {},
  };
}

let save = defaultSave();

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) save = { ...defaultSave(), ...JSON.parse(raw) };
  } catch (_) { save = defaultSave(); }
}

function writeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (_) {}
}

function resetSave() {
  save = defaultSave();
  writeSave();
}

// ─── SCREEN MANAGEMENT ──────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

// ─── CURRENT GAME ─────────────────────────────────────────
let currentRunner = null;
let pendingChapterIdx = null;
let lastRunResult = null;

// ─── MAIN MENU ────────────────────────────────────────────
function initMenu() {
  loadSave();
  const hasSave = save.chapterIdx > 0 || save.stars > 0;
  const cont = document.getElementById('btn-continue');
  if (hasSave) cont.classList.remove('hidden');
  else cont.classList.add('hidden');

  document.getElementById('btn-start').onclick = () => {
    resetSave();
    showCareer();
  };
  document.getElementById('btn-continue').onclick = showCareer;
}

// ─── CAREER MAP ──────────────────────────────────────────
function showCareer() {
  renderCareerStats();
  renderChapters();
  showScreen('screen-career');
}

function renderCareerStats() {
  const bar = document.getElementById('career-stats-bar');
  if (bar) {
    bar.innerHTML = `⭐ ${save.stars} Stars &nbsp;|&nbsp; 🏈 ${save.totalYards} Total Yds`;
  }

  const rpgBar = document.getElementById('career-rpg-bar');
  if (rpgBar) {
    const statNames = {
      sprintRegen: '⚡Sprint', lateralSpeed: '🌀Agility', breakTackle: '💪Break',
      defenderSlow: '👁️Vision', maxHealth: '❤️Health', hitboxShrink: '👻Elude',
      stiffArm: '🦾Stiff', freeLane: '🔪Cut'
    };
    rpgBar.innerHTML = Object.entries(statNames).map(([k, label]) => {
      const val = save.stats[k] || 0;
      const pct = Math.min(100, (val / 1.5) * 100);
      return `<div style="flex:1;min-width:60px;text-align:center">
        <div style="font-size:10px;color:#9ca3af">${label}</div>
        <div class="stat-bar-outer" style="margin:3px 0">
          <div class="stat-bar-inner" style="width:${pct}%;background:${STAT_COLORS[k] || '#f59e0b'}"></div>
        </div>
        <div style="font-size:10px;color:#fff">${val.toFixed(1)}</div>
      </div>`;
    }).join('');
  }
}

function renderChapters() {
  const container = document.getElementById('career-chapters');
  if (!container) return;
  container.innerHTML = '';

  let currentEra = '';
  CHAPTERS.forEach((ch, idx) => {
    if (ch.era !== currentEra) {
      currentEra = ch.era;
      const header = document.createElement('div');
      header.className = 'text-xs font-bold text-gray-500 uppercase tracking-widest mt-3 mb-1 px-2';
      const eraColors = { 'HIGH SCHOOL': '#ef4444', 'COLLEGE': '#3b82f6', 'BOWL PREP': '#f59e0b', 'BOWL GAME': '#f59e0b' };
      header.style.color = eraColors[ch.era] || '#9ca3af';
      header.textContent = `— ${ch.era} —`;
      container.appendChild(header);
    }

    const isCompleted = save.completedChapters[ch.id];
    const isCurrent = idx === save.chapterIdx;
    const isLocked = idx > save.chapterIdx;
    const chStars = save.chapterStars[ch.id] || 0;

    const node = document.createElement('div');
    node.className = `chapter-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : 'unlocked'}`;

    const starStr = chStars > 0 ? '⭐'.repeat(chStars) + '☆'.repeat(3 - chStars) : '☆☆☆';
    const typeBadge = ch.type === 'practice' ? '📋' : ch.type === 'bowl' ? '🏆' : '🏈';

    node.innerHTML = `
      <div class="chapter-icon">${ch.icon}</div>
      <div class="chapter-info">
        <div class="chapter-name" style="color:${isLocked ? '#9ca3af' : ch.color}">${ch.name}</div>
        <div class="chapter-desc">${ch.description}</div>
        <div style="font-size:11px;margin-top:2px;color:#f59e0b">${isCompleted ? starStr : (isCurrent ? '▶ PLAY NOW' : '🔒 LOCKED')}</div>
      </div>
      <div class="chapter-badge">${typeBadge} ${isCompleted ? '✅' : ''}</div>
    `;

    if (!isLocked) {
      node.onclick = () => startChapter(idx);
    }
    container.appendChild(node);
  });
}

// ─── CUTSCENE ────────────────────────────────────────────
function showCutscene(ch, onDone) {
  document.getElementById('cutscene-icon').textContent = ch.cutscene.icon;
  document.getElementById('cutscene-title').textContent = ch.cutscene.title;
  document.getElementById('cutscene-body').textContent = ch.cutscene.body;
  document.getElementById('btn-cutscene-next').onclick = onDone;
  showScreen('screen-cutscene');
}

// ─── START CHAPTER ────────────────────────────────────────
function startChapter(idx) {
  const ch = CHAPTERS[idx];
  pendingChapterIdx = idx;

  // Show cutscene for new/uncompleted chapters or major milestones
  const isNew = !save.completedChapters[ch.id];
  if (isNew || ch.isBowl) {
    showCutscene(ch, () => beginRun(idx));
  } else {
    beginRun(idx);
  }
}

function beginRun(idx) {
  const ch = CHAPTERS[idx];
  showScreen('screen-game');

  if (currentRunner) {
    currentRunner.destroy();
    currentRunner = null;
  }

  const canvas = document.getElementById('game-canvas');

  currentRunner = new GameRunner(canvas, ch, save.stats, (result) => {
    lastRunResult = result;
    showResults(idx, result);
  });

  setTimeout(() => {
    if (currentRunner) currentRunner.start();
  }, 100);
}

// ─── RESULTS ────────────────────────────────────────────
function showResults(idx, result) {
  if (currentRunner) { currentRunner.destroy(); currentRunner = null; }

  const ch = CHAPTERS[idx];
  const passed = result.victory && !result.tackled;
  const starsEarned = result.starsEarned;
  const prevStars = save.chapterStars[ch.id] || 0;
  const newStarCount = Math.max(prevStars, starsEarned);

  // Grade
  let grade = 'D';
  if (starsEarned >= 3) grade = 'S';
  else if (starsEarned >= 2) grade = 'A';
  else if (starsEarned >= 1) grade = 'B';
  else if (passed) grade = 'C';

  const gradeColors = { S: '#f59e0b', A: '#22c55e', B: '#3b82f6', C: '#9ca3af', D: '#ef4444' };

  document.getElementById('results-icon').textContent = passed ? (ch.isBowl ? '🏆' : '🎉') : '😤';
  document.getElementById('results-title').textContent = passed ? (ch.passText || 'NICE RUN!') : (ch.failText || 'KEEP TRAINING!');
  document.getElementById('results-title').style.color = passed ? '#22c55e' : '#ef4444';

  const gradeEl = document.getElementById('results-grade');
  gradeEl.textContent = grade;
  gradeEl.style.color = gradeColors[grade] || '#fff';

  const statsEl = document.getElementById('results-stats');
  statsEl.innerHTML = `
    <div class="flex justify-between"><span>Yards Gained:</span><span class="text-green-400 font-bold">${result.yards} yds</span></div>
    <div class="flex justify-between"><span>Target:</span><span class="text-gray-400">${ch.targetYards} yds</span></div>
    <div class="flex justify-between"><span>Stars Collected:</span><span class="text-yellow-400 font-bold">⭐ ${result.score || 0}</span></div>
    <div class="flex justify-between"><span>Health Remaining:</span><span class="text-red-400">${'❤️'.repeat(Math.max(0, result.health))}${'🖤'.repeat(Math.max(0, 3 - result.health))}</span></div>
    <div class="flex justify-between"><span>Time:</span><span class="text-blue-400">${result.timeTaken?.toFixed(1) || '?'}s</span></div>
  `;

  const starsEl = document.getElementById('results-stars-earned');
  starsEl.innerHTML = starsEarned > 0 ? `${'⭐'.repeat(starsEarned)}${'☆'.repeat(3 - starsEarned)} Performance` : 'No stars this run';

  const retryBtn = document.getElementById('btn-results-retry');
  retryBtn.classList.toggle('hidden', passed);
  retryBtn.onclick = () => beginRun(idx);

  const contBtn = document.getElementById('btn-results-continue');
  contBtn.onclick = () => {
    if (passed) {
      // Award stars
      const starDelta = newStarCount - prevStars + (result.score || 0);
      save.stars += Math.max(0, starDelta);
      save.totalYards += result.yards;
      save.completedChapters[ch.id] = true;
      save.chapterStars[ch.id] = newStarCount;

      // Advance chapter
      if (save.chapterIdx === idx) save.chapterIdx = Math.min(idx + 1, CHAPTERS.length - 1);
      writeSave();

      if (ch.isBowl) {
        showBowlWin();
      } else {
        showUpgradeScreen(idx);
      }
    } else {
      // Even failed runs earn some stars
      save.stars += result.score || 0;
      save.totalYards += result.yards;
      writeSave();
      showCareer();
    }
  };

  showScreen('screen-results');
}

// ─── UPGRADE SCREEN ──────────────────────────────────────
function showUpgradeScreen(completedIdx) {
  const nextCh = CHAPTERS[completedIdx + 1];
  const ctx = nextCh ? `Next: ${nextCh.name}` : 'Career Complete!';
  document.getElementById('upgrade-context').textContent = ctx;

  renderUpgradeStatBars();
  renderUpgradeChoices();
  updateUpgradeStars();

  document.getElementById('btn-upgrade-skip').onclick = showCareer;
  showScreen('screen-upgrade');
}

function renderUpgradeStatBars() {
  const el = document.getElementById('upgrade-stat-bars');
  if (!el) return;
  const statLabels = {
    sprintRegen: '⚡ Sprint Regen', lateralSpeed: '🌀 Agility',
    breakTackle: '💪 Break Tackles', defenderSlow: '👁️ Field Vision',
    maxHealth: '❤️ Health', hitboxShrink: '👻 Elusiveness',
    stiffArm: '🦾 Stiff Arm', freeLane: '🔪 Cutback'
  };
  el.innerHTML = Object.entries(statLabels).map(([k, label]) => {
    const val = save.stats[k] || 0;
    const pct = Math.min(100, (val / 2.0) * 100);
    return `<div class="flex items-center gap-2">
      <span style="width:120px;font-size:11px;color:#d1d5db">${label}</span>
      <div class="stat-bar-outer flex-1"><div class="stat-bar-inner" style="width:${pct}%;background:${STAT_COLORS[k] || '#f59e0b'}"></div></div>
      <span style="width:28px;text-align:right;font-size:11px;color:#fff">${val.toFixed(1)}</span>
    </div>`;
  }).join('');
}

function renderUpgradeChoices() {
  const el = document.getElementById('upgrade-choices');
  if (!el) return;

  // Pick 3 random upgrades to offer
  const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3);

  el.innerHTML = '';
  shuffled.forEach(upg => {
    const canAfford = save.stars >= upg.cost;
    const card = document.createElement('div');
    card.className = `upgrade-card ${canAfford ? '' : 'cant-afford'}`;
    card.innerHTML = `
      <div class="flex items-center gap-3">
        <div style="font-size:32px">${upg.icon}</div>
        <div class="flex-1">
          <div class="font-black text-base" style="color:${upg.color}">${upg.name}</div>
          <div class="text-xs text-gray-300">${upg.desc}</div>
        </div>
        <div class="text-right">
          <div class="font-bold text-yellow-400">⭐${upg.cost}</div>
          <div class="text-xs text-gray-400">${canAfford ? 'BUY' : 'Need more stars'}</div>
        </div>
      </div>
    `;
    if (canAfford) {
      card.onclick = () => {
        save.stars -= upg.cost;
        save.stats[upg.stat] = (save.stats[upg.stat] || 0) + upg.delta;
        writeSave();
        renderUpgradeStatBars();
        renderUpgradeChoices();
        updateUpgradeStars();
        card.classList.add('selected');
        setTimeout(showCareer, 800);
      };
    }
    el.appendChild(card);
  });
}

function updateUpgradeStars() {
  const el = document.getElementById('upgrade-stars-left');
  if (el) el.textContent = `⭐ Stars: ${save.stars}`;
}

// ─── BOWL WIN ────────────────────────────────────────────
function showBowlWin() {
  document.getElementById('bowl-final-stats').textContent =
    `Total yards: ${save.totalYards} | Career stars: ${save.stars}`;
  const starCount = Math.min(5, Math.ceil(save.stars / 20));
  document.getElementById('bowl-stars').textContent = '⭐'.repeat(Math.max(1, starCount));
  document.getElementById('btn-bowl-restart').onclick = () => {
    resetSave();
    showScreen('screen-menu');
    initMenu();
  };
  showScreen('screen-bowl-win');
}

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSave();
  initMenu();
  showScreen('screen-menu');
});
