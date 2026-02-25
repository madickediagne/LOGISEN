import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';
import { auth, db } from '../../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const statusLabel = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  done: 'Terminée',
  cancelled: 'Annulée',
};

const statusColor = {
  pending: '#FFE8C2',
  confirmed: '#D4F5DD',
  done: '#E0E7FF',
  cancelled: '#FFE0E0',
};

const statusTextColor = {
  pending: '#A66321',
  confirmed: '#1B7A3A',
  done: '#3749A8',
  cancelled: '#B3261E',
};

const filterTabs = [
  { key: 'all', label: 'Toutes' },
  { key: 'upcoming', label: 'À venir' },
  { key: 'past', label: 'Passées' },
];

const ManageVisitsScreen = ({ navigation }) => {
  const uid = auth.currentUser?.uid || null;
  const [visits, setVisits] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedFilter, setSelectedFilter] = React.useState('all');
  const [updatingId, setUpdatingId] = React.useState(null);

  React.useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'visits'), where('landlordId', '==', uid));
    setLoading(true);
    const unsubscribe = onSnapshot(
      q,
      snap => {
        if (snap.empty) {
          setVisits([]);
        } else {
          const items = snap.docs.map(d => ({
            id: d.id,
            listingTitle: d.data().listingTitle || 'Logement',
            listingArea: d.data().listingArea || '',
            studentName: d.data().studentName || 'Étudiant',
            studentPhone: d.data().studentPhone || '',
            date: d.data().date || '',
            status: d.data().status || 'pending',
          }));
          setVisits(items);
        }
        setLoading(false);
      },
      () => {
        setVisits([]);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [uid]);

  const handleUpdateStatus = async (id, status) => {
    if (!id) return;
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, 'visits', id), { status });
      setVisits(prev =>
        prev.map(v => (v.id === id ? { ...v, status } : v))
      );
    } catch {
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateDate = async (id, date) => {
    if (!id) return;
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, 'visits', id), { date });
    } catch {
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredVisits = React.useMemo(() => {
    if (selectedFilter === 'all') return visits;
    if (selectedFilter === 'upcoming') {
      return visits.filter(v => v.status === 'pending' || v.status === 'confirmed');
    }
    if (selectedFilter === 'past') {
      return visits.filter(v => v.status === 'done' || v.status === 'cancelled');
    }
    return visits;
  }, [visits, selectedFilter]);

  const renderItem = ({ item }) => {
    const bg = statusColor[item.status] || '#E0E0E0';
    const fg = statusTextColor[item.status] || COLORS.darkGray;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.listingTitle}</Text>
          {!!item.listingArea && (
            <Text style={styles.cardArea}>{item.listingArea}</Text>
          )}
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="person-outline" size={16} color={COLORS.gray} />
          <Text style={styles.cardText}>{item.studentName}</Text>
        </View>
        {!!item.studentPhone && (
          <View style={styles.cardRow}>
            <Ionicons name="call-outline" size={16} color={COLORS.gray} />
            <Text style={styles.cardText}>{item.studentPhone}</Text>
          </View>
        )}
        <View style={styles.cardRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.gray} />
          <TextInput
            style={styles.dateInput}
            placeholder="Date de visite (ex: 12/03 à 15h)"
            placeholderTextColor={COLORS.gray}
            value={item.date}
            onChangeText={(value) => {
              setVisits(prev =>
                prev.map(v => (v.id === item.id ? { ...v, date: value } : v))
              );
            }}
          />
          <TouchableOpacity
            style={styles.saveDateButton}
            activeOpacity={0.8}
            disabled={updatingId === item.id}
            onPress={() => handleUpdateDate(item.id, item.date)}
          >
            <Text style={styles.saveDateText}>{updatingId === item.id ? '...' : 'OK'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: bg }]}>
            <Text style={[styles.statusText, { color: fg }]}>
              {statusLabel[item.status] || 'Statut inconnu'}
            </Text>
          </View>
          <View style={styles.actionsRow}>
            {(item.status === 'pending' || item.status === 'cancelled') && (
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.8}
                disabled={updatingId === item.id}
                onPress={() => handleUpdateStatus(item.id, 'confirmed')}
              >
                <Text style={styles.actionButtonText}>
                  {updatingId === item.id ? '...' : 'Confirmer'}
                </Text>
              </TouchableOpacity>
            )}
            {(item.status === 'pending' || item.status === 'confirmed') && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionDanger]}
                activeOpacity={0.8}
                disabled={updatingId === item.id}
                onPress={() => handleUpdateStatus(item.id, 'cancelled')}
              >
                <Text style={[styles.actionButtonText, styles.actionDangerText]}>
                  {updatingId === item.id ? '...' : 'Annuler'}
                </Text>
              </TouchableOpacity>
            )}
            {item.status === 'confirmed' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionSecondary]}
                activeOpacity={0.8}
                disabled={updatingId === item.id}
                onPress={() => handleUpdateStatus(item.id, 'done')}
              >
                <Text style={[styles.actionButtonText, styles.actionSecondaryText]}>
                  {updatingId === item.id ? '...' : 'Terminée'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, '#145242']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.9}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Visites</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.tabsRow}>
          {filterTabs.map(tab => {
            const active = selectedFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, active && styles.tabActive]}
                activeOpacity={0.9}
                onPress={() => setSelectedFilter(tab.key)}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
      <View style={styles.body}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Chargement des visites…</Text>
          </View>
        ) : filteredVisits.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={26} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>Aucune visite pour le moment</Text>
            <Text style={styles.emptyDesc}>
              Lorsque des étudiants demanderont une visite, elles apparaîtront ici.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredVisits}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  tabsRow: {
    marginTop: 18,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 999,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
  },
  tabLabel: { color: COLORS.secondary, fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: COLORS.primary },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  loadingBox: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { color: COLORS.gray, fontSize: 13 },
  empty: { marginTop: 32, alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.darkGray },
  emptyDesc: { fontSize: 13, color: COLORS.gray, textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.darkGray, flex: 1, marginRight: 8 },
  cardArea: { fontSize: 12, color: COLORS.gray },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  cardText: { fontSize: 13, color: COLORS.darkGray },
  cardFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    color: COLORS.darkGray,
    backgroundColor: '#FAFAFA',
  },
  saveDateButton: {
    marginLeft: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  saveDateText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F5F5F5',
  },
  actionButtonText: { fontSize: 12, fontWeight: '600', color: COLORS.darkGray },
  actionDanger: { backgroundColor: '#FFE8E8' },
  actionDangerText: { color: '#B3261E' },
  actionSecondary: { backgroundColor: '#E3EDFF' },
  actionSecondaryText: { color: '#223A9A' },
});

export default ManageVisitsScreen;
