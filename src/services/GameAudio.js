const AUDIO_BASE=import.meta.env?.BASE_URL||'/';
export class GameAudio {
  constructor() {
    this.musicVolume=.65;this.effectsVolume=.8;
    this.buffers = {}; this.stepClock = 0; this.musicOffset = 0; this.mode = 'menu'; this.musicPaused = false;
    this.menuTrack = new Audio(`${AUDIO_BASE}audio/menu-seven-graves-west.mp3`);
    this.menuTrack.loop = true; this.menuTrack.volume = .33; this.menuTrack.preload = 'metadata';
    this.menuTrack.play().catch(() => {});
  }
  setVolumes(music, effects) {
    this.musicVolume=Number.isFinite(Number(music))?Math.max(0,Math.min(1,Number(music))):.65;
    this.effectsVolume=Number.isFinite(Number(effects))?Math.max(0,Math.min(1,Number(effects))):.8;
    this.menuTrack.volume=.5*this.musicVolume;
    if(this.gain)this.gain.gain.setTargetAtTime(.55*this.effectsVolume,this.context.currentTime,.03);
    if(this.musicGain)this.musicGain.gain.setTargetAtTime(.5*this.musicVolume,this.context.currentTime,.03);
  }
  unlock() {
    try {
      if (!this.context) {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) return;
        this.context = new Context();
        this.gain = this.context.createGain();
        this.gain.gain.value = .55*this.effectsVolume;
        this.gain.connect(this.context.destination);
        this.musicGain = this.context.createGain();
        this.musicGain.gain.value = .5*this.musicVolume;
        this.musicGain.connect(this.context.destination);
        for (const name of ['shot', 'glass', 'fire', 'level']) {
          fetch(`${AUDIO_BASE}audio/${name}.wav`).then(response => response.arrayBuffer())
            .then(data => this.context.decodeAudioData(data)).then(buffer => { this.buffers[name] = buffer; }).catch(() => {});
        }
        // Distinct heel, leather sole and loose grit for each footfall.
        this.bootSteps=Array.from({length:8},(_,variant)=>{
          const rate=this.context.sampleRate,buffer=this.context.createBuffer(1,rate*.32,rate),out=buffer.getChannelData(0);
          let low=0;
          for(let i=0;i<out.length;i++){
            const t=i/rate,n=Math.random()*2-1;low=low*.91+n*.09;
            const heel=Math.exp(-t*70)*Math.sin(2*Math.PI*(82+variant*2)*t)*.32;
            const sole=t>.035?Math.exp(-(t-.035)*35)*low*.85:0;
            const grit=(Math.exp(-t*24)+.45*Math.exp(-Math.pow((t-.13)/.04,2)))*n*.08;
            out[i]=Math.tanh(heel+sole+grit)*Math.min(1,t*1500)*Math.max(0,1-t/.32);
          }
          return buffer;
        });
      }
      this.context.resume().then(() => this.startMusic()).catch(() => {});
      if (this.mode === 'menu' && !this.musicPaused) this.menuTrack.play().catch(() => {});
    } catch { /* Browser audio is optional. */ }
  }
  syncMusic(mode, paused) {
    if (mode === this.mode && paused === this.musicPaused) return;
    if (mode !== this.mode) { this.stopStageMusic(); this.musicOffset = 0; }
    this.mode = mode; this.musicPaused = paused;
    if (mode !== 'menu' || paused) this.menuTrack.pause();
    if (mode === 'menu' || paused) this.stopStageMusic();
    this.startMusic();
  }
  startMusic() {
    if (this.disposed || this.musicPaused) return;
    if (this.mode === 'menu') { this.menuTrack.play().catch(() => {}); return; }
    if (!this.context || this.context.state !== 'running' || this.musicSource) return;
    this.musicBuffers ||= {}; this.musicLoads ||= {};
    const key=this.mode==='mine'?'mine':'desert';
    if (!this.musicBuffers[key]) {
      if (!this.musicLoads[key]) this.musicLoads[key] = fetch(`${AUDIO_BASE}audio/${key==='mine'?'mine-prospector':'desert-iron-boots'}.mp3`)
        .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.arrayBuffer(); })
        .then(data => this.context.decodeAudioData(data)).then(buffer => {
          this.musicBuffers[key] = buffer; this.startMusic();
        }).catch(error => {delete this.musicLoads[key];console.warn('Não foi possível carregar a música da fase.',error);});
      return;
    }
    const source = this.context.createBufferSource();
    source.buffer = this.musicBuffers[key]; source.loop = true;
    source.loopStart = 0; source.loopEnd = Math.min(166, source.buffer.duration);
    source.connect(this.musicGain);
    source.start(0, this.musicOffset % source.loopEnd);
    this.musicStartedAt = this.context.currentTime; this.musicSource = source;
  }
  stopStageMusic() {
    if (!this.musicSource) return;
    this.musicOffset = (this.musicOffset + this.context.currentTime - this.musicStartedAt) % this.musicSource.loopEnd;
    this.musicSource.stop(); this.musicSource.disconnect(); this.musicSource = null;
  }
  dispose() {
    this.disposed = true; this.menuTrack.pause(); this.stopStageMusic(); this.context?.close();
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
    const ctx=this.context;
    if(!ctx||ctx.state!=='running'||!this.bootSteps)return;
    this.footIndex=(this.footIndex||0)+1;
    const source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter(),pan=ctx.createStereoPanner();
    source.buffer=this.bootSteps[(this.footIndex+Math.floor(Math.random()*3))%this.bootSteps.length];
    source.playbackRate.value=.94+Math.random()*.12;
    filter.type='lowpass';filter.frequency.value=2400+Math.random()*600;
    gain.gain.value=.58+Math.random()*.12;pan.pan.value=this.footIndex%2?-.12:.12;
    source.connect(filter);filter.connect(gain);gain.connect(pan);pan.connect(this.gain);source.start();
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();pan.disconnect();};
  }

  shotgun() {
    this.play('shot',.85,.72);
    const ctx=this.context;if(!ctx||ctx.state!=='running')return;
    const noise=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.48),ctx.sampleRate),data=noise.getChannelData(0);
    for(let i=0;i<data.length;i++){const t=i/ctx.sampleRate;data[i]=(Math.random()*2-1)*Math.exp(-t*17)*.5+Math.sin(t*2*Math.PI*65)*Math.exp(-t*28)*.3;}
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    source.buffer=noise;filter.type='lowpass';filter.frequency.value=2400;gain.gain.value=.7;
    source.connect(filter);filter.connect(gain);gain.connect(this.gain);source.start();
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  }
}
