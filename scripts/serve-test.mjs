import http from 'node:http';
import {readFile} from 'node:fs/promises';
const allowed=new Map([['/','index.html'],['/index.html','index.html'],['/app.js','app.js'],['/diagrams.js','diagrams.js'],['/styles.css','styles.css'],['/data.json','data.json']]);
const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',json:'application/json; charset=utf-8'};
http.createServer(async(req,res)=>{const path=allowed.get(new URL(req.url,'http://127.0.0.1').pathname);if(!path){res.writeHead(404);res.end();return}try{res.setHeader('Content-Type',types[path.split('.').at(-1)]);res.end(await readFile(new URL('../dist/'+path,import.meta.url)))}catch{res.writeHead(500);res.end('Test server file read failure')}}).listen(4173,'127.0.0.1',()=>console.log('Local test server ready at 127.0.0.1:4173'));
