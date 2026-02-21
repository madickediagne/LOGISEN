import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../config/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import COLORS from '../../constants/colors';

const FavoritesScreen = ({ navigation }) => {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const loadFavorites = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      setLoading(true);
      const favRef = collection(db, 'users', uid, 'favorites');
      const snap = await getDocs(favRef);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { loadFavorites(); }, []);

  const removeFavorite = async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await deleteDoc(doc(db, 'users', uid, 'favorites', id));
      setItems(prev => prev.filter(x => x.id !== id));
    } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} activeOpacity={0.9} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.title}>Favoris</Text>
        <View style={{ width: 22 }} />
      </View>
      {loading ? (
        <Text style={styles.loading}>Chargement…</Text>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={26} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>Aucun favori</Text>
          <Text style={styles.emptyDesc}>Ajoutez des logements à vos favoris pour les retrouver ici</Text>
          <TouchableOpacity style={styles.cta} activeOpacity={0.9} onPress={() => navigation.navigate('Discover')}>
            <Text style={styles.ctaText}>Explorer des logements</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => navigation.navigate('ListingDetail', { id: item.id, title: item.title, desc: item.desc, price: item.price, area: item.area })}>
              <View style={styles.cardRow}>
                <View style={styles.cardImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.title || 'Logement'}</Text>
                  <Text style={styles.cardMeta}>{item.price ? `${item.price}/mois` : 'Prix à discuter'} • {(item.area || '—')}</Text>
                </View>
                <TouchableOpacity style={styles.remove} activeOpacity={0.7} onPress={() => removeFavorite(item.id)}>
                  <Ionicons name="heart-dislike-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  back: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F7F7' },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.darkGray },
  loading: { padding: 20, color: COLORS.gray },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.darkGray },
  emptyDesc: { textAlign: 'center', color: COLORS.gray },
  cta: { marginTop: 10, backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  ctaText: { color: COLORS.white, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EFEFEF', borderRadius: 14, padding: 12, marginTop: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardImage: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#F2F6FF' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.darkGray },
  cardMeta: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  remove: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F7F7' },
});

export default FavoritesScreen;
