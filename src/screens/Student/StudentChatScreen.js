import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';
import { auth, db } from '../../config/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

const StudentChatScreen = ({ navigation }) => {
  const [convs, setConvs] = React.useState([]);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const q = queryRef(uid);
    const unsub = onSnapshot(
      q,
      snap => {
        const items = snap.docs.map(d => {
          const data = d.data();
          const isStudent = data.studentId === uid;
          const title = isStudent
            ? `Bailleur - ${data.listingTitle || ''}`.trim()
            : `Étudiant - ${data.studentName || ''}`.trim();
          return {
            id: d.id,
            title,
            last: data.lastMessage || '',
            updatedAt: data.updatedAt || null,
          };
        });
        setConvs(items);
      },
      () => {
        setConvs([]);
      }
    );
    return () => unsub();
  }, []);

  const queryRef = (uid) => {
    const base = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', uid)
    );
    try {
      return query(base, orderBy('updatedAt', 'desc'));
    } catch {
      return base;
    }
  };

  const filtered = convs.filter(
    c =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.last.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} activeOpacity={0.9} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <View style={{ width: 22 }} />
      </View>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={16} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une conversation…"
          placeholderTextColor={COLORS.gray}
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity style={styles.newBtn} activeOpacity={0.9}>
          <Ionicons name="add-outline" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={26} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>Aucune conversation</Text>
          <Text style={styles.emptyDesc}>Contactez un bailleur pour démarrer une conversation</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.conv}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('ChatThread', { conversationId: item.id })}
            >
              <View style={styles.convIcon}>
                <Ionicons name="person-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.convTitle}>{item.title}</Text>
                <Text style={styles.convLast}>{item.last}</Text>
              </View>
              <Text style={styles.convTime}>{item.updatedAt ? '' : ''}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 40 },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  back: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F7F7' },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.darkGray },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 14, backgroundColor: '#F7F7F7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, color: COLORS.darkGray },
  newBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.darkGray },
  emptyDesc: { textAlign: 'center', color: COLORS.gray },
  conv: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F3F3' },
  convIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F2F6FF', alignItems: 'center', justifyContent: 'center' },
  convTitle: { fontSize: 15, fontWeight: '700', color: COLORS.darkGray },
  convLast: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  convTime: { fontSize: 12, color: COLORS.gray },
});

export default StudentChatScreen;
