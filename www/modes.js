// Kendo Shiai v4 — menu principal, dojo, tournoi, grades (shinsa)
(() => {
'use strict';
const $ = id => document.getElementById(id);
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// ---------- sauvegarde ----------
const KEY = 'kendo.profile.v1';
const prof = (() => { try { return Object.assign({ g: 0, wins: 0, lessons: {}, titles: 0, played: 0 }, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return { g: 0, wins: 0, lessons: {}, titles: 0, played: 0 }; } })();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(prof)); } catch (e) {} };

const GRADES = ['6e kyu', '5e kyu', '4e kyu', '3e kyu', '2e kyu', '1er kyu', '1er dan', '2e dan', '3e dan', '4e dan', '5e dan', '6e dan', '7e dan', '8e dan'];
const need = g => 2 + Math.floor(g / 3);   // victoires nécessaires avant le shinsa
const addWin = () => { prof.wins++; save(); };

// ---------- profils d'IA ----------
const EASY = { react: .12, attack: .3, think: [1.2, 2.0], sloppy: .5, seme: .08, combo: .05, zanshin: .55, flinch: .55, push: 50 };
const MASTER = { react: .82, attack: .8, think: [.4, .8], sloppy: .05, seme: .4, combo: .6, zanshin: .98, flinch: .1, push: 150 };
const STYLES = {
  attaquant:  { label: 'Attaquant',        mod: p => { p.attack *= 1.35; p.seme *= 1.4; p.react *= .7; } },
  defenseur:  { label: 'Défenseur',        mod: p => { p.react *= 1.4; p.attack *= .6; p.flinch *= .6; } },
  contre:     { label: 'Contre-attaquant', mod: p => { p.react *= 1.3; p.attack *= .75; p.dan = true; } },
  technicien: { label: 'Technicien',       mod: p => { p.combo *= 1.7; p.seme *= 1.2; } },
};
function profileFor(g, style) {
  const t = clampN(g / 13, 0, 1), p = {};
  for (const k in EASY) p[k] = Array.isArray(EASY[k]) ? EASY[k].map((v, i) => v + (MASTER[k][i] - v) * t) : EASY[k] + (MASTER[k] - EASY[k]) * t;
  if (style) STYLES[style].mod(p);
  for (const k of ['react', 'attack', 'seme', 'combo', 'zanshin', 'flinch']) p[k] = clampN(p[k], 0, .95);
  p.novice = g < 3 && style !== 'contre';
  p.dan = p.dan || g >= 7;
  return p;
}
const TRAIN = { novice: true, react: 0, attack: 0, think: [9, 9], sloppy: 0, seme: 0, combo: 0, zanshin: 1, flinch: .95, push: 0 };

// ---------- apparence de l'adversaire ----------
const aiDo = [...ai.v.root.querySelectorAll('path')].find(p => p.getAttribute('fill') === 'url(#doRed)');
const aiZek = ai.v.root.querySelector('text');
const COLORS = ['url(#doRed)', '#1f3b2a', '#2b1f3b', '#4a2f12', '#0c0c10', '#123044'];
const KANJI = ['東', '西', '龍', '虎', '山', '川', '桜', '武', '光', '風'];
function setOpp(name, color, kanji) {
  $('nA').textContent = name; aiDo.setAttribute('fill', color || 'url(#doRed)'); aiZek.textContent = kanji || '赤';
}

// ---------- état des modes ----------
let token = 0;
const ui = { quit: null, badge: null };
function clearHooks() { window.hooks = null; aiBrain.onSemed = origSemed; }
const origSemed = aiBrain.onSemed;
function showHUD(timer, score) {
  $('timer').style.visibility = timer ? 'visible' : 'hidden';
  for (const id of ['pS', 'pA', 'mS', 'mA', 'hS', 'hA']) $(id).style.visibility = score ? 'visible' : 'hidden';
}

