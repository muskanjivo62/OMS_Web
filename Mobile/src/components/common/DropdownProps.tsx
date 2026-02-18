import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Dropdown as RNDropdown } from 'react-native-element-dropdown';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '@/src/constants/theme';

interface DropdownProps {
  label: string;
  data: { label: string; value: string | number }[];
  value: string | number | null;
  onChange: (value: any) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  icon?: string;
}

export default function Dropdown({
  label,
  data,
  value,
  onChange,
  placeholder = 'Select...',
  error,
  required = false,
  disabled = false,
  searchable = true,
  icon = 'chevron-down',
}: DropdownProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      
      <RNDropdown
        style={[
          styles.dropdown,
          error ? styles.dropdownError : null,
          disabled ? styles.dropdownDisabled : null,
        ]}
        placeholderStyle={styles.placeholder}
        selectedTextStyle={styles.selectedText}
        inputSearchStyle={styles.inputSearch}
        iconStyle={styles.iconStyle}
        data={data}
        search={searchable}
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        searchPlaceholder="Search..."
        value={value}
        onChange={(item) => onChange(item.value)}
        disable={disabled}
        renderLeftIcon={() => (
          <Ionicons
            name="location-outline"
            size={20}
            color={COLORS.textSecondary}
            style={styles.leftIcon}
          />
        )}
        renderRightIcon={() => (
          <Ionicons
            name={icon as any}
            size={20}
            color={COLORS.textSecondary}
          />
        )}
      />
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
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
    height: 56,
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
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
  error: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});