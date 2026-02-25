import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, updateDoc } from 'firebase/firestore';

const ChatThreadScreen = ({ navigation, route }) => {
  const conversationId = route?.params?.conversationId;
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [headerTitle, setHeaderTitle] = React.useState('Conversation');

  React.useEffect(() => {
    if (!conversationId) return;
    const ref = doc(db, 'conversations', conversationId);
    (async () => {
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          const uid = auth.currentUser?.uid;
          const isStudent = data.studentId === uid;
          const title = isStudent
            ? `Bailleur - ${data.listingTitle || ''}`.trim()
            : `Étudiant - ${data.studentName || ''}`.trim();
          setHeaderTitle(title || 'Conversation');
        }
      } catch {}
    })();
  }, [conversationId]);

  React.useEffect(() => {
    if (!conversationId) return;
    const msgsRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(msgsRef, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(
      q,
      snap => {
        const uid = auth.currentUser?.uid;
        const items = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            text: data.text || '',
            senderId: data.senderId || '',
            createdAt: data.createdAt || null,
            mine: uid && data.senderId === uid,
          };
        });
        setMessages(items);
      },
      () => {
        setMessages([]);
      }
    );
    return () => unsub();
  }, [conversationId]);

  const handleSend = async () => {
    const text = input.trim();
    const uid = auth.currentUser?.uid;
    if (!conversationId || !uid || !text) return;
    try {
      setInput('');
      const msgsRef = collection(db, 'conversations', conversationId, 'messages');
      const payload = {
        text,
        senderId: uid,
        createdAt: new Date().toISOString(),
      };
      await addDoc(msgsRef, payload);
      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, {
        lastMessage: text,
        updatedAt: new Date().toISOString(),
        lastSenderId: uid,
      });
    } catch {}
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} activeOpacity={0.9} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.title}>{headerTitle}</Text>
        <View style={{ width: 22 }} />
      </View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubbleRow,
              item.mine ? styles.bubbleRowMine : styles.bubbleRowOther,
            ]}
          >
            <View
              style={[
                styles.bubble,
                item.mine ? styles.bubbleMine : styles.bubbleOther,
              ]}
            >
              <Text style={item.mine ? styles.bubbleTextMine : styles.bubbleTextOther}>
                {item.text}
              </Text>
            </View>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Écrire un message…"
          placeholderTextColor={COLORS.gray}
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.sendBtn} activeOpacity={0.9} onPress={handleSend}>
          <Ionicons name="send" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 40 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  back: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F7',
  },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.darkGray },
  list: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 80 },
  bubbleRow: { marginVertical: 4, flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowOther: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMine: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#F1F1F1',
    borderBottomLeftRadius: 4,
  },
  bubbleTextMine: { color: COLORS.white },
  bubbleTextOther: { color: COLORS.darkGray },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: COLORS.darkGray,
    marginRight: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
});

export default ChatThreadScreen;

