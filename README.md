# autoquoteinsure

Static clone of https://autoquoteinsure.com/Get-Quote/ with local images and responsive styles.

Open `index.html`, or serve this directory with `python3 -m http.server 8080`.

## Tracking configuration

Edit `config.js`:

- `metaPixelId`: currently `000000000000000`, a dummy ID as requested. Dummy mode queues events in `window.fbq.queue` but does not load Meta or transmit events. Set your real numeric ID to activate tracking.
- `quoteUrl`: the original reference click URL. Set your own campaign destination before launch.

Page load tracks `PageView`. Clicking YES or NO tracks one `Lead` with the selected answer, then redirects after 300 ms. Repeated clicks during navigation are ignored. Ad blockers can prevent delivery; verify a real ID in Meta Test Events before running ads.

The reference's ClickFlare container script was removed to avoid sending visits to its owner's analytics. The original outbound click URL is retained. Marketing copy, testimonials, static quote rows, and footer details are copied from the supplied reference; privacy and terms links are placeholders in that source. Review those details before production use. No live quote API is included.
