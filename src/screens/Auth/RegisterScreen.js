import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../../constants/colors';
import { auth, db } from '../../config/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const RegisterScreen = ({ navigation, route }) => {
  const [role, setRole] = React.useState(route?.params?.role || 'student');
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [city, setCity] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [secureTextEntry, setSecureTextEntry] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);
  const handleRegister = async () => {
    const trimmedEmail = email.trim();
    if (!fullName) {
      setError("Nom complet requis");
      return;
    }
    if (!phone) {
      setError("Téléphone requis");
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      setError("Email invalide");
      return;
    }
    if (!password || password.length < 6) {
      setError("Mot de passe trop court");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    try {
      setError('');
      setLoading(true);
      const flow = (async () => {
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        try {
          await updateProfile(cred.user, { displayName: fullName });
          const payload = {
            uid: cred.user.uid,
            role,
            fullName,
            phone,
            email: trimmedEmail,
            city: role === 'landlord' ? city : '',
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', cred.user.uid), payload);
          return cred;
        } catch (err) {
          try {
            await cred.user.delete();
          } catch {}
          throw err;
        }
      })();
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('register-timeout')), 10000)
      );
      const result = await Promise.race([flow, timeout]);
      if (result) {
        navigation.replace(role === 'landlord' ? 'LandlordHome' : 'StudentHome');
      }
    } catch (e) {
      let msg = "Échec de l'inscription";
      if (e?.message === 'register-timeout') msg = "Connexion trop lente, vérifiez votre internet et réessayez";
      else if (e?.code === 'auth/email-already-in-use') msg = "Email déjà utilisé";
      else if (e?.code === 'auth/invalid-email') msg = "Email invalide";
      else if (e?.code === 'auth/operation-not-allowed') msg = "Opération non autorisée";
      else if (e?.code === 'auth/weak-password') msg = "Mot de passe trop faible";
      else if (e?.code === 'auth/network-request-failed') msg = "Problème réseau, réessayez";
      else if (e?.code === 'permission-denied') msg = "Autorisation refusée pour enregistrer les données, vérifiez la configuration Firebase";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.secondary, COLORS.primary]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gradient}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
      {/* <StatusBar style="dark" /> */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={{ color: COLORS.darkGray, fontSize: 20 }}>‹</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <View style={styles.headerContainer}>
                <View style={styles.roleTabs}>
                  <TouchableOpacity activeOpacity={0.9} style={[styles.tab, role === 'student' && styles.tabActive]} onPress={() => setRole('student')}>
                    <Text style={[styles.tabText, role === 'student' && styles.tabTextActive]}>Étudiant</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.9} style={[styles.tab, role === 'landlord' && styles.tabActive]} onPress={() => setRole('landlord')}>
                    <Text style={[styles.tabText, role === 'landlord' && styles.tabTextActive]}>Bailleur</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.title}>{role === 'student' ? "Créer un compte étudiant" : "Créer un compte bailleur"}</Text>
                <Text style={styles.subtitle}>Rejoignez la communauté LOGISEN</Text>
              </View>

              <View style={styles.formContainer}>
                {/* Full Name */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nom complet</Text>
                  <TextInput
                    style={styles.input}
                  placeholder="Mamadou Diop"
                  placeholderTextColor="#999"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              {/* Phone */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Téléphone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+221 77 000 00 00"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="votre.email@exemple.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {role === 'landlord' && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Ville</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Dakar"
                    placeholderTextColor="#999"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
              )}

              {!!error && (
                <Text style={styles.errorText}>{error}</Text>
              )}

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    placeholderTextColor="#999"
                    secureTextEntry={secureTextEntry}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                    style={styles.eyeIcon}
                  >
                    <Text style={{ color: COLORS.gray, fontSize: 14 }}>
                      {secureTextEntry ? "Afficher" : "Masquer"}
                    </Text>
                  </TouchableOpacity>
                </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirmer le mot de passe</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor="#999"
                      secureTextEntry={secureTextEntry}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>
                </View>

                {/* Champs spécifiques supprimés pour simplification */}

                {/* Register Button */}
              <TouchableOpacity onPress={handleRegister} activeOpacity={0.9} disabled={loading}>
                <LinearGradient
                  colors={[COLORS.primary, '#145242']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.registerButton}
                >
                  <Text style={styles.registerButtonText}>{loading ? "Patientez..." : "S'inscrire"}</Text>
                </LinearGradient>
              </TouchableOpacity>

                {/* Login Link */}
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Déjà un compte ? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLink}>Se connecter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 50,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerContainer: {
    marginBottom: 30,
  },
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    color: COLORS.gray,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.darkGray,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.darkGray,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  eyeIcon: {
    padding: 12,
  },
  buttonContainer: {
    marginTop: 10,
  },
  registerButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  registerButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: { color: COLORS.error, marginTop: 4, textAlign: 'center' },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  loginText: {
    color: COLORS.gray,
    fontSize: 15,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default RegisterScreen;
