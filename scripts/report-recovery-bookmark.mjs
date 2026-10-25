import {readFileSync,appendFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(process.argv[2],'utf8'));
const find=(v)=>{if(!v||typeof v!=='object')return null;if(typeof v.bookmark==='string')return v.bookmark;for(const child of Object.values(v)){const found=find(child);if(found)return found;}return null;};
const bookmark=find(data);
if(!bookmark||!/^[-a-f0-9]+$/i.test(bookmark))throw new Error('A valid pre-migration recovery bookmark was not returned; migration is blocked.');
const line=`Pre-migration D1 recovery bookmark: ${bookmark}. Restoration is never automatic and requires specific approval.\n`;
console.log(line.trim());
if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,line);
