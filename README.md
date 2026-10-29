# Auto insurance referral page

Responsive static landing page with linked privacy/terms pages and `contact@saveautoinfo.com` as its support and privacy contact.

The root `/` shows only “Happy World!” with no scripts or tracking. The insurance landing page is at `/getoffer/`. Policy pages remain at `/privacy-policy.html` and `/terms.html`, with return links to `/getoffer/`.

Serve locally with `python3 -m http.server 8080` and open `http://localhost:8080/getoffer/`. Pixel measurement requires HTTP(S); opening a file directly does not activate it.

## Meta measurement

- Pixel `1492655519595047` is enabled in `config.js` and sends one PageView automatically on each HTTP(S) page load where `main.js` is included. The root homepage has no scripts.
- There is no consent popup, preference panel, or consent-grant event. CTA clicks do not send Lead or other Meta events. Automatic event configuration is disabled.
- Global Privacy Control, Do Not Track, unsupported URL/referrer parameters, ad blockers, and network restrictions can prevent loading. Known ClickFlare campaign parameters are allowed. Never put personal information in URLs.
- The site does not read or write the former consent preference. Existing stored choices do not gate initialization.
- This configuration does not guarantee legal/platform compliance; consent obligations depend on the audience and applicable requirements.
- The YES/NO links continue using ClickFlare independently. They require a valid campaign visit/session.

## Remaining launch checks

The `quoteUrl` is `https://globalvisitlog.com/cf/click` for both buttons. The owner-supplied tag is in `clickflare.js` and loads on the landing page. Markdown escapes were removed from the supplied JavaScript. The tag reads `cftmid` and `cpid` from the landing URL, or the campaign from `cf_cpid`. Without these values it retains the supplied `__CONTAINER_ID__` and `__CAMPAIGN_ID__` placeholders; supply the real identifiers through your campaign URL or replace the placeholders for a working campaign. External tag behavior and attribution must be verified in ClickFlare. This tag is independent of the automatic Meta PageView integration.

No legal operator name has been provided. The contact email is published, but this is not a legal or platform compliance certification. Review the operator disclosures and obligations relevant to your business and audience. No approval or absence of future flags is guaranteed.

At the owner’s request, the original flag, savings claims, customer count, review logos, static “Real-Time Quotes” table, and supplied testimonials have been restored on `/getoffer/`. These figures and testimonials have not been independently verified. The table is static, and the Terms disclose that it is not a live insurer feed. Substantiate the claims and review permissions before advertising.

After hosting on HTTPS, verify the domain and Pixel in your Meta account as applicable. Use Events Manager Test Events with a browser that permits measurement: confirm automatic PageView, click YES or NO, and confirm that no Lead event is sent. Test browser privacy signals separately: no Pixel should load, and the CTA should still work. Review any extra events configured remotely in your account. Live Meta receipt has not been verified from this workspace.

## Automated checks

`tests/tracking.cjs` starts an ephemeral local server and intercepts Meta requests, so tests do not pollute real campaign data. Install/use Playwright outside the deployed static assets and run:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright CHROMIUM_PATH=/path/to/chrome node tests/tracking.cjs
```

Tests cover both ClickFlare-managed CTA links, simulated tag failure fallback, campaign parameters, duplicate prevention, back-navigation reset, disabled Meta despite saved consent, responsive layouts, and the root page. The external tag is simulated; these tests do not verify a live ClickFlare campaign.

## ClickFlare CTA integration

YES and NO are real anchors, styled as buttons. `main.js` initializes their href from `config.js` before the deferred ClickFlare tag rewrites links. The click handler leaves native navigation intact, so the vendor’s rewritten handler runs. On tag load failure, the supplied vendor script restores the direct click URL. That fallback still requires a valid ClickFlare visitor/campaign session; it cannot fix missing campaign IDs or blocked cookies.

### Verified redirect campaign

Campaign ID: `6ae32805a09e8bf230a30fb5`. Entry URL: `https://globalvisitlog.com/cf/r/6ae32805a09e8bf230a30fb5`. In a fresh browser, enter through this URL before using the CTA. The campaign supplies `cpid`, `cep`, and `lptoken` to the landing page. The Meta URL guard accepts these identifiers in their expected formats. Direct entry to the bare landing page has no campaign session and can return “Could not find cookie for cta click.” Both CTA answers use the same offer URL; there is no separate answer attribution configured.
