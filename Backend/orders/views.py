from urllib import request
from django.shortcuts import render
import re
from .serializers import OrderDetailSerializer, OrderListByUserIdSerializer,OrdersLogSerializer,OrderStatusUpdateSerializer, DispatchLocationSerializer,BranchSerializer, PartyAddressSerializer,ProductSerializer,CreateOrderSerializer
from .models import PartyProductAssignment,OrdersLog,Parties, Branches, DispatchLocation, UserPartyAssignment, PartyAddress,ProductDetails,Order,OrderItem,OrderStatus,log_order_action
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from functools import lru_cache
from rest_framework.permissions import IsAdminUser
import calendar
from django.db.models import Sum, Count,F
from django.db.models.functions import TruncMonth
from django.utils import timezone
from collections import defaultdict
from django.shortcuts import get_object_or_404
from rest_framework import permissions
from .models import Order, OrderStatus
from .models import PartyProductAssignment  # Ensure your models are imported

def _get_base_orders(user):
    """Scope orders by user role:
    - admin: all orders
    - manager: only orders created by this user
    - approver: orders pending approval (NEED_APPROVAL, RATE_APPROVAL)
    - billing: orders in billing stage (BILLING, BILLING_PENDING)
    """
    role = getattr(user, 'role', None)
    role_name = getattr(role, 'name', '').lower() if role else ''
    if role_name == 'admin':
        return Order.objects.all()
    if role_name == 'manager':
        return Order.objects.filter(created_by=user.id)
    if role_name == 'approver':
        return Order.objects.filter(status__code__in=['NEED_APPROVAL', 'RATE_APPROVAL'])
    if role_name == 'billing':
        return Order.objects.filter(status__code__in=['BILLING', 'BILLING_PENDING'])
    return Order.objects.none()

class DashboardKPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        today = timezone.now().date()
        current_month_start = today.replace(day=1)

        all_orders = _get_base_orders(request.user)

        total_orders = all_orders.count()
        total_revenue = all_orders.aggregate(total=Sum('total_amount'))['total'] or 0
        today_orders = all_orders.filter(created_at__date=today).count()
        this_month_orders = all_orders.filter(created_at__date__gte=current_month_start).count()

        status_counts = {}
        for os in OrderStatus.objects.all():
            status_counts[os.name] = all_orders.filter(status=os).count()

        return Response({
            'total_orders': total_orders,
            'total_revenue': str(total_revenue),
            'today_orders': today_orders,
            'this_month_orders': this_month_orders,
            'status_counts': status_counts,
        })

class DashboardChartsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        now = timezone.now()
        # Donut charts filter
        year = int(request.query_params.get('year', now.year))
        month = int(request.query_params.get('month', 0))
        # Line chart filter (independent)
        line_year = int(request.query_params.get('line_year', now.year))

        # Date boundaries for donut charts: month=0 means year-to-date
        if month == 0:
            range_start = timezone.make_aware(datetime(year, 1, 1))
            if year == now.year:
                range_end = timezone.make_aware(datetime(now.year, now.month, now.day, 23, 59, 59))
            else:
                range_end = timezone.make_aware(datetime(year, 12, 31, 23, 59, 59))
        else:
            range_start = timezone.make_aware(datetime(year, month, 1))
            last_day = calendar.monthrange(year, month)[1]
            range_end = timezone.make_aware(datetime(year, month, last_day, 23, 59, 59))

        base_orders = _get_base_orders(request.user)
        filtered_orders = base_orders.filter(
            created_at__gte=range_start,
            created_at__lte=range_end
        )

        # CHART 1: Monthly Sales Timeline (full line_year Jan-Dec)
        year_start = timezone.make_aware(datetime(line_year, 1, 1))
        year_end = timezone.make_aware(datetime(line_year, 12, 31, 23, 59, 59))
        monthly_sales = (
            base_orders
            .filter(created_at__gte=year_start, created_at__lte=year_end)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(revenue=Sum('total_amount'), count=Count('id'))
            .order_by('month')
        )
        sales_map = {
            entry['month'].month: {
                'revenue': float(entry['revenue'] or 0),
                'count': entry['count'],
            }
            for entry in monthly_sales
        }
        monthly_sales_data = [
            {
                'month': f'{line_year}-{m:02d}',
                'label': calendar.month_abbr[m],
                'revenue': sales_map.get(m, {}).get('revenue', 0),
                'count': sales_map.get(m, {}).get('count', 0),
            }
            for m in range(1, 13)
        ]

        # CHART 2: State-wise Orders (selected month)
        # No FK between Order and Parties; join via card_code in Python
        card_codes_in_month = list(
            filtered_orders.values_list('card_code', flat=True).distinct()
        )
        state_map = {}
        if card_codes_in_month:
            parties = Parties.objects.filter(
                card_code__in=card_codes_in_month
            ).values_list('card_code', 'state')
            state_map = {cc: (st or 'Unknown') for cc, st in parties}

        state_counts = defaultdict(int)
        for order in filtered_orders.values('card_code'):
            state = state_map.get(order['card_code'], 'Unknown')
            state_counts[state] += 1

        statewise_data = sorted(
            [{'state': k, 'orders': v} for k, v in state_counts.items()],
            key=lambda x: x['orders'],
            reverse=True
        )

        # CHART 3: Status Distribution (selected month) - include all statuses
        status_counts_map = dict(
            filtered_orders
            .values('status')
            .annotate(count=Count('id'))
            .values_list('status', 'count')
        )
        status_data = [
            {'status': os.code, 'label': os.name, 'count': status_counts_map.get(os.id, 0)}
            for os in OrderStatus.objects.all()
        ]

        # CHART 4: Top Parties by Revenue (selected period)
        top_parties = (
            filtered_orders
            .values('card_code', 'card_name')
            .annotate(revenue=Sum('total_amount'))
            .order_by('-revenue')
        )
        top_parties_data = [
            {
                'card_code': entry['card_code'],
                'card_name': entry['card_name'],
                'revenue': float(entry['revenue'] or 0),
            }
            for entry in top_parties
        ]

        # CHART 5: Category-wise Sales (selected month)
        category_sales = (
            OrderItem.objects
            .filter(order__in=filtered_orders)
            .values('category')
            .annotate(total_sales=Sum('total'), count=Count('id'))
            .order_by('-total_sales')
        )
        category_data = [
            {
                'category': entry['category'] or 'Unknown',
                'total_sales': float(entry['total_sales'] or 0),
                'count': entry['count'],
            }
            for entry in category_sales
        ]

        return Response({
            'filter': {'year': year, 'month': month, 'line_year': line_year},
            'monthly_sales': monthly_sales_data,
            'statewise_orders': statewise_data,
            'status_distribution': status_data,
            'top_parties': top_parties_data,
            'category_sales': category_data,
        })

def extract_type_from_name(item_name):
    """Extract size/type like '1 LTR', '500 ML', '5 KG' from item name"""
    if not item_name:
        return None
    
    # More flexible pattern - handles various formats
    # Matches: 1 LTR, 1LTR, 1 Ltr, 1L, 500 ML, 500ML, 5 KG, 5KG, 200 GM, 200GM, etc.
    pattern = r'(\d+(?:\.\d+)?\s*(?:LTR|LITRE|LITER|L|ML|KG|KGS|GM|GMS|GRAM|G|PCS|PC|POUCH|TIN|JAR|BTL|BTL|CAN|BOTTLE|PACK|PKT|BOX)S?)\b'
    
    match = re.search(pattern, item_name.upper())
    
    if match:
        # Normalize the result (e.g., "1LTR" -> "1 LTR")
        result = match.group(1).strip()
        # Add space between number and unit if missing
        result = re.sub(r'(\d)([A-Z])', r'\1 \2', result)
        return result
    return None

class PartyProductsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, card_code):
        # We use .values() to select specific fields and F() to rename related fields
        results = (
            PartyProductAssignment.objects.filter(
                card_code=card_code, 
                is_active=True
            )
            .select_related('item_code')  # Efficiently joins the tables
            .values(
                'item_code',
                'category',
                'basic_rate',
                # Accessing fields from the related 'sap_products' table
                item_name=F('item_code__item_name'),
                sal_factor2=F('item_code__sal_factor2'),
                tax_rate=F('item_code__tax_rate'),
                sal_pack_unit=F('item_code__sal_pack_unit'),
                brand=F('item_code__brand'),
                variety=F('item_code__variety')
            )
            .order_by('category', 'item_code__item_name')
        )

        return Response(list(results))
    
# class PartyProductsView(APIView):
#     permission_classes = [AllowAny]

