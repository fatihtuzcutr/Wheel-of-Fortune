import { CATEGORIES } from './categories.js';
import { sounds, getAudioContext, isSoundEnabled, toggleSound } from './audio.js';
import { drawWheel, spinWheel, WHEEL_SLICES } from './wheel.js';

const $ = id => document.getElementById(id);
const delay = ms => new Promise(res => setTimeout(res, ms));
const randInt = max => Math.floor(Math.random() * max);
const formatNumber = n => n.toLocaleString('tr-TR');

export const CONSONANTS = 'BCÇDFGĞHJKLMNPRSŞTVYZ'.split('');
export const VOWELS = 'AEIİOÖUÜ'.split('');
export const KEYBOARD_ROWS = [
  'ABCÇDEFGĞH',
  'IİJKLMNOÖP',
  'RSŞTUÜVYZ'
];

export const CONSONANT_FREQ = 'KLRNMTSYDBŞZÇGHCPVĞFJ'.split('');
export const VOWEL_FREQ = 'AEİIUOÜÖ'.split('');

export const VOWEL_PRICE = 200;
export const MAX_ROUNDS = 3;
export const FINAL_REWARD = 10000;
export const FINAL_TIME = 15;

export const TURKISH_BOT_NAMES = [
  { ad: 'AHMET', ek: ["'e", "'den"] },
  { ad: 'FATMA', ek: ["'ya", "'dan"] },
  { ad: 'MEHMET', ek: ["'e", "'den"] },
  { ad: 'AYŞE', ek: ["'ye", "'den"] },
  { ad: 'CAN', ek: ["'a", "'dan"] },
  { ad: 'ZEYNEP', ek: ["'e", "'ten"] },
  { ad: 'BURAK', ek: ["'a", "'tan"] },
  { ad: 'ELİF', ek: ["'e", "'ten"] },
  { ad: 'EMRE', ek: ["'ye", "'den"] },
  { ad: 'SELİN', ek: ["'e", "'den"] },
  { ad: 'MURAT', ek: ["'a", "'tan"] },
  { ad: 'GAMZE', ek: ["'ye", "'den"] },
  { ad: 'KEREM', ek: ["'e", "'den"] },
  { ad: 'DENİZ', ek: ["'e", "'den"] },
  { ad: 'BÜŞRA', ek: ["'ya", "'dan"] },
  { ad: 'MERT', ek: ["'e", "'ten"] },
  { ad: 'SİNEM', ek: ["'e", "'den"] },
  { ad: 'ONUR', ek: ["'a", "'dan"] },
  { ad: 'ECE', ek: ["'ye", "'den"] },
  { ad: 'BARIŞ', ek: ["'a", "'tan"] },
  { ad: 'GÖKÇE', ek: ["'ye", "'den"] },
  { ad: 'ARDA', ek: ["'ya", "'dan"] }
];

export function getRandomBotPlayer() {
  const chosen = TURKISH_BOT_NAMES[randInt(TURKISH_BOT_NAMES.length)];
  return { ad: chosen.ad, ek: chosen.ek, bot: true, tur: 0, top: 0 };
}

export const isLetter = ch => CONSONANTS.includes(ch) || VOWELS.includes(ch);

const ROW_CAPACITIES = [12, 14, 14, 12];
const ROW_INDENTS = [1, 0, 0, 1];
const ROW_CONFIGS = [
  [1],
  [1, 2],
  [0, 1, 2],
  [1, 2, 3],
  [0, 1, 2, 3]
];

function fitWordsIntoLines(words, lineCapacities) {
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const maxLen = lineCapacities[lines.length];
    if (maxLen === undefined) return null;

    const candidate = currentLine ? currentLine + ' ' + word : word;
    if (candidate.length <= maxLen) {
      currentLine = candidate;
      continue;
    }

    if (!currentLine) return null;
    lines.push(currentLine);
    currentLine = word;

    const nextMax = lineCapacities[lines.length];
    if (nextMax === undefined || word.length > nextMax) return null;
  }

  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export function layoutPhrase(phrase) {
  const words = phrase.split(' ');

  for (const config of ROW_CONFIGS) {
    const lineCapacities = config.map(rowIndex => ROW_CAPACITIES[rowIndex]);
    const lines = fitWordsIntoLines(words, lineCapacities);

    if (!lines || lines.length !== config.length) continue;

    const cells = [];
    lines.forEach((lineText, lineIdx) => {
      const rowIndex = config[lineIdx];
      const rowCap = ROW_CAPACITIES[rowIndex];
      const startCol = ROW_INDENTS[rowIndex] + Math.floor((rowCap - lineText.length) / 2);

      [...lineText].forEach((ch, charIdx) => {
        if (ch !== ' ') {
          cells.push({
            r: rowIndex,
            c: startCol + charIdx,
            ch: ch,
            acik: !isLetter(ch)
          });
        }
      });
    });

    return cells;
  }

  return null;
}

// Prepare candidate pools from categories
const ALL_PUZZLES = [];
for (const cat in CATEGORIES) {
  for (const text of CATEGORIES[cat]) {
    const cells = layoutPhrase(text);
    if (!cells) continue;
    const letterCount = cells.filter(cell => isLetter(cell.ch)).length;
    ALL_PUZZLES.push({ kat: cat, metin: text, n: letterCount });
  }
}

