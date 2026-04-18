from datetime import date
from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase

from sap_sync.services.sync_service import SyncService


class SyncServiceMapOrderToSapTests(SimpleTestCase):
    def test_map_order_to_sap_uses_ordered_qty_instead_of_litres(self):
        item = SimpleNamespace(
            item_code="FG0000003",
            qty=10,
            boxes=240,
            ltrs=240,
            basic_price=1202,
            qty_scheme=0,
        )
        order = SimpleNamespace(
            id=63,
            card_code="CUSTA001070",
            delivery_date=date(2026, 4, 13),
            ship_to_address="SAKSHI SALES DELHI",
            bill_to_address="SAKSHI SALES DELHI",
            dispatch_from_id=2,
            items=SimpleNamespace(all=lambda: [item]),
        )

        service = SyncService(triggered_by="test")

        with patch("sap_sync.services.sync_service.timezone.localdate", return_value=date(2026, 4, 11)):
            payload = service.map_order_to_sap(order)

        self.assertEqual(payload["DocumentLines"][0]["ItemCode"], "FG0000003")
        self.assertEqual(payload["DocumentLines"][0]["Quantity"], 10.0)
        self.assertEqual(payload["DocumentLines"][0]["UnitPrice"], 1202.0)
        self.assertEqual(payload["DocDate"], "2026-04-11")
        self.assertEqual(payload["DocDueDate"], "2026-04-13")

    def test_map_order_to_sap_falls_back_when_qty_is_missing(self):
        item = SimpleNamespace(
            item_code="FG0000005",
            qty=0,
            boxes=12,
            ltrs=24,
            basic_price=0,
            market_price=0,
            qty_scheme=0,
        )
        order = SimpleNamespace(
            id=64,
            card_code="CUSTA001070",
            delivery_date=date(2026, 4, 13),
            ship_to_address="SAKSHI SALES DELHI",
            bill_to_address="SAKSHI SALES DELHI",
            dispatch_from_id=2,
            items=SimpleNamespace(all=lambda: [item]),
        )

        service = SyncService(triggered_by="test")

        with patch("sap_sync.services.sync_service.timezone.localdate", return_value=date(2026, 4, 11)):
            payload = service.map_order_to_sap(order)

        self.assertEqual(payload["DocumentLines"][0]["Quantity"], 12.0)

    def test_map_order_to_sap_uses_market_price_when_basic_price_is_zero(self):
        item = SimpleNamespace(
            item_code="FG0000007",
            qty=5,
            boxes=5,
            ltrs=10,
            basic_price=0,
            market_price=975.5,
            qty_scheme=0,
        )
        order = SimpleNamespace(
            id=65,
            card_code="CUSTA001070",
            delivery_date=date(2026, 4, 13),
            ship_to_address="SAKSHI SALES DELHI",
            bill_to_address="SAKSHI SALES DELHI",
            dispatch_from_id=2,
            items=SimpleNamespace(all=lambda: [item]),
        )

        service = SyncService(triggered_by="test")

        with patch("sap_sync.services.sync_service.timezone.localdate", return_value=date(2026, 4, 11)):
            payload = service.map_order_to_sap(order)

        self.assertEqual(payload["DocumentLines"][0]["UnitPrice"], 975.5)

    def test_map_order_to_sap_normalizes_legacy_web_quantity_shape(self):
        item = SimpleNamespace(
            item_code="FG0000003",
            qty=240,
            pcs=20,
            boxes=12,
            ltrs=240,
            basic_price=1202,
            qty_scheme=0,
        )
        order = SimpleNamespace(
            id=63,
            card_code="CUSTA001070",
            delivery_date=date(2026, 4, 13),
            ship_to_address="SAKSHI SALES DELHI",
            bill_to_address="SAKSHI SALES DELHI",
            dispatch_from_id=2,
            items=SimpleNamespace(all=lambda: [item]),
        )

        service = SyncService(triggered_by="test")

        with patch("sap_sync.services.sync_service.timezone.localdate", return_value=date(2026, 4, 11)):
            payload = service.map_order_to_sap(order)

        self.assertEqual(payload["DocumentLines"][0]["Quantity"], 12.0)