// ---------- CSS ----------
const css = document.createElement('style');
css.textContent = `
#hub { position: fixed; inset: 0; z-index: 15; display: flex; align-items: center; justify-content: center; padding: 14px; background: radial-gradient(circle at center, rgba(40,28,18,.92), rgba(0,0,0,.97)); overflow-y: auto; }
#hub .card { width: min(760px, 100%); text-align: center; }
#hub h1 { margin: 0; font-size: clamp(24px, 4.6vw, 42px); letter-spacing: 4px; }
#hub h1 small { display: block; font-size: .42em; color: #d9c9a8; letter-spacing: 2px; font-weight: 500; margin-top: 2px; }
#hub h2 { margin: 4px 0 8px; font-size: 20px; color: #ffd34d; }
#hub p { margin: 6px auto; max-width: 620px; color: #ddd; font-size: 13.5px; line-height: 1.5; }
.grade { display: inline-flex; gap: 14px; align-items: center; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.15); border-radius: 12px; padding: 6px 14px; margin: 8px 0; font-size: 14px; }
.grade b { color: #ffd34d; font-size: 17px; }
.bar { width: 120px; height: 8px; background: rgba(255,255,255,.15); border-radius: 5px; overflow: hidden; display: inline-block; vertical-align: middle; }
.bar i { display: block; height: 100%; background: linear-gradient(90deg,#ffb300,#ffe27a); }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-top: 8px; }
.hb { border: 2px solid rgba(255,255,255,.2); background: rgba(20,20,30,.75); color: #fff; border-radius: 14px; padding: 12px 10px; font-size: 17px; font-weight: 800; text-align: center; }
.hb small { display: block; font-size: 11.5px; font-weight: 500; color: #ccc; margin-top: 3px; }
.hb.main { background: #c0392b; border-color: #e0574a; }
.hb.gold { border-color: #ffd34d; }
.hb[disabled] { opacity: .45; }
.hb .ok { color: #7ddc7d; }
.lessons { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 8px; text-align: left; }
.lessons .hb { text-align: left; font-size: 15px; padding: 9px 12px; }
.row2 { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 10px; }
.bracket { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: left; font-size: 12.5px; margin: 6px 0; }
.bracket h3 { margin: 0 0 4px; font-size: 13px; color: #d9c9a8; }
.m { background: rgba(255,255,255,.06); border-radius: 8px; padding: 5px 8px; margin-bottom: 5px; }
.m div { display: flex; justify-content: space-between; gap: 6px; }
.m .w { color: #ffd34d; font-weight: 800; } .m .l { color: #888; text-decoration: line-through; } .m .me { color: #fff; font-weight: 800; }
.m.cur { outline: 2px solid #ffd34d; }
#quit { position: fixed; top: max(8px, env(safe-area-inset-top)); left: max(10px, env(safe-area-inset-left)); z-index: 12; border: 1px solid rgba(255,255,255,.4); background: rgba(0,0,0,.5); color: #fff; border-radius: 10px; padding: 6px 10px; font-size: 13px; font-weight: 700; display: none; }
#badge { position: fixed; top: max(8px, env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); z-index: 11; background: rgba(0,0,0,.6); border-radius: 12px; padding: 6px 16px; font-weight: 800; font-size: 15px; display: none; }
#badge b { color: #ffd34d; }
#backFree { position: absolute; top: 12px; left: 12px; border: 1px solid rgba(255,255,255,.4); background: rgba(0,0,0,.5); color: #fff; border-radius: 10px; padding: 7px 12px; font-size: 14px; font-weight: 700; }
`;
document.head.appendChild(css);
const hub = document.createElement('div'); hub.id = 'hub'; document.body.appendChild(hub);
ui.quit = document.createElement('button'); ui.quit.id = 'quit'; ui.quit.textContent = '✕ Quitter'; document.body.appendChild(ui.quit);
ui.badge = document.createElement('div'); ui.badge.id = 'badge'; document.body.appendChild(ui.badge);
const backFree = document.createElement('button'); backFree.id = 'backFree'; backFree.textContent = '◀ Menu'; $('menu').appendChild(backFree);
backFree.onclick = () => home();
ui.quit.onclick = () => { token++; game.state = 'over'; showMsg('', ''); home(); };

function render(html, binds) {
  hub.innerHTML = `<div class="card">${html}</div>`; hub.style.display = 'flex';
  $('menu').style.display = 'none'; ui.quit.style.display = 'none'; ui.badge.style.display = 'none';
  for (const [sel, fn] of Object.entries(binds || {})) hub.querySelectorAll(sel).forEach(b => b.onclick = () => fn(b));
}
const hideHub = () => { hub.style.display = 'none'; };

