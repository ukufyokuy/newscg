const {chromium}=require('playwright');
(async()=>{
  const [,,html,out]=process.argv;
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
  await p.goto('file://'+html);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
  const r=await p.evaluate(()=>{
    const SAFE={x0:192,x1:1728,y0:216,y1:780};const bad=[];
    document.querySelectorAll('.c').forEach(e=>{const b=e.getBoundingClientRect();
      if(b.left<SAFE.x0||b.right>SAFE.x1||b.top<SAFE.y0||b.bottom>SAFE.y1)bad.push([e.textContent||e.tagName,Math.round(b.left),Math.round(b.top),Math.round(b.right),Math.round(b.bottom)])});
    const ic=document.getElementById('icons').getBBox();
    const fonts=[...document.fonts].filter(f=>f.status==='loaded').length;
    return {bad,icons:[ic.x,ic.y,ic.x+ic.width,ic.y+ic.height].map(Math.round),fonts,text:[...document.querySelectorAll('.t,text')].map(e=>e.textContent)};
  });
  console.log(JSON.stringify(r,null,1));
  await p.screenshot({path:out});await b.close();
})();
