// Kendo Shiai v6.2 — voix de l'arbitre, kiai vocal, décor et kendoka plus détaillés
(() => {
'use strict';
const NS = 'http://www.w3.org/2000/svg', $ = id => document.getElementById(id);
const el = (tag, attrs, parent, before) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.insertBefore(e, before || null); return e; };
const KEY = 'kendo.sound.v1';
const opt = { ref: true, kiai: true };
try { Object.assign(opt, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
const saveOpt = () => { try { localStorage.setItem(KEY, JSON.stringify(opt)); } catch (e) {} };

// ================= VOIX =================
// Synthèse vocale native d'Android (Capacitor), ou celle du navigateur en secours. Japonais si disponible.
const TTS = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech;
let jaOK = null;
async function say(ja, romaji, o = {}) {
  const rate = o.rate || 1, pitch = o.pitch || 1, volume = o.volume || 1;
  const t = TTS();
  if (t) {
    if (jaOK !== false) {
      try { await t.speak({ text: ja, lang: 'ja-JP', rate, pitch, volume, category: 'playback' }); jaOK = true; return; } catch (e) { jaOK = false; }
    }
    try { await t.speak({ text: romaji, lang: 'fr-FR', rate, pitch, volume, category: 'playback' }); } catch (e) {}
    return;
  }
  if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
    try {
      const voices = speechSynthesis.getVoices(), ja1 = voices.find(v => /^ja/i.test(v.lang));
      const u = new SpeechSynthesisUtterance(ja1 ? ja : romaji);
      if (ja1) u.voice = ja1; else u.lang = 'fr-FR';
      u.rate = rate; u.pitch = pitch; u.volume = volume;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) {}
  }
}
// annonces de l'arbitre (shushin)
const CALLS = [
  [/^HAJIME/, 'はじめ', 'Hadjimé'], [/^MEN ARI !/, 'めんあり', 'Mènn ari'], [/^KOTE ARI !/, 'こてあり', 'Koté ari'], [/^DŌ ARI !/, 'どうあり', 'Do ari'],
  [/^TSUKI ARI !/, 'つきあり', 'Tski ari'], [/^NIHONME/, 'にほんめ', 'Nihonmé'], [/^SHŌBU ARI/, 'しょうぶあり', 'Chobou ari'], [/^SHŌBU/, 'しょうぶ', 'Chobou'],
  [/^YAME/, 'やめ', 'Yamé'], [/^HIKIWAKE/, 'ひきわけ', 'Hikiwaké'], [/^WAKARE/, 'わかれ', 'Wakaré'], [/^HANSOKU ICHIKAI/, 'はんそく いっかい', 'Hannsokou ikkaï'],
  [/^HANSOKU NIKAI/, 'はんそく にかい', 'Hannsokou nikaï'], [/^TORIKESHI/, 'とりけし', 'Torikéchi'], [/^ENCHO/, 'えんちょう はじめ', 'Enntcho, hadjimé'],
];
const _show = window.showMsg;
window.showMsg = function (big, small, dur) {
  _show(big, small, dur);
  if (!opt.ref || !big || game.state === 'replay') return;
  for (const [re, ja, ro] of CALLS) if (re.test(big)) { say(ja, ro, { rate: .9, pitch: .85 }); break; }
};
// kiai : le cri annonce la cible
const KIAI = { men: ['メーン', 'Mèèn'], kote: ['コテー', 'Kotéé'], do: ['ドー', 'Doo'], tsuki: ['ツキー', 'Tsukii'] };
const _kiai = sfx.kiai;
sfx.kiai = function (aka, type) {
  _kiai(aka, type);
  if (!opt.kiai || game.state === 'replay' || !KIAI[type]) return;
  if (window.hooks && (hooks.mode === 'kiri' || hooks.mode === 'kata')) return;
  const k = KIAI[type]; say(k[0], k[1], { rate: 1.5, pitch: aka ? .8 : 1.25, volume: .9 });
};

// ================= KENDOKA PLUS DÉTAILLÉS =================
function detail(f, aka) {
  const all = [...f.v.root.querySelectorAll('*')];
  const find = pre => all.find(e => (e.getAttribute('d') || '').startsWith(pre));
  const body = f.v.body;
  // koshi-ita (dossier rigide du hakama), derrière le hakama
  const hak = find('M -44 -182');
  if (hak) el('path', { d: 'M -46 -184 L -30 -184 L -34 -150 L -50 -152 Z', fill: aka ? '#141a36' : '#cbc7be', stroke: '#00000040', 'stroke-width': 1.5 }, body, hak);
  // ombre douce du corps
  const torso = find('M -40 -186 L 40 -186 L 44');
  if (torso) el('path', { d: 'M -40 -186 L -10 -186 L -14 -270 Q -30 -268 -42 -262 Z', fill: '#000', opacity: .12 }, body, torso.nextSibling);
  // mune du dō : piqûres décoratives
  const mune = find('M 8 -262 Q 46 -258');
  if (mune) {
    const g = el('g', { stroke: '#d9b77a', 'stroke-width': 1.2, fill: 'none', opacity: .8 }, body, mune.nextSibling);
    for (let i = 0; i < 4; i++) el('path', { d: `M ${14 + i * 2} ${-257 + i * 5} Q ${40} ${-254 + i * 5} ${54 - i * 2} ${-240 + i * 2}` }, g);
    el('circle', { cx: 18, cy: -246, r: 2.2, fill: '#c9a25a', stroke: 'none' }, g);
  }
  // dō : reflet de laque et bordure
  const doP = all.find(e => /doBlack|doRed/.test(e.getAttribute('fill') || ''));
  if (doP) el('path', { d: 'M 14 -232 Q 60 -224 62 -196', stroke: '#ffffff', 'stroke-opacity': .35, 'stroke-width': 2, fill: 'none' }, body, doP.nextSibling);
  // dō-himo (cordons d'épaule)
  if (torso) el('path', { d: 'M 6 -262 Q -6 -276 -18 -268', stroke: aka ? '#e8e2d0' : '#2a2f55', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, body, torso.nextSibling);
  // men : bande monomi, reflet du men-gane, bordure en cuir du men-dare
  const head = f.v.body.querySelector('g[transform="translate(6,-300)"]');
  if (head) {
    el('rect', { x: 14, y: -14, width: 22, height: 5, fill: '#000', opacity: .35 }, head);
    el('path', { d: 'M 25 -32 Q 42 -8 25 26', stroke: '#fff', 'stroke-opacity': .5, 'stroke-width': 1.5, fill: 'none' }, head);
    el('path', { d: 'M -60 70 L 24 66', stroke: '#5a3a24', 'stroke-width': 4, 'stroke-linecap': 'round' }, head, head.children[1]);
    el('path', { d: 'M -32 -30 Q -36 0 -30 24', stroke: '#ffffff', 'stroke-opacity': .12, 'stroke-width': 6, fill: 'none' }, head);
  }
  // kote : poing en cuir plus marqué
  for (const k of [f.v.kR, f.v.kL]) {
    el('path', { d: 'M -14 -10 Q 0 -18 14 -10', stroke: '#ffffff', 'stroke-opacity': .25, 'stroke-width': 2, fill: 'none' }, k);
    el('rect', { x: -14, y: -4, width: 28, height: 3, fill: '#00000055' }, k);
  }
}
detail(player, false); detail(ai, true);

// ================= DÉCOR PLUS RICHE =================
(function decor() {
  const far = $('far'), world = $('world');
  // poutres du plafond
  for (let i = -2; i < 10; i++) el('rect', { x: -800 + i * 320, y: 0, width: 300, height: 18, fill: '#2e1f10', opacity: .9 }, far);
  el('rect', { x: -800, y: 18, width: 3200, height: 6, fill: '#1e140a' }, far);
  // nafuda-kake : tableau des noms du dojo
  const nf = el('g', { transform: 'translate(560,300)' }, far);
  el('rect', { x: 0, y: 0, width: 130, height: 110, fill: '#4a3018', stroke: '#2a1a0c', 'stroke-width': 4 }, nf);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) { el('rect', { x: 6 + c * 15.5, y: 8 + r * 34, width: 12, height: 28, fill: '#e8dcc0' }, nf); el('rect', { x: 9 + c * 15.5, y: 12 + r * 34, width: 6, height: 18, fill: '#2a2a2a', opacity: .55 }, nf); }
  // kamidana au-dessus de la bannière
  const kd = el('g', { transform: 'translate(800,40)' }, far);
  el('path', { d: 'M -60 10 L 0 -14 L 60 10 Z', fill: '#3a2614' }, kd);
  el('rect', { x: -44, y: 10, width: 88, height: 14, fill: '#c9a25a' }, kd);
  el('rect', { x: -30, y: 2, width: 6, height: 10, fill: '#fff', opacity: .8 }, kd); el('rect', { x: 24, y: 2, width: 6, height: 10, fill: '#fff', opacity: .8 }, kd);
  // rayons de lumière des shōji
  const rays = el('g', { opacity: .1 }, far);
  for (const x of [60, 300, 1100, 1340]) el('path', { d: `M ${x} 90 L ${x + 200} 90 L ${x + 330} 440 L ${x + 120} 440 Z`, fill: '#fff6dc' }, rays);
  // tambour taiko dans le coin
  const tk = el('g', { transform: 'translate(1500,402)' }, far);
  el('ellipse', { cx: 0, cy: 0, rx: 34, ry: 30, fill: '#6b2a14', stroke: '#2a1208', 'stroke-width': 4 }, tk);
  el('ellipse', { cx: 0, cy: 0, rx: 24, ry: 22, fill: '#e8dcc0' }, tk);
  el('rect', { x: -30, y: 28, width: 60, height: 14, fill: '#3a2614' }, tk);
  // reflets brillants sur le parquet
  const gl = el('g', { opacity: .12 }, world, world.firstChild);
  for (let i = -6; i < 14; i++) el('rect', { x: i * 160, y: 470, width: 40, height: 230, fill: '#fff8e0', transform: `skewX(-18)` }, gl);
})();

// ================= RÉGLAGES DU SON (dans « Mon kendoka ») =================
function soundPanel() {
  const card = document.querySelector('#hub .card'); if (!card || $('sndOpts')) return;
  const d = document.createElement('div'); d.id = 'sndOpts';
  const row = (k, lab) => `<div class="opt"><span>${lab}</span><button class="hb sm${opt[k] ? ' sel' : ''}" data-snd="${k}" data-v="1">Oui</button><button class="hb sm${!opt[k] ? ' sel' : ''}" data-snd="${k}" data-v="0">Non</button></div>`;
  d.innerHTML = row('ref', '🔊 Voix de l\'arbitre') + row('kiai', '📣 Kiai vocal') + '<div class="opt"><span></span><button class="hb sm" id="sndTest">▶ Écouter un exemple</button></div>';
  card.insertBefore(d, card.querySelector('.row2'));
  d.querySelectorAll('[data-snd]').forEach(b => b.onclick = () => { opt[b.dataset.snd] = b.dataset.v === '1'; saveOpt(); d.remove(); soundPanel(); });
  $('sndTest').onclick = () => { say('めんあり', 'Mènn ari', { rate: .9, pitch: .85 }); setTimeout(() => say('メーン', 'Mèèn', { rate: 1.5, pitch: 1.25 }), 1400); };
}
new MutationObserver(() => { const h = document.querySelector('#hub h2'); if (h && h.textContent.includes('Personnaliser')) soundPanel(); }).observe($('hub'), { childList: true, subtree: true });

window.ambiance = { say, opt };
})();
