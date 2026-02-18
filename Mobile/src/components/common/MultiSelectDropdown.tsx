<<<<<<< HEAD
import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Checkbox, Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING } from "@/src/constants/theme";

type Option = {
  label: string;
  value: number;
};

type Props = {
  label: string;
  data: Option[];
  values: number[];
  onChange: (values: number[]) => void;
  placeholder?: string;
  icon?: string;
};

export default function MultiSelectDialog({
=======
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MultiSelect } from 'react-native-element-dropdown';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '@/src/constants/theme';

interface MultiSelectDropdownProps {
  label: string;
  data: { label: string; value: number }[];
  values: number[];
  onChange: (values: number[]) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  icon?: string;
}

export default function MultiSelectDropdown({
>>>>>>> 4975e9f2 (commit)
  label,
  data,
  values,
  onChange,
<<<<<<< HEAD
  placeholder = "Select...",
  icon = "list-outline",
}: Props) {
  const [visible, setVisible] = useState(false);
  const [tempValues, setTempValues] = useState<number[]>(values);

  const toggleValue = (val: number) => {
    if (tempValues.includes(val)) {
      setTempValues(tempValues.filter((v) => v !== val));
    } else {
      setTempValues([...tempValues, val]);
    }
  };

  const handleOpen = () => {
    setTempValues(values);
    setVisible(true);
  };

  const handleOk = () => {
    onChange(tempValues);
    setVisible(false);
  };

  return (
    <>
      {/* Field */}
      <TouchableOpacity style={styles.input} onPress={handleOpen}>
        <View style={styles.row}>
          <Ionicons name={icon as any} size={18} color={COLORS.textSecondary} />
          <Text style={styles.inputText}>
            {values.length ? `${values.length} selected` : placeholder}
          </Text>
          <Ionicons name="chevron-down" size={18} />
        </View>
      </TouchableOpacity>

      {/* Dialog */}
      <Modal transparent animationType="fade" visible={visible}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.title}>{label}</Text>

            <FlatList
              data={data}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => {
                const checked = tempValues.includes(item.value);

                return (
                  <TouchableOpacity
                    style={styles.item}
                    onPress={() => toggleValue(item.value)}
                  >
                    <Checkbox status={checked ? "checked" : "unchecked"} />
                    <Text style={styles.itemText}>{item.label}</Text>
                  </TouchableOpacity>
                );
              }}
            />

            <View style={styles.footer}>
              <Button mode="contained" onPress={handleOk}>
                OK
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
=======
  placeholder = 'Select...',
  error,
  required = false,
  disabled = false,
  searchable = true,
  icon = 'list-outline',
}: MultiSelectDropdownProps) {
  
  // Safety check - ensure values is always an array
  const safeValues = values || [];
  const safeData = data || [];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>

      <MultiSelect
        style={[
          styles.dropdown,
          error ? styles.dropdownError : null,
          disabled ? styles.dropdownDisabled : null,
        ]}
        placeholderStyle={styles.placeholder}
        selectedTextStyle={styles.selectedText}
        inputSearchStyle={styles.inputSearch}
        iconStyle={styles.iconStyle}
        data={safeData}
        search={searchable}
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        searchPlaceholder="Search..."
        value={safeValues}
        onChange={(items) => onChange(items)}
        disable={disabled}
        renderLeftIcon={() => (
          <Ionicons
            name={icon as any}
            size={20}
            color={COLORS.textSecondary}
            style={styles.leftIcon}
          />
        )}
        selectedStyle={styles.selectedItem}
        activeColor={COLORS.primaryLight}
      />

      {safeValues.length > 0 && (
        <View style={styles.selectedContainer}>
          {safeData
            .filter((item) => safeValues.includes(item.value))
            .map((item) => (
              <View key={item.value} style={styles.chip}>
                <Text style={styles.chipText}>{item.label}</Text>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={COLORS.primary}
                  onPress={() => onChange(safeValues.filter((v) => v !== item.value))}
                />
              </View>
            ))}
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
>>>>>>> 4975e9f2 (commit)
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  /* Field (Closed State) */
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  inputText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  /* Modal Overlay */
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  /* Dialog Box */
  dialog: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    maxHeight: "70%",
    elevation: 5,
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
    color: COLORS.textPrimary,
  },

  /* List Item */
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },

  itemText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  /* Footer */
  footer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 12,
    alignItems: "flex-end",
  },
});
=======
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  required: {
    color: COLORS.error,
  },
  dropdown: {
    minHeight: 56,
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  dropdownError: {
    borderColor: COLORS.error,
  },
  dropdownDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.6,
  },
  placeholder: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  selectedText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  inputSearch: {
    height: 44,
    fontSize: 14,
    borderRadius: RADIUS.sm,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  leftIcon: {
    marginRight: SPACING.sm,
  },
  selectedItem: {
    borderRadius: RADIUS.sm,
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '500',
  },
  error: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});
>>>>>>> 4975e9f2 (commit)
