#!/usr/bin/env python3
from __future__ import annotations

import argparse
import dataclasses
import datetime as dt
import hashlib
import html
import json
import math
import re
import sys
import time
import uuid
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from collections import deque
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Any


DEFAULT_USER_AGENT = (
    "PcPrizePickPrebuildScraper/0.1 "
    "(inventory research; contact: owner@pcprizepick.local)"
)

UTC = dt.timezone.utc
SAST = dt.timezone(dt.timedelta(hours=2))


@dataclass(frozen=True)
class SpecSourceConfig:
    """Component retailer that publishes spec sheets per SKU.

    Used as a fallback when the static catalog doesn't have a CPU/GPU
    model. Currently shaped for Wootware (Magento storefront with one
    product page per SKU at ``/<slug>.html``), but the parser is
    deliberately generic — adding another retailer is a config change
    plus, if their key/value labels differ, an extra entry in the
    ``_SPEC_SHEET_FIELD_MAP`` constant.
    """

    name: str
    base_url: str
    cpu_category_url: str | None = None
    gpu_category_url: str | None = None
    request_delay_seconds: float = 10.0

    @classmethod
    def from_dict(cls, value: dict[str, Any]) -> "SpecSourceConfig":
        if "name" not in value or "baseUrl" not in value:
            raise ValueError("specSources entry needs 'name' and 'baseUrl'.")
        return cls(
            name=str(value["name"]),
            base_url=str(value["baseUrl"]),
            cpu_category_url=value.get("cpuCategoryUrl"),
            gpu_category_url=value.get("gpuCategoryUrl"),
            request_delay_seconds=float(value.get("requestDelaySeconds", 10.0)),
        )


@dataclass(frozen=True)
class SourceConfig:
    name: str
    base_url: str
    urls: list[str]
    sitemap_url: str | None = None
    currency: str = "ZAR"
    include_keywords: list[str] = field(default_factory=list)
    exclude_keywords: list[str] = field(default_factory=list)
    product_url_patterns: list[str] = field(default_factory=list)
    max_pages: int = 80
    max_depth: int = 2
    request_delay_seconds: float = 1.5

    @classmethod
    def from_dict(cls, value: dict[str, Any]) -> "SourceConfig":
        required = ["name", "baseUrl", "urls"]
        missing = [key for key in required if key not in value]
        if missing:
            raise ValueError(f"Source is missing required field(s): {', '.join(missing)}")

        return cls(
            name=str(value["name"]),
            base_url=str(value["baseUrl"]),
            urls=[str(url) for url in value["urls"]],
            sitemap_url=value.get("sitemapUrl"),
            currency=str(value.get("currency", "ZAR")).upper(),
            include_keywords=[str(k).lower() for k in value.get("includeKeywords", [])],
            exclude_keywords=[str(k).lower() for k in value.get("excludeKeywords", [])],
            product_url_patterns=[
                str(k).lower() for k in value.get("productUrlPatterns", [])
            ],
            max_pages=int(value.get("maxPages", 80)),
            max_depth=int(value.get("maxDepth", 2)),
            request_delay_seconds=float(value.get("requestDelaySeconds", 1.5)),
        )


@dataclass(frozen=True)
class Link:
    url: str
    text: str


@dataclass(frozen=True)
class HtmlDocument:
    title: str
    h1: str
    meta: dict[str, str]
    links: list[Link]
    visible_text: str
    json_ld_blocks: list[str]


@dataclass(frozen=True)
class Product:
    source_name: str
    source_url: str
    retailer: str
    name: str
    price_cents: int
    currency: str
    image_url: str | None
    description: str | None
    specs: dict[str, str]
    confidence: float
    warnings: list[str]
    scraped_at: str


@dataclass(frozen=True)
class CatalogEntry:
    brand: str
    model: str
    data: dict[str, Any]


class Catalog:
    """Static lookup of well-known SKUs (CPUs, GPUs).

    Retailer pages typically expose only the model name. Engineering specs
    (cores / threads / TDP / VRAM / memory_type / etc.) are manufacturer-
    published constants — we keep them in JSON catalogs next to the script
    so the scraper can resolve them offline. Add new SKUs by editing
    catalog/*.json.

    Match strategy:
      1. Try every entry's `model` and each item of its `aliases` against
         the input text after a light normalize (case-fold, collapse
         whitespace, strip "AMD " / "NVIDIA " / "Intel " brand prefix).
      2. Prefer the longest match (so "Ryzen 9 9950X3D" wins over the
         prefix "Ryzen 9 9950X").
    """

    def __init__(self, cpus: list[CatalogEntry], gpus: list[CatalogEntry]) -> None:
        self._cpus = cpus
        self._gpus = gpus

    @classmethod
    def load(cls, catalog_dir: Path) -> "Catalog":
        cpus = cls._load_one(catalog_dir / "cpus.json", "cpus")
        gpus = cls._load_one(catalog_dir / "gpus.json", "gpus")
        return cls(cpus, gpus)

    @staticmethod
    def _load_one(path: Path, key: str) -> list[CatalogEntry]:
        if not path.exists():
            return []
        data = json.loads(path.read_text(encoding="utf-8-sig"))
        entries: list[CatalogEntry] = []
        for raw in data.get(key, []):
            brand = str(raw["brand"])
            model = str(raw["model"])
            entries.append(CatalogEntry(brand=brand, model=model, data=raw))
        return entries

    def lookup_cpu(self, model_text: str) -> CatalogEntry | None:
        return self._lookup(self._cpus, model_text)

    def lookup_gpu(self, model_text: str) -> CatalogEntry | None:
        return self._lookup(self._gpus, model_text)

    @staticmethod
    def _normalize(text: str) -> str:
        cleaned = re.sub(r"\s+", " ", text or "").strip()
        # Strip vendor / product-line prefixes that retailers append loosely
        # in front of the actual SKU. "Quadro" survives in retailer copy for
        # workstation cards even though NVIDIA dropped the branding —
        # stripping it lets "Quadro RTX 5000 Ada" resolve to the catalog
        # entry keyed by "RTX 5000 Ada".
        cleaned = re.sub(
            r"^(?:AMD|NVIDIA|Nvidia|Intel|GeForce|Radeon|Quadro)\s+",
            "",
            cleaned,
            flags=re.IGNORECASE,
        )
        return cleaned.lower()

    @classmethod
    def _lookup(
        cls, entries: list[CatalogEntry], model_text: str
    ) -> CatalogEntry | None:
        """Resolve a free-form model string to a catalog entry.

        Priority:
          1. **Exact match** against model or any alias (case-folded).
          2. **Containment match** where the catalog token sits inside the
             needle as a whole-word phrase. The catalog token may not extend
             past the needle (so "RTX 5060" lookup never returns the longer
             "RTX 5060 Ti" entry — that's a different SKU).
          3. Among multiple containment hits, prefer the longest token (so
             "Ryzen 9 9950X3D" beats the bare "Ryzen 9" prefix).
        """
        if not model_text:
            return None
        needle = cls._normalize(model_text)
        needle_padded = f" {needle} "  # for whole-word containment
        exact: CatalogEntry | None = None
        best_contain: tuple[int, CatalogEntry] | None = None

        for entry in entries:
            candidates = [entry.model] + list(entry.data.get("aliases", []))
            for candidate in candidates:
                token = cls._normalize(candidate)
                if not token:
                    continue
                if token == needle:
                    return entry  # exact wins immediately
                # Whole-word containment: token must appear inside needle
                # surrounded by spaces or string ends. This prevents
                # "rtx 5060" from matching "rtx 5060 ti" and vice versa.
                if f" {token} " in needle_padded:
                    length = len(token)
                    if best_contain is None or length > best_contain[0]:
                        best_contain = (length, entry)

        return exact or (best_contain[1] if best_contain else None)


# ---------------------------------------------------------------------------
# Spec lookup against a component retailer (Wootware-style site).
# ---------------------------------------------------------------------------
#
# The catalog covers ~95% of common SA prebuilt SKUs, but newer / older /
# niche parts (Ryzen 5 5500, future Blackwell variants, etc.) need a runtime
# fallback. Component retailers like Wootware publish per-SKU spec sheets in
# server-rendered HTML — we scan their CPU/GPU category for the model name,
# follow the matching product link, parse a key/value spec table, and cache
# the result on disk so subsequent runs are instant.
#
# The cache key is the catalog-style lookup string (e.g. "AMD Ryzen 5 5500"),
# slugified. Cache entries TTL after 30 days.

