import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight } from '../../theme/tokens';

export default function AboutUsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image source={require('../../../assets/Musawo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.header}>About Musawo</Text>
        <Text style={styles.paragraph}>
          Musawo connects patients across Uganda and East Africa with doctors who have been verified by our
          reviewers — so you can find and consult a trusted doctor from wherever you are, in the language you're
          most comfortable with.
        </Text>
        <Text style={styles.paragraph}>
          Every doctor on Musawo goes through a verification review before they can see patients, so you can book
          with confidence.
        </Text>
        <Text style={styles.copyright}>© Musawo App</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: spacing.lg,
  },
  header: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  paragraph: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginBottom: spacing.md,
    lineHeight: 22,
    textAlign: 'center',
  },
  copyright: {
    fontSize: fontSize.xs,
    color: colors.inkFaint,
    marginTop: spacing.lg,
  },
});
