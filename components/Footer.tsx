import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../utils/constants';

export default function Footer() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Serving Calgary & Nearby Regions (only)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.gold,
  },
  text: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  devText: {
    color: COLORS.gold,
    fontSize: 12,
    marginTop: SPACING.xs,
    opacity: 0.8,
  },
});