#     def get(self, request, card_code):
#         from django.db import connection
#         cursor = connection.cursor()
#         cursor.execute("""
#             SELECT ppa.item_code, ppa.category, ppa.basic_rate,
#                    p.item_name, p.sal_factor2, p.tax_rate, p.sal_pack_unit,
#                    p.brand, p.variety
#             FROM party_product_assignments ppa
#             LEFT JOIN sap_products p ON ppa.item_code = p.item_code
#             WHERE ppa.card_code = %s AND ppa.is_active = true
#             ORDER BY ppa.category, p.item_name
#         """, [card_code])
        
#         columns = [col[0] for col in cursor.description]
#         rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

#         return Response(rows)
        
class PartyView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = request.user.id if request.user.is_authenticated else 2

        assigned_card_codes = UserPartyAssignment.objects.filter(
            user_id=user_id,
            is_active=True
        ).values_list('card_code', flat=True).distinct()

        parties = Parties.objects.filter(
            card_code__in=assigned_card_codes
        ).distinct().order_by('card_name')

        data = [
            {
                'value': p.card_code,
                'label': f"{p.card_name} ({p.card_code})"
            }
            for p in parties
        ]

        return Response(data)

class DispatchLocationListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = DispatchLocationSerializer
    queryset = DispatchLocation.objects.all().order_by('name')

class PartyAddressesView(APIView):

    permission_classes = [AllowAny]

    def get(self, request):
        card_code = request.query_params.get('card_code')
            
        if not card_code:
            return Response({'error': 'card_code is required'}, status=400)
            
        bill_addresses = PartyAddress.objects.filter(
            card_code=card_code,
            address_type='B',
            category='OIL'
        )

        ship_addresses = PartyAddress.objects.filter(
            card_code=card_code,
            address_type='S',
            category='OIL'
        ) 

        if not bill_addresses.exists() and not ship_addresses.exists():
            try:
                party = Parties.objects.filter(card_code=card_code)
                fallback_address = {
                    'id': 0,
                    'address_id': party.card_name if party else '',
                    'full_address': party.address if party else '',
                    'gst_number': None
                }
                return Response({
                    'bill_to': [fallback_address],
                    'ship_to': [fallback_address],
                    'is_fallback': True
                })
            except Parties.DoesNotExist:
                return Response({
                    'bill_to': [],
                    'ship_to': [],
                    'is_fallback': False
                })  

        bill_data = PartyAddressSerializer(bill_addresses, many=True).data
        ship_data = PartyAddressSerializer(ship_addresses, many=True).data

        if not bill_data:
            try:
                party = Parties.objects.filter(card_code=card_code).first()
                bill_data = [{
                    'id': 0,
                    'address_id': party.card_name,
                    'full_address': party.address,
                    'gst_number': None
                }]
            except Parties.DoesNotExist:
                pass
                    
        if not ship_data:
            try:
                party = Parties.objects.get(card_code=card_code)
                ship_data = [{
                    'id': 0,
                    'address_id': party.card_name,
                    'full_address': party.address,
                    'gst_number': None
                }]
            except Parties.DoesNotExist:
                pass

        return Response({
            'bill_to': bill_data,
            'ship_to': ship_data,
            'is_fallback': False
        })

class ProductFiltersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        category = request.query_params.get('category')
        brand = request.query_params.get('brand')
        variety = request.query_params.get('variety')

        # Always get all categories
        categories = ProductDetails.objects.exclude(
            category__isnull=True
        ).exclude(
            category=''
        ).values_list('category', flat=True).distinct().order_by('category')

        # Get brands - only if category is provided
        brands = []
        if category:
            brands = ProductDetails.objects.filter(
                category=category
            ).exclude(
                brand__isnull=True
            ).exclude(
                brand=''
            ).values_list('brand', flat=True).distinct().order_by('brand')

        # Get varieties - only if category AND brand are provided
        varieties = []
        if category and brand:
            varieties = ProductDetails.objects.filter(
                category=category,
                brand=brand
            ).exclude(
                variety__isnull=True
            ).exclude(
                variety=''
            ).values_list('variety', flat=True).distinct().order_by('variety')
        
        # Get types - ONLY if category, brand, AND variety are provided
        types = []
        if category and brand and variety:
            types_query = ProductDetails.objects.filter(
                category=category,
                brand=brand,
                variety=variety
            )
            
            item_names = types_query.values_list('item_name', flat=True)
            types_set = set()
            has_others = False
            
            for name in item_names:
                item_type = extract_type_from_name(name)
                if item_type:
                    types_set.add(item_type)
                else:
                    has_others = True
            
            types = sorted(list(types_set))
            
            if has_others:
                types.append('Others')

        return Response({
            'categories': [{'label': c, 'value': c} for c in categories],
            'brands': [{'label': b, 'value': b} for b in brands],
            'varieties': [{'label': v, 'value': v} for v in varieties],
            'types': [{'label': t, 'value': t} for t in types]
        })

