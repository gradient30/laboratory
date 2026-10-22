import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path='source-manifest.json', data=JSON.parse(readFileSync(path,'utf8'));
data.files=Object.fromEntries(readdirSync('dist').sort().map(name=>[name,createHash('sha256').update(readFileSync(`dist/${name}`)).digest('hex')]));
data.note='Current reviewed asset hashes; sourceCommit identifies the original Sites snapshot, not the current GitHub commit.';
writeFileSync(path,JSON.stringify(data,null,2)+'\n');
console.log('Updated current asset hashes. Review the content and manifest diff together before merging.');