_SPEC_SHEET_PATTERNS: dict[str, dict[str, list[str]]] = {
    "cpu": {
        "cores": [r"(?:Number of\s+)?(?:CPU\s+)?Cores?\s*:?\s*(\d{1,3})"],
        "threads": [r"(?:Number of\s+)?Threads?\s*:?\s*(\d{1,3})"],
        "base_clock_ghz": [
            r"Base\s+Clock\s*(?:Speed)?\s*:?\s*(\d+(?:\.\d+)?)\s*GHz",
        ],
        "boost_clock_ghz": [
            r"(?:Max(?:imum)?\s+)?Boost\s+Clock\s*:?\s*(?:Up\s+to\s+)?(\d+(?:\.\d+)?)\s*GHz",
            r"Max(?:imum)?\s+Clock\s*:?\s*(?:Up\s+to\s+)?(\d+(?:\.\d+)?)\s*GHz",
        ],
        "socket": [
            r"(?:CPU\s+|Processor\s+)?Socket\s*:?\s*(AM\d|sTR\d|sTRX\d|LGA\d{3,4})",
        ],
        "tdp_watts": [
            r"(?:Default\s+|Max(?:imum)?\s+)?TDP\s*:?\s*(\d{2,4})\s*W",
            r"Thermal\s+Design\s+Power\s*:?\s*(\d{2,4})\s*W",
        ],
    },
    "gpu": {
        "vram_gb": [
            r"(?:Video\s+|Graphics\s+)?Memory(?:\s+Size)?\s*:?\s*(\d{1,3})\s*GB",
            r"VRAM\s*:?\s*(\d{1,3})\s*GB",
        ],
        "memory_type": [
            r"Memory\s+Type\s*:?\s*(GDDR\d+(?:X)?|HBM\d+)",
            r"VRAM\s+Type\s*:?\s*(GDDR\d+(?:X)?|HBM\d+)",
        ],
        "power_draw_watts": [
            r"(?:Max(?:imum)?\s+)?(?:Power\s+(?:Consumption|Draw|Usage)|Board\s+Power|TGP|TBP)\s*:?\s*(\d{2,4})\s*W",
            r"(?:Recommended\s+)?Power\s+(?:Supply|Requirements?)\s*:?\s*(\d{2,4})\s*W",
        ],
    },
}

_CACHE_TTL_DAYS = 30


class SpecLookupClient:
    """Look up component specs against a remote retailer (Wootware etc.)."""

    def __init__(
        self,
        config: SpecSourceConfig,
        fetcher: Fetcher,
        cache_dir: Path,
    ) -> None:
        self._config = config
        self._fetcher = fetcher
        self._cache_dir = cache_dir / config.name.lower().replace(" ", "-")
        self._link_indexes: dict[str, dict[str, str]] = {}
        self._last_fetch_at: float = 0.0

    @property
    def name(self) -> str:
        return self._config.name

    def lookup_cpu(self, model_text: str) -> dict[str, Any] | None:
        return self._lookup("cpu", self._config.cpu_category_url, model_text)

    def lookup_gpu(self, model_text: str) -> dict[str, Any] | None:
        return self._lookup("gpu", self._config.gpu_category_url, model_text)

    def _lookup(
        self,
        kind: str,
        category_url: str | None,
        model_text: str,
    ) -> dict[str, Any] | None:
        if not category_url or not model_text:
            return None

        cached = self._read_cache(kind, model_text)
        if cached is not None:
            return cached

        index = self._link_indexes.get(kind)
        if index is None:
            index = self._build_link_index(category_url)
            self._link_indexes[kind] = index

        product_url = self._match_url(index, model_text)
        if not product_url:
            return None

        product_html = self._polite_fetch(product_url)
        if product_html is None:
            return None

        specs = self._parse_spec_sheet(parse_html_document(product_html), kind)
        if not specs:
            return None

        specs["sourceUrl"] = product_url
        self._write_cache(kind, model_text, specs)
        return specs

    def _build_link_index(self, category_url: str) -> dict[str, str]:
        html = self._polite_fetch(category_url)
        if html is None:
            return {}
        index: dict[str, str] = {}
        for match in re.finditer(r'href="(https?://[^"]+\.html)"', html):
            url = match.group(1)
            tail = url.rsplit("/", 1)[-1]
            slug = tail[:-5] if tail.endswith(".html") else tail
            slug = slug.lower()
            if slug not in index:
                index[slug] = url
        return index

    def _match_url(self, index: dict[str, str], model_text: str) -> str | None:
        # Normalise the model text into search tokens: drop brand prefix,
        # split on whitespace, lowercase.
        normalised = re.sub(
            r"^(?:AMD|NVIDIA|Nvidia|Intel|GeForce|Radeon|Quadro)\s+",
            "",
            model_text,
            flags=re.IGNORECASE,
        ).strip().lower()
        tokens = [t for t in re.split(r"\s+", normalised) if t]
        if not tokens:
            return None

        candidates = [
            url for slug, url in index.items()
            if all(token in slug for token in tokens)
        ]
        if not candidates:
            return None
        # Prefer the shortest URL — usually the cleanest SKU page without
        # comparison / review / suffixed variant pages.
        return min(candidates, key=len)

    def _parse_spec_sheet(
        self,
        document: HtmlDocument,
        kind: str,
    ) -> dict[str, Any]:
        text = document.visible_text
        result: dict[str, Any] = {}
        for field, patterns in _SPEC_SHEET_PATTERNS[kind].items():
            value = self._first_match(patterns, text)
            if value is None:
                continue
            if field in {"cores", "threads", "tdp_watts", "vram_gb", "power_draw_watts"}:
                result[field] = int(value)
            elif field in {"base_clock_ghz", "boost_clock_ghz"}:
                result[field] = float(value)
            else:
                result[field] = value
        return result

    @staticmethod
    def _first_match(patterns: list[str], text: str) -> str | None:
        for pattern in patterns:
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _polite_fetch(self, url: str) -> str | None:
        # Honour the configured delay between fetches to this source.
        elapsed = time.monotonic() - self._last_fetch_at
        if elapsed < self._config.request_delay_seconds:
            time.sleep(self._config.request_delay_seconds - elapsed)
        try:
            text = self._fetcher.fetch_text(url)
        except (OSError, urllib.error.URLError, UnicodeDecodeError):
            return None
        finally:
            self._last_fetch_at = time.monotonic()
        return text

    def _cache_path(self, kind: str, model_text: str) -> Path:
        slug = re.sub(r"[^a-z0-9]+", "-", model_text.lower()).strip("-")
        return self._cache_dir / kind / f"{slug or 'unknown'}.json"

    def _read_cache(self, kind: str, model_text: str) -> dict[str, Any] | None:
        path = self._cache_path(kind, model_text)
        if not path.exists():
            return None
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            cached_at_raw = str(data.get("cachedAt", ""))
            cached_at = dt.datetime.fromisoformat(cached_at_raw.replace("Z", "+00:00"))
            age = dt.datetime.now(UTC) - cached_at
            if age.days > _CACHE_TTL_DAYS:
                return None
            specs = data.get("specs")
            return specs if isinstance(specs, dict) else None
        except (ValueError, KeyError):
            return None

    def _write_cache(self, kind: str, model_text: str, specs: dict[str, Any]) -> None:
        path = self._cache_path(kind, model_text)
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "cachedAt": now_iso(),
            "source": self._config.name,
            "model": model_text,
            "specs": specs,
        }
        path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def _split_brand_model(raw: str) -> tuple[str, str]:
    """Return (brand, model) from a free-form CPU / GPU label.

    Mirrors the catalog's brand-prefix-stripping so cache keys and
    component_uuid inputs stay aligned across catalog hits and lookup-only
    fallbacks.
    """
    explicit = re.match(
        r"^(AMD|NVIDIA|Nvidia|Intel)\s+(.+)$",
        raw.strip(),
        flags=re.IGNORECASE,
    )
    if explicit:
        brand = explicit.group(1).upper()
        if brand == "NVIDIA":
            brand = "NVIDIA"
        elif brand.lower() == "nvidia":
            brand = "NVIDIA"
        return brand, explicit.group(2).strip()

    lower = raw.lower()
    if "ryzen" in lower or "threadripper" in lower:
        return "AMD", raw.strip()
    if "core" in lower or "pentium" in lower or "celeron" in lower or "xeon" in lower:
        return "Intel", raw.strip()
    if "rtx" in lower or "geforce" in lower or "quadro" in lower:
        return "NVIDIA", raw.strip()
    if "radeon" in lower:
        return "AMD", raw.strip()
    return "Unknown", raw.strip()