// ---------- accueil ----------
function home() {
  clearHooks(); game.state = 'over'; showHUD(true, true); $('score').style.display = ''; setOpp('IA');
  const n = need(prof.g), ready = prof.wins >= n, max = prof.g >= GRADES.length - 1;
  const done = Object.keys(prof.lessons).length;
  render(`
    <h1>KENDO SHIAI<small>剣道 試合 — v4</small></h1>
    <div class="grade">Grade <b>${GRADES[prof.g]}</b>
      ${max ? '<span>Grade maximal</span>' : `<span class="bar"><i style="width:${Math.min(100, prof.wins / n * 100)}%"></i></span><span>${Math.min(prof.wins, n)}/${n} victoires avant le shinsa</span>`}
    </div>
    <div class="grid">
      <button class="hb" id="bDojo">道場 DOJO<small>Leçons guidées (${done}/${LESSONS.length} réussies)</small></button>
      <button class="hb gold" id="bTour">🏆 TOURNOI<small>8 combattants de votre niveau · ${prof.titles} titre${prof.titles > 1 ? 's' : ''}</small></button>
      <button class="hb ${ready && !max ? 'main' : ''}" id="bShin" ${ready && !max ? '' : 'disabled'}>審査 SHINSA<small>${max ? 'Vous êtes au sommet' : ready ? `Passer le ${GRADES[prof.g + 1]}` : `Encore ${n - prof.wins} victoire${n - prof.wins > 1 ? 's' : ''}`}</small></button>
      <button class="hb" id="bFree">⚔ COMBAT LIBRE<small>Débutant, Kyu ou Dan</small></button>
    </div>
    <p>Chaque victoire en tournoi ou en combat libre vous rapproche du passage de grade.</p>`,
    { '#bDojo': dojo, '#bTour': tournament, '#bShin': shinsaIntro, '#bFree': free });
}

// ---------- combat libre ----------
function free() {
  hideHub(); clearHooks(); setOpp('IA'); showHUD(true, true);
  game.level = +document.querySelector('.pick.sel').dataset.l;
  document.querySelectorAll('.pick').forEach(b => b.addEventListener('click', () => { game.level = +b.dataset.l; }));
  window.hooks = { mode: 'free', end: (s, a) => { if (s > a) addWin(); prof.played++; save(); return false; } };
  $('menu').style.display = 'flex';
}
$('go').addEventListener('click', () => { if (window.hooks && hooks.mode === 'free') ui.quit.style.display = 'block'; });

// ---------- match générique ----------
function startMatch({ profile, name, color, kanji, onEnd }) {
  const my = ++token;
  hideHub(); clearHooks();
  LEVELS[3] = profile; game.level = 3;
  setOpp(name, color, kanji); showHUD(true, true);
  window.hooks = { mode: 'match', end: (s, a) => { if (my !== token) return true; prof.played++; save(); setTimeout(() => onEnd(s > a, s, a), 400); return true; } };
  $('menu').style.display = 'none'; ui.quit.style.display = 'block';
  sfx.init(); game.start();
}

// ---------- DOJO ----------
let lastSeme = 0;
const origSemeFn = player.seme.bind(player);
player.seme = function () { const r = origSemeFn(); if (r) lastSeme = performance.now(); return r; };

