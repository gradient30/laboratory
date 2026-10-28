// Native, memory-hard KDF. No plaintext, reversible encryption or fast-hash passwords.
import {scrypt,timingSafeEqual} from 'node:crypto';
const N=16384,r=8,p=5,keyLength=32,maxmem=32*1024*1024;
const format='scrypt-v1';
const bytes=value=>Uint8Array.from(value.match(/../g),x=>parseInt(x,16));
const hex=value=>Array.from(value,x=>x.toString(16).padStart(2,'0')).join('');
export function validPassword(value){return typeof value==='string'&&Array.from(value).length>=8&&Array.from(value).length<=128&&new TextEncoder().encode(value).length<=512&&!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value)}
function derive(password,salt){return new Promise((resolve,reject)=>scrypt(password,salt,keyLength,{N,r,p,maxmem},(error,key)=>error?reject(error):resolve(key)))}
export async function hashPassword(password){if(!validPassword(password))throw new Error('Invalid password length');const salt=crypto.getRandomValues(new Uint8Array(16));const hash=await derive(password,salt);return `${format}$${N}$${r}$${p}$${hex(salt)}$${hex(hash)}`}
const dummy=`${format}$${N}$${r}$${p}$${'a1'.repeat(16)}$${'00'.repeat(keyLength)}`;
export async function verifyPassword(password,record){const value=typeof record==='string'?record:dummy;const match=/^scrypt-v1\$16384\$8\$5\$([a-f0-9]{32})\$([a-f0-9]{64})$/.exec(value);const selected=match||/^scrypt-v1\$16384\$8\$5\$([a-f0-9]{32})\$([a-f0-9]{64})$/.exec(dummy);const actual=await derive(password,bytes(selected[1]));return timingSafeEqual(actual,bytes(selected[2]))&&!!match&&!!record}
