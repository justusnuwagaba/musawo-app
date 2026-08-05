import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { colors, spacing } from '../theme/tokens';

const STARS = [1, 2, 3, 4, 5];

/** Row of 5 stars. Pass onChange for an interactive picker; omit it for read-only display. */
export default function StarRating({ value = 0, onChange, size = 28, style }) {
  const readOnly = !onChange;
  return (
    <View style={[styles.row, style]}>
      {STARS.map((star) => {
        const filled = star <= value;
        const Wrapper = readOnly ? View : TouchableOpacity;
        return (
          <Wrapper key={star} onPress={readOnly ? undefined : () => onChange(star)} style={styles.starButton}>
            <Icon name={filled ? 'star' : 'star-outline'} size={size} color={colors.warning} />
          </Wrapper>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  starButton: {
    marginRight: spacing.xs,
  },
});
