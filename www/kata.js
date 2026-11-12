// Kendo Shiai — Nihon Kendo Kata réalistes : bokutō, keikogi-hakama, reihō complet, kata 1 à 7 et kodachi 1 à 3
(() => {
'use strict';
const NS = 'http://www.w3.org/2000/svg', G = 600, D2R = Math.PI / 180, $ = id => document.getElementById(id);
const lerp = (a, b, t) => a + (b - a) * t, C = (v, a, b) => Math.max(a, Math.min(b, v));
const dv = a => [Math.cos(a * D2R), -Math.sin(a * D2R)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ================= INTERFACE =================
const css = document.createElement('style');
css.textContent = `
#kataOv { position: fixed; inset: 0; z-index: 10; background: #1a120b; display: none; }
#kataOv svg { position: absolute; inset: 0; width: 100%; height: 100%; }
#kataOv .kt { position: absolute; top: max(8px, env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); background: rgba(0,0,0,.65); color: #ffd34d; font-weight: 800; font-size: 15px; border-radius: 10px; padding: 5px 14px; white-space: nowrap; }
#kataOv .kc { position: absolute; top: calc(max(8px, env(safe-area-inset-top)) + 38px); left: 50%; transform: translateX(-50%); max-width: min(760px, 90vw); background: rgba(0,0,0,.72); border-left: 4px solid #ffd34d; border-radius: 8px; padding: 7px 14px; font-size: 14.5px; font-weight: 700; color: #fff; text-align: center; }
#kataOv .kq { position: absolute; left: 50%; bottom: max(8px, env(safe-area-inset-bottom)); transform: translateX(-50%); width: min(720px, 94vw); background: rgba(10,10,16,.88); border: 2px solid #ffd34d; border-radius: 14px; padding: 8px 10px; display: none; text-align: center; color: #fff; }
#kataOv .kq p { margin: 2px 0 6px; font-weight: 800; font-size: 15px; }
#kataOv .kq .ch { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 6px; }
#kataOv .kq button { border: 2px solid rgba(255,255,255,.25); background: rgba(30,30,44,.95); color: #fff; border-radius: 10px; padding: 8px; font-size: 13.5px; font-weight: 700; }
#kataOv .kq button.good { border-color: #7ddc7d; background: #1d3a1d; } #kataOv .kq button.bad { border-color: #ff6b6b; background: #3a1d1d; }
#kataOv .kq button.glow { border-color: #ffd34d; box-shadow: 0 0 12px #ffd34d; }
#kataOv .kq .fb { font-weight: 800; margin-top: 4px; }
#kataOv .kx { position: absolute; top: max(8px, env(safe-area-inset-top)); left: max(10px, env(safe-area-inset-left)); border: 1px solid rgba(255,255,255,.4); background: rgba(0,0,0,.5); color: #fff; border-radius: 10px; padding: 6px 10px; font-size: 13px; font-weight: 700; }
#kataOv .kf { position: absolute; bottom: max(8px, env(safe-area-inset-bottom)); right: max(10px, env(safe-area-inset-right)); border: 1px solid #ffd34d; background: rgba(0,0,0,.6); color: #ffd34d; border-radius: 10px; padding: 7px 12px; font-size: 13px; font-weight: 800; }
#kataOv .kf.on { background: #ffd34d; color: #111; }
#kataOv .ks { position: absolute; top: max(8px, env(safe-area-inset-top)); right: max(10px, env(safe-area-inset-right)); background: rgba(0,0,0,.6); color: #fff; border-radius: 10px; padding: 6px 12px; font-size: 13px; font-weight: 800; }
`;
document.head.appendChild(css);
const ov = document.createElement('div'); ov.id = 'kataOv';
ov.innerHTML = `<svg viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid meet"><g class="bg"></g><g class="figs"></g><g class="fx"></g></svg>
<div class="kt"></div><div class="kc"></div><button class="kx">✕ Quitter</button><div class="ks"></div><button class="kf">⏩ Accélérer</button>
<div class="kq"><p></p><div class="ch"></div><div class="fb"></div></div>`;
document.body.appendChild(ov);
const svg = ov.querySelector('svg'), gBg = ov.querySelector('.bg'), gFig = ov.querySelector('.figs'), gFx = ov.querySelector('.fx');
const uT = ov.querySelector('.kt'), uC = ov.querySelector('.kc'), uX = ov.querySelector('.kx'), uS = ov.querySelector('.ks'), uF = ov.querySelector('.kf'), uQ = ov.querySelector('.kq');
let VX = 0, VW = 1280;
function fit() { const a = innerWidth / Math.max(1, innerHeight); VW = C(720 * a, 1000, 1700); VX = 640 - VW / 2; svg.setAttribute('viewBox', `${VX} 0 ${VW} 720`); }
addEventListener('resize', fit);

// décor (plus large que l'écran pour les formats allongés)
(function () {
  let h = `<defs><linearGradient id="kFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b98a52"/><stop offset="1" stop-color="#8a5d31"/></linearGradient>
  <linearGradient id="kWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e4c2c"/><stop offset="1" stop-color="#8d6840"/></linearGradient></defs>`;
  h += `<rect x="-400" y="0" width="2080" height="${G - 150}" fill="url(#kWall)"/>`;
  for (let i = -2; i < 8; i++) { const x = 40 + i * 210; if (i === 2 || i === 3) continue;
    h += `<rect x="${x}" y="90" width="170" height="300" fill="#f2ead6" stroke="#3a2614" stroke-width="8"/>`;
    for (let k = 1; k < 4; k++) h += `<line x1="${x + k * 42.5}" y1="90" x2="${x + k * 42.5}" y2="390" stroke="#3a2614" stroke-width="3"/>`;
    for (let k = 1; k < 6; k++) h += `<line x1="${x}" y1="${90 + k * 50}" x2="${x + 170}" y2="${90 + k * 50}" stroke="#3a2614" stroke-width="3"/>`; }
  h += `<rect x="500" y="40" width="280" height="370" fill="#4a3018" stroke="#2a1a0c" stroke-width="6"/>
  <rect x="590" y="70" width="100" height="250" fill="#efe6cf"/><text x="640" y="170" font-size="62" text-anchor="middle" fill="#1a1a1a" font-family="serif">剣</text><text x="640" y="250" font-size="62" text-anchor="middle" fill="#1a1a1a" font-family="serif">道</text>
  <path d="M 560 30 L 640 6 L 720 30 Z" fill="#3a2614"/><text x="640" y="395" font-size="18" text-anchor="middle" fill="#e8d9b0" font-family="sans-serif">SHŌMEN</text>`;
  h += `<rect x="-400" y="${G - 150}" width="2080" height="${720 - G + 150}" fill="url(#kFloor)"/>`;
  for (let i = -10; i < 34; i++) h += `<line x1="${i * 60 - 200}" y1="${G - 150}" x2="${i * 60 * 1.6 - 520}" y2="720" stroke="#6b4423" stroke-opacity=".35" stroke-width="2"/>`;
  h += `<rect x="-400" y="${G - 152}" width="2080" height="6" fill="#3a2614"/>`;
  gBg.innerHTML = h;
})();

// ================= ARMES ET KAMAE =================
// B = bout de la tsuka par rapport à l'épaule ; a = angle (0 = devant, 90 = vertical) ; h = prise
const WP = { tachi: { len: 152, tsuka: 36, two: [4, 30], R: 20, L: 33, one: 30 }, kodachi: { len: 86, tsuka: 22, two: [3, 18], R: 12, L: 20, one: 14 } };
const KB = {
  sageto: { bx: -10, by: 80, a: -35, h: 'R' }, taito: { bx: 40, by: 62, a: -165, h: 'L' },
  chudan: { bx: 36, by: 62, a: 16, h: '2' }, toku: { bx: 38, by: 68, a: -22, h: '2' },
  jodan: { bx: 22, by: -72, a: 140, h: '2' }, jodanM: { bx: 30, by: -80, a: 118, h: '2' }, gedan: { bx: 38, by: 70, a: -28, h: '2' },
  hasso: { bx: 18, by: 30, a: 110, h: '2' }, waki: { bx: 10, by: 58, a: 196, h: '2' }, seigan: { bx: 36, by: 58, a: 25, h: '2' },
  furi: { bx: 22, by: -60, a: 105, h: '2' }, cutLow: { bx: 48, by: 50, a: -30, h: '2' }, men: { bx: 56, by: 0, a: 4, h: '2' },
  face: { bx: 40, by: 30, a: 15, h: '2' }, kote: { bx: 52, by: 28, a: -6, h: '2' }, tsuki: { bx: 56, by: 50, a: 9, h: '2' },
  nayashi: { bx: 28, by: 56, a: 24, h: '2' }, osae: { bx: 38, by: 68, a: 2, h: '2' }, suri: { bx: 34, by: 20, a: 62, h: '2' },
  maki: { bx: 30, by: 10, a: 80, h: '2' }, high: { bx: 38, by: 48, a: 24, h: '2' }, do: { bx: 50, by: 52, a: -12, h: '2' },
  kneelZ: { bx: 30, by: 58, a: -10, h: '2' },
};
const KK = { // kodachi, tenu d'une main
  sageto: { bx: -4, by: 80, a: -35, h: 'R' }, taito: { bx: 26, by: 62, a: -165, h: 'L' },
  chuH: { bx: 42, by: 42, a: 20, h: '1' }, gedH: { bx: 40, by: 66, a: -25, h: '1' }, jodan: { bx: 14, by: -82, a: 135, h: '1' },
  uke: { bx: 28, by: -70, a: 168, h: '1' }, men: { bx: 60, by: -2, a: 4, h: '1' }, osae: { bx: 46, by: 60, a: -14, h: '1' },
  throat: { bx: 26, by: 52, a: 24, h: '1' }, suri: { bx: 40, by: 16, a: 70, h: '1' }, nagashi: { bx: 30, by: 40, a: 150, h: '1' },
};
const K = (n, w = 'tachi') => ({ ...(w === 'kodachi' ? KK : KB)[n] });

// ================= DESSIN D'UN PRATIQUANT =================
function ik(sx, sy, hx, hy, l1, l2) { const dx = hx - sx, dy = hy - sy, d = Math.min(Math.hypot(dx, dy), l1 + l2 - .5), a = Math.atan2(dy, dx);
  const c = Math.acos(C((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)); const e1 = [sx + l1 * Math.cos(a + c), sy + l1 * Math.sin(a + c)], e2 = [sx + l1 * Math.cos(a - c), sy + l1 * Math.sin(a - c)]; return e1[1] > e2[1] ? e1 : e2; }
const P = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ') + ' Z';
const COL = { S: { gi: '#efece4', hak: '#e4e0d6', col: '#d8d3c6' }, U: { gi: '#2b3a67', hak: '#1d2546', col: '#e8e4d8' } };
function figure(p, dir, origin, col) {
  const c = (p.fR + p.fL) / 2, wx = origin + dir * c, rR = p.fR - c, rL = p.fL - c, ff = Math.max(rR, rL), bf = Math.min(rR, rL);
  const k = p.crouch, kn = p.kneel || 0, bow = p.bow * D2R, W = WP[p.w || 'tachi'];
  const hip = [lerp(lerp(0, -14, k), -6, kn), lerp(lerp(-125, -60, k), -78, kn)];
  const S = [hip[0] + 80 * Math.sin(bow), hip[1] - 80 * Math.cos(bow)];
  const Hd = [hip[0] + 112 * Math.sin(bow), hip[1] - 112 * Math.cos(bow)];
  const n = [Math.cos(bow), Math.sin(bow)];
  let o = '';
  const foot = (x, back) => `<ellipse cx="${x + 7}" cy="-4" rx="13" ry="4.5" fill="#d9a57c" transform="${back ? `rotate(-10 ${x} -4)` : ''}"/>`;
  o += foot(bf, true) + foot(ff, false);
  const st = [[hip[0] - 22, hip[1] - 14], [hip[0] + 20, hip[1] - 18], [ff * .55 + 16, -70], [ff + 22, -3], [bf - 22, -3], [hip[0] - 26, -70]];
  const sk = [[hip[0] - 22, hip[1] - 12], [hip[0] + 20, hip[1] - 16], [hip[0] + 52, -80], [ff + 30, -3], [bf - 24, -3], [hip[0] - 30, hip[1] + 16]];
  const kq = [[hip[0] - 22, hip[1] - 12], [hip[0] + 20, hip[1] - 16], [ff + 18, -84], [ff + 24, -3], [bf - 40, -3], [hip[0] - 34, hip[1] + 30]];
  const hk = st.map((q, i) => { const a = [lerp(q[0], sk[i][0], k), lerp(q[1], sk[i][1], k)]; return [lerp(a[0], kq[i][0], kn), lerp(a[1], kq[i][1], kn)]; });
  o += `<path d="${P(hk)}" fill="${col.hak}" stroke="#00000040" stroke-width="2"/>`;
  if (ff - bf > 50 && k < .5 && kn < .5) o += `<path d="${P([[ff - 20, -3], [hip[0] + 3, -62 + k * 20], [bf + 20, -3]])}" fill="#000" opacity=".22"/>`;
  for (const t of [.3, .55, .8]) o += `<line x1="${lerp(hk[0][0], hk[1][0], t)}" y1="${lerp(hk[0][1], hk[1][1], t) + 4}" x2="${lerp(hk[4][0], hk[3][0], t)}" y2="-6" stroke="#00000030" stroke-width="1.5"/>`;
  const sw = [S[0] + p.bx, S[1] + p.by], d = dv(p.a), at = t => [sw[0] + d[0] * t, sw[1] + d[1] * t];
  const Sf = [S[0] - 3, S[1] + 3], Sn = [S[0] + 3, S[1] + 5];
  let hF, hN;
  if (p.h === '2') { hF = at(W.two[0]); hN = at(W.two[1]); }
  else if (p.h === 'R') { hN = at(W.R); hF = [S[0] - 2, S[1] + 88]; }
  else if (p.h === '1') { hN = at(W.one); hF = p.grab ? [S[0] + 72 * p.grab + 8, S[1] + 40 - 30 * p.grab] : [S[0] + 10, S[1] + 64]; }
  else { hF = at(W.L); hN = [S[0] + 6, S[1] + 88]; }
  const arm = (sh, hd) => { const e = ik(sh[0], sh[1], hd[0], hd[1], 46, 46); const m = [lerp(e[0], hd[0], .45), lerp(e[1], hd[1], .45)];
    return `<path d="M ${sh[0]} ${sh[1]} L ${e[0]} ${e[1]}" stroke="${col.gi}" stroke-width="18" stroke-linecap="round"/><path d="M ${e[0]} ${e[1]} L ${m[0]} ${m[1]}" stroke="${col.gi}" stroke-width="14" stroke-linecap="round"/><path d="M ${m[0]} ${m[1]} L ${hd[0]} ${hd[1]}" stroke="#d9a57c" stroke-width="8" stroke-linecap="round"/><circle cx="${hd[0]}" cy="${hd[1]}" r="6.5" fill="#cf9a70"/>`; };
  const nn = [-d[1], d[0]], tip = at(W.len), mid = at(W.len * .62), sg = d[0] >= 0 ? -1 : 1, ctrl = [mid[0] + nn[0] * 4 * sg, mid[1] + nn[1] * 4 * sg], tsb = at(W.tsuka);
  const weapon = `<path d="M ${sw[0]} ${sw[1]} L ${tsb[0]} ${tsb[1]}" stroke="#3b2412" stroke-width="7" stroke-linecap="round"/><path d="M ${tsb[0]} ${tsb[1]} Q ${ctrl[0]} ${ctrl[1]} ${tip[0]} ${tip[1]}" stroke="#7a4f26" stroke-width="5.5" fill="none" stroke-linecap="round"/><path d="M ${tsb[0]} ${tsb[1]} Q ${ctrl[0]} ${ctrl[1]} ${tip[0]} ${tip[1]}" stroke="#a87444" stroke-width="1.5" fill="none" stroke-linecap="round"/><line x1="${tsb[0] + nn[0] * 6}" y1="${tsb[1] + nn[1] * 6}" x2="${tsb[0] - nn[0] * 6}" y2="${tsb[1] - nn[1] * 6}" stroke="#111" stroke-width="4" stroke-linecap="round"/>`;
  const an = ((p.a % 360) + 360) % 360, behind = an > 150 && an < 260;
  o += arm(Sf, hF);
  if (behind) o += weapon;
  const tb = [[hip[0] - n[0] * 21, hip[1] - n[1] * 21], [hip[0] + n[0] * 18, hip[1] + n[1] * 18], [S[0] + n[0] * 17, S[1] + n[1] * 17], [S[0] - n[0] * 18, S[1] - n[1] * 18]];
  o += `<path d="${P(tb)}" fill="${col.gi}" stroke="#00000030" stroke-width="2"/>`;
  o += `<path d="M ${S[0] + n[0] * 12} ${S[1] + n[1] * 12 + 2} L ${lerp(S[0], hip[0], .45) + n[0] * 16} ${lerp(S[1], hip[1], .45) + n[1] * 16}" stroke="${col.col}" stroke-width="5"/>`;
  o += `<path d="M ${hip[0] - n[0] * 22} ${hip[1] - n[1] * 22 - 10} L ${hip[0] + n[0] * 20} ${hip[1] + n[1] * 20 - 14}" stroke="${col.hak}" stroke-width="10"/>`;
  const nk = [lerp(S[0], Hd[0], .4), lerp(S[1], Hd[1], .4)];
  o += `<path d="M ${S[0]} ${S[1]} L ${nk[0]} ${nk[1]}" stroke="#d9a57c" stroke-width="13"/>`;
  o += `<g transform="translate(${Hd[0]},${Hd[1]}) rotate(${p.bow * .8})"><circle r="19" fill="#e2b48b"/><path d="M -19 2 Q -21 -22 2 -21 Q 16 -20 18 -10 Q 4 -14 -4 -6 Q -8 6 -14 14 Z" fill="#1d1510"/><path d="M 18 -2 L 24 4 L 18 7 Z" fill="#d9a57c"/><circle cx="12" cy="-3" r="1.8" fill="#222"/><ellipse cx="-2" cy="2" rx="4" ry="6" fill="#d39f78"/></g>`;
  if (!behind) o += weapon;
  o += arm(Sn, hN);
  let sx = Math.cos(p.turn * Math.PI / 2) * Math.cos((p.face || 0) * Math.PI); if (Math.abs(sx) < .18) sx = sx < 0 ? -.18 : .18; sx *= dir;
  return { svg: `<g transform="translate(${wx.toFixed(1)},${G}) scale(${sx.toFixed(3)},1)">${o}</g>`, head: [wx + sx * Hd[0], G + Hd[1]], wx };
}

// ================= CONSTRUCTION D'UN SCÉNARIO =================
function builder() {
  const base = () => ({ fR: 320, fL: 280, crouch: 0, kneel: 0, bow: 0, turn: 0, face: 0, grab: 0, w: 'tachi', ...K('sageto') });
  const cur = { U: base(), S: base() }, T = [];
  const clone = o => JSON.parse(JSON.stringify(o));
  const seg = (d, ch = {}, o = {}) => { const from = clone(cur); for (const w of ['U', 'S']) if (ch[w]) Object.assign(cur[w], ch[w]); T.push({ d, from, to: clone(cur), ...o }); };
  const hold = (d, o) => seg(d, {}, o);
  const q = (text, ok, no, why) => T.push({ d: 0, q: { text, ok, no, why }, from: clone(cur), to: clone(cur) });
  const stance = (f, lead, c) => { c = c ?? (f.fR + f.fL) / 2; return lead === 'R' ? { fR: c + 20, fL: c - 20 } : { fR: c - 20, fL: c + 20 }; };
  const walk = (spec, dur, o = {}) => {
    const plan = {}; let n = 0;
    for (const w in spec) { const s = spec[w], f = cur[w], c = (f.fR + f.fL) / 2 + s.D, last = s.order[s.order.length - 1];
      const fin = s.fin || (last === 'R' ? { fR: c + 20, fL: c - 20 } : { fR: c - 20, fL: c + 20 });
      const cnt = { R: s.order.filter(x => x === 'R').length, L: s.order.filter(x => x === 'L').length }, done = { R: 0, L: 0 }, st = { R: f.fR, L: f.fL };
      plan[w] = s.order.map(ft => { done[ft]++; const v = lerp(st[ft], fin['f' + ft], done[ft] / cnt[ft]); return { ['f' + ft]: v, ...(s.extra || {}) }; }); n = Math.max(n, s.order.length); }
    for (let i = 0; i < n; i++) { const ch = {}; for (const w in plan) if (plan[w][i]) ch[w] = plan[w][i]; seg(dur, ch, i === 0 ? o : {}); }
  };
  const both = x => ({ U: { ...x }, S: { ...x } });
  return { cur, T, seg, hold, q, stance, walk, both };
}
const F3 = ['R', 'L', 'R'], F3L = ['L', 'R', 'L'], F5 = ['L', 'R', 'L', 'R', 'L'];

function buildScript(list, o) {
  const B = builder(), { cur, seg, hold, q, stance, walk, both } = B;
  const sw = () => cur.S.w;
  const KS = n => K(n, sw());
  const center = (cap, cS = 475, cU = 475) => {
    seg(1.4, { U: { ...K('chudan'), face: 0, kneel: 0, bow: 0, grab: 0, ...stance(cur.U, 'R', cU) }, S: { ...KS(sw() === 'kodachi' ? 'chuH' : 'chudan'), face: 0, kneel: 0, bow: 0, grab: 0, ...stance(cur.S, 'R', cS) } }, { cap: cap || 'Les deux reviennent au centre' }); hold(.5);
  };
  const toStart = () => {
    seg(.9, { U: K('toku'), S: sw() === 'kodachi' ? KS('gedH') : K('toku') }, { cap: 'Kamae wo toku : on abaisse la garde' });
    walk({ U: { D: -(cur.U.fR + cur.U.fL) / 2 + 300, order: F5 }, S: { D: -(cur.S.fR + cur.S.fL) / 2 + 300, order: F5 } }, .45, { cap: 'Retour au point de départ en cinq petits pas' }); hold(.4);
  };
  const kodachiFirst = list[0].startsWith('kd');
  if (kodachiFirst) { cur.S.w = 'kodachi'; Object.assign(cur.S, K('sageto', 'kodachi')); }
  // ---------- reihō d'ouverture ----------
  seg(1.8, {}, { title: 'Reihō — le salut des kata', cap: `Uchidachi (à droite) et shidachi (à gauche) à environ 9 pas, ${kodachiFirst ? 'tachi et kodachi' : 'bokutō'} en main droite : sagetō` });
  if (o.quiz) q('Comment tient-on le bokutō avant le salut ?', 'Main droite, le long du corps, pointe vers le bas (sagetō)', ['Main gauche, à la hanche', 'À deux mains, en chūdan'], 'Au début, le bokutō est tenu en main droite : sagetō.');
  seg(.8, both({ turn: .7 }), { cap: 'Rei vers le shōmen : salut debout d\'environ 30°' }); seg(1, both({ bow: 30 })); hold(.4); seg(1, both({ bow: 0 })); seg(.8, both({ turn: 0 }));
  seg(.9, both({ bow: 15 }), { cap: 'Face à face : ritsurei d\'environ 15°, sans quitter l\'autre des yeux' }); hold(.3); seg(.9, both({ bow: 0 }));
  seg(1, { U: K('taito'), S: KS('taito') }, { cap: 'Le sabre passe à la main gauche, à la hanche, pouce sur la tsuba : taitō' }); hold(.5);
  if (o.quiz) q('Quand dégaine-t-on ?', 'Au 3e pas, en descendant en sonkyo', ['Dès le premier pas', 'Après s\'être relevé du sonkyo'], 'On avance de trois pas (pied droit d\'abord) et l\'on dégaine au 3e pas, en descendant en sonkyo.');
  walk({ U: { D: 175, order: F3 }, S: { D: 175, order: F3 } }, .7, { cap: 'Trois grands pas en avant, pied droit d\'abord' });
  seg(1.3, { U: { ...K('chudan'), crouch: 1 }, S: { ...KS(sw() === 'kodachi' ? 'chuH' : 'chudan'), crouch: 1 } }, { cap: 'Au 3e pas : on dégaine et on descend en sonkyo' }); hold(.7);
  seg(1, both({ crouch: 0 }), { cap: 'On se relève en garde' }); hold(.4);
  toStart();

  const KATA = {
    k1() {
      seg(1.3, { U: { ...K('jodan'), fL: cur.U.fR + 30 }, S: { ...K('jodanM'), fR: cur.S.fL + 55 } }, { title: 'Ippon-me — 1er kata', cap: 'Uchidachi : morote hidari jōdan (pied gauche devant) — shidachi : morote migi jōdan (pied droit devant)', hl: true });
      if (o.quiz) q('Ippon-me : quelle garde prend shidachi ?', 'Migi jōdan, pied droit devant', ['Hidari jōdan, pied gauche devant', 'Chūdan'], 'Uchidachi est en hidari jōdan, shidachi en migi jōdan.');
      hold(1.2, { hl: true });
      walk({ U: { D: 170, order: F3L }, S: { D: 190, order: F3 } }, .7, { cap: 'Trois pas en avant : uchidachi du pied gauche, shidachi du pied droit' }); hold(.6, { cap: 'Issoku-ittō no maai : uchidachi saisit l\'occasion…' });
      if (o.quiz) q('Uchidachi coupe shōmen. Que fait shidachi ?', 'Nuki : il recule et laisse passer la coupe', ['Il bloque avec son bokutō', 'Il frappe kote'], 'Shidachi recule légèrement (nuki) : la coupe d\'uchidachi passe dans le vide.');
      seg(.32, { U: { fR: cur.U.fL + 40, ...K('cutLow'), bow: 10 }, S: { fL: cur.S.fL - 55, fR: cur.S.fR - 55, bow: -4 } }, { cap: 'Uchidachi coupe shōmen — shidachi recule : nuki', kiai: { U: 'Yaa !' } });
      hold(.3);
      seg(.3, { S: { fR: cur.S.fR + 40, fL: cur.S.fL + 35, ...K('men'), bow: 6 } }, { cap: 'Shidachi avance du pied droit et frappe men', kiai: { S: 'Tō !' } }); hold(.8);
      seg(.8, { U: { fL: cur.U.fL - 45, bow: 0 }, S: { ...K('face'), bow: 0 } }, { cap: 'Uchidachi recule ; shidachi descend le kissaki entre ses yeux' }); hold(.3);
      if (o.quiz) q('Zanshin : que fait shidachi ensuite ?', 'Il recule le pied droit et prend hidari jōdan', ['Il rengaine aussitôt', 'Il prend gedan'], 'Le zanshin d\'ippon-me se montre en hidari jōdan.');
      seg(.9, { U: { fR: cur.U.fR - 60 }, S: { fR: cur.S.fR - 85, ...K('jodan') } }, { cap: 'Shidachi recule le pied droit et prend hidari jōdan : zanshin', hl: true }); hold(1.1, { hl: true });
      seg(1, { U: K('chudan'), S: { ...K('chudan'), fR: cur.S.fR + 85 } }, { cap: 'Les deux reviennent en chūdan' });
    },
    k2() {
      seg(1, both(K('chudan')), { title: 'Nihon-me — 2e kata', cap: 'Les deux en chūdan no kamae' }); hold(.5);
      walk({ U: { D: 175, order: F3 }, S: { D: 175, order: F3 } }, .7, { cap: 'Trois pas en avant, pied droit d\'abord' }); hold(.5, { cap: 'À la distance, uchidachi lève le sabre…' });
      seg(.45, { U: K('furi') });
      if (o.quiz) q('Uchidachi frappe kote. Que fait shidachi ?', 'Nuki : recule en diagonale à gauche, puis frappe kote', ['Suriage-men', 'Kaeshi-dō'], 'Shidachi esquive le kote en reculant en diagonale, puis frappe le kote droit.');
      seg(.3, { U: { fR: cur.U.fR + 45, fL: cur.U.fL + 40, ...K('kote'), bow: 6 }, S: { fL: cur.S.fL - 45, fR: cur.S.fR - 40, ...K('furi') } }, { cap: 'Uchidachi frappe kote — shidachi recule en diagonale à gauche en levant le sabre', kiai: { U: 'Yaa !' } });
      hold(.25);
      seg(.3, { S: { fR: cur.S.fR + 50, fL: cur.S.fL + 45, ...K('kote'), bow: 5 } }, { cap: 'Shidachi avance du pied droit et frappe le kote droit', kiai: { S: 'Tō !' } }); hold(1, { cap: 'Zanshin' });
      seg(.6, both({ bow: 0 }));
    },
    k3() {
      seg(1, both(K('gedan')), { title: 'Sanbon-me — 3e kata', cap: 'Les deux en gedan no kamae' }); hold(.5);
      walk({ U: { D: 175, order: F3 }, S: { D: 175, order: F3 } }, .7, { cap: 'Trois pas en avant, pied droit d\'abord' });
      seg(1.3, both(K('chudan')), { cap: 'Les kissaki montent ensemble en chūdan (seme-ai)' }); hold(.4);
      if (o.quiz) q('Uchidachi pique au plexus (tsuki). Que fait shidachi ?', 'Nayashi : il reçoit en reculant, puis renvoie le tsuki', ['Nuki-dō', 'Il bloque et frappe men'], 'Shidachi reçoit le tsuki en douceur (nayashi) et renvoie un tsuki : nayashi-irezuki.');
      seg(.32, { U: { fR: cur.U.fR + 45, fL: cur.U.fL + 40, ...K('tsuki'), bow: 6 }, S: { fL: cur.S.fL - 40, fR: cur.S.fR - 35, ...K('nayashi') } }, { cap: 'Uchidachi pique (mune-tsuki) — shidachi recule et reçoit : nayashi', kiai: { U: 'Yaa !' } });
      seg(.3, { S: { fR: cur.S.fR + 40, fL: cur.S.fL + 35, ...K('tsuki'), bow: 5 } }, { cap: 'Shidachi renvoie le tsuki : nayashi-irezuki', kiai: { S: 'Tō !' } }); hold(.3);
      seg(.7, { U: { fL: cur.U.fL - 45, fR: cur.U.fR - 40, ...K('osae'), bow: 0 }, S: { ...K('face'), bow: 0 } }, { cap: 'Uchidachi recule en appuyant le sabre' }); hold(.2);
      if (o.quiz) q('Uchidachi recule. Que fait shidachi ?', 'Kurai-zume : il avance, kissaki au visage', ['Il reste sur place', 'Il frappe men'], 'Shidachi presse avec la pointe au visage (kurai-zume) pendant qu\'uchidachi recule.');
      walk({ U: { D: -110, order: F3L }, S: { D: 110, order: F3, extra: K('face') } }, .45, { cap: 'Kurai-zume : shidachi avance, le kissaki au visage' });
      hold(.9, { cap: 'Zanshin' });
    },
    k4() {
      seg(1.2, { U: { ...K('hasso'), ...stance(cur.U, 'L') }, S: { ...K('waki'), ...stance(cur.S, 'L') } }, { title: 'Yonhon-me — 4e kata', cap: 'Uchidachi : hassō no kamae — shidachi : waki-gamae (pied droit en arrière, sabre caché)', hl: true });
      if (o.quiz) q('Yonhon-me : quelles gardes ?', 'Uchidachi hassō, shidachi waki-gamae', ['Les deux en jōdan', 'Uchidachi gedan, shidachi chūdan'], 'Yonhon-me commence en hassō (uchidachi) contre waki-gamae (shidachi).');
      hold(1, { hl: true });
      walk({ U: { D: 160, order: F3L }, S: { D: 160, order: F3L } }, .6, { cap: 'Trois petits pas en avant, pied gauche d\'abord' }); hold(.3);
      seg(.45, { U: K('furi'), S: K('furi') }, { cap: 'Les deux prennent jōdan…' });
      seg(.3, { U: { fR: cur.U.fL + 30, ...K('men'), bow: 5 }, S: { fR: cur.S.fL + 30, ...K('men'), bow: 5 } }, { cap: 'Ai-uchi : les deux frappent men en même temps, les sabres se rencontrent', kiai: { U: 'Yaa !', S: 'Tō !' } });
      hold(.5); seg(1, { U: { ...K('high'), bow: 0 }, S: { ...K('high'), bow: 0 } }, { cap: 'Les sabres descendent ensemble en chūdan (ai-chūdan)' }); hold(.3);
      if (o.quiz) q('Uchidachi pique vers le poumon droit. Que fait shidachi ?', 'Maki-kaeshi : il enroule son sabre, puis frappe men', ['Nayashi-irezuki', 'Nuki-dō'], 'Shidachi recule en diagonale gauche en enroulant le sabre adverse (maki-kaeshi), puis frappe men.');
      seg(.3, { U: { fR: cur.U.fR + 45, fL: cur.U.fL + 40, ...K('tsuki'), bow: 6 }, S: { fL: cur.S.fL - 30, ...K('maki') } }, { cap: 'Uchidachi pique — shidachi recule en diagonale à gauche et enroule (maki-kaeshi)', kiai: { U: 'Yaa !' } });
      seg(.35, { S: K('jodan') });
      seg(.3, { S: { fR: cur.S.fR + 40, fL: cur.S.fL + 30, ...K('men'), bow: 6 } }, { cap: 'Shidachi frappe men', kiai: { S: 'Tō !' } }); hold(1, { cap: 'Zanshin' });
      seg(.6, both({ bow: 0 }));
    },
    k5() {
      seg(1.2, { U: { ...K('jodan'), ...stance(cur.U, 'L') }, S: { ...K('seigan'), ...stance(cur.S, 'R') } }, { title: 'Gohon-me — 5e kata', cap: 'Uchidachi : hidari jōdan — shidachi : seigan, pointe vers le poing gauche', hl: true });
      if (o.quiz) q('Gohon-me : quelle garde prend shidachi face au jōdan ?', 'Seigan (chūdan vers le poing gauche)', ['Gedan', 'Waki-gamae'], 'Contre hidari jōdan, shidachi prend seigan.');
      hold(1, { hl: true });
      walk({ U: { D: 170, order: F3L }, S: { D: 180, order: F3 } }, .7, { cap: 'Trois pas en avant : uchidachi du pied gauche, shidachi du pied droit' }); hold(.4);
      if (o.quiz) q('Uchidachi coupe men. Que fait shidachi ?', 'Suriage-men : il remonte son sabre et frappe men', ['Nuki : il recule sans toucher', 'Kaeshi-dō'], 'Shidachi recule en remontant son sabre contre celui d\'uchidachi (suriage), puis frappe men.');
      seg(.3, { U: { fR: cur.U.fL + 40, ...K('cutLow'), bow: 10 }, S: { fL: cur.S.fL - 40, fR: cur.S.fR - 40, ...K('suri') } }, { cap: 'Uchidachi coupe men — shidachi recule en remontant son sabre : suriage', kiai: { U: 'Yaa !' } });
      seg(.3, { S: { fR: cur.S.fR + 45, fL: cur.S.fL + 40, ...K('men'), bow: 6 } }, { cap: 'Shidachi frappe men', kiai: { S: 'Tō !' } }); hold(.7);
      seg(.8, { U: { fL: cur.U.fL - 45, bow: 0 }, S: { ...K('face'), bow: 0 } }, { cap: 'Kissaki au visage d\'uchidachi' });
      seg(.9, { U: { fR: cur.U.fR - 60 }, S: { fR: cur.S.fR - 85, ...K('jodan') } }, { cap: 'Shidachi prend hidari jōdan : zanshin' }); hold(1);
      seg(1, { U: K('chudan'), S: { ...K('chudan'), fR: cur.S.fR + 85 } });
    },
    k6() {
      seg(1.1, { U: K('chudan'), S: K('gedan') }, { title: 'Roppon-me — 6e kata', cap: 'Uchidachi : chūdan — shidachi : gedan' }); hold(.5);
      walk({ U: { D: 175, order: F3 }, S: { D: 175, order: F3 } }, .7, { cap: 'Trois pas en avant, pied droit d\'abord' });
      seg(.9, { S: K('chudan') }, { cap: 'Shidachi monte en chūdan en mettant la pression (seme)' });
      seg(.8, { U: { ...K('jodan'), fL: cur.U.fR + 30 } }, { cap: 'Uchidachi prend hidari jōdan…' });
      seg(.6, { S: { fR: cur.S.fR + 30, fL: cur.S.fL + 30 } }, { cap: '…shidachi avance aussitôt en chūdan' });
      seg(.8, { U: { ...K('chudan'), fL: cur.U.fR - 40 } }, { cap: 'Uchidachi, sous la pression, revient en chūdan en reculant' }); hold(.3);
      if (o.quiz) q('Uchidachi frappe kote. Que fait shidachi ?', 'Suriage-kote : il remonte son sabre, puis frappe kote', ['Nuki-men', 'Nayashi'], 'Shidachi fait un petit suriage en reculant en diagonale, puis frappe kote.');
      seg(.3, { U: { fR: cur.U.fR + 40, fL: cur.U.fL + 35, ...K('kote'), bow: 5 }, S: { fL: cur.S.fL - 40, fR: cur.S.fR - 35, ...K('suri') } }, { cap: 'Uchidachi frappe kote — shidachi recule en diagonale et remonte son sabre (suriage)', kiai: { U: 'Yaa !' } });
      seg(.3, { S: { fR: cur.S.fR + 45, fL: cur.S.fL + 40, ...K('kote'), bow: 5 } }, { cap: 'Shidachi frappe kote', kiai: { S: 'Tō !' } }); hold(.6);
      seg(.9, { U: { fL: cur.U.fL - 45, ...K('toku'), bow: 0 }, S: { ...K('jodan'), fL: cur.S.fR + 30, bow: 0 } }, { cap: 'Uchidachi recule ; shidachi prend hidari jōdan : zanshin' }); hold(1);
      seg(1, { U: K('chudan'), S: { ...K('chudan'), fL: cur.S.fR - 40 } });
    },
    k7() {
      seg(1, both(K('chudan')), { title: 'Nanahon-me — 7e kata', cap: 'Les deux en chūdan no kamae' }); hold(.5);
      walk({ U: { D: 175, order: F3 }, S: { D: 175, order: F3 } }, .7, { cap: 'Trois pas en avant, pied droit d\'abord' }); hold(.4);
      if (o.quiz) q('Uchidachi pique légèrement (tsuki). Que fait shidachi ?', 'Nayashi : il reçoit en reculant d\'un pas', ['Maki-kaeshi', 'Suriage'], 'Shidachi recule et reçoit en nayashi : les deux sabres se retrouvent hauts, kissaki croisés.');
      seg(.35, { U: { fR: cur.U.fR + 40, fL: cur.U.fL + 35, ...K('tsuki'), bow: 4 }, S: { fL: cur.S.fL - 40, fR: cur.S.fR - 35, ...K('nayashi') } }, { cap: 'Uchidachi pique — shidachi recule et reçoit : nayashi', kiai: { U: 'Yaa !' } });
      seg(.8, { U: { ...K('high'), bow: 0 }, S: K('high') }, { cap: 'Les deux sabres se retrouvent hauts, kissaki croisés' }); hold(.4);
      if (o.quiz) q('Uchidachi coupe men en grand. Que fait shidachi ?', 'Nuki-dō en passant à droite, puis genou gauche au sol', ['Suriage-men', 'Debana-kote'], 'Shidachi avance en diagonale à droite, coupe le dō en passant et termine genou gauche au sol.');
      seg(.4, { U: { fR: cur.U.fR + 20, ...K('furi') } }, { cap: 'Uchidachi lève le sabre pour couper men…' });
      seg(.32, { U: { fR: cur.U.fR + 40, fL: cur.U.fL + 50, ...K('cutLow'), bow: 10 }, S: { fR: cur.S.fR + 120, fL: cur.S.fL + 100, ...K('do'), bow: 8 } }, { cap: 'Nuki-dō : shidachi avance en diagonale à droite et coupe le dō en passant', kiai: { U: 'Yaa !', S: 'Tō !' } });
      seg(.6, { S: { fR: 1280 - (cur.U.fR + cur.U.fL) / 2 + 175, fL: 1280 - (cur.U.fR + cur.U.fL) / 2 + 125, kneel: 1, ...K('kneelZ'), bow: 4 } }, { cap: 'Shidachi passe et termine genou gauche au sol : zanshin' });
      hold(1.2);
      seg(.8, { U: { face: 1, ...K('chudan'), bow: 0 }, S: { face: 1, kneel: 0, ...K('chudan'), bow: 0 } }, { cap: 'Les deux se retournent et se font face en chūdan' }); hold(.5);
      walk({ S: { D: -((cur.S.fR + cur.S.fL) / 2 - 475), order: ['R', 'L', 'R', 'L', 'R'], fin: { fR: 495, fL: 455 } } }, .4, { cap: 'Retour aux places' });
      seg(.6, { U: { face: 0 }, S: { face: 0 } });
    },
    kd1() {
      seg(1.2, { U: { ...K('jodan'), ...stance(cur.U, 'L') }, S: { ...K('chuH', 'kodachi'), ...stance(cur.S, 'R') } }, { title: 'Kodachi ippon-me', cap: 'Uchidachi : hidari jōdan — shidachi : chūdan-hanmi, kodachi d\'une main, pointe au visage' });
      if (o.quiz) q('Avec le kodachi, comment shidachi se place-t-il ?', 'Chūdan-hanmi : corps de biais, kodachi d\'une main', ['Jōdan à deux mains', 'Gedan à deux mains'], 'Le kodachi se tient d\'une main, corps de biais (hanmi), main gauche à la hanche.');
      hold(.8);
      walk({ U: { D: 160, order: F3L }, S: { D: 215, order: F3 } }, .7, { cap: 'Shidachi avance pour entrer (irimi), uchidachi avance du pied gauche' }); hold(.4);
      if (o.quiz) q('Uchidachi coupe men. Que fait shidachi ?', 'Uke-nagashi : il reçoit en déviant la coupe, puis frappe men', ['Nuki : il recule', 'Suriage à deux mains'], 'Shidachi avance en diagonale droite, laisse glisser la coupe sur le kodachi (uke-nagashi), puis frappe men.');
      seg(.32, { U: { fR: cur.U.fL + 40, ...K('cutLow'), bow: 10 }, S: { fR: cur.S.fR + 25, fL: cur.S.fL + 15, ...K('uke', 'kodachi') } }, { cap: 'Uchidachi coupe men — shidachi reçoit et dévie : uke-nagashi', kiai: { U: 'Yaa !' } });
      seg(.3, { S: { fR: cur.S.fR + 20, ...K('men', 'kodachi'), bow: 6 } }, { cap: 'Shidachi frappe men d\'une main', kiai: { S: 'Tō !' } }); hold(.6);
      seg(.9, { U: { bow: 0, ...K('toku') }, S: { fR: cur.S.fR - 70, fL: cur.S.fL - 50, ...K('jodan', 'kodachi'), bow: 0 } }, { cap: 'Shidachi recule et prend jōdan avec le kodachi : zanshin' }); hold(1);
    },
    kd2() {
      seg(1.1, { U: K('gedan'), S: K('chuH', 'kodachi') }, { title: 'Kodachi nihon-me', cap: 'Uchidachi : gedan — shidachi : chūdan-hanmi' }); hold(.5);
      walk({ U: { D: 160, order: F3 }, S: { D: 190, order: F3, extra: K('osae', 'kodachi') } }, .7, { cap: 'Shidachi avance en appuyant sur le sabre d\'uchidachi (osae)' });
      seg(.9, { U: { ...K('waki'), fR: cur.U.fR - 70 } }, { cap: 'Uchidachi recule le pied droit et prend waki-gamae' });
      seg(.6, { U: { ...K('furi'), fR: cur.U.fR + 70 } }, { cap: 'Puis il passe en jōdan…' });
      if (o.quiz) q('Uchidachi coupe men. Que fait shidachi ?', 'Uke-nagashi à gauche, men, puis contrôle du bras', ['Nuki-dō', 'Suriage-kote'], 'Shidachi dévie la coupe (uke-nagashi), frappe men et contrôle le bras droit d\'uchidachi.');
      seg(.32, { U: { fR: cur.U.fR + 40, fL: cur.U.fL + 35, ...K('cutLow'), bow: 10 }, S: { fL: cur.S.fL + 20, ...K('uke', 'kodachi') } }, { cap: 'Uchidachi coupe men — shidachi dévie (uke-nagashi)', kiai: { U: 'Yaa !' } });
      seg(.3, { S: { fR: cur.S.fR + 25, ...K('men', 'kodachi'), bow: 6 } }, { cap: 'Shidachi frappe men', kiai: { S: 'Tō !' } }); hold(.3);
      seg(.7, { S: { ...K('throat', 'kodachi'), grab: 1, bow: 0 }, U: { bow: 4 } }, { cap: 'Il saisit le bras droit d\'uchidachi, kodachi pointé à la gorge : zanshin' }); hold(1.2);
      seg(.6, { S: { grab: 0 }, U: { bow: 0 } });
    },
    kd3() {
      seg(1.1, { U: K('chudan'), S: K('gedH', 'kodachi') }, { title: 'Kodachi sanbon-me', cap: 'Uchidachi : chūdan — shidachi : gedan-hanmi' }); hold(.5);
      walk({ U: { D: 165, order: F3 }, S: { D: 185, order: F3 } }, .7, { cap: 'Les deux avancent ; shidachi cherche à entrer' }); hold(.3);
      if (o.quiz) q('Uchidachi coupe men. Que fait shidachi ?', 'Suriage puis suri-otoshi : il remonte puis rabat le sabre', ['Uke-nagashi', 'Nuki'], 'Shidachi remonte (suriage) puis rabat le sabre d\'uchidachi vers la droite (suri-otoshi).');
      seg(.32, { U: { ...K('furi') } });
      seg(.3, { U: { fR: cur.U.fR + 40, fL: cur.U.fL + 35, ...K('cutLow'), bow: 8 }, S: { ...K('suri', 'kodachi') } }, { cap: 'Uchidachi coupe men — shidachi suriage puis suri-otoshi', kiai: { U: 'Yaa !' } });
      seg(.3, { S: K('osae', 'kodachi') }); hold(.3);
      if (o.quiz) q('Uchidachi enchaîne sur le dō. Que fait shidachi ?', 'Suri-nagashi : il fait glisser la coupe, puis contrôle le bras', ['Il recule de trois pas', 'Kaeshi-men'], 'Shidachi fait glisser la coupe vers la gauche (suri-nagashi), entre et contrôle le bras droit.');
      seg(.3, { U: { ...K('do'), bow: 6 }, S: { fL: cur.S.fL + 30, ...K('nagashi', 'kodachi') } }, { cap: 'Uchidachi coupe le dō — shidachi fait glisser : suri-nagashi', kiai: { U: 'Yaa !' } });
      seg(.6, { S: { fR: cur.S.fR + 30, ...K('throat', 'kodachi'), grab: 1 }, U: { bow: 0, ...K('toku') } }, { cap: 'Shidachi saisit le bras et pointe la gorge' });
      walk({ U: { D: -110, order: F3L, extra: { bow: 0 } }, S: { D: 110, order: F3 } }, .45, { cap: 'Uchidachi recule de trois pas, shidachi le presse : zanshin' }); hold(1);
      seg(.6, { S: { grab: 0 } });
    },
  };

  for (let i = 0; i < list.length; i++) {
    const id = list[i];
    if (id.startsWith('kd') && cur.S.w !== 'kodachi') {
      seg(1, { S: K('taito') }, { title: 'Changement d\'arme', cap: 'Shidachi rengaine le tachi…' });
      seg(.8, { S: { w: 'kodachi', ...K('taito', 'kodachi') } }, { cap: '…et prend le kodachi (sabre court)' });
      seg(1, { S: K('gedH', 'kodachi') }, { cap: 'Shidachi dégaine le kodachi' }); hold(.4);
    }
    KATA[id]();
    center();
    if (i < list.length - 1) toStart();
  }
  // ---------- reihō de fin ----------
  seg(1.2, both({ crouch: 1 }), { title: 'Reihō — salut de fin', cap: 'Au centre : sonkyo' }); hold(.3);
  seg(1.1, { U: K('taito'), S: KS('taito') }, { cap: 'Osame-tō : le sabre revient à la hanche gauche' }); hold(.2);
  seg(1, both({ crouch: 0 }), { cap: 'On se relève' });
  walk({ U: { D: -175, order: F5 }, S: { D: -175, order: F5 } }, .45, { cap: 'Cinq petits pas en arrière, en taitō' });
  seg(.9, { U: K('sageto'), S: KS('sageto') }, { cap: 'Le sabre repasse en main droite : sagetō' });
  seg(.9, both({ bow: 15 }), { cap: 'Ritsurei mutuel' }); hold(.3); seg(.9, both({ bow: 0 }));
  seg(.8, both({ turn: .7 }), { cap: 'Rei vers le shōmen' }); seg(1, both({ bow: 30 })); hold(.4); seg(1, both({ bow: 0 })); seg(.8, both({ turn: 0 })); hold(.6);
  return B.T;
}

// ================= LECTURE =================
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
function feetMap(st) {
  const x0 = VX + 16, w = 300, X = v => x0 + 10 + v * (w - 20) / 1280, y0 = 650;
  let o = `<rect x="${x0}" y="${y0 - 40}" width="${w}" height="64" rx="10" fill="#000" opacity=".55"/><text x="${x0 + 10}" y="${y0 - 26}" font-size="11" fill="#bbb" font-family="sans-serif">Vue de dessus — pieds</text>`;
  for (const w2 of ['S', 'U']) { const f = st[w2], dir = w2 === 'S' ? 1 : -1, org = w2 === 'S' ? 0 : 1280, fc = (f.face || 0) > .5 ? -1 : 1;
    for (const ft of ['R', 'L']) { const x = X(org + dir * f['f' + ft]), side = (ft === 'R' ? 1 : -1) * dir * fc, y = y0 + side * 12;
      o += `<g transform="translate(${x},${y}) scale(${1.4 * dir * fc},1.4)"><path d="M -9 -4 Q 10 -6 11 0 Q 10 6 -9 4 Q -12 0 -9 -4 Z" fill="${COL[w2].gi}" stroke="#000" stroke-width="1"/></g><text x="${x}" y="${y + 4}" font-size="10" font-weight="800" text-anchor="middle" fill="${w2 === 'U' ? '#fff' : '#000'}" font-family="sans-serif">${ft === 'R' ? 'D' : 'G'}</text>`; } }
  return o;
}
let run = null;
function render(R) {
  const t = R.t, segs = R.T; let acc = 0, s = null, idx = 0;
  for (idx = 0; idx < segs.length; idx++) { const g = segs[idx]; if (g.title) R.title = g.title; if (g.cap) R.cap = g.cap;
    if (t < acc + g.d || (g.q && !g.answered)) { s = g; break; } acc += g.d; }
  if (!s) return true;
  if (s.kiai && idx > (R.kiaiSeen ?? -1)) { R.kiaiSeen = idx; R.kiai = s.kiai; R.kiaiT = 0; sayKiai(s.kiai); }
  if (s.q && !s.answered) { if (!R.qOn) ask(R, s); return draw(R, s.from), false; }
  const u = ease(C((t - acc) / s.d, 0, 1)), st = {};
  for (const w of ['U', 'S']) { st[w] = {}; for (const k in s.to[w]) { const a = s.from[w][k], b = s.to[w][k]; st[w][k] = typeof a === 'number' ? lerp(a, b, u) : (u < .5 ? a : b); } }
  draw(R, st); return false;
}
function draw(R, st) {
  const fS = figure(st.S, 1, 0, COL.S), fU = figure(st.U, -1, 1280, COL.U);
  gFig.innerHTML = `<ellipse cx="${fS.wx}" cy="${G}" rx="70" ry="9" fill="#000" opacity=".2"/><ellipse cx="${fU.wx}" cy="${G}" rx="70" ry="9" fill="#000" opacity=".2"/>` + fU.svg + fS.svg;
  const lab = (h, a, b, c) => `<text x="${h[0]}" y="${h[1] - 46}" text-anchor="middle" font-size="15" font-weight="700" fill="${c}" stroke="#000" stroke-width="3" paint-order="stroke" font-family="sans-serif">${a} ${b}</text>`;
  let o = lab(fS.head, 'Shidachi', '仕太刀', '#fff') + lab(fU.head, 'Uchidachi', '打太刀', '#ffd34d');
  if (R.kiai && R.kiaiT < 1.1) for (const w in R.kiai) { const h = w === 'S' ? fS.head : fU.head; o += `<g transform="translate(${h[0] + (w === 'S' ? -70 : 70)},${h[1] - 82})"><rect x="-48" y="-24" width="96" height="40" rx="14" fill="#fff" stroke="#c0392b" stroke-width="3"/><text y="5" text-anchor="middle" font-size="22" font-weight="800" fill="#c0392b" font-family="sans-serif">${R.kiai[w]}</text></g>`; }
  o += feetMap(st);
  gFx.innerHTML = o;
  uT.textContent = R.title || ''; uT.style.display = R.mode === 'auto' || !R.title ? 'none' : ''; uC.textContent = (R.mode === 'auto' && R.title ? R.title + ' — ' : '') + (R.cap || ''); uC.style.display = R.cap ? '' : 'none';
  uS.style.display = R.total ? '' : 'none'; uS.innerHTML = `Gestes justes : <b style="color:#ffd34d">${R.ok}/${R.total}</b>`;
}
function sayKiai(k) {
  if (!window.ambiance || !ambiance.opt.kiai) return;
  const v = Object.values(k)[0]; const ja = v.startsWith('Y') ? 'ヤー' : 'トー';
  try { ambiance.say(ja, v.startsWith('Y') ? 'Yaa' : 'To', { rate: 1.3, pitch: .9, volume: .9 }); } catch (e) {}
}
function ask(R, s) {
  R.qOn = true; R.fast = false; uF.classList.remove('on');
  const qq = s.q, opts = shuffle([qq.ok, ...qq.no]);
  uQ.style.display = 'block'; uQ.querySelector('p').textContent = qq.text; const fb = uQ.querySelector('.fb'); fb.textContent = '';
  const ch = uQ.querySelector('.ch'); ch.innerHTML = opts.map((t, i) => `<button data-i="${i}">${t}</button>`).join('');
  const btns = [...ch.querySelectorAll('button')];
  let left = R.mode === 'exam' ? 8 : 0, timer = null;
  const finish = (pick) => {
    if (s.answered || R.answering) return; R.answering = true; clearInterval(timer);
    const good = pick === qq.ok; if (good) R.ok++;
    btns.forEach(b => { const t = opts[+b.dataset.i]; if (t === qq.ok) b.classList.add('good'); else if (t === pick) b.classList.add('bad'); b.disabled = true; });
    fb.innerHTML = good ? `<span style="color:#7ddc7d">✓ Juste !</span> ${R.mode === 'exam' ? '' : qq.why || ''}` : `<span style="color:#ff6b6b">✗ ${pick ? 'Non' : 'Temps écoulé'}.</span> ${qq.why || 'Il fallait : ' + qq.ok}`;
    setTimeout(() => { if (run !== R) return; uQ.style.display = 'none'; s.answered = true; R.answering = false; R.qOn = false; }, good ? (R.mode === 'exam' ? 600 : 1500) : 2600);
  };
  btns.forEach(b => b.onclick = () => finish(opts[+b.dataset.i]));
  if (R.mode === 'learn') setTimeout(() => { if (run === R && !s.answered) btns.forEach(b => { if (opts[+b.dataset.i] === qq.ok) b.classList.add('glow'); }); }, 6000);
  if (R.mode === 'auto') setTimeout(() => { if (run === R) finish(qq.ok); }, 1400);
  if (left) { fb.textContent = `${left} s`; timer = setInterval(() => { if (run !== R) return clearInterval(timer); left--; fb.textContent = `${left} s`; if (left <= 0) finish(null); }, 1000); }
}
function loop(now) {
  const R = run; if (!R) return;
  const hub = $('hub');
  if (hub && hub.style.display !== 'none' && now - R.started > 300) { stop(); return; }
  const dt = Math.min(.05, (now - R.last) / 1000); R.last = now;
  if (!R.qOn) R.t += dt * (R.fast ? 4 : 1);
  R.kiaiT = (R.kiaiT || 0) + dt;
  const done = render(R);
  if (done) { const sc = R.total ? Math.round(R.ok / R.total * 100) : 100, cb = R.onDone; stop(); if (cb) cb(sc); return; }
  requestAnimationFrame(loop);
}
function stop() { run = null; ov.style.display = 'none'; uQ.style.display = 'none'; }
function kataScene(list, o = {}) {
  const mode = o.auto ? 'auto' : o.learn ? 'learn' : 'exam';
  if (typeof game !== 'undefined') game.state = 'over';
  const hub = $('hub'); if (hub) hub.style.display = 'none';
  const menu = $('menu'); if (menu) menu.style.display = 'none';
  for (const id of ['quit', 'cap', 'badge']) { const e = $(id); if (e) e.style.display = 'none'; }
  const T = buildScript(list, { quiz: true });
  run = { T, t: 0, last: performance.now(), started: performance.now(), mode, ok: 0, total: T.filter(g => g.q).length, onDone: o.onDone, title: '', cap: '' };
  fit(); ov.style.display = 'block'; uQ.style.display = 'none';
  uX.style.display = mode === 'auto' ? 'none' : '';
  uX.onclick = () => { stop(); if (window.academy) (o.onQuit || academy.home)(); };
  uF.onclick = () => { if (!run) return; run.fast = !run.fast; uF.classList.toggle('on', run.fast); };
  requestAnimationFrame(loop);
}
window.kataScene = kataScene;
})();
