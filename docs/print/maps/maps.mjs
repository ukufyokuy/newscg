import fs from 'fs';
import * as d3 from 'd3-geo';
import * as topo from 'topojson-client';
const out = process.argv[2];
const world = JSON.parse(fs.readFileSync(new URL('./node_modules/world-atlas/countries-50m.json', import.meta.url)));
const countries = topo.feature(world, world.objects.countries).features;
const F = `font-family="Noto Sans CJK TC, sans-serif"`;
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;');

// ---------- 1. 土耳其全圖 ----------
{
  const W=1000,H=560;
  const tr = countries.find(f=>f.properties.name==='Turkey');
  const proj = d3.geoConicConformal().parallels([37,41]).rotate([-35,0]).fitExtent([[20,30],[W-20,H-20]], {type:'MultiPoint',coordinates:[[25.8,35.7],[44.8,35.7],[44.8,42.3],[25.8,42.3]]});
  const path = d3.geoPath(proj);
  const P = (lon,lat)=>proj([lon,lat]);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" ${F}>`;
  s += `<rect width="${W}" height="${H}" fill="#dceaf5"/>`;
  for (const c of countries) s += `<path d="${path(c)}" fill="${c===tr?'#fbf3e4':'#e9ebef'}" stroke="${c===tr?'#9a8a6a':'#c3c8d0'}" stroke-width="${c===tr?1.4:0.7}"/>`;
  // seas
  const lab=(t,lon,lat,o='')=>{const [x,y]=P(lon,lat);return `<text x="${x}" y="${y}" ${o}>${esc(t)}</text>`};
  s += `<g fill="#6b8aa6" font-size="15" font-style="italic" text-anchor="middle">${lab('黑海',34.5,42.6)}${lab('地中海',31.5,35.4)}${lab('愛琴海',25.7,38.6)}${lab('馬爾馬拉海',28.0,40.72,'font-size="11"')}</g>`;
  s += `<g fill="#9aa1ad" font-size="12" text-anchor="middle">${lab('希臘',22.7,39.4)}${lab('保加利亞',25.8,42.15)}${lab('喬治亞',43.6,42.1)}${lab('敘利亞',38.4,35.7)}${lab('伊拉克',43.4,36.4)}${lab('伊朗',45,38.9)}${lab('賽普勒斯',33.2,34.85)}</g>`;
  const pts = {
    IST:[28.752,41.275], ESB:[32.995,40.128], ANK:[32.86,39.93], GOR:[34.829,38.643], ASR:[35.495,38.770], OLD:[28.976,41.006]
  };
  const xy=k=>P(...pts[k]);
  const line=(a,b,dash,col,curv)=>{const [x1,y1]=xy(a),[x2,y2]=xy(b);const mx=(x1+x2)/2,my=(y1+y2)/2-curv;return `<path d="M${x1},${y1} Q${mx},${my} ${x2},${y2}" fill="none" stroke="${col}" stroke-width="3" ${dash?'stroke-dasharray="7 5"':''} marker-end="url(#ar${col.slice(1)})"/>`};
  s += `<defs>${['#c8102e','#1f2a44','#1d7a46'].map(c=>`<marker id="ar${c.slice(1)}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" fill="${c}"/></marker>`).join('')}</defs>`;
  s += line('IST','ESB',false,'#c8102e',60);
  s += line('ANK','GOR',true,'#1d7a46',-10);
  s += line('GOR','ASR',true,'#1d7a46',18);
  s += line('ASR','IST',false,'#1f2a44',-110);
  // route labels
  const box=(x,y,lines,col,anchor='start')=>{const w=Math.max(...lines.map(l=>l.length))*13+14,h=lines.length*17+8;const bx=anchor==='end'?x-w:x;return `<g><rect x="${bx}" y="${y}" width="${w}" height="${h}" rx="5" fill="#fff" stroke="${col}" stroke-width="1.4" opacity="0.96"/>${lines.map((l,i)=>`<text x="${bx+7}" y="${y+18+i*17}" font-size="${i===0?13:12}" ${i===0?`font-weight="800" fill="${col}"`:'fill="#222"'}>${esc(l)}</text>`).join('')}</g>`};
  const dot=(k,r,col)=>{const [x,y]=xy(k);return `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" stroke="#fff" stroke-width="2"/>`};
  s += dot('IST',8,'#c8102e')+dot('OLD',6,'#1f2a44')+dot('ESB',7,'#c8102e')+dot('ANK',7,'#1d7a46')+dot('GOR',9,'#1d7a46')+dot('ASR',7,'#1f2a44');
  const [ix,iy]=xy('IST'),[ex,ey]=xy('ESB'),[gx,gy]=xy('GOR'),[ax,ay]=xy('ASR'),[ox,oy]=xy('OLD'),[nx,ny]=xy('ANK');
  s += box(ix-30,iy-118,['① 伊斯坦堡機場 IST','12/9 05:50 抵達（入境）','12/15 17:15 返台'], '#c8102e');
  s += box(ox-190,oy+40,['⑤ 伊斯坦堡老城','12/12 下午 – 12/15','住伊斯坦堡飯店 3 晚'], '#1f2a44');
  s += box(ex+14,ey-80,['② 安卡拉機場 ESB','12/9 08:00 → 09:10','TK2126 國內線'], '#c8102e');
  s += box(nx-215,ny+40,['③ LÖSEV 病童中心','12/9 上午～下午','安卡拉（地點請領隊確認）'], '#1d7a46');
  s += box(gx-120,gy+26,['④ 卡帕多奇亞（格雷梅一帶）','12/9 晚 – 12/12 早','洞穴飯店 3 晚'], '#1d7a46');
  s += box(ax+30,ay-40,['開塞利機場 ASR','12/12 09:45 起飛','TK2011 → 11:25 IST'], '#1f2a44');
  // distance notes on lines
  const mid=(a,b,dx,dy,t,col)=>{const [x1,y1]=xy(a),[x2,y2]=xy(b);return `<text x="${(x1+x2)/2+dx}" y="${(y1+y2)/2+dy}" font-size="12" fill="${col}" font-weight="700" text-anchor="middle">${esc(t)}</text>`};
  s += mid('IST','ESB',0,-40,'✈ 飛 1 小時 10 分','#c8102e');
  s += mid('ANK','GOR',18,-14,'🚌 約 300 公里｜3.5–4 小時','#1d7a46');
  s += mid('GOR','ASR',8,26,'🚌 約 75 公里｜約 1 小時','#1d7a46');
  s += mid('ASR','IST',-20,-60,'✈ 飛 1 小時 40 分','#1f2a44');
  // legend
  s += `<g transform="translate(${W-290},${H-92})"><rect width="270" height="80" rx="6" fill="#fff" stroke="#bbb"/>
   <line x1="12" y1="20" x2="52" y2="20" stroke="#c8102e" stroke-width="3"/><text x="60" y="25" font-size="12">去程飛機（12/9）</text>
   <line x1="12" y1="42" x2="52" y2="42" stroke="#1d7a46" stroke-width="3" stroke-dasharray="7 5"/><text x="60" y="47" font-size="12">巴士／車程</text>
   <line x1="12" y1="64" x2="52" y2="64" stroke="#1f2a44" stroke-width="3"/><text x="60" y="69" font-size="12">回伊斯坦堡飛機（12/12）</text></g>`;
  s += `<text x="20" y="${H-14}" font-size="11" fill="#666">距離與車程為約略估計；地圖依自然地球（Natural Earth）國界繪製</text>`;
  s += `</svg>`;
  fs.writeFileSync(out+'/turkey.svg', s);
}

