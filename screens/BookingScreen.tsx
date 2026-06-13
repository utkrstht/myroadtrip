import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import RideTypeSelector from '../components/RideTypeSelector';
import VehicleCard from '../components/VehicleCard';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { rideTypes } from '../data/rideTypes';
import { vehicles } from '../data/vehicles';
import { COLORS, SPACING } from '../utils/constants';
import { sendBookingEmail, EmailData } from '../utils/emailService';
import { calculatePricing, PricingInput } from '../utils/pricingCalculator';
import { CALGARY_COORDS, Location } from '../utils/distanceCalculator';
import { geocodeAddress as googleGeocodeAddress, getRouteDistanceKm } from '../utils/geocoding';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createTDBankPaymentSession, getTDBankProxyOrigin, isTDBankPaymentMethod, PAYMENT_METHOD_OPTIONS, verifyTDBankPayment } from '../utils/tdBankGateway';
import * as WebBrowser from 'expo-web-browser';

const PENDING_PAYMENT_EMAIL_PREFIX = 'pending-payment-email:';

const getPendingPaymentEmailKey = (bookingId: string): string => `${PENDING_PAYMENT_EMAIL_PREFIX}${bookingId}`;

const parsePaymentRedirectInfo = (url: string) => {
  try {
    const parsed = new URL(url);
    const lower = `${parsed.host}${parsed.pathname}`.toLowerCase();
    const isPaymentCallback = lower.includes('payment-result');

    return {
      isPaymentCallback,
      bookingId:
        parsed.searchParams.get('bookingId') ||
        parsed.searchParams.get('orderNumber') ||
        parsed.searchParams.get('trnOrderNumber') ||
        '',
      transactionId:
        parsed.searchParams.get('transactionId') ||
        parsed.searchParams.get('trnId') ||
        parsed.searchParams.get('id') ||
        '',
      approvedHint:
        parsed.searchParams.get('approved') ||
        parsed.searchParams.get('trnApproved') ||
        '',
      statusHint:
        parsed.searchParams.get('status') ||
        parsed.searchParams.get('trnResponse') ||
        '',
    };
  } catch {
    return {
      isPaymentCallback: false,
      bookingId: '',
      transactionId: '',
      approvedHint: '',
      statusHint: '',
    };
  }
};

const normalizeCheckoutUrl = (url: string): string => {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const openCheckoutUrl = async (rawUrl: string): Promise<boolean> => {
  if (!rawUrl) {
    return false;
  }

  const checkoutUrl = normalizeCheckoutUrl(rawUrl);

  try {
    if (Platform.OS === 'android') {
      const result = await WebBrowser.openBrowserAsync(checkoutUrl, {
        showInRecents: true,
      });

      return result.type !== 'cancel';
    }

    await Linking.openURL(checkoutUrl);
    return true;
  } catch (error) {
    console.warn('Unable to open TD checkout URL:', error);
    return false;
  }
};

let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  } catch (error) {
    console.warn('react-native-maps not available');
  }
}

interface BookingScreenProps {
  navigation: any;
  route: any;
}

interface Stop {
  id: string;
  address: string;
  coordinates?: Location;
}

interface ChildSeat {
  id: string;
  age: string;
}

type TipOption = 'none' | '15' | '20' | '25' | 'custom';

