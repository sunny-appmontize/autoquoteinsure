# Auto insurance referral page

Responsive static landing page with linked privacy/terms pages and `contact@saveautoinfo.com` as its support and privacy contact.

Serve locally with `python3 -m http.server 8080`. Pixel measurement requires HTTP(S); opening a file directly does not activate it.

## Meta measurement

**Currently disabled:** `metaTrackingEnabled: false` prevents the Meta script, PageView, and Lead events, including for visitors who previously accepted measurement. The Pixel ID is retained for future use. The behavior below applies only if explicitly re-enabled.

- Pixel ID: `610135848470978` in `config.js`.
- No Meta script or events before explicit acceptance of optional advertising measurement.
- Acceptance sends one `PageView` per page load. Either YES or NO sends one `Lead` per navigation attempt, then redirects after 500 ms. This Lead represents CTA interest, **not** a completed application or qualified lead.
- No insurance answer, email, phone number, or custom user data is included in the event. Automatic event configuration is disabled in code; also review automatic events and advanced matching settings in Events Manager before launch.
- Declining or withdrawing consent stops subsequent events from this integration; quote navigation still works. Browser Global Privacy Control and Do Not Track disable measurement. Withdrawal does not delete data Meta already received.
- Preferences are stored in local storage for up to 180 days. Withdrawal revokes Pixel consent and attempts to clear accessible `_fbp` and `_fbc` cookies.
- Measurement only runs on URLs/referrers without fragments and with a restricted set of campaign parameters (`fbclid`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `campaign_id`, `adset_id`, `ad_id`) containing 1–500 ASCII letters, digits, `_`, `.`, `~`, or `-`. Other parameters disable measurement. Never put personal information in campaign identifiers or URL paths.
- Ad blockers, browser controls, declined consent, script loading delays, and network failures can prevent delivery. A timeout gives events time to send but cannot guarantee receipt. There is no server-side Conversions API integration.

## Remaining launch checks

The `quoteUrl` still points to the supplied reference's `https://trk.trackflowlink.com/cf/click`. Replace it with your own verified referral URL and check the full destination flow before paid traffic. Its ownership and campaign configuration have not been verified.

No legal operator name has been provided. The contact email is published, but this is not a legal or platform compliance certification. Review the operator disclosures and obligations relevant to your business and audience. No approval or absence of future flags is guaranteed.

Unverified savings amounts, customer counts, testimonials, static quotes labeled as real time, and absolute security claims were removed. Add factual claims only when you can substantiate them.

After hosting on HTTPS, verify the domain and Pixel in your Meta account as applicable. Use Events Manager Test Events with a browser that permits measurement: accept measurement, confirm PageView, click YES or NO, and confirm Lead on Pixel `610135848470978`. Test rejection separately: no Pixel should load, and the CTA should still work. Review any extra events configured remotely in your account. Live Meta receipt has not been verified from this workspace.

## Automated checks

`tests/tracking.cjs` starts an ephemeral local server and intercepts Meta requests, so tests do not pollute real campaign data. Install/use Playwright outside the deployed static assets and run:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright CHROMIUM_PATH=/path/to/chrome node tests/tracking.cjs
```

Tests cover consent, both CTAs, duplicate prevention, rejection, GPC, withdrawal, blocked analytics, redirects, URL safeguards, contact links, and responsive layouts.
