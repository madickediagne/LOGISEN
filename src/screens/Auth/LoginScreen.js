import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../../constants/colors';
import { auth, db } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
 
  const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);
 
  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!validateEmail(trimmedEmail)) {
      setError("Email invalide");
      return;
    }
    if (!password || password.length < 6) {
      setError("Mot de passe trop court");
      return;
    }
    try {
      setError('');
      setLoading(true);
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      let role = null;
      try {
        const docPromise = getDoc(doc(db, 'users', cred.user.uid));
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('doc-timeout')), 4000)
        );
        const snap = await Promise.race([docPromise, timeout]);
        role = snap?.exists() ? snap.data()?.role : null;
      } catch {
        role = null;
      }
      navigation.replace(role === 'landlord' ? 'LandlordHome' : 'StudentHome');
    } catch (e) {
      let msg = "Échec de connexion";
      if (e?.code === 'auth/invalid-email') msg = "Email invalide";
      else if (e?.code === 'auth/user-not-found') msg = "Utilisateur introuvable";
      else if (e?.code === 'auth/wrong-password' || e?.code === 'auth/invalid-credential') msg = "Mot de passe incorrect";
      else if (e?.code === 'auth/network-request-failed') msg = "Problème réseau, réessayez";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <LinearGradient colors={[COLORS.primary, '#145242']} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <View style={styles.logoCircle}>
              <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.title}>Bienvenue !</Text>
                <Text style={styles.subtitle}>Connectez-vous pour continuer</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="votre.email@etudiant.sn"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mot de passe</Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor="#999"
                      secureTextEntry={secureTextEntry}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)} style={styles.eyeButton} activeOpacity={0.8}>
                      <Text style={styles.eyeText}>{secureTextEntry ? 'Voir' : 'Cacher'}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.forgot}>
                    <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
                  </TouchableOpacity>
                </View>
 
                {!!error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}

                <TouchableOpacity style={[styles.loginButton, loading && { opacity: 0.7 }]} activeOpacity={0.9} onPress={handleLogin} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.loginText}>Se connecter</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.registerRow}>
                  <Text style={styles.registerText}>Pas encore de compte ? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.8}>
                    <Text style={styles.registerLink}>S'inscrire</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoCircle: { alignSelf: 'center', width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden' },
  logo: { width: '80%', height: '80%' },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  header: { alignItems: 'center', marginBottom: 18 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.darkGray },
  subtitle: { marginTop: 6, fontSize: 14, color: COLORS.gray },
  form: { width: '100%' },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 14, color: COLORS.darkGray, marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: COLORS.lightGray, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: COLORS.darkGray, borderWidth: 1, borderColor: 'transparent' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  passwordInput: { flex: 1, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: COLORS.darkGray },
  eyeButton: { paddingHorizontal: 12, paddingVertical: 10 },
  eyeText: { color: COLORS.primary, fontWeight: '600' },
  forgot: { alignSelf: 'flex-end', marginTop: 8 },
  forgotText: { color: COLORS.primary, fontSize: 14, fontWeight: '500' },
  loginButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10, backgroundColor: COLORS.primary },
  loginText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  registerText: { color: COLORS.gray, fontSize: 15 },
  registerLink: { color: COLORS.primary, fontWeight: 'bold', fontSize: 15 },
  errorText: { color: COLORS.error, marginTop: 4, textAlign: 'center' },
});

export default LoginScreen;