class ProductListView(APIView): 
    permission_classes = [AllowAny]

    def get(self, request):
        category = request.query_params.get('category')
        brand = request.query_params.get('brand')
        variety = request.query_params.get('variety')
        item_type = request.query_params.get('type')

        products = ProductDetails.objects.all()

        if category:
            products = products.filter(category=category)
        if brand:
            products = products.filter(brand=brand)
        if variety:
            products = products.filter(variety=variety)
        if item_type:
            products = products.filter(item_name__icontains=item_type)

        serializer = ProductSerializer(products.order_by('item_name'), many=True)
        return Response(serializer.data)

class CreateOrderView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        def _to_float(value, default=0.0):
            try:
                if value in (None, ''):
                    return float(default)
                return float(value)
            except (TypeError, ValueError):
                return float(default)

        serializer = CreateOrderSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        items = data.pop('items', [])
        # Keep remarks resilient even if serializer/view code drifts across deployments.
        order_remarks = request.data.get('remarks', data.get('remarks', ''))

        if not items:
            return Response({'error': 'At least one item is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate order number: ORD-YYYYMMDD-XXXX
        today = datetime.now().strftime('%Y%m%d')
        last_order = Order.objects.filter(
            order_number__startswith=f'ORD-{today}'
        ).order_by('-order_number').first()

        if last_order:
            last_num = int(last_order.order_number.split('-')[-1])
            new_num = last_num + 1
        else:
            new_num = 1

        order_number = f'ORD-{today}-{new_num:04d}'

        # Calculate total
        total_amount = sum(_to_float(item.get('total', 0)) for item in items)

        user = request.user if request.user.is_authenticated else None

        order = Order.objects.create(
            order_number=order_number,
            card_code=data.get('card_code', ''),
            card_name=data.get('card_name', ''),
            bill_to_id=data.get('bill_to_id'),
            bill_to_address=data.get('bill_to_address', ''),
            ship_to_id=data.get('ship_to_id'),
            ship_to_address=data.get('ship_to_address', ''),
            dispatch_from_id=data.get('dispatch_from_id'),
            dispatch_from_name=data.get('dispatch_from_name', ''),
            company=data.get('company', ''),
            po_number=data.get('po_number', ''),
            total_amount=total_amount,
            status=get_status('Order Created'),
            created_by=user,
            delivery_date=data.get('delivery_date'),
            remarks=order_remarks
        )
            
        # Create order items + price check
        needs_approval = False
        flagged_items = []
            
        for item in items:
            OrderItem.objects.create(
                order=order,
                item_code=item.get('item_code', ''),
                item_name=item.get('item_name', ''),
                category=item.get('category', ''),
                brand=item.get('brand', ''),
                variety=item.get('variety', ''),
                item_type=item.get('item_type', ''),
                qty=_to_float(item.get('qty', 0)),
                pcs=_to_float(item.get('pcs', 0)),
                boxes=_to_float(item.get('boxes', 0)),
                ltrs=_to_float(item.get('ltrs', 0)),
                basic_price=_to_float(item.get('basic_price', 0)),
                market_price=_to_float(item.get('market_price', 0)),
                total=_to_float(item.get('total', 0)),
                tax_rate=_to_float(item.get('tax_rate', 0))
            )

            bp = _to_float(item.get('basic_price', 0))
            mp = _to_float(item.get('market_price', 0))
            if bp > mp:
                needs_approval = True
                flagged_items.append(f"{item.get('item_name')}: Basic ₹{bp} > Market ₹{mp}")

        # Log: Order created
        log_order_action(order, 'Order Created', user=user)

        # Route based on price check
        if needs_approval:
            next_status = get_status('Rate Approval')
            if next_status:
                order.status = next_status
                order.save()
            log_order_action(order, 'Rate Approval', user=None, remarks='; '.join(flagged_items))
        else:
            next_status = get_status('Auditor Approval')
            if next_status:
                order.status = next_status
                order.save()
            log_order_action(order, 'Auditor Approval', user=None)

        return Response({
            'id': order.id,
            'order_number': order.order_number,
            'total_amount': str(order.total_amount),
            'status': order.status.name if order.status else '',
            'needs_approval': needs_approval,
            'flagged_items': flagged_items if needs_approval else [],
            'remarks': order.remarks or '',
            'message': 'Order sent for approval' if needs_approval else 'Order sent to auditor approval',
        }, status=status.HTTP_201_CREATED)
        
class OrderStatusList(APIView):
    permission_classes = [AllowAny]

    def get(self,request):
        status = OrderStatus.objects.all().values('id','name')
        return Response(list(status))

class BranchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        branches = Branches.objects.filter(category="OIL").order_by("bpl_name")
        serializer = BranchSerializer(branches, many=True)
        return Response(serializer.data) 

class UpdateOrderStatusView(APIView):

    def post(self, request, order_id):
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = get_object_or_404(Order, id=order_id)
        previous_status = order.status

        status_id = serializer.validated_data["status"]
        reason = serializer.validated_data.get("reason", "")
        
        # ✅ Fetch status dynamically from table
        status_obj = get_object_or_404(OrderStatus, id=status_id)

        prev_name = (previous_status.name or "").strip().lower() if previous_status else ""

        # Guardrail: if client sends Auditor status again while already in Auditor stage,
        # treat it as "Auditor approved -> move to Billing Approval".
        if previous_status and previous_status.id == status_obj.id and prev_name == "auditor approval":
            billing_status = (
                OrderStatus.objects.filter(id=3).first()
                or OrderStatus.objects.filter(name__iexact="Billing Approval").first()
                or OrderStatus.objects.filter(name__iexact="Billing").first()
                or OrderStatus.objects.filter(name__icontains="billing").order_by("id").first()
            )
            if billing_status:
                status_obj = billing_status

        user = request.user if request.user.is_authenticated else None

        # ✅ Update order
        order.status = status_obj   

        # Only store reason when providedr
        if reason:
            order.reject_reason = reason

        order.save()

        new_name = (status_obj.name or "").strip().lower()
        is_auditor_to_billing = (
            prev_name == "auditor approval"
            and (status_obj.id == 3 or "billing" in new_name)
        )

        is_rate_to_auditor = (
            prev_name == "rate approval"
            and status_obj.id == 10
        )

        if is_rate_to_auditor:
            # Close the Rate Approval pending log
            rate_pending_log = (
                OrdersLog.objects
                .filter(order=order, action=previous_status, performed_by__isnull=True)
                .order_by("-created_at")
                .first()
            )
            if rate_pending_log:
                rate_pending_log.performed_by = user
                if reason:
                    rate_pending_log.remarks = reason
                rate_pending_log.save(update_fields=["performed_by", "remarks"])

            # Create pending Auditor Approval log
            auditor_pending_log = (
                OrdersLog.objects
                .filter(order=order, action=status_obj, performed_by__isnull=True)
                .order_by("-created_at")
                .first()
            )
            if not auditor_pending_log:
                log_order_action(order=order, action_name=status_obj.name, user=None, remarks="")

            return Response({
                "message": "Order status updated successfully",
                "order_id": order.id,
                "status": status_obj.name
            })

        if is_auditor_to_billing:
            
            auditor_pending_log = (
                OrdersLog.objects
                .filter(order=order, action=previous_status, performed_by__isnull=True)
                .order_by("-created_at")
                .first()
            )
            if auditor_pending_log:
                auditor_pending_log.performed_by = user
                if reason:
                    auditor_pending_log.remarks = reason
                auditor_pending_log.save(update_fields=["performed_by", "remarks"])

            # Next stage entry: billing approval should be a new pending row.
            billing_pending_log = (
                OrdersLog.objects
                .filter(order=order, action=status_obj, performed_by__isnull=True)
                .order_by("-created_at")
                .first()
            )
            if not billing_pending_log:
                log_order_action(
                    order=order,
                    action_name=status_obj.name,
                    user=None,
                    remarks=""
                )

            return Response({
                "message": "Order status updated successfully",
                "order_id": order.id,
                "status": status_obj.name
            })

        # If a placeholder row exists for this status (created earlier with no performer),
        # update it instead of inserting a duplicate row.
        
        pending_log = (
            OrdersLog.objects
            .filter(order=order, action=status_obj, performed_by__isnull=True)
            .order_by("-created_at")
            .first()
        )

        if pending_log:
            pending_log.performed_by = user
            if reason:
                pending_log.remarks = reason
            pending_log.save(update_fields=["performed_by", "remarks"])
        else:
            # ✅ LOG using status name from DB
            log_order_action(
                order=order,
                action_name=status_obj.name,
                user=user,
                remarks=reason
            )

        return Response({
            "message": "Order status updated successfully",
            "order_id": order.id,
            "status": status_obj.name
        })

class OrderLogsByOrderView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)

        logs = OrdersLog.objects.filter(order=order).exclude(action_id=1).order_by('-action_id')

        serializer = OrdersLogSerializer(logs, many=True)
        return Response(serializer.data)
    
class OrderDetailsByOrderView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, order_id):
        order = get_object_or_404(
            Order.objects.select_related("status")
            .prefetch_related("items"),
            id=order_id
        )

        serializer = OrderDetailSerializer(order)
        return Response(serializer.data)

