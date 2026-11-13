import curriculumIndex from './curriculum-index.json' with {type:'json'};
export {curriculumIndex};
export const protocolVersion=(day,age)=>curriculumIndex.days[day-1]?.versions?.[age];
const MAX_DAY_BYTES=512*1024;
// Immutable deploy-time metadata only. Never store user/session/grant/response state here.
export async function readCurriculumDay(env,origin,day){
 const entry=curriculumIndex.days[day-1];if(!Number.isInteger(day)||!entry)throw Error('Invalid curriculum day');
 // No request path, query, headers or cookies are forwarded to the internal binding.
 const response=await env.ASSETS.fetch(new Request(new URL(entry.path,origin),{method:'GET'}));
 if(response.status!==200||Number(response.headers.get('Content-Length')||0)>MAX_DAY_BYTES)throw Error('Curriculum asset unavailable');
 const reader=response.body?.getReader();if(!reader)throw Error('Curriculum asset unavailable');
 const chunks=[];let length=0;
 for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>MAX_DAY_BYTES){await reader.cancel();throw Error('Curriculum asset exceeds budget');}chunks.push(value);}
 if(length!==entry.bytes)throw Error('Curriculum asset version mismatch');
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
 if(hash!==entry.sha256)throw Error('Curriculum asset version mismatch');
 const experiment=JSON.parse(new TextDecoder().decode(bytes));if(experiment.id!==day)throw Error('Curriculum asset day mismatch');
 return experiment;
}
