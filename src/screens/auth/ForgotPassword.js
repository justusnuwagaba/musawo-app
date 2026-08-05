import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/Ionicons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import SegmentedToggle from '../../components/SegmentedToggle';
import { showAlert } from '../../components/AppAlert';
import { useUserContext } from '../../context/UserProvider';
import { mapAuthError } from '../../utils/authErrors';
import { colors, spacing, radii, fontSize, fontWeight } from '../../theme/tokens';

export default function ForgotPassword({ navigation }) {
  const { t } = useTranslation();
  const { resetPasswordByEmail } = useUserContext();
  const [method, setMethod] = useState('email');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendReset = async () => {
    setLoading(true);
    try {
      await resetPasswordByEmail(identifier);
      setSent(true);
    } catch (err) {
      showAlert(t('auth.resetTitle'), mapAuthError(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t('auth.resetTitle')}</Text>

        <SegmentedToggle
          style={styles.toggle}
          value={method}
          onChange={(v) => {
            setMethod(v);
            setSent(false);
          }}
          options={[
            { value: 'email', label: t('auth.loginWithEmail') },
            { value: 'phone', label: t('auth.loginWithPhone') },
          ]}
        />

        {method === 'email' ? (
          <>
            <Text style={styles.instructions}>{t('auth.resetEmailInstructions')}</Text>
            <Input
              label={t('auth.emailLabel')}
              placeholder={t('auth.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
            />
            {sent ? (
              <View style={styles.sentBox}>
                <Icon name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.sentText}>{t('auth.resetLinkSent')}</Text>
              </View>
            ) : (
              <Button title={t('auth.sendResetLink')} onPress={handleSendReset} loading={loading} />
            )}
          </>
        ) : (
          <View style={styles.contactBox}>
            <Icon name="information-circle-outline" size={20} color={colors.info} />
            <Text style={styles.contactText}>{t('auth.resetPhoneInstructions')}</Text>
          </View>
        )}

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>{t('common.back')}</Text>
        </TouchableOpacity>
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
    marginBottom: spacing.lg,
  },
  toggle: {
    marginBottom: spacing.lg,
  },
  instructions: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  sentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  sentText: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.ink,
    fontSize: fontSize.sm,
  },
  contactBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.infoLight,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  contactText: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.ink,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  link: {
    textAlign: 'center',
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xxl,
  },
});
