param(
    [string]$Config = "tools\pc-prebuild-scraper\sources.local.json",
    [string]$Out = "tools\pc-prebuild-scraper\output\prebuilt-pcs.json",
    [string]$CompetitionsOut = "tools\pc-prebuild-scraper\output\competition-drafts.json",
    [string]$SqlOut = "tools\pc-prebuild-scraper\output\competitions.seed.sql",
    [ValidateSet("live", "closing-soon", "sold-out", "upcoming")]
    [string]$Status = "upcoming",
    [int]$MaxProducts = 0,
    [switch]$NoRobots
)

$ErrorActionPreference = "Stop"

$argsList = @(
    "tools\pc-prebuild-scraper\scrape_prebuilds.py",
    "--config", $Config,
    "--out", $Out,
    "--competitions-out", $CompetitionsOut,
    "--sql-out", $SqlOut,
    "--status", $Status
)

if ($MaxProducts -gt 0) {
    $argsList += @("--max-products", $MaxProducts)
}

if ($NoRobots) {
    $argsList += "--no-robots"
}

python @argsList
