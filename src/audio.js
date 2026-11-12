let audioCtx = null;
let soundEnabled = true;

try {
  soundEnabled = localStorage.getItem('carkifelek-ses') !== '0';
} catch (e) {}

export function getAudioContext() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (e) {}
  return audioCtx;
}

export function isSoundEnabled() {
  return soundEnabled;
}

export function toggleSound() {
  soundEnabled = !soundEnabled;
  try {
    localStorage.setItem('carkifelek-ses', soundEnabled ? '1' : '0');
  } catch (e) {}
  if (soundEnabled) {
    sounds.sec();
  }
  return soundEnabled;
}

export function playTone(freq, duration, type = 'sine', gain = 0.2, delay = 0, rampFreq = null) {
  const ctx = getAudioContext();
  if (!ctx || !soundEnabled) return;

  const startTime = ctx.currentTime + (delay || 0);
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, startTime);
  if (rampFreq) {
    osc.frequency.exponentialRampToValueAtTime(rampFreq, startTime + duration);
  }

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(gain || 0.2, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

export const sounds = {
  tik() {
    playTone(1700, 0.035, 'triangle', 0.06);
  },
  ding() {
    playTone(1320, 0.6, 'sine', 0.22);
    playTone(2640, 0.35, 'sine', 0.07);
  },
  buzz() {
    playTone(130, 0.5, 'sawtooth', 0.15);
    playTone(98, 0.5, 'sawtooth', 0.08);
  },
  iflas() {
    playTone(420, 0.9, 'sawtooth', 0.16, 0, 70);
  },
  pas() {
    playTone(500, 0.2, 'triangle', 0.18);
    playTone(350, 0.3, 'sine', 0.18, 0.18);
  },
  kazan() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => {
      playTone(f, 0.28, 'sine', 0.18, i * 0.12);
    });
  },
  para() {
    playTone(988, 0.1, 'triangle', 0.08);
    playTone(1319, 0.25, 'sine', 0.08, 0.08);
  },
  sec() {
    playTone(880, 0.08, 'triangle', 0.12);
  }
};
