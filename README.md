# Auto insurance referral page

Responsive static landing page with linked privacy/terms pages and `contact@saveautoinfo.com` as its support and privacy contact.

The root `/` shows only “Happy World!” with no scripts or tracking. The insurance landing page is at `/getoffer/`. Policy pages remain at `/privacy-policy.html` and `/terms.html`, with return links to `/getoffer/`.

Serve locally with `python3 -m http.server 8080` and open `http://localhost:8080/getoffer/`. Pixel measurement requires HTTP(S); opening a file directly does not activate it.

## Meta measurement

**Currently disabled:** `metaTrackingEnabled: false` prevents the Meta script, PageView, and Lead events, including for visitors who previously accepted measurement. The Pixel ID is retained for future use. The behavior below applies only if explicitly re-enabled.

- Pixel ID: `610135848470978` in `config.js`.
- No Meta script or events before explicit acceptance of optional advertising measurement.
- Acceptance sends one `PageView` per page load. Either YES or NO sends one `Lead` per navigation attempt, then follows the ClickFlare-managed anchor. This Lead represents CTA interest, **not** a completed application or qualified lead.
- No insurance answer, email, phone number, or custom user data is included in the event. Automatic event configuration is disabled in code; also review automatic events and advanced matching settings in Events Manager before launch.
- Declining or withdrawing consent stops subsequent events from this integration; quote navigation still works. Browser Global Privacy Control and Do Not Track disable measurement. Withdrawal does not delete data Meta already received.
- Preferences are stored in local storage for up to 180 days. Withdrawal revokes Pixel consent and attempts to clear accessible `_fbp` and `_fbc` cookies.
- Measurement only runs on URLs/referrers without fragments and with a restricted set of campaign parameters (`fbclid`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `campaign_id`, `adset_id`, `ad_id`) containing 1–500 ASCII letters, digits, `_`, `.`, `~`, or `-`. Other parameters disable measurement. Never put personal information in campaign identifiers or URL paths.
- Ad blockers, browser controls, declined consent, script loading delays, and network failures can prevent delivery. Native link navigation does not guarantee that optional Meta events finish sending before departure. There is no server-side Conversions API integration.

## Remaining launch checks

The `quoteUrl` is `https://globalvisitlog.com/cf/click/1` for both buttons. The owner-supplied tag is in `clickflare.js` and loads on the landing page. Markdown escapes were removed from the supplied JavaScript. The tag reads `cftmid` and `cpid` from the landing URL, or the campaign from `cf_cpid`. Without these values it retains the supplied `__CONTAINER_ID__` and `__CAMPAIGN_ID__` placeholders; supply the real identifiers through your campaign URL or replace the placeholders for a working campaign. External tag behavior and attribution must be verified in ClickFlare. This tag is independent of the disabled Meta integration.

No legal operator name has been provided. The contact email is published, but this is not a legal or platform compliance certification. Review the operator disclosures and obligations relevant to your business and audience. No approval or absence of future flags is guaranteed.

At the owner’s request, the original flag, savings claims, customer count, review logos, static “Real-Time Quotes” table, and supplied testimonials have been restored on `/getoffer/`. These figures and testimonials have not been independently verified. The table is static, and the Terms disclose that it is not a live insurer feed. Substantiate the claims and review permissions before advertising.

After hosting on HTTPS, verify the domain and Pixel in your Meta account as applicable. Use Events Manager Test Events with a browser that permits measurement: accept measurement, confirm PageView, click YES or NO, and confirm Lead on Pixel `610135848470978`. Test rejection separately: no Pixel should load, and the CTA should still work. Review any extra events configured remotely in your account. Live Meta receipt has not been verified from this workspace.

## Automated checks

`tests/tracking.cjs` starts an ephemeral local server and intercepts Meta requests, so tests do not pollute real campaign data. Install/use Playwright outside the deployed static assets and run:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright CHROMIUM_PATH=/path/to/chrome node tests/tracking.cjs
```

Tests cover both ClickFlare-managed CTA links, simulated tag failure fallback, campaign parameters, duplicate prevention, back-navigation reset, disabled Meta despite saved consent, responsive layouts, and the root page. The external tag is simulated; these tests do not verify a live ClickFlare campaign.

## ClickFlare CTA integration

YES and NO are real anchors, styled as buttons. `main.js` initializes their href from `config.js` before the deferred ClickFlare tag rewrites links. The click handler leaves native navigation intact, so the vendor’s rewritten handler runs. On tag load failure, the supplied vendor script restores the direct click URL. That fallback still requires a valid ClickFlare visitor/campaign session; it cannot fix missing campaign IDs or blocked cookies.
