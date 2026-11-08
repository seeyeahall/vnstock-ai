const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const root=__dirname,report={version:'V6.6-R2',kind:'CI_CHROMIUM_SIMULATION_NO_REAL_AI',run_id:process.env.GITHUB_RUN_ID||'local',at:new Date().toISOString(),checks:[],errors:[],class_pass:'0/35',go_live:'NO',remote_ai_test:false};
function ok(cond,msg){if(!cond)throw Error(msg)}
(async()=>{
const browser=await chromium.launch({headless:true}),fileUrl='file://'+path.join(root,'index.html');
for(const [width,height] of [[320,700],[375,812],[414,896],[768,1024],[1366,768]]){
const page=await browser.newPage({viewport:{width,height},acceptDownloads:true}),jsErrors=[];page.on('pageerror',e=>jsErrors.push(String(e)));
await page.goto(fileUrl,{waitUntil:'domcontentloaded'});ok(await page.locator('#startStudent').count()===1,'missing start');
await page.locator('#startStudent').click();
for(const ex of ['B1','B2','B3']){
for(let i=0;i<35;i++){
const v=await page.evaluate(({ex,i})=>{opts.exercise=ex;opts.idx=i;opts.role='student';opts.view='lesson';opts.phase='task';opts.micro=0;draw();const el=document.querySelector('#content'),hd=[...el.querySelectorAll('h2')].map(x=>x.textContent);return {code:D[i].code,hd,prompt:el.querySelectorAll('textarea.prompt-value').length,copy:el.querySelectorAll('button[data-copy]').length,old:el.querySelectorAll('#answer,#verify,#tryDone,#microNote,#selfChecked').length,overflow:document.documentElement.scrollWidth>innerWidth+1}},{ex,i});
ok(['Mục tiêu của lệnh','Lệnh gửi AI','Kết quả cần đạt'].every(x=>v.hd.some(h=>h.includes(x))),'three blocks '+ex+'/'+v.code+'/'+width);
ok(v.prompt>=1&&v.copy>=1&&v.old===0&&!v.overflow,'student '+ex+'/'+v.code+'/'+width+' '+JSON.stringify(v));
await page.evaluate(({i})=>{opts.idx=i;opts.role='teacher';draw()},{i});
ok((await page.locator('#content').innerText()).toLowerCase().includes('lời nói trước lớp'),'teacher '+ex+'/'+i);
await page.evaluate(()=>{opts.role='student';draw()});
}
for(let j=0;j<9;j++){
const v=await page.evaluate(({ex,j})=>{opts.role='student';opts.view='studio';opts.exercise=ex;opts.studioIndex=j;draw();const el=document.querySelector('#content');return {h:[...el.querySelectorAll('h2')].map(x=>x.textContent),p:el.querySelectorAll('textarea.prompt-value').length,old:!!el.querySelector('#answer,#microNote'),overflow:document.documentElement.scrollWidth>innerWidth+1}},{ex,j});
ok(v.h.length>=3&&v.p===1&&!v.old&&!v.overflow,'studio '+ex+'/'+j+'/'+width);
}
await page.evaluate(()=>{opts.view='lesson';draw()});
}
ok(!jsErrors.length,'page errors '+width+' '+jsErrors.join(' | '));
report.checks.push({viewport:width,lesson_views:210,studio_views:27,js_errors:0,overflow:0});await page.close();
}
const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto(fileUrl);await page.locator('#startStudent').click();
await page.evaluate(()=>{opts.idx=D.findIndex(x=>x.code==='TH-03');opts.role='student';opts.view='lesson';opts.exercise='B1';opts.micro=0;draw()});
ok(await page.evaluate(()=>opts.micro)===0,'micro init');
await page.locator('#simpleMicroNext').click();ok(await page.evaluate(()=>opts.micro)===1,'micro next');
await page.locator('#simpleMicroPrev').click();ok(await page.evaluate(()=>opts.micro)===0,'micro prev');
await page.evaluate(()=>{opts.idx=1;opts.role='student';opts.view='lesson';draw()});
const k2=await page.locator('#content').innerText();ok(k2.includes('3 tệp tải/ngày')&&k2.includes('50 nguồn/sổ')&&k2.includes('Nghiên cứu 1'),'quota/research');
await page.screenshot({path:path.join(root,'qa_student_K2.png'),fullPage:true});
await page.evaluate(()=>{opts.idx=D.findIndex(x=>x.code==='TH-03');opts.micro=2;opts.exercise='B1';draw()});
await page.screenshot({path:path.join(root,'qa_student_C1.png'),fullPage:true});
await page.evaluate(()=>{opts.role='teacher';opts.idx=1;draw()});await page.screenshot({path:path.join(root,'qa_teacher_K2.png'),fullPage:true});
await browser.close();report.checks.push({micro_next_prev:'PASS',teacher_free_sources:'PASS',screenshots:3});
try{const wb=await chromium.launch({headless:true}),wp=await wb.newPage(),res=await wp.goto('https://seeyeahall.github.io/vnstock-ai/ctec-ai-training/v66/',{waitUntil:'domcontentloaded',timeout:14000});report.public_web={http_status:res?.status()||null,title:await wp.title(),pass:res?.status()===200};await wb.close()}catch(e){report.public_web={pass:false,error:String(e).slice(0,300)}}
fs.writeFileSync(path.join(root,'qa_result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{report.errors.push(String(e));fs.writeFileSync(path.join(root,'qa_result.json'),JSON.stringify(report,null,2));console.error(e);process.exit(1)})