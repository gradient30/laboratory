import { renderActivityDiagram } from './diagrams.js';

const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
const escapeHTML=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='little-lab-v2'; // Keep original day:age keys; annual upgrade is non-destructive.
const subjects={physics:'物理',chemistry:'化学',maths:'数学',biology:'生物',history:'历史',geography:'地理',everyday:'生活常识'};
const monthLengths=[31,28,31,30,31,30,31,31,30,31,30,31];
const monthForDay=(day)=>{let end=0;return monthLengths.findIndex(n=>(end+=n)>=day)+1};
const dateOrdinal=(date)=>{const [y,m,d]=String(date).split('-').map(Number);return Date.UTC(y,m-1,d)/86400000};
const validLocalDate=(date)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return false;const n=dateOrdinal(date);return Number.isFinite(n)&&new Date(n*86400000).toISOString().slice(0,10)===date};
const safeURL=(url)=>{try{const u=new URL(url);return u.protocol==='https:'?u.href:'#'}catch{return '#'}};
let totalDays=365;
const ageBands=['4-6','7-9','10-12','13-16'];
const legacyRecordSchemas={"1:13-16":["跨度（厘米）","承重（枚）","失稳标准","误差与限制"],"2:13-16":["约圈数／秒","看不见的时间","判断标准","误差"],"3:13-16":["叶面积方案","控制与混杂因素","水滴的可能来源"],"5:13-16":["加入滴数","颜色变化","相对指示的限制"],"16:13-16":["材料","摩擦次数","距离与不确定性","带电／极化解释"],"20:13-16":["等质量壳分组","片数","反应快慢","速率与总量区别"],"23:13-16":["盐质量梯度","浮沉位置","密度范围","干扰因素"],"29:13-16":["独立样本配比","量化方案","施力控制","解释边界"]};
const ages={
 '4-6':{label:'4–6',name:'看见与表达',skill:'观察',icon:'◉',time:'5–10分钟',intro:'成人准备与示范，孩子指一指、画一画、说发现。不要求书写或背原理。',recordTitle:'说一说，或画下来',recordIntro:'和身边的大人说说看到的变化，也可以拿一张纸画出来。'},
 '7-9':{label:'7–9',name:'比较与计数',skill:'比较',icon:'⇄',time:'10–15分钟',intro:'在成人协助下比较两组，数一数、量一量，说清哪里一样、哪里不同。',recordTitle:'把两组放在一起看',recordIntro:'写下观察到的相同与不同；数量或长度要带单位。'},
 '10-12':{label:'10–12',name:'控制与记录',skill:'测量',icon:'⌁',time:'15–20分钟',intro:'先预测，明确改变什么、保持什么，再做记录；适合时用新材料重复3次。',recordTitle:'让观察变成证据',recordIntro:'记录实际条件与结果。没观察到或超时也照实写，不补造数据。'},
 '13-16':{label:'13–16',name:'证据与模型',skill:'建模',icon:'⤴',time:'20–30分钟',intro:'提出可测问题，用对照、重复和图表组织证据；解释误差，再改进一次。',recordTitle:'证据支持哪种解释？',recordIntro:'可以在纸上补充数据表或图像。把观察、解释与不确定性分开。'}
};
const localDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
let storageWorks=true, state;
try{state=JSON.parse(localStorage.getItem(KEY)||'null')}catch{storageWorks=false}
if(!state||typeof state!=='object'||Array.isArray(state))state={};
state.startDate=validLocalDate(state.startDate)?state.startDate:localDate();
state.age=ageBands.includes(state.age)?state.age:'4-6';
const isRecord=(value)=>!!value&&typeof value==='object'&&!Array.isArray(value);
state.completed=isRecord(state.completed)?state.completed:{};
state.steps=isRecord(state.steps)?state.steps:{};
state.records=isRecord(state.records)?state.records:{};
state.legacyRecords=isRecord(state.legacyRecords)?state.legacyRecords:{};
const recommendation=()=>Math.min(totalDays,Math.max(1,dateOrdinal(localDate())-dateOrdinal(state.startDate)+1));
state.day=Number.isInteger(state.day)?Math.max(1,Math.min(totalDays,state.day)):recommendation();
// A new local day opens its suggested activity; same-day visits resume the chosen one.
if(state.lastOpenDate&&state.lastOpenDate!==localDate())state.day=recommendation();
state.lastOpenDate=localDate();
let experiments=[],gate='locked',checks=[false,false,false],filter='all',mapMonth=String(monthForDay(state.day)),mapQuery='',journeyMonth=monthForDay(state.day),toastTimer,activePanel='procedure';
const recordKey=()=>`${state.day}:${state.age}`;
const current=()=>experiments[state.day-1];
const guide=()=>current().ageGuides[state.age];
const stepNumber=()=>{const value=Number(state.steps[recordKey()]);return Number.isInteger(value)?Math.max(0,Math.min(3,value)):0};
const isDone=(id)=>ageBands.some(age=>state.completed[`${id}:${age}`]);
const scrollTo=(s)=>$(s)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));storageWorks=true;}catch{storageWorks=false}}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3100)}
function category(e){return Object.hasOwn(subjects,e.category)?e.category:/物理/.test(e.domain)?'physics':/自然/.test(e.domain)?'biology':'chemistry'}
function badge(e){return `<span class="category-badge category-${category(e)}">${subjects[category(e)]}</span>`}
function materialIcon(name){
 let drawing;
 if(/纸|纸板|棉布|滤/.test(name))drawing='<path d="M8 5h17l7 7v25H8z" fill="#fdf8e5"/><path d="M25 5v8h7M13 20h13m-13 6h10m-10 6h13"/>';
 else if(/水|醋|油|汁|液|食用色素/.test(name))drawing='<path d="M9 13h22l-3 24H12z" fill="#e0f0e8"/><path d="M11 23h18"/><path d="M19 2c-6 8-6 10 0 10s6-2 0-10z" fill="#9dcbbc"/>';
 else if(/杯|容器|碗|盒|盘|瓶/.test(name))drawing='<path d="M8 10h24l-3 26H11z" fill="#e0efe5"/><path d="M8 10c0-5 24-5 24 0m-21 18h18"/>';
 else if(/尺|温度|秤|量/.test(name))drawing='<path d="M5 13h30v14H5z" fill="#f5d69b"/><path d="M10 13v7m5-7v4m5-4v7m5-7v4m5-4v7"/>';
 else if(/钟|计时|手机/.test(name))drawing='<circle cx="20" cy="23" r="14" fill="#f9e6d0"/><path d="M20 23V13m0 10 7 4M16 4h8m-4 0v5"/>';
 else if(/勺|茶匙/.test(name))drawing='<ellipse cx="21" cy="12" rx="8" ry="10" fill="#f3d19d"/><path d="M21 22v15"/>';
 else if(/叶|种|豆|植|芹|花|果|蔬/.test(name))drawing='<path d="M20 36V18m0 9c-15 1-15-15-15-15 14 0 15 7 15 15m0-7c15 1 15-15 15-15-14 0-15 7-15 15" fill="#afd0ad"/>';
 else if(/硬币|夹|重物|石/.test(name))drawing='<ellipse cx="20" cy="29" rx="13" ry="5" fill="#f0ca82"/><path d="M7 22v7m26-7v7"/><ellipse cx="20" cy="22" rx="13" ry="5" fill="#f7d999"/><path d="M7 15v7m26-7v7"/><ellipse cx="20" cy="15" rx="13" ry="5" fill="#ffe2a4"/>';
 else if(/书/.test(name))drawing='<path d="M5 12h30v24H5z" fill="#dfb5a2"/><path d="M10 12v24M5 6h30v24H5z" fill="#e2bd7c"/><path d="M10 6v24m4-17h15"/>';
 else if(/糖|盐|粉|苏打|淀/.test(name))drawing='<path d="M8 9h24v28H8z" fill="#eee9d6"/><path d="M8 9 12 3h16l4 6"/><path d="m14 26 6-8 6 8z" fill="#fdfaf0"/>';
 else if(/笔/.test(name))drawing='<path d="m10 31 3-10L29 5l6 6-16 16z" fill="#f1c583"/><path d="m10 31 8-3m5-17 6 6"/>';
 else drawing='<rect x="7" y="8" width="26" height="27" rx="5" fill="#e7e9d7"/><path d="M7 15h26M20 8v27"/>';
 return `<svg viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="#53766a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${drawing}</svg>`;
}
function renderAge(){
 $('#age-tabs').innerHTML=ageBands.map(age=>`<button class="age-tab" data-age="${age}" aria-pressed="${state.age===age}"><b>${ages[age].label}<small style="font-size:8px;font-weight:500"> 岁</small></b><span>${ages[age].name}</span></button>`).join('');
 $('#age-context').innerHTML=`<b>${ages[state.age].skill}入口 · 建议${ages[state.age].time}</b><span>${ages[state.age].intro} 等待时间另计，可随兴趣调整。</span>`;
 $$('[data-age]').forEach(btn=>btn.addEventListener('click',()=>{state.age=btn.dataset.age;gate='locked';checks=[false,false,false];save();renderAge();renderExperiment();renderJourney()}));
}
function renderExperiment(){
 const e=current(),g=guide(),a=ages[state.age],done=!!state.completed[recordKey()];
 $('#day-number').textContent=`第 ${monthForDay(e.id)} 月 · DAY ${e.day} / ${totalDays}`;
 $('#today-btn').textContent=`今日推荐 · DAY ${String(recommendation()).padStart(2,'0')}`;
 $('#day-prev').disabled=state.day===1;$('#day-next').disabled=state.day===totalDays;
 document.title=`第${e.day}天 · ${e.title} | 小小实验室`;
 $('#safety-dialog-content').replaceChildren();
 $('#experiment').innerHTML=`<div class="experiment-shell">
 <header class="experiment-top"><div><div class="activity-labels">${badge(e)}<span class="activity-kind">${escapeHTML(e.type)}</span></div><span class="subject-tag"><span class="subject-dot"></span>${escapeHTML(e.domain)} / ${escapeHTML(e.type)} <span style="margin-left:7px">主活动</span></span><h3>${escapeHTML(e.title)}</h3><p class="big-question">${category(e)==='history'?'带着问题找证据':'先想一想'}：${escapeHTML(e.question)}</p><div class="metadata"><span class="pill">◷ ${escapeHTML(e.duration)}</span>${e.wait?`<span class="pill">⏳ 等待：${escapeHTML(e.wait)}</span>`:''}<span class="pill">${a.label}岁 · ${a.name}</span></div></div><div class="day-stamp" aria-hidden="true"><small>DAY</small><b>${e.day}</b><small>DISCOVER</small></div></header>
 <section class="materials-section" aria-label="准备材料"><h4 class="minor-heading">01 / 把材料摆好 <span>先用家里现成的，不必一次买齐</span></h4><div class="materials">${e.materials.map(m=>`<div class="material"><span class="material-icon">${materialIcon(m)}</span><span>${escapeHTML(m)}</span></div>`).join('')}</div></section>
 <section class="safety-box" aria-labelledby="safety-title"><div class="safety-title"><b id="safety-title"><span aria-hidden="true">◇</span> 开始前，请大人一起确认</b><small>安全不会随年龄降低</small></div><div class="safety-specific"><p><strong>今天特别留意：</strong>${escapeHTML(e.safety)}</p><p>${state.age==='4-6'?'4–6岁：成人全程在触手可及处；小件、剪切与指定准备步骤由成人完成。':state.age==='7-9'?'7–9岁：成人协助摆好两组；剪切、预处理及指定小件由成人负责。':'成人需知情并能及时介入；工具、热水预处理与当天指定成人步骤不能自行省略陪护。'}</p></div><div class="checks"><label><input type="checkbox" data-check="0" ${checks[0]?'checked':''}>${state.age==='4-6'?'我（成人）会全程近距离陪同，并负责今天的成人步骤。':'成人已了解今天的活动、能及时介入，并会完成指定成人步骤。'}</label><label><input type="checkbox" data-check="1" ${checks[1]?'checked':''}>已核对当天材料、用量与安全提醒，选择稳定位置，液体远离插座。</label><label><input type="checkbox" data-check="2" ${checks[2]?'checked':''}>实验材料不入口、不凑近闻；小件远离口鼻，结束后洗手并收好。</label></div><div class="prep-actions"><button id="begin" class="button primary" ${checks.every(Boolean)?'':'disabled'}>准备好了，开始探索 <span aria-hidden="true">→</span></button><button id="preview-steps" class="text-button">仅查看图示，暂不动手</button></div><p id="gate-status" class="gate-status">${gate==='ready'?'✓ 已确认准备；过程中仍需持续判断安全。':gate==='preview'?'当前为图示预览；真正动手前仍需成人完成上方确认。':'完成三项准备确认后，再按步骤动手；也可以先预览图示。'}</p></section>
 <section class="procedure" id="procedure" aria-labelledby="procedure-title"><div class="procedure-header"><h4 class="minor-heading" id="procedure-title">02 / 跟着图，一步一步来</h4><span id="view-state" class="view-state"></span></div><div class="age-method">${g.support?`<p class="age-support"><strong>支持与安全提醒：</strong>${escapeHTML(g.support)}</p>`:''}${g.control?`<p class="age-control-note"><strong>比较条件／证据要求：</strong>${escapeHTML(g.control)}</p>`:''}${g.time?`<p>${escapeHTML(g.time)}</p>`:''}</div><div class="flow" aria-label="四步操作流程">${e.steps.map((step,i)=>`<button class="flow-button" data-step="${i}" aria-label="第${i+1}步：${escapeHTML(step.title)}"><span class="flow-number">${i+1}</span><span class="flow-text">${escapeHTML(step.title)}</span></button>`).join('')}</div><div id="step-stage" class="step-stage" tabindex="-1" aria-label="当前步骤"></div><div class="step-controls"><button id="step-prev" class="button outline">← 上一步</button><span id="step-counter" class="step-counter"></span><button id="step-next" class="button primary">下一步 →</button></div><div id="locked-message" class="locked-message">先请成人完成安全准备，或选择“仅查看图示”。</div></section>
 <section class="discovery-bottom" id="observations"><h4 class="minor-heading">03 / 把发现留下来 <span>先讲现象，再找解释</span></h4><div class="observe-grid"><div class="observe-prompt"><h4>你注意到了什么？</h4><p>${escapeHTML(g.observe||e.question)}</p><details><summary>观察以后，再看现象提示</summary><div class="observation-answer">${escapeHTML(e.observations)}<p style="margin:10px 0 0">${escapeHTML(e.explanation)}</p><p style="font-size:10px;margin:10px 0 0">你的结果不同，也请保留它。先检查条件，不自行加热或增加用量。</p></div></details><div class="child-task" style="margin-top:17px"><strong>${a.label}岁 / 今天的探索任务</strong>${escapeHTML(g.goal||e.ageTasks[state.age])}</div></div><div class="observe-prompt"><h4>${a.recordTitle}</h4><p>${a.recordIntro}</p><div id="record-area"></div><p class="record-note">这里只记录实验现象，不填写姓名、生日或联系方式。<span id="save-status">${storageWorks?'自动保存在当前域名的本设备浏览器。':'当前浏览器不能保存，离开页面后记录会丢失。'}</span></p></div></div>
 ${renderInquiry(e)}
 <details class="extension"><summary><span class="extension-tag">可选 +1</span>${escapeHTML(e.extension.title||'再试一个小变化')}<span></span></summary><div><p>今天还有兴趣和精力，再选这一个就够了。也可以留给另一天。</p>${e.extension.ageNote?`<p class="extension-age-note"><strong>分龄参与：</strong>${escapeHTML(e.extension.ageNote)}</p>`:''}<div class="mini-flow">${extensionNodes(e).map((node,i)=>`<div class="mini-node"><b><span>${i+1}</span>${['先商量','再试试','说发现'][i]}</b><p>${escapeHTML(node)}</p></div>`).join('')}</div><p class="mini-note">成人提醒：${escapeHTML(e.extension.safety||e.safety)}</p></div></details>
 <div class="finish-row"><button id="complete-day" class="button ${done?'outline':'primary'}" aria-pressed="${done}">${done?'✓ 已留下这次探索足迹':'留下今天的探索足迹'} <span aria-hidden="true">✦</span></button><p>做到这里就很好。无需做延伸，也不需要得到“标准结果”。<br>同一天换一个年龄入口，记录会分别保存。</p></div></section>
 <div class="source-line"><strong>来源与改编：</strong>${escapeHTML(e.sourceNote||'家庭探究改编，非机构认证课程。')} ${e.sources.length?e.sources.map(s=>`<a href="${escapeHTML(safeURL(s.url))}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.originalTitle||s.title)} ↗</a>`).join(''):'本方案自编／家庭改编，无逐项对应原页。'}<br>图示为操作与思考示意，不是实拍或结果保证；准确用量与安全要求以步骤正文为准。${renderReview(e)}</div></div>`;
 buildWorkspace();
 $$('[data-check]').forEach(input=>input.addEventListener('change',()=>{checks[+input.dataset.check]=input.checked;$('#begin').disabled=!checks.every(Boolean);if(gate==='ready'&&!checks.every(Boolean)){gate='locked';$('#gate-status').textContent='准备条件已改变，请重新确认后继续动手。';renderStep()}}));
 $('#begin').addEventListener('click',()=>{if(!checks.every(Boolean))return;gate='ready';$('#gate-status').textContent='✓ 已确认准备；过程中仍需持续判断安全。';renderStep();closeDialog('safety-dialog');focusProcedure()});
 $('#preview-steps').addEventListener('click',()=>{gate='preview';$('#gate-status').textContent='当前为图示预览；真正动手前仍需成人完成上方确认。';renderStep();closeDialog('safety-dialog');focusProcedure()});
 $$('[data-step]').forEach(btn=>btn.addEventListener('click',()=>setStep(+btn.dataset.step)));
 $('#step-prev').addEventListener('click',()=>setStep(stepNumber()-1));
 $('#step-next').addEventListener('click',()=>{if(stepNumber()===3)showPanel('observations',true);else {setStep(stepNumber()+1);scrollTo('#step-stage')}});
 $('#complete-day').addEventListener('click',()=>{state.completed[recordKey()]=!state.completed[recordKey()];save();const done=state.completed[recordKey()];$('#complete-day').innerHTML=`${done?'✓ 已留下这次探索足迹':'留下今天的探索足迹'} <span aria-hidden="true">✦</span>`;$('#complete-day').setAttribute('aria-pressed',String(done));$('#complete-day').className=`button ${done?'outline':'primary'}`;renderJourney();toast(done?'这一点发现，已留在本设备的成长足迹里。':'已取消这次探索标记，随时可以再来。')});
 renderStep();renderRecord();
}
function buildWorkspace(){
 const shell=$('.experiment-shell'),safety=$('.safety-box'),materials=$('.materials-section'),procedure=$('#procedure'),observations=$('#observations');
 const learning=document.createElement('section');learning.id='learning-panel';learning.className='learning-panel';
 learning.append($('.inquiry-section'),$('.extension'),$('.source-line'));
 const source=$('.source-line',learning),details=document.createElement('details');details.className='source-disclosure';details.innerHTML='<summary>来源、改编与核查范围</summary>';source.replaceWith(details);details.append(source);
 shell.append(learning);
 const method=$('.age-method'),methodDetails=document.createElement('details');methodDetails.className='method-disclosure';methodDetails.innerHTML='<summary>分龄支持与比较条件</summary>';method.replaceWith(methodDetails);methodDetails.append(method);
 // The full safety requirements and materials remain in the pre-flight dialog, not lost in a collapsed card.
 const dialogMaterials=document.createElement('div');dialogMaterials.className='dialog-materials';dialogMaterials.innerHTML='<h3>1 / 核对材料</h3><ul>'+current().materials.map(m=>`<li>${escapeHTML(m)}</li>`).join('')+'</ul><h3>2 / 留意风险并确认</h3>';
 $('#safety-dialog-content').append(dialogMaterials,safety);
 if(guide().support){const ageSafety=document.createElement('p');ageSafety.className='dialog-age-support';ageSafety.innerHTML='<strong>本年龄支持与安全：</strong>'+escapeHTML(guide().support);$('.safety-specific',safety).append(ageSafety);}
 const printSafety=document.createElement('section');printSafety.className='print-safety';printSafety.innerHTML='<h4>成人安全要求</h4>'+$('.safety-specific',safety).innerHTML;$('.experiment-top').after(printSafety);
 const stepSafety=document.createElement('details');stepSafety.className='step-safety-reminder';stepSafety.innerHTML='<summary>◇ 当天安全提醒 · 成人在旁，不入口</summary>'+$('.safety-specific',safety).innerHTML;$('.step-controls').before(stepSafety);
 materials.id='materials-panel';
 const tools=document.createElement('div');tools.className='workspace-tools';tools.innerHTML='<div class="safety-compact"><div><b id="prep-summary">动手前，先请家长确认</b><span id="prep-hint">可先看图；未确认不代表可以独自操作。</span></div><button id="open-safety" class="button primary compact">开始前确认 →</button><button id="preview-main" class="text-button">先看图</button></div><div class="workspace-tabs" role="tablist" aria-label="当前实验内容"><button role="tab" id="tab-procedure" data-panel="procedure" aria-controls="procedure">操作步骤</button><button role="tab" id="tab-materials-panel" data-panel="materials-panel" aria-controls="materials-panel">准备材料</button><button role="tab" id="tab-observations" data-panel="observations" aria-controls="observations">记录发现</button><button role="tab" id="tab-learning-panel" data-panel="learning-panel" aria-controls="learning-panel">知识拓展</button></div>';
 $('.experiment-top').after(tools);
 tools.after($('.workspace-tabs',tools));
 for(const panel of [materials,procedure,observations,learning]){panel.classList.add('workspace-panel');panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','tab-'+panel.id);panel.tabIndex=0;}
 $('#open-safety').addEventListener('click',()=>openDialog('safety-dialog'));
 $('#preview-main').addEventListener('click',()=>{gate='preview';renderStep();focusProcedure()});
 $$('[data-panel]').forEach((button,index,buttons)=>{button.addEventListener('click',()=>showPanel(button.dataset.panel,false,true));button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%buttons.length;else if(event.key==='ArrowLeft')next=(index+buttons.length-1)%buttons.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=buttons.length-1;else return;event.preventDefault();showPanel(buttons[next].dataset.panel,false,true);buttons[next].focus({preventScroll:true})})});
 showPanel(activePanel);
}
function focusProcedure(){showPanel('procedure');$('#step-stage').focus({preventScroll:true});scrollTo('#step-stage')}
function showPanel(id,focus=false,align=false){
 if(!['procedure','materials-panel','observations','learning-panel'].includes(id))id='procedure';activePanel=id;
 $$('.workspace-panel').forEach(p=>p.hidden=p.id!==id);
 $$('[data-panel]').forEach(b=>{const selected=b.dataset.panel===id;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1});
 if(focus)$('#'+id).focus({preventScroll:true});if(focus||align)scrollTo('#'+id)
}
function extensionNodes(e){const s=e.extension.steps||[];if(s.length>=3)return [s[0],s[1],s.slice(2).join(' ')];if(s.length===2)return [s[0],s[1],'和主活动比较：哪里一样，哪里不同？说出一个新发现。'];return ['先和成人商量：准备改变哪一点？预测会出现什么变化。',s[0]||'按当天的可选方案探索，不另加材料或增加用量。','把这次和主活动放在一起比较。这个结果支持你的预测吗？'];}
function renderStep(){
 const e=current(),g=guide(),i=stepNumber(),step=e.steps[i],gs=g.steps[i],a=ages[state.age];
 const actor=gs.actor||step.actor,actionIncludesCore=typeof gs.action==='string'&&gs.action.includes(step.detail);
 const role={adult:'成人操作 · 孩子观察',child:'孩子探索 · 成人在旁',together:'亲子一起'}[actor]||'成人在旁 · 一起探索';
 $('#view-state').textContent=gate==='ready'?'准备就绪 · 按图动手':gate==='preview'?'仅预览 · 动手前需确认':'先完成成人准备';
 $('#step-stage').innerHTML=`<div class="diagram-panel">${renderActivityDiagram(e,i,state.age)}<button class="diagram-zoom" id="zoom-diagram" aria-label="放大此步骤操作图">放大图示 ⤢</button><span class="diagram-caption">操作示意 · 具体尺寸与用量见右侧／下方</span></div><div class="step-copy"><div class="step-index">STEP ${String(i+1).padStart(2,'0')} / 04 <span class="role-chip">${escapeHTML(role)}</span></div><h4>${escapeHTML(step.title)}</h4>${actionIncludesCore?'':`<p class="step-detail">${escapeHTML(step.detail)}</p>`}${gs.action?`<p class="age-action"><strong>${a.label}岁 · 本年龄执行方式：</strong>${escapeHTML(gs.action)}</p>`:''}<div class="child-task"><strong>${a.label}岁 / ${a.name}</strong>${escapeHTML(gs.caption)}</div>${gs.adultNote?`<p class="adult-note">成人提示：${escapeHTML(gs.adultNote)}</p>`:''}</div>`;
 $('#zoom-diagram').addEventListener('click',()=>{populateDiagram();openDialog('diagram-dialog')});
 $$('.flow-button').forEach((btn,j)=>{btn.disabled=gate==='locked';if(i===j)btn.setAttribute('aria-current','step');else btn.removeAttribute('aria-current')});
 $('#step-prev').disabled=gate==='locked'||i===0;$('#step-next').disabled=gate==='locked';$('#step-next').textContent=i===3?'去记录发现 ↘':'下一步 →';
 $('#step-counter').innerHTML=`<b>${i+1}</b> / 4 步`;
 $('#locked-message').hidden=gate!=='locked';
 $('#prep-summary').textContent=gate==='ready'?'✓ 已完成家长确认':gate==='preview'?'仅预览图示，尚未开始实验':'动手前，先请家长确认';
 $('#prep-hint').textContent=gate==='ready'?'条件有变化？请重新核对，成人仍需在旁。':'可先看图；未确认不代表可以独自操作。';
 $('#open-safety').textContent=gate==='ready'?'查看／调整确认':'开始前确认 →';
 $('#preview-main').hidden=gate!=='locked';
}
function setStep(i){if(gate==='locked'||i<0||i>3)return;state.steps[recordKey()]=i;save();renderStep();$('#step-stage').focus({preventScroll:true})}
function migrateLegacyRecords(){
 if(state.recordSchemaVersion===3)return;
 for(const [key,labels] of Object.entries(legacyRecordSchemas)){
  const rec=state.records[key];if(!isRecord(rec))continue;
  const fields=labels.map((label,i)=>({key:`field${i}`,label,value:rec[`field${i}`]??''}));
  if(!fields.some(f=>String(f.value).trim()))continue;
  // Archive all original fields before clearing positional inputs. No old label is repurposed.
  const existing=state.legacyRecords[key];
  if(!isRecord(existing)||!Array.isArray(existing.fields)||!isRecord(existing.originalRecord))state.legacyRecords[key]={version:'2.0',fields,originalRecord:JSON.parse(JSON.stringify(rec))};
  for(const field of fields)delete rec[field.key];
 }
 state.recordSchemaVersion=3;
}
function renderLegacyRecord(key){
 const legacy=state.legacyRecords[key];if(!isRecord(legacy)||!Array.isArray(legacy.fields))return '';
 return `<section class="legacy-record" aria-label="旧版记录（原字段保留）"><h5>旧版记录（原字段保留）</h5><p>引导内容已完善。以下是你原来的字段和记录，不改写其含义；新版记录可在下方重新填写。</p><dl>${legacy.fields.filter(f=>isRecord(f)&&typeof f.label==='string').map(f=>`<dt>${escapeHTML(f.label)}</dt><dd>${escapeHTML(f.value)||'（原字段为空）'}</dd>`).join('')}</dl></section>`;
}
function renderRecord(){
 const g=guide(),key=recordKey(),rec=isRecord(state.records[key])?state.records[key]:{};state.records[key]=rec;
 if(state.age==='4-6'){
 $('#record-area').innerHTML=`<div class="observation-chips" aria-label="选择今天的感受">${['我有了一个新发现','和我猜得不一样','我还想再试一次'].map((s,i)=>`<button class="observation-chip" data-choice="${i}" aria-pressed="${rec.choice===i}">${s}</button>`).join('')}</div><div class="record-fields"><label>请成人代记一句孩子的原话（可留空）<textarea data-field="spoken" maxlength="400" placeholder="我看到……">${escapeHTML(rec.spoken||'')}</textarea></label></div>`;
 $$('[data-choice]').forEach(btn=>btn.addEventListener('click',()=>{rec.choice=rec.choice===+btn.dataset.choice?null:+btn.dataset.choice;save();renderRecord()}));
 }else{
 const fields=g.recordFields||['我猜','我看到','还想知道'];
 $('#record-area').innerHTML=`<div class="record-fields">${fields.map((f,i)=>`<label>${escapeHTML(f)}<${i===fields.length-1?'textarea':'input'} data-field="field${i}" maxlength="600" ${i===fields.length-1?'':`value="${escapeHTML(rec['field'+i]||'')}"`} placeholder="${state.age==='7-9'?'写下或请大人代记……':'如实写下条件、结果或疑问……'}">${i===fields.length-1?escapeHTML(rec['field'+i]||'')+'</textarea>':''}</label>`).join('')}</div>`;
 }
 $('#record-area').insertAdjacentHTML('afterbegin',renderLegacyRecord(key));
 $$('[data-field]').forEach(input=>input.addEventListener('input',()=>{rec[input.dataset.field]=input.value;save();$('#save-status').textContent=storageWorks?'已自动保存在当前域名的本设备浏览器。':'当前浏览器不能保存，离开页面后记录会丢失。'}));
}
function renderInquiry(e){
 const q=e.inquiry;if(!q)return '';
 const items=[['01','遇到什么问题？',q.problem],['02','怎样尝试解决？',q.solve],['03','这次学到了什么？',q.learn],['04','还能怎样改进？',q.evolve]];
 return `<section class="inquiry-section" aria-label="知识启发与进阶"><div class="inquiry-heading"><span class="eyebrow">THINK · TRY · REFLECT · EVOLVE</span><h4>让一次探索，长出下一个问题。</h4></div><div class="inquiry-grid">${items.map(([n,title,body])=>`<article><span>${n}</span><h5>${title}</h5><p>${escapeHTML(body)}</p></article>`).join('')}</div><p class="evidence-limit"><strong>${category(e)==='history'?'史料与解释的边界':'结论的适用边界'}：</strong>${escapeHTML(q.limits)}</p></section>`;
}
function renderReview(e){
 const r=e.review;if(!r)return '<p class="review-note">原版活动：请同时核对来源和当天安全提示；不是机构认证课程。</p>';
 return `<details class="review-details"><summary>资料核查与证据范围（未实地试做）</summary><p>${escapeHTML(r.method||'来源核查')} · ${escapeHTML(r.checkedAt||'日期未标注')}</p><p>${escapeHTML(r.limitations||'未实地试做；家庭条件可能改变观察结果。')}</p><ul>${e.sources.map(s=>`<li><a href="${escapeHTML(safeURL(s.url))}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.title||s.originalTitle)} ↗</a>${[s.claim,s.scope,s.support].some(Boolean)?'：'+[...new Set([s.claim,s.scope,s.support].filter(Boolean))].map(escapeHTML).join('；'):'：主题或原理参考，具体家庭步骤为改编。'}</li>`).join('')}</ul><p>来源参考不代表来源机构背书；自动化检查不等于真人专家认证或法律合规认证。</p></details>`;
}
function renderJourney(){
 const completed=experiments.filter(e=>isDone(e.id)).length;
 const monthDays=experiments.filter(e=>monthForDay(e.id)===journeyMonth);
 $('#journey-content').innerHTML=`<div class="journey-months" role="group" aria-label="选择成长月份">${monthLengths.map((_,i)=>{const days=experiments.filter(e=>monthForDay(e.id)===i+1),count=days.filter(e=>isDone(e.id)).length;return `<button data-journey-month="${i+1}" aria-pressed="${journeyMonth===i+1}"><b>第 ${i+1} 月</b><small>${count} / ${days.length}</small></button>`}).join('')}</div><div class="journey-panel"><div class="progress-summary"><div class="progress-count">${completed}<small> / ${totalDays}</small></div><p>天留下了探索足迹<br>可以跳过，也可以再发现一次</p></div><div class="journey-dots" aria-label="第${journeyMonth}月探索进度">${monthDays.map(e=>`<button class="journey-dot ${isDone(e.id)?'done':''} ${state.day===e.id?'current':''}" data-day="${e.id}" aria-label="第${e.day}天 ${escapeHTML(e.title)}${isDone(e.id)?'，已探索':''}">${isDone(e.id)?'✓':e.id}</button>`).join('')}</div></div><div class="skills-row">${ageBands.map(age=>{const count=experiments.filter(e=>state.completed[`${e.id}:${age}`]).length;return `<div class="skill-item"><span class="skill-symbol" aria-hidden="true">${ages[age].icon}</span><div>${ages[age].skill}足迹<small>${count?`已记录 ${count} 次${ages[age].name}探索`:'等一次属于你的发现'}</small></div></div>`}).join('')}</div>`;
 $$('#journey-content [data-day]').forEach(b=>b.addEventListener('click',()=>{chooseDay(+b.dataset.day);scrollTo('#lab')}));
 $$('[data-journey-month]').forEach(b=>b.addEventListener('click',()=>{journeyMonth=+b.dataset.journeyMonth;renderJourney()}));
}
function renderMap(){
 const query=mapQuery.trim().toLocaleLowerCase();
 const visible=experiments.filter(e=>(filter==='all'||category(e)===filter)&&(mapMonth==='all'||monthForDay(e.id)===Number(mapMonth))&&(!query||[e.title,e.domain,e.question,e.id,...e.materials].join(' ').toLocaleLowerCase().includes(query)));
 $('#navigator-progress').textContent=`已探索 ${experiments.filter(e=>isDone(e.id)).length} / ${totalDays}`;
 $('#map-count').textContent=`找到 ${visible.length} 个活动 · 全年 ${totalDays} 个主活动`;
 $('#map-grid').innerHTML=visible.length?visible.map(e=>`<button class="map-day ${e.id===state.day?'current':''} ${isDone(e.id)?'done':''}" data-day="${e.id}" aria-label="第${e.day}天：${escapeHTML(e.title)}${isDone(e.id)?'，已探索':''}"><span class="map-top"><span>第${monthForDay(e.id)}月 / ${e.day}</span><span aria-hidden="true">${isDone(e.id)?'✓':e.id===state.day?'●':'○'}</span></span>${badge(e)}<strong>${escapeHTML(e.title)}</strong><span class="map-domain">${escapeHTML(e.type)} · ${escapeHTML(e.domain)}</span></button>`).join(''):`<div class="empty-map"><p>没有符合条件的活动。试试其他学科、月份，或缩短搜索词。</p>${mapMonth!=='all'?'<button id="map-show-year" class="button outline compact">查看全年该学科</button>':''}</div>`;
 $('#map-show-year')?.addEventListener('click',()=>{mapMonth='all';$('#map-month').value='all';renderMap()});
 $$('#map-grid [data-day]').forEach(btn=>btn.addEventListener('click',()=>{chooseDay(+btn.dataset.day);closeDialog('day-map');scrollTo('#lab')}));
}
function chooseDay(id){activePanel='procedure';if(['#dots','#journey','#sources'].includes(location.hash)){history.replaceState(history.state,'','#lab');syncView()}if(!Number.isInteger(id)||id<1||id>totalDays)return;state.day=id;journeyMonth=monthForDay(id);gate='locked';checks=[false,false,false];save();renderExperiment();renderJourney()}
let dialogNavigation=false,appLoaded=false;
const dialogOpeners=new Map();
function trapDialogFocus(event){
 if(event.key!=='Tab')return;const dialog=event.currentTarget;if(!dialog.open)return;
 const focusable=$$('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',dialog).filter(el=>el.tabIndex>=0&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&!el.closest('[hidden], [inert]'));
 if(!focusable.length){event.preventDefault();dialog.focus();return}
 const index=focusable.indexOf(document.activeElement),last=focusable.length-1;
 if(index===-1||(event.shiftKey&&index===0)||(!event.shiftKey&&index===last)){event.preventDefault();focusable[event.shiftKey?last:0].focus()}
}

