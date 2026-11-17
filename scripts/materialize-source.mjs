import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const sourcePartsManifestSha256='4df56ba4226e70c555f67cd343c332e1f62671a9085b73923a084cabab52d7c7';
const sha=b=>createHash('sha256').update(b).digest('hex');
function regular(root,relative){
 if(typeof relative!=='string'||relative.startsWith('/')||relative.split('/').some(s=>!s||s==='.'||s==='..'))throw Error('Unsafe source path');
 let p=path.resolve(root);if(fs.lstatSync(p).isSymbolicLink())throw Error('Source root symlink');
 for(const s of relative.split('/')){p=path.join(p,s);if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())throw Error('Source symlink');}
 return p;
}
export function materializeSource(root='.',expectedManifestSha=sourcePartsManifestSha256){
 const raw=fs.readFileSync(regular(root,'source-parts/manifest.json'));
 if(sha(raw)!==expectedManifestSha)throw Error('Source parts manifest hash mismatch');
 const manifest=JSON.parse(raw);if(manifest.schemaVersion!==1||!Array.isArray(manifest.targets))throw Error('Invalid source parts manifest');
 const prepared=[],seen=new Set();
 for(const t of manifest.targets){
  if(seen.has(t.path)||!Number.isSafeInteger(t.bytes)||t.bytes<1||!Array.isArray(t.parts)||!t.parts.length)throw Error('Invalid/duplicate source target');seen.add(t.path);
  const target=regular(root,t.path),parts=[];
  for(const p of t.parts){
   if(!/^[a-f0-9]{64}\.b64$/.test(p.file)||p.file!==p.sha256+'.b64'||!Number.isSafeInteger(p.bytes)||p.bytes<1||p.bytes>300000)throw Error('Invalid source part');
   const encoded=fs.readFileSync(regular(root,'source-parts/'+p.file),'utf8').trim(),bytes=Buffer.from(encoded,'base64');
   if(bytes.toString('base64')!==encoded||bytes.length!==p.bytes||sha(bytes)!==p.sha256)throw Error('Source part integrity mismatch');parts.push(bytes);
  }
  const bytes=Buffer.concat(parts);if(bytes.length!==t.bytes||sha(bytes)!==t.sha256)throw Error('Reassembled source integrity mismatch');
  if(fs.existsSync(target)){if(sha(fs.readFileSync(target))!==t.sha256)throw Error('Refusing to overwrite modified source: '+t.path);}else prepared.push({target,bytes});
 }
 // Validate every target before creating any file. Never overwrite changed authoring data.
 for(const {target,bytes}of prepared){fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});}
 return {targets:manifest.targets.length,created:prepared.length,bytes:manifest.targets.reduce((s,t)=>s+t.bytes,0)};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(materializeSource()));
