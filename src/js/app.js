/* Kompass – lädt Artikel aus src/articles und baut die Seite.
   Ein Artikel = ein flacher Ordner: tags.json, content.md, Bilder. */
const CONFIG = {
  articlesPath: 'src/articles/',
  instagram: 'https://www.instagram.com/DEIN_ACCOUNT/',   // <- hier anpassen
  contact: { email: 'redaktion@example.de', phone: '+49 000 000000', address: 'Musterstraße 1, 00000 Musterstadt' },
  categories: [
    { slug: 'aktuelles',       name: 'Aktuelles / Lokales', desc: 'Tägliche Meldungen aus Stadt, Landkreis und Nachbarorten.' },
    { slug: 'politik-arbeit',  name: 'Politik & Arbeit',    desc: 'Lokale Unternehmen, Neueröffnungen, Gewerbegebiete, Handwerk und Jobmarkt.' },
    { slug: 'sport-kultur',    name: 'Sport & Kultur',      desc: 'Vereine, Bühne, Ausstellungen und Ergebnisse.' },
    { slug: 'veranstaltungen', name: 'Veranstaltungen',     desc: 'Was in den nächsten Tagen und Wochen los ist.' },
  ],
};

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtDate = d => new Date(d).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
const catOf = slug => CONFIG.categories.find(c => c.slug === slug);

