import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserContext } from '../../context/UserProvider';
import SpecialtyChip from '../../components/SpecialtyChip';
import Button from '../../components/Button';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing, radii, fontSize, fontWeight } from '../../theme/tokens';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodGroup() {
  const { profile, updateProfile } = useUserContext();
  const [selected, setSelected] = useState(profile?.bloodGroup || null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (group) => {
    setSelected(group);
    setSaving(true);
    try {
      await updateProfile({ bloodGroup: group });
    } catch (err) {
      console.error('[BloodGroup] save error:', err);
      showAlert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.displayCard}>
        <Text style={styles.displayValue}>{selected || '—'}</Text>
        <Text style={styles.displayLabel}>Your blood group</Text>
      </View>

      <Text style={styles.sectionTitle}>Select your blood group</Text>
      <View style={styles.chipWrap}>
        {BLOOD_GROUPS.map((group) => (
          <SpecialtyChip key={group} label={group} selected={selected === group} onPress={() => handleSave(group)} />
        ))}
      </View>
      {saving && <Button title="Saving..." disabled loading style={styles.savingButton} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  displayCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  displayValue: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: colors.onPrimary,
  },
  displayLabel: {
    fontSize: fontSize.sm,
    color: colors.onPrimaryMuted,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.inkMuted,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  savingButton: {
    marginTop: spacing.lg,
  },
});
