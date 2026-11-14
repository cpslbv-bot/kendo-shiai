// Kendo Shiai — graphismes « 2.5D HD » allégés : rayons de lumière, taches de lumière, ambiance chaude, vignette (sans filtres coûteux)
(() => {
'use strict';
const $ = id => document.getElementById(id);
const KEY = 'kendo.gfx.v1';
const opt = { hd: true };
try { Object.assign(opt, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
const saveOpt = () => { try { localStorage.setItem(KEY, JSON.stringify(opt)); } catch (e) {} };
const NSV = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs, parent, before) => { const e = document.createElementNS(NSV, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (before) parent.insertBefore(e, before); else if (parent) parent.appendChild(e); return e; };

// ---------- vue de côté ----------
const svg = $('s'), defs = svg.querySelector('defs');
defs.insertAdjacentHTML('beforeend', `<linearGradient id="hdRay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3d0" stop-opacity=".5"/><stop offset=".55" stop-color="#fff3d0" stop-opacity=".22"/><stop offset="1" stop-color="#fff3d0" stop-opacity="0"/></linearGradient>
<radialGradient id="hdVig" cx=".5" cy=".45" r=".72"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#140900" stop-opacity=".6"/></radialGradient>
<radialGradient id="hdPool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff0c8" stop-opacity=".22"/><stop offset="1" stop-color="#fff0c8" stop-opacity="0"/></radialGradient>`);
// rayons et taches de lumière sur le parquet (suivent la parallaxe du décor)
const rays = mk('g', { 'pointer-events': 'none', opacity: .6 }, svg, world);
for (const x of [-500, -260, 60, 300, 1100, 1340, 1660, 1900]) {
  mk('path', { d: `M ${x + 10} 92 L ${x + 190} 92 L ${x + 470} 720 L ${x + 160} 720 Z`, fill: 'url(#hdRay)', opacity: .55 }, rays);
  mk('ellipse', { cx: x + 330, cy: 600, rx: 170, ry: 40, fill: 'url(#hdPool)' }, rays);
}
// étalonnage chaud + vignette
const grade = mk('g', { 'pointer-events': 'none' }, svg);
mk('rect', { x: -200, y: 0, width: 2000, height: 720, fill: '#ff9a3c', opacity: .05 }, grade);
mk('rect', { width: 1600, height: 720, fill: 'url(#hdVig)' }, grade);

function apply() {
  const on = opt.hd;
  // aucun filtre CSS (flou, ombre portée) : ils provoquent des saccades sur Android
  far.style.filter = ''; fighters.style.filter = '';
  rays.style.display = grade.style.display = on ? '' : 'none';
  const pv = $('pov');
  if (pv) {
    const bg = pv.children[3], opp = pv.querySelector('.o'), j = pv.querySelector('.j');
    if (bg) bg.style.filter = ''; if (j) j.style.filter = ''; if (opp) opp.style.filter = '';
    if (!pv.querySelector('.hdTop')) {
      const top = mk('g', { class: 'hdTop', 'pointer-events': 'none' }, pv, pv.querySelector('.m'));
      top.innerHTML = `<g opacity=".6">${[20, 190, 940, 1110].map(x => `<path d="M ${x} 70 L ${x + 150} 70 L ${x + 380} 720 L ${x + 110} 720 Z" fill="url(#hdRay)" opacity=".45"/>`).join('')}</g><rect x="-500" width="2280" height="720" fill="#ff9a3c" opacity=".05"/>`;
    }
    pv.querySelector('.hdTop').style.display = on ? '' : 'none';
  }
}
(function loop() { rays.setAttribute('transform', far.getAttribute('transform') || ''); requestAnimationFrame(loop); })();
apply(); setTimeout(apply, 500);

// ---------- réglage (dans « Mon kendoka ») ----------
function panel() {
  const card = document.querySelector('#hub .card'); if (!card || $('gfxOpt')) return;
  const d = document.createElement('div'); d.id = 'gfxOpt';
  d.innerHTML = `<div class="opt"><span>✨ Graphismes</span><button class="hb sm${opt.hd ? ' sel' : ''}" data-v="1">HD</button><button class="hb sm${!opt.hd ? ' sel' : ''}" data-v="0">Standard (téléphone lent)</button></div>`;
  card.insertBefore(d, card.querySelector('.row2'));
  d.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { opt.hd = b.dataset.v === '1'; saveOpt(); apply(); d.remove(); panel(); });
}
new MutationObserver(() => { const h = document.querySelector('#hub h2'); if (h && h.textContent.includes('Personnaliser')) panel(); }).observe($('hub'), { childList: true, subtree: true });
window.gfx = { opt, apply };
})();
