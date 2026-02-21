import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../../constants/colors';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const ListingDetailScreen = ({ navigation, route }) => {
  const [data, setData] = React.useState({
    title: route?.params?.title || 'Logement',
    desc: route?.params?.desc || 'À proximité',
    price: route?.params?.price || '',
    area: route?.params?.area || '',
  });

  React.useEffect(() => {
    const id = route?.params?.id;
    if (!id) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'listings', id));
        if (snap.exists()) {
          const d = snap.data();
          setData({
            title: d.title || data.title,
            desc: d.desc || data.desc,
            price: d.price || data.price,
            area: d.area || data.area,
          });
        }
      } catch {}
    })();
  }, []);

  return (
    <LinearGradient colors={[COLORS.secondary, COLORS.primary]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
      <View style={styles.inner}>
        <TouchableOpacity style={styles.back} activeOpacity={0.9} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.hero} />
        <View style={styles.card}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.desc}>{data.desc}</Text>
          {!!data.area && <Text style={styles.area}>{data.area}</Text>}
          {!!data.price && <Text style={styles.price}>{data.price}/mois</Text>}
        </View>
        <TouchableOpacity style={styles.cta} activeOpacity={0.9}>
          <Text style={styles.ctaText}>Contacter</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  backText: { fontSize: 24, color: COLORS.darkGray },
  hero: { height: 220, backgroundColor: COLORS.secondary, borderRadius: 16, marginBottom: 14 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.darkGray },
  desc: { fontSize: 14, color: COLORS.gray, marginTop: 6 },
  area: { fontSize: 13, color: COLORS.gray, marginTop: 6 },
  price: { fontSize: 16, color: COLORS.primary, fontWeight: '700', marginTop: 10 },
  cta: { backgroundColor: COLORS.primary, borderRadius: 12, alignItems: 'center', paddingVertical: 14, marginTop: 14 },
  ctaText: { color: COLORS.white, fontWeight: 'bold' },
});

export default ListingDetailScreen;
