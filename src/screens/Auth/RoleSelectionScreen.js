import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';

const RoleSelectionScreen = ({ navigation }) => {
  const handleRoleSelect = (role) => {
    navigation.navigate('Register', { role });
  };

  return (
    <LinearGradient colors={[COLORS.primary, '#145242']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Qui êtes-vous ?</Text>
        <Text style={styles.subtitle}>Choisissez le profil qui vous correspond pour continuer.</Text>
      </View>

      <View style={styles.cardsContainer}>
        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.9}
          onPress={() => handleRoleSelect('student')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#E6F4F1' }]}>
            <Ionicons name="school-outline" size={40} color={COLORS.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Je suis étudiant</Text>
            <Text style={styles.cardDescription}>
              Je cherche un logement proche de mon université.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.9}
          onPress={() => handleRoleSelect('landlord')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="home-outline" size={40} color="#FF9800" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Je suis bailleur</Text>
            <Text style={styles.cardDescription}>
              Je propose des logements à louer aux étudiants.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 25, paddingTop: 80 },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    lineHeight: 24,
  },
  cardsContainer: {
    gap: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 50,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '500',
  }
});

export default RoleSelectionScreen;
