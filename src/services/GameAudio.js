export class GameAudio {
  constructor() { this.buffers = {}; this.stepClock = 0; }
  unlock() {
    try {
      if (!this.context) {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) return;
        this.context = new Context();
        this.gain = this.context.createGain();
        this.gain.gain.value = 0.55;
        this.gain.connect(this.context.destination);
        for (const name of ['shot', 'glass', 'fire', 'level']) {
          fetch(`${import.meta.env.BASE_URL}audio/${name}.wav`).then(response => response.arrayBuffer())
            .then(data => this.context.decodeAudioData(data)).then(buffer => { this.buffers[name] = buffer; }).catch(() => {});
        }
        const noise = this.context.createBuffer(1, this.context.sampleRate * 0.2, this.context.sampleRate);
        const samples = noise.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / samples.length * 7);
        this.buffers.step = noise;
      }
      this.context.resume().catch(() => {});
    } catch { /* Browser audio is optional. */ }
  }
  play(name, volume = 0.6, rate = 1) {
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running' || !this.buffers[name]) return;
    const source = ctx.createBufferSource(), gain = ctx.createGain();
    source.buffer = this.buffers[name];
    source.playbackRate.value = rate;
    gain.gain.value = volume;
    source.connect(gain); gain.connect(this.gain);
    source.start(); source.onended = () => { source.disconnect(); gain.disconnect(); };
  }
  footsteps(delta, walking, speed) {
    if (!walking || !delta) { this.stepClock = 0; return; }
    this.stepClock -= delta;
    if (this.stepClock > 0) return;
    this.stepClock = Math.max(0.22, 0.43 * 5 / speed);
    this.play('step', 0.22, 0.65 + Math.random() * 0.25);
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running') return;
    const oscillator = ctx.createOscillator(), gain = ctx.createGain();
    oscillator.frequency.setValueAtTime(95, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    oscillator.connect(gain); gain.connect(this.gain);
    oscillator.start(); oscillator.stop(ctx.currentTime + 0.13);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
}
