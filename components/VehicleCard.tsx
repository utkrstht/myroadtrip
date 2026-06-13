import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Vehicle } from '../types';
import { COLORS, SPACING } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';

const SUV_ICON_SOURCE = require('../assets/images/suv-icon.png');

interface VehicleCardProps {
  vehicle: Vehicle;
  selected?: boolean;
  onSelect?: () => void;
}

export default function VehicleCard({ vehicle, selected, onSelect }: VehicleCardProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const getIconName = (name: string): any => {
    switch (name) {
      case 'local-taxi': return 'local-taxi';
      case 'pets': return 'pets';
      case 'airport-shuttle': return 'airport-shuttle';
      case 'directions-bus': return 'directions-bus';
      case 'local-shipping': return 'local-shipping';
      case 'car-estate': return 'car-estate';
      case 'car-suv': return 'car-suv';
      case 'car-off-road': return 'car-off-road';
      case 'car-pickup': return 'car-pickup';
      case 'jeep': return 'jeep';
      default: return 'directions-car';
    }
  };

  const isCommunityIcon = (name: string) => ['car-estate', 'car-suv', 'car-off-road', 'car-pickup', 'jeep'].includes(name);
  const isCustomIcon = (name: string) => name === 'suv-custom';

  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.selected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {isCustomIcon(vehicle.icon) ? (
          <Image 
            source={SUV_ICON_SOURCE} 
            style={styles.customIcon} 
            resizeMode="contain" 
          />
        ) : isCommunityIcon(vehicle.icon) ? (
          <MaterialCommunityIcons 
            name={getIconName(vehicle.icon)} 
            size={40} 
            color={selected ? theme.colors.gold : theme.colors.text} 
          />
        ) : (
          <MaterialIcons 
            name={getIconName(vehicle.icon)} 
            size={40} 
            color={selected ? theme.colors.gold : theme.colors.text} 
          />
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.headerRow}>
             <View style={styles.titleRow}>
                <Text style={styles.name}>{vehicle.name}</Text>
                {vehicle.capacity > 0 && (
                    <View style={styles.capacityBadge}>
                        <MaterialIcons name="person" size={14} color={theme.colors.subText} />
                        <Text style={styles.capacityText}>{vehicle.capacity}</Text>
                    </View>
                )}
             </View>
        </View>

        <Text style={styles.description}>{vehicle.description}</Text>
      
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selected: {
    borderColor: theme.colors.gold,
    backgroundColor: theme.colors.background,
  },
  iconContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  customIcon: {
    width: 54,
    height: 54,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginRight: 8,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  capacityText: {
    fontSize: 12,
    color: theme.colors.subText,
    marginLeft: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  description: {
    fontSize: 14,
    color: theme.colors.subText,
    marginTop: 2,
  },
  subDetail: {
    fontSize: 12,
    color: theme.colors.subText,
    marginTop: 2,
    fontStyle: 'italic',
  },
  vehicleImage: { width: 0, height: 0, display: 'none' }, // hidden
  capacity: { display: 'none' }, 
  featureBadge: { display: 'none' },
  featuresContainer: { display: 'none' },
  checkmark: { display: 'none' }
});