class OrdersByUserView(APIView):
    permission_classes = [AllowAny]

    def get(self,request, user_id):
        orders = (
            Order.objects.filter(created_by=user_id)
            .select_related("status")
            .prefetch_related("items")
            .order_by("-created_at")
        )
    
        serializer = OrderListByUserIdSerializer(orders, many=True)

        return Response(serializer.data)
        
_status_cache = {}

def get_status(name):
    if name not in _status_cache:
        try:
            _status_cache[name] = OrderStatus.objects.get(name=name)
        except OrderStatus.DoesNotExist:
            return None
    return _status_cache[name]

class ApproveOrderView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if order.status.name != 'Order Created':
            return Response(
                {'error': f'Cannot approve. Current status: {order.status.name}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = get_status('Approved')
        order.approved_by = request.user if request.user.is_authenticated else None
        order.approved_at = datetime.now()
        order.save()
        
        return Response({
            'message': f'Order {order.order_number} approved successfully',
            'order_number': order.order_number,
            'status': order.status,
        })

class RejectOrderView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if order.status.name != 'Order Created':
            return Response(
                {'error': f'Cannot reject. Current status: {order.status.name}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', '')
        
        if not reason:
            return Response(
                {'error': 'Rejection reason is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = get_status('Rejected')
        order.rejected_by = request.user if request.user.is_authenticated else None
        order.rejected_at = datetime.now()
        order.rejection_reason = reason
        order.save()
        
        return Response({
            'message': f'Order {order.order_number} rejected',
            'order_number': order.order_number,
            'status': order.status,
        })

class OrderListView(APIView):
    permission_classes = [AllowAny]
        
    def get(self, request):
        
        status_filter = request.query_params.get('status', None) 
        user_id = request.query_params.get('user_id', None) 
        
        orders = Order.objects.filter(sap_created=False).order_by('-created_at')
        
        # Filter by user_id
        if user_id:
            orders = orders.filter(created_by=user_id)
        
        # Filter by status
        if status_filter:
            orders = orders.filter(status_id=status_filter)
        
        data = []
        for order in orders:
            items_qs = OrderItem.objects.filter(order=order)
            items_count = OrderItem.objects.filter(order=order).count()
            data.append({
                'id': order.id,
                'order_number': order.order_number,
                'card_code': order.card_code,
                'card_name': order.card_name,
                'total_amount': str(order.total_amount),
                'status': order.status.code,
                'status_display': order.status.name,
                'items_count': items_count,
                'created_by': order.created_by,
                'created_at': order.created_at,
                'delivery_date': order.delivery_date,
                'po_number': order.po_number,
                'bill_to_address': order.bill_to_address,
                'ship_to_address': order.ship_to_address,
                'dispatch_from_id': order.dispatch_from_id,
                'categories': list(
                    items_qs.exclude(category__isnull=True)
                    .exclude(category__exact='')
                    .values_list('category', flat=True)
                    .distinct()
                ),
                'items': list(items_qs.values())
            })

        return Response(data)  