// frontend/script.js
/**
 * WHO PAYS? - Game Engine & Client Controller
 * Complete game logic with Web Audio API synthesizer, Canvas Roulette,
 * Card Effects (SAFE, LUCKY, SWAP, DOUBLE), and Malayalam Dialogues.
 */

// ==========================================
// 1. SOUND SYSTEM (Web Audio API Synthesizer)
// ==========================================
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('who_pays_sound') !== 'false';
    this.updateIcon();
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('who_pays_sound', this.enabled);
    this.updateIcon();
    if (this.enabled) {
      this.init();
      this.play('click');
    }
  }

  updateIcon() {
    const btn = document.getElementById('soundToggleBtn');
    if (btn) {
      btn.innerHTML = this.enabled ? '🔊' : '🔇';
      btn.title = this.enabled ? 'Sound On (Click to mute)' : 'Sound Off (Click to unmute)';
    }
  }

  play(type) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    switch (type) {
      case 'click': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.05);
        break;
      }

      case 'tick': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.03);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.03);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.03);
        break;
      }

      case 'flip': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.12);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
        break;
      }

      case 'safe': {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + i * 0.08);
          gain.gain.setValueAtTime(0.25, t + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t + i * 0.08);
          osc.stop(t + i * 0.08 + 0.3);
        });
        break;
      }

      case 'double': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.6);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.6);
        break;
      }

      case 'swap': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.linearRampToValueAtTime(900, t + 0.2);
        osc.frequency.linearRampToValueAtTime(400, t + 0.4);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
        break;
      }

      case 'win': {
        const notes = [
          { f: 523.25, d: 0.12 },
          { f: 659.25, d: 0.12 },
          { f: 783.99, d: 0.12 },
          { f: 1046.50, d: 0.4 }
        ];
        let delay = 0;
        notes.forEach(n => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(n.f, t + delay);
          gain.gain.setValueAtTime(0.3, t + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, t + delay + n.d);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t + delay);
          osc.stop(t + delay + n.d);
          delay += n.d * 0.8;
        });
        break;
      }
    }
  }
}

const sounds = new SoundManager();

