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
} from "react-native";
<<<<<<< HEAD
import DateTimePicker from "@react-native-community/datetimepicker";
=======
>>>>>>> 4975e9f2 (commit)
import { Text, Surface, TextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { COLORS, SPACING, RADIUS, GRADIENTS } from "@/src/constants/theme";
import Dropdown from "@/src/components/common/DropdownProps";
import {
  orderService,
  dispatchService,
  PartyAddress,
  productService,
  Product,
  CreateOrderPayload,
} from "@/src/services/order.service";
import { useRouter } from "expo-router";
<<<<<<< HEAD
import { Pressable } from "react-native-gesture-handler";
=======
// @ts-ignore
import DateTimePickerModal from "react-native-modal-datetime-picker";
>>>>>>> 4975e9f2 (commit)

interface OrderItem {
  id: number;
  category: number | null;
  item: number | null;
  itemName: string;
  qty: string;
  price: string;
  amount: string;
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
  pcs: number;
  boxes: number;
  ltrs: number;
  marketPrice: number;
  total: number;
  taxRate: number;
  basicPrice: number;
}

export default function CreateOrderScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();
  const today = new Date().toLocaleDateString("en-GB");
  const [poDate, setPoDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [partyName, setPartyName] = useState<string | null>(null);

  // const [dispatchFrom, setDispatchFrom] = useState<number | null>(null);
  const [company, setCompany] = useState<number | null>(null);
  const [branch, setBranch] = useState<number | null>(null);

  const [poNumber, setPoNumber] = useState("");
<<<<<<< HEAD
=======
  const [delivery, setDeliveryDate] = useState("");
>>>>>>> 4975e9f2 (commit)

  const [comment, setComment] = useState("");
  const COMPANY_TYPES = [
    { label: "Oil", value: "oil" },
    { label: "Beverage", value: "beverage" },
    { label: "Mart", value: "mart" },
  ];
<<<<<<< HEAD
  const [delivery, setDeliveryDate] = useState("");
  const [showPicker, setShowPicker] = useState(false);
=======
>>>>>>> 4975e9f2 (commit)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedVariety, setSelectedVariety] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [qty, setQty] = useState<string>("");
  const [orderItems, setOrderItems] = useState<
    {
      id: number;
      itemCode: string;
      itemName: string;
      category: string;
      brand: string;
      variety: string;
      type: string;
      qty: number;
      pcs: number;
      boxes: number;
      ltrs: number;
      marketPrice: number;
      total: number;
      taxRate: number;
      basicPrice: number;
    }[]
  >([]);

  const [price, setPrice] = useState<string>("");
  const [types, setTypes] = useState<{ label: string; value: string }[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const [branches, setbranches] = useState<{ label: string; value: number }[]>(
    [],
  );

  const [billToAddresses, setBillToAddresses] = useState<
    { label: string; value: number }[]
  >([]);
<<<<<<< HEAD

  const [shipToAddresses, setShipToAddresses] = useState<
    { label: string; value: number }[]
  >([]);

=======
  const [shipToAddresses, setShipToAddresses] = useState<
    { label: string; value: number }[]
  >([]);
>>>>>>> 4975e9f2 (commit)
  const [selectedBillTo, setSelectedBillTo] = useState<number | null>(null);
  const [selectedShipTo, setSelectedShipTo] = useState<number | null>(null);
  const [itemTotal, setItemTotal] = useState<string>("");
  // Order items
  const [items, setItems] = useState<OrderItem[]>([]);

  // Dropdown options
  const [parties, setParties] = useState<{ label: string; value: string }[]>(
    [],
  );

  const [dispatches, setDispatches] = useState<
    { label: string; value: number }[]
  >([]);

  const [companies, setCompanies] = useState<
    { label: string; value: number }[]
  >([]);

  const [categories, setCategories] = useState<
    { label: string; value: string }[]
  >([]);

  const [itemsList, setItemsList] = useState<
    { label: string; value: number }[]
  >([]);

  const [brands, setBrands] = useState<{ label: string; value: string }[]>([]);
  const [varieties, setVarieties] = useState<
    { label: string; value: string }[]
  >([]);
  const [products, setProducts] = useState<{ label: string; value: number }[]>(
    [],
  );
  const [productsList, setProductsList] = useState<Product[]>([]); // ADD THIS - full product data
  const [pcs, setPcs] = useState<string>("");
  const [salPackUnit, setSalPackUnit] = useState<string>("");
  const [boxes, setBoxes] = useState<string>("");
  const [ltrs, setLtrs] = useState<string>("");
  const [tax, settax] = useState<string>("");
  const [grandTotal, setGrandTotal] = useState<string>("");
  const [marketPrice, setMarketPrice] = useState<string>("");
  const [basePrice, setBasePrice] = useState<string>("");
  const [partyProducts, setPartyProducts] = useState<any[]>([]);

  const handleConfirm = (date: Date) => {
    const formatted = date.toISOString().split("T")[0]; // YYYY-MM-DD
    setPoDate(formatted);
    setShowDatePicker(false);
  };
  const hidePicker = () => setShowDatePicker(false);

  const getMainGroups = () => {
    if (!user?.main_group) return "N/A";
    if (Array.isArray(user.main_group)) {
      return user.main_group.map((g: any) => g.name).join(", ") || "N/A";
    }
    return user.main_group.name || "N/A";
  };

  const getStates = () => {
    if (!user?.state) return "N/A";
    if (Array.isArray(user.state)) {
      return user.state.map((s: any) => s.code || s.name).join(", ") || "N/A";
    }
    return user.state.code || user.state.name || "N/A";
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const handlePartyChange = async (cardCode: string) => {
    // setPartyName(cardCode);
    console.log("partyname" + partyName);
    const addressData = await orderService.getAddresses(cardCode);

    try {
      const billTo = addressData.bill_to.map((addr: PartyAddress) => ({
        label:
          (addr.address_id || "") +
          (addr.address_name
            ? ` - ${addr.address_name.substring(0, 30)}...`
            : ""),
        value: addr.id,
      }));

      const shipTo = addressData.ship_to.map((addr: PartyAddress) => ({
        label:
          (addr.address_id || "") +
          (addr.address_name
            ? ` - ${addr.address_name.substring(0, 30)}...`
            : ""),
        value: addr.id,
      }));

<<<<<<< HEAD
=======
      // Fallback: if one is empty, use the other
>>>>>>> 4975e9f2 (commit)
      const finalBillTo = billTo.length > 0 ? billTo : shipTo;
      const finalShipTo = shipTo.length > 0 ? shipTo : billTo;

      setBillToAddresses(finalBillTo);
      setShipToAddresses(finalShipTo);

      // Auto-select if only one option
      if (finalBillTo.length === 1) setSelectedBillTo(finalBillTo[0].value);
      if (finalShipTo.length === 1) setSelectedShipTo(finalShipTo[0].value);

      const products = await orderService.getPartyProducts(cardCode);
      console.log("Failed to fetch party products:", products);
      setPartyProducts(products);

      const uniqueCategories = [
        ...new Set<string>(
          products.map((p: any) => p.category).filter(Boolean),
        ),
      ];
      setCategories(
        uniqueCategories.sort().map((c) => ({ label: c, value: c })),
      );

      // // Brands
      // const uniqueBrands = [...new Set(products.map((p: any) => p.brand).filter(Boolean))];
      // setBrands(uniqueBrands.sort().map(b => ({ label: String(b), value: String(b) })));

      // Varieties
      const uniqueVarieties = [
        ...new Set(products.map((p: any) => p.variety).filter(Boolean)),
      ];
      setVarieties(
        uniqueVarieties
          .sort()
          .map((v) => ({ label: String(v), value: String(v) })),
      );

      // Types
      const typesSet = new Set<string>();
      products.forEach((p: any) => {
        const match = p.item_name?.match(/(\d+\.?\d*)\s*(LTR|ML|KG|GM|GMS|L)/i);
        if (match) {
          typesSet.add(`${match[1]} ${match[2].toUpperCase()}`);
        } else {
          typesSet.add("Others");
        }
      });

      const sortedTypes = [...typesSet].sort((a, b) => {
        if (a === "Others") return 1;
        if (b === "Others") return -1;
        return parseFloat(a) - parseFloat(b);
      });

      setTypes(sortedTypes.map((t) => ({ label: t, value: t })));
    } catch (err) {
<<<<<<< HEAD
      console.log("Failed to fetch party products:", err);
=======
      console.error("Failed to fetch party products:", err);
>>>>>>> 4975e9f2 (commit)
    }
  };

  const handleCategoryChange = async (category: string) => {
    if (category === selectedCategory) return;

    setSelectedCategory(category);
    setSelectedBrand(null);
    setSelectedVariety(null);
    setSelectedType(null);
    setSelectedProduct(null);
    setBrands([]);
    setVarieties([]);
    setTypes([]);
    setProducts([]);

    const filtered = partyProducts.filter((p: any) => p.category === category);
    const uniqueBrands = [
      ...new Set<string>(filtered.map((p: any) => p.brand).filter(Boolean)),
    ];
    setBrands(uniqueBrands.sort().map((b) => ({ label: b, value: b })));
  };

  const handleBrandChange = async (brand: string) => {
    setSelectedBrand(brand);
    setSelectedVariety(null);
    setSelectedProduct(null);
    setVarieties([]);
    setProducts([]);

    // Varieties
    const filtered = partyProducts.filter(
      (p: any) => p.category === selectedCategory && p.brand === brand,
    );
    const uniqueVarieties = [
      ...new Set<string>(filtered.map((p: any) => p.variety).filter(Boolean)),
    ];
    setVarieties(uniqueVarieties.sort().map((v) => ({ label: v, value: v })));
  };

  const extractType = (itemName: string): string => {
    if (!itemName) return "Others";

    const pattern =
      /(\d+(?:\.\d+)?\s*(?:LTR|LITRE|LITER|L|ML|KG|KGS|GM|GMS|GRAM|G|PCS|PC|POUCH|TIN|JAR|BTL|CAN|BOTTLE|PACK|PKT|BOX)S?)\b/i;

    const match = itemName.toUpperCase().match(pattern);

    if (match) {
      let result = match[1].trim();
      // Add space between number and unit if missing: "1LTR" → "1 LTR"
      result = result.replace(/(\d)([A-Z])/g, "$1 $2");
      return result;
    }
    return "Others";
  };

  const handleVarietyChange = async (variety: string) => {
    console.log("=== Variety Changed ===");
    console.log("Category:", selectedCategory);
    console.log("Brand:", selectedBrand);
    console.log("Variety:", variety);

    setSelectedVariety(variety);
    setSelectedType(null);
    setSelectedProduct(null);
    setTypes([]);
    setProducts([]);

    const filtered = partyProducts.filter(
      (p: any) =>
        p.category === selectedCategory &&
        p.brand === selectedBrand &&
        p.variety === variety,
    );

    const typesSet = new Set<string>();
    filtered.forEach((p: any) => typesSet.add(extractType(p.item_name)));

    const sortedTypes = [...typesSet].sort((a, b) => {
      if (a === "Others") return 1;
      if (b === "Others") return -1;
      return parseFloat(a) - parseFloat(b);
    });

    setTypes(sortedTypes.map((t) => ({ label: t, value: t })));
  };

  const handleProductChange = (productId: number) => {
    setSelectedProduct(productId);

    const product = partyProducts.find((p: any) => p.item_code === productId);
    if (product) {
      setPcs(product.sal_factor2?.toString() || "0");
      setSalPackUnit(product.sal_pack_unit?.toString() || "0");
      settax(product.tax_rate ? product.tax_rate.toString() : "0");
      setBasePrice(product.basic_rate?.toString() || "0");
    }
  };

  const handleBoxesChange = (value: string) => {
    const qty = parseFloat(value) * parseFloat(pcs);
    setBoxes(qty.toString());

    // Calculate Ltrs
    const packUnit = parseFloat(salPackUnit) || 0;
    const calculatedLtrs = parseFloat(value) * packUnit;
    setLtrs(calculatedLtrs.toFixed(2));
  };

  const handleQtyChange = (value: string) => {
    setQty(value);

    const qtyNum = parseFloat(value) || 0;
    const pcsNum = parseFloat(pcs) || 0;
    const packUnit = parseFloat(salPackUnit) || 0;
    const priceNum = parseFloat(marketPrice) || 0;

    setBoxes((qtyNum * pcsNum).toString());
    setLtrs((qtyNum * packUnit).toFixed(2));
    setItemTotal((qtyNum * priceNum).toFixed(2));
  };

  const calculateGrandTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total, 0).toFixed(2);
  };

  const handleMarketPriceChange = (value: string) => {
    setMarketPrice(value);

    const qtyNum = parseFloat(qty) || 0;
    const priceNum = parseFloat(value) || 0;

    setItemTotal((qtyNum * priceNum).toFixed(2));
  };

  const handleTypeChange = async (type: string) => {
    setSelectedType(type);
    setSelectedProduct(null);
    setProducts([]);

    try {
      // const productList = await productService.getProducts(
      //   selectedCategory!,
      //   selectedBrand!,
      //   selectedVariety!,
      //   type
      // );

      // console.log('Products from API:', productList);
      // setProductsList(productList);
      // const mapped = productList.map((p: Product) => ({
      //   label: p.item_name,
      //   value: p.id,
      // }));

      // console.log('Mapped for dropdown:', mapped);

      // setProducts(mapped);
      const filtered = partyProducts.filter((p: any) => {
        if (p.category !== selectedCategory) return false;
        if (p.brand !== selectedBrand) return false;
        if (p.variety !== selectedVariety) return false;
        return extractType(p.item_name) === type;
      });

      setProducts(
        filtered.map((p: any) => ({
          label: `${p.item_name} (₹${p.basic_rate})`,
          value: p.item_code,
        })),
      );
      console.log("Products state set");
    } catch (error) {
<<<<<<< HEAD
      console.log("Error loading products:", error);
=======
      console.error("Error loading products:", error);
>>>>>>> 4975e9f2 (commit)
    }
  };

  const fetchMasterData = async () => {
    try {
      setDataLoading(true);

      const parties = await orderService.getParties();
<<<<<<< HEAD
      console.log("parties" + JSON.stringify(parties));
=======
>>>>>>> 4975e9f2 (commit)
      setParties(
        (parties || []).map((p) => ({
          label: p.label,
          value: p.value,
        })),
      );

      const dispatchesData = await dispatchService.getDispatch();

      setDispatches(
        (dispatchesData || []).map((d) => ({
          label: d.name,
          value: d.id,
        })),
      );

      const branches = await orderService.getbranch("");

      console.log("branches" + JSON.stringify(branches));
      setbranches(
        (branches || []).map((d: any) => ({
          label: d.bpl_name,
          value: d.bpl_id,
        })),
      );

      const company = await setCompanies([
        { label: "Jivo Wellness", value: 1 },
        // { label: "Jivo MART", value: 2 },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to load data");
    } finally {
      setDataLoading(false);
    }
  };

  const addItem = () => {
    const newId =
      items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
    setItems([
      ...items,
      {
        id: newId,
        category: null,
        item: null,
        itemName: "",
        qty: "",
        price: "",
        amount: "0.00",
      },
    ]);
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };

          // Get item name if item selected
          if (field === "item" && value) {
            const selectedItem = itemsList.find((i) => i.value === value);
            updated.itemName = selectedItem?.label || "";
          }

          // Calculate amount
          const qty = parseFloat(updated.qty) || 0;
          const price = parseFloat(updated.price) || 0;
          updated.amount = (qty * price).toFixed(2);

          return updated;
        }
        return item;
      }),
    );
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const removeaddedItem = (id: number) => {
    setOrderItems(orderItems.filter((item) => item.id !== id));
  };

  const calculateTotal = () => {
    const grand_total = parseFloat(marketPrice) || 0 * parseFloat(qty) || 0;

    console.log("qty " + qty);

    return grand_total.toFixed(2);
  };

  const addItemToOrder = () => {
    if (!selectedCategory || !selectedProduct || !boxes) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    const product = partyProducts.find(
      (p: any) => p.item_code === selectedProduct,
    );
    if (!product) return;

    const newItem: OrderItemType = {
      id: Date.now(),
      itemCode: product.item_code || "",
      itemName: product.item_name || "",
      category: selectedCategory || "",
      brand: selectedBrand || "",
      variety: selectedVariety || "",
      type: selectedType || "",
      qty: parseFloat(qty) || 0,
      pcs: parseFloat(pcs) || 0,
      boxes: parseFloat(boxes) || 0,
      ltrs: parseFloat(ltrs) || 0,
      marketPrice: parseFloat(marketPrice) || 0,
      total: parseFloat(itemTotal) || 0,
      taxRate: parseFloat(tax) || 0,
      basicPrice: parseFloat(basePrice) || product.basic_rate || 0,
    };

    setOrderItems((prev) => [...prev, newItem]);

    // Reset input fields — keep partyProducts and categories
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSelectedVariety(null);
    setSelectedType(null);
    setSelectedProduct(null);
    setQty("");
    setPcs("");
    setSalPackUnit("");
    setBoxes("");
    setLtrs("");
    setMarketPrice("");
    setItemTotal("");
    settax("");
    setBasePrice("");
    setBrands([]);
    setVarieties([]);
    setTypes([]);
    setItems([]);
    // DON'T reset partyProducts and categories — user is still on same party
  };

  const handleSubmit = async () => {
    // if (!partyName) return Alert.alert("Error", "Select a party");
    // if (!selectedBillTo) return Alert.alert("Error", "Select bill to address");
    // if (!selectedShipTo) return Alert.alert("Error", "Select ship to address");
    // if (!branch) return Alert.alert("Error", "Select dispatch location");
    // if (!company) return Alert.alert("Error", "Select company");
    // if (!poNumber) return Alert.alert("Error", "Select Po Number");

    if (orderItems.length === 0)
      return Alert.alert("Error", "Add at least one item");

    console.log("logdata2 " + !partyName + orderItems.length);
    if (!partyName || orderItems.length === 0) {
      Alert.alert("Error", "Select a party and add at least one item");
      return;
    }

    try {
      const payload: CreateOrderPayload = {
<<<<<<< HEAD
        user_id: user?.id || 0,
=======
>>>>>>> 4975e9f2 (commit)
        card_code: partyName,
        card_name: parties.find((p) => p.value === partyName)?.label ?? "",
        bill_to_id: selectedBillTo ?? 0,
        bill_to_address:
          billToAddresses.find((a) => a.value === selectedBillTo)?.label ?? "",
        ship_to_id: selectedShipTo ?? 0,
        ship_to_address:
          shipToAddresses.find((a) => a.value === selectedShipTo)?.label ?? "",
        dispatch_from_id: branch ?? 0,
        dispatch_from_name:
          dispatches.find((d) => d.value === branch)?.label ?? "",
        delivery_date: delivery,
        company: String(company ?? ""),
        po_number: String(poNumber ?? ""),
        items: orderItems.map((item) => ({
          item_code: String(item.itemCode ?? ""),
          item_name: String(item.itemName ?? ""),
          category: String(item.category ?? ""),
          brand: String(item.brand ?? ""),
          variety: String(item.variety ?? ""),
          item_type: String(item.type ?? ""),
          qty: Number(item.qty) || 0,
          pcs: Number(item.pcs) || 0,
          boxes: Number(item.boxes) || 0,
          ltrs: Number(item.ltrs) || 0,
          market_price: Number(item.marketPrice) || 0,
          total: Number(item.total) || 0,
          tax_rate: Number(item.taxRate) || 0,
          basic_price: Number(item.basicPrice),
        })),
      };

      console.log("logdata" + JSON.stringify(payload));
      const response = await orderService.createOrder(payload);
      console.log("Error creating order:", JSON.stringify(response));

<<<<<<< HEAD
      if (response?.message?.includes("Order sent")) {
        Alert.alert("Success", response.message, [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
=======
      Alert.alert(
        "Success",
        `Order ${response.order_number} created successfully!`,
        [{ text: "OK", onPress: () => router.back() }],
      );
>>>>>>> 4975e9f2 (commit)
    } catch (error) {
      console.log("Error creating orderr:", error);
      Alert.alert("Error", "Failed to create order");
    }
  };

  const handleClear = () => {
    setPartyName(null);
    setBranch(null);
    setCompany(null);
    setPoNumber("");
    setComment("");
    setItems([]);
    setSelectedCategory("");
    setSelectedBrand("");
    setSelectedVariety("");
    setSelectedType("");
  };

  if (dataLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
<<<<<<< HEAD

=======
  
>>>>>>> 4975e9f2 (commit)
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Info Bar */}
<<<<<<< HEAD
      {/* <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          MainGroup: {getMainGroups()} | States: {getStates()}
        </Text>
      </View> */}
=======
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          MainGroup: {getMainGroups()} | States: {getStates()}
        </Text>
      </View>
>>>>>>> 4975e9f2 (commit)

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Order Details Card */}
        <Surface style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Order Details</Text>
            <Text style={styles.dateText}>{today}</Text>
          </View>

          {/* <View style={styles.field}>
            <Dropdown
              label="Company *"
              data={COMPANY_TYPES}
              onChange={(value) => {
                setPartyName(value);
                if (value) {
                  handlePartyChange(value);
                }
              }}
              value={partyName}
              placeholder="Select company..."
              searchable={true}
              icon="storefront-outline"
            />
          </View> */}

          <View style={styles.field}>
            <Dropdown
              label="Party Name *"
              data={parties}
              onChange={(value) => {
                setPartyName(value);
                if (value) {
                  handlePartyChange(value);
                }
              }}
              value={partyName}
              placeholder="Select party..."
              searchable={true}
              icon="storefront-outline"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Dropdown
                label="Dispatch From"
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

          {/* <View style={styles.field}>
            <Dropdown
              label="Branch"
              data={billToAddresses}
              value={selectedBillTo}
              onChange={setSelectedBillTo}
              placeholder="Select Bill To..."
              // icon="document-text-outline"
            />
          </View> */}

          <View style={styles.field}>
            <Dropdown
              label="Bill To Address"
              data={billToAddresses}
              value={selectedBillTo}
              onChange={setSelectedBillTo}
              placeholder="Select Bill To..."
              // icon="document-text-outline"
            />
          </View>

          <View style={styles.field}>
            <Dropdown
              label="Ship To Address"
              data={shipToAddresses}
              value={selectedShipTo}
              onChange={setSelectedShipTo}
              placeholder="Select Ship To..."
            />
          </View>

          <View style={styles.field}>
            <TextInput
              label="PO Number"
              value={poNumber}
              onChangeText={setPoNumber}
              mode="outlined"
              textColor={COLORS.black}
              style={styles.input}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              left={<TextInput.Icon icon="file-document-outline" />}
            />
          </View>

          <View style={styles.field}>
<<<<<<< HEAD
            <View style={styles.field}>
              <Pressable onPress={() => setShowPicker(true)}>
                <TextInput
                  label="Delivery Date"
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
              </Pressable>

              {showPicker && (
                <DateTimePicker
                  value={delivery ? new Date(delivery) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    setShowPicker(false);
                    if (selectedDate) {
                      const formatted = selectedDate
                        .toISOString()
                        .split("T")[0]; // YYYY-MM-DD
                      setDeliveryDate(formatted);
                    }
                  }}
                />
              )}
            </View>
          </View>
=======
            <TextInput
              label="Delivery Date"
              value={delivery}
              onChangeText={setDeliveryDate}
              mode="outlined"
              textColor={COLORS.black}
              style={styles.input}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              left={<TextInput.Icon icon="file-document-outline" />}
            />
          </View>

          {/* <View style={styles.field}>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <TextInput
                label="PO Date"
                value={poDate}
                mode="outlined"
                editable={false}
                textColor={COLORS.black}
                style={styles.input}
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
                left={<TextInput.Icon icon="calendar" />}
              />
            </TouchableOpacity>
              
            <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              onConfirm={handleConfirm}
              onCancel={hidePicker}
            />
          </View> */}
>>>>>>> 4975e9f2 (commit)
        </Surface>

        {/* Items Section */}
        <Surface style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cube" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Items</Text>
            <TouchableOpacity style={styles.addBtn} onPress={addItem}>
              <Ionicons name="add" size={18} color={COLORS.textLight} />
              <Text style={styles.addBtnText}>New Item</Text>
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No items added</Text>
              <Text style={styles.emptySubtext}>
                Tap "Add Item" to add products
              </Text>
            </View>
          ) : (
            items.map((item, index) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemNumber}>Item {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeItem(item.id)}>
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={COLORS.error}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.field}>
                  <Dropdown
                    label="Category"
                    data={categories}
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    placeholder="Select Category..."
                    icon="grid-outline"
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Dropdown
                      label="Brand"
                      data={brands}
                      value={selectedBrand}
                      onChange={handleBrandChange}
                      placeholder="Select Brand..."
                      icon="pricetag-outline"
                      disabled={!selectedCategory}
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Dropdown
                      label="Variety"
                      data={varieties}
                      value={selectedVariety}
                      onChange={handleVarietyChange}
                      placeholder="Select Variety..."
                      icon="layers-outline"
                      disabled={!selectedBrand}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Dropdown
                    label="Type"
                    data={types}
                    value={selectedType}
                    onChange={handleTypeChange}
                    placeholder="Select Category..."
                    icon="grid-outline"
                  />
                </View>

                {/* Item */}
                <View style={styles.field}>
                  <Dropdown
                    label="Item"
                    data={products}
                    value={selectedProduct}
                    onChange={handleProductChange} // Changed from setSelectedProduct
                    placeholder="Select Item..."
                    icon="cube-outline"
                    disabled={!selectedType}
                    searchable={true}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.thirdField}>
                    <TextInput
                      label="PCS"
                      textColor={COLORS.black}
                      value={pcs}
                      onChangeText={(val) => updateItem(item.id, "pcs", val)}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.input}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />
                  </View>
                  <View style={styles.thirdField}>
                    <TextInput
                      label="Ltrs"
                      textColor={COLORS.black}
                      value={ltrs}
                      onChangeText={(val) => updateItem(item.id, "ltrs", val)}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.input}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />
                  </View>
                  <View style={styles.thirdField}>
                    <TextInput
                      label="Boxes"
                      value={boxes}
                      textColor={COLORS.black}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.input}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.thirdField}>
                    <TextInput
                      label="QTY"
                      textColor={COLORS.black}
                      value={qty}
                      onChangeText={handleQtyChange}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.input}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />
                  </View>
                  <View style={styles.thirdField}>
                    <TextInput
                      label="TAX"
                      value={tax}
                      textColor={COLORS.black}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.input}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.thirdField}>
                    <TextInput
                      label="Base Price"
                      textColor={COLORS.black}
                      value={basePrice}
                      onChangeText={handleMarketPriceChange}
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
                      value={marketPrice}
                      onChangeText={handleMarketPriceChange}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.input}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addItemToOrder}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Add Item</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </Surface>

        {orderItems.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Order Items ({orderItems.length})
            </Text>

            {orderItems.map((item, index) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>
                    {index + 1}. {item.itemName}
                  </Text>
                  <TouchableOpacity onPress={() => removeaddedItem(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#e53e3e" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemCategory}>
                  {item.category} | {item.brand} | {item.variety}
                </Text>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemDetail}>Qty: {item.qty}</Text>
                  <Text style={styles.itemDetail}>PCS: {item.pcs}</Text>
                  <Text style={styles.itemDetail}>Boxes: {item.boxes}</Text>
                  <Text style={styles.itemDetail}>Ltrs: {item.ltrs}</Text>
                </View>
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemDetail}>
                    Price: ₹{item.marketPrice}
                  </Text>
                  <Text style={styles.itemAmount}>
                    ₹{item.total.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}

            {/* Grand Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Grand Total:</Text>
              <Text style={styles.totalValue}>₹{calculateGrandTotal()}</Text>
            </View>
          </View>
        )}

        {/* Total Card */}
        {items.length > 0 && (
          <Surface style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Items</Text>
              <Text style={styles.totalValue}>{items.length}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.grandTotal}>₹{calculateTotal()}</Text>
            </View>
          </Surface>
        )}

        {/* Comment */}
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

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleClear}>
          <Text style={styles.cancelBtnText}>Clear</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.draftBtn}>
          <Ionicons name="save-outline" size={18} color={COLORS.warning} />
          <Text style={styles.draftBtnText}>Draft</Text>
        </TouchableOpacity> */}

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
                <Text style={styles.submitBtnText}>Create</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  addButtonText: {
    color: COLORS.textLight,
    fontSize: 12,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
  },
  infoBar: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
    padding: SPACING.md,
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
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  field: {
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  halfField: {
    flex: 1,
  },
  thirdField: {
    flex: 1,
  },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.black,
  },
  commentInput: {
    minHeight: 80,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  addBtnText: {
    color: COLORS.textLight,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.border,
    marginTop: SPACING.xs,
  },
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
  itemNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  amountBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: "center",
    height: 56,
    justifyContent: "center",
  },
  amountLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  totalCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.xs,
  },
  totalLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    opacity: 0.8,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textLight,
  },
  grandTotal: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textLight,
  },
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
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  draftBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.warning,
    gap: 4,
  },
  draftBtnText: {
    color: COLORS.warning,
    fontWeight: "600",
  },
  submitBtnWrapper: {
    flex: 1,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  submitBtnText: {
    color: COLORS.textLight,
    fontWeight: "600",
    fontSize: 15,
  },
  itemName: {
    fontWeight: "600",
    fontSize: 14,
    color: COLORS.black,
    flex: 1,
  },
  itemCategory: {
    fontSize: 12,
    color: "#718096",
    marginTop: 2,
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  itemDetail: {
    fontSize: 12,
    color: "#4a5568",
  },
  itemPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  itemAmount: {
    fontWeight: "700",
    fontSize: 14,
    color: "#2d3748",
  },
});
