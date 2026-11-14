// Kendo Shiai — vue « MES YEUX » (1re personne) : lecture des ouvertures, cercle de timing, PARFAIT, PAREZ, commandes au geste en option
(() => {
'use strict';
const $ = id => document.getElementById(id);
const lerp = (a, b, t) => a + (b - a) * t, C = (v, a, b) => Math.max(a, Math.min(b, v));
const KEY = 'kendo.pov.v1';
const opt = { view: 'side', ctrl: 'buttons', help: 'auto' };
try { Object.assign(opt, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
const saveOpt = () => { try { localStorage.setItem(KEY, JSON.stringify(opt)); } catch (e) {} };

// ---------- calques ----------
const css = document.createElement('style');
css.textContent = `#pov { position: fixed; inset: 0; width: 100%; height: 100%; display: none; pointer-events: none; }
#povBtn { position: fixed; top: calc(max(8px, env(safe-area-inset-top)) + 46px); right: max(10px, env(safe-area-inset-right)); z-index: 12; border: 0; background: #ffd34d; color: #111; border-radius: 10px; padding: 6px 10px; font-size: 13px; font-weight: 800; display: none; }
#povTouch { position: fixed; inset: 0; z-index: 8; display: none; touch-action: none; }
#povLeg { position: fixed; right: max(10px, env(safe-area-inset-right)); bottom: max(10px, env(safe-area-inset-bottom)); z-index: 8; background: rgba(0,0,0,.5); border: 1px dashed rgba(255,255,255,.4); border-radius: 12px; padding: 6px 10px; font-size: 12px; font-weight: 800; color: #fff; display: none; pointer-events: none; text-align: center; line-height: 1.6; }
#povLeg2 { position: fixed; left: max(14px, env(safe-area-inset-left)); bottom: max(14px, env(safe-area-inset-bottom)); z-index: 8; background: rgba(0,0,0,.45); border: 1px solid rgba(255,255,255,.35); border-radius: 30px; padding: 10px 18px; font-size: 12px; font-weight: 800; color: #ddd; display: none; pointer-events: none; }`;
document.head.appendChild(css);
const sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
sv.id = 'pov'; sv.setAttribute('viewBox', '0 0 1280 720'); sv.setAttribute('preserveAspectRatio', 'xMidYMid slice');
sv.innerHTML = `<defs>
 <linearGradient id="pvwall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5e4127"/><stop offset="1" stop-color="#8d6840"/></linearGradient>
 <linearGradient id="pvfloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c49561"/><stop offset="1" stop-color="#7d532b"/></linearGradient>
 <linearGradient id="pvnavy" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#151b38"/><stop offset=".5" stop-color="#26305c"/><stop offset="1" stop-color="#151b38"/></linearGradient>
 <linearGradient id="pvdo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a0f0f"/><stop offset=".45" stop-color="#b3221c"/><stop offset=".6" stop-color="#d9463a"/><stop offset="1" stop-color="#5a0f0f"/></linearGradient>
 <linearGradient id="pvgrill" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b7383"/><stop offset=".5" stop-color="#d8dde6"/><stop offset="1" stop-color="#6b7383"/></linearGradient>
 <radialGradient id="pvvig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient>
 <filter id="pvsoft"><feGaussianBlur stdDeviation="1"/></filter></defs>
 <rect x="-500" y="0" width="2280" height="720" fill="#7d532b"/><rect x="-500" y="0" width="2280" height="330" fill="#5e4127"/>
 <g><rect width="1280" height="330" fill="url(#pvwall)"/> <g stroke="#3a2614" stroke-width="5" fill="#efe5cc"> <rect x="20" y="70" width="150" height="220"/><rect x="190" y="70" width="150" height="220"/> <rect x="940" y="70" width="150" height="220"/><rect x="1110" y="70" width="150" height="220"/> </g> <g stroke="#3a2614" stroke-width="2.5"> <path d="M 57 70 V 290 M 95 70 V 290 M 132 70 V 290 M 227 70 V 290 M 265 70 V 290 M 302 70 V 290 M 977 70 V 290 M 1015 70 V 290 M 1052 70 V 290 M 1147 70 V 290 M 1185 70 V 290 M 1222 70 V 290"/> <path d="M 20 125 H 340 M 20 180 H 340 M 20 235 H 340 M 940 125 H 1260 M 940 180 H 1260 M 940 235 H 1260"/> </g> <rect x="520" y="20" width="240" height="300" fill="#4a3018" stroke="#2a1a0c" stroke-width="5"/> <rect x="600" y="40" width="80" height="200" fill="#efe6cf"/> <text x="640" y="118" font-size="50" text-anchor="middle" font-family="serif" fill="#111">剣</text> <text x="640" y="185" font-size="50" text-anchor="middle" font-family="serif" fill="#111">道</text> <rect x="0" y="322" width="1280" height="10" fill="#2e1d0e"/> <path d="M 0 330 H 1280 V 720 H 0 Z" fill="url(#pvfloor)"/> <g stroke="#6b4423" stroke-opacity=".35" stroke-width="2"> <path d="M 640 330 L -900 720 M 640 330 L -500 720 M 640 330 L -150 720 M 640 330 L 160 720 M 640 330 L 420 720 M 640 330 L 860 720 M 640 330 L 1120 720 M 640 330 L 1430 720 M 640 330 L 1780 720 M 640 330 L 2180 720"/> </g> <g stroke="#fff" stroke-opacity=".85" fill="none"> <path d="M 130 372 L 1150 372" stroke-width="4"/> <path d="M 130 372 L -120 720" stroke-width="7"/><path d="M 1150 372 L 1400 720" stroke-width="7"/> <path d="M 600 470 L 680 470" stroke-width="5"/> </g></g><g class="j"></g><g class="o"></g><g class="m"></g>
 <g opacity=".14" stroke="#cfd5df" fill="none"><path d="M 640 0 V 720" stroke-width="10"/><path d="M -400 70 Q 640 30 1680 70" stroke-width="9"/><path d="M -400 175 Q 640 140 1680 175" stroke-width="9"/><path d="M -400 285 Q 640 255 1680 285" stroke-width="9"/><path d="M -400 400 Q 640 375 1680 400" stroke-width="9"/><path d="M -400 520 Q 640 500 1680 520" stroke-width="9"/></g>
 <rect x="-500" width="2280" height="720" fill="url(#pvvig)"/><rect class="fl" x="-500" width="2280" height="720" fill="#fff" opacity="0"/><g class="fx"></g>`;
$('s').after(sv);
const gJ = sv.querySelector('.j'), gO = sv.querySelector('.o'), gM = sv.querySelector('.m'), gFx = sv.querySelector('.fx'), gFl = sv.querySelector('.fl');
const btn = document.createElement('button'); btn.id = 'povBtn'; document.body.appendChild(btn);
const touch = document.createElement('div'); touch.id = 'povTouch'; document.body.appendChild(touch);
const leg = document.createElement('div'); leg.id = 'povLeg'; leg.innerHTML = '↑ MEN &nbsp; ↘ KOTE &nbsp; ↔ DŌ<br>• toucher : TSUKI &nbsp; ↓ maintenu : GARDE<br>appui long : SEME'; document.body.appendChild(leg);
const leg2 = document.createElement('div'); leg2.id = 'povLeg2'; leg2.textContent = '◀ glisser le pouce : reculer / avancer ▶'; document.body.appendChild(leg2);
const label = () => opt.view === 'pov' ? '👁 Mes yeux ⇄' : '👁 De côté ⇄';
btn.onclick = () => { opt.view = opt.view === 'pov' ? 'side' : 'pov'; saveOpt(); };

// ---------- quand afficher la vue ----------
const mode = () => (window.hooks && hooks.mode) || 'free';
const POVMODES = ['free', 'match', 'jitsugi', 'lesson'];
function fighting() { return ['fight', 'zanshin', 'pause', 'reiho'].includes(game.state) && $('hub').style.display === 'none' && $('menu').style.display === 'none' && POVMODES.includes(mode()); }
const grade = () => (window.academy && academy.prof) ? academy.prof.g : 0;
function helpLevel() { if (opt.help === 'on') return 2; if (opt.help === 'off') return 0; const g = grade(); return g < 6 ? 2 : g < 8 ? 1 : 0; }

// ---------- dessin ----------
const OPP = (kj, doFill) => `<path d="M 560 400 L 720 400 L 770 560 L 655 562 L 640 470 L 625 562 L 510 560 Z" fill="#1b2346" stroke="#0b0e20" stroke-width="2"/> <path d="M 585 410 L 560 556 M 610 410 L 600 558 M 670 410 L 680 558 M 695 410 L 720 556" stroke="#0b0e20" stroke-width="2" opacity=".7"/> <path d="M 540 560 Q 560 552 590 560 L 590 566 L 540 566 Z" fill="#d8a57c"/><path d="M 690 560 Q 720 552 740 560 L 740 566 L 690 566 Z" fill="#d8a57c"/> <path d="M 572 372 L 708 372 L 712 408 L 568 408 Z" fill="#1d2549" stroke="#0b0e20" stroke-width="2"/> <rect x="580" y="405" width="36" height="52" rx="5" fill="#222a52" stroke="#0b0e20" stroke-width="2"/> <rect x="621" y="405" width="38" height="56" rx="5" fill="#222a52" stroke="#0b0e20" stroke-width="2"/> <rect x="664" y="405" width="36" height="52" rx="5" fill="#222a52" stroke="#0b0e20" stroke-width="2"/> <rect x="625" y="380" width="30" height="58" fill="#1a1f3c" stroke="#e8e2d0" stroke-width="2"/> <text x="640" y="402" font-size="15" text-anchor="middle" fill="#f3efe4" font-family="serif" font-weight="bold">${kj}</text>  <path d="M 560 268 Q 640 252 720 268 L 728 340 L 552 340 Z" fill="url(#pvnavy)"/> <path d="M 578 290 Q 640 272 702 290 L 712 362 Q 640 384 568 362 Z" fill="${doFill}" stroke="#2a0606" stroke-width="2.5"/> <path d="M 578 290 Q 640 272 702 290 L 700 318 Q 640 302 580 318 Z" fill="#5a3a24" stroke="#2a1a0e" stroke-width="2"/> <path d="M 590 300 Q 640 288 690 300 M 592 309 Q 640 296 688 309" stroke="#c9a25a" stroke-width="1.3" fill="none"/> <path d="M 610 330 Q 640 324 668 330" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none"/> <path d="M 716 282 q 18 16 12 40" stroke="#e53935" stroke-width="5" fill="none"/> <path d="M 568 222 Q 560 262 548 286 L 600 292 L 640 262 L 680 292 L 732 286 Q 720 262 712 222 Z" fill="#1d2346" stroke="#0b0e20" stroke-width="2"/> <path d="M 556 250 L 602 260 M 552 268 L 600 276 M 724 250 L 678 260 M 728 268 L 680 276" stroke="#3a4380" stroke-width="2"/> <rect x="594" y="150" width="92" height="110" rx="38" fill="#1d2346" stroke="#0b0e20" stroke-width="2"/> <path d="M 606 166 Q 640 152 674 166 L 676 246 Q 640 258 604 246 Z" fill="#0d1022"/> <ellipse cx="640" cy="206" rx="22" ry="26" fill="#c99b74" opacity=".55"/> <g stroke="url(#pvgrill)" stroke-width="3.2" fill="none"> <path d="M 640 158 V 252"/> <path d="M 608 172 Q 640 166 672 172"/><path d="M 606 184 Q 640 178 674 184"/><path d="M 605 196 Q 640 190 675 196"/><path d="M 605 208 Q 640 202 675 208"/><path d="M 605 220 Q 640 214 675 220"/><path d="M 606 232 Q 640 226 674 232"/><path d="M 608 244 Q 640 238 672 244"/> </g> <rect x="618" y="246" width="44" height="16" rx="4" fill="#5a3a24"/> <path d="M 686 172 Q 712 180 720 220 M 686 180 Q 706 196 708 232" stroke="#6b5fb8" stroke-width="4" fill="none"/>`;
function judges() {
  const one = (x, y, sc, r) => { const w = r.white.v, rd = r.red.v;
    const aw = lerp(80, -45, w) * Math.PI / 180, ar = lerp(100, 225, rd) * Math.PI / 180;
    const arm = (a, side, c) => { const sx = side * 16, px = sx + Math.cos(a) * 50, py = -104 + Math.sin(a) * 50, fx = px + Math.cos(a) * 26, fy = py + Math.sin(a) * 26;
      return `<path d="M ${sx} -104 L ${px} ${py}" stroke="#1b2235" stroke-width="11" stroke-linecap="round"/><line x1="${px}" y1="${py}" x2="${fx}" y2="${fy}" stroke="#6b4423" stroke-width="3"/><rect x="${fx - 9}" y="${fy - 8}" width="18" height="15" fill="${c}" stroke="#0004"/>`; };
    return `<g transform="translate(${x},${y}) scale(${sc})"><rect x="-16" y="-58" width="12" height="58" fill="#7d8090"/><rect x="4" y="-58" width="12" height="58" fill="#7d8090"/><rect x="-20" y="-112" width="40" height="58" rx="6" fill="#1b2235"/><path d="M -6 -112 L 0 -90 L 6 -112 Z" fill="#fff"/>${arm(ar, -1, '#d8262e')}${arm(aw, 1, '#f4f4f4')}<circle cy="-124" r="14" fill="#e0b48b"/><path d="M -14 -126 Q 0 -142 14 -126 Q 0 -134 -14 -126 Z" fill="#2a2018"/></g>`; };
  return one(200, 400, .8, refs[0]) + one(640, 362, .62, refs[1]) + one(1080, 400, .8, refs[2]);
}
function kote(x, y) { return `<g transform="translate(${x},${y})"><rect x="-22" y="-20" width="44" height="40" rx="15" fill="#1d2346" stroke="#0b0e20" stroke-width="2"/><rect x="-16" y="4" width="32" height="12" rx="5" fill="#7a4e2c"/></g>`; }
function shinai(x1, y1, x2, y2, w1, w2) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const p = (t, w) => [x1 + dx * t + nx * w / 2, y1 + dy * t + ny * w / 2], q = (t, w) => [x1 + dx * t - nx * w / 2, y1 + dy * t - ny * w / 2];
  const a = p(0, w1), b = p(.95, w2), c = q(.95, w2), d = q(0, w1), e = p(1, w2 * 1.1), f = q(1, w2 * 1.1), nk = [x1 + dx * .75, y1 + dy * .75], tw = lerp(w1, w2, .75);
  return `<path d="M ${a} L ${b} L ${c} L ${d} Z" fill="#e3c77f" stroke="#8a6d34" stroke-width="1.5"/><path d="M ${x1 + nx * w1 * .3} ${y1 + ny * w1 * .3} L ${x2 + nx * w2 * .3} ${y2 + ny * w2 * .3}" stroke="#3b2a1a" stroke-width="${Math.max(1, w2 * .25)}"/><path d="M ${b} L ${e} L ${f} L ${c} Z" fill="#f6f2e8" stroke="#c9c2b0"/><line x1="${nk[0] + nx * tw * .6}" y1="${nk[1] + ny * tw * .6}" x2="${nk[0] - nx * tw * .6}" y2="${nk[1] - ny * tw * .6}" stroke="#efe9d8" stroke-width="${Math.max(3, tw * .5)}"/>`;
}
let S = { s: .8, fy: 560 };
const O = (x, y) => [640 + (x - 640) * S.s, S.fy + (y - 560) * S.s];
const strikeT = f => { const a = f.action; return a && a.kind === 'strike' ? a : null; };
function phases(t) { return { r: t < .16 ? t / .16 : t < .3 ? 1 - (t - .16) / .14 : 0, h: t < .16 ? 0 : t < .3 ? (t - .16) / .14 : t < .62 ? 1 : C(1 - (t - .62) / .33, 0, 1) }; }
let glow = {}, fx = { perfT: 9, flashT: 9, parez: 0 }, kzEl = null;
function compute() {
  const dist = Math.max(120, ai.x - player.x);
  S.s = C(296 / dist, .3, 1.7); S.fy = 330 + 230 * S.s / .78;
  // ouvertures (lecture de l'adversaire)
  glow = {};
  const as = strikeT(ai);
  if (ai.openT > 0) glow.men = { ring: C(ai.openT / .7, 0, 1) };
  if (as && !as.opts && as.t < .2) { glow.kote = { ring: 1 - as.t / .2 }; glow.men = { ring: 1 - as.t / .2 }; if (as.type === 'men') glow.do = { ring: 1 - as.t / .2 }; }
  if (!as && ai.guardT > .5) glow.do = { ring: 0, still: true };
  if (!kzEl) kzEl = [...ai.v.root.children].find(g => g.innerHTML && g.innerHTML.includes('#ff4d4d'));
  const kz = kzEl ? +kzEl.getAttribute('opacity') : 0;
  if (kz > .05 && !as) glow.kote = { ring: kz, kz: true };
  return { as, kz };
}
function drawOpp(as, kz) {
  const p = ai.pose, up = C((-p.y - 188) / 150, 0, 1) + (kz > .05 ? .2 * kz : 0), H = [lerp(636, 640, up), lerp(362, 120, up)];
  const kj = ($('nA') && window.academy) ? (ai.v.root.querySelector('text') || {}).textContent || '赤' : '赤';
  let o = `<g transform="translate(${O(640, 560)[0]},${S.fy}) scale(${S.s}) translate(-640,-560)">${OPP(kj, 'url(#pvdo)')}`;
  o += `<path d="M 572 280 Q ${lerp(548, 560, up)} ${lerp(320, 200, up)} ${H[0] - 26} ${H[1]}" stroke="#1a2148" stroke-width="30" stroke-linecap="round" fill="none"/><path d="M 708 280 Q ${lerp(732, 720, up)} ${lerp(320, 200, up)} ${H[0] + 22} ${H[1] + 8}" stroke="#1a2148" stroke-width="30" stroke-linecap="round" fill="none"/>`;
  let oS = 0; if (as && as.t >= .16) oS = as.t < .3 ? (as.t - .16) / .14 : C(1 - (as.t - .3) / .3, 0, 1);
  if (oS < .05) { const tip = [lerp(610, 640, up), lerp(300, -60, up)], ts = [lerp(632, 638, up), lerp(338, 80, up)];
    o += `<line x1="${H[0]}" y1="${H[1]}" x2="${ts[0]}" y2="${ts[1]}" stroke="#f1ead6" stroke-width="12" stroke-linecap="round"/>` + shinai(ts[0], ts[1], tip[0], tip[1], lerp(16, 12, up), lerp(19, 8, up)); }
  o += kote(H[0] - 26, H[1] - 6) + kote(H[0] + 22, H[1] + 8);
  const hl = helpLevel();
  if (hl) { const gl = (k, x, y, r, c) => { const g = glow[k]; if (!g) return ''; return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}${hl > 1 ? '33' : '1a'}" stroke="${c}" stroke-width="${hl > 1 ? 5 : 3}"/>` + (hl > 1 && !g.still ? `<circle cx="${x}" cy="${y}" r="${r * (1 + g.ring * 1.6)}" fill="none" stroke="#fff" stroke-width="4" opacity=".9"/>` : ''); };
    o += gl('men', 640, 195, 58, '#ffd34d') + gl('do', 700, 345, 52, '#4aa8e0') + gl('kote', H[0] + 40, H[1] + 8, 40, '#e0a840'); }
  o += '</g>';
  if (oS >= .05) { const h = O(H[0], H[1]); o += shinai(h[0], h[1], lerp(h[0], 640, oS), lerp(h[1] - 120, 120, oS), 14 * S.s, lerp(10, 60, oS)); }
  return o;
}
function drawMe(now) {
  const ps = strikeT(player), sh = ps && ps.t >= .16 && ps.t < .34 ? Math.sin(now / 11) * 12 : 0;
  let base = [662, 642 + sh];
  const throat = O(640, 280);
  let tip = [throat[0] - 14, throat[1] + 30];
  const semeA = player.action && player.action.kind === 'seme' ? Math.sin(Math.min(1, player.action.t / .45) * Math.PI) : 0;
  tip = [lerp(tip[0], throat[0], semeA), lerp(tip[1], throat[1], semeA)];
  if (ps) {
    const { r, h } = phases(ps.t), ty = ps.type;
    const tgt = ty === 'men' ? O(640, 170) : ty === 'kote' ? O(676, 372) : ty === 'do' ? O(720, 350) : O(640, 275);
    if (ty === 'do') { tip = [lerp(tip[0], 1100, r), lerp(tip[1], -150, r)]; base = [lerp(base[0], 780, r), lerp(base[1], 600, r)]; if (h > 0) { tip = [lerp(tip[0], Math.min(tgt[0], 260), h), lerp(tip[1], tgt[1] + 60, h)]; base = [lerp(base[0], 960, h), lerp(base[1], 610, h)]; } }
    else if (ty === 'tsuki') { tip = [lerp(tip[0], tgt[0], h), lerp(tip[1], tgt[1], h)]; base = [base[0], base[1] - 40 * h]; }
    else { tip = [lerp(tip[0], 660, r), lerp(tip[1], -500, r)]; base = [lerp(base[0], 680, r), lerp(base[1], 560, r)]; if (h > 0) { tip = [lerp(tip[0], tgt[0], h), lerp(tip[1], tgt[1] - 8, h)]; base = [lerp(base[0], 650, h), lerp(base[1], 600, h)]; } }
  }
  const g = player.guardT || 0;
  if (g > 0 && !ps) { base = [lerp(base[0], 820, g), lerp(base[1], 250, g)]; tip = [lerp(tip[0], 260, g), lerp(tip[1], 160, g)]; }
  const tb = player.tsubaT || 0;
  if (tb > 0 && !ps) { tip = [lerp(tip[0], 560, tb), lerp(tip[1], 120, tb)]; base = [lerp(base[0], 700, tb), lerp(base[1], 520, tb)]; }
  const dx = tip[0] - base[0], dy = tip[1] - base[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, tsuka = [base[0] - ux * 130, base[1] - uy * 130];
  let o = `<line x1="${tsuka[0]}" y1="${tsuka[1]}" x2="${base[0]}" y2="${base[1]}" stroke="#f1ead6" stroke-width="46" stroke-linecap="round"/>` + shinai(base[0], base[1], tip[0], tip[1], 32, 10);
  o += `<ellipse cx="${base[0]}" cy="${base[1]}" rx="66" ry="20" fill="#111" stroke="#333" stroke-width="2" transform="rotate(${Math.atan2(dy, dx) * 180 / Math.PI + 90} ${base[0]} ${base[1]})"/>`;
  const glove = (x, y, s, c) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M -60 40 Q -70 -10 -40 -38 Q 0 -60 46 -40 Q 74 -10 62 44 Z" fill="${c}" stroke="#0b0e20" stroke-width="3"/><path d="M -40 -38 Q 0 -60 46 -40 L 40 -18 Q 0 -32 -34 -16 Z" fill="#2a3463"/><path d="M -30 30 Q 0 20 32 30 L 30 48 L -28 48 Z" fill="#7a4e2c"/></g>`;
  o += glove(tsuka[0] + 6, tsuka[1] + 20, 1.15, '#1a2044') + glove(base[0] - ux * 18 + 14, base[1] - uy * 18 + 30, 1, '#1d2346');
  return o;
}
function drawFx(as, kz) {
  let o = '';
  const hl = helpLevel();
  // distance
  const dist = ai.x - player.x, ok = dist >= IDEAL - 110 && dist <= IDEAL + 120, pos = C(36 + (900 - dist) / 650 * 232, 36, 268);
  o += `<g transform="translate(0,0)"><rect x="20" y="300" width="260" height="56" rx="10" fill="#000" opacity=".55"/><rect x="34" y="314" width="232" height="8" rx="4" fill="#ffffff33"/><rect x="${36 + (900 - IDEAL - 120) / 650 * 232}" y="314" width="${230 / 650 * 232}" height="8" rx="4" fill="#7ddc7d"/><circle cx="${pos}" cy="318" r="8" fill="#fff" stroke="#111" stroke-width="2"/><text x="150" y="344" font-size="13" font-weight="800" fill="${ok ? '#7ddc7d' : '#ffb3a0'}" text-anchor="middle" font-family="sans-serif">${ok ? 'ISSOKU-ITTŌ : à distance' : dist > IDEAL ? 'Trop loin' : 'Trop près'}</text></g>`;
  if (kz > .05) o += `<g><rect x="20" y="252" width="260" height="38" rx="10" fill="#000" opacity=".7"/><text x="150" y="277" font-size="14" font-weight="800" fill="#ffd34d" text-anchor="middle" font-family="sans-serif">⚡ Kizashi : il va attaquer !</text></g>`;
  if (hl && as && !as.opts && as.t < .24 && (as.type === 'men' || as.type === 'kote') && !player.guarding) o += `<g><rect x="540" y="480" width="200" height="90" rx="20" fill="#e5393533" stroke="#e53935" stroke-width="6"/><text x="640" y="540" font-size="38" font-weight="900" fill="#fff" text-anchor="middle" stroke="#b71c1c" stroke-width="6" paint-order="stroke" font-family="sans-serif">PAREZ !</text></g>`;
  if (fx.perfT < 1) o += `<text x="640" y="330" text-anchor="middle" font-size="44" font-weight="900" fill="#7ddc7d" stroke="#000" stroke-width="6" paint-order="stroke" font-family="sans-serif" opacity="${1 - fx.perfT}">PARFAIT !</text>`;
  return o;
}
// ---------- PARFAIT : frappe dans le cercle = meilleur ki-ken-tai-ichi ----------
const _strike = player.strike.bind(player);
player.strike = function (type, opts) {
  const before = glow[type], r = _strike(type, opts);
  if (r && !opts && active && before && !before.still && before.ring < .55 && this.action) this.action.perfect = true;
  return r;
};
const _res = game.resolveHit.bind(game);
game.resolveHit = function (att, a) {
  if (att === player && a.perfect) att.kiai = Math.min(100, att.kiai + 40);
  _res(att, a);
  if (att === player && a.perfect && game.state === 'zanshin') fx.perfT = 0;
  if (att === player && game.state === 'zanshin') fx.flashT = 0;
};

// ---------- commandes au geste (option A) ----------
let gL = null, gR = null;
const rel = k => press(k, false);
touch.addEventListener('pointerdown', e => {
  e.preventDefault(); const right = e.clientX > innerWidth * .45;
  if (!right) { gL = { id: e.pointerId, x: e.clientX }; return; }
  gR = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), used: false, guard: false };
  const me = gR; setTimeout(() => { if (gR === me && !me.used && !me.guard && Math.hypot(me.dx || 0, me.dy || 0) < 15) { me.used = true; press('seme', true); press('seme', false); } }, 450);
});
touch.addEventListener('pointermove', e => {
  if (gL && e.pointerId === gL.id) { const dx = e.clientX - gL.x; press('fwd', dx > 22); press('back', dx < -22); if (dx <= 22) rel('fwd'); if (dx >= -22) rel('back'); return; }
  if (gR && e.pointerId === gR.id) { gR.dx = e.clientX - gR.x; gR.dy = e.clientY - gR.y;
    if (!gR.used && !gR.guard && gR.dy > 50 && Math.abs(gR.dy) > Math.abs(gR.dx) * 1.3) { gR.guard = true; press('guard', true); } }
});
const up = e => {
  if (gL && e.pointerId === gL.id) { rel('fwd'); rel('back'); gL = null; return; }
  if (!gR || e.pointerId !== gR.id) return;
  const g = gR; gR = null;
  if (g.guard) { press('guard', false); return; }
  if (g.used) return;
  const dx = g.dx || 0, dy = g.dy || 0, d = Math.hypot(dx, dy);
  let k;
  if (d < 22) k = 'tsuki';
  else if (dy < 0 && Math.abs(dy) > Math.abs(dx)) k = 'men';
  else if (Math.abs(dx) > Math.abs(dy) * 1.6) k = 'do';
  else k = 'kote';
  press(k, true); press(k, false);
};
touch.addEventListener('pointerup', up); touch.addEventListener('pointercancel', up);

// ---------- boucle ----------
let active = false, wasZ = false;
function loop(now) {
  const on = opt.view === 'pov' && fighting();
  const showBtn = fighting() || (game.state === 'replay' && POVMODES.includes(mode()));
  btn.style.display = showBtn ? 'block' : 'none'; btn.textContent = label();
  if (on !== active) {
    active = on; sv.style.display = on ? 'block' : 'none';
  }
  const gest = on && opt.ctrl === 'gestures' && mode() !== 'lesson';
  touch.style.display = gest ? 'block' : 'none'; leg.style.display = leg2.style.display = gest ? 'block' : 'none';
  for (const id of ['move', 'attack']) { const e = $(id); if (e) e.style.visibility = gest ? 'hidden' : ''; }
  if (on) {
    const { as, kz } = compute();
    gJ.innerHTML = judges(); gO.innerHTML = drawOpp(as, kz); gM.innerHTML = drawMe(now); gFx.innerHTML = drawFx(as, kz);
    fx.perfT += 1 / 60; fx.flashT += 1 / 60;
    gFl.setAttribute('opacity', fx.flashT < .25 ? .45 * (1 - fx.flashT / .25) : 0);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- réglages (dans « Mon kendoka ») ----------
function panel() {
  const card = document.querySelector('#hub .card'); if (!card || $('povOpts')) return;
  const d = document.createElement('div'); d.id = 'povOpts';
  const row = (k, lab, vals) => `<div class="opt"><span>${lab}</span>${vals.map(([v, t]) => `<button class="hb sm${opt[k] === v ? ' sel' : ''}" data-pk="${k}" data-v="${v}">${t}</button>`).join('')}</div>`;
  d.innerHTML = row('view', '👁 Vue de combat', [['side', 'De côté'], ['pov', 'Mes yeux']]) + row('ctrl', '✋ Commandes (vue Mes yeux)', [['buttons', 'Boutons'], ['gestures', 'Gestes']]) + row('help', '🎯 Aides de lecture', [['auto', 'Selon le grade'], ['on', 'Toujours'], ['off', 'Jamais']]);
  card.insertBefore(d, card.querySelector('.row2'));
  d.querySelectorAll('[data-pk]').forEach(b => b.onclick = () => { opt[b.dataset.pk] = b.dataset.v; saveOpt(); d.remove(); panel(); });
}
new MutationObserver(() => { const h = document.querySelector('#hub h2'); if (h && h.textContent.includes('Personnaliser')) panel(); }).observe($('hub'), { childList: true, subtree: true });
window.pov = { opt };
})();
