// Local browser integration tests: external requests are intercepted.
// PLAYWRIGHT_MODULE=/path/to/playwright CHROMIUM_PATH=/path/to/chrome node tests/tracking.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const target = 'https://globalvisitlog.com/cf/click/1';
const server = http.createServer((req,res)=>{
  let file = path.join(root,new URL(req.url,'http://localhost').pathname);
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  try{
    for(const failTag of [false,true]) for(const label of ['YES','NO']){
      const context=await browser.newContext();
      // Previously accepted Meta consent must not override the master switch.
      await context.addInitScript(()=>localStorage.setItem('autoquote-ad-consent-v1',JSON.stringify({value:'accepted',at:Date.now()})));
      let metaRequests=0,tagRequest,clicks=0,tagSeen;
      const tagReady=new Promise(resolve=>{tagSeen=resolve;});
      await context.route(/https:\/\/.*facebook\.(net|com)\//,r=>{metaRequests++;return r.abort();});
      await context.route('https://globalvisitlog.com/cf/tags/**',r=>{
        tagRequest=new URL(r.request().url());tagSeen();
        if(failTag)return r.abort();
        // Model the remote tag's link setter without creating real campaign traffic.
        return r.fulfill({contentType:'application/javascript',body:`Object.defineProperty(window.clickflare,'l',{configurable:true,set(url){window.testClickflareHandled=url;}});`});
      });
      await context.route(target,r=>{clicks++;return r.fulfill({contentType:'text/html',body:'Mock offer destination'});});
      const page=await context.newPage();
      await page.goto(base+'/getoffer/?cftmid=test-container&cpid=test-campaign');
      await tagReady;
      assert.equal(tagRequest.pathname,'/cf/tags/test-container');
      assert.equal(tagRequest.searchParams.get('cpid'),'test-campaign');
      const link=page.getByRole('link',{name:label,exact:true});
      if(failTag){
        await page.waitForFunction(()=>document.querySelector('[data-lead-choice]').getAttribute('href')==='https://globalvisitlog.com/cf/click/1');
        await link.click();await page.waitForURL(target);assert.equal(clicks,1);
      }else{
        await page.waitForFunction(()=>!!Object.getOwnPropertyDescriptor(window.clickflare,'l'));
        assert((await link.getAttribute('href')).startsWith('javascript:window.clickflare.l='));
        await link.click();
        await page.waitForFunction(()=>window.testClickflareHandled==='https://globalvisitlog.com/cf/click/1');
        assert.equal(await page.evaluate(()=>window.testClickflareHandled),target);
        assert.equal(clicks,0,'Must use vendor setter, not direct navigation');
        assert.equal(await page.evaluate(()=>typeof window.fbq),'undefined');
        await page.evaluate(()=>{window.testClickflareHandled=null;document.querySelector('[data-lead-choice]').click();});
        assert.equal(await page.evaluate(()=>window.testClickflareHandled),null,'Duplicate click blocked');
        await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow')));
        assert.equal(await link.getAttribute('aria-disabled'),null);
      }
      assert.equal(metaRequests,0);
      await context.close();
    }
    const context=await browser.newContext();
    await context.route('https://globalvisitlog.com/**',r=>r.abort());
    const page=await context.newPage();
    for(const width of [390,1440]){
      await page.setViewportSize({width,height:900});
      for(const file of ['/getoffer/','/privacy-policy.html','/terms.html']){
        await page.goto(base+file);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      }
    }
    await page.goto(base+'/');assert.equal((await page.locator('body').innerText()).trim(),'Happy World!');assert.equal(await page.locator('script').count(),0);
    await context.close();
    console.log('PASS: both ClickFlare-managed CTAs, tag failure fallback, campaign parameters, duplicate guard, back navigation reset, disabled Meta, responsive layouts, and root page.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
