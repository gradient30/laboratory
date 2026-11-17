// Maintainer-only authoring command: records local reviewed renderer bytes; never runs in CI.
import fs from 'node:fs';import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const file='source-parts/manifest.json',manifest=JSON.parse(fs.readFileSync(file));
for(const name of ['dist/diagrams.js','deployment-manifest.json']){
 const target=manifest.targets.find(t=>t.path===name);if(!target)throw Error('Missing approved source target: '+name);
 const bytes=fs.readFileSync(name);target.bytes=bytes.length;target.sha256=sha(bytes);target.parts=[];
 for(let i=0;i<bytes.length;i+=48000){const b=bytes.subarray(i,i+48000),h=sha(b),part=h+'.b64';fs.writeFileSync('source-parts/'+part,b.toString('base64')+'\n');target.parts.push({file:part,bytes:b.length,sha256:h});}
}
const raw=JSON.stringify(manifest,null,2)+'\n';fs.writeFileSync(file,raw);
const script='scripts/materialize-source.mjs';fs.writeFileSync(script,fs.readFileSync(script,'utf8').replace(/sourcePartsManifestSha256='[a-f0-9]+'/,'sourcePartsManifestSha256=\''+sha(raw)+'\''));
console.log('Recorded reviewed local renderer and deployment-manifest parts; update exact-candidate declaration and run all checks.');
