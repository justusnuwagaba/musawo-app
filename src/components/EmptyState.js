import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { colors, spacing, fontSize, fontWeight } from '../theme/tokens';

export default function EmptyState({ icon = 'sparkles-outline', title, message }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Icon name={icon} size={32} color={colors.primary} />
      </View>
      {!!title && <Text style={styles.title}>{title}</Text>}
      {!!message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
