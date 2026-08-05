import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, radii, fontSize, fontWeight } from '../theme/tokens';

const SIZES = { sm: 36, md: 52, lg: 88 };

function initialsFrom(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

export default function Avatar({ name, photoURL, size = 'md', style }) {
  const dimension = SIZES[size] ?? SIZES.md;

  if (photoURL) {
    return (
      <Image
        source={{ uri: photoURL }}
        style={[{ width: dimension, height: dimension, borderRadius: dimension / 2 }, style]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: dimension * 0.38 }]}>{initialsFrom(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
});
