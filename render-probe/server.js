'use strict';

// Deliberately contains no authentication or financial endpoints.
// Deploy only this directory first to check reachability from Russia without VPN.
const http=require('node:http');
const port=Number(process.env.PORT||10000);
const host='0.0.0.0';

http.createServer((req,res)=>{
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  const path=String(req.url||'/').split('?')[0];
  if(req.method==='GET' && (path==='/' || path==='/health' || path==='/lfp-api/health')){
    res.writeHead(200);
    return res.end(JSON.stringify({
      ok:true,service:'lfp-render-probe',stage:'network-only',
      financial_api_enabled:false,oauth_enabled:false
    }));
  }
  res.writeHead(404);
  res.end(JSON.stringify({error:'NOT_FOUND'}));
}).listen(port,host,()=>console.log('LFP network-only probe ready'));
