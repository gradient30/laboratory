import {DurableObject} from 'cloudflare:workers';
import {PasswordQueue} from './password-queue.mjs';
import {validPassword,hashPassword,verifyPassword} from './password.mjs';

// SQLite-backed class for Free eligibility; storage is intentionally never used.
// No logs, external I/O, fetch endpoint, account IDs or credentials persisted.
export class PasswordHasher extends DurableObject {
 #queue=new PasswordQueue();
 async compute(operation,password,record,deadline){
  if(!['hash','verify'].includes(operation)||!validPassword(password)||
     !(record===null||typeof record==='string'&&record.length<=160)||
     !Number.isFinite(deadline)||deadline<=Date.now()||deadline>Date.now()+6000)
   throw new Error('Password service unavailable');
  return this.#queue.run(deadline,()=>operation==='hash'?hashPassword(password):verifyPassword(password,record));
 }
}
