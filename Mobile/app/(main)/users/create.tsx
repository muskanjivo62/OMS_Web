<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, Role } from "react-native";
=======
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Role,
} from 'react-native';
>>>>>>> 4975e9f2 (commit)
import {
  TextInput,
  Button,
  Text,
  Surface,
  HelperText,
<<<<<<< HEAD
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, RADIUS, GRADIENTS } from "@/src/constants/theme";
import {
  masterService,
  State,
  Company,
  MainGroup,
  UserRole,
} from "@/src/services/master.service";
import MultiSelectDropdown from "@/src/components/common/MultiSelectDropdown";
import Dropdown from "@/src/components/common/DropdownProps";
import { userService } from "@/src/services/user.service";
import { router } from "expo-router";

export default function CreateUserScreen() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    role: "",
    companies: null as number | null, // Single
    mainGroup: [] as number[], // Multi
    state: [] as number[], // Multi
=======
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, GRADIENTS } from '@/src/constants/theme';
import { masterService, State, Company, MainGroup, UserRole } from '@/src/services/master.service';
import MultiSelectDropdown from '@/src/components/common/MultiSelectDropdown';
import Dropdown from '@/src/components/common/DropdownProps';
import { userService } from '@/src/services/user.service';

export default function CreateUserScreen() {

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    role: '',
    companies: null as number | null,      // Single
    mainGroup: [] as number[],           // Multi
    state: [] as number[],               // Multi
>>>>>>> 4975e9f2 (commit)
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  // Master data from API
  const [states, setStates] = useState<State[]>();
  const [companies, setCompanies] = useState<Company[]>();
  const [mainGroups, setMainGroups] = useState<MainGroup[]>();
  const [roles, setRoles] = useState<UserRole[]>([]);

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
<<<<<<< HEAD
      setErrors({ ...errors, [field]: "" });
    }
  };

  // const validate = (): boolean => {
  //   const newErrors: Record<string, string> = {};

  //   if (!formData.name.trim()) newErrors.name = "Name is required";
  //   if (!formData.username.trim()) newErrors.username = "Username is required";
  //   if (!formData.password.trim()) newErrors.password = "Password is required";
  //   if (formData.password.length < 6)
  //     newErrors.password = "Password must be at least 6 characters";
  //   if (!formData.role) newErrors.role = "Role is required";
  //   if (!formData.companies) newErrors.company = "Company is required";

  //   setErrors(newErrors);
  //   return Object.keys(newErrors).length === 0;
  // };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    if (!formData.companies) {
      newErrors.company = "Company is required";
    }

    // Optional fields → no validation
    // email, phone, mainGroup, state
