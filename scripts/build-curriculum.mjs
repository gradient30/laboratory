// Canonical authoring data stays in dist/data.json. Only bounded, hashed shards deploy.
import fs from 'node:fs';
import {paperArtifacts} from './build-paper-resources.mjs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const budgets=Object.freeze({catalog:128*1024,day:512*1024,asset:25*1024*1024,files:20000,worker:64*1024*1024});
export const publicFiles=['app.js','diagrams.js','index.html','progress-client.js','styles.css'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=value=>JSON.stringify(value)+'\n';
export function curriculumArtifacts(root='.'){
 const source=fs.readFileSync(path.join(root,'dist/data.json')),data=JSON.parse(source),revision=sha(source);
 if(!Array.isArray(data.experiments)||data.experiments.length!==365||data.experiments.some((e,i)=>e.id!==i+1))throw Error('Canonical curriculum must contain exactly 365 ordered days');
 const files=new Map(publicFiles.map(name=>[name,fs.readFileSync(path.join(root,'dist',name))]));
 const days=data.experiments.map(e=>{
  const name=`_protected/curriculum/${revision}/${e.id}.json`,bytes=Buffer.from(json(e));
  if(bytes.length>budgets.day)throw Error(`Day ${e.id} exceeds ${budgets.day}-byte application budget`);
  files.set(name,bytes);
  const summary=Object.fromEntries(['id','day','title','category','domain','contentKey','type'].filter(k=>Object.hasOwn(e,k)).map(k=>[k,e[k]]));
  summary.protocolVersions=Object.fromEntries(Object.entries(e.ageProtocols||{}).map(([age,p])=>[age,p.version]));
  return {summary,versions:Object.fromEntries(Object.entries(e.ageProtocols||{}).map(([age,p])=>[age,p.version])),path:'/'+name,sha256:sha(bytes),bytes:bytes.length};
 });
 const index={schemaVersion:1,revision,meta:data.meta,days};
 const catalog={ok:true,meta:data.meta,curriculumRevision:revision,accessVersion:'2147483647:365:13-16:sequential',experiments:days.map(d=>({...d.summary,locked:false})),access:{unlockAll:true,unlockedThrough:365,unlockedIds:Array.from({length:365},(_,i)=>i+1),mode:'sequential'}};
 if(Buffer.byteLength(json(catalog))>budgets.catalog)throw Error('Catalog exceeds application budget');
 // The original 370 remains the curriculum contract: 5 frontend assets + 365 shards.
 if(files.size!==370)throw Error('Unexpected curriculum asset count');
 const papers=paperArtifacts(root,data);for(const [name,bytes]of papers.files){if(files.has(name))throw Error('Paper asset collision');files.set(name,bytes);}
 if(files.size!==370+papers.files.size||files.size>budgets.files)throw Error('Unexpected total deployment asset count');
 for(const [name,bytes]of files)if(bytes.length>budgets.asset)throw Error('Cloudflare per-asset limit exceeded: '+name);
 const manifest={schemaVersion:1,sourceSha256:revision,budgets,catalogBytes:Buffer.byteLength(json(catalog)),assetCount:files.size,curriculumAssetCount:370,paperAssetCount:papers.files.size,paperBindingCount:Object.keys(papers.index.bindings).length,excludedPaperBindings:papers.excluded,maxDayBytes:Math.max(...days.map(d=>d.bytes)),totalAssetBytes:[...files.values()].reduce((n,b)=>n+b.length,0),files:Object.fromEntries([...files].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([name,bytes])=>[name,{bytes:bytes.length,sha256:sha(bytes)}]))};
 return {files,index,manifest,paperIndex:papers.index};
}
export function buildCurriculum(root='.',{check=false}={}){
 const artifacts=curriculumArtifacts(root),generated=[['worker/paper-index.json',json(artifacts.paperIndex)],['worker/curriculum-index.json',json(artifacts.index)],['deployment-manifest.json',JSON.stringify(artifacts.manifest,null,2)+'\n']];
 for(const [name,content]of generated){if(check){if(fs.readFileSync(path.join(root,name),'utf8')!==content)throw Error('Stale generated release input: '+name+'; run npm run build:curriculum and review the diff');}else fs.writeFileSync(path.join(root,name),content);}
 const target=path.join(root,'deployment-assets');fs.rmSync(target,{recursive:true,force:true});fs.mkdirSync(target,{recursive:true});
 for(const [name,bytes]of artifacts.files){const full=path.join(target,name);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,bytes);}
 return artifacts;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const {manifest}=buildCurriculum('.',{check:process.argv.includes('--check')});console.log(JSON.stringify({sourceSha256:manifest.sourceSha256,assetCount:manifest.assetCount,catalogBytes:manifest.catalogBytes,maxDayBytes:manifest.maxDayBytes,totalAssetBytes:manifest.totalAssetBytes}));}
