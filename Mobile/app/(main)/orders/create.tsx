import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Modal,
  Animated,
} from "react-native"; 
import DateTimePicker from "@react-native-community/datetimepicker";
import { Text, Surface, TextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { COLORS, SPACING, RADIUS, GRADIENTS } from "@/src/constants/theme";
import Dropdown from "@/src/components/common/DropdownProps";
import { storage } from "@/src/utils/storage";
import {
  orderService,
  schemeService,
  PartyAddress,
  CreateOrderPayload,
} from "@/src/services/order.service";
import { useRouter, useNavigation, useLocalSearchParams } from "expo-router";

interface ItemRow {
  id: number;
  selectedCategory: string | null;
  selectedBrand: string | null;
  selectedVariety: string | null;
  selectedType: string | null;
  selectedProduct: string | null;
  selectedScheme: string | null;
  isScheme: boolean;
  isComboProduct: boolean;
  brands: { label: string; value: string }[];
  varieties: { label: string; value: string }[];
  types: { label: string; value: string }[];
  products: { label: string; value: string }[];
  schemes: { label: string; value: string }[];
  qty: string;
  schemeQty: string;
  pcs: string;
  salPackUnit: string;
  boxes: string;
  ltrs: string;
  schemePcsPerBox: number;
  schemeLtrsPerBox: number;
  marketPrice: string;
  basePrice: string;
  tax: string;
  itemTotal: string;
}

interface OrderItemType {
  id: number;
  itemCode: string;
  itemName: string;
  category: string;
  brand: string;
  variety: string;
  type: string;
  qty: number;
  scheme?: string | null;
  schemeName?: string | null;
  schemeQty?: number;
  pcs: number;
  boxes: number;
  ltrs: number;
  marketPrice: number;
  total: number;
  taxRate: number;
  basicPrice: number;
}

const emptyRow = (id: number): ItemRow => ({
  id,
  selectedCategory: null,
  selectedBrand: null,
  selectedVariety: null,
  selectedType: null,
  selectedProduct: null,
  selectedScheme: null,
  isScheme: false,
  isComboProduct: false,
  brands: [],
  varieties: [],
  types: [],
  products: [],
  schemes: [],
  qty: "",
  schemeQty: "",
  pcs: "",
  salPackUnit: "",
  boxes: "",
  ltrs: "",
  schemePcsPerBox: 0,
  schemeLtrsPerBox: 0,
  marketPrice: "",
  basePrice: "",
  tax: "",
  itemTotal: "",
});

const dedupePartyProducts = (products: any[]) => {
  const uniqueMap = new Map<string, any>();

  for (const product of products || []) {
    if (!product?.item_code) continue;

    const key = `${String(product.item_code)}|${String(product.category || "")}`;
    const existing = uniqueMap.get(key);

    // Prefer records with a non-null tax_rate when duplicates exist.
    if (!existing || (existing.tax_rate == null && product.tax_rate != null)) {
      uniqueMap.set(key, product);
    }
  }

  return Array.from(uniqueMap.values());
};

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayDate = () => formatDateForInput(new Date());

const getDefaultDeliveryDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  return formatDateForInput(date);
};

const toNumber = (value: string | number | null | undefined): number =>
  typeof value === "number" ? value : parseFloat(String(value ?? "")) || 0;

const calculateLtrsPerBox = (products: { sal_factor2?: number | string | null; sal_pack_unit?: number | string | null }[]) =>
  products.reduce(
    (sum, product) => sum + toNumber(product?.sal_factor2) * toNumber(product?.sal_pack_unit),
    0,
  );

const calculateComboLtrsFromItemName = ({
  itemName,
  defaultPcs,
}: {
  itemName: string | null | undefined;
  defaultPcs: string | number | null | undefined;
}) => {
  if (!itemName || !itemName.includes("+")) return 0;

  const parts = itemName
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) return 0;

  let totalLtrsPerCase = 0;

  for (const part of parts) {
    const volumeMatch = part.match(/(\d+(?:\.\d+)?)\s*(LTR|LITRE|LITER|L|ML)\b/i);
    if (!volumeMatch) continue;

    const rawVolume = toNumber(volumeMatch[1]);
    const unit = volumeMatch[2]?.toUpperCase();
    const volumeInLtrs = unit === "ML" ? rawVolume / 1000 : rawVolume;

    const pcsMatch = part.match(/(\d+(?:\.\d+)?)\s*(PCS|PC)\b/i);
    const pcs = pcsMatch ? toNumber(pcsMatch[1]) : toNumber(defaultPcs);

    totalLtrsPerCase += pcs * volumeInLtrs;
  }

  return totalLtrsPerCase;
};

const calculateRowLtrs = ({
  qty,
  pcs,
  salPackUnit,
}: {
  qty: string | number | null | undefined;
  pcs: string | number | null | undefined;
  salPackUnit: string | number | null | undefined;
}) => {
  const qtyNum = toNumber(qty);
  if (qtyNum <= 0) return "";

  const ltrsPerBox = toNumber(pcs) * toNumber(salPackUnit);
  
  return (qtyNum * ltrsPerBox).toFixed(2);
};

const getSelectedSchemeName = ({
  selectedScheme,
  schemes,
  fallbackSchemeName,
}: {
  selectedScheme: string | null | undefined;
  schemes: { label: string; value: string }[];
  fallbackSchemeName?: string | null;
}) => {
  if (!selectedScheme) return fallbackSchemeName ?? null;
  return (
    schemes.find((scheme) => String(scheme.value) === String(selectedScheme))?.label ??
    fallbackSchemeName ??
    null
  );
};

const calculateRowSchemeQty = ({
  qty,
  pcs,
  schemePcsPerBox,
  selectedSchemeName,
}: {
  qty: string | number | null | undefined;
  pcs: string | number | null | undefined;
  schemePcsPerBox: number;
  selectedSchemeName?: string | null;
}) => {
  const qtyNum = toNumber(qty);
  if (qtyNum <= 0) return "";

  const pcsNum = toNumber(pcs);
  const normalizedSchemeName = String(selectedSchemeName || "").toUpperCase();
  const multiplierMatch = normalizedSchemeName.match(/(\d+(?:\.\d+)?)/);
  const multiplier = multiplierMatch ? toNumber(multiplierMatch[1]) : 0;

  if (
    multiplier > 0 &&
    (normalizedSchemeName.includes("PER BOX") || normalizedSchemeName.includes("PER CASE"))
  ) {
    return (qtyNum * multiplier).toFixed(2);
  }

  if (
    multiplier > 0 &&
    (normalizedSchemeName.includes("PER PCS") || normalizedSchemeName.includes("PER PC"))
  ) {
    if (pcsNum <= 0) return "";
    return (qtyNum * pcsNum * multiplier).toFixed(2);
  }

  const pcsPerScheme = schemePcsPerBox > 0 ? schemePcsPerBox : toNumber(pcs);
  if (pcsPerScheme <= 0) return "";

  return (qtyNum * pcsPerScheme).toFixed(2);
};

const formatCalculationNumber = (value: string | number | null | undefined) => {
  const numericValue = toNumber(value);
  return Number.isInteger(numericValue)
    ? String(numericValue)
    : numericValue.toFixed(2).replace(/\.?0+$/, "");
};

