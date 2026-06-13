import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';

export default function TermsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.headerText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Myroadtrip YYC Travels - Terms & Conditions Summary</Text>

        <Text style={styles.paragraph}>Limousine Services | Calgary, Alberta</Text>

        <Text style={styles.paragraph}>
          By booking or utilizing services provided by Myroadtrip YYC Travels, clients agree to be bound by
          the terms outlined below. These terms apply to all reservations unless otherwise specified in
          writing by Myroadtrip YYC Travels.
        </Text>

        <Text style={styles.heading}>1. Reservation & Service Terms</Text>
        <Text style={styles.paragraph}>
          Clients are responsible for verifying all reservation details (pickup address, date, time, number of
          passengers, billing) upon receiving the trip confirmation. Hourly charges begin at the scheduled
          reservation time, regardless of actual passenger arrival or boarding delays. Chauffeurs are not
          authorized to make decisions regarding billing or service charges; such discussions will not be
          considered valid.
        </Text>

        <Text style={styles.heading}>2. Payment Policy</Text>
        <Text style={styles.paragraph}>
          Any outstanding balance must be settled with the chauffeur at pickup via cash, cashier's check, or
          credit card. A valid government-issued photo ID is required for all credit card transactions if full
          payment has not been made in advance. Unpaid invoices beyond 10 days are subject to late fees,
          interest charges, and potential collection efforts, including legal action and third-party recovery
          services.
        </Text>

        <Text style={styles.heading}>3. Vehicle Damage & Cleaning</Text>
        <Text style={styles.paragraph}>
          The client is liable for any damages caused by themselves or their party to the vehicle interior,
          exterior, or equipment. This includes spills, tears, burns, or broken equipment. A cleaning fee may
          be applied for spills or sickness.
        </Text>

        <Text style={styles.heading}>4. No-Show Policy</Text>
        <Text style={styles.paragraph}>
          If the chauffeur cannot contact the client within 15 minutes of the scheduled pickup time, the trip
          will be deemed a no-show and charged in full, subject to applicable airport wait-time policies.
        </Text>

        <Text style={styles.heading}>5. Conduct Policy</Text>
        <Text style={styles.paragraph}>
          Smoking, vaping, consumption of illegal substances, fighting, or any inappropriate behavior is
          strictly prohibited. Violations may result in immediate trip termination without refund and
          additional cleaning charges.
        </Text>

        <Text style={styles.heading}>6. Alcohol Policy</Text>
        <Text style={styles.paragraph}>
          Alcohol may only be consumed by passengers of legal drinking age and in accordance with local laws.
          Underage drinking is strictly prohibited.
        </Text>

        <Text style={styles.heading}>7. Service Changes</Text>
        <Text style={styles.paragraph}>
          Requests for changes to pickup time, location, or vehicle type must be submitted in writing and are
          subject to availability and approval.
        </Text>

        <Text style={styles.heading}>8. Delays and Force Majeure</Text>
        <Text style={styles.paragraph}>
          Myroadtrip YYC Travels is not liable for service disruptions or delays resulting from weather,
          mechanical failure, traffic, road conditions, or other unforeseen circumstances beyond our control.
        </Text>

        <Text style={styles.heading}>9. Banff National Park Pass Policy</Text>
        <Text style={styles.paragraph}>
          For trips requiring park access, clients are responsible for applicable park pass requirements unless
          otherwise stated at booking.
        </Text>

        <Text style={styles.heading}>10. Cancellation & Refund Policy</Text>
        <Text style={styles.paragraph}>No charges apply if cancelled 24 hours prior to the scheduled time.</Text>
        <Text style={styles.paragraph}>- A 25% cancellation fee applies if cancelled within 24 hours of the scheduled time.</Text>
        <Text style={styles.paragraph}>- If the driver has arrived at your location and you cancel, the full amount will be charged.</Text>
        <Text style={styles.paragraph}>
          Please note, the driver will arrive 10 minutes prior to your scheduled time, and a 15-minute waiting
          period is included in our service.
        </Text>
        <Text style={styles.paragraph}>- In case of Airport pickup the driver will wait for 60 mins from the scheduled time.</Text>

        <Text style={styles.heading}>11. Meet & Greet</Text>
        <Text style={styles.paragraph}>
          Meet & Greet services at the airport: the driver will be waiting inside the designated meeting area
          with a personalized name sign. This service incurs an additional fee of $25, separate from the trip
          cost.
        </Text>

        <Text style={styles.heading}>12. Airport Pickup Policy</Text>
        <Text style={styles.paragraph}>
          Airport wait times and pickup coordination may vary by terminal and flight conditions. Additional
          waiting time may be billed where applicable.
        </Text>

        <Text style={styles.heading}>13. Overtime Charges</Text>
        <Text style={styles.paragraph}>
          Any delay beyond included waiting time may be billed in billing increments based on the selected
          service and vehicle category.
        </Text>

        <Text style={styles.heading}>14. Lost & Found</Text>
        <Text style={styles.paragraph}>
          Lost items are kept at the Myroadtrip YYC Travels office for 30 days. Items not claimed within this
          period may be discarded or donated.
        </Text>

        <Text style={styles.heading}>15. Contact Information</Text>
        <Text style={styles.paragraph}>
          Myroadtrip YYC Travels - Limo Service, 335 Whitlock Way NE, Calgary, Alberta, T1Y5C9. Email:
          info@yyctravels.com | Phone: 403-467-8100
        </Text>

        <Text style={styles.footer}>Last updated: April 2026 | These terms are subject to change without notice.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.header,
      padding: SPACING.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      marginRight: SPACING.md,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.headerText,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: SPACING.md,
      paddingBottom: SPACING.xl,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: SPACING.sm,
      color: theme.colors.text,
    },
    heading: {
      fontSize: 16,
      fontWeight: '700',
      marginTop: SPACING.md,
      color: theme.colors.text,
    },
    paragraph: {
      fontSize: 14,
      color: theme.colors.text,
      marginTop: SPACING.xs,
      lineHeight: 20,
    },
    footer: {
      marginTop: SPACING.lg,
      fontSize: 12,
      color: theme.colors.subText,
    },
  });
