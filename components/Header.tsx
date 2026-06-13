import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SPACING } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
}

export default function Header({ title, showBack, onBackPress }: HeaderProps) {
  const { theme, toggleTheme, isDark } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.headerText} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
        <MaterialIcons 
          name={isDark ? "light-mode" : "dark-mode"} 
          size={24} 
          color={theme.colors.headerText} 
        />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: theme.colors.header,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeButton: {
    padding: SPACING.sm,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.headerText,
  },
});