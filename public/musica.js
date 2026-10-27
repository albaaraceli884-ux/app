// ---------------------------------------------------------------
// Música de Sun Shine: una melodía original y alegre (marimba,
// bajo, acordes suaves y shaker) generada en vivo con Web Audio.
// No usa archivos de audio ni canciones con derechos de autor.
//
// Uso: SunShineMusica.alternar()  → enciende / apaga
//      SunShineMusica.sonando     → true / false
//      document 'sunshine:musica' → evento con detail.sonando
// Los navegadores solo permiten sonido después de un clic.
// ---------------------------------------------------------------
(function () {
  const BPM = 104;
  const CORCHEA = 60 / BPM / 2;           // duración de una corchea
  const PULSO = 60 / BPM;                  // para sincronizar animaciones
  document.documentElement.style.setProperty('--pulso', PULSO.toFixed(3) + 's');

  // Progresión soleada en Do mayor: Cmaj7 – Am7 – Fmaj7 – G7 (un compás cada uno)
  const ACORDES = [
    { bajo: 36, notas: [60, 64, 67, 71] },
    { bajo: 33, notas: [57, 60, 64, 67] },
    { bajo: 29, notas: [53, 57, 60, 64] },
    { bajo: 31, notas: [55, 59, 62, 65] },
  ];
  // Melodías (índice de nota del acorde, una octava arriba; null = silencio)
  const FRASES = [
    [0, null, 2, 1, null, 3, 2, null],
    [3, 2, null, 0, 1, null, 2, null],
    [2, null, 3, null, 1, 2, 0, null],
    [0, 1, 2, 3, null, 2, null, null],
  ];
  const BAJO = [0, null, null, 7, null, null, 0, 12]; // ritmo tipo bossa (semitonos sobre la raíz)

  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  let ctx, maestro, ruido, timer;
  let paso = 0, siguiente = 0, sonando = false;

  function iniciarAudio() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3;
    maestro = ctx.createGain();
    maestro.gain.value = 0;
    maestro.connect(comp).connect(ctx.destination);
    // Ruido blanco para el shaker
    ruido = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const d = ruido.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function marimba(t, m, vel) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22 * vel, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    g.connect(maestro);
    const fund = ctx.createOscillator(); fund.type = 'sine'; fund.frequency.value = hz(m);
    const brillo = ctx.createOscillator(); brillo.type = 'sine'; brillo.frequency.value = hz(m) * 4;
    const gb = ctx.createGain();
    gb.gain.setValueAtTime(0.08 * vel, t);
    gb.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    fund.connect(g); brillo.connect(gb).connect(g);
    fund.start(t); brillo.start(t); fund.stop(t + 0.65); brillo.stop(t + 0.1);
  }

  function bajo(t, m) {
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(m);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + CORCHEA * 1.8);
    o.connect(g).connect(maestro);
    o.start(t); o.stop(t + CORCHEA * 2);
  }

  function colchon(t, notas, dur) {
    const filtro = ctx.createBiquadFilter(); filtro.type = 'lowpass'; filtro.frequency.value = 1400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.035, t + 0.25);
    g.gain.setValueAtTime(0.035, t + dur - 0.3);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    filtro.connect(g).connect(maestro);
    for (const m of notas) {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(m);
      o.detune.value = (Math.random() - 0.5) * 8;
      o.connect(filtro); o.start(t); o.stop(t + dur + 0.05);
    }
  }

  function shaker(t, vel) {
    const s = ctx.createBufferSource(); s.buffer = ruido;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05 * vel, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    s.connect(f).connect(g).connect(maestro);
    s.start(t); s.stop(t + 0.08);
  }

  function tocarPaso(n, t) {
    const enCompas = n % 8;
    const compas = Math.floor(n / 8);
    const acorde = ACORDES[compas % 4];
    const frase = FRASES[(compas + Math.floor(compas / 4)) % FRASES.length];

    if (enCompas === 0) colchon(t, acorde.notas, CORCHEA * 8);
    const b = BAJO[enCompas];
    if (b !== null) bajo(t, acorde.bajo + b);
    const i = frase[enCompas];
    if (i !== null) marimba(t, acorde.notas[i] + 12, enCompas % 2 ? 0.7 : 1);
    shaker(t, enCompas % 2 ? 1 : 0.5);
    // Avisar el pulso para animaciones (en cada negra)
    if (enCompas % 2 === 0) {
      const espera = Math.max(0, (t - ctx.currentTime) * 1000);
      setTimeout(() => document.dispatchEvent(new CustomEvent('sunshine:pulso')), espera);
    }
  }

  function programar() {
    // Pequeño swing: corcheas largas-cortas
    while (siguiente < ctx.currentTime + 0.15) {
      tocarPaso(paso, siguiente);
      siguiente += CORCHEA * (paso % 2 === 0 ? 1.12 : 0.88);
      paso++;
    }
  }

  async function encender() {
    if (!ctx) iniciarAudio();
    await ctx.resume();
    paso = 0;
    siguiente = ctx.currentTime + 0.08;
    maestro.gain.cancelScheduledValues(ctx.currentTime);
    maestro.gain.setValueAtTime(maestro.gain.value, ctx.currentTime);
    maestro.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.5);
    timer = setInterval(programar, 25);
    sonando = true;
    avisar();
  }

  function apagar() {
    if (!ctx) return;
    clearInterval(timer);
    maestro.gain.cancelScheduledValues(ctx.currentTime);
    maestro.gain.setValueAtTime(maestro.gain.value, ctx.currentTime);
    maestro.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    setTimeout(() => { if (!sonando) ctx.suspend(); }, 700);
    sonando = false;
    avisar();
  }

  function avisar() {
    document.documentElement.classList.toggle('con-musica', sonando);
    document.dispatchEvent(new CustomEvent('sunshine:musica', { detail: { sonando } }));
  }

  // Pausar si la pestaña se oculta (no molestar en segundo plano)
  document.addEventListener('visibilitychange', () => { if (document.hidden && sonando) apagar(); });

  // Campanita al agregar al carrito: solo suena si la música está encendida
  function campanita() {
    if (!sonando || !ctx) return;
    const t = ctx.currentTime + 0.01;
    marimba(t, 84, 1);         // Do agudo
    marimba(t + 0.09, 91, 0.9); // Sol agudo
  }

  window.SunShineMusica = {
    get sonando() { return sonando; },
    campanita,
    alternar() { return sonando ? apagar() : encender(); },
    encender, apagar,
  };
})();
