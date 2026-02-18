import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
  Modal,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { storage } from "@/src/utils/storage";
import { api } from "@/src/services/api";

interface Party {
  id: number;
  card_code: string;
  card_name: string;
  state: string;
  main_group: string;
}

interface Product {
  id: number;
  item_code: string;
  item_name: string;
  category: string;
  brand: string;
  variety: string;
  sal_pack_unit: string;
  basic_rate?: number;
  assigned_at?: string;
}

interface SelectedProduct {
  item_code: string;
  category: string;
  basic_rate: number;
}

const CATEGORIES = ["ALL", "OIL", "BEVERAGES", "MART"];

export default function PartyProductAssignmentScreen() {
  // Key to force re-render picker
  const [pickerKey, setPickerKey] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCardCode, setSelectedCardCode] = useState<string | null>(null);
  const [assignedProducts, setAssignedProducts] = useState<Product[]>([]);
  const [partySearchQuery, setPartySearchQuery] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [modalCategoryFilter, setModalCategoryFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState<
    Map<string, SelectedProduct>
  >(new Map());

  const [showRateModal, setShowRateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editRate, setEditRate] = useState("");

  // Reset everything when screen focuses
  useFocusEffect(
    useCallback(() => {
      console.log("Screen focused - full reset");

      // Force picker to re-render by changing key
      setPickerKey((prev) => prev + 1);

      // Reset all state
      setSelectedCardCode(null);
      setAssignedProducts([]);
      setMessage("");
      setCategoryFilter("ALL");
      setPartySearchQuery("");
      setProductSearchQuery("");
      setSelectedProducts(new Map());

      // Load fresh data
      loadParties();
      loadAllProducts();
    }, []),
  );

  const getToken = async (): Promise<string | undefined> => {
    const token = await storage.getAccessToken();
    return token || undefined;
  };

  const getProductKey = (itemCode: string, category: string): string => {
    return `${itemCode}|${category}`;
  };

  const loadParties = async () => {
    try {
      const token = await getToken();
      const res = await api.get("/sap/parties/", token);
      const list = Array.isArray(res) ? res : res?.data || [];
      setParties(list);
    } catch (error) {
      console.log("Load parties error:", error);
    }
  };

  const loadAllProducts = async () => {
    try {
      const token = await getToken();
      const res = await api.get("/sap/products/", token);
      const list = Array.isArray(res) ? res : res?.data || [];
      setProducts(list);
    } catch (error) {
      console.log("Load products error:", error);
    }
  };

  const loadPartyProducts = async (cardCode: string) => {
    setLoading(true);
    setMessage("");
    try {
      const token = await getToken();
      const res = await api.get(`/auth/parties/${cardCode}/products/`, token);
      if (res && res.success) {
        setAssignedProducts(res.data.products || []);
      } else {
        setAssignedProducts([]);
      }
    } catch (error) {
      console.log("Load party products error:", error);
      setAssignedProducts([]);
    }
    setLoading(false);
  };

  const handlePartyChange = (cardCode: string | null) => {
    console.log("Party changed to:", cardCode);
    setSelectedCardCode(cardCode);
    setMessage("");
    setAssignedProducts([]);

    if (cardCode) {
      loadPartyProducts(cardCode);
    }
  };

  const openAssignModal = () => {
    const map = new Map<string, SelectedProduct>();
    assignedProducts.forEach((p) => {
      const key = getProductKey(p.item_code, p.category);
      map.set(key, {
        item_code: p.item_code,
        category: p.category,
        basic_rate: p.basic_rate || 0,
      });
    });
    setSelectedProducts(map);
    setProductSearchQuery("");
    setModalCategoryFilter("ALL");
    setShowAssignModal(true);
  };

  const toggleProductSelection = (product: Product) => {
    const key = getProductKey(product.item_code, product.category);
    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(key)) {
        newMap.delete(key);
      } else {
        newMap.set(key, {
          item_code: product.item_code,
          category: product.category,
          basic_rate: 0,
        });
      }
      return newMap;
    });
  };

  const updateProductRate = (key: string, rate: string) => {
    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(key);
      if (existing) {
        newMap.set(key, { ...existing, basic_rate: parseFloat(rate) || 0 });
      }
      return newMap;
    });
  };

  const selectAllFiltered = () => {
    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      filteredModalProducts.forEach((p) => {
        const key = getProductKey(p.item_code, p.category);
        if (!newMap.has(key)) {
          newMap.set(key, {
            item_code: p.item_code,
            category: p.category,
            basic_rate: 0,
          });
        }
      });
      return newMap;
    });
  };

  const deselectAllFiltered = () => {
    const filteredKeys = new Set(
      filteredModalProducts.map((p) => getProductKey(p.item_code, p.category)),
    );
    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      filteredKeys.forEach((key) => newMap.delete(key));
      return newMap;
    });
  };

  const saveAssignments = async () => {
    if (!selectedCardCode) {
      setMessage("❌ Please select a party first");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const token = await getToken();
      const productsArray = Array.from(selectedProducts.values());

      const res = await api.post(
        "/auth/party-product/bulk-add/",
        {
          card_code: selectedCardCode,
          products: productsArray,
        },
        token,
      );

      if (res && res.success) {
        setMessage(`✅ ${res.message}`);
        await loadPartyProducts(selectedCardCode);
        setShowAssignModal(false);
      } else {
        setMessage(`❌ ${res?.message || "Failed to save"}`);
      }
    } catch (error) {
      console.log("Save error:", error);
      setMessage("❌ Failed to save");
    }
    setSaving(false);
  };

  const openEditRateModal = (product: Product) => {
    setEditingProduct(product);
    setEditRate(String(product.basic_rate || 0));
    setShowRateModal(true);
  };

  const saveRate = async () => {
    if (!selectedCardCode || !editingProduct) return;

    try {
      const token = await getToken();
      const res = await api.post(
        "/auth/party-product/update-rate/",
        {
          card_code: selectedCardCode,
          item_code: editingProduct.item_code,
          category: editingProduct.category,
          basic_rate: parseFloat(editRate) || 0,
        },
        token,
      );

      if (res && res.success) {
        setMessage("✅ Rate updated");
        await loadPartyProducts(selectedCardCode);
        setShowRateModal(false);
      } else {
        setMessage(`❌ ${res?.message || "Failed to update"}`);
      }
    } catch (error) {
      console.log("Update rate error:", error);
      setMessage("❌ Failed to update rate");
    }
  };

  const removeProduct = async (product: Product) => {
    if (!selectedCardCode) return;

    const doRemove = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const res = await api.post(
          "/auth/party-product/remove/",
          {
            card_code: selectedCardCode,
            item_code: product.item_code,
            category: product.category,
          },
          token,
        );

        if (res && res.success) {
          setMessage("✅ Product removed");
          await loadPartyProducts(selectedCardCode);
        } else {
          setMessage(`❌ ${res?.message || "Failed to remove"}`);
        }
      } catch (error) {
        console.log("Remove error:", error);
        setMessage("❌ Failed to remove product");
      }
      setLoading(false);
    };

    if (Platform.OS === "web") {
      if (confirm(`Remove ${product.item_name} (${product.category})?`)) {
        doRemove();
      }
    } else {
      Alert.alert(
        "Remove Product",
        `Remove ${product.item_name} (${product.category})?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Remove", style: "destructive", onPress: doRemove },
        ],
      );
    }
  };

  const filteredParties = parties.filter(
    (p) =>
      p.card_code?.toLowerCase().includes(partySearchQuery.toLowerCase()) ||
      p.card_name?.toLowerCase().includes(partySearchQuery.toLowerCase()) ||
      p.state?.toLowerCase().includes(partySearchQuery.toLowerCase()),
  );

  const filteredModalProducts = products.filter((p) => {
    const matchesSearch =
      p.item_code?.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      p.item_name?.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(productSearchQuery.toLowerCase());
    const matchesCategory =
      modalCategoryFilter === "ALL" || p.category === modalCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredAssignedProducts = assignedProducts.filter(
    (p) => categoryFilter === "ALL" || p.category === categoryFilter,
  );

  const selectedParty = parties.find((p) => p.card_code === selectedCardCode);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "OIL":
        return "#f59e0b";
      case "BEVERAGES":
        return "#3b82f6";
      case "MART":
        return "#1e3a5f";
      default:
        return "#6b7280";
    }
  };

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Party-Product Mapping</Text>
        <Text style={styles.headerSubtitle}>Assign products with rates to parties</Text>
      </View> */}

      <ScrollView style={styles.content}>
        {/* Party Selection */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Party</Text>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search party..."
              value={partySearchQuery}
              onChangeText={setPartySearchQuery}
            />
          </View>
          <View style={styles.pickerContainer}>
            {/* Key forces Picker to re-render on screen focus */}
            <Picker
              key={pickerKey}
              selectedValue={selectedCardCode}
              onValueChange={handlePartyChange}
              style={styles.picker}
            >
              <Picker.Item label="-- Select Party --" value={null} />
              {filteredParties.slice(0, 100).map((party) => (
                <Picker.Item
                  key={party.card_code}
                  label={`${party.card_code} - ${party.card_name}`}
                  value={party.card_code}
                />
              ))}
            </Picker>
          </View>
        </View>

        {message ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}

        {selectedParty && (
          <View style={styles.card}>
            <View style={styles.partyHeader}>
              <View>
                <Text style={styles.partyCode}>{selectedParty.card_code}</Text>
                <Text style={styles.partyName}>{selectedParty.card_name}</Text>
                <Text style={styles.partyMeta}>
                  {selectedParty.state || "-"} •{" "}
                  {selectedParty.main_group || "-"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={openAssignModal}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Products</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{assignedProducts.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              {["OIL", "BEVERAGES", "MART"].map((cat) => (
                <View
                  key={cat}
                  style={[
                    styles.statBox,
                    { backgroundColor: `${getCategoryColor(cat)}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.statNumber,
                      { color: getCategoryColor(cat) },
                    ]}
                  >
                    {assignedProducts.filter((p) => p.category === cat).length}
                  </Text>
                  <Text style={styles.statLabel}>{cat}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedCardCode && assignedProducts.length > 0 && (
          <View style={styles.filterRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  categoryFilter === cat && styles.filterChipActive,
                ]}
                onPress={() => setCategoryFilter(cat)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    categoryFilter === cat && styles.filterChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedCardCode && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleNoMargin}>Assigned Products</Text>
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={() =>
                  selectedCardCode && loadPartyProducts(selectedCardCode)
                }
              >
                <Ionicons name="refresh" size={20} color="#1e3a5f" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#1e3a5f" />
            ) : filteredAssignedProducts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="cube-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No products assigned</Text>
              </View>
            ) : (
              filteredAssignedProducts.map((product) => (
                <View
                  key={getProductKey(product.item_code, product.category)}
                  style={styles.productItem}
                >
                  <View style={styles.productInfo}>
                    <View style={styles.productRow}>
                      <Text style={styles.productCode}>
                        {product.item_code}
                      </Text>
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: getCategoryColor(product.category),
                          },
                        ]}
                      >
                        <Text style={styles.badgeText}>{product.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.productName}>{product.item_name}</Text>
                    <Text style={styles.productMeta}>
                      {product.brand || "-"} • {product.variety || "-"} •{" "}
                      {product.sal_pack_unit || "-"}
                    </Text>
                  </View>

                  <View style={styles.productActions}>
                    <TouchableOpacity
                      style={styles.rateBox}
                      onPress={() => openEditRateModal(product)}
                    >
                      <Text style={styles.rateLabel}>Rate</Text>
                      <Text style={styles.rateValue}>
                        ₹{product.basic_rate?.toFixed(2) || "0.00"}
                      </Text>
                      <Ionicons name="pencil" size={14} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => removeProduct(product)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={22}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Assign Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Products</Text>
            <TouchableOpacity onPress={() => setShowAssignModal(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSearchBox}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={productSearchQuery}
              onChangeText={setProductSearchQuery}
            />
          </View>

          <View style={styles.modalFilterRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  modalCategoryFilter === cat && styles.filterChipActive,
                ]}
                onPress={() => setModalCategoryFilter(cat)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    modalCategoryFilter === cat && styles.filterChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.bulkActions}>
            <TouchableOpacity
              style={styles.selectAllBtn}
              onPress={selectAllFiltered}
            >
              <Text style={styles.selectAllText}>
                Select All ({filteredModalProducts.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deselectAllBtn}
              onPress={deselectAllFiltered}
            >
              <Text style={styles.deselectAllText}>Deselect All</Text>
            </TouchableOpacity>
            <Text style={styles.selectedCount}>
              {selectedProducts.size} selected
            </Text>
          </View>

          <ScrollView style={styles.modalList}>
            {filteredModalProducts.map((product) => {
              const key = getProductKey(product.item_code, product.category);
              const isSelected = selectedProducts.has(key);
              const selectedData = selectedProducts.get(key);

              return (
                <View
                  key={key}
                  style={[
                    styles.selectItem,
                    isSelected && styles.selectItemActive,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.selectItemLeft}
                    onPress={() => toggleProductSelection(product)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxActive,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </View>
                    <View style={styles.selectItemInfo}>
                      <View style={styles.productRow}>
                        <Text style={styles.selectItemCode}>
                          {product.item_code}
                        </Text>
                        <View
                          style={[
                            styles.badgeSmall,
                            {
                              backgroundColor: getCategoryColor(
                                product.category,
                              ),
                            },
                          ]}
                        >
                          <Text style={styles.badgeSmallText}>
                            {product.category}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.selectItemName}>
                        {product.item_name}
                      </Text>
                      <Text style={styles.selectItemMeta}>
                        {product.brand || "-"} • {product.variety || "-"}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {isSelected && (
                    <View style={styles.rateInputBox}>
                      <Text style={styles.rateInputLabel}>₹</Text>
                      <TextInput
                        style={styles.rateInput}
                        placeholder="0.00"
                        keyboardType="numeric"
                        value={String(selectedData?.basic_rate || "")}
                        onChangeText={(text) => updateProductRate(key, text)}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowAssignModal(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={saveAssignments}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>
                  Save ({selectedProducts.size})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Rate Modal */}
      <Modal
        visible={showRateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRateModal(false)}
      >
        <View style={styles.rateModalOverlay}>
          <View style={styles.rateModalContent}>
            <Text style={styles.rateModalTitle}>Edit Basic Rate</Text>
            {editingProduct && (
              <Text style={styles.rateModalProduct}>
                {editingProduct.item_code} - {editingProduct.item_name} (
                {editingProduct.category})
              </Text>
            )}
            <View style={styles.rateModalInputBox}>
              <Text style={styles.rateModalCurrency}>₹</Text>
              <TextInput
                style={styles.rateModalInput}
                keyboardType="numeric"
                value={editRate}
                onChangeText={setEditRate}
                autoFocus
              />
            </View>
            <View style={styles.rateModalButtons}>
              <TouchableOpacity
                style={styles.rateModalCancel}
                onPress={() => setShowRateModal(false)}
              >
                <Text style={styles.rateModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rateModalSave} onPress={saveRate}>
                <Text style={styles.rateModalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#1e3a5f",
    padding: 20,
    paddingTop: Platform.OS === "web" ? 20 : 50,
  },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginTop: 4,
  },
  content: { padding: 15, flex: 1 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  sectionTitleNoMargin: { fontSize: 16, fontWeight: "bold", color: "#333" },
  refreshBtn: { padding: 8, borderRadius: 8, backgroundColor: "#e8f4fc" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInput: { flex: 1, padding: 12, fontSize: 16 },
  pickerContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  picker: { height: 50 },
  messageBox: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  messageText: { fontSize: 14, color: "#333" },
  partyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  partyCode: { fontSize: 14, fontWeight: "bold", color: "#1e3a5f" },
  partyName: { fontSize: 18, fontWeight: "bold", color: "#333", marginTop: 2 },
  partyMeta: { fontSize: 13, color: "#666", marginTop: 2 },
  addButton: {
    backgroundColor: "#1e3a5f",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: { color: "#fff", fontWeight: "bold", marginLeft: 4 },
  statsRow: { flexDirection: "row", gap: 8 },
  statBox: {
    backgroundColor: "#e8f4fc",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  statNumber: { fontSize: 18, fontWeight: "bold", color: "#1e3a5f" },
  statLabel: { fontSize: 10, color: "#666", marginTop: 2 },
  filterRow: { flexDirection: "row", marginBottom: 15, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e5e5e5",
  },
  filterChipActive: { backgroundColor: "#1e3a5f" },
  filterChipText: { fontSize: 13, fontWeight: "600", color: "#666" },
  filterChipTextActive: { color: "#fff" },
  emptyBox: { alignItems: "center", padding: 30 },
  emptyText: { fontSize: 16, color: "#666", marginTop: 10 },
  productItem: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  productInfo: { flex: 1 },
  productRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  productCode: { fontSize: 14, fontWeight: "bold", color: "#1e3a5f" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: "bold", color: "#fff" },
  productName: { fontSize: 15, color: "#333", marginTop: 4 },
  productMeta: { fontSize: 12, color: "#666", marginTop: 2 },
  productActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  rateBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    minWidth: 80,
    flexDirection: "row",
    gap: 4,
  },
  rateLabel: { fontSize: 10, color: "#666" },
  rateValue: { fontSize: 14, fontWeight: "bold", color: "#333" },
  deleteBtn: { padding: 8, borderRadius: 8, backgroundColor: "#fef2f2" },
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === "web" ? 20 : 50,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  modalSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    margin: 15,
    marginBottom: 10,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  modalFilterRow: {
    flexDirection: "row",
    paddingHorizontal: 15,
    marginBottom: 10,
    gap: 8,
  },
  bulkActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  selectAllBtn: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 10,
  },
  selectAllText: { color: "#1e40af", fontWeight: "600", fontSize: 13 },
  deselectAllBtn: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 10,
  },
  deselectAllText: { color: "#dc2626", fontWeight: "600", fontSize: 13 },
  selectedCount: {
    flex: 1,
    textAlign: "right",
    color: "#666",
    fontWeight: "600",
  },
  modalList: { flex: 1, paddingHorizontal: 15 },
  selectItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  selectItemActive: { backgroundColor: "#eff6ff", borderColor: "#1e3a5f" },
  selectItemLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#d1d5db",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: { backgroundColor: "#1e3a5f", borderColor: "#1e3a5f" },
  selectItemInfo: { flex: 1 },
  selectItemCode: { fontSize: 13, fontWeight: "bold", color: "#1e3a5f" },
  badgeSmall: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 },
  badgeSmallText: { fontSize: 9, fontWeight: "bold", color: "#fff" },
  selectItemName: { fontSize: 14, color: "#333", marginTop: 2 },
  selectItemMeta: { fontSize: 11, color: "#666", marginTop: 2 },
  rateInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#1e3a5f",
    borderRadius: 6,
    paddingHorizontal: 8,
    minWidth: 90,
  },
  rateInputLabel: { fontSize: 14, color: "#666" },
  rateInput: { flex: 1, padding: 8, fontSize: 14, textAlign: "right" },
  modalFooter: {
    flexDirection: "row",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  cancelBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    marginRight: 10,
  },
  cancelBtnText: { color: "#666", fontWeight: "bold" },
  saveBtn: {
    flex: 2,
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#1e3a5f",
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "bold" },
  rateModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  rateModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 350,
  },
  rateModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  rateModalProduct: { fontSize: 14, color: "#666", marginBottom: 15 },
  rateModalInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  rateModalCurrency: { fontSize: 18, color: "#333", fontWeight: "bold" },
  rateModalInput: { flex: 1, padding: 12, fontSize: 18, textAlign: "right" },
  rateModalButtons: { flexDirection: "row", gap: 10 },
  rateModalCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  rateModalCancelText: { color: "#666", fontWeight: "bold" },
  rateModalSave: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#1e3a5f",
    alignItems: "center",
  },
  rateModalSaveText: { color: "#fff", fontWeight: "bold" },
});