# Body-text heuristics for parts that don't have a catalog (motherboard, PSU).
# Returns None when nothing convincing is found — workshop fills it in.

_MOBO_CHIPSET_PATTERN = re.compile(
    r"\b(B650[EM]?|X670[E]?|B850|X870[E]?|B760|Z690|Z790|B860|Z890)\b",
    re.IGNORECASE,
)
_MOBO_BRAND_PATTERN = re.compile(
    r"\b(ASUS|MSI|Gigabyte|ASRock|Biostar|NZXT|EVGA)\b(?:\s+[\w-]+)?",
    re.IGNORECASE,
)
_PSU_WATTAGE_PATTERN = re.compile(r"\b(\d{3,4})\s?W(?:atts?)?\b", re.IGNORECASE)
_PSU_RATING_PATTERN = re.compile(
    r"\b80\+?\s*(Bronze|Silver|Gold|Platinum|Titanium)\b",
    re.IGNORECASE,
)
_PSU_MODULARITY_PATTERN = re.compile(
    r"\b(Fully|Semi|Non[\s-]?)\s*modular\b",
    re.IGNORECASE,
)


def extract_motherboard_hints(text: str) -> dict[str, Any]:
    chipset_match = _MOBO_CHIPSET_PATTERN.search(text)
    brand_match = _MOBO_BRAND_PATTERN.search(text)
    return {
        "brand": brand_match.group(1).title() if brand_match else None,
        "chipset": chipset_match.group(1).upper() if chipset_match else None,
    }


def extract_psu_hints(text: str) -> dict[str, Any]:
    wattage_match = _PSU_WATTAGE_PATTERN.search(text)
    rating_match = _PSU_RATING_PATTERN.search(text)
    modularity_match = _PSU_MODULARITY_PATTERN.search(text)

    # The page may quote PSU wattage as "550W system draw" etc. To reduce
    # false positives, only accept wattages within typical PSU range and
    # paired with a known PSU keyword nearby.
    wattage: int | None = None
    if wattage_match:
        candidate = int(wattage_match.group(1))
        if 300 <= candidate <= 1800:
            wattage = candidate

    return {
        "wattage": wattage,
        "efficiency_rating": (
            f"80+ {rating_match.group(1).title()}" if rating_match else None
        ),
        "modularity": (
            modularity_match.group(1).rstrip("-").rstrip().title()
            if modularity_match
            else None
        ),
    }


def component_uuid(kind: str, brand: str | None, model: str | None) -> uuid.UUID:
    """Deterministic UUID v5 so reruns produce the same component IDs.

    Lets `pc_builds.cpu_id` reference cpus.id directly without a SELECT,
    and makes the JSON output diff-friendly.
    """
    brand_norm = (brand or "?").strip().lower()
    model_norm = (model or "?").strip().lower()
    return uuid.uuid5(uuid.NAMESPACE_URL, f"pcp:{kind}:{brand_norm}:{model_norm}")


class ProductHtmlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[Link] = []
        self.meta: dict[str, str] = {}
        self.title_parts: list[str] = []
        self.h1_parts: list[str] = []
        self.visible_parts: list[str] = []
        self.json_ld_blocks: list[str] = []

        self._tag_stack: list[str] = []
        self._ignored_depth = 0
        self._capturing_json_ld = False
        self._json_ld_parts: list[str] = []
        self._anchor_stack: list[dict[str, Any]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        attrs_dict = {name.lower(): value or "" for name, value in attrs}

        if tag == "script":
            script_type = attrs_dict.get("type", "").lower()
            if "ld+json" in script_type:
                self._capturing_json_ld = True
                self._json_ld_parts = []
            else:
                self._ignored_depth += 1
        elif tag in {"style", "noscript", "svg"}:
            self._ignored_depth += 1

        if tag == "meta":
            key = (
                attrs_dict.get("property")
                or attrs_dict.get("name")
                or attrs_dict.get("itemprop")
            )
            content = attrs_dict.get("content")
            if key and content:
                self.meta[key.lower()] = clean_text(content)

        if tag == "a" and attrs_dict.get("href"):
            self._anchor_stack.append({"href": attrs_dict["href"], "parts": []})

        self._tag_stack.append(tag)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()

        if tag == "script" and self._capturing_json_ld:
            block = "".join(self._json_ld_parts).strip()
            if block:
                self.json_ld_blocks.append(block)
            self._capturing_json_ld = False
            self._json_ld_parts = []
        elif tag in {"script", "style", "noscript", "svg"} and self._ignored_depth > 0:
            self._ignored_depth -= 1

        if tag == "a" and self._anchor_stack:
            anchor = self._anchor_stack.pop()
            self.links.append(
                Link(str(anchor["href"]), clean_text(" ".join(anchor["parts"])))
            )

        if self._tag_stack:
            self._tag_stack.pop()

    def handle_data(self, data: str) -> None:
        if self._capturing_json_ld:
            self._json_ld_parts.append(data)
            return

        if self._ignored_depth > 0:
            return

        cleaned = clean_text(data)
        if not cleaned:
            return

        current_tag = self._tag_stack[-1] if self._tag_stack else ""
        if current_tag == "title":
            self.title_parts.append(cleaned)
        elif current_tag == "h1":
            self.h1_parts.append(cleaned)

        if self._anchor_stack:
            self._anchor_stack[-1]["parts"].append(cleaned)

        self.visible_parts.append(cleaned)


def clean_text(value: str | None) -> str:
    if not value:
        return ""
    unescaped = html.unescape(value)
    return re.sub(r"\s+", " ", unescaped).strip()


def load_config(path: Path) -> tuple[list[SourceConfig], list[SpecSourceConfig]]:
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    sources = data.get("sources")
    if not isinstance(sources, list) or not sources:
        raise ValueError("Config must contain a non-empty 'sources' array.")
    spec_sources_raw = data.get("specSources") or []
    if not isinstance(spec_sources_raw, list):
        raise ValueError("'specSources' must be a list when present.")
    return (
        [SourceConfig.from_dict(source) for source in sources],
        [SpecSourceConfig.from_dict(source) for source in spec_sources_raw],
    )


def parse_html_document(markup: str) -> HtmlDocument:
    parser = ProductHtmlParser()
    parser.feed(markup)
    return HtmlDocument(
        title=clean_text(" ".join(parser.title_parts)),
        h1=clean_text(" ".join(parser.h1_parts)),
        meta=parser.meta,
        links=parser.links,
        visible_text=clean_text(" ".join(parser.visible_parts)),
        json_ld_blocks=parser.json_ld_blocks,
    )


class Fetcher:
    def __init__(self, user_agent: str, timeout_seconds: float) -> None:
        self._user_agent = user_agent
        self._timeout_seconds = timeout_seconds

    def fetch_text(self, url: str) -> str:
        parsed = urllib.parse.urlparse(url)

        if parsed.scheme == "file":
            return Path(urllib.request.url2pathname(parsed.path)).read_text(encoding="utf-8")

        if parsed.scheme == "":
            return Path(url).read_text(encoding="utf-8")

        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": self._user_agent,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-ZA,en;q=0.9",
            },
        )
        with urllib.request.urlopen(request, timeout=self._timeout_seconds) as response:
            content_type = response.headers.get_content_charset() or "utf-8"
            return response.read().decode(content_type, errors="replace")


class RobotsCache:
    def __init__(self, user_agent: str, timeout_seconds: float) -> None:
        self._user_agent = user_agent
        self._timeout_seconds = timeout_seconds
        self._cache: dict[str, urllib.robotparser.RobotFileParser | None] = {}

    def can_fetch(self, url: str) -> bool:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in {"http", "https"}:
            return True

        root = f"{parsed.scheme}://{parsed.netloc}"
        if root not in self._cache:
            self._cache[root] = self._load(root)

        parser = self._cache[root]
        if parser is None:
            return True
        return parser.can_fetch(self._user_agent, url)

    def _load(self, root: str) -> urllib.robotparser.RobotFileParser | None:
        robots_url = urllib.parse.urljoin(root, "/robots.txt")
        parser = urllib.robotparser.RobotFileParser()
        try:
            request = urllib.request.Request(
                robots_url,
                headers={"User-Agent": self._user_agent},
            )
            with urllib.request.urlopen(request, timeout=self._timeout_seconds) as response:
                lines = response.read().decode("utf-8", errors="replace").splitlines()
            parser.parse(lines)
            return parser
        except (OSError, urllib.error.URLError, UnicodeDecodeError):
            return None


