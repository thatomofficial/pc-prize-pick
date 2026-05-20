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

## Tests

```powershell
python -m unittest discover tools/pc-prebuild-scraper/tests
```