/* ---------- Mini-Markdown ---------- */
function inline(t) {
  return esc(t)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
function md(src, base) {
  const out = []; let list = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of src.split(/\n{2,}|\n(?=[-#>])/)) {
    for (const line of raw.split('\n').filter(l => l.trim())) {
      let m;
      if ((m = line.match(/^(#{1,3})\s+(.*)/))) { close(); out.push(`<h${m[1].length + 1}>${inline(m[2])}</h${m[1].length + 1}>`); }
      else if ((m = line.match(/^[-*]\s+(.*)/))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push(`<li>${inline(m[1])}</li>`); }
      else if ((m = line.match(/^>\s?(.*)/))) { close(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); }
      else { close(); out.push(/^!\[/.test(line) ? inline(line) : `<p>${inline(line)}</p>`); }
    }
  }
  close();
  return out.join('\n').replace(/src="(?!https?:|\/)([^"]+)"/g, `src="${base}$1"`);
}

/* ---------- Laden ---------- */
async function loadArticles() {
  const folders = await (await fetch(CONFIG.articlesPath + 'index.json')).json();
  const list = await Promise.all(folders.map(async f => {
    try {
      const base = `${CONFIG.articlesPath}${f}/`;
      const [tags, text] = await Promise.all([fetch(base + 'tags.json').then(r => r.json()), fetch(base + 'content.md').then(r => r.text())]);
      const title = (text.match(/^#\s+(.+)$/m) || [, f])[1];
      const body = text.replace(/^#\s+.+\n?/m, '').trim();
      const img = (body.match(/!\[[^\]]*\]\(([^)]+)\)/) || [])[1];
      const teaser = (body.split(/\n{2,}/).find(p => p.trim() && !/^[!#>-]/.test(p.trim())) || '').replace(/\*/g, '');
      const cats = [].concat(tags.categories || []).map(c => {
        const k = CONFIG.categories.find(x => x.slug === c || x.name.toLowerCase() === String(c).toLowerCase());
        return k ? k.slug : c;
      });
      return { id: f, base, title, body, teaser, date: tags.date, cat: cats[0], image: img ? (/^https?:/.test(img) ? img : base + img) : null };
    } catch (e) { console.warn('Artikel übersprungen:', f, e); return null; }
  }));
  return list.filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date));
}

/* ---------- Bausteine ---------- */
const link = a => `#/artikel/${a.id}`;
const label = a => `<span class="cat">${esc(catOf(a.cat)?.name || a.cat || '')}</span>`;
const card = (a, { size = 'm', img = false, teaser = true, date = false, cls = '' } = {}) => `
  <article class="card ${cls}"><a href="${link(a)}">
    ${img && a.image ? `<img src="${a.image}" alt="" loading="lazy">` : ''}
    ${label(a)}<h3 class="h h--${size}">${esc(a.title)}</h3>
    ${teaser && a.teaser ? `<p class="teaser">${esc(a.teaser)}</p>` : ''}
    ${date ? `<span class="meta">${fmtDate(a.date)}</span>` : ''}
  </a></article>`;
const mini = a => `<article class="card mini ${a.image ? '' : 'mini--noimg'}"><a href="${link(a)}" style="display:contents">
  <div>${label(a)}<h3 class="h h--s">${esc(a.title)}</h3><span class="meta">${fmtDate(a.date)}</span></div>
  ${a.image ? `<img src="${a.image}" alt="" loading="lazy">` : ''}</a></article>`;

/* ---------- Kachel-Algorithmus ----------
   Oben: neueste Artikel. Artikel MIT Bild bekommen die großen Plätze
   (Hero, Seitenbild, "Latest"-Reihe), Artikel ohne Bild die Textplätze.
   Darunter: pro Kategorie ein Block (großer Platz = neuester Artikel mit Bild). */
function tileTop(all) {
  const used = new Set(), take = a => (a && used.add(a.id), a);
  const withImg = all.filter(a => a.image), noImg = all.filter(a => !a.image);
  const hero = take(withImg[0]), side = take(withImg[1]);
  const listPool = all.filter(a => !used.has(a.id)).slice(0, 8);   // neueste Reste -> Textspalte
  const textList = listPool.filter(a => !a.image).slice(0, 4);
  while (textList.length < 3 && listPool.length > textList.length) {
    const x = listPool.find(a => !textList.includes(a)); if (!x) break; textList.push(x);
  }
  textList.forEach(take);
  const also = take(all.find(a => !used.has(a.id) && !a.image));
  const latest = all.filter(a => !used.has(a.id) && a.image).slice(0, 4); latest.forEach(take);
  return { hero, side, textList, also, latest };
}
function tileCategory(arts) {
  const lead = arts.find(a => a.image) || arts[0];
  return { lead, rest: arts.filter(a => a !== lead).slice(0, 4) };
}

/* ---------- Ansichten ---------- */
function viewHome(all) {
  const t = tileTop(all);
  const left = `<aside class="top__list"><h2>Top-Meldungen</h2>${t.textList.map(a => card(a, { size: 's' })).join('')}</aside>`;
  const hero = t.hero ? `<div class="card card--hero">${card(t.hero, { size: 'xl', img: true }).replace('<article class="card ', '<article class="card ')}</div>` : '<div></div>';
  const right = `<aside>${t.side ? card(t.side, { size: 's', img: true, teaser: true, cls: 'card--side' }) : ''}
    ${t.also ? `<div class="also"><h2>Außerdem</h2>${card(t.also, { size: 's', teaser: true })}</div>` : ''}</aside>`;
  let html = `<section class="top">${left}${hero}${right}</section>`;
  if (t.latest.length) html += `<div class="sec-head"><h2>Neu</h2></div><div class="row4">${t.latest.map(a => card(a, { size: 's', img: true, cls: 'card--tile' })).join('')}</div>`;
  CONFIG.categories.forEach((c, i) => {
    const arts = all.filter(a => a.cat === c.slug); if (!arts.length) return;
    const { lead, rest } = tileCategory(arts);
    html += `<div class="sec-head"><h2>${esc(c.name)}</h2><a href="#/${c.slug}">Mehr aus ${esc(c.name)} →</a></div>
      <div class="cat-block">
        <div>${card(lead, { size: 'xl', img: true, date: true, cls: 'card--hero' }).replace('h--xl', 'h--m')}</div>
        <div class="cat-block__side">${rest.map(mini).join('')}${i === 1 ? instaBox() : ''}</div>
      </div>`;
  });
  return html;
}
const instaBox = () => `<div class="box"><h3>Kompass auf Instagram</h3><p>Fotos, Kurzmeldungen und Hinweise direkt aus der Region.</p><a class="btn" href="${CONFIG.instagram}" target="_blank" rel="noopener">Folgen</a></div>`;

function viewCategory(slug, all) {
  const c = catOf(slug), arts = all.filter(a => a.cat === slug);
  return `<h1 class="page-title">${esc(c.name)}</h1><p class="teaser">${esc(c.desc)}</p>
    <div class="sec-head"><h2>${arts.length} Artikel</h2></div>
    ${arts.length ? `<div class="grid3">${arts.map(a => card(a, { size: 'm', img: true, date: true, cls: 'card--tile' })).join('')}</div>` : '<p class="empty">Hier gibt es noch keine Artikel.</p>'}`;
}
function viewArticle(id, all) {
  const a = all.find(x => x.id === id); if (!a) return '<p class="empty">Artikel nicht gefunden.</p>';
  return `<article class="article">${label(a)}<h1 class="h h--xl">${esc(a.title)}</h1><span class="meta">${fmtDate(a.date)}</span>${md(a.body, a.base)}
    <p><a href="#/${a.cat}">← Mehr aus ${esc(catOf(a.cat)?.name || 'dieser Rubrik')}</a></p></article>`;
}
function viewContact() {
  const k = CONFIG.contact;
  return `<section class="contact"><h1 class="page-title">Kontakt</h1><p>Hinweise, Fotos oder Veranstaltungen? Schreiben Sie uns.</p>
    <dl><dt>E-Mail</dt><dd><a href="mailto:${k.email}">${k.email}</a></dd><dt>Telefon</dt><dd>${k.phone}</dd><dt>Adresse</dt><dd>${k.address}</dd>
    <dt>Instagram</dt><dd><a href="${CONFIG.instagram}" target="_blank" rel="noopener">${CONFIG.instagram.replace('https://www.', '')}</a></dd></dl></section>`;
}

/* ---------- Start & Routing ---------- */
let ALL = [];
function render() {
  const [, a, b] = location.hash.split('/');
  let html, active = '';
  if (a === 'artikel') { html = viewArticle(b, ALL); active = ALL.find(x => x.id === b)?.cat; }
  else if (a === 'kontakt') { html = viewContact(); active = 'kontakt'; }
  else if (catOf(a)) { html = viewCategory(a, ALL); active = a; }
  else html = viewHome(ALL);
  $('#app').innerHTML = html;
  document.querySelectorAll('#nav a').forEach(el => el.classList.toggle('is-active', el.dataset.slug === active));
  document.title = (a === 'artikel' ? (ALL.find(x => x.id === b)?.title + ' – ') : '') + 'Kompass';
  window.scrollTo(0, 0);
}
(async function init() {
  $('#year').textContent = new Date().getFullYear();
  $('#instagram-top').href = $('#instagram-footer').href = CONFIG.instagram;
  $('#nav').innerHTML = CONFIG.categories.map(c => `<a href="#/${c.slug}" data-slug="${c.slug}">${esc(c.name)}</a>`).join('') + '<a href="#/kontakt" data-slug="kontakt">Kontakt</a>';
  try { ALL = await loadArticles(); }
  catch (e) { $('#app').innerHTML = '<p class="empty">Artikel konnten nicht geladen werden. Bitte über einen lokalen Server öffnen (z. B. <code>python3 -m http.server</code>).</p>'; return; }
  window.addEventListener('hashchange', render); render();
})();