// ==========================================
// 2. CONFETTI GENERATOR
// ==========================================
class ConfettiEffect {
  constructor() {
    this.canvas = document.getElementById('confettiCanvas');
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'confettiCanvas';
      document.body.appendChild(this.canvas);
    }
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(count = 120) {
    const colors = ['#a855f7', '#06b6d4', '#fbbf24', '#ef4444', '#10b981', '#f43f5e', '#ffffff'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2 - 50,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.7) * 22,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        opacity: 1,
        gravity: 0.4
      });
    }

    if (!this.animationId) {
      this.loop();
    }
  }

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.rotation += p.vRot;
      p.opacity -= 0.007;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();

      if (p.y > this.canvas.height + 50 || p.opacity <= 0) {
        this.particles.splice(idx, 1);
      }
    });

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.loop());
    } else {
      this.animationId = null;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

let confetti = null;

// ==========================================
// 3. CARD DEFINITIONS (Local Fallback)
// ==========================================
const LOCAL_CARDS = {
  SAFE: {
    type: 'SAFE',
    icon: '🛡️',
    title: 'SAFE',
    malayalam_title: 'സുരക്ഷിതം',
    text: 'ഇന്ന് നീ രക്ഷപ്പെട്ടു!',
    tagline: 'ഷീൽഡ് റെഡി! റൗലറ്റ് വീണ്ടും കറങ്ങും!',
    description: 'If selected, you escape paying and the roulette spins again.'
  },
  LUCKY: {
    type: 'LUCKY',
    icon: '🍀',
    title: 'LUCKY',
    malayalam_title: 'ഭാഗ്യവാൻ',
    text: 'ഭാഗ്യം ഇന്നും കൂടെയുണ്ട്!',
    tagline: 'റൗലറ്റിൽ നിന്നെ തൊടാൻ സാധ്യത കുറവാണ്!',
    description: 'Gives you a significantly lower probability of being selected by the wheel.'
  },
  SWAP: {
    type: 'SWAP',
    icon: '🔄',
    title: 'SWAP',
    malayalam_title: 'സ്വാപ്പ്',
    text: 'ഇത് നിനക്ക് വേണ്ട… മറ്റൊരാൾക്ക് കൊടുക്കാം!',
    tagline: 'പണി മറ്റൊരാൾക്ക് കൈമാറാൻ സുവർണ്ണാവസരം!',
    description: 'If selected, you can pass the entire bill to another player of your choice.'
  },
  DOUBLE: {
    type: 'DOUBLE',
    icon: '💀',
    title: 'DOUBLE',
    malayalam_title: 'ഇരട്ടി പ്രഹരം',
    text: 'ഇന്നത്തെ ബിൽ… ഇരട്ടിയായി!',
    tagline: 'പോക്കറ്റ് കാലിയാകുന്ന കാഴ്ച കണ്ടോളൂ!',
    description: 'If selected, you pay 2x the bill amount!'
  }
};

const LOCAL_DIALOGUES = {
  NORMAL: [
    'വിധി തീരുമാനിച്ചു കഴിഞ്ഞു.',
    'ഇനി എന്ത് ചെയ്യാൻ പറ്റും… അടച്ചോ!',
    'ഇന്നത്തെ ബിൽ നിനക്കുള്ളതാണ്!',
    'ഭാഗ്യം നിന്നെ വിട്ടുപോയി.',
    'പോക്കറ്റ് കാലിയാക്കാൻ ഒരാൾ എത്തിയിട്ടുണ്ട്!',
    'കണ്ണടച്ച് കാർഡ് അങ്ങ് തേച്ചേക്ക് സുഹൃത്തേ!',
    'സുഹൃത്തുക്കളുടെ വയറു നിറഞ്ഞു, നിന്റെ പഴ്സ് ഒഴിഞ്ഞു!',
    'ഗൂഗിൾ പേ തുറക്കൂ, ചിരിച്ചുകൊണ്ട് പണം അയക്കൂ!'
  ],
  DOUBLE: [
    'ഇന്നത്തെ ബിൽ… ഇരട്ടിയായി! തലയിൽ കൈവെച്ചോ!',
    'ഡബിൾ പണി! ഇന്ന് നീ മാത്രമേ അടയ്ക്കൂ, അതും ഇരട്ടി തുക!',
    'പോക്കറ്റിന് ഇന്ന് കട്ടപ്പൊക! ഇരട്ടി തുക റെഡിയാക്കിക്കോ!',
    'ഇരട്ടി അടി! സുഹൃത്തുക്കളുടെ സ്നേഹോപഹാരം!'
  ],
  SWAP: [
    'ഇത് നിനക്ക് വേണ്ട… മറ്റൊരാൾക്ക് കൊടുക്കാം! പണി പാലുംവെള്ളത്തിൽ കൊടുത്തു!',
    'സ്വന്തം കഴുത്തിലെ കുരുക്ക് എടുത്ത് സുഹൃത്തിന്റെ കഴുത്തിലിട്ടു!',
    'നല്ല സുഹൃത്തുക്കൾ പണി ഷെയർ ചെയ്യാറില്ല, മൊത്തമായി കൊടുക്കും!',
    'സ്വാപ്പ് മാജിക്! ഒരാളുടെ സന്തോഷം മറ്റൊരാളുടെ വിലാപം!'
  ],
  SAFE: [
    'ഇന്ന് നീ രക്ഷപ്പെട്ടു! അടുത്ത ആൾ പ്രാർത്ഥിച്ചോ!',
    'ഷീൽഡ് ഉയർന്നു, ബിൽ പാളിപ്പോയി! വീണ്ടും കറങ്ങുന്നു!'
  ]
};

// ==========================================
// 4. GAME STATE & LOGIC
// ==========================================
const GameState = {
  players: [],
  billAmount: 0,
  finalAmount: 0,
  cards: {},
  excludedPlayers: [],
  currentSlices: [],
  wheelAngle: 0,
  isSpinning: false,
  initialSelected: null,
  finalPayer: null,
  cardTriggered: 'NORMAL',
  swapTarget: null,
  dialogueShown: ''
};

// Auto-split any players that contain commas/semicolons
function sanitizeExistingPlayers() {
  const expanded = [];
  GameState.players.forEach(p => {
    if (typeof p === 'string' && (p.includes(',') || p.includes(';'))) {
      p.split(/[,;]+/).map(s => s.trim()).filter(Boolean).forEach(sub => expanded.push(sub));
    } else if (typeof p === 'string' && p.trim()) {
      expanded.push(p.trim());
    }
  });

  const unique = [];
  expanded.forEach(p => {
    if (!unique.some(u => u.toLowerCase() === p.toLowerCase())) {
      unique.push(p);
    }
  });
  GameState.players = unique;
}

// Add players with comma/semicolon separation support
function addPlayer(input) {
  if (!input) return;

  // Split by comma or semicolon in case user types "rahul, sneha, amal"
  const names = input.split(/[,;]+/).map(n => n.trim()).filter(Boolean);
  if (names.length === 0) return;

  sanitizeExistingPlayers();

  names.forEach(clean => {
    if (GameState.players.some(p => p.toLowerCase() === clean.toLowerCase())) {
      return; // Skip duplicate
    }
    GameState.players.push(clean);
  });

  renderPlayerChips();
  updateStep1Button();
}

function removePlayer(name) {
  GameState.players = GameState.players.filter(p => p !== name);
  renderPlayerChips();
  updateStep1Button();
}

function renderPlayerChips() {
  sanitizeExistingPlayers();
  const container = document.getElementById('playersList');
  const countElem = document.getElementById('playerCountLabel');
  if (countElem) countElem.textContent = GameState.players.length;

  if (!container) return;
  container.innerHTML = '';

  const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4', '#ef4444'];

  GameState.players.forEach((p, idx) => {
    const chip = document.createElement('div');
    chip.className = 'player-chip';
    const color = colors[idx % colors.length];

    chip.innerHTML = `
      <div class="chip-avatar" style="background: ${color}">${p.charAt(0).toUpperCase()}</div>
      <span>${escapeHtml(p)}</span>
      <button type="button" class="chip-remove" onclick="removePlayer('${escapeHtml(p)}')">&times;</button>
    `;
    container.appendChild(chip);
  });
}

function updateStep1Button() {
  sanitizeExistingPlayers();
  const btn = document.getElementById('dealCardsBtn');
  const billInput = document.getElementById('billAmountInput');
  const statusElem = document.getElementById('step1StatusAlert');
  const reqNotice = document.getElementById('playerRequirementNotice');

  const billVal = parseFloat(billInput ? billInput.value : 0);
  const pCount = GameState.players.length;

  // Update requirement notice in header
  if (reqNotice) {
    if (pCount >= 2) {
      reqNotice.innerHTML = '<span style="color: #34d399;">✓ Ready (' + pCount + ' players)</span>';
    } else {
      reqNotice.innerHTML = '<span style="color: #f87171;">(Need 2+ to start — currently ' + pCount + ')</span>';
    }
  }

  // Update dynamic status banner
  if (statusElem) {
    if (pCount < 2) {
      statusElem.style.display = 'block';
      statusElem.style.color = '#f87171';
      statusElem.innerHTML = '⚠️ Need at least 2 players to start. Add another friend above or click "Quick Fill Sample Squad".';
    } else if (!billVal || billVal <= 0) {
      statusElem.style.display = 'block';
      statusElem.style.color = 'var(--accent-gold)';
      statusElem.innerHTML = '👉 Enter the Total Bill Amount below to deal mystery cards.';
    } else {
      statusElem.style.display = 'block';
      statusElem.style.color = '#34d399';
      statusElem.innerHTML = '✨ All set! ' + pCount + ' players and ₹' + billVal.toLocaleString('en-IN') + ' bill ready.';
    }
  }

  if (btn) {
    // Keep button active so clicking provides clear animated validation feedback
    btn.disabled = false;
    if (pCount >= 2 && billVal > 0) {
      btn.style.opacity = '1';
      btn.style.filter = 'none';
    } else {
      btn.style.opacity = '0.75';
    }
  }
}

function quickFillFriends() {
  ['Rahul', 'Sneha', 'Amal', 'Anjali'].forEach(p => {
    if (!GameState.players.some(existing => existing.toLowerCase() === p.toLowerCase())) {
      GameState.players.push(p);
    }
  });
  const bill = document.getElementById('billAmountInput');
  if (bill && !bill.value) bill.value = '1200';
  renderPlayerChips();
  updateStep1Button();
  sounds.play('click');
}

// ==========================================
// 5. STEP 2: DEAL & REVEAL MYSTERY CARDS
// ==========================================
async function dealCards() {
  sanitizeExistingPlayers();
  sounds.play('click');

  const billInput = document.getElementById('billAmountInput');
  const playerInput = document.getElementById('playerNameInput');
  const billVal = parseFloat(billInput ? billInput.value : 0);

  // Validate player count
  if (GameState.players.length < 2) {
    const statusElem = document.getElementById('step1StatusAlert');
    if (statusElem) {
      statusElem.style.display = 'block';
      statusElem.style.color = '#ef4444';
      statusElem.innerHTML = '❌ You need at least 2 players to deal cards! Currently: ' + GameState.players.length + '. Add more friends above.';
      statusElem.classList.add('shake-animation');
      setTimeout(() => statusElem.classList.remove('shake-animation'), 600);
    }
    if (playerInput) {
      playerInput.focus();
      playerInput.classList.add('shake-animation');
      setTimeout(() => playerInput.classList.remove('shake-animation'), 600);
    }
    return;
  }

  // Validate bill amount
  if (!billVal || billVal <= 0) {
    const statusElem = document.getElementById('step1StatusAlert');
    if (statusElem) {
      statusElem.style.display = 'block';
      statusElem.style.color = '#ef4444';
      statusElem.innerHTML = '❌ Please enter a valid bill amount greater than 0!';
      statusElem.classList.add('shake-animation');
      setTimeout(() => statusElem.classList.remove('shake-animation'), 600);
    }
    if (billInput) {
      billInput.focus();
      billInput.classList.add('shake-animation');
      setTimeout(() => billInput.classList.remove('shake-animation'), 600);
    }
    return;
  }

  GameState.billAmount = billVal;
  GameState.finalAmount = GameState.billAmount;
  GameState.excludedPlayers = [];

  // Deal cards via backend API, with graceful fallback
  let dealtCards = null;
  try {
    const res = await fetch('/api/game/deal-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ players: GameState.players })
    });
    if (res.ok) {
      const data = await res.json();
      dealtCards = data.cards;
    }
  } catch (err) {
    console.warn('Backend deal API unavailable, using local generator:', err);
  }

  // Fallback card dealing
  if (!dealtCards) {
    dealtCards = {};
    const cardKeys = ['SAFE', 'LUCKY', 'SWAP', 'DOUBLE'];
    const pool = [...cardKeys].sort(() => Math.random() - 0.5);
    GameState.players.forEach((p, i) => {
      const key = i < pool.length ? pool[i] : cardKeys[Math.floor(Math.random() * cardKeys.length)];
      dealtCards[p] = LOCAL_CARDS[key];
    });
  }

  GameState.cards = dealtCards;
  renderMysteryCards();
  switchStep(2);
}

