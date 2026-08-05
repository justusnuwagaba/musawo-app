import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useUserContext } from '../../context/UserProvider';
import SpecialtyChip from '../../components/SpecialtyChip';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';
import { PATIENT_ROUTES } from '../../navigation/routes';

export default function SettingsScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const LANGUAGES = [
    { value: 'en', label: t('settings.english') },
    { value: 'lg', label: t('settings.luganda') },
    { value: 'sw', label: t('settings.swahili') },
  ];
  const { profile, updateProfile } = useUserContext();
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notificationsEnabled !== false);

  const toggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    try {
      await updateProfile({ notificationsEnabled: value });
    } catch (err) {
      console.error('[SettingsScreen] toggle error:', err);
    }
  };

  const changeLanguage = async (lang) => {
    i18n.changeLanguage(lang);
    try {
      await updateProfile({ preferredLanguage: lang });
    } catch (err) {
      console.error('[SettingsScreen] language error:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settings.notifications')}</Text>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              onValueChange={toggleNotifications}
              value={notificationsEnabled}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <View style={styles.chipRow}>
          {LANGUAGES.map((lang) => (
            <SpecialtyChip
              key={lang.value}
              label={lang.label}
              selected={i18n.language === lang.value}
              onPress={() => changeLanguage(lang.value)}
            />
          ))}
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate(PATIENT_ROUTES.CONTACT_US)}>
            <Icon name="help-buoy-outline" size={20} color={colors.primary} />
            <Text style={[styles.rowLabel, styles.rowLabelWithIcon]}>{t('settings.helpCenter')}</Text>
          </TouchableOpacity>
        </View>
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
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  rowLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.ink,
  },
  rowLabelWithIcon: {
    marginLeft: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
});