function syncDialogUI(){const opened=!!$('dialog[open]');document.body.classList.toggle('dialog-open',opened);$$('.map-trigger').forEach(b=>b.setAttribute('aria-expanded',String($('#day-map').open)))}
function restoreDialogFocus(id){const opener=dialogOpeners.get(id);if(opener?.isConnected&&!opener.closest('[hidden]'))opener.focus({preventScroll:true});else if(id==='day-map')$('#navigator-handle').focus({preventScroll:true});else if(id==='safety-dialog')$('#open-safety')?.focus({preventScroll:true})}
function populateDiagram(){const e=current(),i=stepNumber(),gs=guide().steps[i];$('#enlarged-diagram').innerHTML=renderActivityDiagram(e,i,state.age);$('#diagram-dialog-title').textContent=`第${e.day}天 · 第${i+1}步`;$('#enlarged-instruction').textContent=(gs.action?.includes(e.steps[i].detail)?'':e.steps[i].detail+' ')+(gs.action?ages[state.age].label+'岁执行方式：'+gs.action:'')+(gs.adultNote?' 成人提示：'+gs.adultNote:'')}
function openDialog(id){if(dialogNavigation)return;const dialog=$('#'+id);if(dialog.open)return;dialogOpeners.set(id,document.activeElement);dialog.showModal();syncDialogUI();history.pushState({...history.state,littleLabDialog:id,littleLabDialogContext:{day:state.day,age:state.age,step:stepNumber()}},'',location.href)}
function closeDialog(id){const dialog=$('#'+id);if(!dialog.open)return;dialog.close();syncDialogUI();restoreDialogFocus(id);if(history.state?.littleLabDialog===id){dialogNavigation=true;history.back()}}
function clearStaleDialogState(){if(history.state?.littleLabDialog){const next={...history.state};delete next.littleLabDialog;delete next.littleLabDialogContext;history.replaceState(next,'',location.href)}}
window.addEventListener('popstate',()=>{
 const closing=$$('dialog[open]').map(d=>d.id);$$('dialog[open]').forEach(d=>d.close());dialogNavigation=false;for(const id of closing)restoreDialogFocus(id);if(!appLoaded)return;
 const id=history.state?.littleLabDialog,context=history.state?.littleLabDialogContext;
 if(id==='day-map'){renderMap();$('#day-map').showModal()}
 else if(id==='safety-dialog'){
  if(context&&(context.day!==state.day||context.age!==state.age)){if(ageBands.includes(context.age))state.age=context.age;chooseDay(context.day);renderAge()}
  $('#safety-dialog').showModal()
 }
 else if(id==='diagram-dialog'){
  if(context&&Number.isInteger(context.day)&&context.day>=1&&context.day<=totalDays){if(ageBands.includes(context.age))state.age=context.age;chooseDay(context.day);state.steps[recordKey()]=Number.isInteger(context.step)?Math.max(0,Math.min(3,context.step)):0;gate='preview';save();renderAge();renderStep()}
  populateDiagram();$('#diagram-dialog').showModal();
 }
 syncDialogUI();
});

