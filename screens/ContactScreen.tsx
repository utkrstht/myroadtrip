import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome, FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import { COLORS, SPACING, CONTACT } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';

interface ContactScreenProps {
  navigation: any;
}

export default function ContactScreen({ navigation }: ContactScreenProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  const handleCall = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/\s/g, '');
    Linking.openURL(`tel:${cleanNumber}`);
  };

  const handleEmail = () => {
    Linking.openURL('mailto:Booking@myroadtrip.ca');
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Image 
          source={require('../assets/images/logo.webp')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
          <MaterialIcons 
            name={isDark ? "light-mode" : "dark-mode"} 
            size={24} 
            color={theme.colors.text} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.bannerContainer}>
          <Image 
            source={require('../assets/images/banner11.webp')} 
            style={styles.banner}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>Get in Touch</Text>
            <Text style={styles.bannerSubtitle}>We&apos;re here to serve you 24/7</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          
          <View style={styles.contactCard}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="phone" size={28} color={COLORS.white} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Call us:</Text>
              <TouchableOpacity onPress={() => handleCall('+1 403 467 8100')}>
                <Text style={styles.contactValue}>+1 403 467 8100</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleCall('+1 403 467 7367')}>
                <Text style={[styles.contactValue, {marginTop: 4}]}>+1 403 467 7367</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.contactCard}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="email" size={28} color={COLORS.white} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>For Information/query:</Text>
              <TouchableOpacity onPress={() => Linking.openURL('mailto:info@yyctravels.com')}>
                <Text style={[styles.contactValue, {fontSize: 14}]}>info@yyctravels.com</Text>
              </TouchableOpacity>
              
              <Text style={[styles.contactLabel, {marginTop: 12}]}>For booking:</Text>
              <TouchableOpacity onPress={() => Linking.openURL('mailto:booking@myroadtrip.ca')}>
                <Text style={[styles.contactValue, {fontSize: 14}]}>booking@myroadtrip.ca</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={{marginTop: 20}}>
             <Text style={styles.sectionTitle}>Follow us on</Text>
             <View style={{flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 10}}>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.youtube.com/@myroadtripyyctravels')}>
                    <FontAwesome name="youtube-play" size={32} color="#c4302b" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.instagram.com/myroadtripyyctravels?igsh=MXNsZXM3ZjRjaXoxeQ==')}>
                    <FontAwesome name="instagram" size={32} color="#c13584" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.facebook.com/share/19ijsoUbu2/')}>
                    <FontAwesome name="facebook-square" size={32} color="#3b5998" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.tiktok.com/@myroadtripyyctravels')}>
                    <FontAwesome5 name="tiktok" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://x.com/myroadtripyyc?t=pUa0OsriZFml9vaH1QUzJg&s=09')}>
                    <FontAwesome6 name="x-twitter" size={28} color={theme.colors.text} />
                </TouchableOpacity>
             </View>
          </View>

          {/* <TouchableOpacity style={styles.partnerButton} onPress={() => navigation.navigate('Partner')}>
             <MaterialIcons name="handshake" size={24} color={theme.colors.white} style={{marginRight: 10}} />
             <Text style={styles.partnerButtonText}>Partner With Us</Text>
          </TouchableOpacity> */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Area</Text>
          <View style={styles.infoCard}>
            <MaterialIcons name="location-on" size={24} color={theme.colors.gold} />
            <Text style={styles.infoText}>{CONTACT.serviceArea}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose Us?</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={24} color={theme.colors.gold} />
              <Text style={styles.featureText}>Premium Fleet</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={24} color={theme.colors.gold} />
              <Text style={styles.featureText}>24/7 Availability</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={24} color={theme.colors.gold} />
              <Text style={styles.featureText}>Comfortable & Spacious</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.header,
    padding: SPACING.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  logo: {
    width: 150,
    height: 40,
    tintColor: theme.colors.headerText,
  },
  themeButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  bannerContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
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
  bannerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: COLORS.white,
  },
  section: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: SPACING.md,
  },
  contactCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
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
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: theme.colors.subText,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  infoCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
    marginLeft: SPACING.md,
  },
  featuresList: {
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 3,
  },
  featureText: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: SPACING.md,
  },
  partnerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gold,
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.lg,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  partnerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
});
