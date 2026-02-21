import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import COLORS from '../../constants/colors';
import { auth, db, storage } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AddListingScreen = ({ navigation }) => {
  const uid = auth.currentUser?.uid || null;
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [type, setType] = useState('Studio');
  const [images, setImages] = useState([]);
  const [phone, setPhone] = useState('');
  const [bathroomPrivate, setBathroomPrivate] = useState(false);
  const [toiletShared, setToiletShared] = useState(false);
  const [kitchenAccess, setKitchenAccess] = useState(false);
  const [studioConfig, setStudioConfig] = useState('');
  const [aptBedrooms, setAptBedrooms] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.7,
    });
    if (result.canceled || !result.assets || !result.assets.length) return;
    const uri = result.assets[0].uri;
    setImages(prev => [...prev, uri]);
  };

  const uploadImageAsync = async (uri, owner) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const imageRef = ref(storage, `listings/${owner}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);
    await uploadBytes(imageRef, blob);
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  };

  const handleSave = async () => {
    if (!uid) {
      setError("Connexion requise");
      return;
    }
    if (!title.trim()) {
      setError("Titre requis");
      return;
    }
    if (!price.trim()) {
      setError("Prix requis");
      return;
    }
    if (!area.trim()) {
      setError("Quartier requis");
      return;
    }
    if (!phone.trim()) {
      setError("Numéro de téléphone requis");
      return;
    }
    if (type === 'Studio' && !studioConfig) {
      setError("Précisez la configuration du studio");
      return;
    }
    if (type === 'Appartement' && !aptBedrooms.trim()) {
      setError("Indiquez le nombre de chambres");
      return;
    }
    try {
      setError('');
      setSaving(true);
      let uploaded = [];
      for (const uri of images) {
        const url = await uploadImageAsync(uri, uid);
        uploaded.push(url);
      }
      const payload = {
        ownerId: uid,
        title: title.trim(),
        desc: desc.trim(),
        price: price.trim(),
        area: area.trim(),
        type,
        createdAt: new Date().toISOString(),
        images: uploaded,
        phone: phone.trim(),
        details: {
          chambre: {
            bathroomPrivate,
            toiletShared,
            kitchenAccess,
          },
          studio: {
            config: studioConfig || null,
          },
          appartement: {
            bedrooms: aptBedrooms.trim() || null,
          },
        },
      };
      await addDoc(collection(db, 'listings'), payload);
      navigation.goBack();
    } catch (e) {
      setError("Impossible d’enregistrer le logement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.secondary, COLORS.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.back}
                activeOpacity={0.9}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back" size={22} color={COLORS.darkGray} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Ajouter un logement</Text>
              <View style={{ width: 32 }} />
            </View>

            <View style={styles.card}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <Text style={styles.label}>Titre de l’annonce</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Studio à Fann, Chambre à Point E…"
                  placeholderTextColor="#999"
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={styles.label}>Type de logement</Text>
                <View style={styles.typeRow}>
                  {['Chambre', 'Studio', 'Appartement'].map(t => {
                    const isActive = type === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[styles.typeChip, isActive && styles.typeChipActive]}
                        activeOpacity={0.9}
                        onPress={() => setType(t)}
                      >
                        <Text
                          style={[
                            styles.typeChipText,
                            isActive && { color: COLORS.white },
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {type === 'Chambre' && (
                  <>
                    <Text style={styles.label}>Détails de la chambre</Text>
                    <View style={styles.optionRow}>
                      <TouchableOpacity
                        style={[styles.optionChip, bathroomPrivate && styles.optionChipActive]}
                        activeOpacity={0.9}
                        onPress={() => setBathroomPrivate(prev => !prev)}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            bathroomPrivate && { color: COLORS.white },
                          ]}
                        >
                          Salle de bain privée
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.optionChip, toiletShared && styles.optionChipActive]}
                        activeOpacity={0.9}
                        onPress={() => setToiletShared(prev => !prev)}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            toiletShared && { color: COLORS.white },
                          ]}
                        >
                          Toilette partagée
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.optionChip, kitchenAccess && styles.optionChipActive]}
                        activeOpacity={0.9}
                        onPress={() => setKitchenAccess(prev => !prev)}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            kitchenAccess && { color: COLORS.white },
                          ]}
                        >
                          Accès cuisine
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {type === 'Studio' && (
                  <>
                    <Text style={styles.label}>Configuration du studio</Text>
                    <View style={styles.typeRow}>
                      {[
                        { key: 'une_piece_sdb', label: 'Une pièce + salle de bain' },
                        { key: 'deux_pieces_sdb', label: 'Deux pièces + salle de bain' },
                      ].map(opt => {
                        const isActive = studioConfig === opt.key;
                        return (
                          <TouchableOpacity
                            key={opt.key}
                            style={[styles.typeChip, isActive && styles.typeChipActive]}
                            activeOpacity={0.9}
                            onPress={() => setStudioConfig(opt.key)}
                          >
                            <Text
                              style={[
                                styles.typeChipText,
                                isActive && { color: COLORS.white },
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

                {type === 'Appartement' && (
                  <>
                    <Text style={styles.label}>Nombre de chambres</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 2"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      value={aptBedrooms}
                      onChangeText={setAptBedrooms}
                    />
                  </>
                )}

                <Text style={styles.label}>Prix mensuel</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 75 000 FCFA"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />

                <Text style={styles.label}>Quartier</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Fann, Point E, Almadies…"
                  placeholderTextColor="#999"
                  value={area}
                  onChangeText={setArea}
                />

                <Text style={styles.label}>Numéro de téléphone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Numéro pour appel ou WhatsApp"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />

                <Text style={styles.label}>Photos du logement</Text>
                <View style={styles.photosRow}>
                  {images.map(uri => (
                    <Image key={uri} source={{ uri }} style={styles.photo} />
                  ))}
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    activeOpacity={0.9}
                    onPress={handlePickImage}
                  >
                    <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.addPhotoText}>Ajouter une photo</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Décrivez brièvement le logement, les avantages, la proximité…"
                  placeholderTextColor="#999"
                  value={desc}
                  onChangeText={setDesc}
                  multiline
                />

                {!!error && <Text style={styles.error}>{error}</Text>}

                <TouchableOpacity
                  style={[styles.saveButton, saving && { opacity: 0.7 }]}
                  activeOpacity={0.9}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.saveText}>
                    {saving ? "Enregistrement..." : "Publier le logement"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
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
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: { marginTop: 10, marginBottom: 6, color: COLORS.darkGray, fontWeight: '600', fontSize: 13 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.darkGray,
    backgroundColor: '#FAFAFA',
  },
  textarea: { height: 100, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { color: COLORS.darkGray, fontWeight: '600', fontSize: 13 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  optionChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionChipText: { color: COLORS.darkGray, fontWeight: '600', fontSize: 13 },
  photosRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  photo: { width: 70, height: 70, borderRadius: 12 },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    gap: 6,
  },
  addPhotoText: { color: COLORS.darkGray, fontWeight: '600', fontSize: 13 },
  error: { marginTop: 10, color: COLORS.error, textAlign: 'center' },
  saveButton: {
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingVertical: 14,
  },
  saveText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});

export default AddListingScreen;
