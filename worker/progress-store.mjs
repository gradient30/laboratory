import {historicalRecordSchema} from './historical-record-schemas.mjs';
// Record-scoped storage in the existing D1 binding. Legacy JSON remains an immutable
// overlay after activation; only a record being edited is adopted. Retain the
// original baseline and latest body per protocol, never every autosave body.
export const PROGRESS_STORAGE_VERSION=2;
export const MAX_RECORD_BYTES=524288;
export const RETRY_RECEIPT_SECONDS=7*86400,MAX_RETRY_RECEIPTS=2048;
const MAX_SCHEMA_BYTES=16384,AGES=['4-6','7-9','10-12','13-16'];
const enc=new TextEncoder(),object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const json=v=>JSON.stringify(v),clone=v=>JSON.parse(json(v)),time=()=>Math.floor(Date.now()/1000);
export class ProgressError extends Error{constructor(status,code,message){super(message);Object.assign(this,{status,code})}}
const fail=(status,code,message)=>{throw new ProgressError(status,code,message)};
const sql=(env,s,...args)=>env.DB.prepare(s).bind(...args);
const first=(env,s,...args)=>sql(env,s,...args).first();
const all=async(env,s,...args)=>(await sql(env,s,...args).all()).results||[];
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const respond=(data,status=200,extra={})=>new Response(json({ok:true,...data}),{status,headers:{...headers,...extra}});
const hash=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(v))),b=>b.toString(16).padStart(2,'0')).join('');
function parseJSON(v,fallback={}){try{const parsed=JSON.parse(v);return object(parsed)?parsed:fallback}catch{return fallback}}
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const navigation=(v,c)=>({startDate:validDate(v?.startDate)?v.startDate:new Date(c.created_at*1000).toISOString().slice(0,10),day:Number.isInteger(v?.day)&&v.day>=1&&v.day<=365?v.day:1,age:AGES.includes(v?.age)?v.age:c.age_band});
export function parseRecordKey(key){const m=/^([1-9]\d{0,2}):(4-6|7-9|10-12|13-16):v(0|[1-9]\d{0,2})$/.exec(key);return m&&+m[1]<=365?{key,day:+m[1],age:m[2],version:+m[3]}:null}
const requireKey=key=>{const p=parseRecordKey(key);if(!p)fail(400,'INVALID_RECORD_KEY','活动、年龄或方案版本无效。');return p};
const sortKey=p=>`${String(p.day).padStart(3,'0')}:${AGES.indexOf(p.age)}:${String(p.version).padStart(3,'0')}`;
const etag=(key,revision)=>`"p2-${key}-${revision}"`;
const navETag=revision=>`"n2-${revision}"`;
const empty=()=>({records:{},step:0,viewedSteps:0,completed:false});
const noted=record=>Object.values(record.records||{}).some(x=>typeof x==='number'||typeof x==='string'&&!!x.trim())||(record.legacyRecord?.fields||[]).some(f=>!!f.value?.trim());
export function validateProgressRecord(v){
 if(!object(v)||Object.keys(v).some(k=>!['records','step','viewedSteps','completed','legacyRecord'].includes(k))||!object(v.records)||Object.keys(v.records).length>32||!Number.isInteger(v.step)||v.step<0||v.step>3||!Number.isInteger(v.viewedSteps)||v.viewedSteps<0||v.viewedSteps>15||typeof v.completed!=='boolean')fail(400,'INVALID_RECORD','单项记录格式无效。');
 const records={};for(const[k,x]of Object.entries(v.records)){if(k==='choice'){if(x!==null&&(!Number.isInteger(x)||x<0||x>2))fail(400,'INVALID_RECORD','观察选择无效。')}else if(!/^(spoken|feeling|mood|field\d{1,2})$/.test(k)||typeof x!=='string'||x.length>4000)fail(400,'INVALID_RECORD','记录字段无效或超过4000字符。');records[k]=x}
 const result={records,step:v.step,viewedSteps:v.viewedSteps,completed:v.completed};
 if(v.legacyRecord!==undefined){const l=v.legacyRecord;if(!object(l)||!Array.isArray(l.fields)||l.fields.length>32||!object(l.originalRecord||{}))fail(400,'INVALID_RECORD','旧版记录格式无效。');result.legacyRecord={fields:l.fields.map(f=>{if(!object(f)||typeof f.label!=='string'||f.label.length>120||typeof f.value!=='string'||f.value.length>4000)fail(400,'INVALID_RECORD','旧版字段无效。');return {label:f.label,value:f.value}}),originalRecord:validateProgressRecord({...empty(),records:l.originalRecord||{}}).records}}
 if(enc.encode(json(result)).length>MAX_RECORD_BYTES)fail(413,'RECORD_TOO_LARGE','单项记录已超过512 KiB，请先导出草稿并缩短本项内容。');return result;
}
// These lessons keep original records on paper. Preserve existing content
// verbatim on status updates, but never accept a new observation or archive.
export const isPaperOnlyRecordDay=day=>day===259||day===265;
export function assertPaperOnlyStatus(day,records,previous,archive,previousArchive){
 const fields=new Set([...Object.keys(records||{}),...Object.keys(previous||{})]);
 const value=(o,key)=>Object.hasOwn(o||{},key)?o[key]:undefined;
 const blank=x=>x===undefined||x===null||x==='';
 if([...fields].some(key=>{
  const next=value(records,key),old=value(previous,key);
  return next!==old&&!(blank(next)&&blank(old));
 })||archive!==previousArchive&&json(archive)!==json(previousArchive)){
  fail(400,day===259?'PAPER_INTERVIEW_STATUS_ONLY':'PAPER_OBSERVERS_STATUS_ONLY',
   `第${day}天的${day===259?'访谈':'双人观察清单'}只写在纸上。网页只保存完成状态，原记录不变。`);
 }
}
function validateSchema(v,p){
 if(!object(v)||!Array.isArray(v.fields)||v.fields.length>128)fail(400,'INVALID_SCHEMA','记录字段标签无效。');const seen=new Set();
 const fields=v.fields.map(f=>{if(!object(f)||!/^choice$|^(spoken|feeling|mood|field\d{1,2})$/.test(f.key)||seen.has(f.key)||typeof f.label!=='string'||!f.label.trim()||f.label.length>120)fail(400,'INVALID_SCHEMA','记录字段标签无效。');seen.add(f.key);return {key:f.key,label:f.label}});
 const result={protocolVersion:p.version,fields,source:typeof v.source==='string'?v.source.slice(0,120):'imported-labels'};if(enc.encode(json(result)).length>MAX_SCHEMA_BYTES)fail(413,'SCHEMA_TOO_LARGE','记录标签过长。');return result;
}
const commonLabels={spoken:'孩子原话',choice:'当时的感受选项（0：新发现；1：和猜想不同；2：想再试一次）',feeling:'当时的感受',mood:'当时的心情'};
const legacyLabels={'1:13-16':['跨度（厘米）','承重（枚）','失稳标准','误差与限制'],'2:13-16':['约圈数／秒','看不见的时间','判断标准','误差'],'3:13-16':['叶面积方案','控制与混杂因素','水滴的可能来源'],'5:13-16':['加入滴数','颜色变化','相对指示的限制'],'16:13-16':['材料','摩擦次数','距离与不确定性','带电／极化解释'],'20:13-16':['等质量壳分组','片数','反应快慢','速率与总量区别'],'23:13-16':['盐质量梯度','浮沉位置','密度范围','干扰因素'],'29:13-16':['独立样本配比','量化方案','施力控制','解释边界']};
async function schemaFor(ctx,p,record,legacy=false){
 const e=await ctx.readDay(p.day),current=ctx.protocolVersion(p.day,p.age)||0;
 const old=parseJSON(ctx.c.state_json),original=legacy&&p.version===0&&old.recordSchemaVersion!==3?legacyLabels[`${p.day}:${p.age}`]:null;
 const historical=p.version!==current?historicalRecordSchema(p):null;
 const labels=original||(p.version===0?e?.ageGuides?.[p.age]?.recordFields:p.version===current?e?.ageProtocols?.[p.age]?.guide?.recordFields:historical?.recordFields)||[];
 const keys=new Set([...(legacy&&p.day>access(ctx).unlockedThrough?[]:labels.map((_,i)=>`field${i}`)),...Object.keys(record.records||{})]);if(p.age==='4-6'){keys.add('spoken');keys.add('choice')}
 return validateSchema({fields:[...keys].map(key=>({key,label:commonLabels[key]||labels[Number(/^field(\d+)$/.exec(key)?.[1])]||`原字段 ${key}（该版本标签未保存）`})),source:original?'legacy-v2-labels':historical?'historical-curriculum-snapshot':labels.length?legacy?'legacy-snapshot':'curriculum-snapshot':'legacy-labels-unavailable'},p);
}
function legacyMap(c){
 const s=parseJSON(c.state_json),map=new Map();
 for(const kind of ['records','steps','viewedSteps','completed','legacyRecords'])for(const key of Object.keys(s[kind]||{})){const p=parseRecordKey(key+':v0');if(!p)continue;const r=map.get(p.key)||{...p,record:empty()};if(kind==='legacyRecords')r.record.legacyRecord=s[kind][key];else r.record[kind==='steps'?'step':kind]=s[kind][key];map.set(p.key,r)}
 for(const[key,record]of Object.entries(s.protocolProgress||{})){const p=parseRecordKey(key);if(p&&p.version>0)map.set(key,{...p,record})}
 return map;
}
function summary(p,record,revision=0,updatedAt=null){return {key:p.key,day:p.day,age:p.age,protocolVersion:p.version,revision,step:record.step||0,viewedSteps:record.viewedSteps||0,completed:record.completed===true,hasNotes:noted(record),updatedAt}}
const rowSummary=r=>({key:r.record_key,day:r.day,age:r.age,protocolVersion:r.protocol_version,revision:r.revision,step:r.step,viewedSteps:r.viewed_steps,completed:!!r.completed,completionEligible:!!r.completion_eligible,hasNotes:!!r.has_notes,updatedAt:r.updated_at});
const rowRecord=r=>({key:r.record_key,revision:r.revision,etag:etag(r.record_key,r.revision),record:JSON.parse(r.record_json),schema:JSON.parse(r.schema_json),source:r.source,createdAt:r.created_at,sequence:r.sequence,completionEligible:!!r.completion_eligible});
function access(ctx,c=ctx.c){const u=ctx.user,full=u.role==='admin'||!!u.unlock_all,through=full?365:Math.max(u.unlock_through,c.unlocked_through);return {unlockAll:full,unlockedThrough:through,unlockedIds:Array.from({length:through},(_,i)=>i+1),mode:ctx.settings.progressionMode}}
// Every read and mutation checks the same live account, exact session and access
// generation. Captured JavaScript authorization alone never authorizes SQL writes.
const liveGuard=(archived=false)=>`c.user_id=? ${archived?'':'AND c.archived_at IS NULL'} AND EXISTS(SELECT 1 FROM users u JOIN sessions s ON s.user_id=u.id WHERE u.id=c.user_id AND u.status='active' AND u.access_version=? AND u.auth_version=? AND s.token_hash=? AND s.auth_version=u.auth_version AND s.expires_at>CAST(strftime('%s','now') AS INTEGER)) AND (CASE WHEN COALESCE(NULLIF((SELECT value FROM settings WHERE key='progressionMode'),''),?)='manual' THEN 'manual' ELSE 'sequential' END)=?`;
const guardArgs=ctx=>[ctx.user.id,ctx.user.access_version,ctx.user.auth_version,ctx.user.token_hash,ctx.env.PROGRESSION_MODE||'',ctx.settings.progressionMode];
async function readChild(ctx,archived=false){const c=await first(ctx.env,`SELECT c.* FROM children c WHERE c.id=? AND ${liveGuard(archived)}`,ctx.childId,...guardArgs(ctx));if(!c)fail(409,'PROGRESS_CONTEXT_CHANGED','儿童档案、登录或账号权限已更新，请重新加载。');return c}
async function body(req,max=MAX_RECORD_BYTES+MAX_SCHEMA_BYTES+4096){
 if(Number(req.headers.get('Content-Length')||0)>max)fail(413,'RECORD_TOO_LARGE','单次提交内容过大。');const reader=req.body?.getReader(),chunks=[];let n=0;if(reader)for(;;){const r=await reader.read();if(r.done)break;n+=r.value.byteLength;if(n>max){await reader.cancel();fail(413,'RECORD_TOO_LARGE','单次提交内容过大。')}chunks.push(r.value)}const bytes=new Uint8Array(n);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length}let b;try{b=JSON.parse(new TextDecoder().decode(bytes))}catch{fail(400,'INVALID_JSON','请求格式无效。')}if(!object(b))fail(400,'INVALID_JSON','请求必须是对象。');return b;
}
const requireActive=ctx=>{if(ctx.c.progress_storage_version!==2)fail(409,'PROGRESS_ACTIVATION_REQUIRED','请先重新读取并启用逐项记录。')};
const requestId=req=>{const id=req.headers.get('Idempotency-Key');if(typeof id!=='string'||!/^[A-Za-z0-9_-]{16,80}$/.test(id))fail(400,'IDEMPOTENCY_REQUIRED','保存标识无效，请刷新后重试。');return id};
function expected(req,p){const value=req.headers.get('If-Match'),match=new RegExp('^"p2-'+p.key+'-(0|[1-9]\\d{0,8})"$').exec(value||'');if(!match)fail(428,'RECORD_PRECONDITION_REQUIRED','请先读取这一项的最新记录再保存。');return +match[1]}
function capacity(error){if(error instanceof ProgressError)throw error;if(/quota|SQLITE_FULL|database or disk is full|storage.*limit/i.test(String(error?.message)))fail(507,'STORAGE_CAPACITY','云端存储暂时已满。修改尚未保存，请导出草稿并联系管理员；不会自动购买或升级。');fail(503,'PROGRESS_UNAVAILABLE','单项记录暂时无法保存，请保留草稿后重试。')}
async function batch(ctx,statements){try{return await ctx.env.DB.batch(statements)}catch(error){capacity(error)}}
async function readRecord(ctx,p){
 const row=await first(ctx.env,'SELECT r.* FROM progress_heads h JOIN progress_revisions r ON r.sequence=h.sequence WHERE h.child_id=? AND h.record_key=?',ctx.childId,p.key);
 if(row)return {...rowRecord(row),exists:true};const l=legacyMap(ctx.c).get(p.key),record=l?clone(l.record):empty();if(!l&&p.day>access(ctx).unlockedThrough)return {key:p.key,revision:0,etag:etag(p.key,0),record,schema:{protocolVersion:p.version,fields:[],source:'empty-locked'},source:'empty',createdAt:null,exists:false};return {key:p.key,revision:0,etag:etag(p.key,0),record,schema:await schemaFor(ctx,p,record,!!l),source:l?'legacy':'empty',createdAt:null,exists:!!l};
}
async function activation(ctx){
 const b=await body(ctx.req,4096);if(!Number.isInteger(b.legacyRevision)||b.legacyRevision<0)fail(400,'INVALID_REVISION','档案版本无效。');
 if(ctx.c.progress_storage_version===1){const nav=navigation(parseJSON(ctx.c.state_json),ctx.c);const rows=await batch(ctx,[sql(ctx.env,`UPDATE children AS c SET progress_storage_version=2,progress_navigation_json=?,updated_at=? WHERE c.id=? AND c.progress_storage_version=1 AND c.revision=? AND ${liveGuard()} RETURNING id`,json(nav),time(),ctx.childId,b.legacyRevision,...guardArgs(ctx))]);if(!rows[0]?.results?.length){ctx.c=await readChild(ctx);if(ctx.c.progress_storage_version!==2)fail(409,'LEGACY_REVISION_CONFLICT','旧版进度已更新，请重新加载后启用逐项记录。')}}
 ctx.c=await readChild(ctx);return respond({storageVersion:2,navigation:navigation(parseJSON(ctx.c.progress_navigation_json),ctx.c),navigationRevision:ctx.c.progress_navigation_revision,navigationETag:navETag(ctx.c.progress_navigation_revision),access:access(ctx)});
}
async function summaries(ctx){
 const limit=bounded(ctx.url.searchParams.get('limit'),100,200),after=ctx.url.searchParams.get('after')||'',snapshot=ctx.url.searchParams.get('snapshot');
 if(after&&!/^\d{3}:[0-3]:\d{3}$/.test(after))fail(400,'INVALID_CURSOR','分页位置无效。');if(snapshot!==null&&snapshot!==String(ctx.c.progress_summary_revision))fail(409,'SUMMARY_CHANGED','记录在读取期间有更新，请重新读取摘要。');
 // Fetch only a bounded head page. Legacy has the original old-client row cap and
 // is overlaid by the heads; note bodies are never returned in the summary API.
 const order="printf('%03d',day)||':'||CASE age WHEN '4-6' THEN '0' WHEN '7-9' THEN '1' WHEN '10-12' THEN '2' ELSE '3' END||':'||printf('%03d',protocol_version)";
 const rows=await all(ctx.env,`SELECT *,${order} AS sort_key FROM progress_heads WHERE child_id=? AND ${order}>? ORDER BY sort_key LIMIT ?`,ctx.childId,after,limit+1);
 const items=new Map([...legacyMap(ctx.c)].filter(([,r])=>sortKey(r)>after).map(([key,r])=>[key,{...summary(r,r.record),sortKey:sortKey(r)}]));
 for(const row of rows)items.set(row.record_key,{...rowSummary(row),sortKey:row.sort_key});
 const sorted=[...items.values()].sort((a,b)=>a.sortKey.localeCompare(b.sortKey)),page=sorted.slice(0,limit),last=page.at(-1)?.sortKey||null;
 // The head page may end before remaining legacy entries; its boundary is safe
 // because those first limit+1 heads are included in the merged ordering.
 const fresh=await readChild(ctx);if(fresh.progress_summary_revision!==ctx.c.progress_summary_revision||fresh.revision!==ctx.c.revision||fresh.progress_storage_version!==ctx.c.progress_storage_version)fail(409,'SUMMARY_CHANGED','记录在读取期间有更新，请重新读取摘要。');
 const nav=navigation(parseJSON(ctx.c.progress_storage_version===2?ctx.c.progress_navigation_json:ctx.c.state_json),ctx.c);
 return respond({readOnly:ctx.env.PROGRESS_READ_ONLY==='true',storageVersion:ctx.c.progress_storage_version,legacyRevision:ctx.c.revision,navigation:nav,navigationRevision:ctx.c.progress_navigation_revision,navigationETag:navETag(ctx.c.progress_navigation_revision),snapshot:ctx.c.progress_summary_revision,items:page.map(({sortKey,...v})=>v),nextCursor:sorted.length>limit?last:null,access:access(ctx)});
}
function bounded(raw,fallback,max){if(raw===null||raw==='')return fallback;const n=Number(raw);if(!Number.isSafeInteger(n)||n<1||n>max)fail(400,'INVALID_PAGE_SIZE','分页数量无效。');return n}
function unsigned(raw,fallback=0){if(raw===null)return fallback;if(!/^(0|[1-9]\d{0,15})$/.test(raw)||!Number.isSafeInteger(Number(raw)))fail(400,'INVALID_CURSOR','分页位置无效。');return Number(raw)}
async function history(ctx,p){
 const snapshot=ctx.url.searchParams.get('snapshot');if(snapshot!==null&&snapshot!==String(ctx.c.progress_summary_revision))fail(409,'HISTORY_CHANGED','保留记录已更新，请重新读取。');const limit=bounded(ctx.url.searchParams.get('limit'),4,4),after=unsigned(ctx.url.searchParams.get('after'),-1),head=await readRecord(ctx,p),through=unsigned(ctx.url.searchParams.get('through'),head.revision);
 if(through>head.revision)fail(400,'INVALID_CURSOR','历史版本位置无效。');if(after>=0&&snapshot===null)fail(428,'HISTORY_CONTEXT_REQUIRED','继续读取需要起始版本。');const rows=await all(ctx.env,'SELECT * FROM progress_revisions WHERE child_id=? AND record_key=? AND revision>? AND revision<=? ORDER BY revision LIMIT ?',ctx.childId,p.key,after,through,limit+1);let items=rows.map(rowRecord);
 if(after<0&&head.exists&&legacyMap(ctx.c).has(p.key)&&!items.some(r=>r.revision===0)){const l=legacyMap(ctx.c).get(p.key);items.unshift({key:p.key,revision:0,etag:etag(p.key,0),record:clone(l.record),schema:await schemaFor(ctx,p,l.record,true),source:'legacy',createdAt:null})}
 const fresh=await readChild(ctx);if(fresh.progress_summary_revision!==ctx.c.progress_summary_revision)fail(409,'HISTORY_CHANGED','保留记录已更新，请重新读取。');const more=items.length>limit;items=items.slice(0,limit);return respond({storageVersion:2,key:p.key,snapshot:ctx.c.progress_summary_revision,through,items,nextCursor:more?items.at(-1).revision:null});
}
function insertRevision(ctx,p,record,schema,revision,id,digest,source,eligible,condition,args){return sql(ctx.env,`INSERT INTO progress_revisions(child_id,record_key,day,age,protocol_version,revision,request_id,request_hash,record_json,schema_json,step,viewed_steps,completed,completion_eligible,has_notes,source,created_at) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE ${condition} RETURNING *`,ctx.childId,p.key,p.day,p.age,p.version,revision,id,digest,json(record),json(schema),record.step,record.viewedSteps,record.completed?1:0,eligible?1:0,noted(record)?1:0,source,time(),...args)}
function completionRows(ctx){const rows=[];for(let day=1;day<=access(ctx).unlockedThrough;day++)for(const age of AGES){const version=ctx.protocolVersion(day,age)||0,key=`${day}:${age}:v${version}`;rows.push(`(${day},'${key}')`)}return rows.join(',')}
function mergeRecord(incoming,old){
 const result=clone(old);for(const[field,value]of Object.entries(incoming.records)){const prev=result.records[field];if(prev!==undefined&&prev!==''&&prev!==null&&value!==''&&value!==null&&json(prev)!==json(value))fail(409,'IMPORT_CONFLICT','该项记录已有不同内容，请先分别导出核对。');if(prev===undefined||prev===''||prev===null)result.records[field]=value}
 result.step=Math.max(old.step,incoming.step);result.viewedSteps=old.viewedSteps|incoming.viewedSteps;result.completed=old.completed||incoming.completed;if(incoming.legacyRecord){if(old.legacyRecord&&json(old.legacyRecord)!==json(incoming.legacyRecord))fail(409,'IMPORT_CONFLICT','旧版归档不同，请先分别导出核对。');result.legacyRecord=incoming.legacyRecord}return validateProgressRecord(result);
}
async function saveRecord(ctx,p,importing=false){
 requireActive(ctx);const b=await body(ctx.req),id=requestId(ctx.req),expectedRevision=expected(ctx.req,p);if(importing&&b.confirmed!==true)fail(400,'IMPORT_CONFIRMATION_REQUIRED','请选择儿童档案并明确确认导入。');
 const requestHash=await hash(json([p.key,expectedRevision,importing,b]));const prior=await first(ctx.env,'SELECT * FROM progress_save_receipts WHERE child_id=? AND request_id=?',ctx.childId,id);
 if(prior){if(prior.request_hash!==requestHash)fail(409,'IDEMPOTENCY_CONFLICT','保存标识已用于不同内容，请保留草稿并重新读取。');if(prior.created_at<time()-RETRY_RECEIPT_SECONDS)fail(409,'RETRY_WINDOW_EXPIRED','这次保存的重试凭据已过期，请先导出草稿再重新读取。');ctx.c=await readChild(ctx);const current=await first(ctx.env,'SELECT revision FROM progress_heads WHERE child_id=? AND record_key=?',ctx.childId,p.key);await readChild(ctx);return respond({storageVersion:2,key:p.key,currentRevision:current?.revision,superseded:current?.revision!==prior.applied_revision,revision:prior.applied_revision,etag:etag(p.key,prior.applied_revision),summary:JSON.parse(prior.summary_json),replayed:true,access:access(ctx)})}
 const oldRequest=await first(ctx.env,'SELECT request_hash FROM progress_revisions WHERE child_id=? AND request_id=?',ctx.childId,id);if(oldRequest)fail(409,oldRequest.request_hash===requestHash?'RETRY_WINDOW_EXPIRED':'IDEMPOTENCY_CONFLICT','这次保存的重试凭据不可用，请先导出草稿再重新读取。');
 if(p.day>access(ctx).unlockedThrough)fail(403,'ACTIVITY_LOCKED','此活动尚未解锁，不能保存或导入进度。');if(!importing&&p.version!==(ctx.protocolVersion(p.day,p.age)||0))fail(409,'PROTOCOL_UPDATED','此方案已更新，原记录仍保留；请刷新后使用当前方案。');
 const old=await readRecord(ctx,p);if(old.revision!==expectedRevision)fail(409,'RECORD_CONFLICT','这一项已在另一页面更新。请先导出待保存记录，再重新读取。');let record=validateProgressRecord(b.record);if(!importing&&json(record.legacyRecord)!==json(old.record.legacyRecord))fail(400,'LEGACY_READ_ONLY','旧版归档仅供查看，不能在新记录中删除或改写。');if(importing)record=mergeRecord(record,old.record);
 if(isPaperOnlyRecordDay(p.day))assertPaperOnlyStatus(p.day,record.records,old.record.records,record.legacyRecord,old.record.legacyRecord);
 const currentVersion=ctx.protocolVersion(p.day,p.age)||0;let schema=old.exists?old.schema:await schemaFor(ctx,p,record);if(importing&&b.schema){const supplied=validateSchema(b.schema,p);if((p.version===currentVersion||isPaperOnlyRecordDay(p.day))&&json(supplied.fields)!==json(schema.fields))fail(409,'IMPORT_SCHEMA_CONFLICT','当前方案的字段标签必须与已保存的课程版本一致。');if(old.exists&&json(supplied.fields)!==json(old.schema.fields))fail(409,'IMPORT_SCHEMA_CONFLICT','同一方案的原字段标签不同，请保留两份备份并核对。');if(p.version!==currentVersion&&!old.exists)schema={...supplied,source:'imported-historical-labels'};}
 const eligible=record.completed&&(old.completionEligible===true||(!importing&&!old.record.completed));
 const guard=`EXISTS(SELECT 1 FROM children c WHERE c.id=? AND c.progress_storage_version=2 AND ${liveGuard()})`,guardValues=[ctx.childId,...guardArgs(ctx)],headCheck='COALESCE((SELECT revision FROM progress_heads WHERE child_id=? AND record_key=?),0)=?',ops=[];
 if(old.exists&&old.revision===0)ops.push(insertRevision(ctx,p,old.record,old.schema,0,null,null,'legacy',false,`${guard} AND NOT EXISTS(SELECT 1 FROM progress_revisions WHERE child_id=? AND record_key=? AND revision=0) AND ${headCheck}`,[...guardValues,ctx.childId,p.key,ctx.childId,p.key,0]));
 const savedIndex=ops.length;ops.push(insertRevision(ctx,p,record,schema,expectedRevision+1,id,requestHash,importing?'import':'edit',eligible,`${guard} AND ${headCheck} AND NOT EXISTS(SELECT 1 FROM progress_save_receipts WHERE child_id=? AND request_id=?)`,[...guardValues,ctx.childId,p.key,expectedRevision,ctx.childId,id]));
 const a=access(ctx);if(!importing&&ctx.settings.progressionMode==='sequential'&&!a.unlockAll&&a.unlockedThrough>0&&a.unlockedThrough<365&&p.day===a.unlockedThrough&&record.completed&&!old.record.completed){
  const rows=completionRows(ctx);ops.push(sql(ctx.env,`WITH current_records(day,record_key) AS (VALUES ${rows}) UPDATE children AS c SET unlocked_through=MAX(unlocked_through,?),updated_at=? WHERE c.id=? AND ${liveGuard()} AND EXISTS(SELECT 1 FROM progress_revisions WHERE child_id=c.id AND request_id=? AND request_hash=?) AND NOT EXISTS(SELECT k.day FROM current_records k LEFT JOIN progress_heads h ON h.child_id=c.id AND h.record_key=k.record_key GROUP BY k.day HAVING MAX(CASE WHEN h.completed=1 AND h.completion_eligible=1 THEN 1 ELSE 0 END)=0)`,a.unlockedThrough+1,time(),ctx.childId,...guardArgs(ctx),id,requestHash));
 }
 // Receipt and body replacement are in the same D1 transaction as CAS/head and
 // unlock. Receipts contain no observation text, and expire by time/count.
 const receiptSummary={...summary(p,record,expectedRevision+1,time()),completionEligible:eligible},savedGuard=`${guard} AND EXISTS(SELECT 1 FROM progress_revisions r JOIN progress_heads h ON h.sequence=r.sequence WHERE r.child_id=? AND r.record_key=? AND r.request_id=? AND r.request_hash=? AND r.revision=?)`,savedGuardValues=[...guardValues,ctx.childId,p.key,id,requestHash,expectedRevision+1];
 ops.push(sql(ctx.env,`INSERT INTO progress_save_receipts(child_id,request_id,request_hash,record_key,applied_revision,summary_json,created_at) SELECT child_id,request_id,request_hash,record_key,revision,?,created_at FROM progress_revisions WHERE child_id=? AND request_id=? AND request_hash=? AND ${savedGuard} ON CONFLICT(child_id,request_id) DO NOTHING`,json(receiptSummary),ctx.childId,id,requestHash,...savedGuardValues));
 ops.push(sql(ctx.env,`DELETE FROM progress_revisions WHERE child_id=? AND record_key=? AND revision>0 AND sequence!=(SELECT sequence FROM progress_heads WHERE child_id=? AND record_key=?) AND ${savedGuard}`,ctx.childId,p.key,ctx.childId,p.key,...savedGuardValues));
 ops.push(sql(ctx.env,`DELETE FROM progress_save_receipts WHERE child_id=? AND (created_at<? OR rowid NOT IN(SELECT rowid FROM progress_save_receipts WHERE child_id=? ORDER BY created_at DESC,rowid DESC LIMIT ?)) AND ${savedGuard}`,ctx.childId,time()-RETRY_RECEIPT_SECONDS,ctx.childId,MAX_RETRY_RECEIPTS,...savedGuardValues));
 const results=await batch(ctx,ops),saved=results[savedIndex]?.results?.[0];ctx.c=await readChild(ctx);
 if(!saved){const duplicate=await first(ctx.env,'SELECT * FROM progress_save_receipts WHERE child_id=? AND request_id=? AND created_at>=?',ctx.childId,id,time()-RETRY_RECEIPT_SECONDS);if(duplicate?.request_hash===requestHash){const current=await first(ctx.env,'SELECT revision FROM progress_heads WHERE child_id=? AND record_key=?',ctx.childId,p.key);await readChild(ctx);return respond({storageVersion:2,key:p.key,currentRevision:current?.revision,superseded:current?.revision!==duplicate.applied_revision,revision:duplicate.applied_revision,etag:etag(p.key,duplicate.applied_revision),summary:JSON.parse(duplicate.summary_json),replayed:true,access:access(ctx)})}fail(409,'RECORD_CONFLICT','记录或权限已更新。请先导出待保存记录，再重新读取。')}
 return respond({storageVersion:2,key:p.key,revision:saved.revision,etag:etag(p.key,saved.revision),summary:rowSummary({...saved,updated_at:saved.created_at}),access:access(ctx)},200,{ETag:etag(p.key,saved.revision)});
}
async function saveNavigation(ctx){
 requireActive(ctx);const b=await body(ctx.req,4096),id=requestId(ctx.req),match=/^"n2-(0|[1-9]\d{0,8})"$/.exec(ctx.req.headers.get('If-Match')||'');if(!match)fail(428,'NAVIGATION_PRECONDITION_REQUIRED','请先重新读取档案位置。');
 if(!validDate(b.startDate)||!Number.isInteger(b.day)||b.day<1||b.day>365||!AGES.includes(b.age))fail(400,'INVALID_NAVIGATION','档案日期或位置无效。');const nav=navigation(b,ctx.c),digest=await hash(json([+match[1],nav]));
 if(ctx.c.progress_navigation_request===id){if(ctx.c.progress_navigation_hash!==digest)fail(409,'IDEMPOTENCY_CONFLICT','保存标识已被使用。');await readChild(ctx);return respond({navigation:nav,navigationRevision:ctx.c.progress_navigation_revision,navigationETag:navETag(ctx.c.progress_navigation_revision),replayed:true})}
 const result=await batch(ctx,[sql(ctx.env,`UPDATE children AS c SET progress_navigation_json=?,progress_navigation_revision=progress_navigation_revision+1,progress_navigation_request=?,progress_navigation_hash=? WHERE c.id=? AND c.progress_storage_version=2 AND c.progress_navigation_revision=? AND ${liveGuard()} RETURNING progress_navigation_revision`,json(nav),id,digest,ctx.childId,+match[1],...guardArgs(ctx))]);if(!result[0]?.results?.length)fail(409,'NAVIGATION_CONFLICT','档案位置已在其他页面更新，请重新读取。');const revision=result[0].results[0].progress_navigation_revision;await readChild(ctx);return respond({navigation:nav,navigationRevision:revision,navigationETag:navETag(revision)});
}
export const progressExportContext=(u,s,c)=>[u.access_version,u.auth_version,s.progressionMode,c.revision,c.progress_storage_version,c.progress_summary_revision,c.age_band,c.archived_at??'active'].join(':');
async function exportPage(ctx){
 const expectedContext=ctx.url.searchParams.get('context'),context=progressExportContext(ctx.user,ctx.settings,ctx.c);if(expectedContext!==null&&expectedContext!==context)fail(409,'EXPORT_CONTEXT_CHANGED','账号权限或儿童档案已变化，请重新开始导出。');
 const limit=bounded(ctx.url.searchParams.get('limit'),4,4),after=unsigned(ctx.url.searchParams.get('after')),max=await first(ctx.env,'SELECT COALESCE(MAX(sequence),0) n FROM progress_revisions WHERE child_id=?',ctx.childId),through=unsigned(ctx.url.searchParams.get('through'),max.n);if(through>max.n)fail(400,'INVALID_CURSOR','导出位置无效。');if(after>0&&expectedContext===null)fail(428,'EXPORT_CONTEXT_REQUIRED','继续导出需要起始档案版本，请重新开始导出。');
 const rows=await all(ctx.env,'SELECT * FROM progress_revisions WHERE child_id=? AND sequence>? AND sequence<=? ORDER BY sequence LIMIT ?',ctx.childId,after,through,limit+1),more=rows.length>limit,items=rows.slice(0,limit).map(rowRecord);const fresh=await readChild(ctx,true);if(progressExportContext(ctx.user,ctx.settings,fresh)!==context)fail(409,'EXPORT_CONTEXT_CHANGED','儿童档案在导出期间更新，请重新开始导出。');
 return respond({exportVersion:2,storageVersion:ctx.c.progress_storage_version,childId:ctx.childId,context,through,items,nextCursor:more?items.at(-1).sequence:null,...(after===0?{legacyStateJSON:ctx.c.state_json,navigation:navigation(parseJSON(ctx.c.progress_storage_version===2?ctx.c.progress_navigation_json:ctx.c.state_json),ctx.c),navigationRevision:ctx.c.progress_navigation_revision}:{}),notice:'原始旧记录与逐项不可改写版本共同构成完整备份；请读取全部分页。'});
}
export async function routeProgress(req,env,{user,settings,protocolVersion,readDay}){
 const url=new URL(req.url),match=/^\/api\/children\/([a-f0-9]{32})\/progress(?:\/(activate|navigation|export|records)(?:\/([^/]+)(?:\/(history|import))?)?)?$/.exec(url.pathname);if(!match)return null;
 const dayReads=new Map(),ctx={req,env,user,settings,protocolVersion,readDay:day=>{if(!dayReads.has(day))dayReads.set(day,readDay(day));return dayReads.get(day)},childId:match[1],url};
 // Distinguish an unknown/other-family child from a live authorization race.
 const owned=await first(env,'SELECT id FROM children WHERE id=? AND user_id=?'+(match[2]==='export'?'':' AND archived_at IS NULL'),ctx.childId,user.id);if(!owned)fail(404,'NOT_FOUND','没有找到儿童档案。');ctx.c=await readChild(ctx,match[2]==='export');if(req.method!=='GET'&&env.PROGRESS_READ_ONLY==='true')fail(503,'PROGRESS_READ_ONLY','记录服务正在只读维护。原记录和完整导出仍可读取；请先导出本页未保存草稿，稍后重试。');
 if(!match[2]&&req.method==='GET')return summaries(ctx);
 if(match[2]==='activate'&&!match[3]&&req.method==='POST')return activation(ctx);
 if(match[2]==='navigation'&&!match[3]&&req.method==='PUT')return saveNavigation(ctx);
 if(match[2]==='export'&&!match[3]&&req.method==='GET')return exportPage(ctx);
 if(match[2]==='records'&&match[3]){let key;try{key=decodeURIComponent(match[3])}catch{fail(400,'INVALID_RECORD_KEY','记录编号无效。')}const p=requireKey(key);
  if(!match[4]&&req.method==='GET'){const record=await readRecord(ctx,p);await readChild(ctx);return respond({storageVersion:ctx.c.progress_storage_version,...record,readOnly:env.PROGRESS_READ_ONLY==='true'||p.day>access(ctx).unlockedThrough||p.version!==(protocolVersion(p.day,p.age)||0)},200,{ETag:record.etag})}
  if(match[4]==='history'&&req.method==='GET')return history(ctx,p);
  if(!match[4]&&req.method==='PUT')return saveRecord(ctx,p);
  if(match[4]==='import'&&req.method==='POST')return saveRecord(ctx,p,true);
 }
 fail(405,'METHOD_NOT_ALLOWED','不支持此记录操作。');
}
export const progressTesting={legacyMap,navigation,mergeRecord,sortKey,etag,liveGuard};
