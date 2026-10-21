// Renders assets/portfolio.svg — the board-deck portfolio chart on the profile.
// Figures were measured from each repo with `git ls-files | wc -l` style counts.
//   node tools/gen-portfolio.mjs > assets/portfolio.svg
const rows = [
  ["DESI","The Desi Events","Events · Commerce",552,721,"LIVE","#5ee6a8"],
  ["VACA","Vacamodiq","Travel · ML",152,203,"R&amp;D","#b78cff"],
  ["LEAD","LeadFlow","Sales · CRM",71,18,"PRIVATE BETA","#5ee6a8"],
  ["TALY","Tally","Personal Finance",67,63,"V1","#5cc8ff"],
  ["NOEF","NoEfforts","Careers · HR-tech",32,43,"PHASE A","#b78cff"],
  ["KAIL","Kailo.fit","Health · Fitness",21,19,"BETA","#5cc8ff"],
  ["STIQ","STITCHIQ","Manufacturing · CV",8.5,28,"BETA","#5cc8ff"],
];
const W=1200, top=92, rh=46, H=top+rows.length*rh+36, bx=430, bw=460, max=552;
let o=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Portfolio by business unit, lines of code: ${rows.map(r=>`${r[1]} ${r[3]}K`).join(", ")}.">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#070b14"/><stop offset="100%" stop-color="#0f1a2e"/></linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#c9962b"/><stop offset="100%" stop-color="#f5d77a"/></linearGradient>
  <style>
    .mono{font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace}
    .sans{font-family:-apple-system,"Segoe UI",Helvetica,Arial,sans-serif}
    .lbl{font-size:12px;letter-spacing:2.5px;fill:#8ea3c0}
    .bar{transform-box:fill-box;transform-origin:left;transform:scaleX(0);animation:g 1.1s cubic-bezier(.6,.1,.2,1) forwards}
    @keyframes g{to{transform:scaleX(1)}}
    .r{opacity:0;animation:in .6s ease-out forwards}
    @keyframes in{to{opacity:1}}
  </style>
</defs>
<rect width="${W}" height="${H}" rx="22" fill="url(#bg)"/>
<rect x="0.5" y="0.5" width="${W-1}" height="${H-1}" rx="22" fill="none" stroke="#ffffff" stroke-opacity="0.08"/>
<text class="mono lbl" x="40" y="42">PORTFOLIO · CAPITAL ALLOCATED (LINES OF CODE)</text>
<text class="mono lbl" x="${W-40}" y="42" text-anchor="end">TEST FILES · STATUS</text>
<g class="mono" font-size="11" letter-spacing="2" fill="#5d6f8a">
<text x="40" y="76">TICKER</text><text x="130" y="76">UNIT</text><text x="${bx}" y="76">ALLOCATION</text>
</g>
<line x1="40" y1="84" x2="${W-40}" y2="84" stroke="#ffffff" stroke-opacity="0.08"/>
`;
rows.forEach((r,i)=>{
  const y=top+i*rh, d=(0.15+i*0.12).toFixed(2), w=Math.max(6,Math.round(r[3]/max*bw));
  o+=`<g class="r" style="animation-delay:${d}s">
  <rect x="40" y="${y+6}" width="72" height="26" rx="6" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-opacity="0.08"/>
  <text class="mono" x="76" y="${y+24}" text-anchor="middle" font-size="13" font-weight="700" fill="#f2c55c">$${r[0]}</text>
  <text class="sans" x="130" y="${y+19}" font-size="16" font-weight="700" fill="#f4f6fb">${r[1]}</text>
  <text class="sans" x="130" y="${y+36}" font-size="12" fill="#6f819c">${r[2]}</text>
  <rect x="${bx}" y="${y+12}" width="${bw}" height="14" rx="7" fill="#ffffff" fill-opacity="0.04"/>
  <rect class="bar" style="animation-delay:${(0.4+i*0.12).toFixed(2)}s" x="${bx}" y="${y+12}" width="${w}" height="14" rx="7" fill="url(#gold)"/>
  <text class="mono" x="${bx+w+12}" y="${y+24}" font-size="13" fill="#d9e1ee">${r[3]}K</text>
  <text class="mono" x="${W-200}" y="${y+24}" font-size="13" text-anchor="end" fill="#a9b7cc">${r[4]}</text>
  <circle cx="${W-180}" cy="${y+19}" r="4" fill="${r[6]}"/>
  <text class="mono" x="${W-168}" y="${y+24}" font-size="12" letter-spacing="1.5" fill="${r[6]}">${r[5]}</text>
</g>
`;
  if(i<rows.length-1) o+=`<line x1="40" y1="${y+rh-2}" x2="${W-40}" y2="${y+rh-2}" stroke="#ffffff" stroke-opacity="0.04"/>\n`;
});
o+=`</svg>\n`;
process.stdout.write(o);
