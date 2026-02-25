import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';

const ManageListingsScreen = ({ navigation }) => {
  const uid = auth.currentUser?.uid || null;
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState(null);

  const loadListings = React.useCallback(async () => {
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const q = query(collection(db, 'listings'), where('ownerId', '==', uid));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(docs);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  React.useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await deleteDoc(doc(db, 'listings', id));
      setItems(prev => prev.filter(it => it.id !== id));
    } catch {
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (id) => {
    Alert.alert(
      'Supprimer',
      'Supprimer ce logement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => handleDelete(id) },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.thumb}>
          {item.images && item.images.length > 0 ? (
            <Image source={{ uri: item.images[0] }} style={styles.thumbImage} />
          ) : (
            <Ionicons name="home-outline" size={20} color={COLORS.primary} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title || 'Logement'}</Text>
          <Text style={styles.meta}>
            {item.price ? `${item.price}/mois` : 'Prix à discuter'} • {(item.area || 'Quartier')}
          </Text>
        </View>
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('AddListing', { id: item.id, listing: item })}
        >
          <Ionicons name="create-outline" size={16} color={COLORS.primary} />
          <Text style={styles.editText}>Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          activeOpacity={0.9}
          onPress={() => confirmDelete(item.id)}
          disabled={deletingId === item.id}
        >
          {deletingId === item.id ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={16} color={COLORS.white} />
              <Text style={styles.deleteText}>Supprimer</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={[COLORS.secondary, COLORS.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.back}
            activeOpacity={0.9}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.darkGray} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes annonces</Text>
          <View style={{ width: 32 }} />
        </View>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="home-outline" size={26} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>Aucun logement publié</Text>
            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('AddListing')}
            >
              <Ionicons name="add-circle-outline" size={18} color={COLORS.white} />
              <Text style={styles.addText}>Ajouter un logement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  back: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.darkGray },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 15, color: COLORS.gray, marginTop: 8 },
  addButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    gap: 6,
  },
  addText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  list: { paddingTop: 8, paddingBottom: 12 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.darkGray },
  meta: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  editButton: {
    backgroundColor: '#F2F6FF',
  },
  deleteButton: {
    backgroundColor: '#D9534F',
  },
  editText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  deleteText: { color: COLORS.white, fontWeight: '600', fontSize: 13 },
});

export default ManageListingsScreen;
