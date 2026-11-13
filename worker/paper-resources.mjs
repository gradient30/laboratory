import paperIndex from './paper-index.json' with {type:'json'};
export {paperIndex};
const MAX_ASSET_BYTES=4*1024*1024,MAX_MANIFEST_BYTES=256*1024;
const hex=bytes=>Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
async function verifiedBytes(env,origin,entry,limit){
 const response=await env.ASSETS.fetch(new Request(new URL(entry.path,origin),{method:'GET'}));
 if(response.status!==200||Number(response.headers.get('Content-Length')||0)>limit||entry.bytes>limit)throw Error('Paper unavailable');
 const reader=response.body?.getReader();if(!reader)throw Error('Paper unavailable');
 const chunks=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit||size>entry.bytes){await reader.cancel();throw Error('Paper exceeds budget');}chunks.push(value);}
 if(size!==entry.bytes)throw Error('Paper size mismatch');
 const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.byteLength;}
 if(hex(await crypto.subtle.digest('SHA-256',bytes))!==entry.sha256)throw Error('Paper hash mismatch');return bytes;
}
export async function readPaperManifest(env,origin,day,age){
 const entry=paperIndex.bindings[`${day}:${age}`];if(!entry)return null;
 const manifest=JSON.parse(new TextDecoder().decode(await verifiedBytes(env,origin,entry,MAX_MANIFEST_BYTES)));
 if(manifest.day!==day||manifest.age!==age||manifest.version!==entry.version)throw Error('Paper binding mismatch');return manifest;
}
export async function readPaperAsset(env,origin,page){
 if(!/^[a-f0-9]{64}\.(svg|pdf)$/.test(page.id))throw Error('Invalid paper identifier');
 return verifiedBytes(env,origin,{path:'/_protected/papers/'+page.id,sha256:page.id.slice(0,64),bytes:page.bytes},MAX_ASSET_BYTES);
}
export function paperResponse(bytes,page,{head=false,download=false}={}){
 return new Response(head?null:bytes,{headers:{'Content-Type':page.type,'Content-Length':String(page.bytes),'Content-Disposition':`${download?'attachment':'inline'}; filename="${page.filename}"`,'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; sandbox; frame-ancestors 'self'"}});
}
