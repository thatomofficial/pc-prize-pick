from __future__ import annotations

import datetime as dt
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scrape_prebuilds import (  # noqa: E402
    Catalog,
    Fetcher,
    SourceConfig,
    SpecLookupClient,
    SpecSourceConfig,
    build_competition_drafts,
    build_inventory,
    component_uuid,
    extract_product,
    learn_catalog,
    next_wave_close_at,
    parse_html_document,
    scrape_sources,
)


class _FixtureFetcher:
    """Stand-in for Fetcher that resolves URLs from a fixed dict of
    URL → local fixture path. Lets the SpecLookupClient tests run fully
    offline without going through file:// URLs in the category HTML."""

    def __init__(self, url_to_path: dict[str, Path]) -> None:
        self._urls = url_to_path
        self.calls: list[str] = []

    def fetch_text(self, url: str) -> str:
        self.calls.append(url)
        path = self._urls.get(url)
        if path is None:
            raise OSError(f"no fixture for {url}")
        return path.read_text(encoding="utf-8")


FIXTURES = Path(__file__).resolve().parent / "fixtures"


class ScrapePrebuildsTests(unittest.TestCase):
    def test_extracts_json_ld_product_specs_and_price(self) -> None:
        source = sample_source()
        product_url = (FIXTURES / "sample-product.html").as_uri()
        document = parse_html_document((FIXTURES / "sample-product.html").read_text())

        product = extract_product(document, product_url, source)

        self.assertIsNotNone(product)
        assert product is not None
        self.assertEqual(product.price_cents, 4_299_900)
        self.assertEqual(product.currency, "ZAR")
        self.assertEqual(product.specs["cpu"], "AMD Ryzen 7 9700X")
        self.assertEqual(product.specs["gpu"], "NVIDIA RTX 5070 Ti")
        self.assertEqual(product.specs["ram"], "32GB DDR5-6000")
        self.assertEqual(product.specs["storage"], "2TB NVMe SSD")
        self.assertGreaterEqual(product.confidence, 0.9)

    def test_crawls_category_to_product_page(self) -> None:
        source = sample_source()
        fetcher = Fetcher("test-agent", timeout_seconds=1)

        products, stats = scrape_sources(
            [source],
            fetcher=fetcher,
            robots=None,
            max_products=None,
        )

        self.assertEqual(stats["pagesScanned"], 2)
        self.assertEqual(len(products), 1)
        self.assertIn("Apex Gaming PC", products[0].name)

    def test_builds_competition_draft(self) -> None:
        source = sample_source()
        product_url = (FIXTURES / "sample-product.html").as_uri()
        document = parse_html_document((FIXTURES / "sample-product.html").read_text())
        product = extract_product(document, product_url, source)
        assert product is not None

        drafts = build_competition_drafts([product], "upcoming")

        self.assertEqual(len(drafts), 1)
        draft = drafts[0]
        self.assertEqual(draft["status"], "upcoming")
        self.assertEqual(draft["entryPriceCents"], 2_500)
        self.assertEqual(draft["entriesSold"], 0)
        self.assertEqual(draft["specs"]["gpu"], "NVIDIA RTX 5070 Ti")

    def test_next_wave_close_is_sunday_utc_equivalent_of_sast_end_of_day(self) -> None:
        close_at = next_wave_close_at(dt.datetime(2026, 5, 20, 10, 0, tzinfo=dt.timezone.utc))

        self.assertEqual(close_at.isoformat(), "2026-05-31T21:59:59.999000+00:00")

    def test_catalog_resolves_cpu_and_gpu_from_real_catalog(self) -> None:
        catalog = Catalog.load(FIXTURES.parents[1] / "catalog")

        cpu = catalog.lookup_cpu("AMD Ryzen 9 9950X3D")
        gpu = catalog.lookup_gpu("Nvidia RTX 5080")

        self.assertIsNotNone(cpu)
        self.assertIsNotNone(gpu)
        assert cpu is not None and gpu is not None
        self.assertEqual(cpu.brand, "AMD")
        self.assertEqual(cpu.data["cores"], 16)
        self.assertEqual(cpu.data["socket"], "AM5")
        self.assertEqual(gpu.data["vram_gb"], 16)
        self.assertEqual(gpu.data["memory_type"], "GDDR7")

    def test_catalog_rejects_ti_when_name_says_non_ti(self) -> None:
        """A page that mentions both "RTX 5060" and "RTX 5060 Ti" in
        related-products text should still resolve as the non-Ti SKU when
        that's what the name says, *after* the extract_specs name-priority
        fix. This test pins the integration."""
        catalog = Catalog.load(FIXTURES.parents[1] / "catalog")

        cpu = catalog.lookup_cpu("RTX 5060")
        gpu_non_ti = catalog.lookup_gpu("RTX 5060")
        gpu_ti = catalog.lookup_gpu("RTX 5060 Ti")

        self.assertIsNone(cpu)
        self.assertIsNotNone(gpu_non_ti)
        self.assertIsNotNone(gpu_ti)
        assert gpu_non_ti is not None and gpu_ti is not None
        self.assertEqual(gpu_non_ti.model, "RTX 5060")
        self.assertEqual(gpu_ti.model, "RTX 5060 Ti")

    def test_build_inventory_assembles_pc_builds_with_component_fks(self) -> None:
        source = sample_source()
        product_url = (FIXTURES / "sample-product.html").as_uri()
        document = parse_html_document((FIXTURES / "sample-product.html").read_text())
        product = extract_product(document, product_url, source)
        assert product is not None
        catalog = Catalog.load(FIXTURES.parents[1] / "catalog")

        inventory = build_inventory([product], catalog, build_status="upcoming")

        self.assertEqual(len(inventory["pc_builds"]), 1)
        build = inventory["pc_builds"][0]
        self.assertEqual(build["build_status"], "Draft")
        self.assertEqual(build["slug"], "apex-gaming-pc-ryzen-7-9700x-rtx-5070-ti-32gb-ddr5-2tb-nvme")
        # Catalog hit: CPU + GPU IDs are deterministic UUID v5s.
        expected_cpu_id = str(component_uuid("cpu", "AMD", "Ryzen 7 9700X"))
        expected_gpu_id = str(component_uuid("gpu", "NVIDIA", "RTX 5070 Ti"))
        self.assertEqual(build["cpu_id"], expected_cpu_id)
        self.assertEqual(build["gpu_id"], expected_gpu_id)
        # Component tables are deduplicated and contain engineering specs.
        self.assertEqual(len(inventory["cpus"]), 1)
        self.assertEqual(inventory["cpus"][0]["cores"], 8)
        self.assertEqual(inventory["cpus"][0]["socket"], "AM5")
        self.assertEqual(inventory["gpus"][0]["vram_gb"], 16)
        self.assertEqual(inventory["gpus"][0]["memory_type"], "GDDR7")
        # Motherboard and PSU not surfaced from the fixture; warnings logged.
        self.assertEqual(len(inventory["motherboards"]), 0)
        self.assertEqual(len(inventory["psus"]), 0)
        self.assertTrue(
            any("Motherboard" in w for w in build["scrape_warnings"]),
            f"expected motherboard warning, got: {build['scrape_warnings']}",
        )

    def test_component_uuid_is_stable_across_calls(self) -> None:
        first = component_uuid("cpu", "AMD", "Ryzen 9 9950X3D")
        second = component_uuid("cpu", "  AMD  ", "ryzen 9 9950x3d")

        self.assertEqual(first, second)

    def test_spec_lookup_resolves_cpu_from_wootware_fixture(self) -> None:
        """Catalog-miss fallback path: SpecLookupClient should find the
        Ryzen 5 5500 link on the category fixture, fetch the product
        fixture, and parse the spec table into the cpus-row shape."""
        category_url = "https://wootware.example/cpus"
        product_url = (
            "https://wootware.example/"
            "amd-100-100000457box-ryzen-5-5500-4-2ghz-6-core-zen-3-socket-am4-desktop-cpu.html"
        )
        fetcher = _FixtureFetcher({
            category_url: FIXTURES / "wootware-category-cpus.html",
            product_url: FIXTURES / "wootware-cpu-ryzen-5-5500.html",
        })
        cache_dir = Path(tempfile.mkdtemp())
        config = SpecSourceConfig(
            name="Wootware",
            base_url="https://wootware.example",
            cpu_category_url=category_url,
            request_delay_seconds=0,
        )
        client = SpecLookupClient(config, fetcher, cache_dir)

        specs = client.lookup_cpu("AMD Ryzen 5 5500")

        self.assertIsNotNone(specs)
        assert specs is not None
        self.assertEqual(specs["cores"], 6)
        self.assertEqual(specs["threads"], 12)
        self.assertEqual(specs["base_clock_ghz"], 3.6)
        self.assertEqual(specs["boost_clock_ghz"], 4.2)
        self.assertEqual(specs["socket"], "AM4")
        self.assertEqual(specs["tdp_watts"], 65)
        self.assertEqual(specs["sourceUrl"], product_url)

    def test_spec_lookup_cache_short_circuits_repeat_fetches(self) -> None:
        """Second call for the same SKU should not refetch — the cache file
        from the first call must short-circuit the category + product
        fetch entirely."""
        category_url = "https://wootware.example/cpus"
        product_url = (
            "https://wootware.example/"
            "amd-100-100000457box-ryzen-5-5500-4-2ghz-6-core-zen-3-socket-am4-desktop-cpu.html"
        )
        fetcher = _FixtureFetcher({
            category_url: FIXTURES / "wootware-category-cpus.html",
            product_url: FIXTURES / "wootware-cpu-ryzen-5-5500.html",
        })
        cache_dir = Path(tempfile.mkdtemp())
        config = SpecSourceConfig(
            name="Wootware",
            base_url="https://wootware.example",
            cpu_category_url=category_url,
            request_delay_seconds=0,
        )
        client = SpecLookupClient(config, fetcher, cache_dir)

        first = client.lookup_cpu("AMD Ryzen 5 5500")
        calls_after_first = list(fetcher.calls)
        # A new client instance reading the same cache directory must avoid
        # any network round-trip the second time around.
        fresh_client = SpecLookupClient(config, fetcher, cache_dir)
        second = fresh_client.lookup_cpu("AMD Ryzen 5 5500")

        self.assertEqual(first, second)
        self.assertEqual(
            fetcher.calls,
            calls_after_first,
            "Second lookup must hit cache instead of refetching",
        )

    def test_catalog_resolves_workstation_gpu_with_quadro_prefix(self) -> None:
        """Retailers tag workstation cards as 'Quadro RTX 5000 Ada' even
        though NVIDIA dropped the Quadro branding. The Quadro prefix must
        be stripped during lookup, and the catalog should resolve to the
        Ada-generation entry (32 GB GDDR6) rather than the consumer
        'RTX 5000' digit-pattern false match."""
        catalog = Catalog.load(FIXTURES.parents[1] / "catalog")

        resolved = catalog.lookup_gpu("Quadro RTX 5000 Ada")

        self.assertIsNotNone(resolved)
        assert resolved is not None
        self.assertEqual(resolved.brand, "NVIDIA")
        self.assertEqual(resolved.model, "RTX 5000 Ada")
        self.assertEqual(resolved.data["vram_gb"], 32)
        self.assertEqual(resolved.data["memory_type"], "GDDR6")


    def test_learn_catalog_appends_new_skus_and_merges_aliases(self) -> None:
        """Catalog files start with one CPU and one GPU. After a run that
        learns one new SKU per kind, the JSONs must contain the new
        entries plus aliases. A second run with the same learned input
        must be a no-op (idempotent — no duplicates)."""
        import json as _json

        with tempfile.TemporaryDirectory() as raw_dir:
            catalog_dir = Path(raw_dir)
            (catalog_dir / "cpus.json").write_text(
                _json.dumps({
                    "$schema": "test",
                    "cpus": [
                        {
                            "brand": "AMD",
                            "model": "Ryzen 5 7600",
                            "aliases": ["AMD Ryzen 5 7600"],
                            "cores": 6,
                            "threads": 12,
                            "base_clock_ghz": 3.8,
                            "boost_clock_ghz": 5.1,
                            "socket": "AM5",
                            "tdp_watts": 65,
                        }
                    ],
                }),
                encoding="utf-8",
            )
            (catalog_dir / "gpus.json").write_text(
                _json.dumps({
                    "$schema": "test",
                    "gpus": [
                        {
                            "brand": "NVIDIA",
                            "model": "RTX 4060",
                            "aliases": [],
                            "vram_gb": 8,
                            "memory_type": "GDDR6",
                            "power_draw_watts": 115,
                        }
                    ],
                }),
                encoding="utf-8",
            )

            learned_cpus = [{
                "brand": "AMD",
                "model": "Ryzen 5 5500",
                "aliases": ["AMD Ryzen 5 5500"],
                "cores": 6,
                "threads": 12,
                "base_clock_ghz": 3.6,
                "boost_clock_ghz": 4.2,
                "socket": "AM4",
                "tdp_watts": 65,
                "_source": "Wootware",
            }]
            learned_gpus = [{
                "brand": "NVIDIA",
                "model": "RTX 5060",
                "aliases": ["GeForce RTX 5060"],
                "vram_gb": 8,
                "memory_type": "GDDR7",
                "power_draw_watts": 145,
                "_source": "Wootware",
            }]

            cpus_added, gpus_added = learn_catalog(
                catalog_dir, learned_cpus, learned_gpus
            )
            self.assertEqual((cpus_added, gpus_added), (1, 1))

            cpus_doc = _json.loads((catalog_dir / "cpus.json").read_text())
            self.assertEqual(len(cpus_doc["cpus"]), 2)
            new_cpu = next(c for c in cpus_doc["cpus"] if c["model"] == "Ryzen 5 5500")
            self.assertEqual(new_cpu["cores"], 6)
            self.assertEqual(new_cpu["socket"], "AM4")
            self.assertNotIn("_source", new_cpu)

            gpus_doc = _json.loads((catalog_dir / "gpus.json").read_text())
            self.assertEqual(len(gpus_doc["gpus"]), 2)
            new_gpu = next(g for g in gpus_doc["gpus"] if g["model"] == "RTX 5060")
            self.assertEqual(new_gpu["vram_gb"], 8)
            self.assertEqual(new_gpu["aliases"], ["GeForce RTX 5060"])

            # Second run with the same input is a no-op for the new SKUs,
            # but should still merge a fresh alias into the existing CPU.
            learned_cpus[0]["aliases"] = ["AMD Ryzen 5 5500", "Ryzen5 5500"]
            cpus_added2, gpus_added2 = learn_catalog(
                catalog_dir, learned_cpus, learned_gpus
            )
            self.assertEqual((cpus_added2, gpus_added2), (0, 0))

            cpus_doc2 = _json.loads((catalog_dir / "cpus.json").read_text())
            self.assertEqual(len(cpus_doc2["cpus"]), 2)
            merged = next(c for c in cpus_doc2["cpus"] if c["model"] == "Ryzen 5 5500")
            self.assertIn("Ryzen5 5500", merged["aliases"])


def sample_source() -> SourceConfig:
    fixture_root = FIXTURES.as_uri() + "/"
    return SourceConfig(
        name="Fixture retailer",
        base_url=fixture_root,
        urls=[(FIXTURES / "sample-category.html").as_uri()],
        include_keywords=["gaming pc", "prebuilt", "desktop"],
        exclude_keywords=["laptop"],
        product_url_patterns=["sample-product"],
        request_delay_seconds=0,
        max_pages=10,
        max_depth=1,
    )


if __name__ == "__main__":
    unittest.main()
