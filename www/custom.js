// Kendo Shiai v6 — personnalisation du kendoka (keikogi, hakama, bōgu, dō, himo, zekken, drapeau)
(() => {
'use strict';
const A = window.academy, $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const KEY = 'kendo.custom.v1';
const DEF = { gi: 'white', hakama: 'white', bogu: 'navy', do: 'black', himo: 'purple', name: '', flag: true };
let cs = { ...DEF };
try { Object.assign(cs, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
const PAL = {
  gi: { white: ['Blanc', ['#cfcbc2', '#f4f2ec', '#d9d5cc'], '#bdb9b0'], indigo: ['Indigo', ['#151a33', '#2b3566', '#171c38'], '#10142a'], black: ['Noir', ['#0c0c0f', '#2a2a30', '#111114'], '#08080a'] },
  hakama: { white: ['Blanc', ['#cfcbc2', '#f4f2ec', '#d9d5cc'], '#a8a49a'], indigo: ['Indigo', ['#151a33', '#2b3566', '#171c38'], '#0b0e20'], black: ['Noir', ['#0c0c0f', '#2a2a30', '#111114'], '#050506'] },
  bogu: { navy: ['Bleu marine', '#1d2346'], black: ['Noir', '#151517'], brown: ['Brun', '#3a2a1e'], red: ['Bordeaux', '#4a1414'] },
  do: { black: ['Laque noire', 'url(#doBlack)'], red: ['Laque rouge', 'url(#doRed)'], brown: ['Bois', '#6a4524'], green: ['Vert', '#1f3b2a'], blue: ['Bleu', '#123044'], gold: ['Or', '#8a6a1a'] },
  himo: { purple: ['Violet', '#6b5fb8'], red: ['Rouge', '#c0392b'], white: ['Blanc', '#eeeeee'], blue: ['Bleu', '#2e6fd8'] },
};
// --- dégradés propres au joueur
const defs = document.querySelector('#s defs');
const grad = id => { let g = document.getElementById(id); if (!g) { g = document.createElementNS(NS, 'linearGradient'); g.id = id; g.setAttribute('x1', 0); g.setAttribute('y1', 0); g.setAttribute('x2', 1); g.setAttribute('y2', 0); [0, .6, 1].forEach(o => { const s = document.createElementNS(NS, 'stop'); s.setAttribute('offset', o); g.appendChild(s); }); defs.appendChild(g); } return g; };
const gGi = grad('pGi'), gHak = grad('pHak');
const setGrad = (g, cols) => [...g.children].forEach((s, i) => s.setAttribute('stop-color', cols[i]));
// --- références vers les éléments du kendoka joueur
const root = player.v.root, all = [...root.querySelectorAll('*')];
const R = {
  hakama: all.find(e => (e.getAttribute('d') || '').startsWith('M -44 -182')),
  torso: all.find(e => (e.getAttribute('d') || '').startsWith('M -40 -186 L 40 -186 L 44')),
  pleats: all.filter(e => e.tagName === 'line' && e.getAttribute('y1') === '-176'),
  bogu: all.filter(e => ['#1d2346', '#1a1f3c'].includes(e.getAttribute('fill'))),
  bogu2: all.filter(e => e.getAttribute('fill') === '#20264a'),
  do: all.find(e => e.getAttribute('fill') === 'url(#doBlack)'),
  zek: root.querySelector('text'),
};
// drapeau du Maroc sur le zekken
const flag = document.createElementNS(NS, 'g'); flag.setAttribute('transform', 'translate(21,-192)');
flag.innerHTML = '<rect width="24" height="15" fill="#c1272d" stroke="#000" stroke-width=".6"/><path d="M12 3.2 L13.6 8.4 L9.2 5.2 L14.8 5.2 L10.4 8.4 Z" fill="none" stroke="#006233" stroke-width="1.1"/>';
R.zek.parentNode.appendChild(flag);
function apply() {
  const gi = PAL.gi[cs.gi], hk = PAL.hakama[cs.hakama];
  setGrad(gGi, gi[1]); setGrad(gHak, hk[1]);
  R.torso.setAttribute('fill', 'url(#pGi)'); R.torso.setAttribute('stroke', gi[2]);
  player.v.nUpper.setAttribute('stroke', 'url(#pGi)'); player.v.fUpper.setAttribute('stroke', gi[2]);
  R.hakama.setAttribute('fill', 'url(#pHak)'); R.hakama.setAttribute('stroke', hk[2]);
  R.pleats.forEach(l => l.setAttribute('stroke', hk[2]));
  const b = PAL.bogu[cs.bogu][1];
  R.bogu.forEach(e => e.setAttribute('fill', b)); R.bogu2.forEach(e => e.setAttribute('fill', b));
  player.v.nFore.setAttribute('stroke', b); player.v.fFore.setAttribute('stroke', b);
  R.do.setAttribute('fill', PAL.do[cs.do][1]);
  for (const h of [player.v.himo1, player.v.himo2]) h.setAttribute('stroke', PAL.himo[cs.himo][1]);
  const nm = (cs.name || '').trim().toUpperCase().slice(0, 3);
  R.zek.textContent = nm || '白';
  R.zek.setAttribute('font-size', nm.length <= 1 ? 24 : nm.length === 2 ? 17 : 12);
  R.zek.setAttribute('y', cs.flag ? -150 : -158);
  flag.style.display = cs.flag ? '' : 'none';
  const nS = $('nS'); if (nS) nS.textContent = (cs.name || '').trim() || 'Vous';
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(cs)); } catch (e) {} }
function preview() {
  const c = root.cloneNode(true); c.removeAttribute('transform');
  return `<svg viewBox="-150 -370 300 390" width="190" height="247" style="background:radial-gradient(circle,#5a4230,#2a1d12);border-radius:14px">${c.outerHTML}</svg>`;
}
function open() {
  apply();
  const grp = (key, lab) => `<div class="opt"><span>${lab}</span>${Object.entries(PAL[key]).map(([k, v]) => `<button class="hb sm${cs[key] === k ? ' sel' : ''}" data-k="${key}" data-v="${k}">${v[0]}</button>`).join('')}</div>`;
  A.render(`<h2>🎨 Personnaliser votre kendoka</h2>
    <div style="display:flex;gap:14px;align-items:flex-start;justify-content:center;flex-wrap:wrap">
      <div>${preview()}</div>
      <div style="flex:1;min-width:300px">
        ${grp('gi', 'Keikogi')}${grp('hakama', 'Hakama')}${grp('bogu', 'Bōgu (men, kote, tare)')}${grp('do', 'Dō')}${grp('himo', 'Men-himo')}
        <div class="opt"><span>Nom sur le zekken</span><input id="cName" maxlength="12" value="${(cs.name || '').replace(/"/g, '')}" placeholder="ex. Khalid" style="padding:7px 10px;border-radius:10px;border:2px solid #555;background:#222;color:#fff;font-size:15px;width:150px"></div>
        <div class="opt"><span>Drapeau du Maroc 🇲🇦</span><button class="hb sm${cs.flag ? ' sel' : ''}" data-k="flag" data-v="1">Oui</button><button class="hb sm${!cs.flag ? ' sel' : ''}" data-k="flag" data-v="0">Non</button></div>
        <p style="font-size:12px">Les 3 premières lettres du nom s'affichent sur le zekken, le nom complet sur le tableau des scores.</p>
      </div>
    </div>
    <div class="row2"><button class="hb main" id="bOk">Enregistrer</button><button class="hb" id="bReset">Par défaut</button><button class="hb" id="bBack">◀ Menu</button></div>`,
    { '.opt .hb': b => { const k = b.dataset.k; cs[k] = k === 'flag' ? b.dataset.v === '1' : b.dataset.v; cs.name = $('cName').value; save(); open(); },
      '#bOk': () => { cs.name = $('cName').value; save(); apply(); A.home(); },
      '#bReset': () => { cs = { ...DEF }; save(); open(); },
      '#bBack': () => { cs.name = $('cName').value; save(); apply(); A.home(); } });
}
apply();
window.custom = { open, apply, get: () => cs };
})();
