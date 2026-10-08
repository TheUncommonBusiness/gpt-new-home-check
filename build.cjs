// Builds embed.html (708x400 Notion frame) and index.html (full page) from template.html and finder.js.
const fs = require('fs');
const path = require('path');
const here = __dirname;
const tpl = fs.readFileSync(path.join(here, 'template.html'), 'utf8');
const finder = fs.readFileSync(path.join(here, 'finder.js'), 'utf8');
const logoPath = process.argv[2];
const logo = logoPath && fs.existsSync(logoPath) ? 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64') : '';

const fullCss = `
body.full{background:var(--stone);min-height:100vh}
.wrap{max-width:980px;margin:0 auto;padding:24px 16px 56px}
.top{background:var(--evergreen);color:var(--stone);padding:20px 16px}
.top .in{max-width:980px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.top img{height:28px;width:auto;max-width:62vw;object-fit:contain;display:block}
.top .tag{font:500 13px/1.2 var(--sans);color:var(--sage)}
h1{font:400 clamp(30px,5vw,46px)/1.05 var(--serif);color:var(--evergreen);letter-spacing:-.025em;margin:28px 0 12px}
.lede{font:400 17px/1.5 var(--sans);color:var(--forest);max-width:62ch}
.warn{margin:20px 0 28px;background:var(--forest);color:var(--stone);border-radius:14px;padding:16px 20px;font:400 15px/1.5 var(--sans)}
.warn b{color:var(--highlight);font-weight:600}
.full #stage{width:100%;max-width:980px;margin:0 auto;border-radius:20px}
h2{font:400 clamp(24px,3.4vw,32px)/1.1 var(--serif);color:var(--evergreen);letter-spacing:-.02em;margin:44px 0 8px}
.sub{font:400 15px/1.5 var(--sans);color:var(--forest);max-width:70ch;margin-bottom:16px}
.legend{display:flex;gap:20px;flex-wrap:wrap;font:400 14px/1.3 var(--sans);color:var(--forest);margin-bottom:18px}
.legend span{display:inline-flex;align-items:center;gap:8px}
.full .g{width:18px;height:18px;min-width:18px;min-height:18px;font-size:11px}
.tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.tab{appearance:none;font:400 14px/1 var(--sans);color:var(--evergreen);background:transparent;border:2px solid var(--evergreen);border-radius:999px;height:38px;padding:0 16px;cursor:pointer}
.tab:hover{background:var(--sage)}
.tab[aria-selected="true"]{background:var(--highlight);border-color:var(--forest);font-weight:600}
.tab:focus-visible{outline:3px solid var(--forest);outline-offset:2px}
.ev{width:100%;border-collapse:collapse;font:400 15px/1.45 var(--sans)}
.ev th,.ev td{text-align:left;vertical-align:top;padding:12px 10px;border-bottom:1px solid var(--sage)}
.ev th{font-weight:600;color:var(--evergreen);width:22%}
.ev td.s{width:36px}
.ev a{color:var(--evergreen)}
.ev .src{display:block;margin-top:4px;font-size:13px}
.hd{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin:6px 0 12px}
.hd .n{font:400 28px/1.1 var(--serif);color:var(--evergreen)}
.hd .p{font:400 15px/1.3 var(--sans)}
.printbtn{appearance:none;background:var(--evergreen);color:var(--stone);border:0;border-radius:999px;height:40px;padding:0 20px;font:500 14px/1 var(--sans);cursor:pointer;margin-top:24px}
.printbtn:focus-visible{outline:3px solid var(--highlight);outline-offset:2px}
.ask li{margin:0 0 10px 20px;font:400 15px/1.5 var(--sans)}
.foot2{margin-top:48px;border-top:1px solid var(--sage);padding-top:16px;font:400 13px/1.5 var(--sans);color:var(--forest)}
@media print{.top,.tabs,#stage,.printbtn{display:none}.wrap{padding:0}}
`;

const fullTop = `<header class="top"><div class="in">${logo ? `<img src="${logo}" alt="The Uncommon Business">` : '<strong>The Uncommon Business</strong>'}<span class="tag">Information checked October 8, 2026</span></div></header>`;

