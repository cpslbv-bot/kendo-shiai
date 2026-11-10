// Kendo Shiai v6 — tournoi personnalisable : poules, tableau final, encho, podium
(() => {
'use strict';
const A = window.academy, $ = id => document.getElementById(id);
const C = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = arr => arr.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
const FIRST = ['Kenji', 'Youssef', 'Hiroshi', 'Mehdi', 'Lucas', 'Takeshi', 'Amine', 'Daichi', 'Karim', 'Sofia', 'Yuki', 'Omar', 'Ines', 'Ren', 'Sara', 'Hamza', 'Aiko', 'Rachid', 'Hugo', 'Nadia', 'Sota', 'Ilyas', 'Emma', 'Kaito', 'Salma', 'Anas', 'Léa', 'Haruto', 'Yasmine', 'Adam', 'Mei', 'Ayoub'];
const LAST = ['Sato', 'El Amrani', 'Tanaka', 'Benali', 'Martin', 'Mori', 'Ouazzani', 'Kimura', 'Haddad', 'Rossi', 'Nakamura', 'Tazi', 'Alaoui', 'Fujita', 'Bennani', 'Suzuki', 'Dubois', 'Idrissi', 'Kato', 'Berrada', 'Moreau', 'Yamamoto', 'Chraibi', 'Ito'];
const names = n => { const s = new Set(); while (s.size < n) s.add(`${pick(FIRST)} ${pick(LAST)}`); return [...s]; };
const RN = k => ['Finale', 'Demi-finales', 'Quarts de finale', 'Huitièmes de finale', 'Seizièmes de finale', '32es de finale'][k] || `Tour ${k}`;
const POOL = i => String.fromCharCode(65 + i);
let cfg = { n: 16, size: 4, q: 2, dur: 180, spread: 1 };
try { Object.assign(cfg, JSON.parse(localStorage.getItem('kendo.tcfg') || '{}')); } catch (e) {}
let T = null;

const css = document.createElement('style');
css.textContent = `
.opt { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: center; margin: 6px 0; font-size: 13.5px; }
.opt span { min-width: 170px; text-align: right; color: #d9c9a8; margin-right: 6px; }
.hb.sm { padding: 6px 12px; font-size: 14px; border-radius: 10px; }
.hb.sel { border-color: #ffd34d; background: #3a3216; }
.pools { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 8px; text-align: left; }
.pool { background: rgba(255,255,255,.05); border-radius: 10px; padding: 6px 8px; }
.pool.me { outline: 2px solid #ffd34d; }
.pool h4 { margin: 0 0 4px; font-size: 13px; color: #d9c9a8; }
.pool table { width: 100%; border-collapse: collapse; font-size: 12px; }
.pool td { padding: 2px 4px; white-space: nowrap; } .pool td.n { text-align: right; color: #ccc; }
.pool tr.q td:first-child { color: #ffd34d; font-weight: 800; }
.pool tr.you td { color: #fff; font-weight: 800; }
.mlist { font-size: 12.5px; margin: 6px 0; text-align: left; }
.mlist div { padding: 2px 0; }
.brk { display: flex; gap: 10px; overflow-x: auto; text-align: left; padding-bottom: 6px; }
.brk .col { min-width: 150px; display: flex; flex-direction: column; justify-content: space-around; gap: 6px; }
.brk h4 { margin: 0 0 4px; font-size: 12px; color: #d9c9a8; }
.bm { background: rgba(255,255,255,.06); border-radius: 8px; padding: 4px 7px; font-size: 11.5px; }
.bm div { display: flex; justify-content: space-between; gap: 6px; }
.bm .w { color: #ffd34d; font-weight: 800; } .bm .l { color: #888; } .bm .me { color: #fff; font-weight: 900; }
.bm.cur { outline: 2px solid #ffd34d; }
.podium { display: flex; justify-content: center; align-items: flex-end; gap: 8px; margin: 10px 0; }
.podium div { background: rgba(255,255,255,.08); border-radius: 10px 10px 0 0; padding: 8px 10px; min-width: 120px; font-size: 13px; }
.podium .p1 { height: 110px; border-top: 4px solid #ffd34d; } .podium .p2 { height: 85px; border-top: 4px solid #c0c0c0; } .podium .p3 { height: 65px; border-top: 4px solid #cd7f32; }
`;
document.head.appendChild(css);

// ---------- configuration ----------
function summary(c) {
  const P = Math.max(1, Math.floor(c.n / c.size)), qual = Math.min(c.n, P * c.q);
  let size = 1; while (size < qual) size *= 2;
  const rounds = Math.log2(size), maxM = Math.ceil(c.n / P) - 1 + rounds;
  return `${P} poule${P > 1 ? 's' : ''} de ${Math.floor(c.n / P)}${c.n % P ? ' ou ' + (Math.floor(c.n / P) + 1) : ''}, ${qual} qualifiés, tableau final de ${size} (${rounds} tour${rounds > 1 ? 's' : ''}). Au maximum ${maxM} combats pour vous.`;
}
function open() {
  const opt = (key, vals, lab) => `<div class="opt"><span>${lab}</span>${vals.map(([v, t]) => `<button class="hb sm${cfg[key] === v ? ' sel' : ''}" data-k="${key}" data-v="${v}">${t}</button>`).join('')}</div>`;
  A.render(`<h2>🏆 Tournoi — configuration</h2>
    ${opt('n', [[8, '8'], [16, '16'], [32, '32'], [64, '64']], 'Participants')}
    ${opt('size', [[3, '3'], [4, '4']], 'Combattants par poule')}
    ${opt('q', [[1, '1'], [2, '2']], 'Qualifiés par poule')}
    ${opt('dur', [[120, '2 min'], [180, '3 min'], [300, '5 min']], 'Durée des combats')}
    ${opt('spread', [[0, 'Votre grade'], [1, '± 1 grade'], [2, '± 2 grades']], 'Niveau des adversaires')}
    <p>${summary(cfg)}</p>
    <p>En poule, le match nul (hikiwake) est possible. Au tableau final, une égalité se joue en <b>encho</b> : le premier point gagne.</p>
    <div class="row2"><button class="hb main" id="bGo">Commencer le tournoi</button><button class="hb" id="bBack">◀ Menu</button></div>`,
    { '.opt .hb': b => { cfg[b.dataset.k] = +b.dataset.v; try { localStorage.setItem('kendo.tcfg', JSON.stringify(cfg)); } catch (e) {} open(); }, '#bGo': create, '#bBack': A.home });
}

// ---------- création ----------
function create() {
  const g = A.prof.g, c = { ...cfg };
  const ent = [{ name: 'Vous', me: true, g }];
  names(c.n - 1).forEach(n => ent.push({ name: n, g: C(g + Math.round((Math.random() * 2 - 1) * c.spread), 0, 13), style: pick(Object.keys(A.STYLES)), color: pick(A.COLORS), kanji: pick(A.KANJI) }));
  const P = Math.max(1, Math.floor(c.n / c.size));
  const pools = Array.from({ length: P }, () => ({ ids: [], m: [] }));
  shuffle(ent.map((_, i) => i)).forEach((id, k) => pools[k % P].ids.push(id));
  for (const p of pools) for (let i = 0; i < p.ids.length; i++) for (let j = i + 1; j < p.ids.length; j++) p.m.push({ a: p.ids[i], b: p.ids[j] });
  T = { c, ent, pools, br: null, done: false };
  for (const p of pools) for (const m of p.m) if (!hasMe(m)) sim(m, true);
  poolsView();
}
const hasMe = m => m.a === 0 || m.b === 0;
const short = id => (id == null ? '—' : T.ent[id].me ? 'Vous' : T.ent[id].name);
function sim(m, draw) {
  if (m.b == null) { m.w = m.a; m.sa = m.sb = 0; m.done = true; m.bye = true; return; }
  const ga = T.ent[m.a].g, gb = T.ent[m.b].g;
  if (draw && Math.random() < .2) { m.sa = m.sb = pick([0, 0, 1]); m.w = null; m.done = true; return; }
  const aw = Math.random() < C(.5 + (ga - gb) * .12, .1, .9);
  const ws = pick([2, 2, 1]), ls = ws === 2 ? pick([0, 0, 1]) : 0;
  m.w = aw ? m.a : m.b; m.sa = aw ? ws : ls; m.sb = aw ? ls : ws; m.done = true;
}
function table(p) {
  const rows = p.ids.map(id => ({ id, w: 0, d: 0, l: 0, f: 0, ag: 0 }));
  const r = id => rows.find(x => x.id === id);
  for (const m of p.m) if (m.done) {
    const A1 = r(m.a), B1 = r(m.b); A1.f += m.sa; A1.ag += m.sb; B1.f += m.sb; B1.ag += m.sa;
    if (m.w == null) { A1.d++; B1.d++; } else if (m.w === m.a) { A1.w++; B1.l++; } else { B1.w++; A1.l++; }
  }
  rows.forEach(x => { x.pts = x.w * 2 + x.d; x.tie = Math.random(); });
  return rows.sort((x, y) => y.pts - x.pts || (y.f - y.ag) - (x.f - x.ag) || y.f - x.f || y.tie - x.tie);
}

// ---------- combats du joueur ----------
function play(m, final, done) {
  const oid = m.a === 0 ? m.b : m.a, o = T.ent[oid];
  const record = (s, a) => { if (m.a === 0) { m.sa = s; m.sb = a; } else { m.sa = a; m.sb = s; } m.w = s > a ? 0 : a > s ? oid : null; m.done = true; if (s > a) A.addWin(); };
  A.startMatch({ profile: A.profileFor(o.g, o.style), name: o.name.split(' ')[0], color: o.color, kanji: o.kanji, onEnd: (won, s, a) => {
    if (s === a && final) return encho(o, s, a, (ps, as) => { record(ps, as); done(); });
    record(s, a); done();
  } });
  game.time = T.c.dur;
}
function encho(o, s0, a0, done) {
  A.scene({ profile: A.profileFor(o.g, o.style), name: o.name.split(' ')[0], color: o.color, kanji: o.kanji, timer: false, score: true });
  showMsg('ENCHO !', 'Prolongation : le premier point gagne', 1.8);
  const badge = $('badge'); badge.innerHTML = 'ENCHO — <b>premier point gagnant</b>'; badge.style.display = 'block';
  window.hooks = { mode: 'match', ippon: z => {
    const pw = z.att === player;
    showMsg(`${A.LBL[z.type]} ARI !`, pw ? 'Vous gagnez en encho !' : `${o.name} gagne en encho`, 1.8);
    game.state = 'pause'; game.pauseT = 99;
    setTimeout(() => { if (game.state === 'over') return; game.state = 'over'; done(s0 + (pw ? 1 : 0), a0 + (pw ? 0 : 1)); }, 2000);
    return true;
  } };
}

// ---------- vue des poules ----------
function poolsView(note) {
  const mine = T.pools.findIndex(p => p.ids.includes(0)), pm = T.pools[mine];
  const next = pm.m.find(m => hasMe(m) && !m.done);
  let html = `<h2>🏆 Poules — ${T.c.n} combattants</h2>${note ? `<p>${note}</p>` : ''}`;
  html += `<div class="mlist"><b>Vos combats (poule ${POOL(mine)}) :</b>${pm.m.filter(hasMe).map(m => { const oid = m.a === 0 ? m.b : m.a, me = m.a === 0 ? m.sa : m.sb, op = m.a === 0 ? m.sb : m.sa; return `<div>${m.done ? (m.w === 0 ? '<span class="ok">✓</span>' : m.w == null ? '=' : '<span class="ko">✗</span>') : '•'} contre ${short(oid)} (${A.GRADES[T.ent[oid].g]}, ${A.STYLES[T.ent[oid].style].label.toLowerCase()})${m.done ? ` — ${me} à ${op}` : ''}</div>`; }).join('')}</div>`;
  html += '<div class="pools">' + [mine, ...T.pools.map((_, i) => i).filter(i => i !== mine)].map(i => {
    const p = T.pools[i], t = table(p), allDone = p.m.every(m => m.done);
    return `<div class="pool${i === mine ? ' me' : ''}"><h4>Poule ${POOL(i)}</h4><table>${t.map((r, k) => `<tr class="${allDone && k < T.c.q ? 'q' : ''}${r.id === 0 ? ' you' : ''}"><td>${k + 1}. ${short(r.id)}</td><td class="n">${r.pts} pts</td><td class="n">${r.w}V ${r.d}N ${r.l}D</td><td class="n">${r.f}-${r.ag}</td></tr>`).join('')}</table></div>`;
  }).join('') + '</div>';
  html += `<div class="row2">${next ? `<button class="hb main" id="bFight">Combattre ${short(next.a === 0 ? next.b : next.a)}</button>` : '<button class="hb main" id="bBr">Tableau final ▶</button>'}<button class="hb" id="bQuit">Abandonner</button></div>`;
  A.render(html, { '#bFight': () => play(next, false, () => poolsView()), '#bBr': buildBracket, '#bQuit': A.home });
}

// ---------- tableau final ----------
function seedOrder(n) { let o = [1]; while (o.length < n) { const m = o.length * 2 + 1; o = o.flatMap(x => [x, m - x]); } return o; }
function buildBracket() {
  const tabs = T.pools.map(table), firsts = tabs.map(t => t[0].id), seconds = T.c.q > 1 ? tabs.map(t => t[1] && t[1].id).filter(x => x != null) : [];
  const seeds = firsts.concat(seconds.slice(1).concat(seconds.slice(0, 1)));
  let size = 1; while (size < seeds.length) size *= 2;
  const o = seedOrder(size), r0 = [];
  for (let k = 0; k < size; k += 2) { const a = seeds[o[k] - 1], b = seeds[o[k + 1] - 1]; r0.push(a == null ? { a: b, b: null } : { a, b: b == null ? null : b }); }
  T.br = [r0]; T.out = !seeds.includes(0);
  advance();
  bracketView(T.out ? 'Vous n\'êtes pas qualifié(e) pour le tableau final.' : 'Vous êtes qualifié(e) pour le tableau final !');
}
function advance() {
  for (;;) {
    const r = T.br[T.br.length - 1];
    for (const m of r) if (!m.done && (!hasMe(m) || m.b == null)) sim(m, false);
    if (r.some(m => !m.done)) return;
    if (r.length === 1) { T.done = true; return; }
    const n = [];
    for (let k = 0; k < r.length; k += 2) n.push({ a: r[k].w, b: r[k + 1].w });
    T.br.push(n);
  }
}
function myPending() { const r = T.br[T.br.length - 1]; return r.find(m => hasMe(m) && !m.done); }
function bracketView(note) {
  const total = Math.log2(T.br[0].length * 2);
  let cols = '';
  for (let ri = 0; ri < total; ri++) {
    const r = T.br[ri] || [], left = total - 1 - ri;
    cols += `<div class="col"><h4>${RN(left)}</h4>`;
    if (!r.length) cols += '<div class="bm"><div><span>—</span></div></div>';
    for (const m of r) {
      const cls = id => (id == null ? '' : m.done ? (m.w === id ? 'w' : 'l') : '') + (id === 0 ? ' me' : '');
      cols += `<div class="bm${hasMe(m) && !m.done ? ' cur' : ''}"><div><span class="${cls(m.a)}">${short(m.a)}</span><span>${m.done && !m.bye ? m.sa : ''}</span></div><div><span class="${cls(m.b)}">${m.b == null ? '(exempt)' : short(m.b)}</span><span>${m.done && !m.bye ? m.sb : ''}</span></div></div>`;
    }
    cols += '</div>';
  }
  const pend = myPending();
  const btn = T.done ? '<button class="hb main" id="bRes">Résultats 🏆</button>'
    : pend ? `<button class="hb main" id="bFight">${RN(total - T.br.length)} : combattre ${short(pend.a === 0 ? pend.b : pend.a)}</button>`
    : '<button class="hb main" id="bSim">Voir la suite du tournoi ▶</button>';
  A.render(`<h2>🏆 Tableau final</h2>${note ? `<p>${note}</p>` : ''}<div class="brk">${cols}</div><div class="row2">${btn}<button class="hb" id="bPools">Poules</button><button class="hb" id="bQuit">Menu</button></div>`,
    { '#bFight': () => play(pend, true, () => { advance(); bracketView(pend.w === 0 ? 'Victoire ! Tour suivant.' : 'Éliminé(e)… Suivez la fin du tournoi.'); }),
      '#bSim': () => { const r = T.br[T.br.length - 1]; for (const m of r) if (!m.done) sim(m, false); advance(); bracketView(); },
      '#bRes': results, '#bPools': () => poolsReadOnly(), '#bQuit': A.home });
}
function poolsReadOnly() {
  A.render(`<h2>Poules — résultats</h2><div class="pools">${T.pools.map((p, i) => `<div class="pool${p.ids.includes(0) ? ' me' : ''}"><h4>Poule ${POOL(i)}</h4><table>${table(p).map((r, k) => `<tr class="${k < T.c.q ? 'q' : ''}${r.id === 0 ? ' you' : ''}"><td>${k + 1}. ${short(r.id)}</td><td class="n">${r.pts} pts</td><td class="n">${r.f}-${r.ag}</td></tr>`).join('')}</table></div>`).join('')}</div>
    <div class="row2"><button class="hb main" id="bBack">Tableau ▶</button></div>`, { '#bBack': () => bracketView() });
}
function results() {
  const f = T.br[T.br.length - 1][0], champ = f.w, fin = f.w === f.a ? f.b : f.a;
  const semis = T.br.length >= 2 ? T.br[T.br.length - 2].map(m => (m.w === m.a ? m.b : m.a)).filter(x => x != null) : [];
  let rank = 'sorti(e) en poule';
  if (champ === 0) rank = '🏆 Champion !'; else if (fin === 0) rank = '🥈 Finaliste'; else if (semis.includes(0)) rank = '🥉 3e place';
  else if (!T.out) { for (let ri = 0; ri < T.br.length; ri++) { const m = T.br[ri].find(hasMe); if (m && m.done && m.w !== 0) { rank = `éliminé(e) en ${RN(T.br.length - 1 - ri).toLowerCase()}`; break; } } }
  if (champ === 0 && !T.counted) { A.prof.titles++; A.addWin(); }
  T.counted = true;
  A.prof.tourneys = (A.prof.tourneys || 0) + (T.saved ? 0 : 1); T.saved = true; A.save();
  A.render(`<h2>Résultats du tournoi (${T.c.n} combattants)</h2>
    <div class="podium"><div class="p2">🥈<br>${short(fin)}</div><div class="p1">🏆<br><b>${short(champ)}</b></div><div class="p3">🥉<br>${semis.map(short).join('<br>')}</div></div>
    <p>Votre résultat : <b>${rank}</b></p><p>Chaque combat gagné compte pour votre passage de grade${champ === 0 ? ', et le titre compte double' : ''}.</p>
    <div class="row2"><button class="hb main" id="bAgain">Nouveau tournoi</button><button class="hb" id="bHome">Menu</button></div>`, { '#bAgain': open, '#bHome': A.home });
}

window.tournoi = { open, cfg: () => cfg, state: () => T, summary };
})();