function renderMysteryCards() {
  const container = document.getElementById('cardsContainer');
  if (!container) return;
  container.innerHTML = '';

  GameState.players.forEach((player, idx) => {
    const cardInfo = GameState.cards[player] || LOCAL_CARDS.SAFE;
    const wrapper = document.createElement('div');
    wrapper.className = 'mystery-card-wrapper';

    const cardTypeClass = 'card-' + (cardInfo.type || 'safe').toLowerCase();

    wrapper.innerHTML = `
      <div class="mystery-card" id="card-${idx}" onclick="flipCard('${idx}')">
        <!-- FRONT: FACEDOWN -->
        <div class="card-face card-face-front">
          <div class="front-player">${escapeHtml(player)}</div>
          <div class="front-pattern">?</div>
          <div class="front-tap-hint">👆 Tap to Reveal</div>
        </div>
        <!-- BACK: REVEALED -->
        <div class="card-face card-face-back ${cardTypeClass}">
          <div>
            <div class="front-player" style="margin-bottom: 0.25rem;">${escapeHtml(player)}</div>
            <div class="card-icon-lg">${cardInfo.icon}</div>
            <div class="card-title-lg">${cardInfo.title}</div>
          </div>
          <div>
            <div class="card-malayalam-text">${cardInfo.text}</div>
            <div class="card-desc">${cardInfo.description}</div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(wrapper);
  });
}

function flipCard(idx) {
  const cardElem = document.getElementById(`card-${idx}`);
  if (!cardElem || cardElem.classList.contains('flipped')) return;
  sounds.play('flip');
  cardElem.classList.add('flipped');
  checkAllFlipped();
}

function revealAllCards() {
  sounds.play('flip');
  GameState.players.forEach((_, idx) => {
    const cardElem = document.getElementById(`card-${idx}`);
    if (cardElem) cardElem.classList.add('flipped');
  });
  checkAllFlipped();
}

function checkAllFlipped() {
  const flippedCount = document.querySelectorAll('.mystery-card.flipped').length;
  const readyBtn = document.getElementById('proceedToRouletteBtn');
  if (readyBtn) {
    if (flippedCount === GameState.players.length) {
      readyBtn.disabled = false;
      readyBtn.classList.add('shake-animation');
      setTimeout(() => readyBtn.classList.remove('shake-animation'), 600);
    }
  }
}

// ==========================================
// 6. STEP 3: ROULETTE WHEEL
// ==========================================
let rouletteWheel = null;

const WHEEL_COLORS = [
  '#ec4899', '#8b5cf6', '#3b82f6', '#10b981',
  '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'
];

class CanvasWheel {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.slices = [];
    this.currentRotation = 0;
    this.isSpinning = false;
    this.lastTickIndex = -1;
  }

  setSlices(slices) {
    this.slices = slices;
    this.draw();
  }

  draw() {
    if (!this.canvas || !this.slices.length) return;
    const ctx = this.ctx;
    const size = this.canvas.width;
    const center = size / 2;
    const radius = center - 8;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((this.currentRotation * Math.PI) / 180);

    this.slices.forEach(slice => {
      const startRad = (slice.start_deg * Math.PI) / 180;
      const endRad = (slice.end_deg * Math.PI) / 180;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startRad, endRad);
      ctx.closePath();

      ctx.fillStyle = slice.color;
      ctx.fill();

      ctx.strokeStyle = '#0b0f19';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      const midRad = (startRad + endRad) / 2;
      ctx.rotate(midRad);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;

      const card = slice.card || {};
      const luckyTag = card.type === 'LUCKY' ? ' 🍀' : '';
      ctx.fillText(slice.player + luckyTag, radius - 20, 5);
      ctx.restore();
    });

    ctx.restore();
  }

  spinTo(targetDeg, onTick, onComplete) {
    this.isSpinning = true;
    const totalSpins = 5 + Math.floor(Math.random() * 3);
    const desiredAngle = (270 - targetDeg + 360) % 360;
    const startAngle = this.currentRotation % 360;
    const delta = (360 * totalSpins) + (desiredAngle - startAngle);
    const finalAngle = this.currentRotation + delta;

    const duration = 4800;
    const startTime = performance.now();
    const initialRot = this.currentRotation;

    const animate = now => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      this.currentRotation = initialRot + (finalAngle - initialRot) * ease;

      const normalizedAngle = (270 - (this.currentRotation % 360) + 360) % 360;
      const currentSliceIdx = this.slices.findIndex(
        s => normalizedAngle >= s.start_deg && normalizedAngle < s.end_deg
      );
      if (currentSliceIdx !== -1 && currentSliceIdx !== this.lastTickIndex) {
        this.lastTickIndex = currentSliceIdx;
        if (onTick) onTick();
      }

      this.draw();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.currentRotation = finalAngle;
        this.draw();
        this.isSpinning = false;
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(animate);
  }
}

// Local wheel calculator if backend unavailable
function calculateLocalWheel(activePlayers, cards) {
  const weights = {};
  for (const p of activePlayers) {
    const card = cards[p] || {};
    weights[p] = card.type === 'LUCKY' ? 35.0 : 100.0;
  }
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const slices = [];
  let currentDeg = 0.0;
  activePlayers.forEach((p, i) => {
    const sliceDeg = (weights[p] / totalWeight) * 360.0;
    slices.push({
      player: p,
      weight: weights[p],
      start_deg: round(currentDeg, 2),
      end_deg: round(currentDeg + sliceDeg, 2),
      span_deg: round(sliceDeg, 2),
      color: WHEEL_COLORS[i % WHEEL_COLORS.length],
      card: cards[p] || {}
    });
    currentDeg += sliceDeg;
  });

  const r = Math.random() * totalWeight;
  let running = 0.0;
  let selected = activePlayers[0];
  for (const p of activePlayers) {
    running += weights[p];
    if (r <= running) {
      selected = p;
      break;
    }
  }

  const targetSlice = slices.find(s => s.player === selected) || slices[0];
  const targetAngle = (targetSlice.start_deg + targetSlice.end_deg) / 2.0;

  return {
    selected_player: selected,
    slices,
    target_angle: round(targetAngle, 2)
  };
}

function round(val, dec) {
  return Number(Math.round(val + 'e' + dec) + 'e-' + dec);
}

async function prepareRoulette() {
  switchStep(3);
  const canvas = document.getElementById('rouletteCanvas');
  if (canvas) {
    canvas.width = 400;
    canvas.height = 400;
  }
  rouletteWheel = new CanvasWheel('rouletteCanvas');

  let spinData = null;
  try {
    const res = await fetch('/api/game/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        players: GameState.players,
        cards: GameState.cards,
        excluded: GameState.excludedPlayers
      })
    });
    if (res.ok) {
      spinData = await res.json();
    }
  } catch (err) {
    console.warn('Backend spin API unavailable, using local calculation:', err);
  }

  if (!spinData) {
    const active = GameState.players.filter(p => !GameState.excludedPlayers.includes(p));
    spinData = calculateLocalWheel(active.length ? active : GameState.players, GameState.cards);
  }

  GameState.currentSlices = spinData.slices;
  rouletteWheel.setSlices(spinData.slices);

  const spinBtn = document.getElementById('spinRouletteBtn');
  if (spinBtn) spinBtn.disabled = false;
}

async function triggerSpin() {
  const spinBtn = document.getElementById('spinRouletteBtn');
  if (spinBtn) spinBtn.disabled = true;
  sounds.play('click');

  let spinData = null;
  try {
    const res = await fetch('/api/game/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        players: GameState.players,
        cards: GameState.cards,
        excluded: GameState.excludedPlayers
      })
    });
    if (res.ok) {
      spinData = await res.json();
    }
  } catch (err) {
    console.warn('Backend spin API unavailable, using local calculation:', err);
  }

  if (!spinData) {
    const active = GameState.players.filter(p => !GameState.excludedPlayers.includes(p));
    spinData = calculateLocalWheel(active.length ? active : GameState.players, GameState.cards);
  }

  const selectedPlayer = spinData.selected_player;
  GameState.initialSelected = selectedPlayer;
  GameState.finalPayer = selectedPlayer;

  rouletteWheel.spinTo(
    spinData.target_angle,
    () => sounds.play('tick'),
    () => handleRouletteLanded(selectedPlayer)
  );
}

// ==========================================
// 7. STEP 4: CARD EFFECTS & RESOLUTION
// ==========================================
function handleRouletteLanded(player) {
  const card = GameState.cards[player] || { type: 'NORMAL' };
  GameState.cardTriggered = card.type;

  if (card.type === 'SAFE') {
    sounds.play('safe');
    showSafeModal(player);
    return;
  }

  if (card.type === 'SWAP') {
    sounds.play('swap');
    showSwapModal(player);
    return;
  }

  if (card.type === 'DOUBLE') {
    sounds.play('double');
    GameState.finalAmount = GameState.billAmount * 2;
    showDoubleAlert(player, () => {
      finishGameRound();
    });
    return;
  }

  sounds.play('win');
  finishGameRound();
}

function showSafeModal(player) {
  const modal = document.getElementById('safeModal');
  const text = document.getElementById('safePlayerName');
  if (text) text.textContent = player;
  if (modal) modal.classList.add('active');
}

function handleSafeRespin() {
  const modal = document.getElementById('safeModal');
  if (modal) modal.classList.remove('active');
  sounds.play('click');

  GameState.excludedPlayers.push(GameState.initialSelected);

  if (GameState.excludedPlayers.length >= GameState.players.length) {
    GameState.excludedPlayers = [];
  }

  prepareRoulette().then(() => {
    setTimeout(() => {
      triggerSpin();
    }, 600);
  });
}

function showSwapModal(player) {
  const modal = document.getElementById('swapModal');
  const nameElem = document.getElementById('swapChooserName');
  const listElem = document.getElementById('swapCandidatesList');
  if (nameElem) nameElem.textContent = player;
  if (listElem) {
    listElem.innerHTML = '';
    GameState.players
      .filter(p => p !== player)
      .forEach(candidate => {
        const btn = document.createElement('button');
        btn.className = 'swap-candidate-btn';
        btn.innerHTML = `
          <span>👤 ${escapeHtml(candidate)}</span>
          <span style="color: var(--secondary)">Transfer Bill ➔</span>
        `;
        btn.onclick = () => confirmSwap(player, candidate);
        listElem.appendChild(btn);
      });
  }
  if (modal) modal.classList.add('active');
}

function confirmSwap(fromPlayer, toPlayer) {
  sounds.play('swap');
  GameState.swapTarget = toPlayer;
  GameState.finalPayer = toPlayer;
  const modal = document.getElementById('swapModal');
  if (modal) modal.classList.remove('active');
  finishGameRound();
}

function showDoubleAlert(player, onComplete) {
  const alertBox = document.getElementById('doubleAlertBanner');
  if (alertBox) {
    alertBox.classList.add('active');
    setTimeout(() => {
      alertBox.classList.remove('active');
      if (onComplete) onComplete();
    }, 2500);
  } else {
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 1000);
  }
}

// ==========================================
// 8. STEP 5: FINAL RESULT & PERSISTENCE
// ==========================================
async function finishGameRound() {
  sounds.play('win');
  if (!confetti) confetti = new ConfettiEffect();
  confetti.burst(150);

  let dialogue = 'വിധി തീരുമാനിച്ചു കഴിഞ്ഞു.';
  try {
    const res = await fetch('/api/game/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: GameState.cardTriggered })
    });
    if (res.ok) {
      const dData = await res.json();
      dialogue = dData.dialogue;
    } else {
      throw new Error();
    }
  } catch (e) {
    const pool = LOCAL_DIALOGUES[GameState.cardTriggered] || LOCAL_DIALOGUES.NORMAL;
    dialogue = pool[Math.floor(Math.random() * pool.length)];
  }
  GameState.dialogueShown = dialogue;

  renderResultModal();

  try {
    await fetch('/api/game/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bill_amount: GameState.billAmount,
        final_amount: GameState.finalAmount,
        initial_selected: GameState.initialSelected,
        final_payer: GameState.finalPayer,
        card_triggered: GameState.cardTriggered,
        swap_target: GameState.swapTarget,
        players: GameState.players,
        cards: GameState.cards,
        dialogue_shown: GameState.dialogueShown
      })
    });
  } catch (err) {
    console.warn('Game round recorded locally:', err);
  }
}

function renderResultModal() {
  const modal = document.getElementById('resultModal');
  const nameElem = document.getElementById('finalPayerName');
  const amountElem = document.getElementById('finalAmountText');
  const dialogueElem = document.getElementById('finalDialogueText');
  const effectBadge = document.getElementById('resultCardBadge');

  if (nameElem) nameElem.textContent = GameState.finalPayer;
  if (amountElem) amountElem.textContent = '₹' + GameState.finalAmount.toLocaleString('en-IN');
  if (dialogueElem) dialogueElem.textContent = GameState.dialogueShown;

  if (effectBadge) {
    if (GameState.cardTriggered === 'DOUBLE') {
      effectBadge.innerHTML = '💀 DOUBLE TRIGGERED (2x Bill)';
      effectBadge.style.background = 'rgba(239, 68, 68, 0.2)';
      effectBadge.style.color = '#f87171';
      effectBadge.style.border = '1px solid #ef4444';
    } else if (GameState.cardTriggered === 'SWAP') {
      effectBadge.innerHTML = `🔄 SWAPPED FROM ${escapeHtml(GameState.initialSelected)}`;
      effectBadge.style.background = 'rgba(6, 182, 212, 0.2)';
      effectBadge.style.color = '#38bdf8';
      effectBadge.style.border = '1px solid #06b6d4';
    } else if (GameState.cardTriggered === 'LUCKY') {
      effectBadge.innerHTML = '🍀 LUCKY CARD (Tough Luck!)';
      effectBadge.style.background = 'rgba(16, 185, 129, 0.2)';
      effectBadge.style.color = '#34d399';
      effectBadge.style.border = '1px solid #10b981';
    } else {
      effectBadge.innerHTML = '🎯 DIRECT HIT';
      effectBadge.style.background = 'rgba(139, 92, 246, 0.2)';
      effectBadge.style.color = '#c084fc';
      effectBadge.style.border = '1px solid #8b5cf6';
    }
  }

  if (modal) modal.classList.add('active');
}

function playAgain() {
  sounds.play('click');
  const modal = document.getElementById('resultModal');
  if (modal) modal.classList.remove('active');
  switchStep(1);
}

function switchStep(stepNum) {
  document.querySelectorAll('.game-step-section').forEach(sec => sec.style.display = 'none');
  document.querySelectorAll('.step-item').forEach((item, idx) => {
    item.classList.remove('active');
    if (idx + 1 < stepNum) item.classList.add('completed');
    else item.classList.remove('completed');
    if (idx + 1 === stepNum) item.classList.add('active');
  });

  const activeSec = document.getElementById(`step${stepNum}Section`);
  if (activeSec) activeSec.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================
// 9. LEADERBOARD LOADER
// ==========================================
async function loadLeaderboard(activeTab = 'biggest_wallet') {
  const podiumContainer = document.getElementById('leaderboardPodium');
  const tableContainer = document.getElementById('leaderboardTableBody');
  if (!tableContainer) return;

  try {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    const list = data[activeTab] || [];

    if (podiumContainer) {
      if (list.length === 0) {
        podiumContainer.innerHTML = '<div style="color: var(--text-dim); text-align: center; width: 100%;">No games recorded yet! Play a game to see leaders.</div>';
      } else {
        const top3 = [list[1], list[0], list[2]];
        const ranks = [2, 1, 3];
        const medals = ['🥈', '🥇', '🥉'];

        let podiumHtml = '';
        top3.forEach((p, i) => {
          if (!p) {
            podiumHtml += `<div class="podium-slot rank-${ranks[i]}"></div>`;
            return;
          }
          const char = p.character || {};
          let valText = '';
          if (activeTab === 'biggest_wallet') valText = '₹' + p.total_amount_paid.toLocaleString('en-IN');
          else if (activeTab === 'most_unlucky') valText = p.times_selected + ' times hit';
          else if (activeTab === 'luckiest') valText = (p.times_escaped + p.times_lucky) + ' luck pts';
          else if (activeTab === 'bill_king') valText = p.bills_paid + ' bills';
          else if (activeTab === 'escape_artist') valText = p.times_escaped + ' escapes';

          podiumHtml += `
            <div class="podium-slot rank-${ranks[i]}">
              <div class="podium-rank-badge">${medals[i]}</div>
              <div class="podium-avatar">${char.badge || '👤'}</div>
              <div style="font-weight: 800; font-size: 1.1rem; color: #fff;">${escapeHtml(p.name)}</div>
              <div style="font-size: 0.8rem; color: var(--accent-gold); font-weight: 700;">${char.identity || ''}</div>
              <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">${valText}</div>
              <div class="podium-stand">
                <span style="font-weight: 900; font-size: 1.2rem; color: var(--text-muted);">#${ranks[i]}</span>
              </div>
            </div>
          `;
        });
        podiumContainer.innerHTML = podiumHtml;
      }
    }

    if (list.length === 0) {
      tableContainer.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-dim);">No game data yet. Play your first round!</td></tr>';
      return;
    }

    let rowsHtml = '';
    list.forEach((p, idx) => {
      const char = p.character || {};
      rowsHtml += `
        <tr>
          <td style="font-weight: 800; color: ${idx < 3 ? 'var(--accent-gold)' : 'var(--text-dim)'};">#${idx + 1}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <span style="font-size: 1.3rem;">${char.badge || '👤'}</span>
              <div>
                <div style="font-weight: 800; color: #fff;">${escapeHtml(p.name)}</div>
                <div style="font-size: 0.75rem; color: ${char.color || '#38bdf8'}; font-weight: 700;">${char.malayalam_title || char.identity}</div>
              </div>
            </div>
          </td>
          <td style="font-weight: 700; color: var(--accent-gold);">₹${(p.total_amount_paid || 0).toLocaleString('en-IN')}</td>
          <td>${p.bills_paid}</td>
          <td style="color: var(--accent-safe); font-weight: 700;">${p.times_escaped}</td>
        </tr>
      `;
    });
    tableContainer.innerHTML = rowsHtml;

  } catch (err) {
    console.error('Error loading leaderboard:', err);
  }
}

// ==========================================
// 10. PROFILES LOADER
// ==========================================
async function loadProfiles() {
  const container = document.getElementById('profilesGrid');
  if (!container) return;

  try {
    const res = await fetch('/api/profiles');
    const profiles = await res.json();

    if (profiles.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
          <h3>No Player Profiles Found!</h3>
          <p style="margin-top: 0.5rem;">Play a game to automatically generate real character identities!</p>
        </div>
      `;
      return;
    }

    let html = '';
    profiles.forEach(p => {
      const char = p.character || {};
      html += `
        <div class="profile-card">
          <div class="profile-header">
            <div class="profile-avatar" style="background: ${char.color || '#8b5cf6'}20; border-color: ${char.color || '#8b5cf6'}">
              ${char.badge || '👤'}
            </div>
            <div class="profile-title-area">
              <div class="profile-name">${escapeHtml(p.name)}</div>
              <span class="profile-identity-tag" style="background: ${char.color || '#8b5cf6'}25; color: ${char.color || '#c084fc'}; border: 1px solid ${char.color || '#8b5cf6'}">
                ${char.identity || 'Casual Diner'}
              </span>
            </div>
          </div>

          <div class="profile-quote">
            <strong>${char.malayalam_title || ''}</strong>: “${char.quote || ''}”
          </div>

          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-value" style="color: var(--accent-gold);">₹${(p.total_amount_paid || 0).toLocaleString('en-IN')}</div>
              <div class="stat-label">Total Paid</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${p.bills_paid}</div>
              <div class="stat-label">Bills Paid</div>
            </div>
            <div class="stat-box">
              <div class="stat-value" style="color: var(--accent-safe);">${p.times_escaped}</div>
              <div class="stat-label">Escapes</div>
            </div>
            <div class="stat-box">
              <div class="stat-value" style="color: var(--secondary);">${p.dodge_rate}%</div>
              <div class="stat-label">Dodge Rate</div>
            </div>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;

  } catch (err) {
    console.error('Error loading profiles:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  sounds.updateIcon();
  const addPlayerBtn = document.getElementById('addPlayerBtn');
  const playerInput = document.getElementById('playerNameInput');
  const billInput = document.getElementById('billAmountInput');

  if (addPlayerBtn && playerInput) {
    addPlayerBtn.addEventListener('click', () => {
      addPlayer(playerInput.value);
      playerInput.value = '';
      playerInput.focus();
    });

    playerInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addPlayer(playerInput.value);
        playerInput.value = '';
      }
    });
  }

  if (billInput) {
    billInput.addEventListener('input', updateStep1Button);
  }

  updateStep1Button();
});
