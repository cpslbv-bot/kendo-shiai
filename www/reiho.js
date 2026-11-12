// Kendo Shiai — reihō des combats : sagetō, ritsurei, taitō, 3 pas et dégainer au 3e pas, sonkyo ; fin : sonkyo, osame-tō, 5 pas, rei.
// Rei vers le shōmen à l'ouverture et à la clôture d'une compétition.
(() => {
'use strict';
const $ = id => document.getElementById(id);
const lerp = (a, b, t) => a + (b - a) * t, C = (v, a, b) => Math.max(a, Math.min(b, v)), D2R = Math.PI / 180;
const ez = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const KEY = 'kendo.reiho.v1';
const opt = { on: true };
try { Object.assign(opt, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
const saveOpt = () => { try { localStorage.setItem(KEY, JSON.stringify(opt)); } catch (e) {} };

// ---------- shinai au fourreau (taitō) ou le long du corps (sagetō), et quart de tour vers le shōmen ----------
const CARRY = { sageto: { lx: 6, ly: -146, a: 34, rx: 18, ry: -140 }, taito: { lx: 24, ly: -186, a: 165, rx: 18, ry: -140 } };
const _draw = Fighter.prototype.draw;
Fighter.prototype.draw = function (now) {
  _draw.call(this, now);
  const v = this.v;
  if (this.turnK) v.root.setAttribute('transform', `translate(${this.x},${GROUND}) scale(${Math.max(.2, Math.cos(this.turnK * Math.PI / 2)).toFixed(3)},1)`);
  const w = this.carryW || 0; if (w <= 0) return;
  const p = this.pose, c = this.carry || CARRY.sageto, r = p.a * D2R;
  const hx = p.x, hy = p.y, lx = hx - Math.cos(r) * 54, ly = hy - Math.sin(r) * 54;
  const R = [lerp(hx, c.rx, w), lerp(hy, c.ry, w)], L = [lerp(lx, c.lx, w), lerp(ly, c.ly, w)];
  const an = [lerp(hx, c.lx, w), lerp(hy, c.ly, w)], ang = lerp(p.a, c.a, w);
  const sh = [2, -256];
  const [ex, ey] = ik(sh[0], sh[1], R[0], R[1], 62, 66), [fx2, fy2] = ik(sh[0] - 6, sh[1] + 4, L[0], L[1], 58, 60);
  setL(v.fUpper, sh[0] - 6, sh[1] + 4, fx2, fy2); setL(v.fFore, fx2, fy2, L[0], L[1]);
  setL(v.nUpper, sh[0], sh[1], ex, ey); setL(v.nFore, ex, ey, R[0], R[1]);
  v.shinai.setAttribute('transform', `translate(${an[0]},${an[1]}) rotate(${ang})`);
  v.kR.setAttribute('transform', `translate(${R[0]},${R[1]}) rotate(${lerp(p.a, 90, w)})`);
  v.kL.setAttribute('transform', `translate(${L[0]},${L[1]}) rotate(${ang})`);
  v.trail.setAttribute('opacity', 0);
};

// ---------- légende ----------
const css = document.createElement('style');
css.textContent = `#rhCap { position: fixed; top: calc(max(8px, env(safe-area-inset-top)) + 44px); left: 50%; transform: translateX(-50%); z-index: 11; max-width: min(680px, 88vw); background: rgba(0,0,0,.72); border-left: 4px solid #ffd34d; border-radius: 8px; padding: 7px 14px; font-size: 14.5px; font-weight: 700; display: none; text-align: center; color: #fff; }
#rhSkip { position: fixed; bottom: max(10px, env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%); z-index: 12; border: 1px solid #ffd34d; background: rgba(0,0,0,.6); color: #ffd34d; border-radius: 10px; padding: 7px 14px; font-size: 13px; font-weight: 800; display: none; }`;
document.head.appendChild(css);
const cap = document.createElement('div'); cap.id = 'rhCap'; document.body.appendChild(cap);
const skip = document.createElement('button'); skip.id = 'rhSkip'; skip.textContent = 'Passer le salut ⏭'; document.body.appendChild(skip);

// ---------- moteur de séquence ----------
let seq = null;
const FIGS = () => ({ P: player, A: ai });
function snapOf(f) { return { x: f.x, bow: f.bow || 0, crouch: f.crouch || 0, turnK: f.turnK || 0, carryW: f.carryW || 0, cl: { ...(f.carry || CARRY.sageto) } }; }
function play(steps, onEnd) {
  seq = { steps, i: -1, t: 0, onEnd, from: null };
  next();
}
function next() {
  const s = seq; s.i++; s.t = 0;
  const st = s.steps[s.i];
  if (!st) { const cb = s.onEnd; seq = null; cap.style.display = 'none'; skip.style.display = 'none'; if (cb) cb(); return; }
  s.from = { P: snapOf(player), A: snapOf(ai) };
  if (st.cap !== undefined) { cap.textContent = st.cap; cap.style.display = st.cap ? 'block' : 'none'; }
  if (st.msg) showMsg(st.msg[0], st.msg[1] || '', st.msg[2] || 1.6);
  if (st.fn) st.fn();
}
function apply(f, from, to, u) {
  if (!to) return;
  if (to.x !== undefined) f.x = lerp(from.x, to.x, u);
  if (to.bow !== undefined) f.bow = lerp(from.bow, to.bow, u);
  if (to.crouch !== undefined) f.crouch = lerp(from.crouch, to.crouch, u);
  if (to.turnK !== undefined) f.turnK = lerp(from.turnK, to.turnK, u);
  if (to.carryW !== undefined) f.carryW = lerp(from.carryW, to.carryW, u);
  if (to.carry) { const c = CARRY[to.carry]; f.carry = { lx: lerp(from.cl.lx, c.lx, u), ly: lerp(from.cl.ly, c.ly, u), a: lerp(from.cl.a, c.a, u), rx: lerp(from.cl.rx, c.rx, u), ry: lerp(from.cl.ry, c.ry, u) }; }
  if (to.step) f.crouch = (to.crouch !== undefined ? f.crouch : 0) + Math.abs(Math.sin(u * Math.PI * to.step)) * 7;
}
let lastT = performance.now();
function tick(now) {
  const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
  if (pending && now - pending > 30) { pending = 0; decideOpening(); }
  if (seq) {
    const st = seq.steps[seq.i]; seq.t += dt;
    const u = st.d ? ez(C(seq.t / st.d, 0, 1)) : 1;
    apply(player, seq.from.P, st.P, u); apply(ai, seq.from.A, st.A, u);
    if (game.state !== 'reiho' && !st.free) { seq = null; cap.style.display = 'none'; skip.style.display = 'none'; reset(); }
    else if (seq.t >= (st.d || 0)) next();
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
function reset() { for (const f of [player, ai]) { f.bow = 0; f.crouch = 0; f.turnK = 0; f.carryW = 0; } }

// ---------- quels combats ? ----------
const mode = () => (window.hooks && hooks.mode) || null;
function qualifies() {
  const m = mode(); if (!opt.on || !(m === 'free' || m === 'match' || m === 'jitsugi')) return false;
  const b = $('badge'); if (b && b.style.display !== 'none' && /ENCHO/.test(b.textContent)) return false;
  return true;
}
let pending = 0, shomenNext = false, shomenClose = false;
const _start = game.start.bind(game);
game.start = function () { seq = null; reset(); _start(); pending = performance.now(); };

const P0 = 500, A0 = 1100, PB = 270, AB = 1330;
function opening(shomen) {
  const steps = [];
  steps.push({ d: .1, P: { x: PB, carryW: 1, carry: 'sageto', bow: 0, crouch: 0 }, A: { x: AB, carryW: 1, carry: 'sageto', bow: 0, crouch: 0 }, cap: 'Les deux combattants à la limite du terrain, shinai en main gauche : sagetō' });
  steps.push({ d: 1.2 });
  if (shomen) {
    steps.push({ d: .7, P: { turnK: .75 }, A: { turnK: .75 }, cap: 'Ouverture de la compétition : rei vers le shōmen' });
    steps.push({ d: .9, P: { bow: 30 }, A: { bow: 30 } }, { d: .4 }, { d: .9, P: { bow: 0 }, A: { bow: 0 } }, { d: .6, P: { turnK: 0 }, A: { turnK: 0 } });
  }
  steps.push({ d: .8, P: { bow: 15 }, A: { bow: 15 }, cap: 'Ritsurei (15°), en se regardant dans les yeux' }, { d: .3 }, { d: .8, P: { bow: 0 }, A: { bow: 0 } });
  steps.push({ d: .9, P: { carry: 'taito' }, A: { carry: 'taito' }, cap: 'Taitō : le shinai à la hanche gauche, « au fourreau », pouce sur la tsuba' }, { d: .5 });
  const st = (P, A) => ({ d: .55, P: { x: P, step: 1 }, A: { x: A, step: 1 } });
  steps.push({ ...st(PB + 77, AB - 77), cap: 'Trois grands pas vers la ligne de départ, pied droit d\'abord' }, st(PB + 154, AB - 154), st(P0, A0));
  steps.push({ d: 1.2, P: { carryW: 0, crouch: 42 }, A: { carryW: 0, crouch: 42 }, cap: 'Au 3e pas : on dégaine et on descend en sonkyo' }, { d: .6 });
  steps.push({ d: .3, msg: ['HAJIME !', 'Début du combat', 1.4], cap: '' }, { d: .7, P: { crouch: 0 }, A: { crouch: 0 } });
  return steps;
}
function decideOpening() {
  if (!qualifies() || game.state === 'over') return;
  const m = mode();
  const shomen = m === 'free' || (m === 'match' && shomenNext);
  if (m === 'match') shomenNext = false;
  shomenClose = m === 'free';
  showMsg('', '');
  game.state = 'reiho'; game.next = null;
  skip.style.display = 'block';
  play(opening(shomen), () => { if (game.state !== 'reiho') return; reset(); player.x = P0; ai.x = A0; game.state = 'pause'; game.pauseT = .4; game.next = 'fight'; });
}
skip.onclick = () => {
  if (!seq) return; const cb = seq.onEnd; seq = null; cap.style.display = 'none'; skip.style.display = 'none';
  reset(); if (closing) { player.x = PB; ai.x = AB; }
  if (cb) cb();
};

// ---------- fin du match ----------
let closing = false;
const _finish = game.finish.bind(game);
game.finish = function () {
  if (closing || !qualifies()) return _finish();
  const s = this.score.s.length, a = this.score.a.length;
  closing = true; this.state = 'reiho'; skip.style.display = 'block';
  const steps = [];
  steps.push({ d: 1.1, P: { x: P0 }, A: { x: A0 }, cap: 'Retour aux lignes de départ' });
  steps.push({ d: 1.8, msg: [s === a ? 'HIKIWAKE' : 'SHŌBU ARI !', s === a ? 'Match nul' : s > a ? 'Vous gagnez' : 'Votre adversaire gagne', 1.8], cap: '', fn: () => { const r = refs[1]; if (s > a) r.white.goal = 1; else if (a > s) r.red.goal = 1; else crossFlags(); } });
  steps.push({ d: .3, fn: flagsDown });
  steps.push({ d: 1.1, P: { crouch: 42 }, A: { crouch: 42 }, cap: 'Sonkyo' });
  steps.push({ d: 1, P: { carryW: 1, carry: 'taito' }, A: { carryW: 1, carry: 'taito' }, cap: 'Osame-tō : le shinai revient au fourreau, à la hanche' }, { d: .3 });
  steps.push({ d: .8, P: { crouch: 0 }, A: { crouch: 0 }, cap: 'On se relève, shinai en taitō' });
  const sp = (k) => ({ d: .42, P: { x: lerp(P0, PB, k / 5), step: 1 }, A: { x: lerp(A0, AB, k / 5), step: 1 } });
  steps.push({ ...sp(1), cap: 'Cinq petits pas en arrière jusqu\'à la limite du terrain' }, sp(2), sp(3), sp(4), sp(5));
  steps.push({ d: .8, P: { carry: 'sageto' }, A: { carry: 'sageto' }, cap: 'Sagetō : le shinai le long du corps, main gauche' });
  steps.push({ d: .8, P: { bow: 15 }, A: { bow: 15 }, cap: 'Ritsurei' }, { d: .3 }, { d: .8, P: { bow: 0 }, A: { bow: 0 } });
  if (shomenClose) steps.push({ d: .7, P: { turnK: .75 }, A: { turnK: .75 }, cap: 'Clôture : rei vers le shōmen' }, { d: .9, P: { bow: 30 }, A: { bow: 30 } }, { d: .4 }, { d: .9, P: { bow: 0 }, A: { bow: 0 } }, { d: .6, P: { turnK: 0 }, A: { turnK: 0 } });
  steps.push({ d: .4, cap: '' });
  play(steps, () => { closing = false; reset(); game.state = 'pause'; _finish.call(game); });
};

// ---------- cérémonie de clôture d'un tournoi ----------
function ceremony(then) {
  if (!opt.on || !window.academy) return then();
  academy.scene({ quiet: true, name: 'Shinpan', timer: false, score: false });
  window.hooks = { mode: 'ceremony', noHansoku: true, ippon: () => true, press: () => true, ai: () => { ai.vel = 0; return true; } };
  game.state = 'reiho'; player.x = PB + 120; ai.x = AB - 120; skip.style.display = 'block';
  for (const f of [player, ai]) { f.carryW = 1; f.carry = { ...CARRY.sageto }; }
  play([{ d: 1.2, cap: 'Clôture du tournoi' }, { d: .7, P: { turnK: .75 }, A: { turnK: .75 }, cap: 'Clôture de la compétition : rei vers le shōmen' }, { d: .9, P: { bow: 30 }, A: { bow: 30 } }, { d: .5 }, { d: .9, P: { bow: 0 }, A: { bow: 0 } }, { d: .6, P: { turnK: 0 }, A: { turnK: 0 } }, { d: .5, cap: '' }],
    () => { reset(); game.state = 'over'; then(); });
}

// ---------- réglage (dans « Mon kendoka ») ----------
function panel() {
  const card = document.querySelector('#hub .card'); if (!card || $('reihoOpt')) return;
  const d = document.createElement('div'); d.id = 'reihoOpt';
  d.innerHTML = `<div class="opt"><span>🙇 Reihō complet avant et après les combats</span><button class="hb sm${opt.on ? ' sel' : ''}" data-v="1">Oui</button><button class="hb sm${!opt.on ? ' sel' : ''}" data-v="0">Non</button></div>`;
  card.insertBefore(d, card.querySelector('.row2'));
  d.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { opt.on = b.dataset.v === '1'; saveOpt(); d.remove(); panel(); });
}
new MutationObserver(() => { const h = document.querySelector('#hub h2'); if (h && h.textContent.includes('Personnaliser')) panel(); }).observe($('hub'), { childList: true, subtree: true });

window.reiho = { opt, ceremony, startCompetition: () => { shomenNext = true; } };
})();
