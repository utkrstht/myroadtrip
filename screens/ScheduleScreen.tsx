import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import VehicleCard from '../components/VehicleCard';
import { vehicles } from '../data/vehicles';
import { COLORS, SPACING } from '../utils/constants';
import { Booking } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ScheduleScreenProps {
  navigation: any;
}

export default function ScheduleScreen({ navigation }: ScheduleScreenProps) {
  const { theme } = useTheme();
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [flightNumber, setFlightNumber] = useState('');

  const styles = getStyles(theme);
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [specialRequests, setSpecialRequests] = useState('');

  const handleSchedule = async () => {
    if (!flightNumber || !arrivalDate || !arrivalTime || !pickupLocation || !dropoffLocation || !selectedVehicle) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    const booking: Booking = {
      id: Date.now().toString(),
      rideType: 'scheduled',
      pickupLocation,
      dropoffLocation,
      date: arrivalDate,
      time: arrivalTime,
      passengers: parseInt(passengers),
      vehicleId: selectedVehicle,
      status: 'pending',
      specialRequests: `Flight: ${flightNumber}${specialRequests ? '\n' + specialRequests : ''}`,
    };

    try {
      const existingBookings = await AsyncStorage.getItem('bookings');
      const bookings = existingBookings ? JSON.parse(existingBookings) : [];
      bookings.push(booking);
      await AsyncStorage.setItem('bookings', JSON.stringify(bookings));

      Alert.alert(
        'Ride Scheduled',
        'Your ride has been scheduled! We\'ll be ready when you land.',
        [
          {
            text: 'View My Rides',
            onPress: () => navigation.navigate('MyRides'),
          },
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule ride. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Ride</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={24} color={COLORS.gold} />
          <Text style={styles.infoText}>
            Schedule your ride in advance. We'll track your flight and be ready when you land!
          </Text>
        </View>

        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Flight Information</Text>
          
          <View style={styles.inputContainer}>
            <MaterialIcons name="flight" size={20} color={COLORS.gold} />
            <TextInput
              style={styles.input}
              placeholder="Flight Number (e.g., AC123) *"
              value={flightNumber}
              onChangeText={setFlightNumber}
              placeholderTextColor={theme.colors.subText}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <MaterialIcons name="event" size={20} color={theme.colors.gold} />
              <TextInput
                style={styles.input}
                placeholder="Arrival Date *"
                value={arrivalDate}
                onChangeText={setArrivalDate}
                placeholderTextColor={theme.colors.subText}
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <MaterialIcons name="access-time" size={20} color={theme.colors.gold} />
              <TextInput
                style={styles.input}
                placeholder="Arrival Time *"
                value={arrivalTime}
                onChangeText={setArrivalTime}
                placeholderTextColor={theme.colors.subText}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup & Drop-off</Text>
          
          <View style={styles.inputContainer}>
            <MaterialIcons name="location-on" size={20} color={theme.colors.gold} />
            <TextInput
              style={styles.input}
              placeholder="Pickup Location (Airport Terminal) *"
              value={pickupLocation}
              onChangeText={setPickupLocation}
              placeholderTextColor={theme.colors.subText}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="place" size={20} color={theme.colors.gold} />
            <TextInput
              style={styles.input}
              placeholder="Drop-off Location *"
              value={dropoffLocation}
              onChangeText={setDropoffLocation}
              placeholderTextColor={theme.colors.subText}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={20} color={theme.colors.gold} />
            <TextInput
              style={styles.input}
              placeholder="Number of Passengers *"
              value={passengers}
              onChangeText={setPassengers}
              keyboardType="numeric"
              placeholderTextColor={theme.colors.subText}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Vehicle</Text>
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              selected={selectedVehicle === vehicle.id}
              onSelect={() => setSelectedVehicle(vehicle.id)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Requests (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Any special requirements or notes..."
            value={specialRequests}
            onChangeText={setSpecialRequests}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor={theme.colors.subText}
          />
        </View>

        {/* Schedule Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={handleSchedule}
            activeOpacity={0.8}
          >
            <MaterialIcons name="schedule" size={24} color={COLORS.white} />
            <Text style={styles.scheduleButtonText}>Schedule Ride</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.headerText,
  },
  content: {
    flex: 1,
  },
  infoBox: {
    backgroundColor: COLORS.lightGold,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  section: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: SPACING.md,
  },
  inputContainer: {
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 16,
    color: theme.colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfWidth: {
    flex: 1,
  },
  textArea: {
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 100,
  },
  scheduleButton: {
    backgroundColor: theme.colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  scheduleButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});