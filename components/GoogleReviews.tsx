import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, COLORS } from '../utils/constants';

const REVIEWS = [
  { id: '1', name: 'Sogol Malek', rating: 5, text: 'Ricky was very professional and punctual. He arrived on time, drove safely, and made the whole ride smooth and stress-free. Highly recommend him as a reliable driver. Thank you, Ricky!', time: '1 month ago' },
  { id: '2', name: 'Julie D', rating: 5, text: 'Fantastic experience. Great service, safe driving, comfortable cars. Would recommend to anyone looking for trips around Calgary and beyond.', time: '2 weeks ago' },
  { id: '3', name: 'Dan Omoigui', rating: 5, text: 'Fantastic service in luxury vehicles. I found this service to be excellent for shuttles to and from the airport. Ricky was always on-time for pickups and was a reliable driver.', time: '2 months ago' },
  { id: '4', name: 'Jon Utton', rating: 5, text: 'Beautiful fleet of vehicles. Always clean and on time. Conversations (if wanted) are pleasant. Certainly more comfortable and professional than Uber or Lyft. You won’t be disappointed.', time: '3 months ago' },
];

export default function GoogleReviews() {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const handleReviewPress = () => {
    Linking.openURL('https://www.google.com/search?newwindow=1&client=firefox-b-d&hs=BqJp&q=Myroadtrip+YYC+Travels+Reviews&sa=X&ved=2ahUKEwjozobd_MuSAxWMxzgGHclgHTsQ0bkNegQIJRAH&biw=1280&bih=587&dpr=1.5');
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <FontAwesome name="google" size={24} color={theme.colors.text} style={{marginRight: 10}} />
        <Text style={styles.sectionTitle}>Reviews</Text>
      </View>
      <Text style={styles.subtitle}>Myroadtrip YYC Travels</Text>
      
      <TouchableOpacity style={styles.writeReviewButton} onPress={handleReviewPress}>
        <MaterialIcons name="rate-review" size={18} color={theme.colors.headerText} style={{marginRight: 8}} />
        <Text style={styles.writeReviewText}>Write a Review</Text>
      </TouchableOpacity>

      <View style={styles.ratingOverview}>
         <Text style={styles.ratingNumber}>5.0</Text>
         <View style={styles.stars}>
            {[...Array(5)].map((_, i) => (
                <MaterialIcons key={i} name="star" size={18} color="#fbbc04" />
            ))}
         </View>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {REVIEWS.map((review) => (
          <TouchableOpacity key={review.id} style={styles.card} onPress={handleReviewPress} activeOpacity={0.8}>
             <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{review.name.charAt(0)}</Text>
                </View>
                <View>
                    <Text style={styles.reviewerName}>{review.name}</Text>
                    <Text style={styles.reviewTime}>{review.time}</Text>
                </View>
             </View>
             <View style={styles.stars}>
                {[...Array(review.rating)].map((_, i) => (
                    <MaterialIcons key={i} name="star" size={14} color="#fbbc04" />
                ))}
             </View>
             <Text style={styles.reviewText} numberOfLines={4}>{review.text}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  section: {
    padding: SPACING.lg,
    backgroundColor: theme.colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.subText,
    marginBottom: SPACING.md,
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  ratingNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginRight: 8,
  },
  scrollContent: {
    paddingBottom: SPACING.sm,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: SPACING.md,
    width: 280,
    marginRight: SPACING.md,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  reviewTime: {
    fontSize: 12,
    color: theme.colors.subText,
  },
  stars: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  reviewText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
  },
  writeReviewText: {
    color: theme.colors.headerText,
    fontWeight: '600',
    fontSize: 14,
  },
});
