// Runs every answer path through the decision logic and checks the data. Run before every push.
const F = require('./finder.js');
let fails = 0;
const fail = m => { fails++; console.log('FAIL ' + m); };

// 1. Data integrity: every field filled, a valid status, an official https source, no banned punctuation.
const banned = /[—–;]|\u{1F300}-\u{1FAFF}/u;
F.OPTIONS.forEach(o => {
  F.FIELDS.forEach(fd => {
    const x = o.fields[fd.k];
    if (!x) return fail(`${o.id}.${fd.k} missing`);
    if (!['ok', 'cf', 'nf'].includes(x.s)) fail(`${o.id}.${fd.k} bad status`);
    if (!/^https:\/\//.test(x.u)) fail(`${o.id}.${fd.k} source is not https`);
    if (!x.short || x.short.length > 66) fail(`${o.id}.${fd.k} short text missing or over 66 chars (${(x.short || '').length})`);
    if (banned.test(x.t) || banned.test(x.short)) fail(`${o.id}.${fd.k} has an em dash, en dash or semicolon`);
  });
  ['me', 'team', 'clients', 'own'].forEach(k => { if (!o.who[k]) fail(`${o.id}.who.${k} missing`); });
});

// 2. Every answer path. Re-derive each gate from the data, independently of run().
const whos = ['me', 'team', 'clients', 'own'], yn = ['yes', 'no'], health = ['yes', 'no', 'unsure'];
let paths = 0, none = 0, some = 0;
for (const who of whos) for (const h of health) for (const si of (who === 'clients' || who === 'own' ? yn : [undefined])) for (const soc of yn) for (const v of yn) {
  const a = { who, health: h, soc2: soc, voice: v }; if (si) a.signin = si;
  const steps = F.stepsFor(a);
  if (steps.length !== (si ? 5 : 4)) fail('step count ' + JSON.stringify(a));
  const R = F.run(a); paths++;
  if (R.survivors.length + R.dropped.length !== F.OPTIONS.length) fail('options lost ' + JSON.stringify(a));
  R.survivors.forEach(o => {
    if (!o.who[who][0]) fail(`${o.id} survives who=${who} but is excluded`);
    if ((h === 'yes' || h === 'unsure') && o.fields.hipaa.s === 'nf') fail(`${o.id} survives health with no BAA found`);
    if (si === 'yes' && !o.signin) fail(`${o.id} survives sign-in with no confirmed sign-in`);
    if (soc === 'yes' && o.fields.certs.s !== 'ok') fail(`${o.id} survives SOC 2 without confirmation`);
    if (v === 'yes' && !o.voice) fail(`${o.id} survives voice with none found`);
  });
  R.dropped.forEach(r => { if (!r.fails.length) fail('dropped without a reason'); r.fails.forEach(x => { if (!x.why) fail('empty reason'); }); });
  const sorted = R.survivors.every((o, i, arr) => i === 0 || arr[i - 1].price <= o.price);
  if (!sorted) fail('survivors not ordered by listed price ' + JSON.stringify(a));
  if (!R.survivors.length) { none++; if (!R.closest.length) fail('no survivors and no closest list ' + JSON.stringify(a)); R.closest.forEach(c => c.asks.forEach(q => { if (!q || /undefined/.test(q)) fail('bad question ' + q); })); } else some++;
  if (R.unsure !== (h === 'unsure')) fail('unsure flag');
}

// 3. Spot checks that matter.
const ids = a => F.run(a).survivors.map(o => o.id).join(',');
const eq = (name, got, want) => { if (got !== want) fail(`${name}: got "${got}", wanted "${want}"`); };
eq('me, no gates', ids({ who: 'me', health: 'no', soc2: 'no', voice: 'no' }), 'botpress,plugin,claude,delphi,replit,customgpt,chipp');
eq('clients, health yes', ids({ who: 'clients', health: 'yes', signin: 'no', soc2: 'no', voice: 'no' }), 'chipp');
eq('clients, health yes, voice yes', ids({ who: 'clients', health: 'yes', signin: 'no', soc2: 'no', voice: 'yes' }), '');
eq('own', ids({ who: 'own', health: 'no', signin: 'no', soc2: 'no', voice: 'no' }), 'replit');
eq('own with health yes', ids({ who: 'own', health: 'yes', signin: 'no', soc2: 'no', voice: 'no' }), '');
eq('team, SOC 2, health', ids({ who: 'team', health: 'yes', soc2: 'yes', voice: 'no' }), 'plugin,claude,chipp');
eq('clients, voice yes', ids({ who: 'clients', health: 'no', signin: 'no', soc2: 'no', voice: 'yes' }), 'botpress,delphi');
eq('clients, voice and SOC 2', ids({ who: 'clients', health: 'no', signin: 'no', soc2: 'yes', voice: 'yes' }), '');
eq('delphi never passes SOC 2', F.run({ who: 'clients', health: 'no', signin: 'no', soc2: 'yes', voice: 'no' }).survivors.some(o => o.id === 'delphi') + '', 'false');
eq('customgpt excluded for clients', F.run({ who: 'clients', health: 'no', signin: 'no', soc2: 'no', voice: 'no' }).survivors.some(o => o.id === 'customgpt') + '', 'false');
eq('unsure behaves like yes', ids({ who: 'team', health: 'unsure', soc2: 'no', voice: 'no' }), ids({ who: 'team', health: 'yes', soc2: 'no', voice: 'no' }));

console.log(`${paths} answer paths checked (${some} give options, ${none} give "none match"), ${F.OPTIONS.length} options x ${F.FIELDS.length} fields`);
console.log(fails ? `${fails} failure(s)` : 'PASS');
process.exit(fails ? 1 : 0);
