import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import Input from '../../components/Input';
import Button from '../../components/Button';
import SegmentedToggle from '../../components/SegmentedToggle';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

export default function PricingConfigTab() {
  const { user } = useUserContext();
  const [loading, setLoading] = useState(true);
  const [ratePercent, setRatePercent] = useState('15');
  const [savingRate, setSavingRate] = useState(false);

  const [discounts, setDiscounts] = useState([]);
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState('percentage');
  const [newValue, setNewValue] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [commissionSnap, discountsSnap] = await Promise.all([
        getDoc(doc(firestore, 'config', 'commission')),
        getDocs(collection(firestore, 'discounts')),
      ]);
      if (commissionSnap.exists()) {
        setRatePercent(String(Math.round((commissionSnap.data().defaultRate ?? 0.15) * 100)));
      }
      setDiscounts(discountsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('[PricingConfigTab] load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveRate = async () => {
    const parsed = Number(ratePercent);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      showAlert('Invalid rate', 'Enter a commission percentage between 0 and 100.');
      return;
    }
    setSavingRate(true);
    try {
      await setDoc(doc(firestore, 'config', 'commission'), {
        defaultRate: parsed / 100,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
      showAlert('Saved', 'The platform commission rate has been updated.');
    } catch (err) {
      console.error('[PricingConfigTab] save rate error:', err);
      showAlert('Could not save', 'Please try again.');
    } finally {
      setSavingRate(false);
    }
  };

  const handleCreateDiscount = async () => {
    const code = newCode.trim().toUpperCase();
    const value = Number(newValue);
    if (!code || !Number.isFinite(value) || value <= 0) {
      showAlert('Missing details', 'Enter a code and a positive value.');
      return;
    }
    setCreating(true);
    try {
      await setDoc(doc(firestore, 'discounts', code), {
        type: newType,
        value,
        active: true,
        expiresAt: null,
        usageLimit: null,
        usageCount: 0,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewCode('');
      setNewValue('');
      await load();
    } catch (err) {
      console.error('[PricingConfigTab] create discount error:', err);
      showAlert('Could not create', 'That code may already exist.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (discount) => {
    try {
      await setDoc(doc(firestore, 'discounts', discount.id), { active: !discount.active, updatedAt: serverTimestamp() }, { merge: true });
      setDiscounts((prev) => prev.map((d) => (d.id === discount.id ? { ...d, active: !d.active } : d)));
    } catch (err) {
      console.error('[PricingConfigTab] toggle discount error:', err);
      showAlert('Could not update', 'Please try again.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Platform commission</Text>
      <View style={styles.card}>
        <Input
          label="Commission rate (%)"
          keyboardType="numeric"
          value={ratePercent}
          onChangeText={setRatePercent}
        />
        <Button title="Save rate" onPress={handleSaveRate} loading={savingRate} />
      </View>

      <Text style={styles.sectionTitle}>Discount codes</Text>
      <View style={styles.card}>
        <Input label="Code" placeholder="e.g. WELCOME10" autoCapitalize="characters" value={newCode} onChangeText={setNewCode} />
        <SegmentedToggle
          style={styles.toggle}
          value={newType}
          onChange={setNewType}
          options={[
            { value: 'percentage', label: 'Percentage' },
            { value: 'fixed', label: 'Fixed amount' },
          ]}
        />
        <Input
          label={newType === 'percentage' ? 'Value (%)' : 'Value (UGX)'}
          keyboardType="numeric"
          value={newValue}
          onChangeText={setNewValue}
        />
        <Button title="Create code" onPress={handleCreateDiscount} loading={creating} />
      </View>

      {discounts.map((d) => (
        <View key={d.id} style={styles.discountCard}>
          <View style={styles.discountHeader}>
            <Text style={styles.discountCode}>{d.id}</Text>
            <Switch value={d.active} onValueChange={() => handleToggleActive(d)} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.white} />
          </View>
          <Text style={styles.discountDetail}>
            {d.type === 'percentage' ? `${d.value}% off` : `UGX ${d.value.toLocaleString()} off`} · used {d.usageCount}
            {d.usageLimit != null ? `/${d.usageLimit}` : ''}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  toggle: {
    marginBottom: spacing.md,
  },
  discountCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  discountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountCode: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  discountDetail: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: 2,
  },
});
