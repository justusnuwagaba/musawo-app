import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button';
import { colors, spacing, fontSize, fontWeight } from '../../theme/tokens';

export default function SplashScreen({ navigation }) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Image source={require('../../../assets/Musawo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>{t('auth.appName')}</Text>
        <Text style={styles.tagline}>{t('auth.tagline')}</Text>
      </View>

      <View style={styles.actions}>
        <Button title={t('auth.signIn')} onPress={() => navigation.navigate('Login')} />
        <Button
          title={t('auth.signUp')}
          variant="outline"
          onPress={() => navigation.navigate('SignUp')}
          style={styles.secondaryButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  tagline: {
    fontSize: fontSize.md,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  secondaryButton: {
    marginTop: spacing.md,
  },
});
