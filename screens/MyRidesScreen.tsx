import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../utils/constants';
import { sendCancelEmail, CancelEmailData } from '../utils/emailService';
import { Booking } from '../types';
import { vehicles } from '../data/vehicles';
import { rideTypes } from '../data/rideTypes';
import { useTheme } from '../context/ThemeContext';


interface MyRidesScreenProps {
  navigation: any;
}

export default function MyRidesScreen({ navigation }: MyRidesScreenProps) {
  const { theme } = useTheme();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const styles = getStyles(theme);

  const loadBookings = async () => {
    try {
      const storedBookings = await AsyncStorage.getItem('bookings');
      if (storedBookings) {
        const parsed = JSON.parse(storedBookings);
        setBookings(parsed.reverse());
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [])
  );

  const handleCancelBooking = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedBookings = bookings.map(b =>
                b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
              );
              await AsyncStorage.setItem('bookings', JSON.stringify(updatedBookings));
              setBookings(updatedBookings.reverse());
              setModalVisible(false);
              Alert.alert('Cancelled', 'Your booking has been cancelled.');

              const vehicle = getVehicle(booking.vehicleId);
              const [firstName, ...lastNameParts] = (booking.customerName || '').split(' ');
              const lastName = lastNameParts.join(' ');
              
              const cancelData: CancelEmailData = {
                first_name: firstName || '',
                last_name: lastName || '',
                service_type: rideTypes.find(rt => rt.id === booking.rideType)?.title || booking.rideType,
                car: vehicle?.model || 'Unknown Vehicle',
                pickup_date: booking.date,
                pickup_time: booking.time,
                pickup_location: booking.pickupLocation,
                dropoff_location: booking.dropoffLocation,
                email: booking.customerEmail || '',
                phone: booking.customerPhone || '',
                info: booking.specialRequests,
              };

              sendCancelEmail(cancelData).then(emailSent => {
                if (!emailSent) {
                  console.warn('Cancel email failed to send');
                }
              }).catch(err => {
                console.error('Error sending cancel email:', err);
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking.');
            }
          },
        },
      ]
    );
  };

  const getVehicle = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const getVehicleImage = (vehicleId: string) => {
    const vehicle = getVehicle(vehicleId);
    if (!vehicle) return null;

    if (vehicleId === '1') {
      return require('../assets/images/yukon1.jpg');
    } else if (vehicleId === '2') {
      return require('../assets/images/yukon2.jpg');
    } else if (vehicleId === '3') {
      return require('../assets/images/lincoln1.jpg');
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.gold;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'check-circle';
      case 'cancelled':
        return 'cancel';
      default:
        return 'schedule';
    }
  };

  const openBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setModalVisible(true);
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Rides</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="event-busy" size={64} color={theme.colors.subText} />
            <Text style={styles.emptyTitle}>No Rides Yet</Text>
            <Text style={styles.emptyText}>Book your first ride to get started!</Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => navigation.navigate('Booking')}
              activeOpacity={0.8}
            >
              <Text style={styles.bookButtonText}>Book a Ride</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bookingsList}>
            {bookings.map((booking) => {
              const vehicle = getVehicle(booking.vehicleId);
              const vehicleImage = getVehicleImage(booking.vehicleId);

              return (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingCard}
                  onPress={() => openBookingDetails(booking)}
                  activeOpacity={0.7}
                >
                  {vehicleImage && (
                    <Image source={vehicleImage} style={styles.vehicleImage} resizeMode="cover" />
                  )}

                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                    <MaterialIcons
                      name={getStatusIcon(booking.status)}
                      size={14}
                      color={COLORS.white}
                    />
                    <Text style={styles.statusText}>
                      {booking.status}
                    </Text>
                  </View>

                  <View style={styles.bookingInfo}>
                    <Text style={styles.vehicleName}>{vehicle?.name || 'Unknown Vehicle'}</Text>
                    
                    <View style={styles.locationRow}>
                      <MaterialIcons name="trip-origin" size={16} color={theme.colors.gold} />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {booking.pickupLocation}
                      </Text>
                    </View>

                    <View style={styles.locationRow}>
                      <MaterialIcons name="place" size={16} color={theme.colors.error} />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {booking.dropoffLocation}
                      </Text>
                    </View>

                    <View style={styles.timeRow}>
                      <MaterialIcons name="event" size={16} color={theme.colors.subText} />
                      <Text style={styles.timeText}>
                        {booking.date} at {booking.time}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tapIndicator}>
                    <Text style={styles.tapText}>Tap for details</Text>
                    <MaterialIcons name="chevron-right" size={20} color={theme.colors.subText} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedBooking && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Ride Details</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <MaterialIcons name="close" size={28} color={theme.colors.text} />
                    </TouchableOpacity>
                  </View>

                  {getVehicleImage(selectedBooking.vehicleId) && (
                    <Image
                      source={getVehicleImage(selectedBooking.vehicleId)!}
                      style={styles.modalVehicleImage}
                      resizeMode="cover"
                    />
                  )}

                  <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedBooking.status) }]}>
                    <MaterialIcons
                      name={getStatusIcon(selectedBooking.status)}
                      size={20}
                      color={COLORS.white}
                    />
                    <Text style={styles.modalStatusText}>
                      {selectedBooking.status.toUpperCase()}
                    </Text>
                  </View>

                  <Text style={styles.bookingIdText}>Booking #{selectedBooking.id.slice(-8)}</Text>

                  <View style={styles.detailsSection}>
                    <View style={styles.detailItem}>
                      <MaterialIcons name="directions-car" size={24} color={COLORS.gold} />
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Vehicle</Text>
                        <Text style={styles.detailValue}>
                          {getVehicle(selectedBooking.vehicleId)?.model || 'Unknown'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailItem}>
                        <MaterialIcons name="trip-origin" size={24} color={theme.colors.gold} />
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>Pickup Location</Text>
                          <Text style={styles.detailValue}>{selectedBooking.pickupLocation}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <MaterialIcons name="place" size={24} color={theme.colors.error} />
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Dropoff Location</Text>
                        <Text style={styles.detailValue}>{selectedBooking.dropoffLocation}</Text>
                      </View>
                    </View>

                    <View style={styles.detailItem}>
                      <MaterialIcons name="event" size={24} color={theme.colors.gold} />
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Date & Time</Text>
                        <Text style={styles.detailValue}>
                          {selectedBooking.date} at {selectedBooking.time}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailItem}>
                      <MaterialIcons name="person" size={24} color={theme.colors.gold} />
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Passengers</Text>
                        <Text style={styles.detailValue}>{selectedBooking.passengers}</Text>
                      </View>
                    </View>

                    {selectedBooking.estimatedPrice  && (
                      <View style={styles.detailItem}>
                        <MaterialIcons name="attach-money" size={24} color={theme.colors.gold} />
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>Estimated Price</Text>
                          <Text style={styles.detailValue}>
                            {formatPrice(selectedBooking.estimatedPrice)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {selectedBooking.distance && (
                      <View style={styles.detailItem}>
                        <MaterialIcons name="straighten" size={24} color={theme.colors.gold} />
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>Distance</Text>
                          <Text style={styles.detailValue}>{selectedBooking.distance}</Text>
                        </View>
                      </View>
                    )}

                    {selectedBooking.specialRequests && (
                      <View style={styles.detailItem}>
                        <MaterialIcons name="note" size={24} color={theme.colors.gold} />
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>Special Requests</Text>
                          <Text style={styles.detailValue}>{selectedBooking.specialRequests}</Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.sectionDivider} />
                    <Text style={styles.sectionTitle}>Customer Information</Text>

                    <View style={styles.detailItem}>
                        <MaterialIcons name="person" size={24} color={theme.colors.gold} />
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Name</Text>
                        <Text style={styles.detailValue}>{selectedBooking.customerName}</Text>
                      </View>
                    </View>

                    <View style={styles.detailItem}>
                        <MaterialIcons name="email" size={24} color={theme.colors.gold} />
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Email</Text>
                        <Text style={styles.detailValue}>{selectedBooking.customerEmail}</Text>
                      </View>
                    </View>

                    <View style={styles.detailItem}>
                      <MaterialIcons name="phone" size={24} color={COLORS.gold} />
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Phone</Text>
                        <Text style={styles.detailValue}>{selectedBooking.customerPhone}</Text>
                      </View>
                    </View>
                  </View>

                  {selectedBooking.status === 'pending' && (
                    <TouchableOpacity
                      style={styles.modalCancelButton}
                      onPress={() => handleCancelBooking(selectedBooking.id)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="cancel" size={20} color={COLORS.white} />
                      <Text style={styles.modalCancelButtonText}>Cancel Booking</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    padding: SPACING.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.headerText,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.subText,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.lg,
  },
  bookButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookingsList: {
    padding: SPACING.md,
  },
  bookingCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    marginBottom: SPACING.md,
    overflow: 'hidden',
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
    height: 180,
  },
  statusBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: 4,
  },
  bookingInfo: {
    padding: SPACING.md,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: SPACING.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  locationText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  timeText: {
    fontSize: 13,
    color: theme.colors.subText,
    marginLeft: SPACING.sm,
  },
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  tapText: {
    fontSize: 12,
    color: theme.colors.subText,
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  modalVehicleImage: {
    width: '100%',
    height: 220,
  },
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: 8,
  },
  modalStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: SPACING.xs,
  },
  bookingIdText: {
    fontSize: 12,
    color: theme.colors.subText,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  detailsSection: {
    padding: SPACING.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  detailTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.subText,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: SPACING.md,
  },
  modalCancelButton: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
  },
  modalCancelButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
});