function renderDots(snapshot){
 const root=$('#dots-content');if(!snapshot){root.innerHTML='<p>当前没有可公开的执行环境快照。</p>';return}
 const card=(title,rows,note='')=>`<article class="dots-card"><h2>${escapeHTML(title)}</h2><dl>${rows.map(([key,value])=>`<div><dt>${escapeHTML(key)}</dt><dd>${escapeHTML(value??'未知 / 接口不可用')}</dd></div>`).join('')}</dl>${note?`<p>${escapeHTML(note)}</p>`:''}</article>`;
 const gib=bytes=>Number.isFinite(bytes)?(bytes/1073741824).toFixed(2)+' GiB':'未知';
 root.innerHTML=`<div class="dots-scope"><p><strong>${escapeHTML(snapshot.scope)}</strong></p><p>采集时间：<time datetime="${escapeHTML(snapshot.capturedAt)}">${escapeHTML(snapshot.capturedAt)}</time></p><p>这是已发布版本携带的静态快照，不会随访问重新采集。执行环境可能重建，快照可能过时；不是 Cloudflare Workers 配置，也不能证明模型推理后端硬件。</p></div><div class="dots-grid">${card('系统',[['操作系统',snapshot.os],['内核',snapshot.kernel],['架构',snapshot.architecture]])}${card('处理器',[['CPU 型号字符串',snapshot.cpuModel],['可见逻辑 CPU',snapshot.visibleLogicalCpus],['进程亲和性 CPU 数',snapshot.cpuAffinityCount],['cgroup CPU 配额',snapshot.cgroupCpuMax]],snapshot.cpuNote)}${card('内存',[['内核可见总量',snapshot.visibleMemTotal],['采集时可见可用量',snapshot.visibleMemAvailable],['已验证 cgroup 硬限额',snapshot.cgroupMemoryMax]],snapshot.memoryNote)}${card('可见文件系统',[['接口报告逻辑容量',gib(snapshot.visibleRootDisk?.totalBytes)],['已用 / 剩余', '未核实，不展示虚拟统计值']],snapshot.diskNote)}${card('软件版本',Object.entries(snapshot.software||{}))}${card('边界与隐私',[['未取得的数据',(snapshot.unavailable||[]).join('；')]],snapshot.privacy)}</div>`;
}
function syncView(){
 const hash=location.hash,dots=hash==='#dots',journey=hash==='#journey',parents=hash==='#sources';
 $('#learning-view').hidden=dots;$('#dots-view').hidden=!dots;$('#lab').hidden=dots||journey||parents;$('#journey').hidden=!journey;$('#sources').hidden=!parents;
 document.title=dots?'Dots看板 · 小小实验室':journey?'成长足迹 · 小小实验室':parents?'给家长 · 小小实验室':'小小实验室 · 365天看得见的发现';
 $$('.site-header nav a').forEach(a=>{if(a.hash===(hash||'#lab'))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 if(dots)$('#dots-heading').focus({preventScroll:true});
}
window.addEventListener('hashchange',syncView);

async function init(){
 try{const response=await fetch('./data.json');if(!response.ok)throw Error('data response');const data=await response.json();experiments=data.experiments;if(experiments.length!==365||experiments.some((e,i)=>e.id!==i+1))throw Error('incomplete annual data');totalDays=experiments.length;state.day=Math.min(totalDays,state.day);migrateLegacyRecords();save();renderAge();renderExperiment();renderJourney();clearStaleDialogState();appLoaded=true;renderDots(data.meta.environmentSnapshot);syncView();
 $('#close-safety').addEventListener('click',()=>closeDialog('safety-dialog'));
 $('#map-current-month').addEventListener('click',()=>{mapMonth=String(monthForDay(state.day));$('#map-month').value=mapMonth;renderMap()});
 $('#map-all-year').addEventListener('click',()=>{mapMonth='all';$('#map-month').value='all';renderMap()});
 $('#close-diagram').addEventListener('click',()=>closeDialog('diagram-dialog'));
 $$('dialog').forEach(d=>{d.addEventListener('cancel',event=>{event.preventDefault();closeDialog(d.id)});d.addEventListener('keydown',trapDialogFocus)});
 $('#day-prev').addEventListener('click',()=>chooseDay(state.day-1));$('#day-next').addEventListener('click',()=>chooseDay(state.day+1));$('#today-btn').addEventListener('click',()=>{chooseDay(recommendation());toast('每天一个主活动即可，也可以自由换一天。')});
 $$('.map-trigger').forEach(btn=>btn.addEventListener('click',()=>{if(['#dots','#journey','#sources'].includes(location.hash)){history.replaceState(history.state,'','#lab');syncView()}renderMap();openDialog('day-map')}));$('#close-map').addEventListener('click',()=>closeDialog('day-map'));$('#day-map').addEventListener('click',event=>{if(event.target===$('#day-map')){const r=$('#day-map').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog('day-map')}});
 $$('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{filter=btn.dataset.filter;$$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));renderMap()}));
 $('#map-month').value=mapMonth;$('#map-month').addEventListener('change',e=>{mapMonth=e.target.value;renderMap()});$('#map-search').addEventListener('input',e=>{mapQuery=e.target.value;renderMap()});
 $('#reset-progress').addEventListener('click',()=>{if(confirm('清除这个浏览器里的全部探索足迹与实验记录？这无法撤销，不影响其他设备。')){state.completed={};state.records={};state.legacyRecords={};state.steps={};state.startDate=localDate();save();renderExperiment();renderJourney();toast('已清除本设备的探索记录。')}});
 if(!storageWorks)toast('浏览器暂时无法保存；仍可使用全部实验引导。');
 }catch(error){console.error('Little Lab initialization failed',error);$('#experiment').innerHTML='<div class="error-box"><h3>实验图册暂时没打开</h3><p>请刷新页面再试一次。若仍无法打开，请稍后回来。</p><button class="button primary" onclick="location.reload()">重新载入</button></div>'}
}
init();