const LESSONS = [
  { id: 'maai', title: 'Maai — la distance', goal: 3, kind: 'maai',
    text: 'Trouvez <b>issoku-ittō no maai</b> : la distance où les pointes des shinai se croisent, d\'où l\'on peut frapper en un pas. Approchez-vous avec ▶ et restez immobile 2 secondes à la bonne distance. Le partenaire changera de place 3 fois.' },
  { id: 'men', title: 'Men uchi', goal: 4, check: z => z.type === 'men',
    text: 'Le partenaire (<b>motodachi</b>) reste en garde et vous offre le men. Placez-vous à la bonne distance puis frappez <b>MEN</b>. Juste après la touche, montrez votre <b>zanshin</b> en appuyant sur ◀ ou GARDE, sinon le point est annulé.' },
  { id: 'kote', title: 'Kote uchi', goal: 3, check: z => z.type === 'kote',
    text: 'Frappez le poignet droit du partenaire avec <b>KOTE</b>. La distance est la même que pour le men. Zanshin après chaque point.' },
  { id: 'do', title: 'Dō uchi', goal: 3, check: z => z.type === 'do', guardCycle: true,
    text: 'Le partenaire lève régulièrement les bras. Le men et le kote sont alors protégés, mais le flanc est ouvert : frappez <b>DŌ</b> à ce moment-là.' },
  { id: 'seme', title: 'Seme et ouverture', goal: 3, check: () => performance.now() - lastSeme < 2500, seme: true,
    text: 'Mettez la pression avec <b>SEME</b> : le partenaire se déstabilise un court instant. Frappez aussitôt (men, kote ou dō) pendant cette ouverture.' },
  { id: 'renzoku', title: 'Renzoku-waza : kote-men', goal: 3, check: z => z.name.includes('kote-men'),
    text: 'Frappez <b>KOTE</b> puis, juste après l\'impact, <b>MEN</b>. C\'est l\'enchaînement le plus classique du kendo : c\'est le men final qui doit marquer.' },
  { id: 'hiki', title: 'Tsubazeriai et hiki-waza', goal: 3, check: z => z.name.startsWith('hiki-'), tsuba: true,
    text: 'Vous commencez au contact, shinai croisés (<b>tsubazeriai</b>). Frappez MEN, KOTE ou DŌ : vous reculerez en frappant (<b>hiki-waza</b>). Gardez le zanshin en reculant.' },
];

function dojo() {
  render(`
    <h1>道場 DOJO<small>Leçons avec un partenaire (motodachi)</small></h1>
    <div class="lessons">${LESSONS.map((l, i) => `<button class="hb" data-i="${i}">${prof.lessons[l.id] ? '<span class="ok">✓</span> ' : ''}${i + 1}. ${l.title}<small>Objectif : ${l.goal} réussite${l.goal > 1 ? 's' : ''}</small></button>`).join('')}</div>
    <div class="row2"><button class="hb" id="bBack">◀ Retour</button></div>`,
    { '.lessons .hb': b => lessonIntro(+b.dataset.i), '#bBack': home });
}
function lessonIntro(i) {
  const l = LESSONS[i];
  render(`<h2>Leçon ${i + 1} — ${l.title}</h2><p>${l.text}</p>
    <div class="row2"><button class="hb main" id="bGo">Commencer</button><button class="hb" id="bBack">◀ Dojo</button></div>`,
    { '#bGo': () => startLesson(i), '#bBack': dojo });
}
function lessonSetup(l, st) {
  game.reset();
  if (l.tsuba) { player.x = 680; ai.x = 680 + MIN_D; }
  if (l.kind === 'maai') { player.x = 380; ai.x = 1100; }
  st.ax = ai.x; st.hold = 0; st.cycle = 0;
}
function startLesson(i) {
  const l = LESSONS[i], my = ++token, st = { count: 0 };
  hideHub(); clearHooks();
  LEVELS[3] = TRAIN; game.level = 3; setOpp('Motodachi', '#4a2f12', '師');
  const badge = () => { ui.badge.innerHTML = `${l.title} — <b>${st.count}/${l.goal}</b>`; };
  const complete = () => {
    prof.lessons[l.id] = true; save();
    game.state = 'over'; sfx.whistle();
    showMsg('LEÇON RÉUSSIE !', l.title, 1.6);
    setTimeout(() => {
      if (my !== token) return;
      render(`<h2>✓ Leçon réussie</h2><p>${l.title} : ${l.goal}/${l.goal}. Bien joué !</p>
        <div class="row2">${i + 1 < LESSONS.length ? '<button class="hb main" id="bNext">Leçon suivante ▶</button>' : ''}<button class="hb" id="bDojo">Dojo</button></div>`,
        { '#bNext': () => lessonIntro(i + 1), '#bDojo': dojo });
    }, 1700);
  };
  if (l.seme) aiBrain.onSemed = () => { ai.openT = 1.0; showMsg('', 'Le partenaire est déstabilisé — frappez !', .8); };
  window.hooks = {
    mode: 'lesson',
    ippon: z => {
      if (my !== token) return true;
      const ok = z.att === player && l.check(z);
      if (ok) st.count++;
      badge();
      showMsg(ok ? 'BIEN !' : 'PAS CETTE FOIS', ok ? `${st.count}/${l.goal}` : 'Ce n\'est pas la technique demandée', 1.1);
      game.state = 'pause'; game.pauseT = 99;
      setTimeout(() => {
        if (my !== token) return;
        flagsDown();
        if (st.count >= l.goal) return complete();
        lessonSetup(l, st); game.state = 'fight';
      }, 1200);
      return true;
    },
    ai: dt => {
      if (my !== token) return false;
      if (l.kind === 'maai') {
        const d = ai.x - player.x, good = d > 500 && d < 590;
        const label = good ? 'Bonne distance ✓ — restez immobile' : d >= 590 ? 'Trop loin — avancez ▶' : 'Trop près — reculez ◀';
        if (label !== st.label) { st.label = label; showMsg('', label, 99); }
        if (good && Math.abs(player.vel) < 1) st.hold += dt; else st.hold = 0;
        if (st.hold > 2) {
          st.count++; st.hold = 0; badge(); sfx.pop(); showMsg('BIEN !', `${st.count}/${l.goal}`, 1);
          st.label = '';
          if (st.count >= l.goal) { complete(); return true; }
          st.ax = clampN(ai.x + (Math.random() < .5 ? -1 : 1) * (180 + Math.random() * 160), 760, 1420);
        }
      }
      if (l.guardCycle) { st.cycle = (st.cycle + dt) % 2.6; ai.guarding = st.cycle > 1.3; }
      ai.vel = game.tsuba ? 0 : clampN((st.ax - ai.x) * 3, -260, 260);
      if (game.tsuba) st.ax = ai.x;
      return true;
    },
  };
  showHUD(false, false); ui.quit.style.display = 'block'; ui.badge.style.display = 'block'; $('score').style.display = 'none'; badge();
  sfx.init(); game.start(); game.time = 99999; lessonSetup(l, st);
}