def normalize_url(url: str, base_url: str) -> str | None:
    absolute = urllib.parse.urljoin(base_url, url.strip())
    parsed = urllib.parse.urlparse(absolute)

    if parsed.scheme not in {"http", "https", "file"}:
        return None
    if parsed.scheme in {"http", "https"} and not parsed.netloc:
        return None

    normalized = parsed._replace(fragment="")
    return urllib.parse.urlunparse(normalized)


def is_same_scope(candidate: str, base_url: str) -> bool:
    candidate_parsed = urllib.parse.urlparse(candidate)
    base_parsed = urllib.parse.urlparse(base_url)

    if candidate_parsed.scheme == "file" or base_parsed.scheme == "file":
        return candidate_parsed.scheme == base_parsed.scheme

    return candidate_parsed.netloc.lower() == base_parsed.netloc.lower()


def link_should_be_followed(link: Link, source: SourceConfig, current_depth: int) -> bool:
    searchable = f"{link.url} {link.text}".lower()

    if any(keyword in searchable for keyword in source.exclude_keywords):
        return False

    if any(pattern in searchable for pattern in source.product_url_patterns):
        return True

    if any(keyword in searchable for keyword in source.include_keywords):
        return True

    return current_depth == 0 and not source.include_keywords


def url_looks_like_product(url: str, source: SourceConfig) -> bool:
    lower = url.lower()
    return any(pattern in lower for pattern in source.product_url_patterns)


def text_allowed_for_source(text: str, source: SourceConfig) -> bool:
    lower = text.lower()
    if any(keyword in lower for keyword in source.exclude_keywords):
        return False
    if not source.include_keywords:
        return True
    return any(keyword in lower for keyword in source.include_keywords)


def extract_product(document: HtmlDocument, url: str, source: SourceConfig) -> Product | None:
    json_ld_products = list(extract_json_ld_products(document.json_ld_blocks))
    warnings: list[str] = []

    for item in json_ld_products:
        product = product_from_json_ld(item, document, url, source)
        if product is None:
            continue
        if text_allowed_for_source(f"{product.name} {product.description or ''} {url}", source):
            return product

    if not url_looks_like_product(url, source):
        return None

    name = first_non_empty(
        document.meta.get("og:title"),
        document.h1,
        document.title,
    )
    price_cents = extract_price_cents(document.visible_text)
    if not name or price_cents is None:
        return None

    if not text_allowed_for_source(f"{name} {document.visible_text[:1000]} {url}", source):
        return None

    description = first_non_empty(
        document.meta.get("og:description"),
        document.meta.get("description"),
    )
    image_url = absolute_optional_url(document.meta.get("og:image"), url)
    specs, spec_warnings = extract_specs(
        f"{name} {description or ''} {document.visible_text}",
        name_text=name,
    )
    warnings.extend(spec_warnings)
    confidence = compute_confidence(
        has_json_ld=False,
        name=name,
        price_cents=price_cents,
        specs=specs,
        image_url=image_url,
    )

    return Product(
        source_name=source.name,
        source_url=url,
        retailer=source.name,
        name=truncate(name, 200),
        price_cents=price_cents,
        currency=source.currency,
        image_url=image_url,
        description=truncate(description, 500) if description else None,
        specs=specs,
        confidence=confidence,
        warnings=warnings,
        scraped_at=now_iso(),
    )


def product_from_json_ld(
    item: dict[str, Any],
    document: HtmlDocument,
    url: str,
    source: SourceConfig,
) -> Product | None:
    name = first_non_empty(str_or_none(item.get("name")), document.h1, document.title)
    offer = first_offer(item.get("offers"))
    price_value = (
        value_at(offer, "price")
        or value_at(offer, "lowPrice")
        or value_at(item, "price")
    )
    price_cents = money_to_cents(price_value)
    if price_cents is None:
        price_cents = extract_price_cents(document.visible_text)

    if not name or price_cents is None:
        return None

    description = first_non_empty(
        str_or_none(item.get("description")),
        document.meta.get("og:description"),
        document.meta.get("description"),
    )
    image_url = absolute_optional_url(
        first_image(item.get("image")) or document.meta.get("og:image"),
        url,
    )
    specs, warnings = extract_specs(
        f"{name} {description or ''} {document.visible_text}",
        name_text=name,
    )
    confidence = compute_confidence(
        has_json_ld=True,
        name=name,
        price_cents=price_cents,
        specs=specs,
        image_url=image_url,
    )

    currency = (
        str_or_none(value_at(offer, "priceCurrency"))
        or str_or_none(value_at(item, "priceCurrency"))
        or source.currency
    )

    return Product(
        source_name=source.name,
        source_url=url,
        retailer=source.name,
        name=truncate(clean_product_name(name), 200),
        price_cents=price_cents,
        currency=currency.upper(),
        image_url=image_url,
        description=truncate(description, 500) if description else None,
        specs=specs,
        confidence=confidence,
        warnings=warnings,
        scraped_at=now_iso(),
    )


def extract_json_ld_products(blocks: list[str]) -> list[dict[str, Any]]:
    products: list[dict[str, Any]] = []
    for block in blocks:
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue

        for item in walk_json(data):
            if not isinstance(item, dict):
                continue
            item_type = item.get("@type")
            types = item_type if isinstance(item_type, list) else [item_type]
            if any(str(value).lower() == "product" for value in types):
                products.append(item)
    return products


def walk_json(value: Any) -> list[Any]:
    items: list[Any] = []
    if isinstance(value, list):
        for child in value:
            items.extend(walk_json(child))
    elif isinstance(value, dict):
        items.append(value)
        for key in ("@graph", "itemListElement"):
            if key in value:
                items.extend(walk_json(value[key]))
    return items


def first_offer(value: Any) -> dict[str, Any] | None:
    if isinstance(value, dict):
        return value
    if isinstance(value, list):
        for item in value:
            if isinstance(item, dict):
                return item
    return None


def value_at(value: dict[str, Any] | None, key: str) -> Any:
    if not value:
        return None
    return value.get(key)


def str_or_none(value: Any) -> str | None:
    if value is None:
        return None
    cleaned = clean_text(str(value))
    return cleaned or None


def first_non_empty(*values: str | None) -> str:
    for value in values:
        cleaned = clean_text(value)
        if cleaned:
            return cleaned
    return ""


def first_image(value: Any) -> str | None:
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        for item in value:
            found = first_image(item)
            if found:
                return found
    if isinstance(value, dict):
        return str_or_none(value.get("url")) or str_or_none(value.get("contentUrl"))
    return None


def absolute_optional_url(value: str | None, base_url: str) -> str | None:
    if not value:
        return None
    return urllib.parse.urljoin(base_url, value)


def clean_product_name(value: str) -> str:
    cleaned = clean_text(value)
    cleaned = re.sub(r"\s+[|/-]\s+Buy\s+Online.*$", "", cleaned, flags=re.IGNORECASE)
    return cleaned


PRICE_PATTERN = re.compile(
    r"(?:\bZAR\b|R)\s*([0-9]{1,3}(?:[ ,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+(?:[.,][0-9]{2})?)",
    re.IGNORECASE,
)


def extract_price_cents(text: str) -> int | None:
    matches = PRICE_PATTERN.findall(text)
    prices = [money_to_cents(match) for match in matches]
    valid_prices = [price for price in prices if price is not None and price >= 1_000_00]
    if not valid_prices:
        return None
    return max(valid_prices)


