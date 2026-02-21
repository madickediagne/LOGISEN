import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';

const mockConversations = [
  { id: 'c1', title: 'Bailleur - Studio Fann', last: 'Bonjour, le studio est disponible', time: '10:24' },
  { id: 'c2', title: 'Agence - Chambre Point E', last: 'Visite possible samedi ?', time: 'Hier' },
];

const StudentChatScreen = ({ navigation }) => {
  const [convs, setConvs] = React.useState(mockConversations);
  const [query, setQuery] = React.useState('');

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
      {convs.filter(c => c.title.toLowerCase().includes(query.toLowerCase()) || c.last.toLowerCase().includes(query.toLowerCase())).length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={26} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>Aucune conversation</Text>
          <Text style={styles.emptyDesc}>Contactez un bailleur pour démarrer une conversation</Text>
        </View>
      ) : (
        <FlatList
          data={convs.filter(c => c.title.toLowerCase().includes(query.toLowerCase()) || c.last.toLowerCase().includes(query.toLowerCase()))}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.conv} activeOpacity={0.9}>
              <View style={styles.convIcon}>
                <Ionicons name="person-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.convTitle}>{item.title}</Text>
                <Text style={styles.convLast}>{item.last}</Text>
              </View>
              <Text style={styles.convTime}>{item.time}</Text>
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
