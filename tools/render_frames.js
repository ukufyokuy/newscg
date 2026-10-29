const {chromium}=require('playwright');
(async()=>{
  const [,,html,outdir,which]=process.argv;
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
  await p.goto('file://'+html);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
  const FPS=30000/1001, dur=await p.evaluate(()=>DURATION), N=Math.round(dur*FPS);
  const list= which ? which.split(',').map(Number) : [...Array(N).keys()].map(i=>i+1);
  for(const n of list){
    const t=(n-1)/FPS;
    await p.evaluate(t=>render(t),t);
    await p.screenshot({path:`${outdir}/${String(n).padStart(4,'0')}.png`,omitBackground:!!process.env.ALPHA});
  }
  // 最後一格的出界檢查
  await p.evaluate(t=>render(t),dur);
  const bad=await p.evaluate(()=>{const S={x0:192,x1:1728,y0:216,y1:780},bad=[];
    document.querySelectorAll('.c').forEach(e=>{const r=e.getBoundingClientRect();
      if(r.left<S.x0||r.right>S.x1||r.top<S.y0||r.bottom>S.y1)bad.push([e.textContent,r.left,r.top,r.right,r.bottom].join(' '))});return bad});
  console.log('frames',N,'bad',JSON.stringify(bad));
  await b.close();
})();
