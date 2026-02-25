import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, FlatList, Animated, Image } from 'react-native';
import COLORS from '../../constants/colors';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, collection, getDocs, query, limit, setDoc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const StudentHomeScreen = ({ navigation }) => {
  const [displayName, setDisplayName] = React.useState(auth.currentUser?.displayName || '');
  const [email, setEmail] = React.useState(auth.currentUser?.email || '');
  const [search, setSearch] = React.useState('');
  const [listings, setListings] = React.useState([]);
  const [loadingListings, setLoadingListings] = React.useState(true);
  const [maxPrice, setMaxPrice] = React.useState(null);
  const [queryText, setQueryText] = React.useState('');
  const [favIds, setFavIds] = React.useState([]);
  const [selectedUniversity, setSelectedUniversity] = React.useState('UCAD');
  const [activeType, setActiveType] = React.useState(null);
  const universities = [
    'UCAD',
    'UGB',
    'UASZ',
    'UADB',
    'UVS',
    'ESP',
    'Sup de Co',
    'ISM',
    'IAM',
  ];
  const universityAreas = {
    UCAD: ['Fann', 'Point E'],
    UGB: ['Fann'],
    UASZ: ['Point E'],
    UADB: ['Fann'],
    UVS: ['Point E', 'Almadies'],
    ESP: ['Point E', 'Fann'],
    'Sup de Co': ['Almadies', 'Point E'],
    ISM: ['Point E', 'Almadies'],
    IAM: ['Point E'],
  };
  const distanceByArea = {
    'Fann': 1.2,
    'Point E': 2.0,
    'Almadies': 9.5,
  };

  const parsePrice = (str) => {
    if (!str) return null;
    const m = String(str).replace(/\s/g, '').match(/(\d+)/);
    return m ? Number(m[1]) : null;
  };

  const SkeletonCard = () => {
    const pulse = React.useRef(new Animated.Value(0.3)).current;
    React.useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }, []);
    return (
      <Animated.View style={[styles.listCard, { opacity: pulse }]}>
        <View style={styles.cardRow}>
          <View style={styles.cardImage} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ height: 12, backgroundColor: COLORS.lightGray, borderRadius: 6 }} />
            <View style={{ height: 10, backgroundColor: COLORS.lightGray, borderRadius: 6, width: '60%' }} />
          </View>
          <View style={styles.favButton} />
        </View>
      </Animated.View>
    );
  };

  React.useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.role === 'landlord') {
            navigation.replace('LandlordHome');
            return;
          }
          setDisplayName(data.fullName || auth.currentUser?.displayName || '');
          setEmail(data.email || auth.currentUser?.email || '');
        }
      } catch {}
    })();
  }, [navigation]);

  React.useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    (async () => {
      try {
        const favRef = collection(db, 'users', uid, 'favorites');
        const snap = await getDocs(favRef);
        const ids = snap.docs.map(d => d.id);
        setFavIds(ids);
      } catch {}
    })();
  }, []);
  React.useEffect(() => {
    (async () => {
      try {
        setLoadingListings(true);
        const q = query(collection(db, 'listings'), limit(10));
        const docsPromise = getDocs(q);
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('listings-timeout')), 3500));
        const snap = await Promise.race([docsPromise, timeout]);
        const items = snap?.docs?.map(d => ({ id: d.id, ...d.data() })) || [];
        if (items.length) {
          setListings(items.map(it => ({
            id: it.id,
            title: it.title || 'Logement',
            desc: it.desc || 'À proximité',
            price: it.price || '',
            area: it.area || '',
            type: it.type || null,
            images: Array.isArray(it.images) ? it.images : [],
            phone: it.phone || '',
            details: it.details || null,
          })));
        } else {
          setListings([
            { id: 's1', title: 'Studio à Fann', desc: 'Proche UCAD', price: '75 000 FCFA', area: 'Fann', type: 'Studio', images: [], phone: '', details: null },
            { id: 's2', title: 'Chambre à Point E', desc: 'Accès facile', price: '55 000 FCFA', area: 'Point E', type: 'Chambre', images: [], phone: '', details: null },
            { id: 's3', title: 'Studio aux Almadies', desc: 'Quartier calme', price: '95 000 FCFA', area: 'Almadies', type: 'Studio', images: [], phone: '', details: null },
          ]);
        }
      } catch {
        setListings([
          { id: 's1', title: 'Studio à Fann', desc: 'Proche UCAD', price: '75 000 FCFA', area: 'Fann', type: 'Studio', images: [], phone: '', details: null },
          { id: 's2', title: 'Chambre à Point E', desc: 'Accès facile', price: '55 000 FCFA', area: 'Point E', type: 'Chambre', images: [], phone: '', details: null },
          { id: 's3', title: 'Studio aux Almadies', desc: 'Quartier calme', price: '95 000 FCFA', area: 'Almadies', type: 'Studio', images: [], phone: '', details: null },
        ]);
      } finally {
        setLoadingListings(false);
      }
    })();
  }, []);
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch {}
  };

  const getTypeLabel = (item) => {
    const t = item.type;
    if (t === 'Chambre' || t === 'Studio' || t === 'Appartement') return t;
    const title = (item.title || '').toLowerCase();
    if (title.includes('studio')) return 'Studio';
    if (title.includes('chambre')) return 'Chambre';
    if (title.includes('appartement')) return 'Appartement';
    return 'Logement';
  };

  const getDetailsLabel = (item) => {
    const details = item.details || {};
    const t = getTypeLabel(item);
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
    <View style={styles.container}>
      <FlatList
        data={(listings || []).filter(it => {
          const title = (it.title || '').toLowerCase();
          const priceNum = parsePrice(it.price);
          const area = (it.area || '').toLowerCase();
          const typeLabel = (it.type || '').toLowerCase();
          const inferredType =
            title.includes('studio') ? 'studio' :
            title.includes('chambre') ? 'chambre' :
            title.includes('appartement') ? 'appartement' : '';
          const effectiveType = typeLabel || inferredType;
          const m = queryText.match(/≤\s*(\d+)/);
          const qMax = m ? Number(m[1]) : null;
          const priceLimit = maxPrice || qMax || null;
          const passPrice = !priceLimit || (!priceNum || priceNum <= priceLimit);
          const q = queryText.trim().toLowerCase();
          const passQuery = !q || title.includes(q) || area.includes(q);
          const passType = !activeType || effectiveType === activeType.toLowerCase();
          const campusAreas = universityAreas[selectedUniversity] || [];
          const dakarUniversities = ['UCAD', 'ESP', 'Sup de Co', 'ISM', 'IAM', 'UVS'];
          const isOutOfDakar = selectedUniversity && !dakarUniversities.includes(selectedUniversity);
          const passUniversity =
            !selectedUniversity ||
            isOutOfDakar ||
            !campusAreas.length ||
            campusAreas.map(a => a.toLowerCase()).includes(area);
          return passPrice && passQuery && passType && passUniversity;
        })}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cardLarge}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ListingDetail', {
              id: item.id,
              title: item.title,
              desc: item.desc,
              price: item.price,
              area: item.area,
              type: item.type,
              images: item.images,
              phone: item.phone,
              details: item.details,
            })}
          >
            <View style={styles.imageLarge}>
              {item.images && item.images.length > 0 && (
                <Image source={{ uri: item.images[0] }} style={styles.imageLargePhoto} />
              )}
              <View style={styles.badgeType}>
                <Ionicons name="home-outline" size={14} color={COLORS.primary} />
                <Text style={styles.badgeTypeText}>{getTypeLabel(item)}</Text>
              </View>
              <TouchableOpacity
                style={styles.heartOverlay}
                activeOpacity={0.7}
                onPress={async () => {
                  const uid = auth.currentUser?.uid;
                  if (!uid) return;
                  const isFav = favIds.includes(item.id);
                  try {
                    if (isFav) {
                      await deleteDoc(doc(db, 'users', uid, 'favorites', item.id));
                      setFavIds(prev => prev.filter(x => x !== item.id));
                    } else {
                      await setDoc(doc(db, 'users', uid, 'favorites', item.id), {
                        title: item.title, desc: item.desc, price: item.price, area: item.area,
                      });
                      setFavIds(prev => [...prev, item.id]);
                    }
                  } catch {}
                }}
              >
                <Ionicons name={favIds.includes(item.id) ? 'heart' : 'heart-outline'} size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardPrice}>{item.price ? `${item.price}/mois` : 'Prix à discuter'}</Text>
              </View>
              <View style={styles.cardMetaRow}>
                <Ionicons name="location-outline" size={14} color={COLORS.gray} />
                <Text style={styles.cardMeta}>{(item.area || '—')}</Text>
                <Text style={styles.dot}>•</Text>
                <Ionicons name="navigate-outline" size={14} color={COLORS.gray} />
                <Text style={styles.cardMeta}>{distanceByArea[(item.area || '').trim()] ? `${distanceByArea[(item.area || '').trim()]} km` : '— km'}</Text>
              </View>
              {getDetailsLabel(item) && (
                <View style={styles.cardMetaRow}>
                  <Ionicons name="information-circle-outline" size={14} color={COLORS.gray} />
                  <Text style={styles.cardMeta}>{getDetailsLabel(item)}</Text>
                </View>
              )}
              <View style={styles.cardFooter}>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FFD166" />
                  <Ionicons name="star" size={14} color="#FFD166" />
                  <Ionicons name="star" size={14} color="#FFD166" />
                  <Ionicons name="star-half" size={14} color="#FFD166" />
                  <Ionicons name="star-outline" size={14} color="#FFD166" />
                </View>
                <View style={styles.landlordAvatar}>
                  <Text style={styles.landlordLetter}>{(item.area || 'L').slice(0,1).toUpperCase()}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListHeaderComponent={() => (
          <View style={{ paddingBottom: 16 }}>
            <LinearGradient
              colors={[COLORS.secondary, COLORS.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <View>
                  <Text style={{ color: COLORS.white, fontSize: 13 }}>Bonjour</Text>
                  <Text style={{ color: COLORS.white, fontSize: 22, fontWeight: '700' }}>{displayName || 'Étudiant'}</Text>
                  <Text style={{ color: COLORS.secondary, marginTop: 4, fontSize: 13 }}>Trouve un logement proche de ton campus</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity activeOpacity={0.8} style={{ marginRight: 12 }}>
                    <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Profile')}
                  >
                    <Text style={{ color: COLORS.white, fontWeight: '700' }}>
                      {(displayName || 'E').slice(0,1).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  marginBottom: 14,
                }}
              >
                <Ionicons name="search-outline" size={16} color={COLORS.secondary} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Rechercher un quartier, un type, un prix…"
                  placeholderTextColor={COLORS.secondary}
                  style={{ flex: 1, color: COLORS.white, fontSize: 14 }}
                  value={queryText}
                  onChangeText={(t) => {
                    setQueryText(t);
                    const m = t.match(/≤\s*(\d+)/);
                    if (m) setMaxPrice(Number(m[1]));
                  }}
                />
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('Discover', { q: queryText || 'recommandes' })}
                  style={{ marginLeft: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: COLORS.white }}
                >
                  <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 12 }}>Filtres</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                {universities.map(u => (
                  <TouchableOpacity
                    key={u}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      marginRight: 8,
                      backgroundColor: selectedUniversity === u ? COLORS.white : 'rgba(255,255,255,0.08)',
                    }}
                    activeOpacity={0.9}
                    onPress={() => setSelectedUniversity(u)}
                  >
                    <Ionicons
                      name="school-outline"
                      size={16}
                      color={selectedUniversity === u ? COLORS.primary : COLORS.secondary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        color: selectedUniversity === u ? COLORS.primary : COLORS.secondary,
                        fontWeight: '700',
                        fontSize: 13,
                      }}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </LinearGradient>

            <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.darkGray }}>
                Logements autour de {selectedUniversity}
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.gray, marginTop: 4 }}>
                Choisis le type de logement puis ajuste ton budget et la distance.
              </Text>

              <View style={styles.typeRow}>
                {[
                  { key: 'Chambre', icon: 'bed-outline', label: 'Chambre' },
                  { key: 'Studio', icon: 'home-outline', label: 'Studio' },
                  { key: 'Appartement', icon: 'business-outline', label: 'Appartement' },
                ].map(t => {
                  const isActive = activeType === t.key;
                  return (
                    <TouchableOpacity
                      key={t.key}
                      style={[styles.typeChip, isActive && styles.typeChipActive]}
                      activeOpacity={0.9}
                      onPress={() => setActiveType(isActive ? null : t.key)}
                    >
                      <Ionicons
                        name={t.icon}
                        size={18}
                        color={isActive ? COLORS.white : COLORS.primary}
                      />
                      <Text
                        style={[
                          styles.typeChipLabel,
                          isActive && { color: COLORS.white },
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ marginTop: 12 }} />
            </View>

            {loadingListings && (
              <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
                <SkeletonCard />
                <SkeletonCard />
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aucun logement disponible pour le moment autour de cette université</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 0, paddingTop: 0 }}
      />
      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => navigation.navigate('Discover', { q: 'filtres-avances' })}>
        <Ionicons name="options-outline" size={22} color={COLORS.white} />
      </TouchableOpacity>
      <View style={styles.bottomNav}>
        <View style={styles.navItemActive}>
          <Ionicons name="home" size={20} color={COLORS.primary} />
          <Text style={styles.navLabelActive}>Accueil</Text>
        </View>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.9} onPress={() => navigation.navigate('Favorites')}>
          <Ionicons name="heart-outline" size={20} color={COLORS.darkGray} />
          <Text style={styles.navLabel}>Favoris</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.9} onPress={() => navigation.navigate('Messages')}>
          <Ionicons name="chatbubbles-outline" size={20} color={COLORS.darkGray} />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.9} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-outline" size={20} color={COLORS.darkGray} />
          <Text style={styles.navLabel}>Profil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 0, paddingTop: 60, paddingBottom: 90 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  brand: { fontSize: 18, fontWeight: '700', color: COLORS.darkGray },
  topActions: { flexDirection: 'row', alignItems: 'center' },
  avatarSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
  uniRow: { marginBottom: 12 },
  uniChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, marginRight: 8 },
  uniChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  uniChipText: { color: COLORS.primary, fontWeight: '700' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  header: { flex: 1, paddingRight: 12 },
  welcome: { fontSize: 28, fontWeight: 'bold', color: COLORS.darkGray },
  subtitle: { fontSize: 16, color: COLORS.gray, marginTop: 6 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
  avatarText: { color: COLORS.darkGray, fontWeight: '700' },
  
  searchBox: { backgroundColor: COLORS.white, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 12 },
  searchInput: { backgroundColor: COLORS.lightGray, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: COLORS.darkGray },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 6 },
  typeChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: 10, marginRight: 8, borderRadius: 999, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA' },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipLabel: { marginLeft: 6, color: COLORS.darkGray, fontWeight: '600', fontSize: 13 },
  chipsRow: { marginBottom: 12 },
  chip: { backgroundColor: COLORS.white, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#F0F0F0', marginRight: 8 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.darkGray, fontWeight: '600' },
  mapBox: { backgroundColor: COLORS.white, borderRadius: 0, borderWidth: 0, borderColor: 'transparent', overflow: 'hidden', marginBottom: 12 },
  mapHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  mapTitle: { color: COLORS.darkGray, fontWeight: '700' },
  mapBody: { height: 220, backgroundColor: '#E9F2FF' },
  mapMarker: { position: 'absolute', left: 14, top: 20, width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  mapPin: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: '#6C8EEA', alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginTop: 8 },
  tile: { width: '48%', backgroundColor: COLORS.white, borderRadius: 14, paddingVertical: 18, alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
  tileIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tileLabel: { color: COLORS.darkGray, fontWeight: '600' },
  sectionTitle: { marginTop: 16, marginBottom: 8, fontSize: 16, fontWeight: '700', color: COLORS.darkGray },
  sectionRow: { marginTop: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLink: { color: COLORS.primary, fontWeight: '700' },
  hScroll: { },
  hCard: { width: 160, backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0', marginRight: 10, padding: 10 },
  hImage: { height: 90, borderRadius: 8, backgroundColor: '#F2F6FF', marginBottom: 8 },
  hTitle: { fontWeight: '700', color: COLORS.darkGray },
  hMeta: { color: COLORS.gray, marginTop: 4 },
  guides: { flexDirection: 'row', justifyContent: 'space-between' },
  guideCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 10 },
  guideText: { color: COLORS.darkGray, fontWeight: '600' },
  topAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F2F6FF', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  topLetter: { color: COLORS.primary, fontWeight: '700' },
  listCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#F0F0F0', marginTop: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardImage: { width: 60, height: 60, borderRadius: 10, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.darkGray },
  cardMeta: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  favButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  cardLarge: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0', marginTop: 12, marginHorizontal: 20 },
  imageLarge: { height: 220, backgroundColor: COLORS.secondary, position: 'relative' },
  imageLargePhoto: { width: '100%', height: '100%' },
  badgeType: { position: 'absolute', left: 10, top: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#EDEDED' },
  badgeTypeText: { color: COLORS.darkGray, fontWeight: '600' },
  heartOverlay: { position: 'absolute', right: 10, top: 10, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  cardBody: { padding: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardPrice: { color: COLORS.primary, fontWeight: '700' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  dot: { color: COLORS.gray },
  cardFooter: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  landlordAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F2F6FF', alignItems: 'center', justifyContent: 'center' },
  landlordLetter: { color: COLORS.primary, fontWeight: '700' },
  fab: { position: 'absolute', right: 18, bottom: 74, width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 64, backgroundColor: COLORS.white, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EDEDED', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 6 },
  navItem: { alignItems: 'center' },
  navItemActive: { alignItems: 'center' },
  navLabel: { marginTop: 4, color: COLORS.darkGray, fontSize: 12 },
  navLabelActive: { marginTop: 4, color: COLORS.primary, fontSize: 12, fontWeight: '700' },
});

export default StudentHomeScreen;