const getConfirmedItemLtrsDisplay = (item: Pick<OrderItemType, "ltrs" | "schemeQty" | "scheme">) => {
  const totalLtrs = formatCalculationNumber(toNumber(item.ltrs) + toNumber(item.schemeQty));

  if (item.scheme && toNumber(item.schemeQty) > 0) {
    return totalLtrs;
  }

  return formatCalculationNumber(item.ltrs);
};

const getRowLtrsBreakdown = ({
  qty,
  pcs,
  salPackUnit,
  ltrs,
}: Pick<ItemRow, "qty" | "pcs" | "salPackUnit" | "ltrs">) => {
  const qtyNum = toNumber(qty);
  const totalLtrs = toNumber(ltrs);

  if (qtyNum <= 0 || totalLtrs <= 0) return "";

  const pcsNum = toNumber(pcs);
  const singlePieceLtrs = toNumber(salPackUnit);
  const totalPcs = qtyNum * pcsNum;

  if (pcsNum <= 0 || singlePieceLtrs <= 0 || totalPcs <= 0) return "";

  return `${formatCalculationNumber(qtyNum)} boxes x ${formatCalculationNumber(
    pcsNum,
  )} pcs = ${formatCalculationNumber(totalPcs)} pcs; ${formatCalculationNumber(
    totalPcs,
  )} pcs x ${formatCalculationNumber(singlePieceLtrs)} ltr = ${formatCalculationNumber(
    totalLtrs,
  )} ltr`;
};

const getConfirmedItemLtrsBreakdown = (item: Pick<OrderItemType, "qty" | "pcs" | "ltrs">) => {
  const qtyNum = toNumber(item.qty);
  const pcsNum = toNumber(item.pcs);
  const totalLtrs = toNumber(item.ltrs);
  const totalPcs = qtyNum * pcsNum;

  if (qtyNum <= 0 || pcsNum <= 0 || totalLtrs <= 0 || totalPcs <= 0) return "";

  const singlePieceLtrs = totalLtrs / totalPcs;

  return `${formatCalculationNumber(qtyNum)} boxes x ${formatCalculationNumber(
    pcsNum,
  )} pcs = ${formatCalculationNumber(totalPcs)} pcs; ${formatCalculationNumber(
    totalPcs,
  )} pcs x ${formatCalculationNumber(singlePieceLtrs)} ltr = ${formatCalculationNumber(
    totalLtrs,
  )} ltr`;
};

const calculateRowItemTotal = (row: Pick<ItemRow, "boxes" | "basePrice">) => {
  const totalPcs = toNumber(row.boxes);
  const basicPrice = toNumber(row.basePrice);
  return (totalPcs * basicPrice).toFixed(2);
};