=======
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.companies) newErrors.company = 'Company is required';
>>>>>>> 4975e9f2 (commit)

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
<<<<<<< HEAD
    console.log("Creating user:");
    if (!validate()) return;

    setLoading(true);

    try {
=======
     console.log('Creating user:');
    if (!validate()) return;

    setLoading(true);
    
    try {

>>>>>>> 4975e9f2 (commit)
      const userData = {
        name: formData.name,
        username: formData.username,
        password: formData.password,
<<<<<<< HEAD
        email: formData.email || "",
        phone: formData.phone || "",
        role: formData.role,
        company: formData.companies,
        main_groups: formData.mainGroup.join(","), // ← Convert array to string
        states: formData.state.join(","),
      };

      console.log("Creating user:", userData);
      const response = await userService.createUser(userData);
      console.log("Create user response:", JSON.stringify(response));
      // await new Promise((resolve) => setTimeout(resolve, 1500));

      if (response?.Success) {
        Alert.alert("Success", "User created successfully!", [
          {
            text: "OK",
            onPress: () => {
              handleClear();
              router.replace("/(main)/dashboard");
            },
          },
        ]);
      } else {
        const errorMsg = response?.errors
          ? Object.values(response.errors).flat().join("\n")
          : response?.message || "Failed to create user";
        Alert.alert("Error", errorMsg);
        router.replace("/(main)/dashboard");
      }
    } catch (error) {
      console.log("Create user error:", error);
      Alert.alert("Error", "Failed to create user. Please try again.");
      router.replace("/(main)/dashboard");
    } finally {
      setLoading(false);
    }
=======
        email: formData.email || '',
        phone: formData.phone || '',
        role: formData.role,
        company: formData.companies,
        main_groups: formData.mainGroup.join(','),  // ← Convert array to string
        states: formData.state.join(','),
      }

      console.log('Creating user:', userData);
      const response = await userService.createUser(userData);

      await new Promise(resolve => setTimeout(resolve, 1500));

      if (response?.Success) {
        Alert.alert('Success', 'User created successfully!', [
          { text: 'OK', onPress: () => handleClear() },
        ])
      } else {
        const errorMsg = response?.errors
          ? Object.values(response.errors).flat().join('\n')
          : response?.message || 'Failed to create user';
        Alert.alert('Error', errorMsg);
      }

    } catch (error) {
      console.error('Create user error:', error);
      Alert.alert('Error', 'Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }

>>>>>>> 4975e9f2 (commit)
  };

  const handleClear = () => {
    setFormData({
<<<<<<< HEAD
      name: "",
      username: "",
      password: "",
      email: "",
      phone: "",
      role: "",
=======
      name: '',
      username: '',
      password: '',
      email: '',
      phone: '',
      role: '',
>>>>>>> 4975e9f2 (commit)
      companies: null,
      mainGroup: [],
      state: [],
    });
    setErrors({});
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
<<<<<<< HEAD
    try {
      // setDataLoading(true);
      const [statesData, companiesData, mainGroupsData, rolesData] =
        await Promise.all([
          masterService.getStates(),
          masterService.getCompanies(),
          masterService.getMainGroups(),
          masterService.getRoles(),
        ]);
      console.log("states" + statesData);
=======

    try {

      // setDataLoading(true);
      const [statesData, companiesData, mainGroupsData,rolesData] = await Promise.all([
        masterService.getStates(),
        masterService.getCompanies(),
        masterService.getMainGroups(),
        masterService.getRoles(),
      ]);
      console.log('states' + statesData);
>>>>>>> 4975e9f2 (commit)
      setStates(statesData);
      setCompanies(companiesData);
      setMainGroups(mainGroupsData);
      setRoles(rolesData);
    } catch (error) {
<<<<<<< HEAD
      console.log("Error fetching master data:", error);
      Alert.alert("Error", "Failed to load form data. Please try again.");
    }
  };

  const stateOptions = (states || []).map((s) => ({
    label: s.name,
    value: s.id,
  }));
  const companyOptions = (companies || []).map((c) => ({
    label: c.name,
    value: c.id,
  }));
  const mainGroupOptions = (mainGroups || []).map((g) => ({
    label: g.name,
    value: g.id,
  }));
=======
      console.error('Error fetching master data:', error);
      Alert.alert('Error', 'Failed to load form data. Please try again.');
    }
  };

  const stateOptions = (states || []).map((s) => ({ label: s.name, value: s.id }));
  const companyOptions = (companies || []).map((c) => ({ label: c.name, value: c.id }));
  const mainGroupOptions = (mainGroups || []).map((g) => ({ label: g.name, value: g.id }));
>>>>>>> 4975e9f2 (commit)

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Personal Info Section */}
        <Surface style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIndicator} />
            <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
          </View>

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Full Name *</Text>
            <TextInput
              value={formData.name}
<<<<<<< HEAD
              onChangeText={(text) => updateField("name", text)}
=======
              onChangeText={(text) => updateField('name', text)}
>>>>>>> 4975e9f2 (commit)
              mode="outlined"
              placeholder="Enter full name"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
<<<<<<< HEAD
              left={
                <TextInput.Icon
                  icon="account-outline"
                  color={COLORS.textSecondary}
                />
              }
=======
              left={<TextInput.Icon icon="account-outline" color={COLORS.textSecondary} />}
>>>>>>> 4975e9f2 (commit)
              error={!!errors.name}
            />
            {errors.name ? (
              <HelperText type="error" visible={true}>
                {errors.name}
              </HelperText>
            ) : null}
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              value={formData.email}
<<<<<<< HEAD
              onChangeText={(text) => updateField("email", text)}
=======
              onChangeText={(text) => updateField('email', text)}
>>>>>>> 4975e9f2 (commit)
              mode="outlined"
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
<<<<<<< HEAD
              left={
                <TextInput.Icon
                  icon="email-outline"
                  color={COLORS.textSecondary}
                />
              }
=======
              left={<TextInput.Icon icon="email-outline" color={COLORS.textSecondary} />}
>>>>>>> 4975e9f2 (commit)
            />
          </View>

          {/* Phone */}
<<<<<<< HEAD
          {/* <View style={styles.field}>
            <Text style={styles.fieldLabel}>Phone</Text>
            <TextInput
              value={formData.phone}
              onChangeText={(text) => updateField("phone", text)}
              mode="outlined"
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              left={
                <TextInput.Icon
                  icon="phone-outline"
                  color={COLORS.textSecondary}
                />
              }
            />
          </View> */}
=======
>>>>>>> 4975e9f2 (commit)
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Phone</Text>
            <TextInput
              value={formData.phone}
<<<<<<< HEAD
              onChangeText={(text) => {
                // Allow only numbers & max 10 digits
                const numericText = text.replace(/[^0-9]/g, "");
                if (numericText.length <= 10) {
                  updateField("phone", numericText);
                }
              }}
              mode="outlined"
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              maxLength={10}
=======
              onChangeText={(text) => updateField('phone', text)}
              mode="outlined"
              placeholder="Enter phone number"
              keyboardType="phone-pad"