// ---------- TOURNOI ----------
const NAMES = ['Kenji Sato', 'Youssef El Amrani', 'Hiroshi Tanaka', 'Mehdi Benali', 'Lucas Martin', 'Takeshi Mori', 'Amine Ouazzani', 'Daichi Kimura', 'Karim Haddad', 'Sofia Rossi', 'Yuki Nakamura', 'Omar Tazi', 'Ines Alaoui', 'Ren Fujita'];
const ROUNDS = ['Quarts de finale', 'Demi-finales', 'Finale'];
let T = null;
function tournament() {
  const names = [...NAMES].sort(() => Math.random() - .5).slice(0, 7);
  const styles = Object.keys(STYLES);
  const ent = [{ name: 'Vous', me: true, g: prof.g }];
  names.forEach((n, i) => ent.push({ name: n, style: pick(styles), g: clampN(prof.g + (i < 2 ? 1 : i < 5 ? 0 : -1), 0, 13), color: COLORS[(i + 1) % COLORS.length], kanji: KANJI[i % KANJI.length] }));
  T = { ent, rounds: [[0, 1, 2, 3, 4, 5, 6, 7]], r: 0, winners: [] };
  bracket();
}
const short = e => e.me ? 'Vous' : e.name;
function bracket(note) {
  const cols = ROUNDS.map((rn, ri) => {
    const list = T.rounds[ri] || [];
    let html = `<div><h3>${rn}</h3>`;
    if (!list.length) html += '<div class="m"><div><span>—</span></div></div>';
    for (let k = 0; k < list.length; k += 2) {
      const a = list[k], b = list[k + 1], w = T.winners[ri] ? T.winners[ri][k / 2] : undefined;
      const cls = i => (w === undefined ? (T.ent[i].me ? 'me' : '') : w === i ? 'w' : 'l');
      const cur = ri === T.r && (T.ent[a].me || T.ent[b].me) && w === undefined;
      html += `<div class="m${cur ? ' cur' : ''}"><div><span class="${cls(a)}">${short(T.ent[a])}</span></div><div><span class="${cls(b)}">${short(T.ent[b])}</span></div></div>`;
    }
    return html + '</div>';
  }).join('');
  const list = T.rounds[T.r], idx = list.findIndex(i => T.ent[i].me), opp = T.ent[list[idx % 2 ? idx - 1 : idx + 1]];
  render(`<h2>🏆 Tournoi — ${GRADES[prof.g]}</h2>${note ? `<p>${note}</p>` : ''}
    <div class="bracket">${cols}</div>
    <p>${ROUNDS[T.r]} contre <b>${opp.name}</b> (${GRADES[opp.g]}, style ${STYLES[opp.style].label.toLowerCase()})</p>
    <div class="row2"><button class="hb main" id="bFight">Combattre</button><button class="hb" id="bBack">Abandonner</button></div>`,
    { '#bFight': () => fightRound(opp), '#bBack': home });
}
function simulate(a, b) {
  const ga = T.ent[a].g, gb = T.ent[b].g;
  return Math.random() < .5 + (ga - gb) * .12 ? a : b;
}
function fightRound(opp) {
  startMatch({ profile: profileFor(opp.g, opp.style), name: opp.name.split(' ')[0], color: opp.color, kanji: opp.kanji, onEnd: (won, s, a) => {
    const list = T.rounds[T.r], w = [];
    for (let k = 0; k < list.length; k += 2) {
      const x = list[k], y = list[k + 1];
      if (T.ent[x].me || T.ent[y].me) w.push(won ? (T.ent[x].me ? x : y) : (T.ent[x].me ? y : x));
      else w.push(simulate(x, y));
    }
    T.winners[T.r] = w;
    if (!won) {
      render(`<h2>Éliminé en ${ROUNDS[T.r].toLowerCase()}</h2><p>${opp.name} l'emporte ${a} à ${s}. Entraînez-vous au dojo et revenez plus fort !</p>
        <div class="row2"><button class="hb main" id="bAgain">Nouveau tournoi</button><button class="hb" id="bHome">Menu</button></div>`,
        { '#bAgain': tournament, '#bHome': home });
      return;
    }
    addWin();
    if (T.r === ROUNDS.length - 1) {
      prof.titles++; addWin();
      render(`<h2>🏆 CHAMPION !</h2><p>Vous remportez le tournoi ${GRADES[prof.g]} en battant ${opp.name} ${s} à ${a} en finale. Cette victoire compte double pour votre passage de grade.</p>
        <div class="row2"><button class="hb main" id="bHome">Menu</button></div>`, { '#bHome': home });
      return;
    }
    T.r++; T.rounds[T.r] = w;
    bracket(`Victoire ${s} à ${a} contre ${opp.name} ! Prochain tour :`);
  } });
}

