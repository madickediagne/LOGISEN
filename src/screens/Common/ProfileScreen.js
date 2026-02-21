import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import COLORS from '../../constants/colors';

const ProfileScreen = ({ navigation }) => {
  const uid = auth.currentUser?.uid || null;
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState(auth.currentUser?.email || '');
  const [city, setCity] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const data = snap.data();
          setFullName(data.fullName || '');
          setCity(data.city || '');
        }
      } catch {}
    })();
  }, [uid]);

  const saveProfile = async () => {
    if (!uid) return;
    try {
      setSaving(true);
      await updateDoc(doc(db, 'users', uid), { fullName, city, email });
      navigation.goBack();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} activeOpacity={0.9} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.darkGray} />
        </TouchableOpacity>
        <Text style={styles.title}>Profil</Text>
        <View style={{ width: 22 }} />
      </View>
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{(fullName || 'E').slice(0,1).toUpperCase()}</Text>
        </View>
        <View style={styles.topText}>
          <Text style={styles.name}>{fullName || 'Étudiant'}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <View style={styles.form}>
          <Text style={styles.label}>Nom complet</Text>
          <TextInput value={fullName} onChangeText={setFullName} placeholder="Votre nom" placeholderTextColor={COLORS.gray} style={styles.input} />
          <Text style={styles.label}>Email</Text>
          <TextInput value={email} editable={false} style={[styles.input, { backgroundColor: '#F7F7F7' }]} />
          <Text style={styles.label}>Ville</Text>
          <TextInput value={city} onChangeText={setCity} placeholder="Votre ville" placeholderTextColor={COLORS.gray} style={styles.input} />
          <TouchableOpacity style={styles.save} activeOpacity={0.9} onPress={saveProfile} disabled={saving}>
            <Text style={styles.saveText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Préférences</Text>
        <View style={styles.prefRow}>
          <Ionicons name="notifications-outline" size={18} color={COLORS.darkGray} />
          <Text style={styles.prefLabel}>Notifications</Text>
          <Text style={styles.prefValue}>Activées</Text>
        </View>
        <View style={styles.prefRow}>
          <Ionicons name="language-outline" size={18} color={COLORS.darkGray} />
          <Text style={styles.prefLabel}>Langue</Text>
          <Text style={styles.prefValue}>Français</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.logout} activeOpacity={0.9} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.white} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  back: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F7F7' },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.darkGray },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F2F6FF', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  topText: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: COLORS.darkGray },
  email: { color: COLORS.gray, marginTop: 4 },
  section: { paddingHorizontal: 20, paddingBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.darkGray, marginBottom: 8 },
  form: { backgroundColor: '#fff' },
  label: { color: COLORS.gray, marginTop: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EFEFEF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.darkGray, marginTop: 6 },
  save: { marginTop: 16, backgroundColor: COLORS.primary, borderRadius: 12, alignItems: 'center', paddingVertical: 12 },
  saveText: { color: COLORS.white, fontWeight: '700' },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  prefLabel: { color: COLORS.darkGray, fontWeight: '600' },
  prefValue: { color: COLORS.gray },
  logout: { position: 'absolute', left: 20, right: 20, bottom: 20, backgroundColor: COLORS.primary, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  logoutText: { color: COLORS.white, fontWeight: '700' },
});

export default ProfileScreen;