const fullBottom = `
<div class="wrap" id="fullwrap" style="padding-top:0">
<h2>What each vendor's own pages say</h2>
<p class="sub">Pick an option to see all eight fields, with the page each one came from. A question mark means the answer was not found on that vendor's pages. It does not mean the answer is no.</p>
<div class="legend"><span><i class="g ok">✓</i> Confirmed on its pages</span><span><i class="g cf">~</i> Partly stated, or its pages disagree</span><span><i class="g nf">?</i> Not found</span></div>
<div class="tabs" role="tablist" aria-label="Options" id="evtabs"></div>
<div id="evbody"></div>
<h2>Questions to send before you commit</h2>
<p class="sub">Ask for the answers in writing. Anything marked with a question mark or a tilde above is a good place to start.</p>
<ul class="ask" id="ask"></ul>
<button class="printbtn" type="button" onclick="window.print()">Print this page</button>
<p class="foot2">This is an exploratory snapshot of what each vendor's public pages said on October 8, 2026. Pages were read through a fetch tool that can paraphrase, so quotes are close but not guaranteed word for word. It is not legal, security or compliance advice. Plans, prices and terms change, and your plan may differ from the one a page describes. Before you move a GPT, read the vendor's current pages and contract yourself and ask in writing. Nothing here has been confirmed with any vendor.</p>
</div>`;

const fullJs = `<script>
(function(){
var F=window.Finder,GL={ok:"\\u2713",cf:"~",nf:"?"};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var tabs=document.getElementById("evtabs"),body=document.getElementById("evbody");
function show(i){
  var o=F.OPTIONS[i];
  Array.prototype.forEach.call(tabs.children,function(b,j){b.setAttribute("aria-selected",j===i?"true":"false");b.tabIndex=j===i?0:-1});
  body.innerHTML='<div class="hd"><span class="n">'+esc(o.name)+'</span><span class="p">'+esc(o.by)+'. '+esc(o.start)+'</span></div><table class="ev"><tbody>'+
   F.FIELDS.map(function(fd){var x=o.fields[fd.k];return '<tr><th scope="row">'+esc(fd.label)+'</th><td class="s"><i class="g '+x.s+'" aria-label="'+(x.s==="ok"?"Confirmed":x.s==="cf"?"Partly stated or pages differ":"Not found")+'">'+GL[x.s]+'</i></td><td>'+esc(x.t)+'<a class="src" href="'+esc(x.u)+'" target="_blank" rel="noopener">Source</a></td></tr>'}).join("")+'</tbody></table>';
}
F.OPTIONS.forEach(function(o,i){
  var b=document.createElement("button");b.className="tab";b.type="button";b.setAttribute("role","tab");b.textContent=o.name.replace("Your own app on ","");
  b.addEventListener("click",function(){show(i)});
  b.addEventListener("keydown",function(e){var n=i,m=F.OPTIONS.length;if(e.key==="ArrowRight")n=(i+1)%m;else if(e.key==="ArrowLeft")n=(i+m-1)%m;else return;e.preventDefault();show(n);tabs.children[n].focus()});
  tabs.appendChild(b);
});
show(0);
var ask=document.getElementById("ask"),items=[
 "Will you sign a BAA for the plan I would use, and what does it cover and exclude?",
 "Do you use my content, my clients' chats, or my uploaded files to train or improve any model, on my plan? How do I turn it off?",
 "Who owns the bot, its instructions, my files and its answers, and what license do you take?",
 "Can I export the bot, its knowledge files and its chat logs, and what happens to my data if I leave?",
 "Which companies receive my data, including AI model providers, and where is it stored?",
 "Can you share your SOC 2 Type 2 report and say which products and plans it covers?",
 "How do outside users sign in, and which plan do I need for that?"
];
ask.innerHTML=items.map(function(t){return "<li>"+esc(t)+"</li>"}).join("");
})();
</script>`;

function make(full) {
  let h = tpl.replace('/*__FINDER__*/', finder);
  h = h.replace('/*__FULLCSS__*/', full ? fullCss : '');
  h = h.replace('<!--__TOP__-->', full ? fullTop + '<div class="wrap" style="padding-bottom:0"><h1>Where should your Custom GPT go?</h1><p class="lede">Five questions to narrow the field, using only what each vendor\'s own pages say. It tells you what the pages confirm, where they disagree, and what you still need to ask.</p><div class="warn"><b>This is exploratory.</b> It is a snapshot of public pages from October 8, 2026, not definitive information and not advice. Before you move a GPT, check each vendor\'s current pages and contract yourself, and ask in writing.</div></div><div class="wrap" style="padding:0 16px">' : '');
  h = h.replace('<!--__BOTTOM__-->', full ? '</div>' + fullBottom : '');
  h = h.replace('<!--__FOOTLINK__-->', full ? '' : '<a href="index.html" target="_blank" rel="noopener">Full table</a>');
  h = h.replace('<!--__FULLJS__-->', full ? fullJs : '');
  h = h.replace('<body>', full ? '<body class="full">' : '<body style="height:100vh;overflow:hidden;background:var(--evergreen);display:grid;place-items:center">');
  if (!full) h = h.replace('<style>', '<style>html,body{height:100%;overflow:hidden}');
  return h;
}
fs.writeFileSync(path.join(here, 'embed.html'), make(false));
fs.writeFileSync(path.join(here, 'index.html'), make(true));
console.log('built embed.html and index.html');