export default function CreateOrderScreen() {
  const { user } = useAuth();
  const { orderId: editOrderId, mode } = useLocalSearchParams<{ orderId?: string; mode?: string }>();
  const isEditMode = mode === "edit" && !!editOrderId;

  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    orderNumber: string;
    message: string;
    needsApproval: boolean;
  } | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [editOrderLoaded, setEditOrderLoaded] = useState(false);
  const router = useRouter();
  const navigation = useNavigation();

  const today = new Date().toLocaleDateString("en-GB");

  // ── Order header ──────────────────────────────────────────────────────────
  const [partyName, setPartyName] = useState<string | null>(null);
  const [company, setCompany] = useState<number | null>(null);
  const [branch, setBranch] = useState<number | null>(null);
  const [poNumber, setPoNumber] = useState("");
  const [comment, setComment] = useState("");
  const [delivery, setDeliveryDate] = useState(getDefaultDeliveryDate());
  const [showPicker, setShowPicker] = useState(false);

  // ── Address dropdowns ─────────────────────────────────────────────────────
  const [billToAddresses, setBillToAddresses] = useState<
    { label: string; value: number; name: string }[]
  >([]);
  const [shipToAddresses, setShipToAddresses] = useState<
    { label: string; value: number; name: string }[]
  >([]);

  const [selectedBillTo, setSelectedBillTo] = useState<number | null>(null);
  const [selectedShipTo, setSelectedShipTo] = useState<number | null>(null);

  // ── Master data ───────────────────────────────────────────────────────────
  const [parties, setParties] = useState<{ label: string; value: string }[]>(
    [],
  );
  const [dispatches, setDispatches] = useState<
    { label: string; value: number }[]
  >([]);

  const [companies, setCompanies] = useState<
    { label: string; value: number }[]
  >([]);

  const [branches, setbranches] = useState<{ label: string; value: number }[]>(
    [],
  );

  const [partyProducts, setPartyProducts] = useState<any[]>([]);

  const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
  
  // ── Item rows (each row has its own isolated state) ───────────────────────
  const [itemRows, setItemRows] = useState<ItemRow[]>([]);

  // ── Confirmed order items ─────────────────────────────────────────────────
  const [orderItems, setOrderItems] = useState<OrderItemType[]>([]);
  const [assignedStateId, setAssignedStateId] = useState<number>(1);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const extractType = (itemName: string): string => {
    if (!itemName) return "Others";
    const pattern =
      /(\d+(?:\.\d+)?\s*(?:LTR|LITRE|LITER|L|ML|KG|KGS|GM|GMS|GRAM|G|PCS|PC|POUCH|TIN|JAR|BTL|CAN|BOTTLE|PACK|PKT|BOX)S?)\b/i;
    const match = itemName.toUpperCase().match(pattern);
    if (match) {
      let result = match[1].trim();
      result = result.replace(/(\d)([A-Z])/g, "$1 $2");
      return result;
    }
    return "Others";
  };

  /** Update a single field on a specific item row */
  const updateRow = (id: number, patch: Partial<ItemRow>) => {
    setItemRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  };

  useEffect(() => {
    const loadAssignedStateId = async () => {
      try {
        const storedUser = await storage.getUser();
        const stateId =
          storedUser?.states?.[0]?.id ??
          storedUser?.state?.id ??
          user?.states?.[0]?.id ??
          user?.state?.id ??
          1;

        setAssignedStateId(stateId);
      } catch (error) {
        console.log("Failed to load user states from storage:", error);
        setAssignedStateId(user?.states?.[0]?.id ?? user?.state?.id ?? 1);
      }
    };

    loadAssignedStateId();
  }, [user]);

  // ─── Fetch master data on mount ────────────────────────────────────────────
  useEffect(() => {
    fetchMasterData();
  }, []);

  // ─── Constants: active filters ────────────────────────────────────────────
  const ACTIVE_CATEGORY = "OIL"; 

  const fetchMasterData = async () => {

    try {

      setDataLoading(true);

      const partiesData = await orderService.getParties();
      console.log("getallparties"+JSON.stringify(partiesData));
      const partiesList = Array.isArray(partiesData) ? partiesData : [];

      const oilParties = partiesList.filter(
        (p: any) => p.category?.toUpperCase() === ACTIVE_CATEGORY,
      );

      setParties(
        (oilParties.length > 0 ? oilParties : partiesList).map((p) => ({
          label: p.label,
          value: p.value,
        })),
      );

      // const dispatchesData = await dispatchService.getDispatch();
      // setDispatches(
      //   (dispatchesData || []).map((d) => ({ label: d.name, value: d.id })),
      // ); 
      
      const branchesData = await orderService.getbranch("");
      setbranches(
        (branchesData || []).map((d: any) => ({
          label: d.bpl_name,
          value: d.bpl_id,
        })),
      );

      setCompanies([{ label: "Jivo Wellness", value: 1 }]);
      
    } catch (error) {
      Alert.alert("Error", "Failed to load data");
    } finally {
      setDataLoading(false);
    }

  };

  // ─── Edit mode: load existing order and pre-fill form ────────────────────
  const loadEditOrder = async () => {
    const id = Number(editOrderId);
    if (!id) return;
    try {
      const order = await orderService.getorderdetailsbyid(id);

      // Header fields
      setPartyName(order.card_code);
      setPoNumber(order.po_number || "");
      setDeliveryDate(order.delivery_date || getDefaultDeliveryDate());
      setCompany(1);
      if (order.dispatch_from_id) setBranch(Number(order.dispatch_from_id));

      // Addresses
      const addressData = await orderService.getAddresses(order.card_code);
      const mapAddr = (addr: PartyAddress) => ({
        label: (addr.address_id || "") + (addr.address_name ? `${addr.address_name}` : ""),
        value: addr.id,
        name: addr.address_name || "",
      });
      const billList = (addressData.bill_to || []).map(mapAddr);
      const shipList = (addressData.ship_to || []).map(mapAddr);
      setBillToAddresses(billList.length > 0 ? billList : shipList);
      setShipToAddresses(shipList.length > 0 ? shipList : billList);

      const billMatch = billList.find((a) => a.name === order.bill_to_address) ?? billList[0];
      const shipMatch = shipList.find((a) => a.name === order.ship_to_address) ?? shipList[0];
      if (billMatch) setSelectedBillTo(billMatch.value);
      if (shipMatch) setSelectedShipTo(shipMatch.value);

      // Products (needed if user wants to add more items)
      const productsResponse = await orderService.getPartyProducts(order.card_code);
      const allProducts = dedupePartyProducts(Array.isArray(productsResponse) ? productsResponse : []);
      setPartyProducts(allProducts);
      const uniqueCategories = [...new Set<string>(allProducts.map((p: any) => p.category).filter(Boolean))];
      setCategories(uniqueCategories.sort().map((c) => ({ label: c, value: c })));

      // Pre-fill confirmed order items
      const items: OrderItemType[] = (order.items || []).map((item: any, idx: number) => ({
        id: item.id ?? Date.now() + idx,
        itemCode: item.item_code ?? "",
        itemName: item.item_name ?? "",
        category: item.category ?? "",
        brand: item.brand ?? "",
        variety: item.variety ?? "",
      type: item.item_type ?? "",
      qty: Number(item.qty) || 0,
      scheme: item.scheme_id ?? null,
      schemeName: item.scheme_name ?? null,
      schemeQty: Number(item.qty_scheme) || 0,
      pcs: Number(item.pcs) || 0,
      boxes: Number(item.boxes) || 0,
      ltrs: Number(item.ltrs) || 0,
        marketPrice: Number(item.market_price) || 0,
        total: Number(item.total) || 0,
        taxRate: Number(item.tax_rate) || 0,
        basicPrice: Number(item.basic_price) || 0,
      }));
      setOrderItems(items);
      setEditOrderLoaded(true);
    } catch (err) {
      console.log("Failed to load order for edit:", err);
    }
  };

  useEffect(() => {
    if (!dataLoading && isEditMode && !editOrderLoaded) {
      loadEditOrder();
    }
  }, [dataLoading]);

  // ─── Party change → load addresses + products ─────────────────────────────
  /**
   * FIX 1 & 2: Auto-select first address AND filter by user's category.
   * We derive the user's category from their main_group name (adjust the
   * mapping below if your data uses different strings).
   */

  const getUserCategory = (): string | null => {
    if (!user?.main_group) return null;
    const raw = Array.isArray(user.main_group)
      ? user.main_group[0]?.name
      : user.main_group?.name;
    if (!raw) return null;
    return raw.toLowerCase();
  };

  const filterAddressesByCategory = (
    addresses: { label: string; value: number; category?: string }[],
    userCategory: string | null,
  ) => {
    if (!userCategory) return addresses;
    // If the address object carries a category field, filter by it.
    // If your API doesn't include category on addresses, remove this filter
    // and the function just returns all addresses unchanged.
    const filtered = addresses.filter(
      (a: any) => !a.category || a.category.toLowerCase() === userCategory,
    );
    return filtered.length > 0 ? filtered : addresses;
  };

  const handlePartyChange = async (cardCode: string) => {
    setPartyName(cardCode);

    // Reset addresses
    setBillToAddresses([]);
    setShipToAddresses([]);
    setSelectedBillTo(null);
    setSelectedShipTo(null);

    // Reset product cascade
    setPartyProducts([]);
    setCategories([]);
    setItemRows([]);
    setOrderItems([]);

    try {
      const addressData = await orderService.getAddresses(cardCode);

      const mapAddr = (addr: PartyAddress) => ({
        label:
          (addr.address_id || "") +
          (addr.address_name ? `${addr.address_name}` : ""),
        value: addr.id,
        name: addr.address_name || "",
        category: (addr as any).category,
      });

      const filterOil = (list: any[]) => {
        const filtered = list.filter(
          (a) => !a.category || a.category.toUpperCase() === ACTIVE_CATEGORY,
        );
        return filtered.length > 0 ? filtered : list;
      };

      const rawBillTo = filterOil((addressData.bill_to || []).map(mapAddr));
      const rawShipTo = filterOil((addressData.ship_to || []).map(mapAddr));

      const finalBillTo = rawBillTo.length > 0 ? rawBillTo : rawShipTo;
      const finalShipTo = rawShipTo.length > 0 ? rawShipTo : rawBillTo;

      setBillToAddresses(finalBillTo);
      setShipToAddresses(finalShipTo);    
        
      if (finalBillTo.length > 0) setSelectedBillTo(finalBillTo[0].value);
      if (finalShipTo.length > 0) setSelectedShipTo(finalShipTo[0].value);

      const productsResponse = await orderService.getPartyProducts(cardCode);
      const allProducts = Array.isArray(productsResponse) ? productsResponse : [];
      console.log(
        "All products for party:",
        JSON.stringify(allProducts, null, 2),
      );
      const filteredProducts = allProducts.filter(
        (p: any) =>
          p.category?.toUpperCase() === ACTIVE_CATEGORY,
      );
      const products = dedupePartyProducts(
        filteredProducts.length > 0 ? filteredProducts : allProducts,
      );
      setPartyProducts(products);
      
      const uniqueCategories = [
        ...new Set<string>(
          products.map((p: any) => p.category).filter(Boolean),
        ),
      ];
      setCategories(
        uniqueCategories.sort().map((c) => ({ label: c, value: c })),
      );
    } catch (err) {
      console.log("Failed to fetch party data:", err);
    }
  };

  // ─── Per-row cascade handlers ──────────────────────────────────────────────

  const handleRowCategoryChange = (rowId: number, category: string) => {
    const filtered = partyProducts.filter((p: any) => p.category === category);
    const uniqueBrands = [
      ...new Set<string>(filtered.map((p: any) => p.brand).filter(Boolean)),
    ];
    updateRow(rowId, {
      selectedCategory: category,
      selectedBrand: null,
      selectedVariety: null,
      selectedType: null,
      selectedProduct: null,
      selectedScheme: null,
      isComboProduct: false,
      brands: uniqueBrands.sort().map((b) => ({ label: b, value: b })),
      varieties: [],
      types: [],
      products: [],
      schemes: [],
      pcs: "",
      salPackUnit: "",
      schemePcsPerBox: 0,
      schemeLtrsPerBox: 0,
      tax: "",
      basePrice: "",
      marketPrice: "",
      qty: "",
      schemeQty: "",
      boxes: "",
      ltrs: "",
      itemTotal: "",
    });
  };

  const handleRowBrandChange = (rowId: number, brand: string, row: ItemRow) => {
    const filtered = partyProducts.filter(
      (p: any) => p.category === row.selectedCategory && p.brand === brand,
    );
    const uniqueVarieties = [
      ...new Set<string>(filtered.map((p: any) => p.variety).filter(Boolean)),
    ];
    updateRow(rowId, {
      selectedBrand: brand,
      selectedVariety: null,
      selectedType: null,
      selectedProduct: null,
      selectedScheme: null,
      varieties: uniqueVarieties.sort().map((v) => ({ label: v, value: v })),
      types: [],
      products: [],
      schemes: [],
    });
  };

  const handleRowVarietyChange = (
    rowId: number,
    variety: string,
    row: ItemRow,
  ) => {
    const filtered = partyProducts.filter(
      (p: any) =>
        p.category === row.selectedCategory &&
        p.brand === row.selectedBrand &&
        p.variety === variety,
    );
    const typesSet = new Set<string>();
    filtered.forEach((p: any) => typesSet.add(extractType(p.item_name)));
    const sortedTypes = [...typesSet].sort((a, b) => {
      if (a === "Others") return 1;
      if (b === "Others") return -1;
      return parseFloat(a) - parseFloat(b);
    });
    updateRow(rowId, {
      selectedVariety: variety,
      selectedType: null,
      selectedProduct: null,
      selectedScheme: null,
      types: sortedTypes.map((t) => ({ label: t, value: t })),
      products: [],
      schemes: [],
    });
  };

  const handleRowTypeChange = (rowId: number, type: string, row: ItemRow) => {
    const filtered = partyProducts.filter(
      (p: any) =>
        p.category === row.selectedCategory &&
        p.brand === row.selectedBrand &&
        p.variety === row.selectedVariety &&
        extractType(p.item_name) === type,
    );
    updateRow(rowId, {
      selectedType: type,
      selectedProduct: null,
      selectedScheme: null,
      products: filtered.map((p: any) => ({
        label: `${p.item_name} (₹${p.basic_rate})`,
        value: p.item_code,
      })),
      schemes: [],
    });
  };

  const handleRowProductChange = async (rowId: number, productId: string) => {
    const product = partyProducts.find(
      (p: any) => String(p.item_code) === String(productId),
    );
    if (product) {
      const pcsPerCase = toNumber(product.sal_factor2);
      const pcs = pcsPerCase.toString();
      const salPackUnit = product.sal_pack_unit?.toString() || "0";
      const isComboProduct =
        Boolean(product.combo_scheme_name) || String(product.item_name || "").includes("+");
      const comboSchemeName: string | null = product.combo_scheme_name ?? null;
      let comboSchemeId: string | null = product.combo_scheme_id
        ? String(product.combo_scheme_id)
        : null;
      const hasPrefilledScheme = Boolean(comboSchemeId || comboSchemeName);
      let schemePcsPerBox = 0;

      if (comboSchemeName) {
        const comboItems = dedupePartyProducts(
          partyProducts.filter((p: any) => p.combo_scheme_name === comboSchemeName),
        );
        schemePcsPerBox = comboItems
          .filter((item: any) => String(item.item_code) !== String(product.item_code))
          .reduce((sum, item: any) => sum + toNumber(item.sal_factor2), 0);
      }

      updateRow(rowId, {
        selectedProduct: productId,
        selectedScheme: comboSchemeId,
        isScheme: hasPrefilledScheme,
        isComboProduct,
        schemes: [],
        pcs,
        salPackUnit,
        schemeQty: hasPrefilledScheme
          ? calculateRowSchemeQty({
              qty: "",
              pcs,
              schemePcsPerBox,
              selectedSchemeName: comboSchemeName,
            }) || ""
          : "",
        schemePcsPerBox,
        tax: product.tax_rate ? product.tax_rate.toString() : "0",
        basePrice: product.basic_rate?.toString() || "0",
        itemTotal: calculateRowItemTotal({
          boxes: "",
          basePrice: product.basic_rate?.toString() || "0",
        }),
      });
      try {
        const schemeData = await schemeService.getSchemes(assignedStateId);
        const schemes = schemeData.map((s) => ({
          label: s.scheme_name,
          value: String(s.scheme_id),
        }));
        if (!comboSchemeId && comboSchemeName) {
          const comboScheme = schemes.find((scheme) => scheme.label === comboSchemeName);
          comboSchemeId = comboScheme?.value ?? null;
        }
        updateRow(rowId, {
          schemes,
          selectedScheme: comboSchemeId,
          isScheme: Boolean(comboSchemeId),
        });
      } catch {
        // no schemes available — leave schemes: []
      }
      let schemeLtrsPerBox = 0;

      if (comboSchemeName) {
        const comboItems = dedupePartyProducts(partyProducts.filter(
          (p: any) => p.combo_scheme_name === comboSchemeName
        ));
        schemeLtrsPerBox = calculateLtrsPerBox(comboItems);

        if (comboItems.length <= 1 || schemeLtrsPerBox <= 0) {
          try {
            const fullComboItems = await schemeService.getSchemeProductsByName(
              comboSchemeName,
              assignedStateId,
            );
            schemeLtrsPerBox = calculateLtrsPerBox(fullComboItems);
          } catch {
            try {
              const fullComboItems = await schemeService.getComboByItemCode(
                String(product.item_code),
                assignedStateId,
              );
              schemeLtrsPerBox = calculateLtrsPerBox(fullComboItems);
            } catch {
              // Keep the local fallback value if combo expansion fails.
            }
          }
        }

      }

      if (schemeLtrsPerBox <= 0) {
        schemeLtrsPerBox = calculateComboLtrsFromItemName({
          itemName: product.item_name,
          defaultPcs: pcsPerCase,
        });
      }

      setItemRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;

          const qtyNum = toNumber(row.qty);
          const ltrs = calculateRowLtrs({
            qty: qtyNum,
            pcs: pcsPerCase,
            salPackUnit,
          });

          return {
            ...row,
            selectedScheme: comboSchemeId,
            isScheme: Boolean(comboSchemeId),
            isComboProduct,
            schemePcsPerBox,
            schemeLtrsPerBox,
            schemeQty: Boolean(comboSchemeId)
              ? calculateRowSchemeQty({
                  qty: row.qty,
                  pcs: pcsPerCase,
                  schemePcsPerBox,
                  selectedSchemeName: getSelectedSchemeName({
                    selectedScheme: comboSchemeId,
                    schemes: row.schemes,
                    fallbackSchemeName: comboSchemeName,
                  }),
                }) || row.schemeQty
              : "",
            ltrs,
          };
        }),
      );

    }
  };

  const handleRowIsSchemeToggle = (rowId: number, value: boolean) => {
    if (!value) {
      setItemRows((prev) =>
        prev.map((r) => {
          if (r.id !== rowId) return r;
          const qtyNum = parseFloat(r.qty) || 0;
          const pcsNum = parseFloat(r.pcs) || 0;
          const totalPcs = qtyNum * pcsNum;
          const boxes = totalPcs.toString();
          return {
            ...r,
            isScheme: false,
            selectedScheme: null,
            schemeQty: "",
            schemePcsPerBox: 0,
            schemeLtrsPerBox: 0,
            boxes,
            ltrs: calculateRowLtrs({
              qty: qtyNum,
              pcs: r.pcs,
              salPackUnit: r.salPackUnit,
            }),
            itemTotal: calculateRowItemTotal({ boxes, basePrice: r.basePrice }),
          };
        }),
      );
    } else {
      setItemRows((prev) =>
        prev.map((r) => {
          if (r.id !== rowId) return r;
          const autoSelectedScheme =
            r.selectedScheme ??
            (r.schemes.length === 1 ? String(r.schemes[0].value) : null);

          return {
            ...r,
            isScheme: true,
            selectedScheme: autoSelectedScheme,
            schemeQty:
              calculateRowSchemeQty({
                qty: r.qty,
                pcs: r.pcs,
                schemePcsPerBox: r.schemePcsPerBox,
                selectedSchemeName: getSelectedSchemeName({
                  selectedScheme: autoSelectedScheme,
                  schemes: r.schemes,
                }),
              }) || r.schemeQty,
          };
        }),
      );
    }
  };
  
  const handleRowSchemeChange = (rowId: number, scheme: string) => {
    setItemRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        return {
          ...row,
          isScheme: Boolean(scheme),
          selectedScheme: scheme,
          schemeQty:
            Boolean(scheme)
              ? calculateRowSchemeQty({
                  qty: row.qty,
                  pcs: row.pcs,
                  schemePcsPerBox: row.schemePcsPerBox,
                  selectedSchemeName: getSelectedSchemeName({
                    selectedScheme: scheme,
                    schemes: row.schemes,
                  }),
                }) || row.schemeQty
              : "",
        };
      }),
    );
  };

  const handleRowQtyChange = (rowId: number, value: string) => {
    setItemRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const qtyNum = parseFloat(value) || 0;
        const pcsNum = parseFloat(r.pcs) || 0;
        const totalPcs = qtyNum * pcsNum;
        const ltrs = calculateRowLtrs({
          qty: value,
          pcs: r.pcs,
          salPackUnit: r.salPackUnit,
        });
        return {
          ...r,
          qty: value,
          boxes: totalPcs.toString(),
          schemeQty:
            r.isScheme
              ? calculateRowSchemeQty({
                  qty: value,
                  pcs: r.pcs,
                  schemePcsPerBox: r.schemePcsPerBox,
                  selectedSchemeName: getSelectedSchemeName({
                    selectedScheme: r.selectedScheme,
                    schemes: r.schemes,
                  }),
                }) || r.schemeQty
              : r.schemeQty,
          ltrs,
          itemTotal: calculateRowItemTotal({
            boxes: totalPcs.toString(),
            basePrice: r.basePrice,
          }),
        };
      }),
    );
  };

  const handleRowMarketPriceChange = (rowId: number, value: string) => {
    setItemRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          marketPrice: value,
          itemTotal: calculateRowItemTotal({
            boxes: r.boxes,
            basePrice: r.basePrice,
          }),
        };
      }),
    );
  };

  const addItem = () => {
    const hasIncompleteRow = itemRows.some(
      (row) =>
        !row.selectedCategory ||
        !row.selectedProduct ||
        !row.qty ||
        (!row.marketPrice && !row.basePrice) ||
        !row.boxes,
    );

    if (hasIncompleteRow) {
      Alert.alert(
        "Incomplete Item",
        "Please fill all fields in the current item row before adding a new row.",
      );
      return;
    }

    const newId = Date.now();
    setItemRows((prev) => [...prev, emptyRow(newId)]);
  };

  const removeItem = (id: number) => {
    setItemRows((prev) => prev.filter((r) => r.id !== id));
  };

  // ─── Confirm a row into orderItems ────────────────────────────────────────

  const addItemToOrder = (rowId: number) => {
    const row = itemRows.find((r) => r.id === rowId);
    if (!row) return;

    if (!row.selectedCategory || !row.selectedProduct || !row.boxes) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    if ((row.isScheme || row.isComboProduct) && !row.selectedScheme) {
      Alert.alert("Error", "Please select a scheme before confirming this item");
      return;
    }

    const product = partyProducts.find(
      (p: any) => String(p.item_code) === String(row.selectedProduct),
    );
    if (!product) return;

    const effectiveMarketPrice = parseFloat(row.marketPrice) || parseFloat(row.basePrice) || 0;
    const effectiveTotal =
      parseFloat(row.itemTotal) ||
      toNumber(calculateRowItemTotal({
        boxes: row.boxes,
        basePrice: row.basePrice,
      }));

    const effectiveSchemeId = row.selectedScheme;
    const effectiveSchemeName = effectiveSchemeId
      ? row.schemes.find((scheme) => String(scheme.value) === String(effectiveSchemeId))?.label ?? null
      : null;

    const newItem: OrderItemType = {
      id: Date.now(),
      itemCode: product.item_code || "",
      itemName: product.item_name || "",
      category: row.selectedCategory || "",
      brand: row.selectedBrand || "",
      variety: row.selectedVariety || "",
      type: row.selectedType || "",
      qty: parseFloat(row.qty) || 0,
      scheme: effectiveSchemeId,
      schemeName: effectiveSchemeName,
      schemeQty: effectiveSchemeId ? parseFloat(row.schemeQty) || 0 : 0,
      pcs: parseFloat(row.pcs) || 0,
      boxes: parseFloat(row.boxes) || 0,
      ltrs: parseFloat(row.ltrs) || 0,
      marketPrice: parseFloat(row.marketPrice) || 0,
      total: effectiveTotal,
      taxRate: parseFloat(row.tax) || 0,
      basicPrice: parseFloat(row.basePrice) || product.basic_rate || 0,
    };

    setOrderItems((prev) => [...prev, newItem]);
    // FIX 3: Remove the confirmed row so the next item starts fresh
    setItemRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const removeOrderItem = (id: number) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  };
  
  // ─── Totals (FIX 5) ────────────────────────────────────────────────────────

  const totalWithoutTax = orderItems
    .reduce((sum, item) => sum + item.total, 0)
    .toFixed(2);

  const totalTaxAmount = orderItems
    .reduce((sum, item) => {
      const base = item.total || 0;
      return sum + (base * item.taxRate) / 100;
    }, 0)
    .toFixed(2);

  const grandTotal = (
    parseFloat(totalWithoutTax) + parseFloat(totalTaxAmount)
  ).toFixed(2);

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!partyName) return Alert.alert("Error", "Select a party");
    if (!branch) return Alert.alert("Error", "Select dispatch location");
    if (!company) return Alert.alert("Error", "Select company");
    // if (!selectedBillTo) return Alert.alert("Error", "Select bill to address");
    if (!selectedShipTo) return Alert.alert("Error", "Select ship to address");
    // if (!poNumber) return Alert.alert("Error", "Select Po Number");
    if (!delivery) return Alert.alert("Error", "Select delivery date");
    if (!branch) return Alert.alert("Error", "Select dispatch location");

    if (orderItems.length === 0)
      return Alert.alert("Error", "Add at least one item");

    console.log("logdata2 " + !partyName + orderItems.length);
    if (!partyName || orderItems.length === 0) {
      Alert.alert("Error", "Select a party and add at least one item");
      return;
    }
    try {
      setLoading(true);
      const payload: CreateOrderPayload = {
        user_id: user?.id || 0,
        card_code: partyName,
        card_name: parties.find((p) => p.value === partyName)?.label ?? "",
        bill_to_id: selectedBillTo ?? 0,
        bill_to_address:
          billToAddresses.find((a) => a.value === selectedBillTo)?.name ?? "",
        ship_to_id: selectedShipTo ?? 0,
        ship_to_address:
          shipToAddresses.find((a) => a.value === selectedShipTo)?.name ?? "",
        dispatch_from_id: branch ?? 0,
        dispatch_from_name:
          branches.find((d) => d.value === branch)?.label ?? "",
        delivery_date: delivery,
        company: String(company ?? ""),
        po_number: String(poNumber ?? ""),
        remarks: String(comment ?? ""),
        items: orderItems.map((item) => ({
          item_code: String(item.itemCode ?? ""),
          item_name: String(item.itemName ?? ""),
          category: String(item.category ?? ""),
          brand: String(item.brand ?? ""),
          variety: String(item.variety ?? ""),
          item_type: String(item.type ?? ""),
          qty: Number(item.boxes) || 0,
          scheme_id: item.scheme ? Number(item.scheme) : null,
          scheme_name: item.schemeName ? String(item.schemeName) : null,
          is_scheme_visible: Boolean(item.scheme || item.schemeName || item.schemeQty),
          scheme_qty: item.scheme ? Number(item.schemeQty) || 0 : 0,
          pcs: Number(item.pcs) || 0,
          boxes: Number(item.qty) || 0,
          ltrs: Number(item.ltrs) || 0,
          market_price: Number(item.marketPrice) || 0,
          total: Number(item.total) || 0,
          tax_rate: Number(item.taxRate) || 0,
          basic_price: Number(item.basicPrice) || 0,
        })),
      };

      if (isEditMode) {

        const response = await orderService.updateOrder(Number(editOrderId), payload);
        if (response?.id || response?.order_number) {
          Alert.alert(
            "Success",
            response.message || "Order updated and sent to auditor",
            [{ text: "OK", onPress: () => router.back() }]
          );
        } else {
          Alert.alert("Error", response?.message || "Failed to update order");
        }

      } else {

        console.log("Create order payload:", JSON.stringify(payload, null, 2));
        const response = await orderService.createOrder(payload);
        if (response?.order_number || response?.message?.includes("Order sent")) {
          setOrderResult({
            orderNumber: response.order_number || "",
            message: response.message || "Order created successfully",
            needsApproval: response.needs_approval || false,
          });
          setSuccessModal(true);
          handleClear({ keepSuccessModal: true });
        } else {
          Alert.alert("Error", "Something went wrong. Please try again.");
        }
        
      }
    } catch (error) {
      Alert.alert("Error", isEditMode ? "Failed to update order" : "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

 const handleClear = (options?: { keepSuccessModal?: boolean }) => {
    setPartyName(null);
    setBranch(null);
    setCompany(null);
    setPoNumber("");
    setComment("");
    setItemRows([]);
    setOrderItems([]);
    setBillToAddresses([]);
    setShipToAddresses([]);
    setSelectedBillTo(null);
    setSelectedShipTo(null);
    setDeliveryDate(getDefaultDeliveryDate());
    setPartyProducts([]);
    setCategories([]);
    if (!options?.keepSuccessModal) {
      setSuccessModal(false);
      setOrderResult(null);
    }
  };

  const handleBack = () => {
    handleClear();
    router.back();
  };

  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Edit Order" : "Create Order",
      headerLeft: () => (
        <TouchableOpacity onPress={handleBack} style={{ marginLeft: 10 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, isEditMode]);

  if (dataLoading || (isEditMode && !editOrderLoaded)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{isEditMode && !dataLoading ? "Loading order..." : "Loading..."}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Order Details Card ─────────────────────────────────────────── */}
        <Surface style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Order Details</Text>
            <Text style={styles.dateText}>{today}</Text>
          </View>

          <View style={styles.field}>
            <Dropdown
              label="Party Name *"
              data={parties}
              onChange={handlePartyChange}
              value={partyName}
              placeholder="Select party..."
              searchable={true}
              icon="storefront-outline"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Dropdown
                label="Dispatch From *"
                data={branches}
                value={branch}
                onChange={setBranch}
                placeholder="Select..."
                icon="business-outline"
              />
            </View>
            
            <View style={styles.halfField}>
              <Dropdown
                label="Company *"
                data={companies}
                value={company}
                onChange={setCompany}
                placeholder="Select..."
                icon="briefcase-outline"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Dropdown
              label="Bill To Address *"
              data={billToAddresses}
              value={selectedBillTo}
              onChange={setSelectedBillTo}
              placeholder="Select Bill To..."
            />
          </View>

          <View style={styles.field}>
            <Dropdown
              label="Ship To Address *"
              data={shipToAddresses}
              value={selectedShipTo}
              onChange={setSelectedShipTo}
              placeholder="Select Ship To..."
            />
          </View>

      
          {/* Delivery Date — web: native <input type="date">, app: DateTimePicker */}
          <View style={styles.field}>
            {Platform.OS === "web" ? (
              // ── Web: plain HTML date input styled to match TextInput ──
              <View style={styles.webDateWrapper}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.webDateIcon}
                />
                <View style={styles.webDateInner}>
                  <Text style={styles.webDateLabel}>Delivery Date *</Text>
                  {/* @ts-ignore — 'input' is valid on web */}
                  <input
                    type="date"
                    value={delivery}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e: any) => setDeliveryDate(e.target.value)}
                    style={{
                      border: "none",
                      outline: "none",
                      fontSize: 14,
                      color: COLORS.black,
                      background: "transparent",
                      width: "100%",
                      cursor: "pointer",
                    }}
                  />
                </View>
              </View>
            ) : (
              // ── Native (iOS / Android): DateTimePicker ────────────────
              <>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowPicker(true)}
                >
                  <TextInput
                    label="Delivery Date *"
                    value={delivery}
                    mode="outlined"
                    editable={false}
                    pointerEvents="none"
                    textColor={COLORS.black}
                    style={styles.input}
                    outlineColor={COLORS.border}
                    activeOutlineColor={COLORS.primary}
                    left={<TextInput.Icon icon="calendar-outline" />}
                  />
                </TouchableOpacity>

                {showPicker && (
                  <DateTimePicker
                    value={delivery ? new Date(delivery) : new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowPicker(false);
                      if (selectedDate) {
                        const formatted = selectedDate
                          .toISOString()
                          .split("T")[0];
                        setDeliveryDate(formatted);
                      }
                    }}
                  />
                )}
              </>
            )}
          </View>
        </Surface>

        <Surface style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cube" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Items</Text>
            <TouchableOpacity style={styles.addBtn} onPress={addItem}>
              <Ionicons name="add" size={18} color={COLORS.textLight} />
              <Text style={styles.addBtnText}>New Item</Text>
            </TouchableOpacity>
          </View>

          {itemRows.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No items added</Text>
              <Text style={styles.emptySubtext}>
                {'Tap "New Item" to add products'}
              </Text>
            </View>
          ) : (
            itemRows.map((row, index) => (
              <View key={row.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemNumber}>New Item {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeItem(row.id)}>
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={COLORS.error}
                    />
                  </TouchableOpacity>
                </View>

                {/* Category */}
                <View style={styles.field}>
                  <Dropdown
                    label="Category *"
                    data={categories}
                    value={row.selectedCategory}
                    onChange={(val) => handleRowCategoryChange(row.id, val)}
                    placeholder="Select Category..."
                    icon="grid-outline"
                  />
                </View>

                {/* Brand + Variety */}
                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Dropdown
                      label="Brand"
                      data={row.brands}
                      value={row.selectedBrand}
                      onChange={(val) => handleRowBrandChange(row.id, val, row)}
                      placeholder="Select Brand..."
                      icon="pricetag-outline"
                      disabled={!row.selectedCategory}
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Dropdown
                      label="Variety"
                      data={row.varieties}
                      value={row.selectedVariety}
                      onChange={(val) =>
                        handleRowVarietyChange(row.id, val, row)
                      }
                      placeholder="Select Variety..."
                      icon="layers-outline"
                      disabled={!row.selectedBrand}
                    />
                  </View>
                </View>

                {/* Type */}
                <View style={styles.field}>
                  <Dropdown
                    label="Type"
                    data={row.types}
                    value={row.selectedType}
                    onChange={(val) => handleRowTypeChange(row.id, val, row)}
                    placeholder="Select Type..."
                    icon="grid-outline"
                    disabled={!row.selectedVariety}
                  />
                </View>
                         
                {/* Item */}
                <View style={styles.field}>
                  <Dropdown
                    label="Item *"
                    data={row.products}
                    value={row.selectedProduct}
                    onChange={(val) => handleRowProductChange(row.id, val)}
                    placeholder="Select Item..."
                    icon="cube-outline"
                    disabled={!row.selectedType}
                    searchable={true}
                  />
                </View>

                {row.selectedProduct && (
                  <View style={styles.schemeRow}>
                    <View style={styles.schemeToggleCompact}>
                      <Text style={styles.schemeToggleLabel}>Scheme</Text>
                      <Switch
                        value={row.isScheme}
                        onValueChange={(val) =>
                          handleRowIsSchemeToggle(row.id, val)
                        }
                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                        thumbColor={COLORS.textLight}
                      />
                    </View>
                    <View style={styles.schemeDropdownField}>
                      <Dropdown
                        label="Scheme"
                        data={row.schemes}
                        value={row.selectedScheme}
                        onChange={(val) => handleRowSchemeChange(row.id, val)}
                        placeholder="Scheme..."
                        icon="gift-outline"
                        disabled={!row.isScheme}
                      />
                    </View>
                    {row.selectedScheme ? (
                      <View style={styles.schemeQtyField}>
                        <TextInput
                          label="Qty"
                          textColor={COLORS.black}
                          value={row.schemeQty}
                          mode="outlined"
                          keyboardType="numeric"
                          style={styles.input}
                          outlineColor={COLORS.border}
                          activeOutlineColor={COLORS.primary}
                          editable={false}
                        />
                      </View>
                    ) : null}
                  </View>
                )}

                {/* PCS per case / Ltrs / Total PCS (read-only, auto-calculated) */}
                <View style={styles.row}>
                  <View style={styles.thirdField}>
                    <TextInput
                      label="PCS/Case"
                      textColor={COLORS.black}
                      value={row.pcs}
                      editable={false}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.input}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />
                  </View>

                  <View style={styles.thirdField}>
                    <TextInput
                      label="Total Ltrs"
                      textColor={COLORS.black}
                      value={row.ltrs}
                      editable={false}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.input}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />
                  </View>
                   
                  <View style={styles.thirdField}>
                    <TextInput
                      label="Total PCS"
                      value={row.boxes}
                      textColor={COLORS.black}
                      editable={false}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.input}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />
                  </View>
                  
                </View>

                {/* QTY + TAX */}
                <View style={styles.row}>
                  <View style={styles.thirdField}>
                    <TextInput
                      label="Boxes"
                      textColor={COLORS.black}
                      value={row.qty}
                      onChangeText={(val) =>
                        handleRowQtyChange(row.id, val)
                      }
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.input}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />
                  </View>
                  <View style={styles.thirdField}>
                    <TextInput
                      label="TAX %"
                      value={row.tax}
                      textColor={COLORS.black}
                      editable={false}
                      mode="outlined"
                      style={styles.input}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />
                  </View>
                </View>

                {/* {!!getRowLtrsBreakdown(row) && (
                  <Text style={styles.calcBreakdownText}>
                    {getRowLtrsBreakdown(row)}
                  </Text>
                )} */}

                {/* Base Price + Market Price */}
                <View style={styles.row}>
                  <View style={styles.thirdField}>
                    <TextInput
                      label="Basic Price"
                      textColor={COLORS.black}
                      value={row.basePrice}
                      editable={false}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.input}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />
                  </View>
                  <View style={styles.thirdField}>
                    <TextInput
                      label="Market Price"
                      textColor={COLORS.black}
                      value={row.marketPrice}
                      onChangeText={(val) =>
                        handleRowMarketPriceChange(row.id, val)
                      }
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.input}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />
                  </View>
                </View>

                {/* Item subtotal */}
                {!!(row.itemTotal && parseFloat(row.itemTotal) > 0) && (
                  <View style={styles.itemSubtotalRow}>
                    <Text style={styles.itemSubtotalLabel}>Item Total:</Text>
                    <Text style={styles.itemSubtotalValue}>
                      ₹{row.itemTotal}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => addItemToOrder(row.id)}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.addButtonText}>Confirm Item</Text>
                </TouchableOpacity>
                
              </View>
            ))
          )}
        </Surface>

        {/* ── Confirmed Order Items ──────────────────────────────────────── */}
        {orderItems.length > 0 && (
          <Surface style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="checkmark-done"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.cardTitle}>
                Order Items ({orderItems.length})
              </Text>
            </View>

            {orderItems.map((item, index) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>
                    {index + 1}. {item.itemName}
                  </Text>
                  <TouchableOpacity onPress={() => removeOrderItem(item.id)}>
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={COLORS.error}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemCategory}>
                  {item.category} | {item.brand} | {item.variety}
                </Text>
                {!!item.scheme && (
                  <Text style={styles.itemCategory}>
                    Scheme: {item.schemeName || item.scheme} | Qty Scheme: {item.schemeQty || 0}
                  </Text>
                )}
                <View style={styles.itemDetails}>
                  <Text style={styles.itemDetail}>Boxes: {item.qty}</Text>
                  <Text style={styles.itemDetail}>PCS/Case: {item.pcs}</Text>
                  <Text style={styles.itemDetail}>Total PCS: {item.boxes}</Text>
                </View>
                <Text style={styles.itemDetailBold}>
                  Total Ltrs: {getConfirmedItemLtrsDisplay(item)}
                </Text>
                {/* {!!getConfirmedItemLtrsBreakdown(item) && (
                  <Text style={styles.calcBreakdownText}>
                    {getConfirmedItemLtrsBreakdown(item)}
                  </Text>
                )} */}
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemDetail}>Tax: {item.taxRate}%</Text>
                  <Text style={styles.itemAmount}>
                    ₹{item.total.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}

            {/* ── FIX 5: Three-tier totals ─────────────────────────────── */}
            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total (Without Tax)</Text>
                <Text style={styles.totalValue}>₹{totalWithoutTax}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax Amount</Text>
                <Text style={styles.totalValue}>₹{totalTaxAmount}</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalValue}>₹{grandTotal}</Text>
              </View>
            </View>
          </Surface>
        )}

        {/* ── Comment ───────────────────────────────────────────────────── */}
        <Surface style={styles.card}>
          <TextInput
            label="Comment (optional)"
            value={comment}
            onChangeText={setComment}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={[styles.input, styles.commentInput]}
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
          />
        </Surface>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Success Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={successModal && !!orderResult}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.modalBox}>
            {/* Gradient Header */}
            <LinearGradient
              colors={orderResult?.needsApproval ? ["#F59E0B", "#D97706"] : ["#1E3A5F", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              {/* Decorative circles */}
              <View style={styles.modalDecorCircle1} />
              <View style={styles.modalDecorCircle2} />

              {/* Icon badge */}
              <View style={styles.modalIconBadge}>
                <Ionicons
                  name={orderResult?.needsApproval ? "time" : "checkmark-circle"}
                  size={48}
                  color="#fff"
                />
              </View>

              <Text style={styles.modalHeaderTitle}>
                {orderResult?.needsApproval ? "Pending Approval" : "Order Placed!"}
              </Text>
              <Text style={styles.modalHeaderSub}>
                {orderResult?.needsApproval
                  ? "Your order is awaiting manager approval"
                  : "Your order has been created successfully"}
              </Text>
            </LinearGradient>

            {/* Body */}
            <View style={styles.modalBody}>
              {!!orderResult?.orderNumber && (
                <View style={styles.modalOrderNumBox}>
                  <Ionicons name="receipt-outline" size={14} color={COLORS.textSecondary} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.modalOrderNumLabel}>Order Number</Text>
                    <Text style={styles.modalOrderNum}>{orderResult.orderNumber}</Text>
                  </View>
                </View>
              )}

              <Text style={styles.modalMessage}>{orderResult?.message}</Text>

              {/* Buttons */}
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={() => {
                  setSuccessModal(false);
                  setOrderResult(null);
                  router.back();
                }}
              >
                <LinearGradient
                  colors={orderResult?.needsApproval ? ["#F59E0B", "#D97706"] : ["#1E3A5F", "#2563EB"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalBtnGradient}
                >
                  <Ionicons name="arrow-back-outline" size={18} color="#fff" />
                  <Text style={styles.modalBtnPrimaryText}>Go to Orders</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => {
                  setSuccessModal(false);
                  setOrderResult(null);
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.modalBtnSecondaryText}>Create New Order</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* ── Bottom Actions ─────────────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => handleClear()}>
          <Text style={styles.cancelBtnText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitBtnWrapper}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtn}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.textLight} />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.textLight}
                />
                <Text style={styles.submitBtnText}>Create Order</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: { marginTop: SPACING.md, color: COLORS.textSecondary },
  scrollView: { flex: 1, padding: SPACING.md },

  // ── Web date input ──
  webDateWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    minHeight: 56,
  },
  webDateIcon: {
    marginRight: SPACING.sm,
  },
  webDateInner: {
    flex: 1,
  },
  webDateLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  dateText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
  field: { marginBottom: SPACING.sm },
  row: { flexDirection: "row", gap: SPACING.sm },
  halfField: { flex: 1 },
  thirdField: { flex: 1 },
  schemeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  schemeToggleCompact: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  schemeDropdownField: { 
    flex: 2 
  },
  schemeQtyField: { flex: 1 },
  schemeToggleLabel: { fontSize: 11, color: COLORS.text, fontWeight: "500" },
  input: { backgroundColor: COLORS.surface, color: COLORS.black },
  commentInput: { minHeight: 80 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  addBtnText: { color: COLORS.textLight, fontSize: 12, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: SPACING.xl },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  emptySubtext: { fontSize: 13, color: COLORS.border, marginTop: SPACING.xs },
  itemCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  itemNumber: { fontSize: 14, fontWeight: "600", color: COLORS.primary },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    alignSelf: "flex-start",
    marginTop: SPACING.sm,
    gap: 4,
  },
  addButtonText: { color: COLORS.textLight, fontSize: 12, fontWeight: "600" },
  itemSubtotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: SPACING.xs,
    gap: SPACING.sm,
  },
  itemSubtotalLabel: { fontSize: 13, color: COLORS.textSecondary },
  itemSubtotalValue: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
  calcBreakdownText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    lineHeight: 18,
  },

  // ── Confirmed items ──
  itemName: { fontWeight: "600", fontSize: 14, color: COLORS.text, flex: 1 },
  itemCategory: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  itemDetail: { fontSize: 12, color: COLORS.textSecondary },
  itemDetailBold: {
    fontSize: 12,
    color: COLORS.black,
    fontWeight: "800",
  },
  itemPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  itemAmount: { fontWeight: "700", fontSize: 14, color: COLORS.text },

  // ── Totals box ──
  totalsBox: {
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.sm,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 14, color: COLORS.textSecondary },
  totalValue: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  grandTotalRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  grandTotalLabel: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  grandTotalValue: { fontSize: 18, fontWeight: "700", color: COLORS.primary },

  // ── Success Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 420,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 20,
  },
  modalHeader: {
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    overflow: "hidden",
  },
  modalDecorCircle1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -50,
    right: -40,
  },
  modalDecorCircle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -30,
    left: -20,
  },
  modalIconBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  modalHeaderTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  modalHeaderSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 18,
  },
  modalBody: {
    padding: 24,
    alignItems: "center",
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalOrderNumBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLighter,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  modalOrderNumLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalOrderNum: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 1,
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 21,
  },
  modalBtnPrimary: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
  },
  modalBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  modalBtnPrimaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  modalBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    width: "100%",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    gap: 6,
  },
  modalBtnSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
  },

  // ── Bottom bar ──
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  cancelBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
  },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: "600" },
  submitBtnWrapper: { flex: 1 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  submitBtnText: { color: COLORS.textLight, fontWeight: "600", fontSize: 15 },
});
