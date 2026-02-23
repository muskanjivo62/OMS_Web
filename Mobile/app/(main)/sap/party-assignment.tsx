import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '@/src/utils/storage';
import { api } from '@/src/services/api';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

interface Party {
  card_code: string;
  card_name: string;
  state: string;
  main_group: string;
  assigned_at?: string;
}

export default function PartyAssignmentScreen() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [assignedCardCodes, setAssignedCardCodes] = useState<Set<string>>(new Set());
  const [tempSelectedCodes, setTempSelectedCodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    loadUsers();
    loadAllParties();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadUserParties(selectedUserId);
    } else {
      setAssignedCardCodes(new Set<string>());
    }
  }, [selectedUserId]);

  const getToken = async (): Promise<string | undefined> => {
    const token = await storage.getAccessToken();
    return token || undefined;
  };

  const loadUsers = async () => {
    try {
      const token = await getToken();
      const res = await api.get('/auth/users/list/', token);
      console.log('Users response:', res);
      if (res && res.success) {
        setUsers(res.data || []);
      }
    } catch (error) {
      console.log('Load users error:', error);
    }
  };

  const loadAllParties = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await api.get('/sap/parties/', token);
      console.log('Parties response:', res);
      const partiesList = Array.isArray(res) ? res : (res?.data || []);
      setParties(partiesList);
    } catch (error) {
      console.log('Load parties error:', error);
    }
    setLoading(false);
  };

  const loadUserParties = async (userId: number) => {
    setLoading(true);
    setMessage('');
    try {
      const token = await getToken();
      const res = await api.get(`/auth/users/${userId}/parties/`, token);
      console.log('User parties response:', res);
      if (res && res.success) {
        const codes = new Set<string>(res.data.card_codes || []);
        setAssignedCardCodes(codes);
      } else {
        setAssignedCardCodes(new Set<string>());
      }
    } catch (error) {
      console.log('Load user parties error:', error);
      setAssignedCardCodes(new Set<string>());
    }
    setLoading(false);
  };

  const openAssignModal = () => {
    // Copy current assigned codes to temp selection
    setTempSelectedCodes(new Set(assignedCardCodes));
    setSearchQuery('');
    setShowAssignModal(true);
  };

  const togglePartySelection = (cardCode: string) => {
    setTempSelectedCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardCode)) {
        newSet.delete(cardCode);
      } else {
        newSet.add(cardCode);
      }
      return newSet;
    });
  };

  const selectAllFiltered = () => {
    const filteredCodes = filteredParties.map(p => p.card_code);
    setTempSelectedCodes(prev => {
      const newSet = new Set(prev);
      filteredCodes.forEach(code => newSet.add(code));
      return newSet;
    });
  };

  const deselectAllFiltered = () => {
    const filteredCodes = new Set(filteredParties.map(p => p.card_code));
    setTempSelectedCodes(prev => {
      const newSet = new Set(prev);
      filteredCodes.forEach(code => newSet.delete(code));
      return newSet;
    });
  };

  const saveAssignments = async () => {
    if (!selectedUserId) {
      setMessage('❌ Please select a user first');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const token = await getToken();
      const cardCodesArray = Array.from(tempSelectedCodes);
      
      console.log('Saving assignments:', {
        user_id: selectedUserId,
        card_codes: cardCodesArray,
      });

      const res = await api.post('/auth/assign-parties/', {
        user_id: selectedUserId,
        card_codes: cardCodesArray,
      }, token);
      
      console.log('Save response:', res);

      if (res && res.success) {
        setMessage(`✅ ${res.message}`);
        setAssignedCardCodes(new Set(tempSelectedCodes));
        setShowAssignModal(false);
      } else {
        setMessage(`❌ ${res?.message || 'Failed to save'}`);
      }
    } catch (error) {
      console.log('Save error:', error);
      setMessage('❌ Failed to save assignments');
    }
    setSaving(false);
  };

  const removeParty = async (cardCode: string) => {
    if (!selectedUserId) return;

    try {
      const token = await getToken();
      const res = await api.post('/auth/remove-party/', {
        user_id: selectedUserId,
        card_code: cardCode,
      }, token);

      console.log('Remove response:', res);

      if (res && res.success) {
        setAssignedCardCodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(cardCode);
          return newSet;
        });
        setMessage('✅ Party removed');
      } else {
        setMessage(`❌ ${res?.message || 'Failed to remove'}`);
      }
    } catch (error) {
      console.log('Remove error:', error);
      setMessage('❌ Failed to remove party');
    }
  };

  const filteredParties = parties.filter(p =>
    p.card_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.card_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.main_group?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const assignedParties = parties.filter(p => assignedCardCodes.has(p.card_code));
  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Party Assignment</Text>
        <Text style={styles.headerSubtitle}>Assign parties to users using Card Code</Text>
      </View> */}

      <ScrollView style={styles.content}>
        {/* User Selection */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select User</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedUserId}
              onValueChange={(value) => {
                console.log('User selected:', value);
                setSelectedUserId(value);
                setMessage('');
              }}
              style={styles.picker}
            >
              <Picker.Item label="-- Select User --" value={null} />
              {users.map(user => (
                <Picker.Item
                  key={user.id}
                  label={`${user.name || user.username} (${user.role || 'User'})`}
                  value={user.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Message */}
        {message ? (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}

        {/* Selected User Info & Actions */}
        {selectedUserId && (
          <View style={styles.card}>
            <View style={styles.userInfoHeader}>
              <View>
                <Text style={styles.userName}>{selectedUser?.name || selectedUser?.username}</Text>
                <Text style={styles.userRole}>{selectedUser?.role || 'User'}</Text>
              </View>
              <TouchableOpacity
                style={styles.assignButton}
                onPress={openAssignModal}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.assignButtonText}>
                  {assignedCardCodes.size > 0 ? 'Edit Parties' : 'Assign Parties'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{assignedCardCodes.size}</Text>
                <Text style={styles.statLabel}>Assigned Parties</Text>
              </View>
            </View>
          </View>
        )}

        {/* Assigned Parties List */}
        {selectedUserId && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Assigned Parties</Text>

            {loading ? (
              <ActivityIndicator size="large" color="#1e3a5f" />
            ) : assignedParties.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No parties assigned</Text>
                <Text style={styles.emptySubtext}>Click "Assign Parties" to add</Text>
              </View>
            ) : (
              <View>
                {assignedParties.map(party => (
                  <View key={party.card_code} style={styles.partyItem}>
                    <View style={styles.partyInfo}>
                      <Text style={styles.partyCode}>{party.card_code}</Text>
                      <Text style={styles.partyName}>{party.card_name}</Text>
                      <Text style={styles.partyDetails}>
                        {party.state || '-'} • {party.main_group || '-'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeParty(party.card_code)}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Assign Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Parties</Text>
            <TouchableOpacity onPress={() => setShowAssignModal(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by code, name, state, group..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Selection Actions */}
          <View style={styles.selectionActions}>
            <TouchableOpacity style={styles.selectAllBtn} onPress={selectAllFiltered}>
              <Text style={styles.selectAllText}>Select All ({filteredParties.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deselectAllBtn} onPress={deselectAllFiltered}>
              <Text style={styles.deselectAllText}>Deselect All</Text>
            </TouchableOpacity>
            <View style={styles.selectedCount}>
              <Text style={styles.selectedCountText}>{tempSelectedCodes.size} selected</Text>
            </View>
          </View>

          {/* Parties List */}
          <ScrollView style={styles.modalList}>
            {filteredParties.map(party => {
              const isSelected = tempSelectedCodes.has(party.card_code);
              return (
                <TouchableOpacity
                  key={party.card_code}
                  style={[styles.partySelectItem, isSelected && styles.partySelectItemSelected]}
                  onPress={() => togglePartySelection(party.card_code)}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <View style={styles.partySelectInfo}>
                    <Text style={styles.partySelectCode}>{party.card_code}</Text>
                    <Text style={styles.partySelectName}>{party.card_name}</Text>
                    <Text style={styles.partySelectDetails}>
                      {party.state || '-'} • {party.main_group || '-'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Save Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAssignModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveAssignments}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save ({tempSelectedCodes.size})</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1e3a5f',
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 50,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 5,
  },
  content: {
    padding: 15,
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  picker: {
    height: 50,
  },
  messageContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  userInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  assignButton: {
    backgroundColor: '#1e3a5f',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  assignButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statBox: {
    backgroundColor: '#e8f4fc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a5f',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  partyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  partyInfo: {
    flex: 1,
  },
  partyCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a5f',
  },
  partyName: {
    fontSize: 15,
    color: '#333',
    marginTop: 2,
  },
  partyDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 5,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 15,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  selectAllBtn: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 10,
  },
  selectAllText: {
    color: '#1e40af',
    fontWeight: '600',
    fontSize: 13,
  },
  deselectAllBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 10,
  },
  deselectAllText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 13,
  },
  selectedCount: {
    flex: 1,
    alignItems: 'flex-end',
  },
  selectedCountText: {
    color: '#666',
    fontWeight: '600',
  },
  modalList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  partySelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  partySelectItemSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#1e3a5f',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#1e3a5f',
    borderColor: '#1e3a5f',
  },
  partySelectInfo: {
    flex: 1,
  },
  partySelectCode: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e3a5f',
  },
  partySelectName: {
    fontSize: 15,
    color: '#333',
    marginTop: 2,
  },
  partySelectDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 2,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
