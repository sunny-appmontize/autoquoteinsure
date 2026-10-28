// Run: PLAYWRIGHT_MODULE=/path/to/playwright node tests/tracking.cjs
// Uses a local server and intercepts Meta requests; never sends test leads to Meta.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const file = path.join(root, new URL(req.url, 'http://localhost').pathname.replace(/^\//, '') || 'index.html');
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', ({'.js':'application/javascript','.css':'text/css','.html':'text/html','.jpg':'image/jpeg','.png':'image/png'})[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});
  try {
    async function setup({gpc=false, blocked=false, suffix='', enabled=true, priorConsent=false}={}) {
      const context = await browser.newContext();
      if (gpc) await context.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', {value:true}));
      if (priorConsent) await context.addInitScript(() => localStorage.setItem('autoquote-ad-consent-v1', JSON.stringify({value:'accepted',at:Date.now()})));
      if (enabled) await context.route('**/config.js', route => route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,'config.js'),'utf8').replace('metaTrackingEnabled: false','metaTrackingEnabled: true')}));
      let requests = 0;
      await context.route('https://connect.facebook.net/**', route => {
        requests++;
        return blocked ? route.abort() : route.fulfill({contentType:'application/javascript',body:'window.metaScriptLoaded = true;'});
      });
      await context.route('https://www.facebook.com/**', route => route.abort());
      const page = await context.newPage();
      await page.goto(base + '/index.html' + suffix);
      await page.evaluate(() => { AUTOQUOTE_CONFIG.quoteUrl = '/terms.html'; });
      return {context, page, requests:()=>requests};
    }
    for (const priorConsent of [false,true]) {
      const t = await setup({enabled:false,priorConsent});
      for (const file of ['index.html','privacy-policy.html','terms.html']) {
        await t.page.goto(base+'/'+file);
        assert.equal(await t.page.evaluate(()=>typeof window.fbq),'undefined');
        assert(await t.page.locator('#privacy-banner').isHidden());
      }
      for (const label of ['YES','NO']) {
        await t.page.goto(base+'/index.html');
        await t.page.evaluate(()=>{AUTOQUOTE_CONFIG.quoteUrl='/terms.html';});
        await t.page.getByRole('button',{name:label,exact:true}).click();
        assert.equal(await t.page.evaluate(()=>typeof window.fbq),'undefined');
        await t.page.waitForURL(base+'/terms.html');
      }
      assert.equal(t.requests(),0);
      await t.context.close();
    }
    console.log('PASS: disabled configuration sends no Meta requests/events on all pages, with or without prior consent; both CTAs still redirect.');
    for (const label of ['YES', 'NO']) {
      const t = await setup();
      assert.equal(t.requests(), 0);
      assert.equal(await t.page.evaluate(() => typeof window.fbq), 'undefined');
      await t.page.getByRole('button', {name:'Accept measurement',exact:true}).click();
      await t.page.waitForFunction(() => window.metaScriptLoaded);
      assert.equal(t.requests(), 1);
      await t.page.getByRole('button', {name:label,exact:true}).click();
      await t.page.evaluate(() => document.querySelector('[data-lead-choice]').dispatchEvent(new MouseEvent('click')));
      const queue = await t.page.evaluate(() => fbq.queue.map(x=>Array.from(x)));
      assert.deepEqual(queue.filter(e=>e[0]==='init'), [['init','610135848470978']]);
      assert.deepEqual(queue.filter(e=>e[2]==='PageView'), [['trackSingle','610135848470978','PageView']]);
      assert.deepEqual(queue.filter(e=>e[2]==='Lead'), [['trackSingle','610135848470978','Lead']]);
      assert(!JSON.stringify(queue).includes('currently_insured'));
      await t.page.waitForURL(base+'/terms.html');
      await t.context.close();
    }
    for (const gpc of [false,true]) {
      const t = await setup({gpc});
      if (gpc) { await t.page.getByRole('button',{name:'Privacy settings',exact:true}).click(); assert(await t.page.locator('#privacy-accept').isHidden()); }
      await t.page.locator('#privacy-reject').click();
      await t.page.getByRole('button',{name:'YES',exact:true}).click();
      await t.page.waitForURL(base+'/terms.html');
      assert.equal(t.requests(),0);
      await t.context.close();
    }
    const revoke = await setup();
    await revoke.page.locator('#privacy-accept').click();
    await revoke.page.getByRole('button',{name:'Privacy settings',exact:true}).click();
    await revoke.page.locator('#privacy-reject').click();
    await revoke.page.getByRole('button',{name:'NO',exact:true}).click();
    assert.equal(await revoke.page.evaluate(()=>fbq.queue.filter(e=>e[2]==='Lead').length),0);
    assert(await revoke.page.evaluate(()=>fbq.queue.some(e=>e[0]==='consent'&&e[1]==='revoke')));
    await revoke.page.waitForURL(base+'/terms.html');
    await revoke.context.close();
    const blocked = await setup({blocked:true});
    await blocked.page.locator('#privacy-accept').click();
    await blocked.page.getByRole('button',{name:'YES',exact:true}).click();
    await blocked.page.waitForURL(base+'/terms.html');
    await blocked.context.close();
    for(const suffix of ['?email=private@example.com','?fbclid=SafeCampaign123&utm_source=facebook']) {
      const t=await setup({suffix});await t.page.locator('#privacy-accept').click();
      assert.equal(await t.page.evaluate(()=>typeof fbq==='function'),!suffix.includes('email='));
      await t.context.close();
    }
    const t=await setup();
    for(const width of [1440,390]) {
      await t.page.setViewportSize({width,height:900});
      for(const file of ['index.html','terms.html','privacy-policy.html']) {
        await t.page.goto(base+'/'+file);
        assert(await t.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        assert(await t.page.getByRole('link',{name:'contact@saveautoinfo.com',exact:true}).first().isVisible());
        assert.equal(await t.page.locator('#privacy-banner').count(),1);
      }
    }
    await t.context.close();
    console.log('PASS: consent gating, YES/NO Lead, duplicate prevention, GPC, withdrawal, blocked script, redirects, URL safeguards, contact links, and desktop/mobile layouts.');
  } finally { await browser.close(); }
})().catch(err=>{console.error(err);process.exitCode=1;}).finally(()=>server.close());
