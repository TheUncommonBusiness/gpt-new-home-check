// Render check for the 708x400 embed. Usage: node check-render.cjs <file-or-live-url> [shots]
const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SIZES = [[708, 400], [629, 354], [560, 315], [375, 211], [629, 416], [708, 520]];
const CARD = '.card', SWAP = '#panel', LABELS = '.name,.q,.step,.lnk,.pill';
const FONTS = [];
const opt = (p, v) => p.evaluate(v => { const e = [...document.querySelectorAll('.opt')].find(x => x.dataset.v === v); e.click(); }, v);
const clickId = (p, id) => p.evaluate(id => document.getElementById(id).click(), id);
const seq = (...vs) => async p => { for (const v of vs) await opt(p, v); };
const STATES = [
  { name: 'q1', run: async p => {} },
  { name: 'q2', run: seq('clients') },
  { name: 'q3 signin', run: seq('clients', 'no') },
  { name: 'q4 soc2', run: seq('clients', 'no', 'no') },
  { name: 'q5 voice', run: seq('me', 'no', 'no') },
  { name: 'result 7 pills', run: seq('me', 'no', 'no', 'no') },
  { name: 'result notes', run: seq('clients', 'unsure', 'yes', 'yes', 'no') },
  { name: 'result 3 pills', run: seq('me', 'yes', 'no', 'no') },
  { name: 'why many', run: async p => { await seq('me', 'yes', 'no', 'no')(p); await clickId(p, 'why'); } },
  { name: 'none match', run: seq('clients', 'yes', 'no', 'no', 'yes') },
  { name: 'none why', run: async p => { await seq('clients', 'yes', 'no', 'no', 'yes')(p); await clickId(p, 'why'); } },
  { name: 'pill 4', run: async p => { await seq('me', 'no', 'no', 'no')(p); await p.evaluate(() => document.querySelectorAll('.pill')[3].click()); } },
  { name: 'pill 6 customgpt', run: async p => { await seq('me', 'no', 'no', 'no')(p); await p.evaluate(() => document.querySelectorAll('.pill')[5].click()); } },
  { name: 'pill 7 chipp', run: async p => { await seq('me', 'no', 'no', 'no')(p); await p.evaluate(() => document.querySelectorAll('.pill')[6].click()); } },
];
const RESET = p => p.evaluate(() => { const r = document.getElementById('reset'); if (r) r.click(); });
const url = process.argv[2], shots = process.argv[3] === 'shots';
if (!url) { console.log('Usage: node check-render.cjs <url> [shots]'); process.exit(2); }
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  let fails = 0;
  for (const [w, h] of SIZES) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
    await p.goto(url, { waitUntil: 'load' });
    for (const s of STATES) {
      await RESET(p); await s.run(p); await wait(100);
      const issues = await p.evaluate((CARD, SWAP, LABELS) => {
        const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        const card = document.querySelector(CARD).getBoundingClientRect();
        const stage = document.getElementById('stage').getBoundingClientRect();
        const out = [];
        if (document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth + 1) out.push('page scrolls');
        document.querySelectorAll('#stage *').forEach(e => { if (!vis(e)) return; const r = e.getBoundingClientRect(); if (r.bottom > stage.bottom + .5 || r.right > stage.right + .5) out.push('outside stage: ' + e.tagName + '.' + e.className); });
        document.querySelectorAll(CARD + ' *').forEach(e => { if (!vis(e)) return; const r = e.getBoundingClientRect(); if (r.bottom > card.bottom + .5 || r.right > card.right + .5 || r.top < card.top - .5 || r.left < card.left - .5) out.push('outside card: ' + e.tagName + '.' + e.className); });
        const panel = document.querySelector(SWAP), pr = panel.getBoundingClientRect();
        panel.querySelectorAll('*').forEach(e => { if (!vis(e)) return; const r = e.getBoundingClientRect(); if (r.bottom > pr.bottom + .5 || r.right > pr.right + .5) out.push('clipped in panel: ' + e.tagName + ' "' + (e.textContent || '').slice(0, 28) + '"'); });
        document.querySelectorAll(LABELS).forEach(e => { if (vis(e) && e.scrollWidth > e.clientWidth + 1) out.push('truncated: ' + (e.className || e.tagName) + ' "' + (e.textContent || '').slice(0, 24) + '"'); });
        document.querySelectorAll('.row .v,.li,.opt').forEach(e => { if (vis(e) && e.scrollHeight > e.clientHeight + 1) out.push('text overflows its box: ' + (e.textContent || '').slice(0, 30)); });
        return out;
      }, CARD, SWAP, LABELS);
      if (issues.length) { fails++; console.log(`FAIL ${w}x${h} state "${s.name}": ${[...new Set(issues)].slice(0, 4).join(' | ')}`); }
      if (shots) await p.screenshot({ path: `shot-${w}x${h}-${s.name.replace(/\W+/g, '-')}.png` });
    }
    await p.close();
  }
  await b.close();
  console.log(fails ? `${fails} failure(s)` : `PASS: ${SIZES.length} sizes x ${STATES.length} states, nothing clipped, nothing scrolls`);
  process.exit(fails ? 1 : 0);
})();
