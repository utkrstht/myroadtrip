import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SPACING } from '../utils/constants';
import { getPlaceAutocomplete, PlacePrediction } from '../utils/geocoding';
import { useTheme } from '../context/ThemeContext';

interface LocationAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectLocation: (location: string) => void;
  placeholder: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

export default function LocationAutocomplete({
  value,
  onChangeText,
  onSelectLocation,
  placeholder,
  icon = 'location-on',
}: LocationAutocompleteProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);

  useEffect(() => {
    const fetchPredictions = async () => {
      if (value.length >= 3) {
        const results = await getPlaceAutocomplete(value);
        setPredictions(results);
        setShowPredictions(true);
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    };

    const timeoutId = setTimeout(fetchPredictions, 300);
    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleSelect = (prediction: PlacePrediction) => {
    onSelectLocation(prediction.description);
    onChangeText(prediction.description);
    setShowPredictions(false);
    setPredictions([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <MaterialIcons name={icon} size={20} color={theme.colors.gold} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={theme.colors.subText}
        />
      </View>
      {showPredictions && predictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          <ScrollView
            style={styles.predictionsList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {predictions.map((item) => (
              <TouchableOpacity
                key={item.place_id}
                style={styles.predictionItem}
                onPress={() => handleSelect(item)}
              >
                <MaterialIcons name="place" size={20} color={theme.colors.subText} />
                <Text style={styles.predictionText}>{item.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    zIndex: 1000,
  },
  inputContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 16,
    color: theme.colors.text,
  },
  predictionsContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  predictionsList: {
    maxHeight: 200,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  predictionText: {
    marginLeft: SPACING.sm,
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
});
