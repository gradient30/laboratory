import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const fail=message=>{throw Error(message);};
export function validateRuntimeSecretNames(entries,config){
 if(!Array.isArray(entries)||entries.length>1000)fail('Secret-name metadata must be a bounded array.');
 const names=new Map();
 for(const entry of entries){
  if(!entry||Array.isArray(entry)||typeof entry!=='object'||typeof entry.name!=='string'||!/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(entry.name)||typeof entry.type!=='string'||!/^[a-z][a-z0-9_]{0,63}$/.test(entry.type)||names.has(entry.name))fail('Secret-name metadata is malformed or duplicated.');
  names.set(entry.name,entry.type);
 }
 // Values stay on the Worker. This check neither reads them nor creates missing bindings.
 const required=['AUTH_SECRET','BOOTSTRAP_ADMIN_EMAIL','EMAIL_FROM','EMAIL_PROVIDER','REGISTRATION_ENABLED'];
 if(!config?.send_email?.some(x=>x.name==='EMAIL'))required.push('RESEND_API_KEY');
 for(const name of required){
  if(!names.has(name))fail(`Required private runtime configuration is missing: ${name}`);
  if(names.get(name)!=='secret_text')fail(`Required private runtime configuration has an unexpected type: ${name}`);
 }
 return required;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  validateRuntimeSecretNames(JSON.parse(readFileSync(process.argv[2],'utf8')),JSON.parse(readFileSync('wrangler.jsonc','utf8')));
  console.log('Required runtime secret names and types are present. Values, deliverability and login health were not inspected; no configuration changed.');
 }catch{
  // JSON/parser/assertion errors can contain input bytes; never forward them to public CI logs.
  console.error('Runtime secret metadata check failed. Required names/types must be present and unique; no values were logged.');
  process.exitCode=1;
 }
}
