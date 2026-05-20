from __future__ import annotations

import datetime as dt
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scrape_prebuilds import (  # noqa: E402
    Catalog,
    Fetcher,
    SourceConfig,
    build_competition_drafts,
    build_inventory,
    component_uuid,
    extract_product,
    next_wave_close_at,
    parse_html_document,
    scrape_sources,
)


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
