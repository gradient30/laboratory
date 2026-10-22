import { renderDiagram } from './diagrams.js';

const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
const escapeHTML=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='little-lab-v2';
const ageBands=['4-6','7-9','10-12','13-16'];
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
state.startDate=/^\d{4}-\d{2}-\d{2}$/.test(state.startDate||'')?state.startDate:localDate();
state.age=ageBands.includes(state.age)?state.age:'4-6';
state.completed=state.completed&&typeof state.completed==='object'?state.completed:{};
state.steps=state.steps&&typeof state.steps==='object'?state.steps:{};
state.records=state.records&&typeof state.records==='object'?state.records:{};
const recommendation=()=>Math.min(30,Math.max(1,Math.floor((new Date(localDate()+'T12:00:00')-new Date(state.startDate+'T12:00:00'))/86400000)+1));
state.day=Number.isInteger(state.day)&&state.day>=1&&state.day<=30?state.day:recommendation();
// A new local day opens its suggested activity; same-day visits resume the chosen one.
if(state.lastOpenDate&&state.lastOpenDate!==localDate())state.day=recommendation();
state.lastOpenDate=localDate();
let experiments=[],gate='locked',checks=[false,false,false],filter='all',toastTimer;
const recordKey=()=>`${state.day}:${state.age}`;
const current=()=>experiments[state.day-1];
const guide=()=>current().ageGuides[state.age];
const stepNumber=()=>Math.max(0,Math.min(3,Number(state.steps[recordKey()])||0));
const isDone=(id)=>ageBands.some(age=>state.completed[`${id}:${age}`]);
const scrollTo=(s)=>$(s)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));storageWorks=true;}catch{storageWorks=false}}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3100)}
function category(e){return /自然/.test(e.domain)?'nature':/物理/.test(e.domain)?'physics':'chemistry'}
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
 $('#day-number').textContent=`DAY ${e.day} / 30`;
 $('#today-btn').textContent=`今日推荐 · DAY ${String(recommendation()).padStart(2,'0')}`;
 $('#day-prev').disabled=state.day===1;$('#day-next').disabled=state.day===30;
 document.title=`第${e.day}天 · ${e.title} | 小小实验室`;
 $('#experiment').innerHTML=`<div class="experiment-shell">
 <header class="experiment-top"><div><span class="subject-tag"><span class="subject-dot"></span>${escapeHTML(e.domain)} / ${escapeHTML(e.type)} <span style="margin-left:7px">主活动</span></span><h3>${escapeHTML(e.title)}</h3><p class="big-question">先猜一猜：${escapeHTML(e.question)}</p><div class="metadata"><span class="pill">◷ ${escapeHTML(e.duration)}</span>${e.wait?`<span class="pill">⏳ 等待：${escapeHTML(e.wait)}</span>`:''}<span class="pill">${a.label}岁 · ${a.name}</span></div></div><div class="day-stamp" aria-hidden="true"><small>DAY</small><b>${e.day}</b><small>DISCOVER</small></div></header>
 <section class="materials-section" aria-label="准备材料"><h4 class="minor-heading">01 / 把材料摆好 <span>先用家里现成的，不必一次买齐</span></h4><div class="materials">${e.materials.map(m=>`<div class="material"><span class="material-icon">${materialIcon(m)}</span><span>${escapeHTML(m)}</span></div>`).join('')}</div></section>
 <section class="safety-box" aria-labelledby="safety-title"><div class="safety-title"><b id="safety-title"><span aria-hidden="true">◇</span> 开始前，请大人一起确认</b><small>安全不会随年龄降低</small></div><div class="safety-specific"><p><strong>今天特别留意：</strong>${escapeHTML(e.safety)}</p><p>${state.age==='4-6'?'4–6岁：成人全程在触手可及处；小件、剪切与指定准备步骤由成人完成。':state.age==='7-9'?'7–9岁：成人协助摆好两组；剪切、预处理及指定小件由成人负责。':'成人需知情并能及时介入；工具、热水预处理与当天指定成人步骤不能自行省略陪护。'}</p></div><div class="checks"><label><input type="checkbox" data-check="0" ${checks[0]?'checked':''}>${state.age==='4-6'?'我（成人）会全程近距离陪同，并负责今天的成人步骤。':'成人已了解今天的活动、能及时介入，并会完成指定成人步骤。'}</label><label><input type="checkbox" data-check="1" ${checks[1]?'checked':''}>已核对当天材料、用量与安全提醒，选择稳定位置，液体远离插座。</label><label><input type="checkbox" data-check="2" ${checks[2]?'checked':''}>实验材料不入口、不凑近闻；小件远离口鼻，结束后洗手并收好。</label></div><div class="prep-actions"><button id="begin" class="button primary" ${checks.every(Boolean)?'':'disabled'}>准备好了，开始实验 <span aria-hidden="true">→</span></button><button id="preview-steps" class="text-button">仅查看图示，暂不动手</button></div><p id="gate-status" class="gate-status">${gate==='ready'?'✓ 已确认准备；过程中仍需持续判断安全。':gate==='preview'?'当前为图示预览；真正动手前仍需成人完成上方确认。':'完成三项准备确认后，再按步骤动手；也可以先预览图示。'}</p></section>
 <section class="procedure" id="procedure" aria-labelledby="procedure-title"><div class="procedure-header"><h4 class="minor-heading" id="procedure-title">02 / 跟着图，一步一步来</h4><span id="view-state" class="view-state"></span></div><div class="flow" aria-label="四步操作流程">${e.steps.map((step,i)=>`<button class="flow-button" data-step="${i}" aria-label="第${i+1}步：${escapeHTML(step.title)}"><span class="flow-number">${i+1}</span><span class="flow-text">${escapeHTML(step.title)}</span></button>`).join('')}</div><div id="step-stage" class="step-stage" tabindex="-1" aria-label="当前步骤"></div><div class="step-controls"><button id="step-prev" class="button outline">← 上一步</button><span id="step-counter" class="step-counter"></span><button id="step-next" class="button primary">下一步 →</button></div><div id="locked-message" class="locked-message">先请成人完成安全准备，或选择“仅查看图示”。</div></section>
 <section class="discovery-bottom" id="observations"><h4 class="minor-heading">03 / 把发现留下来 <span>先讲现象，再找解释</span></h4><div class="observe-grid"><div class="observe-prompt"><h4>你注意到了什么？</h4><p>${escapeHTML(g.observe||e.question)}</p><details><summary>观察以后，再看现象提示</summary><div class="observation-answer">${escapeHTML(e.observations)}<p style="margin:10px 0 0">${escapeHTML(e.explanation)}</p><p style="font-size:10px;margin:10px 0 0">你的结果不同，也请保留它。先检查条件，不自行加热或增加用量。</p></div></details><div class="child-task" style="margin-top:17px"><strong>${a.label}岁 / 今天的探索任务</strong>${escapeHTML(g.goal||e.ageTasks[state.age])}</div></div><div class="observe-prompt"><h4>${a.recordTitle}</h4><p>${a.recordIntro}</p><div id="record-area"></div><p class="record-note">这里只记录实验现象，不填写姓名、生日或联系方式。<span id="save-status">${storageWorks?'自动保存在本设备浏览器。':'当前浏览器不能保存，离开页面后记录会丢失。'}</span></p></div></div>
 <details class="extension"><summary><span class="extension-tag">可选 +1</span>${escapeHTML(e.extension.title||'再试一个小变化')}<span></span></summary><div><p>今天还有兴趣和精力，再选这一个就够了。也可以留给另一天。</p><div class="mini-flow">${extensionNodes(e).map((node,i)=>`<div class="mini-node"><b><span>${i+1}</span>${['先商量','再试试','说发现'][i]}</b><p>${escapeHTML(node)}</p></div>`).join('')}</div><p class="mini-note">成人提醒：${escapeHTML(e.extension.safety||e.safety)}</p></div></details>
 <div class="finish-row"><button id="complete-day" class="button ${done?'outline':'primary'}" aria-pressed="${done}">${done?'✓ 已留下这次探索足迹':'留下今天的探索足迹'} <span aria-hidden="true">✦</span></button><p>做到这里就很好。无需做延伸，也不需要得到“标准结果”。<br>同一天换一个年龄入口，记录会分别保存。</p></div></section>
 <div class="source-line"><strong>来源与改编：</strong>${escapeHTML(e.sourceNote||'家庭探究改编，非机构认证课程。')} ${e.sources.length?e.sources.map(s=>`<a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.originalTitle||s.title)} ↗</a>`).join(''):'本方案自编／家庭改编，无逐项对应原页。'}<br>图示为装置示意，准确用量与安全要求以步骤正文为准。</div></div>`;
 $$('[data-check]').forEach(input=>input.addEventListener('change',()=>{checks[+input.dataset.check]=input.checked;$('#begin').disabled=!checks.every(Boolean);if(gate==='ready'&&!checks.every(Boolean)){gate='locked';$('#gate-status').textContent='准备条件已改变，请重新确认后继续动手。';renderStep()}}));
 $('#begin').addEventListener('click',()=>{if(!checks.every(Boolean))return;gate='ready';$('#gate-status').textContent='✓ 已确认准备；过程中仍需持续判断安全。';renderStep();scrollTo('#procedure')});
 $('#preview-steps').addEventListener('click',()=>{gate='preview';$('#gate-status').textContent='当前为图示预览；真正动手前仍需成人完成上方确认。';renderStep();scrollTo('#procedure')});
 $$('[data-step]').forEach(btn=>btn.addEventListener('click',()=>setStep(+btn.dataset.step)));
 $('#step-prev').addEventListener('click',()=>setStep(stepNumber()-1));
 $('#step-next').addEventListener('click',()=>{if(stepNumber()===3)scrollTo('#observations');else setStep(stepNumber()+1)});
 $('#complete-day').addEventListener('click',()=>{state.completed[recordKey()]=!state.completed[recordKey()];save();const done=state.completed[recordKey()];$('#complete-day').innerHTML=`${done?'✓ 已留下这次探索足迹':'留下今天的探索足迹'} <span aria-hidden="true">✦</span>`;$('#complete-day').setAttribute('aria-pressed',String(done));$('#complete-day').className=`button ${done?'outline':'primary'}`;renderJourney();toast(done?'这一点发现，已留在本设备的成长足迹里。':'已取消这次探索标记，随时可以再来。')});
 renderStep();renderRecord();
}
function extensionNodes(e){const s=e.extension.steps||[];if(s.length>=3)return [s[0],s[1],s.slice(2).join(' ')];if(s.length===2)return [s[0],s[1],'和主活动比较：哪里一样，哪里不同？说出一个新发现。'];return ['先和成人商量：准备改变哪一点？预测会出现什么变化。',s[0]||'按当天的可选方案探索，不另加材料或增加用量。','把这次和主活动放在一起比较。这个结果支持你的预测吗？'];}
function renderStep(){
 const e=current(),g=guide(),i=stepNumber(),step=e.steps[i],gs=g.steps[i],a=ages[state.age];
 const actor=gs.actor||step.actor;
 const role={adult:'成人操作 · 孩子观察',child:'孩子探索 · 成人在旁',together:'亲子一起'}[actor]||'成人在旁 · 一起探索';
 $('#view-state').textContent=gate==='ready'?'准备就绪 · 按图动手':gate==='preview'?'仅预览 · 动手前需确认':'先完成成人准备';
 $('#step-stage').innerHTML=`<div class="diagram-panel">${renderDiagram(e.id,i,state.age)}<button class="diagram-zoom" id="zoom-diagram" aria-label="放大此步骤操作图">放大图示 ⤢</button><span class="diagram-caption">操作示意 · 具体尺寸与用量见右侧／下方</span></div><div class="step-copy"><div class="step-index">STEP ${String(i+1).padStart(2,'0')} / 04 <span class="role-chip">${escapeHTML(role)}</span></div><h4>${escapeHTML(step.title)}</h4><p class="step-detail">${escapeHTML(step.detail)}</p><div class="child-task"><strong>${a.label}岁 / ${a.name}</strong>${escapeHTML(gs.caption)}</div>${gs.adultNote?`<p class="adult-note">成人提示：${escapeHTML(gs.adultNote)}</p>`:''}</div>`;
 $('#zoom-diagram').addEventListener('click',()=>{ $('#enlarged-diagram').innerHTML=renderDiagram(e.id,i,state.age);$('#diagram-dialog-title').textContent=`第${e.day}天 · 第${i+1}步`;$('#enlarged-instruction').textContent=step.detail;$('#diagram-dialog').showModal() });
 $$('.flow-button').forEach((btn,j)=>{btn.disabled=gate==='locked';if(i===j)btn.setAttribute('aria-current','step');else btn.removeAttribute('aria-current')});
 $('#step-prev').disabled=gate==='locked'||i===0;$('#step-next').disabled=gate==='locked';$('#step-next').textContent=i===3?'去记录发现 ↘':'下一步 →';
 $('#step-counter').innerHTML=`<b>${i+1}</b> / 4 步`;
 $('#locked-message').hidden=gate!=='locked';
}
function setStep(i){if(gate==='locked'||i<0||i>3)return;state.steps[recordKey()]=i;save();renderStep();$('#step-stage').focus({preventScroll:true})}
function renderRecord(){
 const g=guide(),key=recordKey(),rec=state.records[key]||{};state.records[key]=rec;
 if(state.age==='4-6'){
 $('#record-area').innerHTML=`<div class="observation-chips" aria-label="选择今天的感受">${['我看到了变化','和我猜得不一样','我还想再试一次'].map((s,i)=>`<button class="observation-chip" data-choice="${i}" aria-pressed="${rec.choice===i}">${s}</button>`).join('')}</div><div class="record-fields"><label>请成人代记一句孩子的原话（可留空）<textarea data-field="spoken" maxlength="400" placeholder="我看到……">${escapeHTML(rec.spoken||'')}</textarea></label></div>`;
 $$('[data-choice]').forEach(btn=>btn.addEventListener('click',()=>{rec.choice=rec.choice===+btn.dataset.choice?null:+btn.dataset.choice;save();renderRecord()}));
 }else{
 const fields=g.recordFields||['我猜','我看到','还想知道'];
 $('#record-area').innerHTML=`<div class="record-fields">${fields.map((f,i)=>`<label>${escapeHTML(f)}<${i===fields.length-1?'textarea':'input'} data-field="field${i}" maxlength="600" ${i===fields.length-1?'':`value="${escapeHTML(rec['field'+i]||'')}"`} placeholder="${state.age==='7-9'?'写下或请大人代记……':'如实写下条件、结果或疑问……'}">${i===fields.length-1?escapeHTML(rec['field'+i]||'')+'</textarea>':''}</label>`).join('')}</div>`;
 }
 $$('[data-field]').forEach(input=>input.addEventListener('input',()=>{rec[input.dataset.field]=input.value;save();$('#save-status').textContent=storageWorks?'已自动保存在本设备浏览器。':'当前浏览器不能保存，离开页面后记录会丢失。'}));
}
function renderJourney(){
 const completed=experiments.filter(e=>isDone(e.id)).length;
 $('#journey-content').innerHTML=`<div class="journey-panel"><div class="progress-summary"><div class="progress-count">${completed}<small> / 30</small></div><p>天留下了探索足迹<br>可以跳过，也可以再发现一次</p></div><div class="journey-dots" aria-label="30天探索进度">${experiments.map(e=>`<button class="journey-dot ${isDone(e.id)?'done':''} ${state.day===e.id?'current':''}" data-day="${e.id}" aria-label="第${e.day}天 ${escapeHTML(e.title)}${isDone(e.id)?'，已探索':''}">${isDone(e.id)?'✓':e.id}</button>`).join('')}</div></div><div class="skills-row">${ageBands.map(age=>{const count=experiments.filter(e=>state.completed[`${e.id}:${age}`]).length;return `<div class="skill-item"><span class="skill-symbol" aria-hidden="true">${ages[age].icon}</span><div>${ages[age].skill}足迹<small>${count?`已记录 ${count} 次${ages[age].name}探索`:'等一次属于你的发现'}</small></div></div>`}).join('')}</div>`;
 $$('#journey-content [data-day]').forEach(b=>b.addEventListener('click',()=>{chooseDay(+b.dataset.day);scrollTo('#lab')}));
}
function renderMap(){
 $('#map-grid').innerHTML=experiments.filter(e=>filter==='all'||category(e)===filter).map(e=>`<button class="map-day ${e.id===state.day?'current':''} ${isDone(e.id)?'done':''}" data-day="${e.id}" aria-label="第${e.day}天：${escapeHTML(e.title)}${isDone(e.id)?'，已探索':''}"><span class="map-top"><span>DAY ${e.day}</span><span aria-hidden="true">${isDone(e.id)?'✓':e.id===state.day?'●':'○'}</span></span><strong>${escapeHTML(e.title)}</strong><span class="map-domain">${escapeHTML(e.domain)}</span></button>`).join('');
 $$('#map-grid [data-day]').forEach(btn=>btn.addEventListener('click',()=>{chooseDay(+btn.dataset.day);$('#day-map').close();scrollTo('#lab')}));
}
function chooseDay(id){if(id<1||id>30)return;state.day=id;gate='locked';checks=[false,false,false];save();renderExperiment();renderJourney()}
async function init(){
 try{const response=await fetch('./data.json');if(!response.ok)throw Error('data response');const data=await response.json();experiments=data.experiments;if(experiments.length!==30)throw Error('incomplete data');save();renderAge();renderExperiment();renderJourney();
 $('#close-diagram').addEventListener('click',()=>$('#diagram-dialog').close());
 $('#day-prev').addEventListener('click',()=>chooseDay(state.day-1));$('#day-next').addEventListener('click',()=>chooseDay(state.day+1));$('#today-btn').addEventListener('click',()=>{chooseDay(recommendation());toast('每天一个主活动即可，也可以自由换一天。')});
 $$('.map-trigger').forEach(btn=>btn.addEventListener('click',()=>{renderMap();$('#day-map').showModal()}));$('#close-map').addEventListener('click',()=>$('#day-map').close());$('#day-map').addEventListener('click',event=>{if(event.target===$('#day-map')){const r=$('#day-map').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('#day-map').close()}});
 $$('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{filter=btn.dataset.filter;$$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));renderMap()}));
 $('#reset-progress').addEventListener('click',()=>{if(confirm('清除这个浏览器里的全部探索足迹与实验记录？这无法撤销，不影响其他设备。')){state.completed={};state.records={};state.steps={};state.startDate=localDate();save();renderExperiment();renderJourney();toast('已清除本设备的探索记录。')}});
 if(!storageWorks)toast('浏览器暂时无法保存；仍可使用全部实验引导。');
 }catch(error){console.error('Little Lab initialization failed',error);$('#experiment').innerHTML='<div class="error-box"><h3>实验图册暂时没打开</h3><p>请刷新页面再试一次。若仍无法打开，请稍后回来。</p><button class="button primary" onclick="location.reload()">重新载入</button></div>'}
}
init();
