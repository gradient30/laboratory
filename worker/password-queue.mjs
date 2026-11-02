// Bounded in-memory serial queue; no durable state or I/O.
export class PasswordQueue {
 #tail=Promise.resolve();
 #pending=0;
 constructor(clock=Date.now){this.clock=clock;}
 async run(deadline,work){
  if(this.#pending>=4)throw new Error('Password service unavailable');
  this.#pending++;
  const job=this.#tail.then(async()=>{
   if(this.clock()>=deadline)throw new Error('Password service unavailable');
   const result=await work();
   if(this.clock()>=deadline)throw new Error('Password service unavailable');
   return result;
  });
  this.#tail=job.then(()=>{},()=>{});
  try{return await job;}finally{this.#pending--;}
 }
}
