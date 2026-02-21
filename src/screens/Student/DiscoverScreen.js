import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../../constants/colors';
import { db } from '../../config/firebase';
import { collection, getDocs, query, limit, startAfter } from 'firebase/firestore';

const DiscoverScreen = ({ navigation, route }) => {
  const [search, setSearch] = React.useState(route?.params?.q || '');
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [lastDoc, setLastDoc] = React.useState(null);

  const loadFirst = React.useCallback(async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'listings'), limit(20));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(docs.length ? docs : [
        { id: 'x1', title: 'Studio à Fann', desc: 'Proche UCAD', price: '75 000 FCFA', area: 'Fann' },
        { id: 'x2', title: 'Chambre à Point E', desc: 'Accès facile', price: '55 000 FCFA', area: 'Point E' },
        { id: 'x3', title: 'Studio aux Almadies', desc: 'Quartier calme', price: '95 000 FCFA', area: 'Almadies' },
      ]);
      setLastDoc(snap.docs.length ? snap.docs[snap.docs.length - 1] : null);
    } catch {
      setItems([
        { id: 'x1', title: 'Studio à Fann', desc: 'Proche UCAD', price: '75 000 FCFA', area: 'Fann' },
        { id: 'x2', title: 'Chambre à Point E', desc: 'Accès facile', price: '55 000 FCFA', area: 'Point E' },
        { id: 'x3', title: 'Studio aux Almadies', desc: 'Quartier calme', price: '95 000 FCFA', area: 'Almadies' },
      ]);
      setLastDoc(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = React.useCallback(async () => {
    if (!lastDoc || loadingMore) return;
    try {
      setLoadingMore(true);
      const q = query(collection(db, 'listings'), startAfter(lastDoc), limit(20));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(prev => [...prev, ...docs]);
      setLastDoc(snap.docs.length ? snap.docs[snap.docs.length - 1] : null);
    } catch {
    } finally {
      setLoadingMore(false);
    }
  }, [lastDoc, loadingMore]);

  React.useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  const filtered = items.filter(it =>
    [it.title, it.desc, it.area].join(' ').toLowerCase().includes(search.trim().toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => navigation.navigate('ListingDetail', { id: item.id, title: item.title, desc: item.desc, price: item.price, area: item.area })}>
      <View style={styles.thumb} />
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title || 'Logement'}</Text>
          <Text style={styles.desc}>{item.desc || 'À proximité'}</Text>
        </View>
        <Text style={styles.price}>{item.price ? item.price : ''}</Text>
      </View>
      {!!item.area && <Text style={styles.area}>{item.area}</Text>}
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={[COLORS.secondary, COLORS.primary]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.header}>Découvrir</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.search}
            placeholder="Rechercher par quartier, type, prix…"
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {loading ? (
          <View style={styles.loader}><ActivityIndicator color={COLORS.primary} /></View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={loadingMore ? <ActivityIndicator color={COLORS.primary} /> : null}
          />
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  header: { fontSize: 28, fontWeight: 'bold', color: COLORS.darkGray, marginBottom: 12 },
  searchRow: { backgroundColor: COLORS.white, borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  search: { backgroundColor: COLORS.lightGray, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: COLORS.darkGray },
  list: { paddingTop: 6, paddingBottom: 12 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  thumb: { height: 140, borderRadius: 10, backgroundColor: COLORS.secondary, marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.darkGray },
  desc: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  price: { color: COLORS.primary, fontWeight: '700', marginLeft: 8 },
  area: { fontSize: 13, color: COLORS.gray, marginTop: 6 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default DiscoverScreen;
