let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

export function playSoftKeyClick() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.018;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.exp(-i / (bufferSize * 0.25));
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400 + (Math.random() * 300 - 150), now);
    filter.Q.setValueAtTime(1.8, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.018);
  } catch {}
}

export function playGoalChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const tones = [
      { freq: 523.25, time: now, duration: 1.2, gain: 0.06 },
      { freq: 659.25, time: now + 0.14, duration: 1.4, gain: 0.07 },
      { freq: 783.99, time: now + 0.28, duration: 2.0, gain: 0.08 },
    ];

    tones.forEach(({ freq, time, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gainNode.gain.setValueAtTime(0.0001, time);
      gainNode.gain.exponentialRampToValueAtTime(gain, time + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, time + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    });
  } catch {}
}
