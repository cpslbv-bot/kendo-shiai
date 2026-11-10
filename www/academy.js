// Kendo Shiai v5 — académie : cursus par grade, tutoriels, shinsa complet, tournoi
(() => {
'use strict';
const $ = id => document.getElementById(id);
const C = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
const LBL = { men: 'MEN', kote: 'KOTE', do: 'DŌ', tsuki: 'TSUKI' };
const clock = () => game.clock || 0;
const fmt = n => n.replace(/(^|-)do(?=-|$)/g, '$1dō').toUpperCase();

// ================= SAUVEGARDE =================
const KEY = 'kendo.profile.v2';
const prof = (() => {
  const base = { g: 0, wins: 0, played: 0, titles: 0, stars: {}, tut: {} };
  let p = null;
  try { p = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (!p) {
    p = {};
    try { const o = JSON.parse(localStorage.getItem('kendo.profile.v1') || 'null'); if (o) { p = { g: o.g || 0, wins: o.wins || 0, titles: o.titles || 0, played: o.played || 0, stars: {} }; for (const k in (o.lessons || {})) p.stars[k === 'renzoku' ? 'kotemen' : k] = 1; } } catch (e) {}
  }
  return Object.assign(base, p);
})();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(prof)); } catch (e) {} };
const GRADES = ['6e kyu', '5e kyu', '4e kyu', '3e kyu', '2e kyu', '1er kyu', '1er dan', '2e dan', '3e dan', '4e dan', '5e dan', '6e dan', '7e dan', '8e dan'];
const NEED = [2, 2, 2, 3, 3, 3, 4, 5, 6, 7, 8, 9, 10];
const need = g => NEED[Math.min(g, NEED.length - 1)];
const addWin = () => { prof.wins++; save(); };

// ================= PROFILS D'IA =================
const EASY = { react: .12, attack: .3, think: [1.2, 2.0], sloppy: .5, seme: .08, combo: .05, zanshin: .55, flinch: .55, push: 50 };
const MASTER = { react: .82, attack: .8, think: [.4, .8], sloppy: .05, seme: .4, combo: .6, zanshin: .98, flinch: .1, push: 150 };
const STYLES = {
  attaquant:  { label: 'Attaquant',        mod: p => { p.attack *= 1.35; p.seme *= 1.4; p.react *= .7; } },
  defenseur:  { label: 'Défenseur',        mod: p => { p.react *= 1.4; p.attack *= .6; p.flinch *= .6; } },
  contre:     { label: 'Contre-attaquant', mod: p => { p.react *= 1.3; p.attack *= .75; p.dan = true; } },
  technicien: { label: 'Technicien',       mod: p => { p.combo *= 1.7; p.seme *= 1.2; } },
};
function profileFor(g, style) {
  const t = C(g / 13, 0, 1), p = {};
  for (const k in EASY) p[k] = Array.isArray(EASY[k]) ? EASY[k].map((v, i) => v + (MASTER[k][i] - v) * t) : EASY[k] + (MASTER[k] - EASY[k]) * t;
  if (style) STYLES[style].mod(p);
  for (const k of ['react', 'attack', 'seme', 'combo', 'zanshin', 'flinch']) p[k] = C(p[k], 0, .95);
  p.novice = g < 3 && style !== 'contre'; p.dan = p.dan || g >= 7;
  return p;
}
const TRAIN = { novice: true, react: 0, attack: 0, think: [9, 9], sloppy: 0, seme: 0, combo: 0, zanshin: 1, flinch: .95, push: 0 };

// ================= APPARENCE =================
const aiDo = [...ai.v.root.querySelectorAll('path')].find(p => p.getAttribute('fill') === 'url(#doRed)');
const aiZek = ai.v.root.querySelector('text');
const COLORS = ['url(#doRed)', '#1f3b2a', '#2b1f3b', '#4a2f12', '#0c0c10', '#123044'];
const KANJI = ['東', '西', '龍', '虎', '山', '川', '桜', '武', '光', '風'];
function setOpp(name, color, kanji) { $('nA').textContent = name; aiDo.setAttribute('fill', color || 'url(#doRed)'); aiZek.textContent = kanji || '赤'; }
function bokuto(on) {
  for (const f of [player, ai]) {
    const [tsuka, tsuba, blade, tsuru, naka, saki] = f.v.shinai.children;
    blade.setAttribute('fill', on ? '#9a6a3a' : '#dcc28a'); blade.setAttribute('stroke', on ? '#5e3c1c' : '#a88d55');
    tsuka.setAttribute('fill', on ? '#8a5a2b' : '#f4f0e6'); tsuka.setAttribute('stroke', on ? '#5e3c1c' : '#c9c2b0');
    saki.setAttribute('fill', on ? '#9a6a3a' : '#f6f2e8'); saki.setAttribute('stroke', on ? '#5e3c1c' : '#c9c2b0');
    tsuru.style.display = naka.style.display = on ? 'none' : ''; tsuba.setAttribute('ry', on ? 11 : 15);
  }
}

// ================= INTERFACE =================
const css = document.createElement('style');
css.textContent = `
#hub { position: fixed; inset: 0; z-index: 15; display: flex; align-items: flex-start; justify-content: center; padding: 14px; background: radial-gradient(circle at center, rgba(40,28,18,.93), rgba(0,0,0,.97)); overflow-y: auto; }
#hub .card { width: min(780px, 100%); text-align: center; margin: auto; }
#hub h1 { margin: 0; font-size: clamp(24px, 4.6vw, 40px); letter-spacing: 4px; }
#hub h1 small { display: block; font-size: .42em; color: #d9c9a8; letter-spacing: 2px; font-weight: 500; margin-top: 2px; }
#hub h2 { margin: 4px 0 8px; font-size: 20px; color: #ffd34d; }
#hub h3 { margin: 12px 0 6px; font-size: 14px; color: #d9c9a8; text-align: left; letter-spacing: 1px; }
#hub p { margin: 6px auto; max-width: 640px; color: #ddd; font-size: 13.5px; line-height: 1.5; }
#hub b { color: #ffd34d; }
.grade { display: inline-flex; gap: 12px; align-items: center; flex-wrap: wrap; justify-content: center; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.15); border-radius: 12px; padding: 6px 14px; margin: 8px 0; font-size: 13.5px; }
.grade b { font-size: 17px; }
.bar { width: 90px; height: 8px; background: rgba(255,255,255,.15); border-radius: 5px; overflow: hidden; display: inline-block; vertical-align: middle; }
.bar i { display: block; height: 100%; background: linear-gradient(90deg,#ffb300,#ffe27a); }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-top: 8px; }
.hb { border: 2px solid rgba(255,255,255,.2); background: rgba(20,20,30,.78); color: #fff; border-radius: 14px; padding: 11px 10px; font-size: 16px; font-weight: 800; text-align: center; }
.hb small { display: block; font-size: 11.5px; font-weight: 500; color: #ccc; margin-top: 3px; }
.hb.main { background: #c0392b; border-color: #e0574a; }
.hb.gold { border-color: #ffd34d; }
.hb[disabled], .hb.lock { opacity: .38; filter: grayscale(1); }
.lessons { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; text-align: left; }
.lessons .hb { text-align: left; font-size: 14.5px; padding: 8px 12px; }
.cat { border-left: 3px solid #ffd34d; padding-left: 8px; }
.cat.cur { color: #ffd34d; }
.stars { color: #ffd34d; letter-spacing: 1px; }
.stars i { color: #555; font-style: normal; }
.row2 { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 10px; }
.bracket { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: left; font-size: 12.5px; margin: 6px 0; }
.bracket h4 { margin: 0 0 4px; font-size: 13px; color: #d9c9a8; }
.m { background: rgba(255,255,255,.06); border-radius: 8px; padding: 5px 8px; margin-bottom: 5px; }
.m div { display: flex; justify-content: space-between; gap: 6px; }
.m .w { color: #ffd34d; font-weight: 800; } .m .l { color: #888; text-decoration: line-through; } .m .me { color: #fff; font-weight: 800; }
.m.cur { outline: 2px solid #ffd34d; }
.sheet { width: 100%; border-collapse: collapse; font-size: 13px; margin: 6px 0; text-align: left; }
.sheet td, .sheet th { padding: 5px 8px; border-bottom: 1px solid rgba(255,255,255,.12); }
.sheet th { color: #d9c9a8; font-weight: 600; }
.ok { color: #7ddc7d; font-weight: 800; } .ko { color: #ff6b6b; font-weight: 800; }
.req { text-align: left; max-width: 520px; margin: 6px auto; font-size: 13.5px; line-height: 1.7; }
.qa { display: grid; gap: 8px; max-width: 560px; margin: 10px auto; }
.qa .hb { text-align: left; font-size: 14.5px; font-weight: 600; }
.qa .hb.good { border-color: #7ddc7d; background: #1d3a1d; } .qa .hb.bad { border-color: #ff6b6b; background: #3a1d1d; }
#quit { position: fixed; top: max(8px, env(safe-area-inset-top)); left: max(10px, env(safe-area-inset-left)); z-index: 12; border: 1px solid rgba(255,255,255,.4); background: rgba(0,0,0,.5); color: #fff; border-radius: 10px; padding: 6px 10px; font-size: 13px; font-weight: 700; display: none; }
#skip { position: fixed; top: max(8px, env(safe-area-inset-top)); right: max(10px, env(safe-area-inset-right)); z-index: 12; border: 1px solid #ffd34d; background: rgba(0,0,0,.6); color: #ffd34d; border-radius: 10px; padding: 7px 12px; font-size: 14px; font-weight: 800; display: none; }
#badge { position: fixed; top: max(8px, env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); z-index: 11; background: rgba(0,0,0,.6); border-radius: 12px; padding: 6px 16px; font-weight: 800; font-size: 15px; display: none; white-space: nowrap; }
#badge b { color: #ffd34d; }
#cap { position: fixed; top: calc(max(8px, env(safe-area-inset-top)) + 44px); left: 50%; transform: translateX(-50%); z-index: 11; max-width: min(640px, 86vw); background: rgba(0,0,0,.72); border-left: 4px solid #ffd34d; border-radius: 8px; padding: 8px 14px; font-size: 15px; font-weight: 700; display: none; text-align: center; }
#demoTag { position: fixed; top: max(8px, env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); z-index: 11; background: #ffd34d; color: #111; border-radius: 10px; padding: 4px 14px; font-weight: 900; font-size: 13px; letter-spacing: 2px; display: none; }
#kiri { position: fixed; left: 50%; top: 60%; transform: translate(-50%, -50%); z-index: 11; width: 120px; height: 120px; display: none; align-items: center; justify-content: center; pointer-events: none; }
#kiri .core { width: 92px; height: 92px; border-radius: 50%; background: rgba(192,57,43,.85); border: 3px solid #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px; text-align: center; line-height: 1.1; }
#kiri .ring { position: absolute; width: 92px; height: 92px; border-radius: 50%; border: 4px solid #ffd34d; }
#kiri .fb { position: absolute; top: -26px; font-weight: 900; font-size: 18px; text-shadow: 0 2px 6px #000; }
#panel { position: fixed; left: 50%; bottom: max(8px, env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 13; display: none; grid-template-columns: repeat(2, minmax(200px, 1fr)); gap: 6px; width: min(640px, 92vw); }
#panel .hb { font-size: 12px; font-weight: 700; padding: 6px 10px; text-align: left; background: rgba(20,20,30,.88); }
#panel .hb.done { border-color: #7ddc7d; opacity: .5; }
#backFree { position: absolute; top: 12px; left: 12px; border: 1px solid rgba(255,255,255,.4); background: rgba(0,0,0,.5); color: #fff; border-radius: 10px; padding: 7px 12px; font-size: 14px; font-weight: 700; }
`;
document.head.appendChild(css);
const mk = (tag, id, parent = document.body) => { const e = document.createElement(tag); e.id = id; parent.appendChild(e); return e; };
const hub = mk('div', 'hub'), ui = { quit: mk('button', 'quit'), skip: mk('button', 'skip'), badge: mk('div', 'badge'), cap: mk('div', 'cap'), tag: mk('div', 'demoTag'), kiri: mk('div', 'kiri'), panel: mk('div', 'panel') };
ui.quit.textContent = '✕ Quitter'; ui.skip.textContent = 'Passer ⏭'; ui.tag.textContent = 'DÉMONSTRATION';
ui.kiri.innerHTML = '<div class="ring"></div><div class="core"></div><div class="fb"></div>';
const backFree = mk('button', 'backFree', $('menu')); backFree.textContent = '◀ Menu'; backFree.onclick = () => home();
ui.quit.onclick = () => { token++; game.state = 'over'; showMsg('', ''); home(); };
function cap(t) { ui.cap.innerHTML = t || ''; ui.cap.style.display = t ? 'block' : 'none'; }
function hint(list) { document.querySelectorAll('.btn').forEach(b => b.classList.toggle('hint', list.includes(b.dataset.k))); }
function showHUD(timer, score) {
  $('timer').style.visibility = timer ? 'visible' : 'hidden';
  for (const id of ['pS', 'pA', 'mS', 'mA', 'hS', 'hA']) $(id).style.visibility = score ? 'visible' : 'hidden';
  $('score').style.display = timer || score ? '' : 'none';
}
function render(html, binds) {
  hub.innerHTML = `<div class="card">${html}</div>`; hub.style.display = 'flex'; hub.scrollTop = 0;
  $('menu').style.display = 'none'; for (const k of ['quit', 'skip', 'badge', 'tag']) ui[k].style.display = 'none';
  cap(''); hint([]); ui.kiri.style.display = 'none'; ui.panel.style.display = 'none';
  for (const [sel, fn] of Object.entries(binds || {})) hub.querySelectorAll(sel).forEach(b => { if (!b.disabled && !b.classList.contains('lock')) b.onclick = () => fn(b); });
}
const starsHTML = n => `<span class="stars">${'★'.repeat(n)}<i>${'★'.repeat(3 - n)}</i></span>`;

