# PC prebuilt scraper

Scrapes prebuilt desktop PC product pages from configured retailer URLs and
normalizes them into competition draft data for PC Prize Pick.

The scraper uses only the Python standard library. It prefers JSON-LD
`Product` data when retailers publish it, then falls back to visible page text
for the product name, price, image, and PC specs.

## Safety

- Check each retailer's terms before scraping.
- Robots.txt is respected by default for HTTP/HTTPS sources.
- Keep `requestDelaySeconds` conservative.
- Treat output as draft inventory. Review specs, prices, image rights, and
  prize copy before publishing competitions.

## Configure Sources

Copy `sources.example.json` to `sources.local.json` and replace the placeholder
retailer URLs.

```powershell
Copy-Item tools/pc-prebuild-scraper/sources.example.json tools/pc-prebuild-scraper/sources.local.json
```

Each source can start from category pages, search result pages, product pages,
or a sitemap URL.

## Run

From the repo root:

```powershell
python tools/pc-prebuild-scraper/scrape_prebuilds.py `
  --config tools/pc-prebuild-scraper/sources.local.json `
  --out tools/pc-prebuild-scraper/output/prebuilt-pcs.json `
  --competitions-out tools/pc-prebuild-scraper/output/competition-drafts.json `
  --sql-out tools/pc-prebuild-scraper/output/competitions.seed.sql
```

Or use the wrapper:

```powershell
.\tools\scripts\scrape-prebuilds.ps1 -Config tools\pc-prebuild-scraper\sources.local.json
```

## Outputs

- `prebuilt-pcs.json` contains raw normalized products with source URLs and
  warnings.
- `competition-drafts.json` matches the frontend `Competition` shape.
- `competitions.seed.sql` upserts into the backend `competitions` table by
  slug.

Draft competitions default to `upcoming`. Pass `--status live` only after the
scraped data has been reviewed.

## Spec lookup fallback (`specSources`)

When the static catalog (`catalog/cpus.json` / `gpus.json`) doesn't know a
SKU mentioned in a prebuilt name, the scraper falls back to a configured
component retailer (default: Wootware) to fetch the spec sheet. The
result is cached under `catalog/.spec-cache/<source>/<kind>/<sku>.json`
with a 30-day TTL.

Configure spec sources in `sources.local.json`:

```json
"specSources": [
  {
    "name": "Wootware",
    "baseUrl": "https://www.wootware.co.za",
    "cpuCategoryUrl": "https://www.wootware.co.za/computer-hardware/cpus-processors",
    "gpuCategoryUrl": "https://www.wootware.co.za/computer-hardware/video-cards-video-devices",
    "requestDelaySeconds": 10
  }
]
```

Disable the fallback for a single run:

```powershell
python tools/pc-prebuild-scraper/scrape_prebuilds.py --no-spec-fallback ...
```

**Cloudflare caveat for Wootware:** Wootware sits behind Cloudflare and
will start returning HTTP 403 to scripted requests after a handful of
hits — even with a browser-like User-Agent and at the 10-second crawl
delay. When that happens the scraper just logs a warning and leaves the
FK NULL on that build. Workshop options:

- Wait an hour and re-run (block usually clears).
- Add the missing SKU to the static catalog directly (a single JSON
  entry — usually 30 seconds of work).
- Trust the cache: once a SKU is in `catalog/.spec-cache/`, subsequent
  runs read from disk and never refetch until the 30-day TTL expires.

## Tests

```powershell
python -m unittest discover tools/pc-prebuild-scraper/tests
```