export default function BookingScreen({ navigation, route }: BookingScreenProps) {
  const { user, signOut, deleteAccount } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const styles = getStyles(theme);
  const initialRideType = route.params?.rideType || 'airport';
  
  const initialPickup = route.params?.initialPickup || '';
  const initialDropoff = route.params?.initialDropoff || '';
  const initialDateStr = route.params?.initialDate;
  const initialPassengers = route.params?.passengers || '1';
  const initialComment = route.params?.initialComment || '';
  const initialPromo = route.params?.initialPromo || '';

  const [selectedRideType, setSelectedRideType] = useState(initialRideType);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [pickupLocation, setPickupLocation] = useState(initialPickup);
  const [dropoffLocation, setDropoffLocation] = useState(initialDropoff);
  
  const [pickupDateTime, setPickupDateTime] = useState(initialDateStr ? new Date(initialDateStr) : new Date()); 
  const [displayDate, setDisplayDate] = useState('');
  const [displayTime, setDisplayTime] = useState('');
  const [passengers, setPassengers] = useState(initialPassengers);
  const [specialRequests, setSpecialRequests] = useState(initialComment);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(''); 
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  
  const [hours, setHours] = useState('');
  const [nights, setNights] = useState('');
  
  const [promoCode, setPromoCode] = useState(initialPromo);
  const [childSeats, setChildSeats] = useState<ChildSeat[]>([]);
  const [bulkyLuggage, setBulkyLuggage] = useState(false);
  const [stops, setStops] = useState<Stop[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [tipOption, setTipOption] = useState<TipOption>('15');
  const [customTipAmountInput, setCustomTipAmountInput] = useState('');

  const [termsAccepted, setTermsAccepted] = useState(true);

  const [distance, setDistance] = useState(0);
  const [pickupCoords, setPickupCoords] = useState<Location | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<Location | null>(null);
  
  const [pricing, setPricing] = useState({
    distanceFee: 0,
    airportTax: 0,
    hourlyFee: 0,
    longTripFee: 0,
    discount: 0,
    subtotal: 0,
    tax: 0,
    total: 0,
  });

  const [paymentFee, setPaymentFee] = useState(0);
  const [totalWithPaymentFee, setTotalWithPaymentFee] = useState(0);

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        if (user.displayName) {
          const parts = user.displayName.split(' ');
          setFirstName(parts[0]);
          if (parts.length > 1) setLastName(parts.slice(1).join(' '));
        }
        if (user.email) setEmail(user.email);

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.phone) setPhone(data.phone);
            if (data.name) {
                const parts = data.name.split(' ');
                setFirstName(parts[0]);
                if (parts.length > 1) setLastName(parts.slice(1).join(' '));
            }
          }
        } catch (e) {
          console.log('Error fetching user details', e);
        }
      }
    };
    loadUserData();
  }, [user]);

  const formatDate = (date: Date): string => date.toISOString().split('T')[0];
  const formatTime = (date: Date): string => `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  useEffect(() => {
    setDisplayDate(formatDate(pickupDateTime));
    setDisplayTime(formatTime(pickupDateTime));
  }, [pickupDateTime]);

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

  const parsedCustomTipAmount = parseFloat(customTipAmountInput);
  const customTipAmount = Number.isFinite(parsedCustomTipAmount) ? Math.max(parsedCustomTipAmount, 0) : 0;
  const selectedTipPercent =
    tipOption === 'custom'
      ? (pricing.total > 0 ? (customTipAmount / pricing.total) * 100 : 0)
      : tipOption === 'none'
        ? 0
        : parseFloat(tipOption);
  const tipAmount =
    tipOption === 'custom'
      ? Math.round(customTipAmount * 100) / 100
      : Math.round((pricing.total * (selectedTipPercent / 100)) * 100) / 100;
  const totalBeforePaymentFee = Math.round((pricing.total + tipAmount) * 100) / 100;

  useEffect(() => {
    const input: PricingInput = {
      serviceType: selectedRideType,
      distance,
      pickupLocation,
      vehicleId: selectedVehicle,
      hours: hours ? parseInt(hours) : undefined,
      nights: nights ? parseInt(nights) : undefined,
      promoCode,
    };
    
    const newPricing = calculatePricing(input);
    setPricing(newPricing);
  }, [selectedRideType, distance, pickupLocation, selectedVehicle, hours, nights, promoCode]);

  useEffect(() => {
    const baseTotal = totalBeforePaymentFee || 0;
    setPaymentFee(0);
    setTotalWithPaymentFee(Math.round(baseTotal * 100) / 100);
  }, [totalBeforePaymentFee, paymentMethod]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    let isMounted = true;

    const finalizePaymentFromUrl = async (url: string | null) => {
      if (!url || !isMounted) {
        return;
      }

      const parsed = parsePaymentRedirectInfo(url);
      if (!parsed.isPaymentCallback || !parsed.bookingId) {
        return;
      }

      const isVerified = await verifyTDBankPayment({
        bookingId: parsed.bookingId,
        orderNumber: parsed.bookingId,
        transactionId: parsed.transactionId,
        approvedHint: parsed.approvedHint,
        statusHint: parsed.statusHint,
      });

      if (!isVerified) {
        Alert.alert(
          'Payment Not Confirmed',
          'We could not verify this payment with TD yet. Email confirmation will be sent automatically once payment is confirmed.'
        );
        return;
      }

      const pendingEmailRaw = await AsyncStorage.getItem(getPendingPaymentEmailKey(parsed.bookingId));
      if (!pendingEmailRaw) {
        return;
      }

      let pendingEmailPayload: any = null;
      try {
        pendingEmailPayload = JSON.parse(pendingEmailRaw);
      } catch {
        pendingEmailPayload = null;
      }

      if (!pendingEmailPayload) {
        return;
      }

      const sent = await sendBookingEmail(pendingEmailPayload as EmailData);
      if (sent) {
        await AsyncStorage.removeItem(getPendingPaymentEmailKey(parsed.bookingId));
        Alert.alert(
          'Booking Confirmed',
          'Payment confirmed and booking email sent successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Home'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Email Error',
          'Payment was confirmed, but we could not send the confirmation email. Please contact support at 403-467-8100.'
        );
      }
    };

    Linking.getInitialURL().then(finalizePaymentFromUrl).catch(() => {
      // Ignore initial URL parsing errors.
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      finalizePaymentFromUrl(url).catch(() => {
        // Ignore event URL parsing errors.
      });
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [navigation]);

  const addStop = () => {
    setStops([...stops, { id: Date.now().toString(), address: '' }]);
  };

  const removeStop = (id: string) => {
    setStops(stops.filter(stop => stop.id !== id));
  };

  const updateStop = (id: string, address: string) => {
    setStops(stops.map(stop => stop.id === id ? { ...stop, address } : stop));
  };

  const updateStopWithCoordinates = async (id: string, address: string) => {
    const coords = await geocodeAddress(address);
    setStops(stops.map(stop => 
      stop.id === id ? { ...stop, address, coordinates: coords || undefined } : stop
    ));
  };

  const addChildSeat = () => {
    setChildSeats([...childSeats, { id: Date.now().toString(), age: '' }]);
  };

  const removeChildSeat = (id: string) => {
    setChildSeats(childSeats.filter(seat => seat.id !== id));
  };

  const updateChildSeat = (id: string, age: string) => {
    setChildSeats(childSeats.map(seat => seat.id === id ? { ...seat, age } : seat));
  };

  const applyPromoCode = () => {
    const validCodes = ['FLAT10', 'SENIOR20', 'DMC25'];
    const upperCode = promoCode.toUpperCase();
    
    if (validCodes.includes(upperCode)) {
      Alert.alert('Success', 'Promo code applied successfully!');
      const input: PricingInput = {
        serviceType: selectedRideType,
        distance,
        pickupLocation,
        hours: hours ? parseInt(hours) : undefined,
        nights: nights ? parseInt(nights) : undefined,
        promoCode: upperCode,
      };
      setPricing(calculatePricing(input));
    } else {
      Alert.alert('Invalid Code', 'The promo code you entered is not valid.');
    }
  };

  const geocodeAddress = async (address: string): Promise<Location | null> => {
    return await googleGeocodeAddress(address);
  };

  const calculateRoute = async () => {
    if (!pickupLocation || !dropoffLocation) return;

    const pickup = await geocodeAddress(pickupLocation);
    const dropoff = await geocodeAddress(dropoffLocation);

    if (pickup && dropoff) {
      setPickupCoords(pickup);
      setDropoffCoords(dropoff);

      const locations: Location[] = [pickup];
      
      for (const stop of stops) {
        if (stop.address) {
          const stopCoords = await geocodeAddress(stop.address);
          if (stopCoords) {
            locations.push(stopCoords);
          }
        }
      }

      const waypointCoords = locations.slice(1);
      const routeDistanceKm = await getRouteDistanceKm(
        pickup,
        dropoff,
        waypointCoords.length ? waypointCoords : undefined
      );

      if (routeDistanceKm && routeDistanceKm > 0) {
        setDistance(routeDistanceKm);
      } else {
        Alert.alert(
          'Distance Unavailable',
          'We could not calculate the route distance from Maps. Please try again in a moment.'
        );
      }
    }
  };

  useEffect(() => {
    calculateRoute();
  }, [pickupLocation, dropoffLocation, stops]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
        const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 
                                 pickupDateTime.getHours(), pickupDateTime.getMinutes());
        setPickupDateTime(newDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
        const newTime = new Date(pickupDateTime.getFullYear(), pickupDateTime.getMonth(), pickupDateTime.getDate(), 
                                 selectedTime.getHours(), selectedTime.getMinutes());
        setPickupDateTime(newTime);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please login or signup to confirm your booking.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') },
          { text: 'Sign Up', onPress: () => navigation.navigate('Signup') },
        ]
      );
      return;
    }

    if (!pickupLocation || !dropoffLocation || !displayDate || !displayTime || !selectedVehicle) {
      Alert.alert('Missing Information', 'Please fill in all required fields (including Vehicle Selection)');
      return;
    }

    if (!firstName || !phone || !email) {
      Alert.alert('Missing Information', 'Please fill in your contact information');
      return;
    }

    if (!paymentMethod) {
      Alert.alert('Missing Information', 'Please select a payment method');
      return;
    }

    if (!termsAccepted) {
      Alert.alert('Terms Required', 'Please agree to the Terms & Conditions before booking.');
      return;
    }
    if (selectedRideType === 'long-trip') {
      const nightsNum = parseInt(nights);
      if (!nights || nightsNum < 2) {
        Alert.alert('Invalid Input', 'Long trips require minimum 2 nights');
        return;
      }
    }

    if (selectedRideType === 'hourly') {
      const hoursNum = parseInt(hours);
      if (!hours || hoursNum < 1 || hoursNum > 24) {
        Alert.alert('Invalid Input', 'Hours must be between 1 and 24');
        return;
      }
    }
    
    if (pickupDateTime.getTime() < Date.now() + 60 * 60 * 1000) {
      Alert.alert('Invalid Pickup Time', 'Bookings must be scheduled at least 1 hour from now.');
      return;
    }
    
    const dateToUse = displayDate;
    const timeToUse = displayTime;
    const bookingId = Date.now().toString();
    const usesTDBankGateway = isTDBankPaymentMethod(paymentMethod);

    const stopsString = stops.map(s => s.address).filter(a => a).join(', ');
    const childSeatsString = childSeats.map(s => `Age ${s.age}`).join(', ');
    const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);
    const carName = selectedVehicleData ? `${selectedVehicleData.name} (${selectedVehicleData.capacity} passengers)` : 'Not selected';

    let paymentSession: { paymentSessionId: string; checkoutUrl: string | null; approved?: boolean } | null = null;
    const proxyOrigin = getTDBankProxyOrigin();
    const appSuccessRedirect = `user-app://payment-result?bookingId=${encodeURIComponent(bookingId)}&status=approved`;
    const appCancelRedirect = `user-app://payment-result?bookingId=${encodeURIComponent(bookingId)}&status=cancelled`;
    const returnUrl = proxyOrigin
      ? `${proxyOrigin}/payment/success/?bookingId=${encodeURIComponent(bookingId)}&appRedirect=${encodeURIComponent(appSuccessRedirect)}`
      : undefined;
    const cancelUrl = proxyOrigin
      ? `${proxyOrigin}/payment/cancel/?bookingId=${encodeURIComponent(bookingId)}&appRedirect=${encodeURIComponent(appCancelRedirect)}`
      : undefined;

    if (usesTDBankGateway) {
      try {
        paymentSession = await createTDBankPaymentSession({
          bookingId,
          amount: totalWithPaymentFee || totalBeforePaymentFee,
          currency: 'CAD',
          customerName: `${firstName} ${lastName}`.trim(),
          customerEmail: email,
          customerPhone: phone,
          description: `${rideTypes.find(rt => rt.id === selectedRideType)?.title || selectedRideType} booking`,
          returnUrl,
          cancelUrl,
          metadata: {
            rideType: selectedRideType,
            pickupLocation,
            dropoffLocation,
            vehicleId: selectedVehicle,
          },
        });

        if (!paymentSession?.checkoutUrl) {
          Alert.alert(
            'Checkout Link Missing',
            'The payment gateway did not return a checkout link. Please try again in a moment.'
          );
          return;
        }
      } catch (error) {
        console.warn('TD Bank checkout session could not be created:', error);
        Alert.alert(
          'Payment Setup Failed',
          error instanceof Error
            ? error.message
            : 'Unable to start TD checkout right now. Please try again in a moment.'
        );
        return;
      }
    }

    const emailData: EmailData = {
      service_type: rideTypes.find(rt => rt.id === selectedRideType)?.title || selectedRideType,
      pickup_date: dateToUse,
      pickup_time: timeToUse,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      distance: distance.toFixed(1) + ' km',
      distance_fee: pricing.distanceFee.toFixed(2),
      airport_tax: pricing.airportTax.toFixed(2),
      discount: pricing.discount.toFixed(2),
      balance: (pricing.subtotal - pricing.discount).toFixed(2),
      tax: pricing.tax.toFixed(2),
      total: (totalWithPaymentFee || totalBeforePaymentFee).toFixed(2),
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      email: email,
      passengers: passengers,
      hourly_fee: pricing.hourlyFee.toFixed(2),
      longtrip_fee: pricing.longTripFee.toFixed(2),
      info: specialRequests,
      stops: stopsString,
      hours: hours || 'N/A',
      nights: nights || 'N/A',
      pay_meth: paymentMethod,
      child_seats: childSeats.length > 0 ? childSeatsString : 'No',
      bulky_luggage: bulkyLuggage ? 'Yes' : 'No',
      car: carName,
    };

    const emailPayload: any = {
      ...emailData,
      tip_percent: selectedTipPercent.toFixed(2),
      tip_amount: tipAmount.toFixed(2),
      payment_fee: paymentFee.toFixed(2),
      total: (totalWithPaymentFee || totalBeforePaymentFee).toFixed(2),
      payment_provider: usesTDBankGateway ? 'td-bank' : 'manual',
      payment_session_id: paymentSession?.paymentSessionId || '',
      payment_checkout_url: paymentSession?.checkoutUrl || '',
    };

    const booking = {
      id: bookingId, 
      rideType: selectedRideType, 
      pickupLocation, 
      dropoffLocation, 
      date: dateToUse, 
      time: timeToUse,
      passengers: parseInt(passengers), 
      vehicleId: selectedVehicle, 
      status: 'pending' as const, 
      specialRequests, 
      estimatedPrice: totalWithPaymentFee || totalBeforePaymentFee,
      tipPercent: selectedTipPercent,
      tipAmount,
      distance: distance.toFixed(1) + ' km', 
      customerName: `${firstName} ${lastName}`.trim(), 
      customerEmail: email, 
      customerPhone: phone,
      createdAt: Timestamp.now(),
      stops: stopsString,
      hours: hours || 'N/A',
      nights: nights || 'N/A',
      paymentMethod: paymentMethod,
      paymentProvider: usesTDBankGateway ? 'td-bank' : 'manual',
      paymentSessionId: paymentSession?.paymentSessionId || null,
      paymentCheckoutUrl: paymentSession?.checkoutUrl || null,
      childSeats: childSeats.length > 0 ? childSeatsString : 'No',
      bulkyLuggage: bulkyLuggage ? 'Yes' : 'No',
      carName: carName,
      userId: user?.uid,
    };

    try {
      await addDoc(collection(db, 'bookings'), booking);

      const checkoutUrl = paymentSession?.checkoutUrl ? normalizeCheckoutUrl(paymentSession.checkoutUrl) : '';

      const didOpenCheckout = usesTDBankGateway && checkoutUrl
        ? await openCheckoutUrl(checkoutUrl)
        : false;

      if (usesTDBankGateway) {
        await AsyncStorage.setItem(getPendingPaymentEmailKey(bookingId), JSON.stringify(emailPayload));
      }

      const paymentCompleted = !usesTDBankGateway || paymentSession?.approved === true;

      if (!paymentCompleted) {
        Alert.alert(
          'Payment Pending',
          didOpenCheckout
            ? 'Complete payment in TD checkout. We will send your confirmation email automatically once TD confirms payment.'
            : 'Your booking was saved, but checkout could not be opened. The confirmation email will only be sent after payment is approved.'
        );
        return;
      }

      const success = await sendBookingEmail(emailPayload as any);

      if (success) {
        const confirmationMessage = 'Dear valued customer,\n\nYour booking has been successfully submitted. We will be in touch shortly to confirm the details. If you have any inquiries or concerns in the meantime, please do not hesitate to contact us at +1 403 467 8100 / +1 403 467 7367. We appreciate your business and look forward to assisting you with your travel arrangements.\n\nBest regards,\nMyroadtrip YYC Travels';

        Alert.alert(
          'Booking Confirmed',
          confirmationMessage,
          [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
        );
      } else {
        Alert.alert('Error', 'Failed to submit booking. Please try again or call us at 403-467-8100.');
      }
    } catch (error) {
      console.error('Error saving booking:', error);
      Alert.alert(
        'Booking Error',
        'There was an error processing your booking. Please try again or call us at 403-467-8100.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderServiceSpecificFields = () => {
    if (selectedRideType === 'long-trip') {
      return (
        <View style={styles.inputContainer}>
          <MaterialIcons name="hotel" size={20} color={theme.colors.gold} />
          <TextInput
            style={styles.input}
            placeholder="Number of Nights (min. 2) *"
            value={nights}
            onChangeText={setNights}
            keyboardType="numeric"
            placeholderTextColor={theme.colors.subText}
          />
          <Text style={styles.feeText}>$150/night</Text>
        </View>
      );
    }

    if (selectedRideType === 'hourly') {
      return (
        <View style={styles.inputContainer}>
          <MaterialIcons name="schedule" size={20} color={theme.colors.gold} />
          <TextInput
            style={styles.input}
            placeholder="Number of Hours (max 24) *"
            value={hours}
            onChangeText={setHours}
            keyboardType="numeric"
            placeholderTextColor={theme.colors.subText}
          />
          <Text style={styles.feeText}>$120/hr</Text>
        </View>
      );
    }

    if (selectedRideType === '8-hours') {
      return (
        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={20} color={theme.colors.gold} />
          <Text style={styles.infoText}>Fixed 8-hour service: $450 (excl. tax)</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.headerText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book a Ride</Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
            <MaterialIcons 
              name={isDark ? "light-mode" : "dark-mode"} 
              size={24} 
              color={theme.colors.headerText} 
            />
          </TouchableOpacity>
          {user ? (
            <>
              <TouchableOpacity onPress={() => signOut()} style={styles.authButton}>
               <Text style={styles.authButtonText}>Logout</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteButton}>
               <Text style={styles.authButtonText}>Delete</Text>
              </TouchableOpacity>
            </>
          ) : (
             <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.authButton}>
                <Text style={styles.authButtonText}>Login</Text>
             </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Service Type</Text>
          <RideTypeSelector
            rideTypes={rideTypes}
            selectedType={selectedRideType}
            onSelect={setSelectedRideType}
          />
        </View>

        {renderServiceSpecificFields()}


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.inputContainer, styles.halfWidth]}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons name="event" size={20} color={theme.colors.gold} />
              <Text style={[styles.input, { color: displayDate ? theme.colors.text : theme.colors.subText }]}>
                {displayDate || 'Select Date *'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.inputContainer, styles.halfWidth, {marginRight: 0}]} 
              onPress={() => setShowTimePicker(true)}
            >
              <MaterialIcons name="access-time" size={20} color={theme.colors.gold} />
              <Text style={[styles.input, { color: displayTime ? theme.colors.text : theme.colors.subText }]}>
                {displayTime || 'Select Time *'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.tripNote}>Note: 1 hour advance booking required.</Text>
          
          {showDatePicker && (
            <DateTimePicker
              value={pickupDateTime}
              mode="date"
              display={Platform.OS === 'ios' ? "spinner" : "default"}
              minimumDate={new Date(Date.now() + 3600000)}
              onChange={onDateChange}
              textColor={theme.colors.text}
              themeVariant={theme.dark ? "dark" : "light"}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={pickupDateTime}
              mode="time"
              display={Platform.OS === 'ios' ? "spinner" : "default"}
              onChange={onTimeChange}
              textColor={theme.colors.text}
              themeVariant={theme.dark ? "dark" : "light"}
            />
          )}
              
          <LocationAutocomplete
            value={pickupLocation}
            onChangeText={setPickupLocation}
            onSelectLocation={setPickupLocation}
            placeholder="Pickup Location *"
            icon="location-on"
          />

          {stops.map((stop, index) => (
            <View key={stop.id} style={styles.stopContainer}>
              <View style={styles.stopRow}>
                <View style={styles.stopAutocompleteContainer}>
                  <LocationAutocomplete
                    value={stop.address}
                    onChangeText={(text) => updateStop(stop.id, text)}
                    onSelectLocation={(location) => updateStopWithCoordinates(stop.id, location)}
                    placeholder={`Stop ${index + 1}`}
                    icon="add-location"
                  />
                </View>
                <TouchableOpacity 
                  style={styles.removeStopButton}
                  onPress={() => removeStop(stop.id)}
                >
                  <MaterialIcons name="close" size={24} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addStop}>
            <MaterialIcons name="add-circle-outline" size={20} color={theme.colors.gold} />
            <Text style={styles.addButtonText}>Add Stop</Text>
          </TouchableOpacity>

          <LocationAutocomplete
            value={dropoffLocation}
            onChangeText={setDropoffLocation}
            onSelectLocation={setDropoffLocation}
            placeholder="Drop-off Location *"
            icon="place"
          />

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

        {pickupCoords && dropoffCoords && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route Map</Text>
            <View style={styles.mapContainer}>
              {Platform.OS === 'web' ? (
                <View style={styles.webMapPlaceholder}>
                  <MaterialIcons name="map" size={48} color={theme.colors.subText} />
                  <Text style={styles.webMapText}>Map view available on mobile</Text>
                  <Text style={styles.webMapSubtext}>
                    Route: {pickupLocation} → {dropoffLocation}
                  </Text>
                </View>
              ) : (
                <MapView
                  style={styles.map}
                  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                  initialRegion={{
                    latitude: CALGARY_COORDS.latitude,
                    longitude: CALGARY_COORDS.longitude,
                    latitudeDelta: 0.5,
                    longitudeDelta: 0.5,
                  }}
                  userInterfaceStyle={theme.dark ? 'dark' : 'light'}
                >

                  <Marker
                    coordinate={CALGARY_COORDS}
                    title="Calgary"
                    pinColor={theme.colors.gold}
                  />
                  <Marker
                    coordinate={pickupCoords}
                    title="Pickup"
                    pinColor="green"
                  />
                  <Marker
                    coordinate={dropoffCoords}
                    title="Drop-off"
                    pinColor="red"
                  />
                  <Polyline
                    coordinates={[
                      pickupCoords, 
                      ...stops.filter(s => s.coordinates).map(s => s.coordinates!), 
                      dropoffCoords
                    ]}
                    strokeColor={theme.colors.text}
                    strokeWidth={3}
                  />
                </MapView>
              )}
            </View>
            <Text style={styles.distanceText}>Total Distance: {distance.toFixed(1)} km</Text>
          </View>
        )}

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
          <Text style={styles.sectionTitle}>Your Information</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <MaterialIcons name="person" size={20} color={theme.colors.gold} />
              <TextInput
                style={styles.input}
                placeholder="First Name *"
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor={theme.colors.subText}
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth, {marginRight: 0}]}>
              <MaterialIcons name="person" size={20} color={theme.colors.gold} />
              <TextInput
                style={styles.input}
                placeholder="Last Name (Optional)"
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor={theme.colors.subText}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="phone" size={20} color={theme.colors.gold} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={theme.colors.subText}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color={theme.colors.gold} />
            <TextInput
              style={styles.input}
              placeholder="Email Address *"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={theme.colors.subText}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Options</Text>
          
          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => {
              if (childSeats.length > 0) {
                setChildSeats([]);
              } else {
                addChildSeat();
              }
            }}
          >
            <View style={styles.toggleSwitch}>
              <View style={[styles.toggleThumb, childSeats.length > 0 && styles.toggleThumbActive]} />
            </View>
            <Text style={styles.toggleText}>Add child seats</Text>
          </TouchableOpacity>

          {childSeats.length > 0 && (
            <>
              <Text style={styles.subTitle}>Child Seats (0-6 years)</Text>
              {childSeats.map((seat, index) => (
                <View key={seat.id} style={styles.stopContainer}>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="child-care" size={20} color={theme.colors.gold} />
                    <TextInput
                      style={styles.input}
                      placeholder={`Child ${index + 1} Age`}
                      value={seat.age}
                      onChangeText={(text) => updateChildSeat(seat.id, text)}
                      keyboardType="numeric"
                      placeholderTextColor={theme.colors.subText}
                    />
                    <TouchableOpacity onPress={() => removeChildSeat(seat.id)}>
                      <MaterialIcons name="close" size={20} color={theme.colors.subText} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addButton} onPress={addChildSeat}>
                <MaterialIcons name="add-circle-outline" size={20} color={theme.colors.gold} />
                <Text style={styles.addButtonText}>Add Another Child Seat</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => setBulkyLuggage(!bulkyLuggage)}
          >
            <View style={styles.toggleSwitch}>
              <View style={[styles.toggleThumb, bulkyLuggage && styles.toggleThumbActive]} />
            </View>
            <Text style={styles.toggleText}>Bulky Luggage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => setShowNotes(!showNotes)}
          >
            <View style={styles.toggleSwitch}>
              <View style={[styles.toggleThumb, showNotes && styles.toggleThumbActive]} />
            </View>
            <Text style={styles.toggleText}>Add notes for the driver</Text>
          </TouchableOpacity>

          {showNotes && (
            <View style={styles.notesContainer}>
              <Text style={styles.subTitle}>Other comments and requests (Optional)</Text>
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
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promo Code (Optional)</Text>
          <View style={styles.promoContainer}>
            <View style={[styles.inputContainer, styles.promoInputContainer]}>
              <MaterialIcons name="local-offer" size={20} color={theme.colors.gold} />
              <TextInput
                style={styles.input}
                placeholder="Enter promo code"
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
                placeholderTextColor={theme.colors.subText}
              />
            </View>
            <TouchableOpacity style={styles.applyButton} onPress={applyPromoCode}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Summary</Text>
          <View style={styles.pricingCard}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Distance (estimated):</Text>
              <Text style={styles.pricingValue}>{distance.toFixed(1)} km</Text>
            </View>
            {pricing.distanceFee > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Distance Fee:</Text>
                <Text style={styles.pricingValue}>${pricing.distanceFee.toFixed(2)}</Text>
              </View>
            )}
            {pricing.hourlyFee > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Hourly Rental Fee:</Text>
                <Text style={styles.pricingValue}>${pricing.hourlyFee.toFixed(2)}</Text>
              </View>
            )}
            {pricing.longTripFee > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Driver Accommodation Fee:</Text>
                <Text style={styles.pricingValue}>${pricing.longTripFee.toFixed(2)}</Text>
              </View>
            )}
            {pricing.airportTax > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Airport Tax:</Text>
                <Text style={styles.pricingValue}>${pricing.airportTax.toFixed(2)}</Text>
              </View>
            )}
            {pricing.discount > 0 && (
              <View style={styles.pricingRow}>
                <Text style={[styles.pricingLabel, styles.discountText]}>Discount:</Text>
                <Text style={[styles.pricingValue, styles.discountText]}>-${pricing.discount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Balance:</Text>
              <Text style={styles.pricingValue}>${(pricing.subtotal - pricing.discount).toFixed(2)}</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Tax (5%):</Text>
              <Text style={styles.pricingValue}>${pricing.tax.toFixed(2)}</Text>
            </View>
            <View style={styles.tipSection}>
              <Text style={styles.tipTitle}>Driver Tip</Text>
              <View style={styles.tipOptionsRow}>
                {(['15', '20', '25', 'custom', 'none'] as TipOption[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.tipOptionButton, tipOption === option && styles.tipOptionButtonActive]}
                    onPress={() => setTipOption(option)}
                  >
                    <Text style={[styles.tipOptionText, tipOption === option && styles.tipOptionTextActive]}>
                      {option === 'none' ? 'No Tip' : option === 'custom' ? 'Custom' : `${option}%`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {tipOption === 'custom' && (
                <View style={styles.inputContainer}>
                  <MaterialIcons name="attach-money" size={20} color={theme.colors.gold} />
                  <TextInput
                    style={styles.input}
                    placeholder="Custom tip $"
                    value={customTipAmountInput}
                    onChangeText={setCustomTipAmountInput}
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.subText}
                  />
                </View>
              )}
            </View>
            {tipAmount > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>{tipOption === 'custom' ? 'Tip:' : `Tip (${selectedTipPercent.toFixed(0)}%):`}</Text>
                <Text style={styles.pricingValue}>${tipAmount.toFixed(2)}</Text>
              </View>
            )}
            {paymentFee > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Credit Card Fee (2.5%):</Text>
                <Text style={styles.pricingValue}>${paymentFee.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.pricingRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Estimated Total:</Text>
              <Text style={styles.totalValue}>${(totalWithPaymentFee || totalBeforePaymentFee).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity 
            style={styles.inputContainer}
            onPress={() => setShowPaymentDropdown(!showPaymentDropdown)}
          >
            <MaterialIcons name="payment" size={20} color={theme.colors.gold} />
            <Text style={[styles.input, !paymentMethod && { color: theme.colors.subText }]}>
              {paymentMethod || 'Select payment method *'}
            </Text>
            <MaterialIcons name={showPaymentDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={24} color={theme.colors.subText} />
          </TouchableOpacity>
          
          {showPaymentDropdown && (
            <View style={styles.dropdownList}>
              {PAYMENT_METHOD_OPTIONS.map((method) => (
                <TouchableOpacity 
                  key={method} 
                  style={styles.dropdownItem}
                  onPress={() => {
                    setPaymentMethod(method);
                    setShowPaymentDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{method}</Text>
                  {paymentMethod === method && (
                    <MaterialIcons name="check" size={20} color={theme.colors.gold} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          <Text style={styles.paymentHint}>Card payments are processed through TD Bank secure checkout.</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.termsContainer}>
            <TouchableOpacity onPress={() => setTermsAccepted(!termsAccepted)} style={styles.termsCheckboxRow}>
              <MaterialIcons name={termsAccepted ? 'check-box' : 'check-box-outline-blank'} size={20} color={termsAccepted ? theme.colors.gold : theme.colors.subText} />
              <Text style={styles.termsText}>I agree to the </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
                <Text style={styles.termsLink}>Terms & Conditions</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.bookButton, !termsAccepted && styles.bookButtonDisabled]}
            onPress={handleBooking}
            activeOpacity={0.8}
            disabled={!termsAccepted}
          >
            <MaterialIcons name="check-circle" size={24} color={theme.colors.white} />
            <Text style={styles.bookButtonText}>Complete Booking</Text>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeButton: {
    padding: SPACING.sm,
  },
  authButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.gold,
    marginLeft: 8,
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.error,
    marginLeft: 8,
  },
  authButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 14,
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
  section: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: SPACING.md,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
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
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stopAutocompleteContainer: {
    flex: 1,
  },
  removeStopButton: {
    marginLeft: SPACING.sm,
    marginTop: SPACING.sm,
    padding: SPACING.xs,
  },
  input: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 16,
    color: theme.colors.text,
  },
  feeText: {
    fontSize: 12,
    color: theme.colors.gold,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%', 
    marginRight: SPACING.md,
  },
  stopContainer: {
    marginBottom: SPACING.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  addButtonText: {
    marginLeft: SPACING.sm,
    color: theme.colors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  toggleSwitch: {
    width: 60,
    height: 34,
    backgroundColor: theme.colors.border,
    borderRadius: 17,
    padding: 4,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    backgroundColor: theme.colors.card,
    borderRadius: 13,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    backgroundColor: theme.colors.gold,
    alignSelf: 'flex-end',
  },
  toggleText: {
    marginLeft: SPACING.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  notesContainer: {
    marginTop: SPACING.sm,
  },
  infoBox: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoText: {
    marginLeft: SPACING.sm,
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  map: {
    flex: 1,
  },
  webMapPlaceholder: {
    flex: 1,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  webMapText: {
    fontSize: 16,
    color: theme.colors.text,
    marginTop: SPACING.md,
    fontWeight: '600',
  },
  webMapSubtext: {
    fontSize: 14,
    color: theme.colors.subText,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  promoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  promoInputContainer: {
    flex: 1,
    marginBottom: 0,
    marginRight: SPACING.sm,
  },
  applyButton: {
    backgroundColor: theme.colors.gold,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
  },
  applyButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  promoHint: {
    fontSize: 12,
    color: theme.colors.subText,
    marginTop: SPACING.xs,
  },
  paymentHint: {
    fontSize: 12,
    color: theme.colors.subText,
    marginTop: -SPACING.sm,
  },
  pricingCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  tipSection: {
    marginBottom: SPACING.sm,
  },
  tipTitle: {
    fontSize: 18,
    color: theme.colors.subText,
    marginBottom: SPACING.xs,
    fontWeight: '800',
  },
  tipOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  tipOptionButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
    minWidth: 86,
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
  },
  tipOptionButtonActive: {
    borderColor: theme.colors.gold,
    backgroundColor: theme.colors.gold,
  },
  tipOptionText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  tipOptionTextActive: {
    color: theme.colors.white,
  },
  tripNote: {
    color: theme.colors.error,
    fontSize: 15,
    fontWeight: '800',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  pricingLabel: {
    fontSize: 14,
    color: theme.colors.subText,
  },
  pricingValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  discountText: {
    color: theme.colors.gold,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: SPACING.sm,
    marginTop: SPACING.sm,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.gold,
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
  bookButton: {
    backgroundColor: theme.colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 12,
  },
  bookButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.7,
  },
  bookButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  
  termsContainer: {
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  termsCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsText: {
    marginLeft: 8,
    color: theme.colors.text,
    fontSize: 14,
  },
  termsLink: {
    color: theme.colors.primary,
    fontWeight: '700',
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
  dropdownList: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    marginTop: -SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemText: {
    fontSize: 16,
    color: theme.colors.text,
  },
});