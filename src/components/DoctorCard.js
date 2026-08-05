import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import Avatar from './Avatar';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../theme/tokens';

export default function DoctorCard({ doctor, distanceLabel, onPress, isFavorite, onToggleFavorite }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Avatar name={doctor.displayName} photoURL={doctor.photoURL} size="md" />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{doctor.displayName || 'Doctor'}</Text>
          {doctor.isOnline && <View style={styles.onlineDot} />}
        </View>
        <Text style={styles.specialty} numberOfLines={1}>{doctor.specialty || 'General Practitioner'}</Text>
        <View style={styles.metaRow}>
          {!!doctor.rating && (
            <View style={styles.metaItem}>
              <Icon name="star" size={13} color={colors.warning} />
              <Text style={styles.metaText}>{doctor.rating.toFixed(1)}</Text>
            </View>
          )}
          {!!distanceLabel && (
            <View style={styles.metaItem}>
              <Icon name="location-outline" size={13} color={colors.inkMuted} />
              <Text style={styles.metaText}>{distanceLabel}</Text>
            </View>
          )}
        </View>
      </View>
      {onToggleFavorite && (
        <TouchableOpacity onPress={onToggleFavorite} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.favoriteButton}>
          <Icon name={isFavorite ? 'heart' : 'heart-outline'} size={20} color={isFavorite ? colors.accent : colors.inkFaint} />
        </TouchableOpacity>
      )}
      <Icon name="chevron-forward" size={20} color={colors.inkFaint} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    flexShrink: 1,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary, // the doctor's own state, as seen by the patient — cyan, not green
    marginLeft: spacing.xs,
  },
  specialty: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    marginLeft: 4,
  },
  favoriteButton: {
    marginRight: spacing.sm,
  },
});
