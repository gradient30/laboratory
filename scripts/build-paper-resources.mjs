import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
export const paperLimits=Object.freeze({asset:4*1024*1024,manifest:256*1024,pages:160});
export const stable=value=>JSON.stringify(value&&typeof value==='object'?Array.isArray(value)?value.map(v=>JSON.parse(stable(v))):Object.fromEntries(Object.keys(value).sort().map(k=>[k,JSON.parse(stable(value[k]))])):value);
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const safeName=/^[a-f0-9]{64}\.(svg|pdf)$/;
function regularFile(root,relative){
 if(typeof relative!=='string'||relative.startsWith('/')||relative.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Unsafe paper source path');
 let current=path.resolve(root);if(fs.lstatSync(current).isSymbolicLink())throw Error('Paper root symlink');
 for(const part of relative.split('/')){current=path.join(current,part);if(fs.lstatSync(current).isSymbolicLink())throw Error('Paper symlink');}
 if(!fs.statSync(current).isFile())throw Error('Paper source is not a regular file');return fs.readFileSync(current);
}
export function paperArtifacts(root,data){
 const files=new Map(),index={schemaVersion:1,bindings:{}},excluded=[];
 const input=path.join(root,'paper-resources/catalog.json');
 if(!fs.existsSync(input))throw Error('Missing required paper catalog');
 const source=JSON.parse(regularFile(root,'paper-resources/catalog.json'));
 if(source.schemaVersion!==1||!Array.isArray(source.bindings))throw Error('Invalid paper catalog');
 const seen=new Set();
 for(const b of source.bindings){
  if(!Number.isInteger(b.day)||b.day<1||b.day>365||!['4-6','7-9','10-12','13-16'].includes(b.age)||!/^[a-f0-9]{64}$/.test(b.protocolSha256))throw Error('Invalid paper binding');
  const key=`${b.day}:${b.age}`;const protocol=data.experiments[b.day-1].ageProtocols?.[b.age];
  if(!protocol||digest(stable(protocol))!==b.protocolSha256){excluded.push({key,reason:'exact-protocol-mismatch',protocolSha256:b.protocolSha256});continue;}
  if(seen.has(key))throw Error('Duplicate paper binding '+key);seen.add(key);
  if(!['all','choose-one'].includes(b.printMode||'all')||!['complete','partial'].includes(b.coverage)||b.version!==protocol.version||!Array.isArray(b.pages)||!b.pages.length||b.pages.length>paperLimits.pages||typeof b.preparation!=='string'||b.preparation.length>20000||typeof b.printInstruction!=='string'||b.unprovided!==undefined&&(!Array.isArray(b.unprovided)||b.unprovided.length>30||b.unprovided.some(x=>typeof x.names!=='string'||typeof x.reason!=='string'||x.names.length>1000||x.reason.length>2000)))throw Error('Invalid paper metadata');
  const pageIds=new Set(),pages=[];
  for(const p of b.pages){
   if(!safeName.test(p.id)||pageIds.has(p.id)||typeof p.title!=='string'||p.title.length>300||!Number.isInteger(p.pageCount)||p.pageCount<1||p.pageCount>20||!Number.isInteger(p.copies)||p.copies<1||p.copies>20||(p.usage!==undefined&&(typeof p.usage!=='string'||p.usage.length>2000))||typeof p.shared!=='boolean'||p.optional!==undefined&&typeof p.optional!=='boolean')throw Error('Invalid/duplicate paper page');
   pageIds.add(p.id);const bytes=regularFile(root,'paper-resources/blobs/'+p.id),sha256=digest(bytes);
   if(p.id!==sha256+path.extname(p.id)||bytes.length!==p.bytes||bytes.length>paperLimits.asset)throw Error('Paper digest/size mismatch');
   if(p.id.endsWith('.svg')){
    const xml=bytes.toString('utf8');
    const allowedTags=new Set(['svg','g','rect','circle','ellipse','line','polyline','polygon','path','text','tspan','defs','marker','title','desc','clipPath']);
    if([...xml.matchAll(/<([A-Za-z][A-Za-z0-9:_-]*)\b/g)].some(m=>!allowedTags.has(m[1])))throw Error('Unexpected SVG element');
    if(!/^\s*<svg\b/.test(xml)||/<(?:script|foreignObject|iframe|object|embed|image|use|a)\b|\son[a-z]+\s*=|(?:href|src)\s*=|<!DOCTYPE|<!ENTITY|@import|url\s*\(/i.test(xml))throw Error('Active/external SVG content forbidden');
   }else if(bytes.subarray(0,5).toString()!=='%PDF-')throw Error('Invalid paper PDF');
   files.set('_protected/papers/'+p.id,bytes);
   pages.push({id:p.id,title:p.title,pageCount:p.pageCount,copies:p.copies,usage:p.usage||'',optional:p.optional||false,shared:p.shared,bytes:bytes.length,type:p.id.endsWith('.svg')?'image/svg+xml':'application/pdf',filename:`day${b.day}-${b.age}-${p.id.slice(0,12)}${path.extname(p.id)}`});
  }
  const manifest={schemaVersion:1,day:b.day,age:b.age,version:b.version,protocolSha256:b.protocolSha256,coverage:b.coverage,printMode:b.printMode||'all',printInstruction:b.printInstruction,preparation:b.preparation,unprovided:b.unprovided||[],pages};
  const bytes=Buffer.from(JSON.stringify(manifest)+'\n'),sha256=digest(bytes);if(bytes.length>paperLimits.manifest)throw Error('Paper manifest exceeds budget');
  const pathname=`_protected/papers/manifests/${sha256}.json`;files.set(pathname,bytes);index.bindings[key]={path:'/'+pathname,sha256,bytes:bytes.length,version:b.version};
 }
 return {files,index,excluded};
}
