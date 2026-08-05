import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useTranslation } from 'react-i18next';
import Input from '../../components/Input';
import Button from '../../components/Button';
import SegmentedToggle from '../../components/SegmentedToggle';
import { showAlert } from '../../components/AppAlert';
import { useUserContext } from '../../context/UserProvider';
import { mapAuthError } from '../../utils/authErrors';
import { colors, spacing, fontSize, fontWeight } from '../../theme/tokens';

export default function Login({ navigation }) {
  const { t } = useTranslation();
  const { signIn } = useUserContext();
  const [method, setMethod] = useState('phone');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!identifier || !password) {
      showAlert(t('auth.signInError'), method === 'phone' ? t('auth.invalidPhone') : t('auth.invalidEmail'));
      return;
    }
    setLoading(true);
    try {
      await signIn({ method, identifier, password });
      // RootNavigator reacts to the auth-state change and switches screens automatically.
    } catch (err) {
      showAlert(t('auth.signInError'), mapAuthError(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t('auth.welcome')}</Text>
        <Text style={styles.subtitle}>{t('auth.appName')}</Text>

        <SegmentedToggle
          style={styles.toggle}
          value={method}
          onChange={setMethod}
          options={[
            { value: 'phone', label: t('auth.loginWithPhone') },
            { value: 'email', label: t('auth.loginWithEmail') },
          ]}
        />

        {method === 'phone' ? (
          <Input
            label={t('auth.phoneLabel')}
            placeholder={t('auth.phonePlaceholder')}
            keyboardType="phone-pad"
            autoCapitalize="none"
            value={identifier}
            onChangeText={setIdentifier}
          />
        ) : (
          <Input
            label={t('auth.emailLabel')}
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            value={identifier}
            onChangeText={setIdentifier}
          />
        )}

        <Input
          label={t('auth.passwordLabel')}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button title={t('auth.signIn')} onPress={handleSignIn} loading={loading} style={styles.signInButton} />

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>{t('auth.forgotPassword')}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.noAccount')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.footerLink}>{t('auth.signUp')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
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
    paddingTop: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.inkMuted,
    marginBottom: spacing.lg,
  },
  toggle: {
    marginBottom: spacing.lg,
  },
  signInButton: {
    marginTop: spacing.sm,
  },
  link: {
    textAlign: 'center',
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  footerText: {
    color: colors.inkMuted,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
});
