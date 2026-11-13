// Small record-scoped client. Caches belong to one session/child epoch and are
// never stored in localStorage. A failed save retains its exact retry token.
const copy=value=>JSON.parse(JSON.stringify(value));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const token=()=>crypto.randomUUID();
export class ProgressContextError extends Error{constructor(){super('档案已切换，请重新读取。');this.code='STALE_PROGRESS_CONTEXT'}}
export function createProgressClient({api,childId,isCurrent}){
 const base='/api/children/'+encodeURIComponent(childId)+'/progress';
 const records=new Map(),summaries=new Map(),pending=new Map();let navigation=null,navigationETag=null,navPending=null;
 const guard=()=>{if(!isCurrent())throw new ProgressContextError()};
 const call=async(path,options)=>{guard();const result=await api(path,options);guard();return result};
 const recordPath=key=>base+'/records/'+encodeURIComponent(key);
 async function load(){
  let attempts=0;for(;;){try{const collected=new Map();let cursor=null,snapshot,first;do{const page=await call(base+(cursor?'?after='+encodeURIComponent(cursor)+'&snapshot='+snapshot:''));first??=page;snapshot=page.snapshot;for(const item of page.items)collected.set(item.key,item);cursor=page.nextCursor}while(cursor);
   if(first.storageVersion!==2&&!first.readOnly){await call(base+'/activate',{method:'POST',body:{legacyRevision:first.legacyRevision}});continue}
   summaries.clear();for(const[key,item]of collected)summaries.set(key,item);navigation=copy(first.navigation);navigationETag=first.navigationETag;return {...first,items:[...summaries.values()]};
  }catch(error){if(['SUMMARY_CHANGED','LEGACY_REVISION_CONFLICT'].includes(error.code)&&++attempts<3)continue;throw error}}
 }
 async function getRecord(key,{fresh=false}={}){guard();if(!fresh&&records.has(key))return copy(records.get(key));const r=await call(recordPath(key));records.set(key,copy(r));return copy(r)}
 async function commit(key,item,importing=false){
  const result=await call(recordPath(key)+(importing?'/import':''),{method:importing?'POST':'PUT',headers:{'If-Match':item.etag,'Idempotency-Key':item.id},body:item.body});
  if(result.superseded)throw Object.assign(new Error('先前保存已被另一页面更新。请导出当前草稿后重新读取。'),{code:'RECORD_CONFLICT',status:409});
  const cached=records.get(key);if(cached){cached.revision=result.revision;cached.etag=result.etag;cached.record=copy(item.body.record);cached.exists=true}
  summaries.set(key,result.summary);pending.delete(key);return result;
 }
 async function saveRecord(key,record){
  guard();let previous=pending.get(key),result;if(previous)result=await commit(key,previous,previous.importing);const cached=records.get(key);if(!cached)throw new Error('请先读取这一项的记录。');
  if(result&&equal(previous.body.record,record))return result;
  if(!result&&equal(cached.record,record))return {key,revision:cached.revision,etag:cached.etag,summary:summaries.get(key),unchanged:true};
  const item={id:token(),etag:cached.etag,body:{record:copy(record)}};pending.set(key,item);return commit(key,item);
 }
 async function saveNavigation(value){
  guard();let result;if(navPending){result=await call(base+'/navigation',{method:'PUT',headers:{'If-Match':navPending.etag,'Idempotency-Key':navPending.id},body:navPending.body});navigation=copy(result.navigation);navigationETag=result.navigationETag;navPending=null}
  if(equal(value,navigation))return result||{navigation,navigationETag,unchanged:true};const item={id:token(),etag:navigationETag,body:copy(value)};navPending=item;result=await call(base+'/navigation',{method:'PUT',headers:{'If-Match':item.etag,'Idempotency-Key':item.id},body:item.body});navigation=copy(result.navigation);navigationETag=result.navigationETag;navPending=null;return result;
 }
 async function importRecord(key,record,{confirmed=false,schema}={}){
  if(confirmed!==true)throw new Error('请确认记录属于当前孩子后再导入。');guard();if(pending.has(key)){const old=pending.get(key);const result=await commit(key,old,true);if(equal(old.body.record,record))return result}
  const cached=await getRecord(key,{fresh:true}),item={id:token(),etag:cached.etag,importing:true,body:{record:copy(record),confirmed:true,...(schema?{schema:copy(schema)}:{})}};pending.set(key,item);const result=await commit(key,item,true);records.delete(key);return result;
 }
 async function history(key,{after,through,snapshot}={}){const q=new URLSearchParams();if(after!==undefined&&after!==null)q.set('after',String(after));if(through!==undefined)q.set('through',String(through));if(snapshot!==undefined)q.set('snapshot',String(snapshot));return call(recordPath(key)+'/history'+(q.size?'?'+q:''))}
 return {load,getRecord,saveRecord,saveNavigation,importRecord,history,peek:key=>records.has(key)?copy(records.get(key)):null,summaries:()=>[...summaries.values()].map(copy),pending:()=>[...pending].map(([key,item])=>({key,...copy(item)})),navigation:()=>copy(navigation)};
}
export const MAX_ACCOUNT_EXPORT_BYTES=16*1024*1024;
const exportBytes=value=>new TextEncoder().encode(JSON.stringify(value)).byteLength;
const exportPagePath=(child,after,through)=>{const query=new URLSearchParams();if(after!==null)query.set('after',String(after));if(through!==undefined)query.set('through',String(through));if(child.exportContext)query.set('context',child.exportContext);return child.exportPath+(query.size?'?'+query:'')};
export async function exportProgressAccount({api,isCurrent=()=>true,maxBytes=MAX_ACCOUNT_EXPORT_BYTES}){
 if(!Number.isInteger(maxBytes)||maxBytes<1||maxBytes>MAX_ACCOUNT_EXPORT_BYTES)throw new Error('导出大小上限无效。');
 const guard=()=>{if(!isCurrent())throw new ProgressContextError()},read=async path=>{guard();const r=await api(path);guard();return r};
 const manifest=await read('/api/account/export?format=2'),children=[];let bytes=exportBytes(manifest);
 for(const child of manifest.children){let after=null,through=child.through,first,items=[];do{const page=await read(exportPagePath(child,after,through));bytes+=exportBytes(page);if(bytes>maxBytes)throw Object.assign(new Error('家庭记录较大，请使用分卷导出；每卷都会保留原标签和版本。'),{code:'EXPORT_TOO_LARGE'});first??=page;through=page.through;items.push(...page.items);after=page.nextCursor}while(after!==null);children.push({...child,legacyStateJSON:first.legacyStateJSON,navigation:first.navigation,navigationRevision:first.navigationRevision,through,progressRevisions:items});}
 guard();return {...manifest,children,complete:true,notice:'含所有儿童档案（包括已归档）、原始旧记录和各方案最新记录；不保留被覆盖的自动保存草稿。'};
}
// A part keeps only bounded pages in memory. Failed reads preserve the current
// buffer/cursor for retry; yielded parts must all be retained as one backup set.
export function createProgressExportParts({api,isCurrent=()=>true,targetBytes=8*1024*1024}){
 if(!Number.isInteger(targetBytes)||targetBytes<1||targetBytes>8*1024*1024)throw new Error('分卷大小上限无效。');
 const exportId=token();let manifest=null,childIndex=0,after=null,through,part=0,pages=[],bytes=0,done=false,busy=false,previousPartSha256=null;
 const guard=()=>{if(!isCurrent())throw new ProgressContextError()},read=async path=>{guard();const value=await api(path);guard();return value};
 async function next({acknowledgedPart=0}={}){guard();if(acknowledgedPart!==part)throw new Error('请先确认保存上一卷，再继续导出。');if(busy)throw new Error('正在读取上一卷，请稍候。');if(done)return null;busy=true;
  try{manifest??=await read('/api/account/export?format=2');while(childIndex<manifest.children.length&&bytes<targetBytes){const child=manifest.children[childIndex];through??=child.through;const fromCursor=after,page=await read(exportPagePath(child,after,through));pages.push({childId:child.id,fromCursor,...page});bytes+=exportBytes(page);through=page.through;after=page.nextCursor;if(after===null){childIndex++;through=undefined}}
   guard();const complete=childIndex===manifest.children.length,value={exportVersion:3,exportId,part:part+1,complete,previousPartSha256,continuation:{childIndex,after,through:through??null},manifest,pages,notice:'分卷备份必须保留相同 exportId 的第1卷至 complete=true 的最后一卷；单独一卷不代表全部记录。'};const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));guard();value.partSha256=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');part=value.part;done=complete;previousPartSha256=value.partSha256;pages=[];bytes=0;return value;
  }finally{busy=false}
 }
 return {next};
}
export function legacyImportRecords(state){
 if(state?.exportVersion||state?.exportId||state?.partSha256)throw new Error('家庭备份或分卷文件不能当作旧浏览器记录导入；须先核对完整文件集、编号与校验值。');
 const records=new Map(),valid=key=>/^([1-9]\d{0,2}):(4-6|7-9|10-12|13-16)$/.test(key)&&Number(key.split(':')[0])<=365;
 for(const kind of ['records','steps','viewedSteps','completed','legacyRecords'])for(const[key,value]of Object.entries(state[kind]||{})){if(!valid(key))throw new Error('旧记录中的活动或年龄编号无效。');const full=key+':v0',record=records.get(full)||{records:{},step:0,viewedSteps:0,completed:false};record[kind==='steps'?'step':kind==='legacyRecords'?'legacyRecord':kind]=copy(value);records.set(full,record)}
 for(const[key,value]of Object.entries(state.protocolProgress||{}))records.set(key,copy(value));return [...records].map(([key,record])=>({key,record}));
}
