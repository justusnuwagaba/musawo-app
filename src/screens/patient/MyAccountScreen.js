import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useUserContext } from '../../context/UserProvider';
import Avatar from '../../components/Avatar';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { showAlert } from '../../components/AppAlert';
import { uploadImageToCloudinary } from '../../utils/uploadImage';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';
import { PATIENT_ROUTES } from '../../navigation/routes';

function MenuRow({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <Icon name={icon} size={20} color={colors.primary} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Icon name="chevron-forward" size={18} color={colors.inkFaint} />
    </TouchableOpacity>
  );
}

export default function MyAccountScreen({ navigation }) {
  const { t } = useTranslation();
  const { profile, role, updateProfile, logout } = useUserContext();
  const canApplyAsDoctor = role === 'patient';
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleChangePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert(t('account.photoPermissionTitle'), t('account.photoPermissionMessage'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;

    setUploadingPhoto(true);
    try {
      const url = await uploadImageToCloudinary(result.assets[0].uri);
      await updateProfile({ photoURL: url });
    } catch (err) {
      console.error('[MyAccountScreen] photo upload error:', err);
      showAlert(t('account.photoUploadFailedTitle'), t('account.photoUploadFailedMessage'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert(t('account.nameRequiredTitle'), t('account.enterYourName'));
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ displayName: name.trim() });
      setIsEditing(false);
    } catch (err) {
      console.error('[MyAccountScreen] update error:', err);
      showAlert(t('common.couldNotSave'), t('common.tryAgain'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    showAlert(t('account.logOutTitle'), t('account.logOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('account.logOut'), style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerCard}>
          <TouchableOpacity onPress={handleChangePhoto} disabled={uploadingPhoto} style={styles.avatarWrapper}>
            <Avatar name={profile?.displayName} photoURL={profile?.photoURL} size="lg" />
            <View style={styles.avatarEditBadge}>
              {uploadingPhoto ? <ActivityIndicator size="small" color={colors.onPrimary} /> : <Icon name="camera" size={14} color={colors.onPrimary} />}
            </View>
          </TouchableOpacity>
          {isEditing ? (
            <Input value={name} onChangeText={setName} style={styles.nameInput} placeholder={t('auth.fullNameLabel')} />
          ) : (
            <Text style={styles.name}>{profile?.displayName || t('account.addYourName')}</Text>
          )}
          <Text style={styles.identifier}>{profile?.phone || profile?.contactEmail}</Text>

          {isEditing ? (
            <View style={styles.editActions}>
              <Button title={t('common.save')} onPress={handleSave} loading={saving} style={styles.saveButton} />
              <Button title={t('common.cancel')} variant="ghost" onPress={() => { setIsEditing(false); setName(profile?.displayName || ''); }} />
            </View>
          ) : (
            <Button title={t('account.editProfile')} variant="outline" onPress={() => setIsEditing(true)} style={styles.editButton} />
          )}
        </View>

        <Text style={styles.sectionTitle}>{t('account.health')}</Text>
        <View style={styles.menuCard}>
          <MenuRow icon="heart-outline" label={t('account.myHealth')} onPress={() => navigation.navigate(PATIENT_ROUTES.MY_HEALTH)} />
          <MenuRow icon="document-text-outline" label={t('account.medicalRecords')} onPress={() => navigation.navigate(PATIENT_ROUTES.MEDICAL_RECORDS)} />
          <MenuRow icon="heart-circle-outline" label={t('account.favoriteDoctors')} onPress={() => navigation.navigate(PATIENT_ROUTES.FAVORITE_DOCTORS)} />
          <MenuRow icon="card-outline" label={t('account.payments')} onPress={() => navigation.navigate(PATIENT_ROUTES.PAYMENT)} />
        </View>

        <Text style={styles.sectionTitle}>{t('account.settingsSupport')}</Text>
        <View style={styles.menuCard}>
          <MenuRow icon="notifications-outline" label={t('account.notifications')} onPress={() => navigation.navigate(PATIENT_ROUTES.NOTIFICATIONS)} />
          <MenuRow icon="settings-outline" label={t('account.settings')} onPress={() => navigation.navigate(PATIENT_ROUTES.SETTINGS)} />
          <MenuRow icon="help-buoy-outline" label={t('account.contactUs')} onPress={() => navigation.navigate(PATIENT_ROUTES.CONTACT_US)} />
          <MenuRow icon="information-circle-outline" label={t('account.aboutMusawo')} onPress={() => navigation.navigate(PATIENT_ROUTES.ABOUT_US)} />
        </View>

        {canApplyAsDoctor && (
          <>
            <Text style={styles.sectionTitle}>{t('account.areYouDoctor')}</Text>
            <View style={styles.menuCard}>
              <MenuRow icon="medkit-outline" label={t('account.applyDoctor')} onPress={() => navigation.navigate(PATIENT_ROUTES.DOCTOR_APPLICATION)} />
            </View>
          </>
        )}

        <Button title={t('account.logOut')} variant="outline" onPress={handleLogout} style={styles.logoutButton} />
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
  avatarWrapper: {
    position: 'relative',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  nameInput: {
    width: '100%',
    marginTop: spacing.sm,
  },
  identifier: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: 2,
  },
  editButton: {
    marginTop: spacing.md,
    minWidth: 160,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButton: {
    marginRight: spacing.md,
    minWidth: 120,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLabel: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.ink,
    marginLeft: spacing.md,
  },
  logoutButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
});
