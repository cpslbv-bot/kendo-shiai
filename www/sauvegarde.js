// Kendo Shiai — sauvegarde de la progression : export / import par code, reprise à un grade
(() => {
'use strict';
const $ = id => document.getElementById(id);
const GR = ['6e kyu', '5e kyu', '4e kyu', '3e kyu', '2e kyu', '1er kyu', '1er dan', '2e dan', '3e dan', '4e dan', '5e dan', '6e dan', '7e dan', '8e dan'];
const keys = () => Object.keys(localStorage).filter(k => k.startsWith('kendo.'));
function exportCode() {
  const o = {}; for (const k of keys()) o[k] = localStorage.getItem(k);
  return 'KS1-' + btoa(unescape(encodeURIComponent(JSON.stringify(o))));
}
function importCode(code) {
  const o = JSON.parse(decodeURIComponent(escape(atob(code.trim().replace(/^KS1-/, '')))));
  for (const k in o) if (k.startsWith('kendo.')) localStorage.setItem(k, o[k]);
}
function setGrade(g) {
  let p = {}; try { p = JSON.parse(localStorage.getItem('kendo.profile.v2') || '{}'); } catch (e) {}
  p.g = g; p.wins = 0; p.stars = p.stars || {};
  if (window.academy) for (const l of academy.L) if (l.g < g && !p.stars[l.id]) p.stars[l.id] = 1;
  localStorage.setItem('kendo.profile.v2', JSON.stringify(p));
}
function panel() {
  const card = document.querySelector('#hub .card'); if (!card || $('saveOpts')) return;
  const d = document.createElement('div'); d.id = 'saveOpts';
  const g = window.academy ? academy.prof.g : 0;
  d.innerHTML = `<div class="opt"><span>💾 Ma progression</span><button class="hb sm" id="svExp">Copier mon code de sauvegarde</button><button class="hb sm" id="svImp">Restaurer un code</button></div>
    <div class="opt"><span>Reprendre à un grade</span><select id="svGr" style="padding:6px 8px;border-radius:10px;background:#222;color:#fff;border:2px solid #555;font-size:14px">${GR.map((t, i) => `<option value="${i}"${i === g ? ' selected' : ''}>${t}</option>`).join('')}</select><button class="hb sm" id="svGo">Appliquer</button></div>
    <div id="svBox" style="display:none;margin:4px auto;max-width:560px"><textarea id="svTxt" rows="3" style="width:100%;border-radius:10px;background:#111;color:#ffd34d;border:2px solid #555;font-size:12px;padding:6px"></textarea><div class="row2" id="svAct"></div></div>`;
  card.insertBefore(d, card.querySelector('.row2'));
  const box = $('svBox'), txt = $('svTxt'), act = $('svAct');
  $('svExp').onclick = () => {
    const c = exportCode(); box.style.display = 'block'; txt.style.display = ''; txt.value = c; txt.select();
    try { navigator.clipboard.writeText(c); } catch (e) {}
    act.innerHTML = '<span class="ok">Code copié : collez-le dans une note ou un message pour le garder.</span>';
  };
  $('svImp').onclick = () => {
    box.style.display = 'block'; txt.style.display = ''; txt.value = ''; txt.placeholder = 'Collez ici votre code KS1-…';
    act.innerHTML = '<button class="hb sm main" id="svOk">Restaurer</button>';
    $('svOk').onclick = () => { try { importCode(txt.value); location.reload(); } catch (e) { act.innerHTML = '<span class="ko">Code invalide</span>'; } };
  };
  $('svGo').onclick = () => {
    const ng = +$('svGr').value;
    act.innerHTML = `<span>Reprendre au <b>${GR[ng]}</b> ? Les leçons des grades précédents seront marquées comme faites.</span> <button class="hb sm main" id="svYes">Confirmer</button>`;
    box.style.display = 'block'; txt.style.display = 'none';
    $('svYes').onclick = () => { setGrade(ng); location.reload(); };
  };
}
new MutationObserver(() => { const h = document.querySelector('#hub h2'); if (h && h.textContent.includes('Personnaliser')) panel(); }).observe($('hub'), { childList: true, subtree: true });
window.sauvegarde = { exportCode, importCode, setGrade };
})();
