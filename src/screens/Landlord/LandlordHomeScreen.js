import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs, limit, onSnapshot } from 'firebase/firestore';

const LandlordHomeScreen = ({ navigation }) => {
  const uid = auth.currentUser?.uid || null;
  const [fullName, setFullName] = React.useState(auth.currentUser?.displayName || '');
  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [visitCount, setVisitCount] = React.useState(0);

  React.useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const q = query(collection(db, 'listings'), where('ownerId', '==', uid), limit(10));
        const snap = await getDocs(q);
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setListings(items);
      } catch {
        setListings([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  React.useEffect(() => {
    if (!uid) {
      setVisitCount(0);
      return;
    }
    const q = query(collection(db, 'visits'), where('landlordId', '==', uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setVisitCount(0);
        } else {
          let count = 0;
          snap.forEach(d => {
            const status = d.data().status || 'pending';
            if (status === 'pending' || status === 'confirmed') {
              count += 1;
            }
          });
          setVisitCount(count);
        }
      },
      () => {
        setVisitCount(0);
      }
    );
    return () => unsubscribe();
  }, [uid]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('ManageListings')}
    >
      <View style={styles.cardRow}>
        <View style={styles.thumb}>
          {item.images && item.images.length > 0 ? (
            <Image source={{ uri: item.images[0] }} style={styles.thumbImage} />
          ) : (
            <Ionicons name="home-outline" size={20} color={COLORS.primary} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.title || 'Logement'}</Text>
          <Text style={styles.cardMeta}>
            {item.price ? `${item.price}/mois` : 'Prix non défini'} • {(item.area || 'Quartier')}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Actif</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, '#145242']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcome}>Bonjour</Text>
            <Text style={styles.name}>{fullName || 'Bailleur'}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileLetter}>
              {(fullName || 'B').slice(0, 1).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerBottom}>
          <View style={styles.kpi}>
            <Text style={styles.kpiValue}>{listings.length}</Text>
            <Text style={styles.kpiLabel}>Logements</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiValue}>{visitCount}</Text>
            <Text style={styles.kpiLabel}>Visites</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiValue}>0</Text>
            <Text style={styles.kpiLabel}>Messages</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('AddListing')}
        >
          <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
          <Text style={styles.actionTextPrimary}>Ajouter un logement</Text>
        </TouchableOpacity>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionSecondary}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ManageListings')}
          >
            <Ionicons name="albums-outline" size={18} color={COLORS.primary} />
            <Text style={styles.actionTextSecondary}>Mes annonces</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionSecondary}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ManageVisits')}
          >
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
            <Text style={styles.actionTextSecondary}>Visites</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionSecondary}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('LandlordChat')}
          >
            <Ionicons name="chatbubbles-outline" size={18} color={COLORS.primary} />
            <Text style={styles.actionTextSecondary}>Messages</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Vos derniers logements</Text>
          {listings.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ManageListings')}
            >
              <Text style={styles.listLink}>Tout voir</Text>
            </TouchableOpacity>
          )}
        </View>
        {loading ? (
          <Text style={styles.loading}>Chargement…</Text>
        ) : listings.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="home-outline" size={26} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>Aucun logement publié</Text>
            <Text style={styles.emptyDesc}>
              Utilisez le bouton “Ajouter un logement” pour publier votre première annonce.
            </Text>
          </View>
        ) : (
          <FlatList
            data={listings}
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
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  welcome: { color: COLORS.secondary, fontSize: 13 },
  name: { color: COLORS.white, fontSize: 22, fontWeight: '700', marginTop: 4 },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileLetter: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  headerBottom: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpi: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginRight: 10,
    paddingHorizontal: 10,
  },
  kpiValue: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  kpiLabel: { color: COLORS.secondary, fontSize: 12, marginTop: 4 },
  actions: { paddingHorizontal: 20, paddingTop: 16 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
  },
  actionTextPrimary: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  actionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    gap: 6,
  },
  actionTextSecondary: { color: COLORS.darkGray, fontWeight: '600', fontSize: 13 },
  listContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listTitle: { fontSize: 16, fontWeight: '700', color: COLORS.darkGray },
  listLink: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  loading: { marginTop: 16, color: COLORS.gray },
  empty: { marginTop: 24, alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.darkGray },
  emptyDesc: { fontSize: 13, color: COLORS.gray, textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 12,
    marginTop: 10,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.darkGray },
  cardMeta: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E6F4F1',
  },
  statusText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
});

export default LandlordHomeScreen;
