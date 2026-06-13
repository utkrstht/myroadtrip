import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, CONTACT } from '../utils/constants';
import { rideTypes } from '../data/rideTypes';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import HomeBooking from '../components/HomeBooking';
import GoogleReviews from '../components/GoogleReviews';
import Footer from '../components/Footer';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, signOut, deleteAccount } = useAuth();
  
  const handleCall = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/\s/g, '');
    Linking.openURL(`tel:${cleanNumber}`);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
            } catch (error: any) {
              if (error?.code === 'auth/requires-recent-login') {
                Alert.alert('Re-login Required', 'For security, please log in again before deleting your account.');
                return;
              }

              Alert.alert('Delete Failed', error?.message || 'Unable to delete account right now.');
            }
          },
        },
      ],
    );
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        <View style={styles.bannerContainer}>
          <Image 
            source={require('../assets/images/banner1.webp')} 
            style={styles.banner}
            resizeMode="cover"
          />
          
          <View style={styles.headerOverlay}>
            {user ? (
              <>
                <TouchableOpacity onPress={() => signOut()} style={styles.authButton}>
                  <Text style={styles.authButtonText}>Logout</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteButton}>
                  <Text style={styles.authButtonText}>Delete Account</Text>
                </TouchableOpacity>
              </>
            ) : (
               <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.authButton}>
                  <Text style={styles.authButtonText}>Login / Signup</Text>
               </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <HomeBooking navigation={navigation} />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Pre-Booking Services</Text>
          <View style={styles.servicesGrid}>
            {rideTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.serviceCard}
                onPress={() => navigation.navigate('Booking', { rideType: type.id })}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={
                    type.icon === 'airplane' ? 'flight' :
                    type.icon === 'calendar' ? 'event' :
                    type.icon === 'map' ? 'map' :
                    'schedule'
                  }
                  size={32}
                  color={theme.colors.gold}
                />
                <Text style={styles.serviceTitle}>{type.title}</Text>
                <Text style={styles.serviceDescription}>{type.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <GoogleReviews />

        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerOverlay: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  authButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.95)',
    marginLeft: 12,
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#D64045',
    marginLeft: 8,
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  authButtonText: {
    color: '#000000', 
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  logo: {
    width: 250,
    height: 80,
    tintColor: theme.colors.headerText,
  },
  bannerContainer: {
    width: '100%',
    height: 250,
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: SPACING.md,
  },
  quickActions: {
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  secondaryButton: {
    backgroundColor: theme.colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: SPACING.md,
    width: '47%',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  serviceDescription: {
    fontSize: 11,
    color: theme.colors.subText,
    marginTop: 4,
    textAlign: 'center',
  },
  fleetDescription: {
    fontSize: 14,
    color: theme.colors.subText,
    marginBottom: SPACING.md,
  },
  fleetList: {
  },
  fleetCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  vehicleImage: {
    width: '100%',
    height: 200,
  },
  fleetInfo: {
    padding: SPACING.md,
  },
  fleetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fleetCapacity: {
    fontSize: 14,
    color: theme.colors.subText,
  },
  fleetFeatures: {
    fontSize: 12,
    color: theme.colors.subText,
    marginTop: 4,
  },
  contactBannerContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  contactBanner: {
    width: '100%',
    height: '100%',
  },
  contactOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  contactBannerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  contactBannerSubtitle: {
    fontSize: 16,
    color: COLORS.white,
  },
  contactContainer: {
  },
  contactButton: {
    backgroundColor: theme.colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  contactButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  serviceAreaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  serviceAreaText: {
    fontSize: 14,
    color: theme.colors.subText,
    marginLeft: SPACING.xs,
  },
});
