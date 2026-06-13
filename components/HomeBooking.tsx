import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING } from '../utils/constants';
import LocationAutocomplete from './LocationAutocomplete';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CALGARY_COORDS, Location } from '../utils/distanceCalculator';

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

interface HomeBookingProps {
  navigation: any;
}

export default function HomeBooking({ navigation }: HomeBookingProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [returnTrip, setReturnTrip] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  
  const [comment, setComment] = useState('');
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 
                               date.getHours(), date.getMinutes());
      setDate(newDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const newTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                               selectedTime.getHours(), selectedTime.getMinutes());
      setDate(newTime);
    }
  };

  const handleReserve = () => {
    if (!pickup || !dropoff) {
      Alert.alert('Missing Location', 'Please enter pickup and drop-off locations.');
      return;
    }

    navigation.navigate('Booking', {
      initialPickup: pickup,
      initialDropoff: dropoff,
      initialDate: date.toISOString(),
      passengers: (adults + children).toString(),
      initialComment: comment,
      initialPromo: '',
    });
  };

  const increment = (setter: any, value: number) => setter(value + 1);
  const decrement = (setter: any, value: number) => setter(Math.max(0, value - 1));

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
         {Platform.OS === 'web' || !MapView ? (
            <View style={styles.mapPlaceholder}>
              <MaterialIcons name="map" size={48} color={theme.colors.subText} />
              <Text style={styles.mapText}>Map Preview</Text>
            </View>
          ) : (
            <MapView
              style={styles.map}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              initialRegion={{
                latitude: CALGARY_COORDS.latitude,
                longitude: CALGARY_COORDS.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
              userInterfaceStyle={theme.dark ? 'dark' : 'light'}
            />
          )}
      </View>
      
      <View style={styles.formContainer}>
        <Text style={styles.label}>Where to?</Text>
        <LocationAutocomplete
            value={pickup}
            onChangeText={setPickup}
            onSelectLocation={setPickup}
            placeholder="From - Address, Airport, Hotel"
            icon="my-location"
        />
        <View style={{height: 10}} />
        <LocationAutocomplete
            value={dropoff}
            onChangeText={setDropoff}
            onSelectLocation={setDropoff}
            placeholder="To - Address, Airport, Hotel"
            icon="location-on"
        />

        <View style={styles.row}>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
                <MaterialIcons name="event" size={20} color={theme.colors.primary} />
                <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowTimePicker(true)}>
                <MaterialIcons name="schedule" size={20} color={theme.colors.primary} />
                <Text style={styles.dateText}>{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
            </TouchableOpacity>
        </View>

        {showDatePicker && (
            <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} minimumDate={new Date(Date.now() + 3600000)} />
        )}
        {showTimePicker && (
            <DateTimePicker value={date} mode="time" display="default" onChange={onTimeChange} />
        )}

        <TouchableOpacity style={styles.checkboxRow} onPress={() => setReturnTrip(!returnTrip)}>
             <MaterialIcons name={returnTrip ? "check-box" : "check-box-outline-blank"} size={24} color={theme.colors.primary} />
             <Text style={styles.checkboxLabel}>Return way</Text>
        </TouchableOpacity>

        <View style={styles.passengerRow}>
            <View style={styles.passengerControl}>
                <Text style={styles.passengerLabel}>Adults</Text>
                <View style={styles.counter}>
                    <TouchableOpacity onPress={() => decrement(setAdults, adults)}><MaterialIcons name="remove-circle-outline" size={24} color={theme.colors.primary}/></TouchableOpacity>
                    <Text style={styles.countText}>{adults}</Text>
                    <TouchableOpacity onPress={() => increment(setAdults, adults)}><MaterialIcons name="add-circle-outline" size={24} color={theme.colors.primary}/></TouchableOpacity>
                </View>
            </View>
            <View style={styles.passengerControl}>
                <Text style={styles.passengerLabel}>Children</Text>
                 <View style={styles.counter}>
                    <TouchableOpacity onPress={() => decrement(setChildren, children)}><MaterialIcons name="remove-circle-outline" size={24} color={theme.colors.primary}/></TouchableOpacity>
                    <Text style={styles.countText}>{children}</Text>
                    <TouchableOpacity onPress={() => increment(setChildren, children)}><MaterialIcons name="add-circle-outline" size={24} color={theme.colors.primary}/></TouchableOpacity>
                </View>
            </View>
        </View>

        <View style={styles.inputContainer}>
             <TextInput
                style={styles.input}
                placeholder="Comment - Add Note to Driver"
                value={comment}
                onChangeText={setComment}
                placeholderTextColor={theme.colors.subText}
             />
        </View>

        <TouchableOpacity style={styles.reserveButton} onPress={handleReserve}>
            <Text style={styles.reserveButtonText}>Reserve Now</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card, 
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    margin: SPACING.lg,
    marginTop: -40,
  },
  mapContainer: {
    height: 150,
    width: '100%',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e6e6e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    color: '#999',
    marginTop: 8,
  },
  formContainer: {
    padding: SPACING.md,
  },
  label: {
     fontSize: 16,
     fontWeight: 'bold',
     color: theme.colors.text,
     marginBottom: SPACING.sm,
  },
  row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: SPACING.md,
  },
  dateInput: {
      flex: 0.48,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.inputBackground,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
  },
  dateText: {
      marginLeft: 8,
      color: theme.colors.text,
  },
  checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: SPACING.md,
  },
  checkboxLabel: {
      marginLeft: 8,
      color: theme.colors.text,
      fontSize: 14,
  },
  passengerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: SPACING.md,
      paddingVertical: SPACING.sm,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
  },
  passengerControl: {
      alignItems: 'center',
  },
  passengerLabel: {
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
  },
  counter: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  countText: {
      marginHorizontal: 12,
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
  },
  inputContainer: {
      marginTop: SPACING.md,
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: SPACING.sm,
  },
  input: {
      color: theme.colors.text,
      padding: 4,
  },
  reserveButton: {
      backgroundColor: theme.colors.gold,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: SPACING.lg,
  },
  reserveButtonText: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: 18,
  },
});
