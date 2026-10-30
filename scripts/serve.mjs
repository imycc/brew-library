import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const port=Number(process.env.PORT||4173);
const root=path.resolve('out');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.woff2':'font/woff2','.png':'image/png','.webp':'image/webp','.avif':'image/avif','.xml':'application/xml','.txt':'text/plain'};
http.createServer(async(req,res)=>{
 try{
   let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(pathname==='/brew-library') {res.writeHead(301,{Location:'/brew-library/'});res.end();return;}
   if(!pathname.startsWith('/brew-library/'))throw new Error('Outside project');
   pathname=pathname.slice('/brew-library'.length);
   let file=path.resolve(root,'.'+pathname);
   if(!file.startsWith(root+path.sep)&&file!==root)throw new Error('Invalid path');
   if((await stat(file)).isDirectory())file=path.join(file,'index.html');
   const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});try{res.end(await readFile(path.join(root,'404.html')));}catch{res.end('Not found');}}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/brew-library/`));
