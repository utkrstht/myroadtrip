import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RideType } from '../types';
import { SPACING } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';

interface RideTypeSelectorProps {
  rideTypes: RideType[];
  selectedType?: string;
  onSelect: (typeId: string) => void;
}

const iconMap: { [key: string]: keyof typeof MaterialIcons.glyphMap } = {
  airplane: 'flight',
  calendar: 'event',
  map: 'map',
  time: 'schedule',
};

export default function RideTypeSelector({ rideTypes, selectedType, onSelect }: RideTypeSelectorProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {rideTypes.map((type) => {
        const isSelected = selectedType === type.id;
        return (
          <TouchableOpacity
            key={type.id}
            style={[styles.card, isSelected && styles.selectedCard]}
            onPress={() => onSelect(type.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
              <MaterialIcons
                name={iconMap[type.icon] || 'local-taxi'}
                size={32}
                color={isSelected ? '#ffffff' : theme.colors.gold}
              />
            </View>
            <Text style={[styles.title, isSelected && styles.selectedTitle]}>{type.title}</Text>
            <Text style={[styles.description, isSelected && styles.selectedDescription]}>
              {type.description}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginRight: SPACING.md,
    width: 160,
    borderWidth: 2,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.gold,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  selectedIconContainer: {
    backgroundColor: theme.colors.gold,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  selectedTitle: {
    color: '#ffffff',
  },
  description: {
    fontSize: 12,
    color: theme.colors.subText,
    lineHeight: 16,
  },
  selectedDescription: {
    color: '#ffffff',
  },
});