const REGULAR_PUZZLES = ALL_PUZZLES.filter(p => p.n >= 10);
const FINAL_PUZZLES = ALL_PUZZLES.filter(p => p.n >= 5 && p.n <= 13 && p.kat !== 'ATASÖZÜ');

function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

let regularPool = [];
let finalPool = [];

function getNextPuzzle(isFinal) {
  if (isFinal) {
    if (!finalPool.length) finalPool = shuffle(FINAL_PUZZLES);
    return finalPool.pop();
  }
  if (!regularPool.length) regularPool = shuffle(REGULAR_PUZZLES);
  return regularPool.pop();
}

export const DIFFICULTIES = {
  kolay: { esik: 0.78, isabet: 0.3 },
  normal: { esik: 0.64, isabet: 0.45 },
  zor: { esik: 0.5, isabet: 0.62 }
};

export class Game {
  constructor() {
    this.state = {
      zorluk: 'normal',
      tur: 0,
      oy: [],
      sira: 0,
      bul: null,
      hucre: [],
      kullan: new Set(),
      faz: 'menu',
      kilit: true,
      cark: 0,
      deger: 0,
      tah: [],
      tahImlec: 0,
      fSes: [],
      fSli: [],
      zaman: null,
      geri: null
    };

    this.highScore = 0;
    try {
      this.highScore = +localStorage.getItem('carkifelek-rekor') || 0;
    } catch (e) {}

    this.boardElements = [];
    this.initDOM();
  }