def money_to_cents(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        if not math.isfinite(float(value)):
            return None
        return int(round(float(value) * 100))

    raw = clean_text(str(value))
    raw = raw.replace("R", "").replace("ZAR", "").replace("\u00a0", " ").strip()
    raw = re.sub(r"[^0-9,.\s]", "", raw)
    if not raw:
        return None

    compact = raw.replace(" ", "")
    comma = compact.rfind(",")
    dot = compact.rfind(".")

    decimal_separator = ""
    if comma >= 0 and dot >= 0:
        decimal_separator = "," if comma > dot else "."
    elif comma >= 0 and len(compact) - comma - 1 == 2:
        decimal_separator = ","
    elif dot >= 0 and len(compact) - dot - 1 == 2:
        decimal_separator = "."

    if decimal_separator:
        thousands_separator = "." if decimal_separator == "," else ","
        normalized = compact.replace(thousands_separator, "")
        normalized = normalized.replace(decimal_separator, ".")
    else:
        normalized = re.sub(r"[,.]", "", compact)

    try:
        return int(round(float(normalized) * 100))
    except ValueError:
        return None


# When the body text adds a tail to the name's spec, allow the longer body
# variant only if the tail is a clarifier (numeric speed/gen, or one of the
# named labels). Anything else (Ti, SUPER, XT) is rejected because it changes
# the underlying product, not the label.
_RICHER_TAIL = re.compile(
    r"[-\s]+(?:\d[\d\s]*|SSD|HDD|Gen\s?\d+|GDDR\d+)",
    re.IGNORECASE,
)


SPEC_PATTERNS = {
    "cpu": [
        r"\b((?:AMD\s+)?Ryzen\s+(?:Threadripper\s+)?(?:[3579]\s+)?\d{4,5}[A-Z0-9]{0,4})\b",
        r"\b(Threadripper\s+\d{4,5}[A-Z0-9]{0,4})\b",
        r"\b((?:Intel\s+)?Core\s+Ultra\s+[3579]\s+\d{3,5}[A-Z]{0,3})\b",
        r"\b((?:Intel\s+)?Core\s+[3579]\s+\d{4,5}[A-Z]{0,3})\b",
        r"\b(Intel\s+(?:Core\s+)?i[3579]-\d{4,5}[A-Z]{0,3})\b",
    ],
    "gpu": [
        # Workstation cards first — these must match before the generic
        # consumer pattern below or "RTX 5000 Ada" loses its "Ada" suffix
        # and becomes the non-existent "RTX 5000" consumer SKU.
        r"\b((?:NVIDIA\s+|Quadro\s+)?RTX\s+A\d{4,5})\b",
        r"\b((?:NVIDIA\s+|Quadro\s+)?RTX\s*\d{4}\s+Ada(?:\s+Generation)?)\b",
        r"\b((?:NVIDIA\s+)?RTX\s+PRO\s+\d{4,5}(?:\s+(?:Blackwell|Ada))?)\b",
        r"\b(Radeon\s+PRO\s+W\d{4})\b",
        # Consumer cards.
        r"\b((?:NVIDIA\s+|GeForce\s+)?RTX\s?\d{4}\s?(?:Ti SUPER|Ti|SUPER)?)\b",
        r"\b(Radeon\s+RX\s?\d{4}\s?(?:XT|XTX|GRE)?)\b",
        r"\b(Intel\s+Arc\s+[A-Z]\d{3})\b",
    ],
    "ram": [
        r"\b(\d{1,3}\s?GB\s+(?:DDR[345]|DDR5|DDR4)(?:[-\s]?\d{3,5})?)\b",
    ],
    "storage": [
        r"\b((?:\d+(?:\.\d+)?\s?TB|\d{3,4}\s?GB)\s+(?:NVMe(?:\s+SSD)?|SSD|HDD)(?:\s+Gen\s?\d)?)\b",
    ],
}


def extract_specs(
    text: str,
    *,
    name_text: str | None = None,
) -> tuple[dict[str, str], list[str]]:
    """Pull CPU / GPU / RAM / storage out of free-form text.

    Two-stage to avoid related-product spec bleed: when ``name_text`` is
    provided, match it first and use those hits for the field. Only fall
    back to the full text when the product name doesn't name the part.
    Without this, a page footer / "you may also like" carousel can hijack
    the spec because ``sorted(by length, reverse=True)[0]`` prefers the
    longer matching variant (e.g. "RTX 5060 Ti" beats the actual "RTX 5060"
    on a non-Ti listing).
    """

    specs: dict[str, str] = {}
    warnings: list[str] = []

    def matches_for(corpus: str, patterns: list[str]) -> list[str]:
        found: list[str] = []
        for pattern in patterns:
            for match in re.finditer(pattern, corpus, flags=re.IGNORECASE):
                found.append(normalize_spec(match.group(1)))
        return remove_redundant_specs(dedupe(found))

    for field, patterns in SPEC_PATTERNS.items():
        name_hits = matches_for(name_text, patterns) if name_text else []
        full_hits = matches_for(text, patterns)

        if name_hits:
            # Prefer the name's identification, but borrow a richer variant
            # from full text when the difference is purely additive labelling:
            #   - a brand prefix in front  ("AMD Ryzen 7 9700X" ends with
            #     name's "Ryzen 7 9700X"), or
            #   - a clarifier tail at the back: numeric speed/gen, or one of
            #     the known clarifier words (SSD, HDD, Gen N, GDDR N).
            # Critically this does NOT promote "RTX 5060 Ti" over a name that
            # says "RTX 5060" — bare alphabetic suffixes like Ti / SUPER / XT
            # change the product, not the label, so they're rejected.
            chosen: list[str] = []
            for name_hit in name_hits:
                name_lower = name_hit.lower()
                richer: list[str] = []
                for hit in full_hits:
                    if len(hit) <= len(name_hit):
                        continue
                    hit_lower = hit.lower()
                    if hit_lower.endswith(name_lower):
                        richer.append(hit)  # brand prefix added in front
                    elif hit_lower.startswith(name_lower):
                        tail = hit[len(name_hit):]
                        if _RICHER_TAIL.fullmatch(tail):
                            richer.append(hit)  # clarifier appended at back
                if richer:
                    chosen.append(sorted(richer, key=len, reverse=True)[0])
                else:
                    chosen.append(name_hit)
            unique = remove_redundant_specs(dedupe(chosen))
        else:
            unique = full_hits

        if field == "storage" and unique:
            ordered = sorted(unique, key=len, reverse=True)
            specs[field] = " + ".join(ordered[:2])
        elif unique:
            specs[field] = sorted(unique, key=len, reverse=True)[0]
        else:
            specs[field] = f"Review {field.upper()}"
            warnings.append(f"Could not confidently extract {field}.")

    return specs, warnings


def normalize_spec(value: str) -> str:
    cleaned = clean_text(value)
    cleaned = re.sub(r"\s+", " ", cleaned)
    replacements = {
        "rtx": "RTX",
        "gtx": "GTX",
        "ddr": "DDR",
        "nvme": "NVMe",
        "ssd": "SSD",
        "hdd": "HDD",
        "gb": "GB",
        "tb": "TB",
    }
    for needle, replacement in replacements.items():
        cleaned = re.sub(needle, replacement, cleaned, flags=re.IGNORECASE)
    return cleaned.strip(" -|,")


def dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        key = value.lower()
        if key not in seen:
            seen.add(key)
            result.append(value)
    return result


def remove_redundant_specs(values: list[str]) -> list[str]:
    ordered = sorted(values, key=len, reverse=True)
    result: list[str] = []
    for value in ordered:
        if any(value.lower() in kept.lower() for kept in result):
            continue
        result.append(value)
    return result


def compute_confidence(
    *,
    has_json_ld: bool,
    name: str,
    price_cents: int | None,
    specs: dict[str, str],
    image_url: str | None,
) -> float:
    score = 0.15 if has_json_ld else 0.0
    if name:
        score += 0.2
    if price_cents:
        score += 0.25
    if image_url:
        score += 0.1
    score += 0.075 * sum(1 for value in specs.values() if not value.startswith("Review "))
    return round(min(score, 1.0), 3)


def scrape_sources(
    sources: list[SourceConfig],
    *,
    fetcher: Fetcher,
    robots: RobotsCache | None,
    max_products: int | None,
) -> tuple[list[Product], dict[str, Any]]:
    products_by_url: dict[str, Product] = {}
    stats: dict[str, Any] = {
        "pagesScanned": 0,
        "pagesSkippedByRobots": 0,
        "fetchErrors": [],
    }

    for source in sources:
        queue: deque[tuple[str, int]] = deque()
        visited: set[str] = set()

        for start_url in expand_start_urls(source, fetcher, stats):
            normalized = normalize_url(start_url, source.base_url)
            if normalized:
                queue.append((normalized, 0))

        pages_for_source = 0
        while queue and pages_for_source < source.max_pages:
            if max_products is not None and len(products_by_url) >= max_products:
                return list(products_by_url.values()), stats

            url, depth = queue.popleft()
            if url in visited:
                continue
            visited.add(url)

            if not is_same_scope(url, source.base_url):
                continue

            if robots is not None and not robots.can_fetch(url):
                stats["pagesSkippedByRobots"] += 1
                continue

            try:
                markup = fetcher.fetch_text(url)
            except (OSError, urllib.error.URLError, UnicodeDecodeError) as exc:
                stats["fetchErrors"].append({"url": url, "error": str(exc)})
                continue

            pages_for_source += 1
            stats["pagesScanned"] += 1
            document = parse_html_document(markup)
            product = extract_product(document, url, source)
            if product:
                products_by_url[url] = product

            if depth >= source.max_depth:
                continue

            for link in document.links:
                normalized = normalize_url(link.url, url)
                if not normalized or normalized in visited:
                    continue
                if not is_same_scope(normalized, source.base_url):
                    continue
                if not link_should_be_followed(
                    Link(normalized, link.text),
                    source,
                    depth,
                ):
                    continue
                queue.append((normalized, depth + 1))

            if source.request_delay_seconds > 0:
                time.sleep(source.request_delay_seconds)

    return list(products_by_url.values()), stats


def expand_start_urls(
    source: SourceConfig,
    fetcher: Fetcher,
    stats: dict[str, Any],
) -> list[str]:
    urls = list(source.urls)
    if not source.sitemap_url:
        return urls

    sitemap_url = normalize_url(source.sitemap_url, source.base_url)
    if not sitemap_url:
        return urls

    try:
        sitemap = fetcher.fetch_text(sitemap_url)
    except (OSError, urllib.error.URLError, UnicodeDecodeError) as exc:
        stats["fetchErrors"].append({"url": sitemap_url, "error": str(exc)})
        return urls

    locs = re.findall(r"<loc>\s*([^<]+)\s*</loc>", sitemap, flags=re.IGNORECASE)
    for loc in locs:
        decoded = html.unescape(clean_text(loc))
        searchable = decoded.lower()
        if source.product_url_patterns and not any(
            pattern in searchable for pattern in source.product_url_patterns
        ):
            continue
        if source.exclude_keywords and any(
            keyword in searchable for keyword in source.exclude_keywords
        ):
            continue
        urls.append(decoded)
    return dedupe(urls)


def build_inventory(
    products: list[Product],
    catalog: Catalog,
    *,
    build_status: str,
    spec_clients: list["SpecLookupClient"] | None = None,
) -> dict[str, Any]:
    """Project scraped products onto the pc_builds + cpus + gpus + motherboards
    + psus schema. Components are deduplicated by (brand, model) — one row
    per SKU, regardless of how many builds reference it.

    Engineering specs (cores, threads, TDP, VRAM, memory_type, etc.) come
    from the static catalog. Motherboard / PSU rows are best-effort from
    page text and frequently NULL — workshop fills them in.
    """

    cpu_rows: dict[tuple[str, str], dict[str, Any]] = {}
    gpu_rows: dict[tuple[str, str], dict[str, Any]] = {}
    mobo_rows: dict[tuple[str, str], dict[str, Any]] = {}
    psu_rows: dict[tuple[str, str], dict[str, Any]] = {}
    pc_build_rows: list[dict[str, Any]] = []

    schema_status = _to_pc_build_status(build_status)

    for product in sorted(products, key=lambda item: item.price_cents, reverse=True):
        specs = product.specs
        warnings = list(product.warnings)

        cpu_id = _resolve_cpu(specs.get("cpu"), catalog, cpu_rows, warnings, spec_clients)
        gpu_id = _resolve_gpu(specs.get("gpu"), catalog, gpu_rows, warnings, spec_clients)
        haystack = f"{product.name} {product.description or ''}"
        mobo_id = _resolve_motherboard(haystack, mobo_rows, warnings)
        psu_id = _resolve_psu(haystack, psu_rows, warnings)

        build_id = component_uuid("pc_build", product.retailer, product.source_url)

        pc_build_rows.append(
            {
                "id": str(build_id),
                "name": truncate(product.name, 150),
                "slug": slugify(product.name),
                "short_description": build_tagline(product),
                "full_description": product.description,
                "estimated_value": product.price_cents / 100,
                "cash_alternative_value": _cash_alternative_value(product.price_cents),
                "build_status": schema_status,
                "is_featured": False,
                "cpu_id": str(cpu_id) if cpu_id else None,
                "gpu_id": str(gpu_id) if gpu_id else None,
                "motherboard_id": str(mobo_id) if mobo_id else None,
                "psu_id": str(psu_id) if psu_id else None,
                "source_product_url": product.source_url,
                "source_retailer": product.retailer,
                "source_image_url": product.image_url,
                "scrape_confidence": product.confidence,
                "scrape_warnings": warnings,
                "raw_specs": dict(specs),
            }
        )

    return {
        "cpus": list(cpu_rows.values()),
        "gpus": list(gpu_rows.values()),
        "motherboards": list(mobo_rows.values()),
        "psus": list(psu_rows.values()),
        "pc_builds": pc_build_rows,
    }


def _to_pc_build_status(value: str) -> str:
    return {
        "live": "Active",
        "closing-soon": "Active",
        "sold-out": "Archived",
        "upcoming": "Draft",
    }.get(value, "Draft")


def _cash_alternative_value(prize_value_cents: int) -> float:
    return ((int(prize_value_cents * 0.88) // 10_000) * 10_000) / 100


def _resolve_cpu(
    raw: str | None,
    catalog: Catalog,
    rows: dict[tuple[str, str], dict[str, Any]],
    warnings: list[str],
    spec_clients: list["SpecLookupClient"] | None = None,
) -> uuid.UUID | None:
    if not raw or raw.startswith("Review "):
        warnings.append("CPU model not extracted from page.")
        return None

    entry = catalog.lookup_cpu(raw)
    if entry is not None:
        key = (entry.brand, entry.model)
        cpu_id = component_uuid("cpu", entry.brand, entry.model)
        if key not in rows:
            rows[key] = {
                "id": str(cpu_id),
                "brand": entry.brand,
                "model": entry.model,
                "cores": entry.data.get("cores"),
                "threads": entry.data.get("threads"),
                "base_clock_ghz": entry.data.get("base_clock_ghz"),
                "boost_clock_ghz": entry.data.get("boost_clock_ghz"),
                "socket": entry.data.get("socket"),
                "tdp_watts": entry.data.get("tdp_watts"),
            }
        return cpu_id

    # Catalog miss — try the spec lookup sources.
    for client in spec_clients or []:
        looked_up = client.lookup_cpu(raw)
        if not looked_up:
            continue
        brand, model = _split_brand_model(raw)
        key = (brand, model)
        cpu_id = component_uuid("cpu", brand, model)
        if key not in rows:
            rows[key] = {
                "id": str(cpu_id),
                "brand": brand,
                "model": model,
                "cores": looked_up.get("cores"),
                "threads": looked_up.get("threads"),
                "base_clock_ghz": looked_up.get("base_clock_ghz"),
                "boost_clock_ghz": looked_up.get("boost_clock_ghz"),
                "socket": looked_up.get("socket"),
                "tdp_watts": looked_up.get("tdp_watts"),
            }
        warnings.append(
            f"CPU '{raw}' filled from {client.name} (consider adding to catalog/cpus.json)."
        )
        return cpu_id

    warnings.append(
        f"CPU '{raw}' not in catalog or spec sources — add an entry to catalog/cpus.json."
    )
    return None


def _resolve_gpu(
    raw: str | None,
    catalog: Catalog,
    rows: dict[tuple[str, str], dict[str, Any]],
    warnings: list[str],
    spec_clients: list["SpecLookupClient"] | None = None,
) -> uuid.UUID | None:
    if not raw or raw.startswith("Review "):
        warnings.append("GPU model not extracted from page.")
        return None

    entry = catalog.lookup_gpu(raw)
    if entry is not None:
        key = (entry.brand, entry.model)
        gpu_id = component_uuid("gpu", entry.brand, entry.model)
        if key not in rows:
            rows[key] = {
                "id": str(gpu_id),
                "brand": entry.brand,
                "model": entry.model,
                "vram_gb": entry.data.get("vram_gb"),
                "memory_type": entry.data.get("memory_type"),
                "power_draw_watts": entry.data.get("power_draw_watts"),
            }
        return gpu_id

    # Catalog miss — try the spec lookup sources.
    for client in spec_clients or []:
        looked_up = client.lookup_gpu(raw)
        if not looked_up:
            continue
        brand, model = _split_brand_model(raw)
        key = (brand, model)
        gpu_id = component_uuid("gpu", brand, model)
        if key not in rows:
            rows[key] = {
                "id": str(gpu_id),
                "brand": brand,
                "model": model,
                "vram_gb": looked_up.get("vram_gb"),
                "memory_type": looked_up.get("memory_type"),
                "power_draw_watts": looked_up.get("power_draw_watts"),
            }
        warnings.append(
            f"GPU '{raw}' filled from {client.name} (consider adding to catalog/gpus.json)."
        )
        return gpu_id

    warnings.append(
        f"GPU '{raw}' not in catalog or spec sources — add an entry to catalog/gpus.json."
    )
    return None


def _resolve_motherboard(
    text: str,
    rows: dict[tuple[str, str], dict[str, Any]],
    warnings: list[str],
) -> uuid.UUID | None:
    hints = extract_motherboard_hints(text)
    brand = hints.get("brand")
    chipset = hints.get("chipset")
    if not brand and not chipset:
        warnings.append(
            "Motherboard not found on page — workshop needs to fill in `motherboards`."
        )
        return None

    model = chipset or f"{brand or 'Unknown'} board"
    key = (brand or "Unknown", model)
    mobo_id = component_uuid("motherboard", brand or "Unknown", model)
    if key not in rows:
        rows[key] = {
            "id": str(mobo_id),
            "brand": brand,
            "model": model,
            "chipset": chipset,
            "socket": None,
            "form_factor": None,
            "ram_type": None,
            "max_ram_gb": None,
        }
    return mobo_id


def _resolve_psu(
    text: str,
    rows: dict[tuple[str, str], dict[str, Any]],
    warnings: list[str],
) -> uuid.UUID | None:
    hints = extract_psu_hints(text)
    wattage = hints.get("wattage")
    if not wattage:
        warnings.append(
            "PSU wattage not found on page — workshop needs to fill in `psus`."
        )
        return None

    brand = "Unknown"
    model = f"{wattage}W"
    key = (brand, model)
    psu_id = component_uuid("psu", brand, model)
    if key not in rows:
        rows[key] = {
            "id": str(psu_id),
            "brand": brand,
            "model": model,
            "wattage": wattage,
            "efficiency_rating": hints.get("efficiency_rating"),
            "modularity": hints.get("modularity"),
        }
    return psu_id


def build_competition_drafts(products: list[Product], status: str) -> list[dict[str, Any]]:
    close_at = next_wave_close_at(dt.datetime.now(UTC))
    close_at_text = close_at.isoformat(timespec="milliseconds").replace("+00:00", "Z")
    drafts: list[dict[str, Any]] = []

    for product in sorted(products, key=lambda item: item.price_cents, reverse=True):
        specs = product.specs
        drafts.append(
            {
                "id": f"c-scraped-{stable_hash(product.source_url)[:10]}",
                "slug": slugify(product.name),
                "name": truncate(product.name, 200),
                "buildTagline": build_tagline(product),
                "status": status,
                "prizeValueCents": product.price_cents,
                "entryPriceCents": entry_price_cents(product.price_cents),
                "cashAlternativeCents": cash_alternative_cents(product.price_cents),
                "totalEntries": total_entries_for_price(product.price_cents),
                "entriesSold": 0,
                "closesAt": close_at_text,
                "specs": {
                    "cpu": specs["cpu"],
                    "gpu": specs["gpu"],
                    "ram": specs["ram"],
                    "storage": specs["storage"],
                },
                "accentHue": int(stable_hash(product.source_url)[:6], 16) % 360,
                "sourceProductUrl": product.source_url,
                "sourceRetailer": product.retailer,
                "sourceImageUrl": product.image_url,
                "scrapeConfidence": product.confidence,
            }
        )

    return drafts


def build_tagline(product: Product) -> str:
    specs = product.specs
    if all(not specs[key].startswith("Review ") for key in ("cpu", "gpu", "ram", "storage")):
        return truncate(
            f"{specs['gpu']} build with {specs['cpu']}, {specs['ram']}, and {specs['storage']}.",
            500,
        )
    return truncate(f"Prebuilt desktop from {product.retailer}. Review specs before publishing.", 500)


def entry_price_cents(prize_value_cents: int) -> int:
    rand_value = prize_value_cents / 100
    if rand_value < 20_000:
        return 1_000
    if rand_value < 45_000:
        return 2_500
    if rand_value < 75_000:
        return 5_000
    if rand_value < 130_000:
        return 10_000
    return 15_000


def total_entries_for_price(prize_value_cents: int) -> int:
    entry = entry_price_cents(prize_value_cents)
    if entry <= 1_000:
        return 18_000
    if entry <= 2_500:
        return 16_000
    if entry <= 5_000:
        return 14_000
    if entry <= 10_000:
        return 12_000
    return 9_500


def cash_alternative_cents(prize_value_cents: int) -> int:
    return (int(prize_value_cents * 0.88) // 10_000) * 10_000


def next_wave_close_at(from_utc: dt.datetime) -> dt.datetime:
    candidate = from_utc.astimezone(SAST) + dt.timedelta(days=7)
    while candidate.weekday() != 6:
        candidate += dt.timedelta(days=1)
    close_sast = dt.datetime(
        candidate.year,
        candidate.month,
        candidate.day,
        23,
        59,
        59,
        999000,
        tzinfo=SAST,
    )
    return close_sast.astimezone(UTC)


def slugify(value: str) -> str:
    normalized = value.lower()
    normalized = re.sub(r"[^a-z0-9]+", "-", normalized)
    normalized = normalized.strip("-")
    return normalized[:110].strip("-") or f"build-{stable_hash(value)[:8]}"


def stable_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def truncate(value: str, length: int) -> str:
    cleaned = clean_text(value)
    if len(cleaned) <= length:
        return cleaned
    return cleaned[: length - 1].rstrip() + "..."


def now_iso() -> str:
    return dt.datetime.now(UTC).isoformat(timespec="seconds").replace("+00:00", "Z")


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_sql(path: Path, competitions: list[dict[str, Any]], status: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    statements = [
        "-- Generated by tools/pc-prebuild-scraper/scrape_prebuilds.py",
        "-- Review all scraped values before applying to a shared database.",
        "",
    ]
    backend_status = to_backend_status(status)
    for competition in competitions:
        values = {
            "Id": str(new_guid_v7()),
            "Slug": competition["slug"],
            "Name": competition["name"],
            "BuildTagline": competition["buildTagline"],
            "Status": backend_status,
            "PrizeValueCents": competition["prizeValueCents"],
            "EntryPriceCents": competition["entryPriceCents"],
            "CashAlternativeCents": competition["cashAlternativeCents"],
            "TotalEntries": competition["totalEntries"],
            "EntriesSold": competition["entriesSold"],
            "ClosesAt": competition["closesAt"],
            "AccentHue": competition["accentHue"],
            "spec_cpu": competition["specs"]["cpu"],
            "spec_gpu": competition["specs"]["gpu"],
            "spec_ram": competition["specs"]["ram"],
            "spec_storage": competition["specs"]["storage"],
        }

        statements.append(
            """INSERT INTO competitions (
    "Id", "Slug", "Name", "BuildTagline", "Status",
    "PrizeValueCents", "EntryPriceCents", "CashAlternativeCents",
    "TotalEntries", "EntriesSold", "ClosesAt", "AccentHue",
    spec_cpu, spec_gpu, spec_ram, spec_storage
) VALUES (
    {Id}, {Slug}, {Name}, {BuildTagline}, {Status},
    {PrizeValueCents}, {EntryPriceCents}, {CashAlternativeCents},
    {TotalEntries}, {EntriesSold}, {ClosesAt}, {AccentHue},
    {spec_cpu}, {spec_gpu}, {spec_ram}, {spec_storage}
)
ON CONFLICT ("Slug") DO UPDATE SET
    "Name" = EXCLUDED."Name",
    "BuildTagline" = EXCLUDED."BuildTagline",
    "Status" = EXCLUDED."Status",
    "PrizeValueCents" = EXCLUDED."PrizeValueCents",
    "EntryPriceCents" = EXCLUDED."EntryPriceCents",
    "CashAlternativeCents" = EXCLUDED."CashAlternativeCents",
    "TotalEntries" = EXCLUDED."TotalEntries",
    "ClosesAt" = EXCLUDED."ClosesAt",
    "AccentHue" = EXCLUDED."AccentHue",
    spec_cpu = EXCLUDED.spec_cpu,
    spec_gpu = EXCLUDED.spec_gpu,
    spec_ram = EXCLUDED.spec_ram,
    spec_storage = EXCLUDED.spec_storage;
""".format(
                **{key: sql_value(value) for key, value in values.items()}
            )
        )

    path.write_text("\n".join(statements), encoding="utf-8")


def to_backend_status(frontend_status: str) -> str:
    return {
        "live": "Live",
        "closing-soon": "ClosingSoon",
        "sold-out": "SoldOut",
        "upcoming": "Upcoming",
    }[frontend_status]


def sql_value(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"


def write_inventory_sql(path: Path, inventory: dict[str, Any]) -> None:
    """Emit upserts for cpus / gpus / motherboards / psus / pc_builds.

    Component tables are deduplicated by (brand, model) — `ON CONFLICT` uses
    a uniqueness constraint that the user's DDL doesn't declare yet, so
    we comment it inline as a heads-up. UUIDs are deterministic (UUID v5
    by kind+brand+model) so reruns are idempotent and pc_builds can
    reference component IDs directly without subqueries.
    """

    path.parent.mkdir(parents=True, exist_ok=True)
    statements: list[str] = [
        "-- Generated by tools/pc-prebuild-scraper/scrape_prebuilds.py",
        "-- Review all scraped values before applying to a shared database.",
        "--",
        "-- Pre-conditions:",
        "--   * pc_builds has columns: cpu_id, gpu_id, motherboard_id, psu_id (nullable UUID)",
        "--   * Each component table has a UNIQUE (brand, model) constraint",
        "--     (add it if you want ON CONFLICT (brand, model) to dedupe across runs)",
        "",
    ]

    for row in inventory["cpus"]:
        statements.append(_upsert_cpu(row))
    for row in inventory["gpus"]:
        statements.append(_upsert_gpu(row))
    for row in inventory["motherboards"]:
        statements.append(_upsert_motherboard(row))
    for row in inventory["psus"]:
        statements.append(_upsert_psu(row))
    for row in inventory["pc_builds"]:
        statements.append(_upsert_pc_build(row))

    path.write_text("\n".join(statements), encoding="utf-8")


def _upsert_cpu(row: dict[str, Any]) -> str:
    cols = ["id", "brand", "model", "cores", "threads", "base_clock_ghz",
            "boost_clock_ghz", "socket", "tdp_watts"]
    return _format_upsert("cpus", row, cols, conflict_target="(brand, model)")


def _upsert_gpu(row: dict[str, Any]) -> str:
    cols = ["id", "brand", "model", "vram_gb", "memory_type", "power_draw_watts"]
    return _format_upsert("gpus", row, cols, conflict_target="(brand, model)")


def _upsert_motherboard(row: dict[str, Any]) -> str:
    cols = ["id", "brand", "model", "chipset", "socket", "form_factor",
            "ram_type", "max_ram_gb"]
    return _format_upsert("motherboards", row, cols, conflict_target="(brand, model)")


def _upsert_psu(row: dict[str, Any]) -> str:
    cols = ["id", "brand", "model", "wattage", "efficiency_rating", "modularity"]
    return _format_upsert("psus", row, cols, conflict_target="(brand, model)")


def _upsert_pc_build(row: dict[str, Any]) -> str:
    cols = [
        "id", "name", "slug", "short_description", "full_description",
        "estimated_value", "cash_alternative_value", "build_status",
        "is_featured", "cpu_id", "gpu_id", "motherboard_id", "psu_id",
    ]
    return _format_upsert("pc_builds", row, cols, conflict_target="(slug)")


def _format_upsert(
    table: str,
    row: dict[str, Any],
    cols: list[str],
    *,
    conflict_target: str,
) -> str:
    cols_sql = ", ".join(cols)
    values_sql = ", ".join(sql_value(row.get(col)) for col in cols)
    update_cols = [col for col in cols if col != "id"]
    update_sql = ",\n    ".join(f"{col} = EXCLUDED.{col}" for col in update_cols)
    return (
        f"INSERT INTO {table} ({cols_sql})\n"
        f"VALUES ({values_sql})\n"
        f"ON CONFLICT {conflict_target} DO UPDATE SET\n"
        f"    {update_sql};\n"
    )


def new_guid_v7() -> uuid.UUID:
    uuid7 = getattr(uuid, "uuid7", None)
    if uuid7:
        return uuid7()
    return uuid.uuid4()


def products_to_dicts(products: list[Product]) -> list[dict[str, Any]]:
    return [dataclasses.asdict(product) for product in products]


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scrape prebuilt PC product pages.")
    parser.add_argument("--config", type=Path, required=True, help="Path to source config JSON.")
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("tools/pc-prebuild-scraper/output/prebuilt-pcs.json"),
        help="Raw normalized product JSON output path.",
    )
    parser.add_argument(
        "--competitions-out",
        type=Path,
        default=Path("tools/pc-prebuild-scraper/output/competition-drafts.json"),
        help="Competition draft JSON output path.",
    )
    parser.add_argument(
        "--sql-out",
        type=Path,
        default=None,
        help="Optional PostgreSQL upsert script for the legacy `competitions` table.",
    )
    parser.add_argument(
        "--inventory-out",
        type=Path,
        default=Path("tools/pc-prebuild-scraper/output/inventory.json"),
        help="Structured inventory JSON matching pc_builds / cpus / gpus / motherboards / psus.",
    )
    parser.add_argument(
        "--inventory-sql-out",
        type=Path,
        default=None,
        help="Optional PostgreSQL upsert script for the pc_builds + component tables.",
    )
    parser.add_argument(
        "--catalog-dir",
        type=Path,
        default=Path("tools/pc-prebuild-scraper/catalog"),
        help="Directory containing cpus.json / gpus.json static catalogs.",
    )
    parser.add_argument(
        "--spec-cache-dir",
        type=Path,
        default=Path("tools/pc-prebuild-scraper/catalog/.spec-cache"),
        help="Where to cache spec-lookup responses (30-day TTL).",
    )
    parser.add_argument(
        "--no-spec-fallback",
        action="store_true",
        help="Disable the catalog-miss spec lookup against specSources.",
    )
    parser.add_argument(
        "--status",
        choices=["live", "closing-soon", "sold-out", "upcoming"],
        default="upcoming",
        help="Status to use for generated competition drafts / pc_builds.",
    )
    parser.add_argument("--max-products", type=int, default=None)
    parser.add_argument("--timeout-seconds", type=float, default=20.0)
    parser.add_argument("--user-agent", default=DEFAULT_USER_AGENT)
    parser.add_argument(
        "--no-robots",
        action="store_true",
        help="Disable robots.txt checks. Use only for local fixtures or with permission.",
    )
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    sources, spec_sources = load_config(args.config)
    catalog = Catalog.load(args.catalog_dir)
    fetcher = Fetcher(args.user_agent, args.timeout_seconds)
    robots = None if args.no_robots else RobotsCache(args.user_agent, args.timeout_seconds)

    spec_clients: list[SpecLookupClient] = []
    if not args.no_spec_fallback:
        for spec_source in spec_sources:
            spec_clients.append(SpecLookupClient(spec_source, fetcher, args.spec_cache_dir))

    products, stats = scrape_sources(
        sources,
        fetcher=fetcher,
        robots=robots,
        max_products=args.max_products,
    )
    competitions = build_competition_drafts(products, args.status)
    inventory = build_inventory(
        products,
        catalog,
        build_status=args.status,
        spec_clients=spec_clients,
    )

    raw_output = {
        "generatedAt": now_iso(),
        "sourceCount": len(sources),
        "stats": stats,
        "products": products_to_dicts(products),
    }
    write_json(args.out, raw_output)
    write_json(args.competitions_out, {"generatedAt": now_iso(), "competitions": competitions})
    write_json(args.inventory_out, {"generatedAt": now_iso(), **inventory})

    if args.sql_out:
        write_sql(args.sql_out, competitions, args.status)
    if args.inventory_sql_out:
        write_inventory_sql(args.inventory_sql_out, inventory)

    print(
        f"Scraped {len(products)} product(s) from {stats['pagesScanned']} page(s). "
        f"Wrote {args.out}, {args.competitions_out}, {args.inventory_out}."
    )
    print(
        f"Inventory: {len(inventory['pc_builds'])} build(s), "
        f"{len(inventory['cpus'])} cpu(s), {len(inventory['gpus'])} gpu(s), "
        f"{len(inventory['motherboards'])} motherboard(s), {len(inventory['psus'])} psu(s)."
    )
    if args.sql_out:
        print(f"Wrote competitions SQL seed file {args.sql_out}.")
    if args.inventory_sql_out:
        print(f"Wrote inventory SQL seed file {args.inventory_sql_out}.")

    if stats["fetchErrors"]:
        print(f"Fetch errors: {len(stats['fetchErrors'])}. See output JSON stats.", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
