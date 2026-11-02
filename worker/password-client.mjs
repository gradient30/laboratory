// Entry Worker does no expensive KDF: only this internal binding may hash.
export {validPassword} from './password-validation.mjs';
const TIMEOUT_MS=5000;
const recordPattern=/^scrypt-v1\$16384\$8\$5\$[a-f0-9]{32}\$[a-f0-9]{64}$/;
async function invoke(env,identity,operation,password,record){
 let timer,stub;
 try{
  if(!env.PASSWORD_HASHER)throw new Error('Unavailable');
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(identity)));
  const id=env.PASSWORD_HASHER.idFromName('password-hasher-v1-'+(digest[0]%16));
  stub=env.PASSWORD_HASHER.get(id);
  const result=await Promise.race([
   stub.compute(operation,password,record,Date.now()+TIMEOUT_MS),
   new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Unavailable')),TIMEOUT_MS)})
  ]);
  if(operation==='hash'?typeof result!=='string'||!recordPattern.test(result):typeof result!=='boolean')throw new Error('Invalid result');
  return result;
 }catch{throw new Error('Password service unavailable');}
 finally{clearTimeout(timer);stub?.[Symbol.dispose]?.();}
}
export const hashPassword=(env,identity,password)=>invoke(env,identity,'hash',password,null);
export const verifyPassword=(env,identity,password,record)=>invoke(env,identity,'verify',password,record);
