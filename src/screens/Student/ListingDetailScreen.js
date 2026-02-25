import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../../constants/colors';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs, setDoc } from 'firebase/firestore';

const ListingDetailScreen = ({ navigation, route }) => {
  const [data, setData] = React.useState({
    title: route?.params?.title || 'Logement',
    desc: route?.params?.desc || 'À proximité',
    price: route?.params?.price || '',
    area: route?.params?.area || '',
    type: route?.params?.type || '',
    phone: route?.params?.phone || '',
    details: route?.params?.details || null,
    ownerId: route?.params?.ownerId || '',
  });
  const [visit, setVisit] = React.useState(null);
  const [visitLoading, setVisitLoading] = React.useState(false);
  const [requesting, setRequesting] = React.useState(false);
  const [requestError, setRequestError] = React.useState('');
  const [chatLoading, setChatLoading] = React.useState(false);

  React.useEffect(() => {
    const id = route?.params?.id;
    if (!id) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'listings', id));
        if (snap.exists()) {
          const d = snap.data();
          setData(prev => ({
            title: d.title || prev.title,
            desc: d.desc || prev.desc,
            price: d.price || prev.price,
            area: d.area || prev.area,
            type: d.type || prev.type,
            phone: d.phone || prev.phone,
            details: d.details || prev.details,
            ownerId: d.ownerId || prev.ownerId,
          }));
        }
      } catch {}
    })();
  }, []);

  React.useEffect(() => {
    const listingId = route?.params?.id;
    const studentId = auth.currentUser?.uid;
    if (!listingId || !studentId) return;
    (async () => {
      try {
        setVisitLoading(true);
        const q = query(
          collection(db, 'visits'),
          where('listingId', '==', listingId),
          where('studentId', '==', studentId)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          setVisit({ id: d.id, ...d.data() });
        } else {
          setVisit(null);
        }
      } catch {
        setVisit(null);
      } finally {
        setVisitLoading(false);
      }
    })();
  }, []);

  const handleRequestVisit = async () => {
    const listingId = route?.params?.id;
    const studentId = auth.currentUser?.uid;
    if (!listingId || !studentId) {
      setRequestError("Connexion requise pour demander une visite");
      return;
    }
    if (visit && visit.status !== 'cancelled') return;
    try {
      setRequestError('');
      setRequesting(true);
      let studentName = auth.currentUser?.displayName || '';
      let studentPhone = '';
      try {
        const userSnap = await getDoc(doc(db, 'users', studentId));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (!studentName) {
            studentName = userData.fullName || '';
          }
          studentPhone = userData.phone || '';
        }
      } catch {}
      const payload = {
        listingId,
        listingTitle: data.title,
        listingArea: data.area,
        landlordId: data.ownerId || '',
        studentId,
        studentName,
        studentPhone,
        date: '',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      const ref = await addDoc(collection(db, 'visits'), payload);
      setVisit({ id: ref.id, ...payload });
    } catch (e) {
      let msg = "Impossible d'envoyer la demande de visite";
      if (e?.code === 'permission-denied') {
        msg = "Autorisation refusée pour les demandes de visite, vérifiez les règles Firestore";
      } else if (e?.code === 'unavailable' || e?.code === 'failed-precondition') {
        msg = "Problème de connexion, réessayez dans quelques instants";
      }
      setRequestError(msg);
    } finally {
      setRequesting(false);
    }
  };

  const handleOpenChat = async () => {
    const listingId = route?.params?.id;
    const studentId = auth.currentUser?.uid;
    if (!listingId || !studentId || !data.ownerId) return;
    try {
      setChatLoading(true);
      let studentName = auth.currentUser?.displayName || '';
      let landlordName = '';
      try {
        const studentSnap = await getDoc(doc(db, 'users', studentId));
        if (studentSnap.exists()) {
          const sData = studentSnap.data();
          if (!studentName) {
            studentName = sData.fullName || '';
          }
        }
        const landlordSnap = await getDoc(doc(db, 'users', data.ownerId));
        if (landlordSnap.exists()) {
          const lData = landlordSnap.data();
          landlordName = lData.fullName || '';
        }
      } catch {}
      const convId = `${listingId}_${studentId}_${data.ownerId}`;
      const convRef = doc(db, 'conversations', convId);
      const existing = await getDoc(convRef);
      if (!existing.exists()) {
        const payload = {
          listingId,
          listingTitle: data.title,
          studentId,
          landlordId: data.ownerId,
          studentName,
          landlordName,
          participants: [studentId, data.ownerId],
          lastMessage: '',
          updatedAt: new Date().toISOString(),
        };
        await setDoc(convRef, payload);
      }
      navigation.navigate('ChatThread', { conversationId: convId });
    } catch {
    } finally {
      setChatLoading(false);
    }
  };

  const getDetailsLabel = () => {
    const details = data.details || {};
    const t = data.type;
    if (t === 'Chambre') {
      const c = details.chambre || {};
      const parts = [];
      if (c.bathroomPrivate) parts.push('Salle de bain privée');
      if (c.toiletShared) parts.push('Toilette partagée');
      if (c.kitchenAccess) parts.push('Accès cuisine');
      return parts.join(' • ') || null;
    }
    if (t === 'Studio') {
      const s = details.studio || {};
      if (s.config === 'une_piece_sdb') return '1 pièce avec salle de bain';
      if (s.config === 'deux_pieces_sdb') return '2 pièces avec salle de bain';
      return null;
    }
    if (t === 'Appartement') {
      const a = details.appartement || {};
      if (a.bedrooms) {
        const n = String(a.bedrooms);
        return `${n} chambre${n === '1' ? '' : 's'}`;
      }
      return null;
    }
    return null;
  };

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
          {!!data.type && <Text style={styles.type}>{data.type}</Text>}
          {getDetailsLabel() && <Text style={styles.details}>{getDetailsLabel()}</Text>}
          {!!data.phone && <Text style={styles.phone}>Téléphone : {data.phone}</Text>}
        </View>
        <TouchableOpacity
          style={[styles.cta, !data.phone && { opacity: 0.6 }]}
          activeOpacity={0.9}
          onPress={() => {
            if (!data.phone) return;
            Linking.openURL(`tel:${data.phone}`);
          }}
        >
          <Text style={styles.ctaText}>{data.phone ? 'Appeler le bailleur' : 'Contacter'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cta, (!auth.currentUser || !data.ownerId) && { opacity: 0.6 }]}
          activeOpacity={0.9}
          onPress={handleOpenChat}
          disabled={chatLoading || !auth.currentUser || !data.ownerId}
        >
          <Text style={styles.ctaText}>
            {chatLoading ? 'Ouverture...' : 'Envoyer un message'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.cta,
            (visit && visit.status !== 'cancelled') && { opacity: 0.6 },
          ]}
          activeOpacity={0.9}
          onPress={handleRequestVisit}
          disabled={
            requesting ||
            visitLoading ||
            (visit && visit.status !== 'cancelled')
          }
        >
          <Text style={styles.ctaText}>
            {visitLoading
              ? 'Chargement...'
              : requesting
              ? 'Envoi...'
              : visit && visit.status !== 'cancelled'
              ? 'Demande déjà envoyée'
              : 'Demander une visite'}
          </Text>
        </TouchableOpacity>
        {visit && (
          <View style={styles.visitBox}>
            <Text style={styles.visitTitle}>Visite</Text>
            {!!visit.date && (
              <Text style={styles.visitDate}>Date de visite : {visit.date}</Text>
            )}
            <Text style={styles.visitStatus}>
              {visit.status === 'pending' &&
                (visit.date
                  ? "Demande envoyée, en attente de confirmation définitive du bailleur"
                  : "Demande envoyée, en attente de confirmation du bailleur")}
              {visit.status === 'confirmed' &&
                (visit.date
                  ? "Visite confirmée"
                  : "Visite confirmée, date à préciser")}
              {visit.status === 'done' &&
                (visit.date
                  ? "Visite effectuée"
                  : "Visite terminée")}
              {visit.status === 'cancelled' && "Visite annulée par le bailleur"}
            </Text>
          </View>
        )}
        {!visit && !!requestError && (
          <Text style={styles.error}>{requestError}</Text>
        )}
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
  type: { fontSize: 13, color: COLORS.darkGray, marginTop: 8 },
  details: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  phone: { fontSize: 15, color: COLORS.darkGray, marginTop: 10, fontWeight: '600' },
  cta: { backgroundColor: COLORS.primary, borderRadius: 12, alignItems: 'center', paddingVertical: 14, marginTop: 14 },
  ctaText: { color: COLORS.white, fontWeight: 'bold' },
  visitBox: {
    marginTop: 16,
    backgroundColor: '#F5F7FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E6FF',
  },
  visitTitle: { fontSize: 13, fontWeight: '700', color: COLORS.darkGray, marginBottom: 4 },
  visitDate: { fontSize: 13, color: COLORS.darkGray, marginBottom: 4 },
  visitStatus: { fontSize: 13, color: COLORS.gray },
  error: { marginTop: 10, color: COLORS.error, textAlign: 'center', fontSize: 13 },
});

export default ListingDetailScreen;