  initDOM() {
    this.sahneEl = $('sahne');
    this.boardEl = $('tahta');
    this.canvasEl = $('cark');
    this.msgEl = $('mesaj');
    this.playersEl = $('oyuncular');
    this.buttonsEl = $('dugmeler');
    this.keyboardEl = $('klavye');
    this.modalEl = $('katman');
    this.roundTextEl = $('turYazi');
    this.recordTextEl = $('rekorYazi');
    this.helpBtn = $('bYardim');
    this.soundBtn = $('bSes');

    // Create 56 grid cells
    this.boardEl.innerHTML = '';
    this.boardElements = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 14; c++) {
        const div = document.createElement('div');
        div.className = 'k';
        this.boardEl.appendChild(div);
        this.boardElements.push(div);
      }
    }

    // Build virtual keyboard if empty
    if (!this.keyboardEl.children.length) {
      this.keyboardEl.innerHTML = KEYBOARD_ROWS.map(row => {
        const buttons = [...row].map(letter => {
          const isVowel = VOWELS.includes(letter);
          return `<button class="tus${isVowel ? ' sl' : ''}" data-h="${letter}">${letter}</button>`;
        }).join('');
        return `<div class="sira">${buttons}</div>`;
      }).join('');
    }

    this.bindEvents();
    this.resetBoardCells();
    drawWheel(this.canvasEl, this.state.cark);
    this.showMainMenu();
  }

  bindEvents() {
    // Window resize
    window.addEventListener('resize', () => this.resizeScene());
    this.resizeScene();

    // Canvas click spins wheel
    this.canvasEl.addEventListener('click', () => {
      this.handleButtonClick('cevir');
    });

    // Action buttons click
    this.buttonsEl.addEventListener('click', e => {
      const btn = e.target.closest('.dug');
      if (btn && !btn.disabled) {
        this.handleButtonClick(btn.dataset.id);
      }
    });

    // Virtual keyboard click
    this.keyboardEl.addEventListener('click', e => {
      const btn = e.target.closest('.tus');
      if (btn && !btn.disabled) {
        getAudioContext();
        this.handleLetterInput(btn.dataset.h);
      }
    });

    // Modal buttons click
    this.modalEl.addEventListener('click', e => {
      // Difficulty selection button
      const zBtn = e.target.closest('#zSec button');
      if (zBtn) {
        this.state.zorluk = zBtn.dataset.z;
        this.modalEl.querySelectorAll('#zSec button').forEach(b => {
          b.classList.toggle('sec', b === zBtn);
        });
        sounds.sec();
        return;
      }

      // Modal action button
      const actBtn = e.target.closest('.kart .dug');
      if (!actBtn) return;
      getAudioContext();

      const actionId = actBtn.dataset.id;
      if (actionId === 'basla') {
        this.closeModal();
        this.startGame();
      } else if (actionId === 'sonraki') {
        this.closeModal();
        this.startRound();
      } else if (actionId === 'sonuc') {
        this.closeModal();
        this.checkFinalQualification();
      } else if (actionId === 'final') {
        this.closeModal();
        this.startFinalRound();
      } else if (actionId === 'menu') {
        this.showMainMenu();
      } else if (actionId === 'yardimKapa') {
        this.closeModal();
        if (this.state.geri) {
          this.state.geri();
        }
        this.state.geri = null;
      }
    });

    // Help button
    this.helpBtn.addEventListener('click', () => {
      if (this.state.geri) return;
      const wasOpen = this.modalEl.classList.contains('acik');
      const prevContent = this.modalEl.innerHTML;
      this.state.geri = () => {
        if (wasOpen) {
          this.modalEl.innerHTML = prevContent;
          this.modalEl.classList.add('acik');
        }
      };
      this.showModal(`<h2>Nasıl Oynanır?</h2><ul class="yardim">
    <li><b>ÇEVİR</b> ile çarkı döndür, çıkan puan için bir <b>sessiz harf</b> seç. Harf bulmacada kaç kez geçiyorsa o kadar puan kazanırsın ve sıra sende kalır.</li>
    <li>Sesli harfler (A, E, I, İ, O, Ö, U, Ü) <b>${VOWEL_PRICE} puana</b> satın alınır.</li>
    <li>Bulmacayı bildiğinde <b>TAHMİN ET</b>'e bas, boş kutuları doldurup <b>ONAYLA</b>.</li>
    <li><b>İFLAS</b> gelirse o turdaki puanın sıfırlanır, <b>PAS</b> gelirse sıra geçer. Harf yoksa ya da tahmin yanlışsa sıra rakibe geçer.</li>
    <li>Turu bilen, o turdaki puanını kasasına koyar (en az 1.000). Diğerlerinin tur puanı silinir.</li>
    <li>${MAX_ROUNDS} tur sonunda kasası en dolu olan kazanır. Kazanırsan <b>Final Turu</b>na geçersin: ${FINAL_TIME} saniyede bilirsen +${formatNumber(FINAL_REWARD)} puan!</li>
    <li>Klavye: harf tuşları, <b>Boşluk</b> çevir, <b>Enter</b> onayla, <b>Backspace</b> sil, <b>Esc</b> vazgeç.</li>
  </ul><button class="dug turuncu" data-id="yardimKapa">TAMAM</button>`);
    });

    // Sound toggle button
    this.soundBtn.textContent = isSoundEnabled() ? '🔊' : '🔇';
    this.soundBtn.addEventListener('click', () => {
      const enabled = toggleSound();
      this.soundBtn.textContent = enabled ? '🔊' : '🔇';
    });

    // Keyboard event listener
    window.addEventListener('keydown', e => {
      if (this.modalEl.classList.contains('acik')) {
        if (e.key === 'Enter') {
          const orangeBtn = this.modalEl.querySelector('.dug.turuncu');
          if (orangeBtn) {
            e.preventDefault();
            orangeBtn.click();
          }
        } else if (e.key === 'Escape' && this.state.geri) {
          const closeBtn = this.modalEl.querySelector('[data-id=yardimKapa]');
          if (closeBtn) closeBtn.click();
        }
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const key = e.key;
      if (key === ' ') {
        e.preventDefault();
        if (this.state.faz === 'karar') {
          this.handleButtonClick('cevir');
        }
        return;
      }

      if (key === 'Enter') {
        e.preventDefault();
        if (this.state.faz === 'tahmin' || this.state.faz === 'final-tahmin') {
          this.handleButtonClick('onay');
        }
        return;
      }

      if (key === 'Backspace') {
        e.preventDefault();
        this.handleButtonClick('sil');
        return;
      }

      if (key === 'Escape') {
        this.handleButtonClick('vaz');
        return;
      }

      if (key.length === 1) {
        const upper = key.toLocaleUpperCase('tr-TR');
        if (isLetter(upper)) {
          e.preventDefault();
          getAudioContext();
          this.handleLetterInput(upper);
        }
      }
    });

    window.addEventListener('pointerdown', () => {
      try { window.focus(); } catch (e) {}
    });
  }

  resizeScene() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isPort = h > w * 1.15;

    this.sahneEl.className = isPort ? 'port' : 'land';
    const designW = isPort ? 450 : 800;
    const designH = isPort ? 800 : 600;

    const scale = Math.min(w / designW, h / designH);
    const tx = (w - designW * scale) / 2;
    const ty = (h - designH * scale) / 2;

    this.sahneEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  getCellElement(cell) {
    return this.boardElements[cell.r * 14 + cell.c];
  }

  resetBoardCells() {
    this.boardElements.forEach((el, idx) => {
      const r = Math.floor(idx / 14);
      const c = idx % 14;
      const isCorner = ROW_INDENTS[r] && (c === 0 || c === 13);
      el.className = 'k ' + (isCorner ? 'yok' : 'bos');
      el.textContent = '';
    });
  }

  renderBoardPuzzle() {
    this.resetBoardCells();
    for (const cell of this.state.hucre) {
      const el = this.getCellElement(cell);
      el.className = 'k kutu';
      el.textContent = cell.acik ? cell.ch : '';
    }
  }

  revealedFraction() {
    const letters = this.state.hucre.filter(cell => isLetter(cell.ch));
    if (!letters.length) return 1;
    return letters.filter(cell => cell.acik).length / letters.length;
  }

  unopenedLetters() {
    return this.state.hucre.filter(cell => !cell.acik);
  }

  hasRemainingConsonants() {
    return this.state.hucre.some(cell => !cell.acik && CONSONANTS.includes(cell.ch));
  }

  hasRemainingVowels() {
    return this.state.hucre.some(cell => !cell.acik && VOWELS.includes(cell.ch));
  }

  async revealLetter(letter, fast = false) {
    const matching = this.state.hucre.filter(cell => !cell.acik && cell.ch === letter);
    for (const cell of matching) {
      cell.acik = true;
      const el = this.getCellElement(cell);
      el.className = 'k ac';
      sounds.ding();
      await delay(fast ? 180 : 420);
    }
    if (matching.length) {
      await delay(fast ? 150 : 300);
    }
    for (const cell of matching) {
      const el = this.getCellElement(cell);
      el.className = 'k kutu';
      el.textContent = cell.ch;
    }
    return matching.length;
  }

  revealAllBoardLetters() {
    for (const cell of this.state.hucre) {
      const el = this.getCellElement(cell);
      if (!cell.acik) {
        cell.acik = true;
        el.className = 'k yazi';
        el.textContent = cell.ch;
      } else {
        el.className = 'k kutu';
        el.textContent = cell.ch;
      }
    }
  }

  setMessage(html) {
    this.msgEl.innerHTML = html ? `<div style="width:100%">${html}</div>` : '<div style="width:100%"></div>';
  }

  updatePlayersUI() {
    const activeIdx = this.state.faz === 'menu' ? -1 : (this.state.faz.startsWith('final') ? 0 : this.state.sira);
    this.playersEl.innerHTML = this.state.oy.map((player, idx) => {
      const stateClass = activeIdx < 0 ? '' : (idx === activeIdx ? ' aktif' : ' sonuk');
      return `<div class="oy o${idx}${stateClass}">
        <div class="ad"><span>${player.ad}</span></div>
        <div class="tp">${formatNumber(player.tur)}</div>
        <div class="kasa">Kasa: ${formatNumber(player.top)}</div>
      </div>`;
    }).join('');
  }

  updateKeyboardUI() {
    const activePlayer = this.state.oy[this.state.sira];
    const isHumanTurn = activePlayer && !activePlayer.bot;

    this.keyboardEl.querySelectorAll('.tus').forEach(btn => {
      const letter = btn.dataset.h;
      const used = this.state.kullan.has(letter);
      const isVowel = VOWELS.includes(letter);
      let enabled = false;

      if (!this.state.kilit) {
        if (this.state.faz === 'sessiz' && isHumanTurn) {
          enabled = !isVowel && !used;
        } else if (this.state.faz === 'sesli' && isHumanTurn) {
          enabled = isVowel && !used;
        } else if (this.state.faz === 'tahmin' || this.state.faz === 'final-tahmin') {
          enabled = true;
        } else if (this.state.faz === 'final-sec') {
          enabled = !used && (isVowel ? this.state.fSli.length < 1 : this.state.fSes.length < 3);
        }
      }

      const isGuessing = this.state.faz === 'tahmin' || this.state.faz === 'final-tahmin';
      btn.classList.toggle('kul', used && !isGuessing);
      btn.disabled = !enabled;
    });
  }

  updateButtonsUI() {
    const activePlayer = this.state.oy[this.state.sira];
    const btn = (id, label, color, disabled) =>
      `<button class="dug ${color}" data-id="${id}"${disabled ? ' disabled' : ''}>${label}</button>`;

    if (this.state.faz === 'tahmin' || this.state.faz === 'final-tahmin') {
      let html = btn('onay', 'ONAYLA', 'yesil', this.state.kilit) +
                 btn('sil', 'SİL', 'gri', this.state.kilit);
      if (this.state.faz === 'tahmin') {
        html += btn('vaz', 'VAZGEÇ', 'kirmizi', this.state.kilit);
      }
      this.buttonsEl.innerHTML = html;
    } else if (this.state.faz === 'sesli') {
      this.buttonsEl.innerHTML = btn('vaz', 'VAZGEÇ', 'kirmizi', this.state.kilit);
    } else {
      const canAct = this.state.faz === 'karar' && !this.state.kilit && activePlayer && !activePlayer.bot;
      const canSpin = canAct && this.hasRemainingConsonants();
      const canBuyVowel = canAct && activePlayer.tur >= VOWEL_PRICE && this.hasRemainingVowels();
      const canGuess = canAct;

      this.buttonsEl.innerHTML =
        btn('cevir', 'ÇEVİR', 'turuncu', !canSpin) +
        btn('sesli', `SESLİ AL (${VOWEL_PRICE})`, 'mor', !canBuyVowel) +
        btn('tahmin', 'TAHMİN ET', 'yesil', !canGuess);
    }
  }

  updateAllUI() {
    this.updatePlayersUI();
    this.updateKeyboardUI();
    this.updateButtonsUI();

    const isMenu = this.state.faz === 'menu';
    const vis = isMenu ? 'hidden' : 'visible';
    this.roundTextEl.style.visibility = vis;
    this.recordTextEl.style.visibility = vis;

    this.recordTextEl.innerHTML = `Rekor: <b>${formatNumber(this.highScore)}</b>`;
    this.roundTextEl.textContent = this.state.faz.startsWith('final') ?
      'Final Turu' : `Tur ${Math.max(1, this.state.tur)} / ${MAX_ROUNDS}`;
  }

  showModal(html) {
    this.modalEl.innerHTML = `<div class="kart">${html}</div>`;
    this.modalEl.classList.add('acik');
  }

  closeModal() {
    this.modalEl.classList.remove('acik');
    this.modalEl.innerHTML = '';
  }

  showMainMenu() {
    this.state.kilit = true;
    this.resetBoardCells();
    $('kat').querySelector('span').textContent = 'KATEGORİ';
    this.state.kullan.clear();
    this.state.faz = 'menu';
    this.state.hucre = [];
    this.state.oy = [
      { ad: 'SEN', bot: false, tur: 0, top: 0 },
      getRandomBotPlayer()
    ];
    if (this.state.zaman) {
      clearInterval(this.state.zaman);
    }
    this.setMessage('');
    this.updateAllUI();

    const logoLetters = 'ÇARKIFELEK';
    const logoSpans = [...logoLetters].map((ch, i) =>
      `<span style="animation-delay:${(i * 0.12).toFixed(2)}s">${ch}</span>`
    ).join('');

    const diffButtons = ['kolay', 'normal', 'zor'].map(z =>
      `<button data-z="${z}" class="${z === this.state.zorluk ? 'sec' : ''}">${z.charAt(0).toLocaleUpperCase('tr-TR') + z.slice(1)}</button>`
    ).join('');

    this.showModal(`
      <div class="logoKutular">${logoSpans}</div>
      <div class="secenek" id="zSec">${diffButtons}</div>
      <div><button class="dug turuncu oynaDug" data-id="basla">OYNA</button></div>
    `);
  }

  startGame() {
    this.state.tur = 0;
    this.state.oy = [
      { ad: 'SEN', bot: false, tur: 0, top: 0 },
      getRandomBotPlayer()
    ];
    this.startRound();
  }

  async startRound() {
    this.state.tur++;
    this.state.bul = getNextPuzzle(false);
    this.state.hucre = layoutPhrase(this.state.bul.metin);
    this.state.kullan.clear();
    this.state.oy.forEach(p => p.tur = 0);
    this.state.sira = (this.state.tur - 1) % this.state.oy.length;
    this.state.faz = 'bekle';
    this.state.kilit = true;

    this.renderBoardPuzzle();
    $('kat').querySelector('span').textContent = this.state.bul.kat;
    this.setMessage(`<b>${this.state.tur}. tur</b> başlıyor! Kategori: <b>${this.state.bul.kat}</b>`);
    this.updateAllUI();

    await delay(1400);
    this.handleTurn();
  }

  handleTurn() {
    const activePlayer = this.state.oy[this.state.sira];
    if (activePlayer.bot) {
      this.state.faz = 'bot';
      this.state.kilit = true;
      this.updateAllUI();
      this.runBotTurn();
      return;
    }

    this.state.faz = 'karar';
    this.state.kilit = false;

    if (!this.hasRemainingConsonants() && !(activePlayer.tur >= VOWEL_PRICE && this.hasRemainingVowels())) {
      this.setMessage('Sessiz harf kalmadı. Bulmacayı <b>tahmin et</b>!');
    } else if (!this.hasRemainingConsonants()) {
      this.setMessage('Sessiz harf kalmadı. Sesli harf al ya da tahmin et.');
    } else {
      this.setMessage('Sıra sende! <b>Çarkı çevir</b>, sesli harf al ya da tahmin et.');
    }

    this.updateAllUI();
  }

  async nextTurn() {
    this.state.faz = 'bekle';
    this.state.kilit = true;
    await delay(300);
    this.state.sira = (this.state.sira + 1) % this.state.oy.length;
    this.updateAllUI();
    await delay(500);
    this.handleTurn();
  }

  async handleButtonClick(actionId) {
    getAudioContext();
    if (this.state.kilit) return;

    const activePlayer = this.state.oy[this.state.sira];

    if (actionId === 'cevir' && this.state.faz === 'karar' && !activePlayer.bot && this.hasRemainingConsonants()) {
      this.executeSpin();
    } else if (actionId === 'sesli' && this.state.faz === 'karar' && !activePlayer.bot && activePlayer.tur >= VOWEL_PRICE && this.hasRemainingVowels()) {
      this.state.faz = 'sesli';
      this.setMessage(`Bir <b>sesli harf</b> seç (${VOWEL_PRICE} puan).`);
      this.updateAllUI();
    } else if (actionId === 'tahmin' && this.state.faz === 'karar' && !activePlayer.bot) {
      this.startGuessMode(false);
    } else if (actionId === 'onay' && (this.state.faz === 'tahmin' || this.state.faz === 'final-tahmin')) {
      this.submitGuess();
    } else if (actionId === 'sil' && (this.state.faz === 'tahmin' || this.state.faz === 'final-tahmin')) {
      this.guessBackspace();
    } else if (actionId === 'vaz' && this.state.faz === 'tahmin') {
      this.cancelGuessMode();
    } else if (actionId === 'vaz' && this.state.faz === 'sesli') {
      this.handleTurn();
    }
  }

  async executeSpin() {
    const activePlayer = this.state.oy[this.state.sira];
    this.state.faz = 'donuyor';
    this.state.kilit = true;
    this.updateAllUI();

    if (activePlayer.bot) {
      this.setMessage(`<b>${activePlayer.ad}</b> çarkı çeviriyor...`);
    } else {
      this.setMessage('Çark dönüyor...');
    }

    const slice = await spinWheel(this.canvasEl, this.state);

    if (slice.t === 'iflas') {
      sounds.iflas();
      activePlayer.tur = 0;
      this.setMessage(`<b>İFLAS!</b> ${activePlayer.bot ? activePlayer.ad + ' bu turdaki puanını kaybetti' : 'Bu turdaki puanını kaybettin'}.`);
      this.updateAllUI();
      await delay(1700);
      this.nextTurn();
      return;
    }

    if (slice.t === 'pas') {
      sounds.pas();
      this.setMessage(`<b>PAS!</b> Sıra ${activePlayer.bot ? activePlayer.ad + activePlayer.ek[1] : 'senden'} geçiyor.`);
      await delay(1500);
      this.nextTurn();
      return;
    }

    this.state.deger = slice.v;

    if (activePlayer.bot) {
      this.setMessage(`<b>${formatNumber(slice.v)}</b> puan! ${activePlayer.ad} düşünüyor...`);
      await delay(1000);
      const botPick = this.getBotConsonantChoice();
      this.guessLetter(botPick, false);
      return;
    }

    this.state.faz = 'sessiz';
    this.state.kilit = false;
    this.setMessage(`<b>${formatNumber(slice.v)}</b> puan! Bir <b>sessiz harf</b> seç.`);
    this.updateAllUI();
  }

  handleLetterInput(letter) {
    if (this.state.kilit) return;
    const activePlayer = this.state.oy[this.state.sira];
    const isHumanTurn = activePlayer && !activePlayer.bot;

    if (this.state.faz === 'sessiz' && isHumanTurn && CONSONANTS.includes(letter) && !this.state.kullan.has(letter)) {
      this.guessLetter(letter, false);
    } else if (this.state.faz === 'sesli' && isHumanTurn && VOWELS.includes(letter) && !this.state.kullan.has(letter)) {
      this.guessLetter(letter, true);
    } else if (this.state.faz === 'tahmin' || this.state.faz === 'final-tahmin') {
      this.guessTypeLetter(letter);
    } else if (this.state.faz === 'final-sec' && !this.state.kullan.has(letter)) {
      this.pickFinalLetter(letter);
    }
  }

  async guessLetter(letter, isVowel) {
    const activePlayer = this.state.oy[this.state.sira];
    this.state.faz = 'bekle';
    this.state.kilit = true;
    this.state.kullan.add(letter);

    if (isVowel) {
      activePlayer.tur -= VOWEL_PRICE;
    }

    this.setMessage(`${activePlayer.bot ? `<b>${activePlayer.ad}</b>` : 'Sen'}: "<b>${letter}</b>"`);
    this.updateAllUI();
    await delay(activePlayer.bot ? 700 : 250);

    const matchCount = await this.revealLetter(letter);

    if (!matchCount) {
      sounds.buzz();
      this.setMessage(`Bulmacada <b>${letter}</b> harfi yok. Sıra geçiyor.`);
      await delay(1500);
      this.nextTurn();
      return;
    }

    if (!isVowel) {
      const earned = this.state.deger * matchCount;
      activePlayer.tur += earned;
      sounds.para();
      this.setMessage(`${matchCount} tane <b>${letter}</b> var! +${formatNumber(earned)} puan`);
    } else {
      this.setMessage(`${matchCount} tane <b>${letter}</b> var!`);
    }

    this.updateAllUI();

    if (!this.unopenedLetters().length) {
      await delay(800);
      this.handleRoundWon(this.state.sira);
      return;
    }

    await delay(activePlayer.bot ? 1100 : 500);
    this.handleTurn();
  }

  startGuessMode(isFinal) {
    this.state.faz = isFinal ? 'final-tahmin' : 'tahmin';
    this.state.kilit = false;
    this.state.tahImlec = 0;
    this.state.tah = this.unopenedLetters()
      .slice()
      .sort((a, b) => a.r - b.r || a.c - b.c)
      .map(cell => ({ h: cell, y: '' }));

    if (!isFinal) {
      this.setMessage('Boş kutuları doldur, sonra <b>ONAYLA</b>.');
    }
    this.renderGuessModeBoard();
    this.updateAllUI();
  }

  renderGuessModeBoard() {
    this.state.tah.forEach((item, idx) => {
      const el = this.getCellElement(item.h);
      const isCurrent = idx === this.state.tahImlec;
      el.className = 'k kutu' + (item.y ? ' yanik' : '') + (isCurrent ? ' imlec' : '');
      el.textContent = item.y;
    });
  }

  guessTypeLetter(letter) {
    if (this.state.tahImlec >= this.state.tah.length) return;
    this.state.tah[this.state.tahImlec].y = letter;
    this.state.tahImlec++;
    sounds.sec();
    this.renderGuessModeBoard();
  }

  guessBackspace() {
    if (this.state.tahImlec <= 0) return;
    this.state.tahImlec--;
    this.state.tah[this.state.tahImlec].y = '';
    this.renderGuessModeBoard();
  }

  clearGuessBufferUI() {
    this.state.tah.forEach(item => {
      const el = this.getCellElement(item.h);
      el.className = 'k kutu';
      el.textContent = '';
    });
  }

  cancelGuessMode() {
    this.clearGuessBufferUI();
    this.state.faz = 'karar';
    this.handleTurn();
  }

  async submitGuess() {
    if (this.state.tah.some(item => !item.y)) {
      this.setMessage('Önce tüm boş kutuları doldur.');
      return;
    }

    const allCorrect = this.state.tah.every(item => item.y === item.h.ch);
    const isFinal = this.state.faz === 'final-tahmin';

    if (allCorrect) {
      if (isFinal) {
        this.resolveFinalRound(true);
        return;
      }
      this.state.faz = 'bekle';
      this.state.kilit = true;
      this.handleRoundWon(this.state.sira);
      return;
    }

    sounds.buzz();
    this.boardEl.classList.remove('salla');
    void this.boardEl.offsetWidth;
    this.boardEl.classList.add('salla');

    if (isFinal) {
      this.state.tah.forEach(item => item.y = '');
      this.state.tahImlec = 0;
      this.renderGuessModeBoard();
      return;
    }

    this.state.faz = 'bekle';
    this.state.kilit = true;
    this.updateAllUI();
    this.setMessage('Yanlış tahmin! Sıra geçiyor.');
    await delay(1100);
    this.clearGuessBufferUI();
    await delay(400);
    this.nextTurn();
  }

  getBotConsonantChoice() {
    const diff = DIFFICULTIES[this.state.zorluk];
    const available = CONSONANT_FREQ.filter(c => !this.state.kullan.has(c));
    const matching = available.filter(c => this.state.hucre.some(cell => !cell.acik && cell.ch === c));

    if (matching.length && Math.random() < diff.isabet) {
      return matching[randInt(Math.min(matching.length, 4))];
    }
    return available[randInt(Math.min(available.length, 6))];
  }

  getBotVowelChoice() {
    const diff = DIFFICULTIES[this.state.zorluk];
    const available = VOWEL_FREQ.filter(v => !this.state.kullan.has(v));
    const matching = available.filter(v => this.state.hucre.some(cell => !cell.acik && cell.ch === v));

    if (matching.length && Math.random() < (diff.isabet + 0.15)) {
      return matching[0];
    }
    return available[randInt(Math.min(available.length, 3))];
  }

  async runBotTurn() {
    const bot = this.state.oy[this.state.sira];
    const diff = DIFFICULTIES[this.state.zorluk];
    this.setMessage(`Sıra <b>${bot.ad}${bot.ek[0]}</b>.`);
    await delay(1000);

    const fraction = this.revealedFraction();
    const hasCons = this.hasRemainingConsonants();
    const canBuyVowel = bot.tur >= VOWEL_PRICE && this.hasRemainingVowels();

    const willSolve = (fraction >= diff.esik && Math.random() < (0.4 + (fraction - diff.esik) * 3)) ||
                      (!hasCons && !canBuyVowel) ||
                      (!hasCons && fraction >= diff.esik);

    if (willSolve) {
      this.executeBotGuess();
      return;
    }

    if (!hasCons || (canBuyVowel && Math.random() < 0.28)) {
      this.setMessage(`<b>${bot.ad}</b> sesli harf alıyor.`);
      await delay(900);
      this.guessLetter(this.getBotVowelChoice(), true);
      return;
    }

    this.executeSpin();
  }

  async executeBotGuess() {
    const bot = this.state.oy[this.state.sira];
    const diff = DIFFICULTIES[this.state.zorluk];
    const fraction = this.revealedFraction();

    let successChance = fraction >= diff.esik + 0.15 ? 0.95 : (fraction >= diff.esik ? 0.72 : 0.3);
    if (!this.hasRemainingConsonants()) {
      successChance = Math.max(successChance, 0.5 + fraction * 0.4);
    }

    this.setMessage(`<b>${bot.ad}</b>: "Tahmin etmek istiyorum!"`);
    await delay(1500);

    if (Math.random() < successChance) {
      this.handleRoundWon(this.state.sira);
      return;
    }

    sounds.buzz();
    this.boardEl.classList.remove('salla');
    void this.boardEl.offsetWidth;
    this.boardEl.classList.add('salla');
    this.setMessage(`<b>${bot.ad}</b> yanlış tahmin etti! Sıra geçiyor.`);
    await delay(1500);
    this.nextTurn();
  }

  async handleRoundWon(winnerIdx) {
    this.state.faz = 'bekle';
    this.state.kilit = true;
    this.updateAllUI();
    this.revealAllBoardLetters();
    sounds.kazan();

    const winner = this.state.oy[winnerIdx];
    const roundPoints = Math.max(winner.tur, 1000);

    this.setMessage(`<b>${winner.ad === 'SEN' ? 'Tebrikler, bildin!' : winner.ad + ' bildi!'}</b>`);
    await delay(1600);

    winner.top += roundPoints;
    this.state.oy.forEach(p => p.tur = 0);
    this.updateAllUI();

    const isLastRound = this.state.tur >= MAX_ROUNDS;
    const rankingHtml = this.state.oy.map(p =>
      `<tr><td>${p.ad}</td><td>${formatNumber(p.top)}</td></tr>`
    ).join('');

    this.showModal(`<h2>${this.state.tur}. Tur Bitti</h2>
    <div class="cevap">${this.state.bul.metin}</div>
    <p>${winner.ad === 'SEN' ? 'Bulmacayı <b>sen</b> çözdün!' : 'Bulmacayı <b>' + winner.ad + '</b> çözdü.'}</p>
    <p class="buyuk">+${formatNumber(roundPoints)}</p>
    <table class="siralama">${rankingHtml}</table>
    <button class="dug turuncu" data-id="${isLastRound ? 'sonuc' : 'sonraki'}">${isLastRound ? 'SONUÇLAR' : 'SONRAKİ TUR'}</button>`);
  }

  checkFinalQualification() {
    const user = this.state.oy[0];
    const highestScore = Math.max(...this.state.oy.map(p => p.top));

    if (user.top >= highestScore && user.top > 0) {
      this.showModal(`<h2>Oyunu Kazandın!</h2><p>Kasanda <b>${formatNumber(user.top)}</b> puan var.</p>
      <p>Şimdi <b>Final Turu</b> zamanı! R, L, N ve E harfleri açılır. 3 sessiz ve 1 sesli harf seçersin, sonra bulmacayı <b>${FINAL_TIME} saniyede</b> çözmen gerekir.</p>
      <p class="buyuk">Ödül: ${formatNumber(FINAL_REWARD)}</p>
      <button class="dug turuncu" data-id="final">FİNALE BAŞLA</button>`);
    } else {
      this.showGameOver(null);
    }
  }

  async startFinalRound() {
    this.state.faz = 'bekle';
    this.state.kilit = true;
    this.state.sira = 0;
    this.state.bul = getNextPuzzle(true);
    this.state.hucre = layoutPhrase(this.state.bul.metin);
    this.state.kullan = new Set();
    this.state.fSes = [];
    this.state.fSli = [];
    this.state.oy.forEach(p => p.tur = 0);

    this.renderBoardPuzzle();
    $('kat').querySelector('span').textContent = this.state.bul.kat;
    this.updateAllUI();
    this.setMessage('<b>Final Turu!</b> R, L, N, E harfleri açılıyor...');
    await delay(1000);

    for (const letter of ['R', 'L', 'N', 'E']) {
      this.state.kullan.add(letter);
      await this.revealLetter(letter, true);
    }

    if (!this.unopenedLetters().length) {
      this.resolveFinalRound(true);
      return;
    }

    this.state.faz = 'final-sec';
    this.state.kilit = false;
    this.promptFinalLetterSelection();
    this.updateAllUI();
  }

  promptFinalLetterSelection() {
    const remCons = 3 - this.state.fSes.length;
    const remVowels = 1 - this.state.fSli.length;
    this.setMessage(`<b>${remCons}</b> sessiz ve <b>${remVowels}</b> sesli harf seç.`);
  }

  async pickFinalLetter(letter) {
    if (VOWELS.includes(letter)) {
      if (this.state.fSli.length >= 1) return;
      this.state.fSli.push(letter);
    } else {
      if (this.state.fSes.length >= 3) return;
      this.state.fSes.push(letter);
    }

    this.state.kullan.add(letter);
    sounds.sec();
    this.promptFinalLetterSelection();
    this.updateAllUI();

    if (this.state.fSes.length < 3 || this.state.fSli.length < 1) return;

    this.state.kilit = true;
    this.updateAllUI();
    this.setMessage('Harflerin açılıyor...');
    await delay(600);

    for (const l of [...this.state.fSes, ...this.state.fSli]) {
      await this.revealLetter(l, true);
    }

    if (!this.unopenedLetters().length) {
      this.resolveFinalRound(true);
      return;
    }

    this.startGuessMode(true);

    let timeLeft = FINAL_TIME;
    const updateTimerMsg = () => {
      this.setMessage(`<div style="width:100%"><div>Bulmacayı çöz! Kalan süre: <b>${timeLeft}</b></div><div id="sure" style="width:${(timeLeft / FINAL_TIME) * 100}%"></div></div>`);
    };
    updateTimerMsg();

    this.state.zaman = setInterval(() => {
      timeLeft--;
      if (timeLeft > 0) {
        updateTimerMsg();
        if (timeLeft <= 5) sounds.tik();
        return;
      }
      clearInterval(this.state.zaman);
      if (this.state.faz === 'final-tahmin') {
        this.resolveFinalRound(false);
      }
    }, 1000);
  }

  async resolveFinalRound(success) {
    if (this.state.zaman) {
      clearInterval(this.state.zaman);
    }
    this.state.faz = 'bekle';
    this.state.kilit = true;
    this.updateAllUI();
    this.revealAllBoardLetters();

    if (success) {
      sounds.kazan();
      this.state.oy[0].top += FINAL_REWARD;
      this.setMessage(`<b>Harika!</b> +${formatNumber(FINAL_REWARD)} puan!`);
    } else {
      sounds.buzz();
      this.setMessage('Süre doldu!');
    }

    this.updateAllUI();
    await delay(2200);
    this.showGameOver(success);
  }

  showGameOver(finalSuccess) {
    this.state.faz = 'menu';
    this.state.kilit = true;
    if (this.state.zaman) {
      clearInterval(this.state.zaman);
    }
    this.updateAllUI();

    const user = this.state.oy[0];
    const sorted = this.state.oy.slice().sort((a, b) => b.top - a.top);
    let isNewRecord = false;

    if (user.top > this.highScore) {
      this.highScore = user.top;
      isNewRecord = true;
      try {
        localStorage.setItem('carkifelek-rekor', this.highScore);
      } catch (e) {}
    }

    const winner = sorted[0];
    const finalResultMsg = finalSuccess === true ?
      `<p>Final bulmacasını bildin: <b>+${formatNumber(FINAL_REWARD)}</b></p>` :
      (finalSuccess === false ? `<p>Final bulmacası: <b>${this.state.bul.metin}</b></p>` : '');

    const rankingHtml = sorted.map((p, idx) =>
      `<tr><td>${idx + 1}. ${p.ad}</td><td>${formatNumber(p.top)}</td></tr>`
    ).join('');

    this.showModal(`<h2>${winner === user ? 'Şampiyon Sensin!' : winner.ad + ' Kazandı'}</h2>
    ${finalResultMsg}
    <table class="siralama">${rankingHtml}</table>
    <p>${isNewRecord ? '🏆 <b>Yeni rekor!</b> ' : ''}Rekor: <b>${formatNumber(this.highScore)}</b></p>
    <button class="dug turuncu" data-id="basla">TEKRAR OYNA</button><button class="dug mor" data-id="menu">MENÜ</button>`);
  }
}
