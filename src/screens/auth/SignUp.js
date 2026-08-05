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

export default function SignUp({ navigation }) {
  const { t } = useTranslation();
  const { signUp } = useUserContext();
  const [method, setMethod] = useState('phone');
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName.trim()) {
      showAlert(t('auth.signUpError'), t('auth.nameRequired'));
      return;
    }
    if (password.length < 6) {
      showAlert(t('auth.signUpError'), t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      showAlert(t('auth.signUpError'), t('auth.passwordsDontMatch'));
      return;
    }

    setLoading(true);
    try {
      await signUp({ method, identifier, password, displayName: fullName.trim() });
      // RootNavigator reacts to the auth-state change and switches screens automatically.
    } catch (err) {
      showAlert(t('auth.signUpError'), mapAuthError(err, t, 'auth.signUpError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t('auth.signUp')}</Text>
        <Text style={styles.subtitle}>{t('auth.appName')}</Text>

        <Input
          label={t('auth.fullNameLabel')}
          placeholder={t('auth.namePlaceholder')}
          value={fullName}
          onChangeText={setFullName}
        />

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

        <Input label={t('auth.passwordLabel')} secureTextEntry value={password} onChangeText={setPassword} />
        <Input
          label={t('auth.confirmPasswordLabel')}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Button title={t('auth.signUp')} onPress={handleSignUp} loading={loading} style={styles.signUpButton} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.haveAccount')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>{t('auth.signIn')}</Text>
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
  signUpButton: {
    marginTop: spacing.sm,
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