// ---------- 2. 卡帕多奇亞示意圖 ----------
{
  const W=640,H=420;
  const bbox={type:'MultiPoint',coordinates:[[34.62,38.60],[35.02,38.74]]};
  const proj=d3.geoMercator().fitExtent([[40,40],[W-40,H-60]],bbox);
  const P=(lon,lat)=>proj([lon,lat]);
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" ${F}><rect width="${W}" height="${H}" fill="#f7f1e6"/>`;
  // river Kızılırmak approx
  const river=[[34.60,38.74],[34.72,38.73],[34.80,38.72],[34.85,38.725],[34.93,38.75],[35.05,38.79],[35.2,38.83]].map(c=>P(...c).join(',')).join(' ');
  s+=`<polyline points="${river}" fill="none" stroke="#8bb6d6" stroke-width="5" stroke-linecap="round"/>`;
  {const [x,y]=P(34.98,38.775);s+=`<text x="${x}" y="${y}" font-size="11" fill="#5a86a8">紅河（克孜勒河）</text>`;}
  const spots=[
    ['格雷梅（住宿區一帶）',34.829,38.643,'#1d7a46','12/9 晚抵達・熱氣球起飛區',1],
    ['阿瓦諾斯小鎮',34.847,38.715,'#c8102e','12/10 小吃・陶藝・河邊',1],
    ['蘑菇岩（帕夏貝）',34.852,38.677,'#1f2a44','12/11 地景侵蝕・風化',1],
    ['卡亞謝希爾地下城',34.716,38.627,'#1f2a44','12/11（內夫謝希爾市）',-1],
  ];
  // roads (dashed)
  const road=(a,b)=>{const [x1,y1]=P(...a),[x2,y2]=P(...b);return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#b9a98a" stroke-width="2.5" stroke-dasharray="6 4"/>`};
  s+=road([34.829,38.643],[34.847,38.715])+road([34.829,38.643],[34.852,38.677])+road([34.829,38.643],[34.716,38.627])+road([34.829,38.643],[35.06,38.70]);
  {const x=W-30,y=H-70;s+=`<text x="${x}" y="${y-30}" font-size="14" font-weight="800" fill="#1f2a44" text-anchor="end">→ 開塞利機場 ASR</text><text x="${x}" y="${y-13}" font-size="12" fill="#333" text-anchor="end">約 75 公里・車程約 1 小時｜12/12 09:45 起飛</text>`;}
  for(const [n,lon,lat,col,sub,side] of spots){const [x,y0]=P(lon,lat);const y=y0;
    s+=`<circle cx="${x}" cy="${y}" r="8" fill="${col}" stroke="#fff" stroke-width="2"/>`;
    const tx=side>0?x+12:x-12, an=side>0?'start':'end';
    s+=`<text x="${tx}" y="${y-3}" font-size="14" font-weight="800" fill="${col}" text-anchor="${an}">${esc(n)}</text><text x="${tx}" y="${y+14}" font-size="11.5" fill="#333" text-anchor="${an}">${esc(sub)}</text>`;}
  {const [x,y]=P(34.64,38.592);s+=`<text x="${x}" y="${y}" font-size="12" fill="#555">料理教室、洞穴酒窖、農家體驗：地點待領隊確認</text>`;}
  s+=`<text x="20" y="${H-14}" font-size="11" fill="#666">示意圖，位置約略；道路以虛線示意，非實際路線</text></svg>`;
  fs.writeFileSync(out+'/cappadocia.svg',s);
}

// ---------- 3. 伊斯坦堡示意圖 ----------
{
  const W=1000,H=640;
  const bbox={type:'MultiPoint',coordinates:[[28.945,40.999],[29.012,41.042]]};
  const proj=d3.geoMercator().fitExtent([[20,20],[W-20,H-20]],bbox);
  const P=(lon,lat)=>proj([lon,lat]);
  const poly=pts=>`<polygon points="${pts.map(c=>P(c[1],c[0]).join(',')).join(' ')}" fill="#cfe3f2" stroke="#9cc0dc" stroke-width="1.2"/>`;
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" ${F}><rect width="${W}" height="${H}" fill="#f6f3ec"/>`;
  // Sea of Marmara + Bosphorus (approx, lat,lon)
  s+=poly([[40.990,28.940],[41.0035,28.940],[41.004,28.955],[41.0035,28.968],[41.0035,28.980],[41.007,28.985],[41.012,28.987],[41.0165,28.9855],[41.019,28.981],[41.0215,28.979],[41.0235,28.983],[41.0265,28.9855],[41.030,28.989],[41.034,28.9935],[41.038,28.999],[41.041,29.004],[41.045,29.008],[41.045,29.030],[40.990,29.030]]);
  // Asian shore land (Üsküdar)
  s+=`<polygon points="${[[41.045,29.019],[41.036,29.014],[41.028,29.0125],[41.021,29.0105],[41.012,29.012],[41.000,29.016],[40.990,29.020],[40.990,29.030],[41.045,29.030]].map(c=>P(c[1],c[0]).join(',')).join(' ')}" fill="#efe8da" stroke="#9cc0dc" stroke-width="1.2"/>`;
  // Golden Horn
  s+=poly([[41.0165,28.9855],[41.0175,28.978],[41.0195,28.970],[41.023,28.962],[41.028,28.955],[41.034,28.948],[41.040,28.942],[41.042,28.945],[41.036,28.953],[41.030,28.961],[41.026,28.968],[41.0235,28.974],[41.0215,28.979]]);
  const t=(txt,lat,lon,o='')=>{const [x,y]=P(lon,lat);return `<text x="${x}" y="${y}" ${o}>${esc(txt)}</text>`};
  s+=`<g fill="#5a86a8" font-style="italic" text-anchor="middle">${t('馬爾馬拉海',41.0005,28.995,'font-size="16"')}${t('金角灣',41.0285,28.9505,'font-size="14" transform="rotate(-38 '+P(28.9505,41.0285).join(' ')+')"')}${t('博斯普魯斯海峽',41.030,29.0005,'font-size="14" transform="rotate(-52 '+P(29.0005,41.030).join(' ')+')"')}</g>`;
  s+=`<g fill="#a59b85" font-size="13" text-anchor="middle">${t('亞洲岸',41.020,29.018)}${t('舊城區（歷史半島）',41.0115,28.952)}${t('新城區（貝伊奧盧）',41.039,28.968)}</g>`;
  // cruise route
  const cr=[[41.0175,28.974],[41.0225,28.988],[41.031,28.9985],[41.040,29.007],[41.044,29.012]].map(c=>P(c[1],c[0]).join(',')).join(' ');
  s+=`<polyline points="${cr}" fill="none" stroke="#1d7a46" stroke-width="3" stroke-dasharray="8 5"/>`;
  {const [x,y]=P(29.009,41.0445);s+=`<text x="${x-8}" y="${y-8}" font-size="12" fill="#1d7a46" font-weight="700" text-anchor="end">遊船往北航行（2 小時）↗</text>`;}
  // tunel line
  {const [x1,y1]=P(28.9745,41.0234),[x2,y2]=P(28.9736,41.0289);s+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#7b3fa0" stroke-width="5"/>`;}
  // istiklal street
  {const a=[[41.0290,28.9737],[41.0315,28.9760],[41.0340,28.9790],[41.0368,28.9850]].map(c=>P(c[1],c[0]).join(',')).join(' ');s+=`<polyline points="${a}" fill="none" stroke="#7b3fa0" stroke-width="3" stroke-dasharray="2 4"/>`;}
  const days={'12/12':'#c8102e','12/13':'#1d7a46','12/14':'#7b3fa0','12/15':'#b8860b'};
  const sp=[
    ['12/12','1','藍色清真寺',41.0054,28.9768,-1,12],
    ['12/12','2','聖索菲亞（整修中）',41.0086,28.9802,1,0],
    ['12/12','3','賽馬場廣場',41.0061,28.9750,-1,-4],
    ['12/12','4','地下水宮＋下午茶',41.0084,28.9779,1,22],
    ['12/13','1','遊船碼頭（埃米諾努一帶）',41.0175,28.9735,-1,-10],
    ['12/13','2','蘇萊曼清真寺',41.0162,28.9639,1,0],
    ['12/13','3','有頂大市集（週日？）',41.0107,28.9681,-1,0],
    ['12/13','4','古驛站（大市集周邊）',41.0128,28.9702,1,-6],
    ['12/13','★','冬季飲品 Boza 名店（建議）',41.0156,28.9570,-1,16],
    ['12/14','1','Tünel 卡拉柯伊站',41.0234,28.9745,1,10],
    ['12/14','2','加拉達塔',41.0256,28.9741,-1,0],
    ['12/14','3','獨立大街（Tünel 站→塔克辛）',41.0330,28.9775,-1,0],
    ['12/14','4','塔克辛廣場',41.0369,28.9850,1,0],
    ['12/14','5','吉漢吉爾骨董街區',41.0310,28.9835,1,8],
    ['12/14','6','卡拉科伊文青街區',41.0242,28.9785,1,8],
  ];
  for(const [d,n,name,lat,lon,side,dy] of sp){const [x,y]=P(lon,lat);const c=days[d];
    s+=`<circle cx="${x}" cy="${y}" r="10" fill="${c}" stroke="#fff" stroke-width="2"/><text x="${x}" y="${y+4.5}" font-size="12" font-weight="800" fill="#fff" text-anchor="middle">${n}</text>`;
    const tx=side>0?x+14:x-14;s+=`<text x="${tx}" y="${y+5+dy}" font-size="13" font-weight="700" fill="${c}" text-anchor="${side>0?'start':'end'}" paint-order="stroke" stroke="#f6f3ec" stroke-width="4">${esc(name)}</text>`;}
  // legend
  s+=`<g transform="translate(${W-300},${H-190})"><rect width="282" height="172" rx="6" fill="#fff" stroke="#bbb"/>
  <text x="12" y="22" font-size="13" font-weight="800">伊斯坦堡 每天的足跡</text>`;
  const leg=[['12/12（六）下午 老城世界遺產','12/12'],['12/13（日）遊船・清真寺・市集','12/13'],['12/14（一）Tünel・新城區街區','12/14'],['12/15（二）咖啡・補拍→機場','12/15']];
  leg.forEach(([txt,d],i)=>{s+=`<circle cx="22" cy="${44+i*22}" r="7" fill="${days[d]}"/><text x="36" y="${49+i*22}" font-size="12">${esc(txt)}</text>`;});
  s+=`<line x1="14" y1="138" x2="40" y2="138" stroke="#7b3fa0" stroke-width="5"/><text x="48" y="142" font-size="12">Tünel 地下纜車（1875 年）</text>
  <line x1="14" y1="158" x2="40" y2="158" stroke="#1d7a46" stroke-width="3" stroke-dasharray="8 5"/><text x="48" y="162" font-size="12">海峽遊船航線（示意）</text></g>`;
  s+=`<g transform="translate(24,${H-74})"><rect width="380" height="56" rx="6" fill="#fff" stroke="#bbb"/><text x="12" y="22" font-size="12.5" font-weight="700" fill="#b8860b">✈ 伊斯坦堡機場 IST 在地圖外西北方約 40 公里</text><text x="12" y="42" font-size="12">老城到機場車程約 45–75 分鐘（塞車時更久）</text></g>`;
  s+=`</svg>`;
  fs.writeFileSync(out+'/istanbul.svg',s);
}
console.log('ok');