// ---------- SHINSA (passage de grade) ----------
function shinsaIntro() {
  const next = GRADES[prof.g + 1];
  render(`<h2>審査 Shinsa — examen de ${next}</h2>
    <p>Le jury vous observe pendant un combat (<b>jitsugi</b>) contre un examinateur du niveau ${next}. Pour réussir, vous devez <b>gagner le combat</b>. Montrez une bonne distance, du seme, des frappes nettes et votre zanshin.</p>
    <div class="row2"><button class="hb main" id="bGo">Commencer l'examen</button><button class="hb" id="bBack">◀ Retour</button></div>`,
    { '#bGo': shinsa, '#bBack': home });
}
function shinsa() {
  const g = prof.g + 1;
  startMatch({ profile: profileFor(g, pick(Object.keys(STYLES))), name: 'Examinateur', color: '#0c0c10', kanji: '審', onEnd: (won, s, a) => {
    if (won) {
      prof.g = g; prof.wins = 0; save();
      render(`<h2>🎉 Félicitations !</h2><p>Vous réussissez l'examen ${s} à ${a}. Vous êtes maintenant <b>${GRADES[g]}</b>. Les adversaires des tournois seront plus forts.</p>
        <div class="row2"><button class="hb main" id="bHome">Menu</button></div>`, { '#bHome': home });
    } else {
      prof.wins = Math.max(0, need(prof.g) - 1); save();
      render(`<h2>Examen non réussi</h2><p>L'examinateur l'emporte ${a} à ${s}. Gagnez encore un combat pour retenter le shinsa.</p>
        <div class="row2"><button class="hb main" id="bHome">Menu</button></div>`, { '#bHome': home });
    }
  } });
}

window.kendoModes = { prof, profileFor, home, startLesson, tournament, shinsa, LESSONS, GRADES };
home();
})();