>>>>>>> 4975e9f2 (commit)
              style={styles.input}
              outlineStyle={styles.inputOutline}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
<<<<<<< HEAD
              left={
                <TextInput.Icon
                  icon="phone-outline"
                  color={COLORS.textSecondary}
                />
              }
            />
          </View>
=======
              left={<TextInput.Icon icon="phone-outline" color={COLORS.textSecondary} />}
            />
          </View>

>>>>>>> 4975e9f2 (commit)
        </Surface>

        {/* Login Credentials Section */}
        <Surface style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIndicator} />
            <Text style={styles.sectionTitle}>LOGIN CREDENTIALS</Text>
          </View>

          {/* Username */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Username *</Text>
            <TextInput
              value={formData.username}
<<<<<<< HEAD
              onChangeText={(text) => updateField("username", text)}
=======
              onChangeText={(text) => updateField('username', text)}
>>>>>>> 4975e9f2 (commit)
              mode="outlined"
              placeholder="Enter username"
              autoCapitalize="none"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              left={<TextInput.Icon icon="at" color={COLORS.textSecondary} />}
              error={!!errors.username}
            />
<<<<<<< HEAD
            <HelperText type="error" visible={!!errors.username}>
              {errors.username}
            </HelperText>
=======
            <HelperText type="error" visible={!!errors.username}>{errors.username}</HelperText>
>>>>>>> 4975e9f2 (commit)
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password *</Text>
            <TextInput
              value={formData.password}
<<<<<<< HEAD
              onChangeText={(text) => updateField("password", text)}
=======
              onChangeText={(text) => updateField('password', text)}
>>>>>>> 4975e9f2 (commit)
              mode="outlined"
              placeholder="Enter password"
              secureTextEntry={!showPassword}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
<<<<<<< HEAD
              left={
                <TextInput.Icon
                  icon="lock-outline"
                  color={COLORS.textSecondary}
                />
              }
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off-outline" : "eye-outline"}
=======
              left={<TextInput.Icon icon="lock-outline" color={COLORS.textSecondary} />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
>>>>>>> 4975e9f2 (commit)
                  color={COLORS.textSecondary}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              error={!!errors.password}
            />
<<<<<<< HEAD
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>
=======
            <HelperText type="error" visible={!!errors.password}>{errors.password}</HelperText>
>>>>>>> 4975e9f2 (commit)
          </View>
        </Surface>

        {/* Organization Section */}
        <Surface style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIndicator} />
            <Text style={styles.sectionTitle}>ORGANIZATION</Text>
          </View>

          {/* Role */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Role *</Text>
<<<<<<< HEAD

            <View style={styles.selectRow}>
              {roles.map((role) => {
                const selected = formData.role === role.id.toString();

                return (
                  <Button
                    key={role.id}
                    mode={selected ? "contained" : "outlined"}
                    onPress={() => updateField("role", role.id.toString())}
                    style={[
                      styles.selectButton,
                      selected && styles.selectButtonActive,
                    ]}
                    labelStyle={[
                      styles.selectButtonLabel,
                      selected && styles.selectButtonLabelActive,
                    ]}
                    buttonColor={selected ? COLORS.primary : "transparent"}
                  >
                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                  </Button>
                );
              })}
            </View>

            <HelperText type="error" visible={!!errors.role}>
              {errors.role}
            </HelperText>
=======
            <View style={styles.selectRow}>
              {roles.map((role) => (
                <Button
                  key={role.id}
                  mode={formData.role === role.name ? 'contained' : 'outlined'}
                  onPress={() => updateField('role', role.id.toString())}
                  style={[
                    styles.selectButton,
                    formData.role === role.name && styles.selectButtonActive,
                  ]}
                  labelStyle={[
                    styles.selectButtonLabel,
                    formData.role === role.name && styles.selectButtonLabelActive,
                  ]}
                  buttonColor={formData.role === role.name ? COLORS.primary : 'transparent'}>
                  {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                </Button>
              ))}
            </View>
            <HelperText type="error" visible={!!errors.role}>{errors.role}</HelperText>
>>>>>>> 4975e9f2 (commit)
          </View>

          {/* State */}
          <View style={styles.field}>
<<<<<<< HEAD
=======

        
>>>>>>> 4975e9f2 (commit)
            <Dropdown
              label="Company"
              data={companyOptions}
              value={formData.companies}
<<<<<<< HEAD
              onChange={(value) => updateField("companies", value)}
=======
              onChange={(value) => updateField('companies', value)}
>>>>>>> 4975e9f2 (commit)
              placeholder="Select company..."
              error={errors.company}
              required
              searchable={false}
              icon="business-outline"
            />
<<<<<<< HEAD
=======

>>>>>>> 4975e9f2 (commit)
          </View>

          <View style={styles.field}>
            <MultiSelectDropdown
              label="Main Group"
              data={mainGroupOptions}
              values={formData.mainGroup}
<<<<<<< HEAD
              onChange={(values: any) => updateField("mainGroup", values)}
              placeholder="Select main groups..."
=======
              onChange={(values: any) => updateField('mainGroup', values)}
              placeholder="Select main groups..."
              searchable={false}
>>>>>>> 4975e9f2 (commit)
              icon="people-outline"
            />
          </View>

          <View style={styles.field}>
            <MultiSelectDropdown
              label="State"
              data={stateOptions}
              values={formData.state}
<<<<<<< HEAD
              onChange={(values: any) => updateField("state", values)}
              placeholder="Select states..."
              icon="location-outline"
            />
          </View>
=======
              onChange={(values: any) => updateField('state', values)}
              placeholder="Select states..."
              searchable={true}
              icon="location-outline"
            />
          </View>

>>>>>>> 4975e9f2 (commit)
        </Surface>

        {/* Spacer for bottom bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Button
          mode="outlined"
<<<<<<< HEAD
          onPress={() =>
            setFormData({
              name: "",
              username: "",
              password: "",
              email: "",
              phone: "",
              role: "",
              companies: [],
              mainGroup: [],
              state: [],
            })
          }
=======
          onPress={() => setFormData({
            name: '', username: '', password: '', email: '',
            phone: '', role: '', companies: [], mainGroup: [], state: [],
          })}
>>>>>>> 4975e9f2 (commit)
          style={styles.btnClear}
          labelStyle={styles.btnClearLabel}
        >
          Clear
        </Button>

        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.btnSubmitGradient}
        >
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.btnSubmit}
            labelStyle={styles.btnSubmitLabel}
            buttonColor="transparent"
          >
<<<<<<< HEAD
            {loading ? "Creating..." : "Create User"}
          </Button>
        </LinearGradient>
      </View>
    </View>
  );
=======
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </LinearGradient>

      </View>
    </View>
  );

>>>>>>> 4975e9f2 (commit)
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    elevation: 2,
  },
  sectionHeader: {
<<<<<<< HEAD
    flexDirection: "row",
    alignItems: "center",
=======
    flexDirection: 'row',
    alignItems: 'center',
>>>>>>> 4975e9f2 (commit)
    marginBottom: SPACING.lg,
  },
  sectionIndicator: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginRight: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 11,
<<<<<<< HEAD
    fontWeight: "600",
=======
    fontWeight: '600',
>>>>>>> 4975e9f2 (commit)
    color: COLORS.primaryDark,
    letterSpacing: 1,
  },
  field: {
    marginBottom: SPACING.sm,
  },
  fieldLabel: {
    fontSize: 12,
<<<<<<< HEAD
    fontWeight: "500",
=======
    fontWeight: '500',
>>>>>>> 4975e9f2 (commit)
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    fontSize: 14,
  },
  inputOutline: {
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  selectRow: {
<<<<<<< HEAD
    flexDirection: "row",
    flexWrap: "wrap",
=======
    flexDirection: 'row',
    flexWrap: 'wrap',
>>>>>>> 4975e9f2 (commit)
    gap: SPACING.sm,
  },
  selectButton: {
    borderRadius: RADIUS.md,
    borderColor: COLORS.border,
  },
  selectButtonWide: {
    flex: 1,
<<<<<<< HEAD
    minWidth: "45%",
=======
    minWidth: '45%',
>>>>>>> 4975e9f2 (commit)
  },
  selectButtonActive: {
    borderColor: COLORS.primary,
  },
  selectButtonLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  selectButtonLabelActive: {
    color: COLORS.textLight,
  },
  bottomBar: {
<<<<<<< HEAD
    position: "absolute",
=======
    position: 'absolute',
>>>>>>> 4975e9f2 (commit)
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
<<<<<<< HEAD
    flexDirection: "row",
=======
    flexDirection: 'row',
>>>>>>> 4975e9f2 (commit)
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  btnClear: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderColor: COLORS.border,
    borderWidth: 2,
  },
  btnClearLabel: {
    color: COLORS.textSecondary,
<<<<<<< HEAD
    fontWeight: "600",
=======
    fontWeight: '600',
>>>>>>> 4975e9f2 (commit)
  },
  btnSubmitGradient: {
    flex: 2,
    borderRadius: RADIUS.md,
  },
  btnSubmit: {
    borderRadius: RADIUS.md,
  },
  btnSubmitLabel: {
    color: COLORS.textLight,
<<<<<<< HEAD
    fontWeight: "600",
  },
});
=======
    fontWeight: '600',
  },
});
>>>>>>> 4975e9f2 (commit)
