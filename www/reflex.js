// Kendo Shiai v6.3 — jouabilité des contres : kizashi, mode réflexe, boutons contextuels, mémoire d'appui, frise, vibrations, vrais kiai
(() => {
'use strict';
const $ = id => document.getElementById(id), NS = 'http://www.w3.org/2000/svg';
const KEY = 'kendo.reflex.v1';
const opt = { reflex: 'auto', kizashi: true, haptic: true };
try { Object.assign(opt, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
const saveOpt = () => { try { localStorage.setItem(KEY, JSON.stringify(opt)); } catch (e) {} };
const mode = () => (window.hooks && hooks.mode) || 'free';
const grade = () => (window.academy ? academy.prof.g : 0);

// ---------- styles ----------
const css = document.createElement('style');
css.textContent = `
.btn { position: relative; }
.btn::before { content: ''; position: absolute; inset: -8px; border-radius: 50%; }
.btn.ctr { box-shadow: 0 0 16px #7ddc7d; }
.btn .clab { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: #ffd34d; color: #111; font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 7px; pointer-events: none; }
.btn .cring { position: absolute; inset: -8px; border-radius: 50%; pointer-events: none; background: conic-gradient(#7ddc7d calc(var(--p) * 1%), transparent 0); -webkit-mask: radial-gradient(circle, transparent 61%, #000 63%); mask: radial-gradient(circle, transparent 61%, #000 63%); }
#rfxVig { position: fixed; inset: 0; pointer-events: none; z-index: 8; box-shadow: inset 0 0 150px rgba(80,160,255,.55); opacity: 0; transition: opacity .12s; }
#rfxTag { position: fixed; top: calc(max(8px, env(safe-area-inset-top)) + 46px); left: 50%; transform: translateX(-50%); z-index: 12; background: rgba(10,30,60,.85); border: 2px solid #6bd3ff; color: #bfeaff; padding: 4px 12px; border-radius: 10px; font-weight: 800; font-size: 13px; display: none; }
#rfxBar { position: fixed; left: 50%; bottom: max(12px, env(safe-area-inset-bottom)); transform: translateX(-50%); width: min(320px, 46vw); z-index: 12; font-size: 11px; font-weight: 700; display: none; pointer-events: none; text-shadow: 0 1px 3px #000; }
#rfxBar .z { display: flex; height: 16px; border-radius: 8px; overflow: hidden; border: 2px solid #fff; margin-top: 3px; position: relative; }
#rfxBar .z div { display: flex; align-items: center; justify-content: center; font-size: 9px; color: #111; font-weight: 900; }
#rfxBar .cur { position: absolute; top: -6px; width: 4px; height: 26px; background: #fff; box-shadow: 0 0 8px #fff; transform: translateX(-2px); }
`;
document.head.appendChild(css);
const vig = document.createElement('div'); vig.id = 'rfxVig'; document.body.appendChild(vig);
const tag = document.createElement('div'); tag.id = 'rfxTag'; tag.textContent = '⏱ RÉFLEXE'; document.body.appendChild(tag);
const bar = document.createElement('div'); bar.id = 'rfxBar'; document.body.appendChild(bar);

// ---------- vibrations ----------
function buzz(ms) {
  if (!opt.haptic) return;
  const H = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Haptics;
  try { if (H) H.impact({ style: ms > 25 ? 'MEDIUM' : 'LIGHT' }); else if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
}
const _spark = window.spark;
window.spark = function (x, y, big) { _spark(x, y, big); if (game.state !== 'replay') buzz(big ? 35 : 15); };

// ---------- kizashi : le motodachi / l'adversaire annonce son attaque ----------
const tell = document.createElementNS(NS, 'g'); tell.setAttribute('opacity', 0);
tell.innerHTML = '<ellipse cx="6" cy="-300" rx="62" ry="62" fill="none" stroke="#ff4d4d" stroke-width="6"/><text x="6" y="-380" text-anchor="middle" font-size="44" font-weight="900" fill="#ff4d4d" stroke="#000" stroke-width="2">!</text>';
ai.v.root.appendChild(tell);
const _aiStrike = ai.strike.bind(ai);
let pend = null, tellT = 0;
ai.strike = function (type, opts) {
  // pas de kizashi pour les contres de l'adversaire ni pour les gestes scénarisés
  if (opts || this.action || player.striking || !opt.kizashi || game.state !== 'fight' || mode() === 'demo') return _aiStrike(type, opts);
  if (pend) return false;
  pend = { type, t: .28 }; tellT = .28; buzz(10);
  return true;
};

// ---------- mode réflexe (ralenti pendant l'attaque adverse) ----------
let rfx = 0;
function slowFactor() {
  if (opt.reflex === 'off' || mode() === 'demo') return 1;
  const g = grade(), m = mode();
  if ((m === 'match' || m === 'jitsugi') && g >= 6) return 1;
  return g <= 3 ? .45 : g <= 6 ? .6 : g <= 9 ? .75 : 1;
}
function startReflex() {
  const f = slowFactor(); if (f >= 1 || player.busy) return;
  rfx = .45; game.timeScale = f; vig.style.opacity = 1; tag.style.display = 'block';
  tag.textContent = `⏱ RÉFLEXE ×${String(f).replace('.', ',')}`;
}
function endReflex() { rfx = 0; if (mode() !== 'demo') game.timeScale = 1; vig.style.opacity = 0; tag.style.display = 'none'; }

// ---------- mémoire d'appui ----------
const _ps = player.strike.bind(player);
let buf = null;
player.strike = function (type, opts) {
  const r = _ps(type, opts);
  if (r && !opts) onPlayerStart(type);
  if (!r && !opts && game.state === 'fight' && this.action && this.action.kind === 'strike' && this.action.t > .68) buf = { type, t: .3 };
  return r;
};

// ---------- frise de timing (leçons) ----------
let barT = 0;
function onPlayerStart(type) {
  const a = ai.action, m = mode();
  if (m !== 'lesson' && m !== 'demo') return;
  let d = null;
  if (a && a.kind === 'strike' && !a.opts && a.t < .5) d = a.t; else if (pend) d = -pend.t;
  if (d == null) return;
  const pos = Math.max(0, Math.min(100, (d + .28) / .78 * 100));
  const zone = d < 0 ? 'anticipé (debana)' : d < .155 ? 'DEBANA' : d < .3 ? 'SURIAGE / NUKI' : 'trop tard';
  bar.innerHTML = `Votre réponse : <b>${zone}</b> (${d < 0 ? '−' : '+'}${Math.abs(d).toFixed(2).replace('.', ',')} s)<div class="z"><div style="flex:28;background:#6bd3ff">ANTICIPÉ</div><div style="flex:15;background:#7ddc7d">DEBANA</div><div style="flex:15;background:#ffd34d">SURIAGE/NUKI</div><div style="flex:20;background:#ff6b6b">TARD</div><span class="cur" style="left:${pos}%"></span></div>`;
  bar.style.display = 'block'; barT = 1.8;
}

// ---------- boutons contextuels ----------
const btn = k => document.querySelector(`.btn[data-k="${k}"]`);
let ctrOn = false;
function setCounters(map, p) {
  for (const k of ['men', 'kote', 'do', 'guard']) {
    const b = btn(k); if (!b) continue;
    let lab = b.querySelector('.clab'), ring = b.querySelector('.cring');
    if (map && map[k]) {
      if (!lab) { lab = document.createElement('span'); lab.className = 'clab'; b.appendChild(lab); ring = document.createElement('span'); ring.className = 'cring'; b.appendChild(ring); }
      lab.textContent = map[k]; ring.style.setProperty('--p', Math.round(p * 100)); b.classList.add('ctr');
    } else if (lab) { lab.remove(); ring.remove(); b.classList.remove('ctr'); }
  }
  ctrOn = !!map;
}

// ---------- boucle ----------
let last = performance.now(), wasStriking = false;
function loop(now) {
  const rdt = Math.min(.05, (now - last) / 1000); last = now;
  const gdt = rdt * (game.timeScale || 1);
  // kizashi
  if (pend) {
    pend.t -= gdt; tellT = Math.max(0, tellT - gdt);
    if (game.state !== 'fight') pend = null;
    else if (pend.t <= 0) { const t = pend.type; pend = null; if (!ai.busy) _aiStrike(t); }
  }
  tell.setAttribute('opacity', tellT > 0 ? .5 + .5 * Math.sin(now / 40) : 0);
  // début réel d'une attaque adverse => réflexe + vibration
  const a = ai.action, striking = !!(a && a.kind === 'strike' && !a.opts);
  if (striking && !wasStriking && game.state === 'fight' && !player.busy) { startReflex(); buzz(15); }
  wasStriking = striking;
  if (rfx > 0) { rfx -= rdt; if (rfx <= 0 || game.state !== 'fight') endReflex(); }
  // boutons contextuels pendant la fenêtre de contre
  if (striking && a.t < .32 && !player.busy && game.state === 'fight') {
    const p = 1 - a.t / .32;
    const map = a.type === 'men' ? { men: a.t < .15 ? 'DEBANA-MEN' : 'SURIAGE-MEN', kote: 'DEBANA-KOTE', do: 'NUKI-DŌ', guard: 'UKE → KAESHI' }
      : a.type === 'kote' ? { men: 'KOTE-NUKI-MEN' } : null;
    setCounters(map, p);
  } else if (ctrOn) setCounters(null);
  // mémoire d'appui
  if (buf) { buf.t -= gdt; if (game.state === 'fight' && !player.busy) { const t = buf.type; buf = null; if (_ps(t)) { onPlayerStart(t); aiBrain.onPlayerStrike(t); } } else if (buf.t <= 0) buf = null; }
  // frise
  if (barT > 0) { barT -= rdt; if (barT <= 0) bar.style.display = 'none'; }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- vrais kiai (fichiers audio/kiai_*.mp3) ----------
let actx = null; const buffers = {};
function initAudio() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } loadAll(); } if (actx.state === 'suspended') actx.resume(); }
function loadAll() {
  for (const k of ['men', 'kote', 'do', 'tsuki']) fetch(`audio/kiai_${k}.mp3`).then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(b => actx.decodeAudioData(b)).then(d => { buffers[k] = d; }).catch(() => {});
}
addEventListener('pointerdown', initAudio, { capture: true });
const _kiai = sfx.kiai;
sfx.kiai = function (aka, type) {
  const vocal = !window.ambiance || ambiance.opt.kiai;
  if (buffers[type] && vocal && game.state !== 'replay' && mode() !== 'kata') {
    try {
      const s = actx.createBufferSource(); s.buffer = buffers[type];
      s.playbackRate.value = (aka ? .88 : 1.04) * (game.timeScale < 1 ? Math.max(.7, game.timeScale + .3) : 1);
      const g = actx.createGain(); g.gain.value = aka ? .8 : 1;
      s.connect(g).connect(actx.destination); s.start();
      return;
    } catch (e) {}
  }
  _kiai(aka, type);
};

// ---------- réglages (dans « Mon kendoka ») ----------
function panel() {
  const card = document.querySelector('#hub .card'); if (!card || $('rfxOpts')) return;
  const d = document.createElement('div'); d.id = 'rfxOpts';
  const row = (k, lab, vals) => `<div class="opt"><span>${lab}</span>${vals.map(([v, t]) => `<button class="hb sm${opt[k] === v ? ' sel' : ''}" data-rk="${k}" data-v="${v}">${t}</button>`).join('')}</div>`;
  d.innerHTML = row('reflex', '⏱ Mode réflexe (ralenti)', [['auto', 'Selon le grade'], ['off', 'Désactivé']])
    + row('kizashi', '❗ Signe d\'attaque (kizashi)', [[true, 'Oui'], [false, 'Non']])
    + row('haptic', '📳 Vibrations', [[true, 'Oui'], [false, 'Non']]);
  card.insertBefore(d, card.querySelector('.row2'));
  d.querySelectorAll('[data-rk]').forEach(b => b.onclick = () => { const v = b.dataset.v; opt[b.dataset.rk] = v === 'true' ? true : v === 'false' ? false : v; saveOpt(); d.remove(); panel(); });
}
new MutationObserver(() => { const h = document.querySelector('#hub h2'); if (h && h.textContent.includes('Personnaliser')) panel(); }).observe($('hub'), { childList: true, subtree: true });

window.reflex = { opt, buffers };
})();