// ================= ÉTAT DES ACTIVITÉS =================
let token = 0, act = null, lastSeme = -9;
const origSemed = aiBrain.onSemed;
const origSemeFn = player.seme.bind(player);
player.seme = function () { const r = origSemeFn(); if (r) lastSeme = clock(); return r; };
function clearAll() {
  window.hooks = null; act = null; aiBrain.onSemed = origSemed; game.timeScale = 1;
  keys.fwd = keys.back = keys.guard = false; player.bow = ai.bow = player.crouch = ai.crouch = 0;
  ST.on = false; bokuto(false); cap(''); hint([]);
  for (const k of ['skip', 'tag']) ui[k].style.display = 'none';
  ui.kiri.style.display = 'none'; ui.panel.style.display = 'none';
}
function scene(o = {}) {
  hub.style.display = 'none'; $('menu').style.display = 'none'; clearAll();
  LEVELS[3] = o.profile || TRAIN; game.level = 3;
  setOpp(o.name || 'Motodachi', o.color || '#4a2f12', o.kanji || '師');
  showHUD(!!o.timer, !!o.score);
  ui.quit.style.display = 'block'; ui.badge.style.display = o.badge ? 'block' : 'none';
  sfx.init(); game.start();
  if (o.time) game.time = o.time; else if (!o.timer) game.time = 99999;
  if (o.quiet) { showMsg('', ''); game.pauseT = .3; }
  return ++token;
}
let lastTick = performance.now();
function tick(now) {
  const dt = Math.min(.05, (now - lastTick) / 1000) * (game.timeScale || 1); lastTick = now;
  if (act && act.tick) act.tick(dt);
  monitor(dt);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ---------- statistiques (jitsugi, leçons) ----------
const ST = { on: false }, LS = { attempts: 0 };
let prevState = '', lastZ = null;
function statsReset() { Object.assign(ST, { on: true, att: 0, good: 0, valid: 0, ippon: 0, opp: 0, tori: 0, zok: 0, seme: 0, opened: 0, retreat: 0, time: 0, hans: 0, ki: 0, kiN: 0 }); }
const _resolve = game.resolveHit.bind(game);
game.resolveHit = function (att, a) {
  const d = Math.abs(player.x - ai.x);
  if (window.hooks && hooks.preHit && hooks.preHit(att, a)) { if (att === player) LS.attempts++; return; }
  _resolve(att, a);
  if (att !== player) return;
  LS.attempts++;
  if (ST.on) { ST.att++; if (d >= IDEAL - 110 && d <= IDEAL + 120) ST.good++; if (game.state === 'zanshin') ST.valid++; }
};
const _onSeme = game.onSeme.bind(game);
game.onSeme = function (f) { const o = ai.openT; _onSeme(f); if (f === player && ST.on) { ST.seme++; if (ai.openT > o) ST.opened++; } };
const _hans = game.hansoku.bind(game);
game.hansoku = function (f) { if (window.hooks && hooks.noHansoku) return; if (f === player && ST.on && game.state === 'fight') ST.hans++; _hans(f); };
function monitor(dt) {
  if (game.state === 'zanshin') lastZ = game.z;
  if (prevState === 'zanshin' && game.state !== 'zanshin' && lastZ && lastZ.att === player && ST.on) { if (game.state === 'fight') ST.tori++; else ST.zok++; }
  prevState = game.state;
  if (ST.on && game.state === 'fight') { ST.time += dt; if (player.vel * player.dir < -1) ST.retreat += dt; ST.ki += player.kiai; ST.kiN++; }
}

// ================= DÉMONSTRATIONS =================
const D = {
  approach: (d = 540) => [{ cap: 'Placez-vous à <b>issoku-ittō</b> : les pointes des shinai se croisent', hint: ['fwd'] }, { approach: d }, { hint: [] }, { wait: .5 }],
  strike: (t, txt) => [{ cap: txt, hint: [t] }, { wait: .7 }, { strike: t }, { wait: .35 }],
  zanshin: () => [{ cap: '<b>Zanshin</b> : juste après la touche, reculez ◀ en restant vigilant', hint: ['back'] }, { zanshin: true }, { wait: 1.6 }, { hint: [] }],
  attack: (aiT, resp, delay, txt) => [{ cap: 'Restez à distance et observez le motodachi…' }, { approach: 580 }, { wait: .8 }, { cap: `Le motodachi attaque <b>${LBL[aiT]}</b>…` }, { wait: .5 }, { aiStrike: aiT }, { wait: delay }, { cap: txt, hint: [resp] }, { strike: resp }, { wait: .35 }],
};

// ================= LEÇONS (cursus par grade) =================
const L = [
  // --- Programme 6e kyu -> 5e kyu
  { id: 'reigi', g: 0, kind: 'reigi', title: 'Reigi — l\'étiquette', text: 'Le kendo commence et finit par le respect. Remettez dans l\'ordre les étapes de l\'étiquette d\'un combat : entrée, salut, sonkyo, combat, puis sortie.' },
  { id: 'maai', g: 0, kind: 'maai', goal: 3, title: 'Maai — la distance', text: 'Trouvez <b>issoku-ittō no maai</b> : la distance où les pointes des shinai se croisent, d\'où l\'on peut frapper en un pas. Restez immobile 2 secondes à la bonne distance. Le partenaire changera de place 3 fois.' },
  { id: 'kiri', g: 0, kind: 'kiri', title: 'Kirikaeshi', text: 'Exercice fondamental : un <b>shōmen</b>, puis des <b>sayū-men</b> (men en diagonale, à gauche puis à droite) en avançant 4 fois et en reculant 5 fois, puis un shōmen final. Appuyez sur <b>MEN</b> au moment où le cercle jaune se referme, en gardant le rythme.' },
  { id: 'men', g: 0, goal: 4, title: 'Men uchi', check: z => z.type === 'men', text: 'Le motodachi vous offre le men. Placez-vous à la bonne distance puis frappez <b>MEN</b> en avançant (fumikomi). Juste après la touche, montrez votre <b>zanshin</b> (◀ ou GARDE), sinon le point est annulé.',
    demo: [...D.approach(), ...D.strike('men', 'Frappez <b>MEN</b> en avançant (fumikomi)'), ...D.zanshin()] },
  { id: 'kote', g: 0, goal: 3, title: 'Kote uchi', check: z => z.type === 'kote', text: 'Frappez le poignet droit du motodachi avec <b>KOTE</b>. Même distance que pour le men, geste plus court. Zanshin après chaque point.',
    demo: [...D.approach(), ...D.strike('kote', 'Frappez <b>KOTE</b> : petit geste rapide vers le poignet'), ...D.zanshin()] },
  { id: 'do', g: 0, goal: 3, title: 'Dō uchi', check: z => z.type === 'do', guardCycle: true, text: 'Le motodachi lève régulièrement les bras : le men et le kote sont protégés, mais le flanc est ouvert. Frappez <b>DŌ</b> à ce moment-là.',
    demo: [...D.approach(), { cap: 'Le motodachi lève les bras : le flanc s\'ouvre…' }, { aiGuard: true }, { wait: .5 }, ...D.strike('do', 'Frappez <b>DŌ</b> en diagonale sur le flanc'), { aiGuard: false }, ...D.zanshin()] },
  // --- Programme 5e kyu -> 4e kyu
  { id: 'uchikomi', g: 1, goal: 5, cue: true, title: 'Uchikomi-geiko', check: (z, st) => z.type === st.cue, text: 'Le motodachi ouvre une cible différente à chaque fois (annoncée à l\'écran). Frappez la bonne cible le plus vite possible, avec zanshin.',
    demo: [...D.approach(), { cap: 'Annonce : <b>MEN</b> — le men est ouvert' }, ...D.strike('men', 'Frappez <b>MEN</b>'), ...D.zanshin(), { setup: 1 }, { wait: 1 }, { cap: 'Annonce : <b>DŌ</b> — le motodachi lève les bras' }, { aiGuard: true }, ...D.approach(), ...D.strike('do', 'Frappez <b>DŌ</b>'), { aiGuard: false }, ...D.zanshin()] },
  { id: 'kotemen', g: 1, goal: 3, firstBlock: true, title: 'Renzoku-waza : kote-men', check: z => z.name.includes('kote-men'), text: 'Frappez <b>KOTE</b> puis, juste après l\'impact, <b>MEN</b>. C\'est l\'enchaînement le plus classique : c\'est le men final qui doit marquer.',
    demo: [...D.approach(560), { cap: '1. Frappez <b>KOTE</b>…', hint: ['kote'] }, { wait: .6 }, { strike: 'kote' }, { wait: .33 }, { cap: '2. …puis aussitôt <b>MEN</b>', hint: ['men'] }, { strike: 'men' }, { wait: .35 }, ...D.zanshin()] },
  // --- Programme 4e kyu -> 3e kyu
  { id: 'seme', g: 2, goal: 3, seme: true, title: 'Seme et ouverture', check: () => clock() - lastSeme < 2.5, text: 'Mettez la pression avec <b>SEME</b> : le motodachi se déstabilise un court instant. Frappez aussitôt pendant cette ouverture.',
    demo: [...D.approach(560), { cap: '1. <b>SEME</b> : avancez la pointe pour mettre la pression', hint: ['seme'] }, { wait: .6 }, { seme: true }, { wait: .5 }, ...D.strike('kote', '2. Il se déstabilise : frappez <b>KOTE</b> !'), ...D.zanshin()] },
  { id: 'hiki', g: 2, goal: 3, tsuba: true, title: 'Tsubazeriai et hiki-waza', check: z => z.name.startsWith('hiki-'), text: 'Vous commencez au contact, shinai croisés (<b>tsubazeriai</b>). Frappez MEN, KOTE ou DŌ : vous reculerez en frappant (<b>hiki-waza</b>). Gardez le zanshin en reculant.',
    demo: [{ cap: 'Au contact, shinai croisés : c\'est le <b>tsubazeriai</b>' }, { wait: 1.4 }, ...D.strike('men', 'Frappez <b>MEN</b> en reculant : hiki-men'), ...D.zanshin()] },
  { id: 'harai', g: 2, goal: 3, noFlinch: true, title: 'Harai-men', check: z => z.name === 'harai-men', text: 'Chassez le shinai adverse pour ouvrir le centre, puis frappez men : appuyez sur <b>SEME</b>, puis sur <b>MEN</b> juste après (moins d\'une demi-seconde).',
    demo: [...D.approach(560), { cap: '1. <b>SEME</b> : chassez le shinai adverse (harai)', hint: ['seme'] }, { wait: .6 }, { seme: true }, { wait: .5 }, { cap: '2. Le centre est ouvert : <b>MEN</b> tout de suite', hint: ['men'] }, { strike: 'men' }, { wait: .35 }, ...D.zanshin()] },
  // --- Programme 3e kyu -> 2e kyu
  { id: 'debanakote', g: 3, goal: 3, aiAttack: 'men', title: 'Debana-kote', check: z => z.name === 'debana-kote', text: 'Le motodachi attaque men de temps en temps. Frappez <b>KOTE</b> dès qu\'il commence à lever le shinai : son poignet est alors exposé.',
    demo: D.attack('men', 'kote', .05, 'Dès qu\'il lève le shinai : <b>KOTE</b> !').concat(D.zanshin()) },
  { id: 'kotedo', g: 3, goal: 3, firstBlock: true, title: 'Renzoku-waza : kote-dō', check: z => z.name.includes('kote-do'), text: 'Frappez <b>KOTE</b> : l\'adversaire lève les mains pour se protéger, son flanc s\'ouvre. Enchaînez aussitôt <b>DŌ</b>.',
    demo: [...D.approach(560), { cap: '1. <b>KOTE</b>…', hint: ['kote'] }, { wait: .6 }, { strike: 'kote' }, { wait: .33 }, { cap: '2. …puis <b>DŌ</b> sur le flanc ouvert', hint: ['do'] }, { strike: 'do' }, { wait: .35 }, ...D.zanshin()] },
  { id: 'kakari', g: 3, goal: 4, timeLimit: 30, randomGuard: true, title: 'Kakari-geiko', check: () => true, text: 'Attaquez sans arrêt pendant <b>30 secondes</b> : le motodachi change sa garde. Marquez au moins 4 points valables (avec zanshin) avant la fin du temps.',
    demo: [...D.approach(), ...D.strike('men', 'Attaquez sans attendre : <b>MEN</b>'), ...D.zanshin(), { setup: 1 }, { wait: .6 }, { aiGuard: true }, ...D.approach(), ...D.strike('do', 'Garde levée : <b>DŌ</b>'), { aiGuard: false }, ...D.zanshin()] },
  { id: 'gakka1', g: 3, kind: 'gakka', n: 6, title: 'Gakka — révisions', text: 'Questions sur les règles, le vocabulaire et l\'esprit du kendo. Il faut 4 bonnes réponses sur 6.' },
  // --- Programme 2e kyu -> 1er kyu
  { id: 'nukido', g: 4, goal: 3, aiAttack: 'men', title: 'Nuki-dō (ōji-waza)', check: z => z.name === 'nuki-dō', text: 'Le motodachi attaque men. Répondez par <b>DŌ</b> pendant son attaque : vous esquivez en passant sous son shinai. Ni trop tôt, ni trop tard (environ 0,1 s après son départ).',
    demo: D.attack('men', 'do', .1, 'Pendant son attaque : <b>DŌ</b> en esquivant !').concat(D.zanshin()) },
  { id: 'debanamen', g: 4, goal: 3, aiAttack: 'men', title: 'Debana-men', check: z => z.name === 'debana-men', text: 'Frappez <b>MEN</b> au tout début de l\'attaque du motodachi, dès qu\'il bouge : c\'est le debana. Plus tard, ce serait un suriage.',
    demo: D.attack('men', 'men', .08, 'Il démarre : <b>MEN</b> immédiatement !').concat(D.zanshin()) },
  { id: 'tsuki', g: 4, goal: 3, seme: true, title: 'Tsuki', check: z => z.type === 'tsuki', text: 'La frappe à la gorge est difficile à faire valider. Créez d\'abord une ouverture avec <b>SEME</b>, puis piquez avec <b>TSUKI</b>, bras tendus.',
    demo: [...D.approach(560), { cap: '1. <b>SEME</b> pour ouvrir la garde', hint: ['seme'] }, { wait: .6 }, { seme: true }, { wait: .5 }, ...D.strike('tsuki', '2. <b>TSUKI</b> : piquez droit à la gorge'), ...D.zanshin()] },
  // --- Programme 1er kyu -> 1er dan
  { id: 'suriage', g: 5, goal: 3, aiAttack: 'men', title: 'Suriage-men', check: z => z.name === 'suriage-men', text: 'Le motodachi attaque men. Laissez-le venir, puis répondez <b>MEN</b> un peu plus tard qu\'en debana : votre shinai dévie le sien en remontant (suriage) et frappe.',
    demo: D.attack('men', 'men', .16, 'Il arrive : remontez et frappez <b>MEN</b> (suriage) !').concat(D.zanshin()) },
  { id: 'kaeshido', g: 5, goal: 3, aiAttack: 'men', title: 'Kaeshi-dō', check: z => z.name === 'kaeshi-dō', text: 'Maintenez <b>GARDE</b> pour recevoir le men du motodachi, puis relâchez et frappez <b>DŌ</b> aussitôt (moins de 0,7 s) : vous retournez le shinai pour couper le flanc.',
    demo: [{ cap: 'Restez à distance et observez le motodachi…' }, { approach: 580 }, { wait: .6 }, { cap: '1. Maintenez <b>GARDE</b> pour recevoir son men', hint: ['guard'] }, { guard: true }, { wait: .5 }, { aiStrike: 'men' }, { wait: .36 }, { guard: false }, { cap: '2. Retournez le shinai : <b>DŌ</b> !', hint: ['do'] }, { strike: 'do' }, { wait: .35 }, ...D.zanshin()] },
  { id: 'kata13', g: 5, kind: 'kata', list: ['k1', 'k2', 'k3'], title: 'Nihon Kendo Kata 1 à 3', text: 'Les kata se pratiquent au <b>bokutō</b> (sabre en bois). Le motodachi joue <b>uchidachi</b> (il attaque) et vous <b>shidachi</b> (vous répondez). Appuyez sur le bon bouton au bon moment. Version simplifiée.' },
  // --- Programme 1er dan -> 2e dan
  { id: 'kotenuki', g: 6, goal: 3, aiAttack: 'kote', title: 'Kote-nuki-men', check: z => z.name === 'kote-nuki-men', text: 'Le motodachi attaque kote. Levez le shinai pour esquiver en frappant <b>MEN</b> pendant son attaque.',
    demo: D.attack('kote', 'men', .1, 'Esquivez son kote en frappant <b>MEN</b> !').concat(D.zanshin()) },
  { id: 'kata45', g: 6, kind: 'kata', list: ['k4', 'k5'], title: 'Nihon Kendo Kata 4 et 5', text: 'Kata 4 (hassō contre waki-gamae, maki-kaeshi) et kata 5 (suriage-men contre jōdan). Version simplifiée.' },
  // --- Programme 2e dan -> 3e dan
  { id: 'kata67', g: 7, kind: 'kata', list: ['k6', 'k7'], title: 'Nihon Kendo Kata 6 et 7', text: 'Kata 6 (suriage-kote) et kata 7 (nuki-dō en passant). Version simplifiée.' },
  { id: 'gakka2', g: 7, kind: 'gakka', n: 8, title: 'Gakka — niveau dan', text: 'Questions de niveau dan : kata, arbitrage, principes. Il faut 6 bonnes réponses sur 8.' },
  // --- Programme 3e dan -> 4e dan
  { id: 'kodachi', g: 8, kind: 'kata', list: ['kd1', 'kd2', 'kd3'], title: 'Kodachi no kata 1 à 3', text: 'Les trois kata du sabre court (kodachi) contre le sabre long : recevoir, contrôler, sans reculer. Version simplifiée.' },
];
const byId = id => L.find(l => l.id === id);

// ================= KATA =================
const KATA = {
  k1: { name: 'Ippon-me', steps: [{ ai: 'men', key: 'back', label: 'Esquivez en reculant (nuki)' }, { key: 'men', label: 'Uchidachi a manqué : frappez MEN' }, { key: 'guard', label: 'Zanshin en jōdan : levez la garde' }] },
  k2: { name: 'Nihon-me', steps: [{ ai: 'kote', key: 'back', label: 'Esquivez le kote en reculant' }, { key: 'kote', label: 'Frappez KOTE' }] },
  k3: { name: 'Sanbon-me', steps: [{ ai: 'tsuki', key: 'guard', label: 'Recevez le tsuki (ireru-zuki)' }, { key: 'tsuki', label: 'Contre-tsuki' }, { key: 'fwd', label: 'Avancez en pressant (seme)' }] },
  k4: { name: 'Yonhon-me', steps: [{ ai: 'men', key: 'men', label: 'Ai-uchi : frappez MEN en même temps' }, { ai: 'tsuki', key: 'guard', label: 'Enroulez son sabre (maki-kaeshi)' }, { key: 'men', label: 'Frappez MEN' }] },
  k5: { name: 'Gohon-me', steps: [{ ai: 'men', key: 'men', label: 'Suriage : remontez et frappez MEN' }, { key: 'back', label: 'Zanshin en reculant' }] },
  k6: { name: 'Roppon-me', steps: [{ key: 'seme', label: 'Montez au chūdan en pressant (seme)' }, { ai: 'kote', key: 'kote', label: 'Suriage-kote' }, { key: 'guard', label: 'Zanshin' }] },
  k7: { name: 'Nanahon-me', steps: [{ ai: 'tsuki', key: 'guard', label: 'Recevez le tsuki (nayashi)' }, { ai: 'men', key: 'do', label: 'Nuki-dō en passant' }] },
  kd1: { name: 'Kodachi ippon-me', steps: [{ ai: 'men', key: 'guard', label: 'Uke-nagashi : faites glisser son men' }, { key: 'men', label: 'Frappez MEN' }] },
  kd2: { name: 'Kodachi nihon-me', steps: [{ ai: 'men', key: 'guard', label: 'Uke-nagashi' }, { key: 'men', label: 'Frappez MEN' }, { key: 'fwd', label: 'Contrôlez le bras (osae)' }] },
  kd3: { name: 'Kodachi sanbon-me', steps: [{ ai: 'men', key: 'guard', label: 'Suri-otoshi' }, { ai: 'do', key: 'guard', label: 'Suri-nagashi' }, { key: 'fwd', label: 'Contrôlez le bras (osae)' }] },
};
const KEYNAME = { back: '◀', fwd: '▶', men: 'MEN', kote: 'KOTE', do: 'DŌ', tsuki: 'TSUKI', guard: 'GARDE', seme: 'SEME' };

// ================= REIGI =================
const REIGI = [
  'Entrer et se placer au bord du terrain', 'Ritsurei : se saluer debout (15°)', 'Avancer de trois pas en dégainant', 'Sonkyo : s\'accroupir, shinai en chūdan',
  'Se lever au « Hajime ! » et combattre', 'Après « Shōbu ari » : sonkyo et osame-tō', 'Se lever et reculer de cinq petits pas', 'Ritsurei final, puis sortir',
];

// ================= GAKKA (questions) =================
const QS = [
  { g: 0, q: 'Que signifie « kendo » ?', a: ['La voie du sabre', 'L\'art du bâton', 'Le combat à mains nues', 'La danse du sabre'] },
  { g: 0, q: 'Combien de drapeaux faut-il pour un ippon ?', a: ['2 sur 3', '1 sur 3', '3 sur 3', '4 sur 5'] },
  { g: 0, q: 'Quelles sont les cibles valables ?', a: ['Men, kote, dō, tsuki', 'Men, épaules, dō', 'Kote, genoux, men', 'Tout le corps'] },
  { g: 0, q: 'Qu\'est-ce que le zanshin ?', a: ['La vigilance physique et mentale après la frappe', 'Le salut de fin', 'La position accroupie', 'La garde haute'] },
  { g: 0, q: 'Que veut dire « Hajime » ?', a: ['Commencez', 'Arrêtez', 'Saluez', 'Séparez-vous'] },
  { g: 0, q: 'Le salut debout s\'appelle…', a: ['Ritsurei', 'Zarei', 'Sonkyo', 'Mokuso'] },
  { g: 0, q: 'La garde la plus courante est…', a: ['Chūdan no kamae', 'Jōdan no kamae', 'Gedan no kamae', 'Hassō no kamae'] },
  { g: 0, q: 'Que veut dire « Yame » ?', a: ['Arrêtez', 'Commencez', 'Point accordé', 'Prolongation'] },
  { g: 1, q: 'Que signifie ki-ken-tai-ichi ?', a: ['L\'unité de l\'esprit, du sabre et du corps', 'Frapper quatre fois', 'Le salut au drapeau', 'La distance lointaine'] },
  { g: 1, q: 'Quelle partie du shinai doit toucher ?', a: ['Le monouchi (tiers avant)', 'La tsuka (poignée)', 'La tsuba', 'N\'importe quelle partie'] },
  { g: 1, q: 'Qu\'est-ce que issoku-ittō no maai ?', a: ['La distance d\'un pas pour frapper ou esquiver', 'La distance au contact', 'La distance hors de portée', 'La ligne de départ'] },
  { g: 1, q: 'Qu\'est-ce que le kirikaeshi ?', a: ['Shōmen et sayū-men enchaînés au rythme', 'Une frappe en reculant', 'Un salut', 'Un kata'] },
  { g: 1, q: 'Le mokuso, c\'est…', a: ['La méditation au début et à la fin du keiko', 'Le cri de la frappe', 'Le rangement du bōgu', 'La sortie du terrain'] },
  { g: 2, q: 'Que se passe-t-il après 2 hansoku ?', a: ['L\'adversaire marque 1 point', 'Le combat est perdu', 'Rien', 'Prolongation'] },
  { g: 2, q: 'Le jōgai, c\'est…', a: ['Sortir du terrain', 'Lâcher le shinai', 'Frapper l\'arbitre', 'Saluer en retard'] },
  { g: 2, q: 'L\'arbitre principal s\'appelle…', a: ['Shushin', 'Fukushin', 'Sensei', 'Motodachi'] },
  { g: 2, q: 'Le terrain de compétition mesure…', a: ['De 9 à 11 m de côté', '5 m de côté', '20 m de côté', '15 × 8 m'] },
  { g: 2, q: 'Qu\'est-ce que le seme ?', a: ['Mettre la pression pour créer une ouverture', 'Reculer pour se protéger', 'Le salut final', 'Une faute'] },
  { g: 3, q: 'Les hiki-waza sont…', a: ['Des frappes en reculant depuis le tsubazeriai', 'Des contre-attaques', 'Des kata', 'Des frappes sautées'] },
  { g: 3, q: 'Le debana-waza consiste à…', a: ['Frapper au moment où l\'adversaire commence son attaque', 'Frapper après son attaque', 'Attendre la fin du temps', 'Pousser hors du terrain'] },
  { g: 3, q: 'Les ōji-waza sont…', a: ['Des techniques de contre-attaque', 'Des techniques d\'attaque', 'Des saluts', 'Des exercices d\'échauffement'] },
  { g: 3, q: 'Encho signifie…', a: ['Prolongation', 'Match nul', 'Faute', 'Fin du combat'] },
  { g: 3, q: 'Hikiwake signifie…', a: ['Match nul', 'Victoire', 'Prolongation', 'Séparation'] },
  { g: 3, q: 'Durée d\'un combat officiel individuel adulte ?', a: ['5 minutes', '2 minutes', '10 minutes', 'Sans limite'] },
  { g: 5, q: 'Combien de kata compte le Nihon Kendo Kata ?', a: ['10 (7 tachi + 3 kodachi)', '7', '12', '5'] },
  { g: 5, q: 'Dans les kata, uchidachi est…', a: ['Celui qui attaque et guide (rôle du senior)', 'Celui qui répond', 'L\'arbitre', 'Le spectateur'] },
  { g: 5, q: 'Avec quelle arme pratique-t-on les kata ?', a: ['Le bokutō (sabre en bois)', 'Le shinai', 'Le bō', 'Le tantō en métal'] },
  { g: 5, q: 'Dans ippon-me, uchidachi attaque depuis…', a: ['Hidari jōdan', 'Gedan', 'Waki-gamae', 'Hassō'] },
  { g: 6, q: 'Que signifie sutemi ?', a: ['S\'engager totalement dans la frappe', 'Se protéger', 'Feinter', 'Reculer'] },
  { g: 6, q: 'Le riai désigne…', a: ['La logique et la justesse d\'une technique', 'La force de la frappe', 'Le cri', 'Le matériel'] },
  { g: 7, q: 'Les kata kodachi opposent…', a: ['Un sabre court à un sabre long', 'Deux sabres courts', 'Un bâton à un sabre', 'Deux sabres longs'] },
  { g: 7, q: 'Que signifie sen no sen ?', a: ['Prendre l\'initiative au moment où l\'adversaire veut attaquer', 'Attendre la fin de son attaque', 'Fuir', 'Saluer en premier'] },
];

// ================= ACCUEIL =================
function catLessons(g) { return L.filter(l => l.g === g); }
function reqStatus() {
  const ls = catLessons(prof.g), done = ls.filter(l => prof.stars[l.id]).length, n = need(prof.g);
  return { ls, done, n, wins: Math.min(prof.wins, n), ok: done === ls.length && prof.wins >= n };
}
function home() {
  token++; clearAll(); game.state = 'over'; showMsg('', ''); showHUD(true, true); setOpp('IA');
  const max = prof.g >= GRADES.length - 1, r = reqStatus();
  render(`
    <h1>KENDO SHIAI<small>剣道 試合 — v6</small></h1>
    <div class="grade">Grade <b>${GRADES[prof.g]}</b>
      ${max ? '<span>Grade maximal</span>' : `<span>Leçons ${r.done}/${r.ls.length}</span><span class="bar"><i style="width:${r.ls.length ? r.done / r.ls.length * 100 : 100}%"></i></span><span>Victoires ${r.wins}/${r.n}</span><span class="bar"><i style="width:${r.wins / r.n * 100}%"></i></span>`}
    </div>
    <div class="grid">
      <button class="hb" id="bDojo">道場 DOJO<small>Cursus par grade · ${Object.keys(prof.stars).length}/${L.length} leçons</small></button>
      <button class="hb gold" id="bTour">🏆 TOURNOI<small>Poules + tableau final, 8 à 64 combattants · ${prof.titles} titre${prof.titles > 1 ? 's' : ''}</small></button>
      <button class="hb ${r.ok && !max ? 'main' : ''}" id="bShin">審査 SHINSA<small>${max ? 'Vous êtes au sommet' : r.ok ? `Passer le ${GRADES[prof.g + 1]}` : 'Voir le programme de l\'examen'}</small></button>
      <button class="hb" id="bFree">⚔ COMBAT LIBRE<small>Débutant, Kyu ou Dan</small></button>
      <button class="hb" id="bCust">🎨 MON KENDOKA<small>Couleurs, nom, drapeau</small></button>
    </div>
    <p>Réussissez les leçons de votre grade et gagnez des combats pour vous présenter au shinsa.</p>`,
    { '#bDojo': dojo, '#bTour': () => (window.tournoi ? tournoi.open() : tournament()), '#bShin': max ? home : shinsaIntro, '#bFree': free, '#bCust': () => window.custom && custom.open() });
}

// ================= DOJO =================
function dojo() {
  let html = '<h1>道場 DOJO<small>Cursus du kendo, classé par grade</small></h1>';
  const cats = [...new Set(L.map(l => l.g))];
  for (const g of cats) {
    const locked = g > prof.g;
    html += `<h3 class="cat${g === prof.g ? ' cur' : ''}">${g === prof.g ? '▶ ' : ''}Programme ${GRADES[g]} → ${GRADES[g + 1]}${locked ? ` · 🔒 débloqué au ${GRADES[g]}` : ''}</h3><div class="lessons">`;
    for (const l of catLessons(g)) {
      const s = prof.stars[l.id] || 0;
      html += `<button class="hb${locked ? ' lock' : ''}" data-id="${l.id}">${l.title}<small>${locked ? '🔒 Verrouillé' : s ? starsHTML(s) : 'À faire'}</small></button>`;
    }
    html += '</div>';
  }
  html += '<div class="row2"><button class="hb" id="bBack">◀ Retour</button></div>';
  render(html, { '.lessons .hb': b => lessonIntro(byId(b.dataset.id)), '#bBack': home });
}
function lessonIntro(l) {
  const seen = prof.tut[l.id];
  const hasDemo = l.kind !== 'gakka';
  render(`<h2>${l.title}</h2><p>${l.text}</p>
    <div class="row2">${hasDemo ? `<button class="hb ${seen ? '' : 'main'}" id="bDemo">▶ Voir la démonstration</button>` : ''}<button class="hb ${seen || !hasDemo ? 'main' : ''}" id="bGo">${hasDemo ? 'Passer ⏭ et commencer' : 'Commencer'}</button><button class="hb" id="bBack">◀ Dojo</button></div>`,
    { '#bDemo': () => runDemo(l, () => startLesson(l)), '#bGo': () => startLesson(l), '#bBack': dojo });
}
function lessonDone(l, stars, msg) {
  if (stars) { prof.stars[l.id] = Math.max(prof.stars[l.id] || 0, stars); save(); }
  const i = L.indexOf(l), next = L[i + 1], nextOk = next && next.g <= prof.g;
  render(`<h2>${stars ? '✓ Leçon réussie' : 'Leçon non réussie'}</h2><p>${l.title} — ${msg}</p>${stars ? `<p style="font-size:26px">${starsHTML(stars)}</p>` : ''}
    <div class="row2">${!stars ? '<button class="hb main" id="bRe">Réessayer</button>' : ''}${stars && nextOk ? '<button class="hb main" id="bNext">Leçon suivante ▶</button>' : ''}${stars ? '<button class="hb" id="bRe">Refaire</button>' : ''}<button class="hb" id="bDojo">Dojo</button></div>`,
    { '#bNext': () => lessonIntro(next), '#bRe': () => startLesson(l), '#bDojo': dojo });
}
function startLesson(l) {
  prof.tut[l.id] = true; save();
  const done = r => lessonDone(l, r.stars, r.msg);
  if (l.kind === 'maai') return runMaai(l, done);
  if (l.kind === 'kiri') return runKiri({ onDone: sc => done({ stars: sc >= 85 ? 3 : sc >= 70 ? 2 : sc >= 55 ? 1 : 0, msg: `Rythme et précision : ${sc} %` }) });
  if (l.kind === 'kata') return runKata(l.list, { learn: true, onDone: sc => done({ stars: sc >= 100 ? 3 : sc >= 75 ? 2 : sc >= 50 ? 1 : 0, msg: `Gestes justes : ${sc} %` }) });
  if (l.kind === 'reigi') return runReigi({ onDone: err => done({ stars: err === 0 ? 3 : err <= 1 ? 2 : err <= 3 ? 1 : 0, msg: `${err} erreur${err > 1 ? 's' : ''}` }) });
  if (l.kind === 'gakka') return runGakka(l.n, l.g, sc => done({ stars: sc >= 100 ? 3 : sc >= 80 ? 2 : sc >= 65 ? 1 : 0, msg: `${sc} % de bonnes réponses` }));
  runTech(l, { onDone: r => done(r) });
}

// ---------- comportements communs du motodachi ----------
function lessonRules(l, h) {
  if (l.seme) aiBrain.onSemed = () => { ai.openT = 1.0; showMsg('', 'Le motodachi est déstabilisé — frappez !', .8); };
  if (l.noFlinch) aiBrain.onSemed = () => {};
  if (l.firstBlock) h.preHit = (att, a) => {
    if (att !== player || a.type !== 'kote' || a.chained) return false;
    a.fail = true; sfx.clack(); const [x, y] = att.tip(); spark(x, y, false); showMsg('', 'Le motodachi pare le kote… enchaînez !', .8); return true;
  };
  return h;
}

// ---------- leçon technique (et commande d'examen kihon) ----------
function runTech(l, o) {
  const goal = o.goal || l.goal;
  const my = scene({ badge: !o.exam, timer: !!l.timeLimit, time: l.timeLimit });
  const st = { count: 0, flags: 0, ax: 0, cycle: 0, atk: 1.6, cue: null, t: 0, done: false };
  LS.attempts = 0;
  const badge = () => { ui.badge.innerHTML = `${o.exam ? 'Kihon' : l.title} — <b>${st.count}/${goal}</b>`; ui.badge.style.display = 'block'; };
  const newCue = () => { st.cue = pick(['men', 'kote', 'do'].filter(c => c !== st.cue)); ai.guarding = st.cue === 'do'; showMsg(`${LBL[st.cue]} !`, st.cue === 'do' ? 'Le motodachi lève les bras' : `Le motodachi ouvre ${st.cue === 'men' ? 'le men' : 'le kote'}`, 1.2); };
  const setup = () => {
    game.reset(); ai.guarding = false;
    if (l.tsuba) { player.x = 680; ai.x = 680 + MIN_D; }
    st.ax = ai.x; st.atk = 1.6;
    if (l.cue) newCue();
    if (l.aiAttack) cap('Restez à distance (issoku-ittō) et attendez l\'attaque du motodachi');
  };
  const finish = () => {
    if (st.done) return; st.done = true; game.state = 'over';
    const ok = st.count >= goal;
    const ratio = goal / Math.max(goal, LS.attempts), avg = st.count ? st.flags / st.count : 0;
    const stars = !ok ? 0 : l.timeLimit ? (st.count >= goal + 2 ? 3 : st.count >= goal + 1 ? 2 : 1) : ratio >= .6 && avg >= 2.6 ? 3 : ratio >= .35 ? 2 : 1;
    setTimeout(() => { if (my === token) o.onDone({ ok, stars, count: st.count, attempts: LS.attempts, msg: `${st.count}/${goal} réussites en ${LS.attempts} frappes` }); }, o.exam ? 600 : 900);
  };
  window.hooks = lessonRules(l, {
    mode: 'lesson', noHansoku: true,
    ippon: z => {
      if (my !== token) return true;
      const ok = z.att === player && l.check(z, st);
      if (ok) { st.count++; st.flags += z.flags; }
      badge();
      if (z.att !== player) showMsg('TOUCHÉ', l.aiAttack ? 'Le motodachi vous a touché — répondez au bon moment' : 'Le motodachi a marqué', 1.2);
      else showMsg(ok ? `${fmt(z.name)} !` : 'PAS CETTE FOIS', ok ? `Bien ! ${st.count}/${goal}` : `Vous avez fait ${fmt(z.name).toLowerCase()} : ce n'est pas la technique demandée`, 1.2);
      game.state = 'pause'; game.pauseT = 99;
      setTimeout(() => {
        if (my !== token) return; flagsDown();
        if (st.count >= goal || (o.maxAttempts && LS.attempts >= o.maxAttempts)) return finish();
        setup(); game.state = 'fight';
      }, l.timeLimit ? 700 : 1300);
      return true;
    },
    ai: dt => {
      if (my !== token) return false;
      const d = ai.x - player.x;
      if (l.guardCycle) { st.cycle = (st.cycle + dt) % 2.6; ai.guarding = st.cycle > 1.3; }
      if (l.randomGuard) { st.cycle += dt; if (st.cycle > 1.2) { st.cycle = 0; ai.guarding = Math.random() < .45; } }
      if (l.aiAttack && !ai.busy && !player.busy) {
        st.atk -= dt;
        if (st.atk <= 0) { if (d > 480 && d < 640) { ai.strike(l.aiAttack); st.atk = 2.2 + Math.random() * 1.2; } else st.atk = .5; }
      }
      ai.vel = game.tsuba || ai.busy ? 0 : C((st.ax - ai.x) * 3, -260, 260);
      if (game.tsuba) st.ax = ai.x;
      return true;
    },
  });
  act = { tick: dt => {
    if (my !== token || st.done) return;
    if (l.timeLimit && game.state === 'fight' && game.time <= .5) finish();
    if (o.maxAttempts && LS.attempts >= o.maxAttempts && game.state === 'fight' && !player.busy) finish();
  } };
  badge(); setup();
}

// ---------- maai ----------
function runMaai(l, done) {
  const my = scene({ badge: true });
  const st = { count: 0, hold: 0, ax: 1100, label: '' };
  const badge = () => { ui.badge.innerHTML = `${l.title} — <b>${st.count}/${l.goal}</b>`; };
  const setup = () => { game.reset(); player.x = 380; ai.x = 1100; st.ax = 1100; };
  window.hooks = { mode: 'lesson', noHansoku: true, ippon: () => true, press: k => !['fwd', 'back'].includes(k),
    ai: dt => {
      if (my !== token) return false;
      const d = ai.x - player.x, good = d > 500 && d < 590;
      const label = good ? 'Bonne distance ✓ — restez immobile' : d >= 590 ? 'Trop loin — avancez ▶' : 'Trop près — reculez ◀';
      if (label !== st.label) { st.label = label; cap(label); hint(good ? [] : [d >= 590 ? 'fwd' : 'back']); }
      if (good && Math.abs(player.vel) < 1) st.hold += dt; else st.hold = 0;
      if (st.hold > 2) {
        st.count++; st.hold = 0; badge(); sfx.pop(); showMsg('BIEN !', `${st.count}/${l.goal}`, 1); st.label = '';
        if (st.count >= l.goal) { game.state = 'over'; setTimeout(() => { if (my === token) done({ stars: 3, msg: 'Distance maîtrisée' }); }, 900); return true; }
        st.ax = C(ai.x + (Math.random() < .5 ? -1 : 1) * (180 + Math.random() * 160), 760, 1420);
      }
      ai.vel = C((st.ax - ai.x) * 3, -260, 260);
      return true;
    } };
  badge(); setup();
}

// ---------- kirikaeshi ----------
function runKiri(o) {
  const my = scene({ quiet: true });
  const steps = [{ l: 'SHŌMEN', d: 1 }];
  for (let i = 0; i < 4; i++) steps.push({ l: i % 2 ? 'YŪ-MEN<br>右' : 'SA-MEN<br>左', d: 1 });
  for (let i = 0; i < 5; i++) steps.push({ l: i % 2 ? 'SA-MEN<br>左' : 'YŪ-MEN<br>右', d: -1 });
  steps.push({ l: 'SHŌMEN', d: 1 });
  const BEAT = .66, T0 = 1.6;
  steps.forEach((s, i) => { s.at = T0 + i * BEAT; s.pts = null; });
  const st = { t: 0, i: 0, done: false };
  const core = ui.kiri.querySelector('.core'), ring = ui.kiri.querySelector('.ring'), fb = ui.kiri.querySelector('.fb');
  ui.kiri.style.display = 'flex'; cap(o.auto ? 'Kirikaeshi : shōmen, sayū-men en avançant puis en reculant' : 'Appuyez sur <b>MEN</b> quand le cercle jaune se referme'); hint(o.auto ? [] : ['men']);
  const feedback = (txt, col) => { fb.textContent = txt; fb.style.color = col; };
  const hit = () => {
    const s = steps[st.i]; if (!s || st.done) return;
    const err = Math.abs(st.t - s.at);
    if (err > .4) return;
    s.pts = err <= .1 ? 100 : err <= .2 ? 70 : err <= .32 ? 40 : 10;
    feedback(s.pts >= 100 ? 'PARFAIT' : s.pts >= 70 ? 'BIEN' : s.pts >= 40 ? 'OK' : 'DÉCALÉ', s.pts >= 70 ? '#7ddc7d' : s.pts >= 40 ? '#ffd34d' : '#ff6b6b');
    player.kiai = Math.min(100, player.kiai + 6);
    player.strike('men', { lunge: s.d * 46, speed: 1.8 });
    st.i++;
  };
  window.hooks = { mode: 'kiri', noHansoku: true, ippon: () => true,
    press: k => { if (k === 'men' && !o.auto) hit(); return true; },
    ai: () => { ai.guarding = false; ai.vel = C((player.x + 360 - ai.x) * 5, -500, 500); return true; },
    nores: f => { if (f === player) { const [x, y] = f.tip(); sfx.clack(); spark(x, y, false); } } };
  act = { tick: dt => {
    if (my !== token || st.done || game.state !== 'fight') return;
    st.t += dt;
    const s = steps[st.i];
    if (!s) { st.done = true; const sc = Math.round(steps.reduce((a, x) => a + (x.pts || 0), 0) / steps.length);
      ui.kiri.style.display = 'none'; showMsg('YAME', `Kirikaeshi : ${sc} %`, 1.2); game.state = 'over';
      setTimeout(() => { if (my === token) o.onDone(sc); }, 1300); return; }
    if (o.auto && st.t >= s.at - .02) hit();
    if (st.t > s.at + .4) { s.pts = 0; feedback('RATÉ', '#ff6b6b'); st.i++; }
    const k = C((s.at - st.t) / .66, 0, 1);
    ring.style.transform = `scale(${1 + k * 1.5})`; ring.style.opacity = .4 + .6 * (1 - k);
    core.innerHTML = s.l; ui.badge.innerHTML = `Kirikaeshi — <b>${st.i + 1}/${steps.length}</b>`; ui.badge.style.display = 'block';
  } };
  game.reset(); player.x = 420; ai.x = 780;
}

// ---------- kata ----------
function runKata(list, o) {
  const my = scene({ quiet: true });
  bokuto(true); setOpp('Uchidachi', '#4a2f12', '師');
  const seq = [];
  for (const id of list) { seq.push({ intro: KATA[id].name }); for (const s of KATA[id].steps) seq.push(s); seq.push({ outro: true }); }
  const st = { i: 0, phase: 'cue', t: 0, ok: 0, total: seq.filter(s => s.key).length, ax: 1100, px: 560, answered: false, done: false };
  aiBrain.onSemed = () => {};
  const perform = k => {
    if (k === 'back') st.px -= 90; else if (k === 'fwd') st.px += 90;
    else if (k === 'guard') { keys.guard = true; setTimeout(() => { keys.guard = false; }, 600); }
    else if (k === 'seme') player.seme();
    else player.strike(k, { lunge: 50 });
  };
  const answer = k => {
    const s = seq[st.i]; if (!s || !s.key || st.phase !== 'win' || st.answered) return;
    st.answered = true; const ok = k === s.key;
    if (ok) st.ok++;
    showMsg(ok ? '✓' : '✗', ok ? s.label : `Il fallait : ${KEYNAME[s.key]} — ${s.label}`, 1);
    perform(s.key); st.phase = 'after'; st.t = 0;
  };
  window.hooks = { mode: 'kata', noHansoku: true, ippon: () => true,
    press: k => { if (!o.auto) answer(k); return true; },
    ai: () => { ai.vel = ai.busy ? 0 : C((st.ax - ai.x) * 4, -300, 300); ai.guarding = false; return true; },
    nores: f => { const [x, y] = f.tip(); sfx.clack(); spark(x, y, false); } };
  act = { tick: dt => {
    if (my !== token || st.done || game.state !== 'fight') return;
    player.x += (st.px - player.x) * C(dt * 6, 0, 1);
    st.t += dt;
    const s = seq[st.i];
    if (!s) { st.done = true; const sc = Math.round(st.ok / st.total * 100); game.state = 'over'; showMsg('KATA', `${st.ok}/${st.total} gestes justes`, 1.4); setTimeout(() => { if (my === token) o.onDone(sc); }, 1400); return; }
    if (s.intro) { if (st.t < .05) { cap(`<b>${s.intro}</b>`); showMsg(s.intro, list.length > 1 || o.learn ? 'Uchidachi contre shidachi' : '', 1.2); st.px = 560; st.ax = 1100; } if (st.t > 1.6) { st.i++; st.t = 0; st.phase = 'cue'; } return; }
    if (s.outro) { if (st.t > 1.0) { st.i++; st.t = 0; st.px = 560; st.ax = 1100; } return; }
    if (st.phase === 'cue') {
      if (st.t < .05) { st.answered = false; cap(s.ai ? `Uchidachi attaque <b>${LBL[s.ai]}</b>…` : 'À vous…'); hint([]); }
      if (st.t > .9) { if (s.ai) ai.strike(s.ai, { lunge: 50 }); st.phase = 'win'; st.t = 0; cap(`${o.learn || o.auto ? '→ ' + s.label + ' : <b>' + KEYNAME[s.key] + '</b>' : '→ Répondez !'}`); if (o.learn || o.auto) hint([s.key]); }
    } else if (st.phase === 'win') {
      if (o.auto && st.t > .12) answer(s.key);
      if (st.t > (s.ai ? .8 : 2.2) && !st.answered) { st.answered = true; showMsg('✗', `Trop tard — il fallait : ${KEYNAME[s.key]}`, 1); perform(s.key); st.phase = 'after'; st.t = 0; }
    } else if (st.phase === 'after' && st.t > .9) { hint([]); st.i++; st.t = 0; st.phase = 'cue'; }
  } };
  game.reset(); player.x = 560; ai.x = 1100;
}

// ---------- reigi ----------
function runReigi(o) {
  const my = scene({ quiet: true });
  const st = { next: 0, err: 0, done: false, px: 260, ax: 1340, bow: 0, crouch: 0, t: 0 };
  const order = shuffle(REIGI.map((t, i) => ({ t, i })));
  ui.panel.innerHTML = order.map(s => `<button class="hb" data-i="${s.i}">${s.t}</button>`).join('');
  ui.panel.style.display = 'grid';
  cap(o.auto ? 'L\'étiquette d\'un combat, dans l\'ordre' : 'Touchez les étapes <b>dans le bon ordre</b>');
  const anim = i => {
    if (i === 0) { st.px = 330; st.ax = 1270; }
    if (i === 1 || i === 7) { st.bow = 16; setTimeout(() => { st.bow = 0; }, 900); }
    if (i === 2) { st.px = 520; st.ax = 1080; }
    if (i === 3 || i === 5) st.crouch = 42;
    if (i === 4 || i === 6) st.crouch = 0;
    if (i === 6) { st.px = 330; st.ax = 1270; }
  };
  const choose = (i, btn) => {
    if (st.done) return;
    if (i !== st.next) { st.err++; sfx.clack(); showMsg('✗', 'Ce n\'est pas l\'étape suivante', .8); return; }
    btn.classList.add('done'); btn.disabled = true; sfx.pop(); anim(i); st.next++;
    showMsg('', REIGI[i], 1.2);
    if (st.next >= REIGI.length) { st.done = true; setTimeout(() => { if (my !== token) return; ui.panel.style.display = 'none'; game.state = 'over'; o.onDone(st.err); }, 1500); }
  };
  ui.panel.querySelectorAll('.hb').forEach(b => b.onclick = () => { if (!o.auto) choose(+b.dataset.i, b); });
  window.hooks = { mode: 'reigi', noHansoku: true, ippon: () => true, press: () => true, ai: () => { ai.vel = 0; return true; } };
  act = { tick: dt => {
    if (my !== token) return;
    const k = C(dt * 4, 0, 1);
    player.x += (st.px - player.x) * k; ai.x += (st.ax - ai.x) * k;
    for (const f of [player, ai]) { f.bow = (f.bow || 0) + (st.bow - (f.bow || 0)) * k * 2; f.crouch = (f.crouch || 0) + (st.crouch - (f.crouch || 0)) * k * 2; }
    if (o.auto && !st.done && game.state === 'fight') { st.t += dt; if (st.t > 1.1) { st.t = 0; const b = ui.panel.querySelector(`[data-i="${st.next}"]`); choose(st.next, b); } }
  } };
  game.reset(); player.x = 260; ai.x = 1340;
}

// ---------- gakka ----------
function runGakka(n, g, onDone) {
  const qs = shuffle(QS.filter(q => q.g <= g)).slice(0, n);
  let i = 0, good = 0;
  const show = () => {
    if (i >= qs.length) return onDone(Math.round(good / qs.length * 100));
    const q = qs[i], ans = shuffle(q.a.map((t, k) => ({ t, ok: k === 0 })));
    render(`<h2>Gakka — question ${i + 1}/${qs.length}</h2><p style="font-size:16px"><b>${q.q}</b></p>
      <div class="qa">${ans.map((a, k) => `<button class="hb" data-k="${k}">${a.t}</button>`).join('')}</div><div class="row2" id="nx"></div>`,
      { '.qa .hb': b => {
        if (hub.querySelector('.qa .good')) return;
        const a = ans[+b.dataset.k]; if (a.ok) good++;
        hub.querySelectorAll('.qa .hb').forEach((x, k) => { if (ans[k].ok) x.classList.add('good'); else if (x === b) x.classList.add('bad'); });
        $('nx').innerHTML = `<span class="${a.ok ? 'ok' : 'ko'}">${a.ok ? 'Bonne réponse !' : 'Mauvaise réponse'}</span> <button class="hb main" id="bN">Suivant ▶</button>`;
        $('bN').onclick = () => { i++; show(); };
      } });
  };
  show();
}

// ---------- démonstration ----------
function runDemo(l, then) {
  const end = () => { token++; clearAll(); game.state = 'over';
    render(`<h2>${l.title}</h2><p>Fin de la démonstration. À vous de jouer !</p>
      <div class="row2"><button class="hb main" id="bGo">Commencer ▶</button><button class="hb" id="bRe">Revoir</button><button class="hb" id="bBack">◀ Dojo</button></div>`,
      { '#bGo': then, '#bRe': () => runDemo(l, then), '#bBack': dojo }); };
  const showTag = () => { ui.skip.style.display = 'block'; ui.tag.style.display = 'block'; ui.skip.onclick = end; ui.badge.style.display = 'none'; };
  if (l.kind === 'kiri') { runKiri({ auto: true, onDone: end }); return showTag(); }
  if (l.kind === 'kata') { runKata(l.list.slice(0, 1), { auto: true, onDone: end }); return showTag(); }
  if (l.kind === 'reigi') { runReigi({ auto: true, onDone: end }); return showTag(); }
  if (l.kind === 'maai') {
    const my = scene({ quiet: true }); showTag();
    window.hooks = { mode: 'demo', noHansoku: true, ippon: () => true, press: () => true, ai: () => { ai.vel = 0; return true; } };
    const q = [{ cap: 'Trop loin : les pointes ne se croisent pas', hint: ['fwd'] }, { wait: 1.2 }, { approach: 545 }, { hint: [] }, { cap: 'Bonne distance ✓ : les pointes se croisent légèrement (issoku-ittō)' }, { wait: 2.2 }, { cap: 'Trop près : vous êtes à la portée de l\'adversaire', hint: ['fwd'] }, { approach: 420 }, { wait: 1.6 }, { cap: 'Reculez ◀ pour revenir à la bonne distance', hint: ['back'] }, { approach: 545 }, { hint: [] }, { wait: 1.2 }];
    game.reset(); player.x = 380; ai.x = 1100;
    return playScript(q, my, end);
  }
  const my = scene({ quiet: true }); showTag();
  game.timeScale = .6;
  const reset = () => { game.reset(); ai.guarding = false; if (l.tsuba) { player.x = 680; ai.x = 680 + MIN_D; } };
  window.hooks = lessonRules(l, { mode: 'demo', noHansoku: true, press: () => true,
    ippon: z => { showMsg(`${fmt(z.name)} !`, z.att === player ? 'Point valable' : '', 1.2); game.state = 'pause'; game.pauseT = 99; setTimeout(() => { if (my !== token) return; flagsDown(); game.state = 'fight'; }, 900); return true; },
    ai: () => { ai.vel = 0; return true; } });
  reset();
  playScript(l.demo || [], my, end, reset);
}
function playScript(q, my, end, reset) {
  const st = { i: 0, wait: 0, cur: null };
  act = { tick: dt => {
    if (my !== token) return;
    for (let guard = 0; guard < 20; guard++) {
      if (st.wait > 0) { st.wait -= dt; return; }
      const s = q[st.i];
      if (!s) { if (game.state === 'fight') { end(); } return; }
      if (s.approach) {
        if (game.state !== 'fight') return;
        const d = ai.x - player.x, diff = d - s.approach;
        if (Math.abs(diff) > 10) { keys.fwd = diff > 0; keys.back = diff < 0; return; }
        keys.fwd = keys.back = false;
      }
      if (s.strike) { if (game.state !== 'fight') return; player.kiai = 100; player.strike(s.strike); }
      if (s.aiStrike) { if (game.state !== 'fight') return; ai.strike(s.aiStrike); }
      if (s.cap !== undefined) cap(s.cap);
      if (s.hint) hint(s.hint);
      if (s.seme) player.seme();
      if (s.guard !== undefined) keys.guard = s.guard;
      if (s.aiGuard !== undefined) ai.guarding = s.aiGuard;
      if (s.zanshin) { keys.back = true; setTimeout(() => { keys.back = false; }, 260); }
      if (s.setup && reset) { if (game.state !== 'fight') return; reset(); }
      if (s.wait) st.wait = s.wait;
      st.i++;
    }
  } };
}

// ================= COMBATS (tournoi, libre, examen) =================
function free() {
  token++; hub.style.display = 'none'; clearAll(); setOpp('IA'); showHUD(true, true);
  game.level = +document.querySelector('.pick.sel').dataset.l;
  window.hooks = { mode: 'free', end: (s, a) => { if (s > a) addWin(); prof.played++; save(); return false; } };
  $('menu').style.display = 'flex';
}
document.querySelectorAll('.pick').forEach(b => b.addEventListener('click', () => { if (window.hooks && hooks.mode === 'free') game.level = +b.dataset.l; }));
$('go').addEventListener('click', () => { if (window.hooks && hooks.mode === 'free') ui.quit.style.display = 'block'; });
function startMatch({ profile, name, color, kanji, onEnd }) {
  const my = scene({ profile, name, color, kanji, timer: true, score: true });
  window.hooks = { mode: 'match', end: (s, a) => { if (my !== token) return true; prof.played++; save(); setTimeout(() => onEnd(s > a, s, a), 400); return true; } };
}
const NAMES = ['Kenji Sato', 'Youssef El Amrani', 'Hiroshi Tanaka', 'Mehdi Benali', 'Lucas Martin', 'Takeshi Mori', 'Amine Ouazzani', 'Daichi Kimura', 'Karim Haddad', 'Sofia Rossi', 'Yuki Nakamura', 'Omar Tazi', 'Ines Alaoui', 'Ren Fujita'];
const ROUNDS = ['Quarts de finale', 'Demi-finales', 'Finale'];
let T = null;
function tournament() {
  const names = shuffle(NAMES).slice(0, 7), styles = Object.keys(STYLES);
  const ent = [{ name: 'Vous', me: true, g: prof.g }];
  names.forEach((n, i) => ent.push({ name: n, style: pick(styles), g: C(prof.g + (i < 2 ? 1 : i < 5 ? 0 : -1), 0, 13), color: COLORS[(i + 1) % COLORS.length], kanji: KANJI[i % KANJI.length] }));
  T = { ent, rounds: [[0, 1, 2, 3, 4, 5, 6, 7]], r: 0, winners: [] };
  bracket();
}
function bracket(note) {
  const nm = e => e.me ? 'Vous' : e.name;
  const cols = ROUNDS.map((rn, ri) => {
    const list = T.rounds[ri] || [];
    let html = `<div><h4>${rn}</h4>`;
    if (!list.length) html += '<div class="m"><div><span>—</span></div></div>';
    for (let k = 0; k < list.length; k += 2) {
      const a = list[k], b = list[k + 1], w = T.winners[ri] ? T.winners[ri][k / 2] : undefined;
      const cls = i => (w === undefined ? (T.ent[i].me ? 'me' : '') : w === i ? 'w' : 'l');
      const cur = ri === T.r && (T.ent[a].me || T.ent[b].me) && w === undefined;
      html += `<div class="m${cur ? ' cur' : ''}"><div><span class="${cls(a)}">${nm(T.ent[a])}</span></div><div><span class="${cls(b)}">${nm(T.ent[b])}</span></div></div>`;
    }
    return html + '</div>';
  }).join('');
  const list = T.rounds[T.r], idx = list.findIndex(i => T.ent[i].me), opp = T.ent[list[idx % 2 ? idx - 1 : idx + 1]];
  render(`<h2>🏆 Tournoi — ${GRADES[prof.g]}</h2>${note ? `<p>${note}</p>` : ''}<div class="bracket">${cols}</div>
    <p>${ROUNDS[T.r]} contre <b>${opp.name}</b> (${GRADES[opp.g]}, style ${STYLES[opp.style].label.toLowerCase()})</p>
    <div class="row2"><button class="hb main" id="bFight">Combattre</button><button class="hb" id="bBack">Abandonner</button></div>`,
    { '#bFight': () => fightRound(opp), '#bBack': home });
}
function fightRound(opp) {
  startMatch({ profile: profileFor(opp.g, opp.style), name: opp.name.split(' ')[0], color: opp.color, kanji: opp.kanji, onEnd: (won, s, a) => {
    const list = T.rounds[T.r], w = [];
    for (let k = 0; k < list.length; k += 2) {
      const x = list[k], y = list[k + 1];
      if (T.ent[x].me || T.ent[y].me) w.push(won ? (T.ent[x].me ? x : y) : (T.ent[x].me ? y : x));
      else w.push(Math.random() < .5 + (T.ent[x].g - T.ent[y].g) * .12 ? x : y);
    }
    T.winners[T.r] = w;
    if (!won) return render(`<h2>Éliminé en ${ROUNDS[T.r].toLowerCase()}</h2><p>${opp.name} l'emporte ${a} à ${s}. Entraînez-vous au dojo et revenez plus fort !</p>
      <div class="row2"><button class="hb main" id="bAgain">Nouveau tournoi</button><button class="hb" id="bHome">Menu</button></div>`, { '#bAgain': tournament, '#bHome': home });
    addWin();
    if (T.r === ROUNDS.length - 1) { prof.titles++; addWin();
      return render(`<h2>🏆 CHAMPION !</h2><p>Vous remportez le tournoi ${GRADES[prof.g]} en battant ${opp.name} ${s} à ${a} en finale. Cette victoire compte double pour votre passage de grade.</p>
        <div class="row2"><button class="hb main" id="bHome">Menu</button></div>`, { '#bHome': home }); }
    T.r++; T.rounds[T.r] = w;
    bracket(`Victoire ${s} à ${a} contre ${opp.name} ! Prochain tour :`);
  } });
}

// ================= SHINSA =================
const KIHON = { 1: ['men', 'kote', 'do'], 2: ['men', 'kote', 'do', 'kotemen'], 3: ['kote', 'kotemen', 'hiki'], 4: ['kotemen', 'harai', 'hiki', 'debanakote'], 5: ['harai', 'debanakote', 'nukido'], 6: ['kotemen', 'nukido', 'suriage'] };
function program(t) {
  const P = [];
  if (t <= 6) P.push({ k: 'reigi', name: 'Reigi (étiquette)' });
  if (t <= 8) P.push({ k: 'kiri', name: 'Kirikaeshi', pass: Math.min(80, 55 + t * 2) });
  if (KIHON[t]) P.push({ k: 'kihon', name: 'Kihon (techniques imposées)', cmds: KIHON[t] });
  P.push({ k: 'jitsugi', name: t <= 5 ? 'Jitsugi (combat d\'examen)' : 'Jitsugi (2 combats d\'examen)', n: t <= 5 ? 1 : 2 });
  const kata = t === 5 || t === 6 ? ['k1', 'k2', 'k3'] : t === 7 ? ['k1', 'k2', 'k3', 'k4', 'k5'] : t === 8 ? ['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7'] : t >= 9 ? ['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7', 'kd1', 'kd2', 'kd3'] : null;
  if (kata) P.push({ k: 'kata', name: `Nihon Kendo Kata (${kata.length > 7 ? '1 à 7 + kodachi' : '1 à ' + kata.length})`, list: kata, pass: 70 });
  if (t >= 3) P.push({ k: 'gakka', name: 'Gakka (écrit)', n: t < 6 ? 5 : 8, pass: t < 6 ? 60 : 70 });
  return P;
}
function shinsaIntro() {
  const t = prof.g + 1, P = program(t), r = reqStatus();
  render(`<h2>審査 Shinsa — examen du ${GRADES[t]}</h2>
    <div class="req"><b>Conditions pour se présenter</b><br>
      ${r.ls.map(l => `${prof.stars[l.id] ? '<span class="ok">✓</span>' : '<span class="ko">✗</span>'} Leçon : ${l.title}`).join('<br>')}
      <br>${prof.wins >= r.n ? '<span class="ok">✓</span>' : '<span class="ko">✗</span>'} Victoires en tournoi ou combat libre : ${r.wins}/${r.n}</div>
    <div class="req"><b>Épreuves de l'examen</b><br>${P.map((p, i) => `${i + 1}. ${p.name}`).join('<br>')}</div>
    <p>Le jury évalue la qualité (distance, seme, frappes nettes, zanshin, attitude), pas seulement les points. Une épreuve ratée met fin à l'examen.</p>
    <div class="row2"><button class="hb ${r.ok ? 'main' : ''}" id="bGo" ${r.ok ? '' : 'disabled'}>Commencer l'examen</button><button class="hb" id="bDojo">道場 Dojo</button><button class="hb" id="bBack">◀ Retour</button></div>`,
    { '#bGo': () => shinsaPart(t, P, 0, []), '#bDojo': dojo, '#bBack': home });
}
function shinsaPart(t, P, i, res) {
  if (i >= P.length || (res.length && !res[res.length - 1].pass)) return shinsaResult(t, P, res);
  const p = P[i];
  const next = r => { res.push(Object.assign({ name: p.name }, r)); interlude(t, P, i + 1, res); };
  const go = () => {
    if (p.k === 'reigi') runReigi({ onDone: err => next({ pass: err <= 1, score: `${err} erreur${err > 1 ? 's' : ''}` }) });
    else if (p.k === 'kiri') runKiri({ onDone: sc => next({ pass: sc >= p.pass, score: `${sc} % (minimum ${p.pass} %)` }) });
    else if (p.k === 'kata') runKata(p.list, { onDone: sc => next({ pass: sc >= p.pass, score: `${sc} % (minimum ${p.pass} %)` }) });
    else if (p.k === 'gakka') runGakka(p.n, t, sc => next({ pass: sc >= p.pass, score: `${sc} % (minimum ${p.pass} %)` }));
    else if (p.k === 'kihon') kihon(p.cmds, 0, [], ok => next({ pass: ok.filter(Boolean).length >= Math.ceil(p.cmds.length * .67), score: `${ok.filter(Boolean).length}/${p.cmds.length} techniques réussies` }));
    else if (p.k === 'jitsugi') jitsugi(t, p.n, 0, [], ev => next({ pass: ev.pass, score: `${ev.global} % (minimum ${ev.need} %) · ${ev.yes}/${ev.judges} juges favorables`, ev }));
  };
  render(`<h2>Épreuve ${i + 1}/${P.length} — ${p.name}</h2><p>${{
    reigi: 'Montrez l\'étiquette d\'un combat, dans l\'ordre. Une erreur maximum.',
    kiri: 'Kirikaeshi complet devant le jury. Appuyez sur MEN au rythme du cercle.',
    kihon: `L'examinateur annonce ${p.cmds && p.cmds.length} techniques. Vous avez 2 frappes pour réussir chacune, avec zanshin.`,
    jitsugi: 'Combat d\'une minute contre un autre candidat. Ce ne sont pas les points qui comptent : le jury note le seme, la distance, la netteté des frappes, le zanshin et l\'attitude (ne pas fuir, pas de hansoku).',
    kata: 'Exécutez les kata en shidachi, sans aide à l\'écran : répondez au bon moment avec le bon geste.',
    gakka: 'Examen écrit à choix multiples.',
  }[p.k]}</p><div class="row2"><button class="hb main" id="bGo">Commencer</button></div>`, { '#bGo': go });
}
function interlude(t, P, i, res) {
  const r = res[res.length - 1];
  render(`<h2>${r.pass ? '<span class="ok">✓</span>' : '<span class="ko">✗</span>'} ${r.name}</h2><p>${r.score}</p>
    <div class="row2"><button class="hb main" id="bN">${r.pass && i < P.length ? 'Épreuve suivante ▶' : 'Résultats'}</button></div>`,
    { '#bN': () => shinsaPart(t, P, i, res) });
}
function kihon(cmds, i, ok, done) {
  if (i >= cmds.length) return done(ok);
  const l = byId(cmds[i]);
  render(`<h2>Kihon ${i + 1}/${cmds.length}</h2><p>L'examinateur annonce : <b style="font-size:22px">« ${l.title} ! »</b></p><div class="row2"><button class="hb main" id="bGo">Hajime</button></div>`,
    { '#bGo': () => runTech(l, { exam: true, goal: 1, maxAttempts: 2, onDone: r => { ok.push(r.ok); kihon(cmds, i + 1, ok, done); } }) });
}
function jitsugi(t, n, i, stats, done) {
  if (i >= n) return done(evaluate(stats, t));
  const style = pick(Object.keys(STYLES));
  const my = scene({ profile: profileFor(t - 1, style), name: 'Candidat', color: pick(COLORS), kanji: pick(KANJI), timer: true, score: false, time: 60 });
  statsReset();
  window.hooks = { mode: 'jitsugi',
    ippon: z => { if (my !== token) return true; if (z.att === player) ST.ippon++; else ST.opp++;
      showMsg(`${LBL[z.type]} ARI`, z.att === player ? `${fmt(z.name).toLowerCase()} — noté par le jury` : 'Le candidat adverse marque', 1.2);
      game.state = 'pause'; game.pauseT = 99;
      setTimeout(() => { if (my !== token) return; flagsDown(); const tm = game.time; game.reset(); game.time = tm; game.state = 'fight'; }, 1300); return true; },
    finish: () => { if (my !== token) return true; ST.on = false; const s = Object.assign({}, ST); setTimeout(() => { if (my === token) { if (i + 1 < n) render(`<h2>Jitsugi ${i + 1}/${n} terminé</h2><p>Deuxième combat contre un autre candidat.</p><div class="row2"><button class="hb main" id="bN">Hajime ▶</button></div>`, { '#bN': () => jitsugi(t, n, i + 1, stats.concat([s]), done) }); else jitsugi(t, n, i + 1, stats.concat([s]), done); } }, 1200); return true; } };
}
const CRIT = [
  { k: 'seme', n: 'Seme (pression, initiative)', w: .18, tip: 'Mettez plus de pression avec SEME avant d\'attaquer.' },
  { k: 'maai', n: 'Maai (distance)', w: .15, tip: 'Frappez depuis issoku-ittō : trop de frappes de trop loin ou de trop près.' },
  { k: 'datotsu', n: 'Datotsu (frappes valables)', w: .22, tip: 'Préparez vos frappes : peu d\'attaques ont été jugées valables.' },
  { k: 'zanshin', n: 'Zanshin', w: .12, tip: 'Montrez le zanshin après chaque frappe (◀ ou GARDE).' },
  { k: 'shisei', n: 'Shisei (attitude)', w: .13, tip: 'Ne fuyez pas en reculant, restez dans le terrain et ne subissez pas.' },
  { k: 'ki', n: 'Ki (énergie)', w: .1, tip: 'Gardez votre jauge de KI haute : restez à distance, ne reculez pas sans raison.' },
  { k: 'kogeki', n: 'Initiative (attaques)', w: .1, tip: 'Attaquez davantage, le jury veut voir des tentatives franches.' },
];
function evaluate(stats, t) {
  const sum = k => stats.reduce((a, s) => a + s[k], 0);
  const att = sum('att'), mins = Math.max(.5, sum('time') / 60);
  const c = {
    seme: C(sum('seme') / mins * 12 + sum('opened') * 12, 0, 100),
    maai: att ? sum('good') / att * 100 : 20,
    datotsu: att ? C(sum('valid') / att * 130 + sum('ippon') * 12, 0, 100) : 0,
    zanshin: sum('zok') + sum('tori') ? sum('zok') / (sum('zok') + sum('tori')) * 100 : 50,
    shisei: C(100 - sum('retreat') / Math.max(1, sum('time')) * 160 - sum('hans') * 25 - sum('opp') * 15, 0, 100),
    ki: sum('kiN') ? sum('ki') / sum('kiN') : 0,
    kogeki: C(att / mins * 11, 0, 100),
  };
  const global = Math.round(CRIT.reduce((a, k) => a + c[k.k] * k.w, 0));
  const needP = Math.min(82, 42 + t * 3);
  const judges = t < 6 ? 3 : t < 9 ? 5 : 6, quorum = Math.ceil(judges * 2 / 3);
  let yes = 0; for (let j = 0; j < judges; j++) if (global + (Math.random() * 16 - 8) >= needP) yes++;
  const tips = CRIT.slice().sort((a, b) => c[a.k] - c[b.k]).slice(0, 2).map(k => k.tip);
  return { c, global, need: needP, judges, yes, quorum, pass: yes >= quorum, tips };
}
function shinsaResult(t, P, res) {
  const pass = res.length === P.length && res.every(r => r.pass);
  const ev = (res.find(r => r.ev) || {}).ev;
  let html = `<h2>${pass ? '🎉 Examen réussi !' : 'Examen non réussi'}</h2><p>Examen du <b>${GRADES[t]}</b></p><table class="sheet"><tr><th>Épreuve</th><th>Résultat</th><th></th></tr>`;
  P.forEach((p, i) => { const r = res[i]; html += `<tr><td>${p.name}</td><td>${r ? r.score : 'non passée'}</td><td>${r ? (r.pass ? '<span class="ok">✓</span>' : '<span class="ko">✗</span>') : '—'}</td></tr>`; });
  html += '</table>';
  if (ev) {
    html += `<table class="sheet"><tr><th>Critère du jitsugi</th><th>Note</th></tr>${CRIT.map(k => `<tr><td>${k.n}</td><td>${Math.round(ev.c[k.k])}/100</td></tr>`).join('')}<tr><td><b>Global</b></td><td><b>${ev.global}</b> (minimum ${ev.need}) · ${ev.yes}/${ev.judges} juges (il en faut ${ev.quorum})</td></tr></table>`;
    if (!ev.pass || ev.global < 90) html += `<p><b>Conseils du jury :</b> ${ev.tips.join(' ')}</p>`;
  }
  if (pass) { prof.g = t; prof.wins = 0; save(); html += `<p>Vous êtes maintenant <b>${GRADES[t]}</b>. De nouvelles leçons sont débloquées au dojo.</p>`; }
  else { prof.wins = Math.max(0, need(prof.g) - 1); save(); html += '<p>Gagnez encore un combat pour retenter l\'examen. Revoyez les leçons au dojo.</p>'; }
  render(html + '<div class="row2"><button class="hb main" id="bHome">Menu</button><button class="hb" id="bDojo">道場 Dojo</button></div>', { '#bHome': home, '#bDojo': dojo });
}

window.academy = { render, startMatch, scene, profileFor, STYLES, COLORS, KANJI, GRADES, addWin, save, LBL, fmt, prof, L, home, dojo, startLesson, runDemo, runKiri, runKata, runReigi, tournament, shinsaIntro, shinsaPart, program, evaluate, ST, KATA };
home();
})();
