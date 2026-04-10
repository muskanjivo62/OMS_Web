from rest_framework import serializers
from django.db import connection
from .models import Parties,DispatchLocation,ProductDetails,OrderItem,Branches,OrdersLog,Order
from users.models import SchemeProduct
from sap_sync.models import PartyAddress as SapPartyAddress


def get_scheme_item_code_raw(scheme_id):
    if not scheme_id:
        return None

    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT item_code FROM scheme_product WHERE scheme_id = %s LIMIT 1",
            [scheme_id],
        )
        row = cursor.fetchone()

    return row[0] if row else None

class SchemeProductSerializer(serializers.ModelSerializer):
    state_name = serializers.CharField(source='state.name', read_only=True)
    product_id = serializers.IntegerField(source='item_code_id', read_only=True)
    item_code = serializers.CharField(source='item_code.item_code', read_only=True)
    item_name = serializers.CharField(source='item_code.item_name', read_only=True)
    sal_factor2 = serializers.DecimalField(source='item_code.sal_factor2', max_digits=18, decimal_places=6, read_only=True)
    sal_pack_unit = serializers.CharField(source='item_code.sal_pack_unit', read_only=True)
    
    class Meta:
        model = SchemeProduct
        fields = [
            'scheme_id',
            'scheme_name',
            'is_active',
            'state',
            'state_name',
            'product_id',
            'item_code',
            'item_name',
            'sal_factor2',
            'sal_pack_unit',
        ]
   

class PartiesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parties
        fields = ['card_code','card_name']

class DispatchLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DispatchLocation
        fields = ['id','name', 'code']

class PartyAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = SapPartyAddress
        fields = ['id','full_address', 'gst_number','address_type','address_name','category']
        
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductDetails
        fields = ['id', 'item_code', 'item_name', 'category', 'brand', 'variety', 'sal_factor2', 'tax_rate', 'sal_pack_unit']

class CreateOrderSerializer(serializers.Serializer):
    card_code = serializers.CharField(max_length=100)
    card_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    bill_to_id = serializers.IntegerField(required=False, default=0)
    bill_to_address = serializers.CharField(required=False, allow_blank=True, default='')
    ship_to_id = serializers.IntegerField(required=False, default=0)
    ship_to_address = serializers.CharField(required=False, allow_blank=True, default='')
    dispatch_from_id = serializers.IntegerField(required=False, default=0)
    dispatch_from_name = serializers.CharField(required=False, allow_blank=True, default='')
    company = serializers.CharField(required=False, allow_blank=True, default='')
    po_number = serializers.CharField(required=False, allow_blank=True, default='')
    remarks = serializers.CharField(required=False, allow_blank=True, default='')
    items = serializers.ListField(child=serializers.DictField())
    basic_price = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_date = serializers.DateField(required=False, allow_null=True)

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branches
        fields = ['bpl_id', 'bpl_name', 'category']

class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.IntegerField()
    reason = serializers.CharField(required=False, allow_blank=True)

class OrderListByUserIdSerializer(serializers.ModelSerializer):
    status_name = serializers.CharField(source="status.name")
    items_count = serializers.IntegerField(source="items.count", read_only=True)
    categories = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="status.name", read_only=True)

    def get_categories(self, obj):
        return list(
            obj.items.exclude(category__isnull=True)
            .exclude(category__exact="")
            .values_list("category", flat=True)
            .distinct()
        )
    
    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "card_code",
            "card_name",
            "total_amount",
            "status",
            "status_name",
            "status_display",
            "created_at",
            "delivery_date",
            "po_number",
            "items_count",
            "categories",
        ]    
    
class OrdersLogSerializer(serializers.ModelSerializer):
    status_id = serializers.IntegerField(source="action.id", read_only=True)
    status_name = serializers.CharField(source="action.name", read_only=True)
    performed_by_name = serializers.CharField(
        source="performed_by.username", read_only=True
    )
    
    class Meta:
        model = OrdersLog
        fields = [
            "id",
            "status_id",
            "status_name",
            "remarks",
            "performed_by_name",
            "created_at",
        ]

class OrderItemSerializer(serializers.ModelSerializer):
    scheme_id = serializers.IntegerField(read_only=True, allow_null=True)
    scheme_name = serializers.SerializerMethodField()
    scheme_item_code = serializers.SerializerMethodField()

    def get_scheme_name(self, obj):
        raw_scheme_id = getattr(obj, 'scheme_id', None)
        if not raw_scheme_id:
            return None
        return (
            SchemeProduct.objects
            .filter(scheme_id=raw_scheme_id)
            .values_list('scheme_name', flat=True)
            .first()
        )

    def get_scheme_item_code(self, obj):
        raw_scheme_id = getattr(obj, 'scheme_id', None)
        if not raw_scheme_id:
            return None
        return get_scheme_item_code_raw(raw_scheme_id)

    class Meta:
        model = OrderItem
        fields = "__all__"


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    items_count = serializers.IntegerField(source="items.count", read_only=True)
    status = serializers.CharField(source="status.code")
    status_display = serializers.CharField(source="status.name")

    class Meta:
        model = Order
        fields = "__all__"
