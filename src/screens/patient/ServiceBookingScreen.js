import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import Input from '../../components/Input';
import Button from '../../components/Button';
import SegmentedToggle from '../../components/SegmentedToggle';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

// Generic booking form shared by all six catalog categories (Lab,
// Vaccination, Chronic Illness, Health Screening, Pharmacy, Insurance) —
// reached from ServiceScreenTemplate.js, which is itself already
// parameterized the same way. Writes to the shared serviceOrders
// collection (see firestore.rules) rather than a per-category one.
export default function ServiceBookingScreen({ route, navigation }) {
  const { item, category, categoryLabel } = route.params;
  const { user, profile } = useUserContext();
  const [fulfillmentMethod, setFulfillmentMethod] = useState('home');
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await addDoc(collection(firestore, 'serviceOrders'), {
        category,
        itemId: item.id,
        itemName: item.name,
        price: item.price ?? 0,
        patientId: user.uid,
        patientName: profile?.displayName || 'Patient',
        fulfillmentMethod,
        preferredDate: preferredDate.trim(),
        notes: notes.trim(),
        status: 'requested',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showAlert('Request sent', `Your ${categoryLabel.toLowerCase()} request has been sent — we'll confirm it shortly.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error('[ServiceBookingScreen] booking error:', err);
      showAlert('Could not send request', 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.itemCard}>
          <Text style={styles.itemName}>{item.name}</Text>
          {!!item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
          {!!item.price && <Text style={styles.itemPrice}>UGX {item.price.toLocaleString?.() ?? item.price}</Text>}
        </View>

        <Text style={styles.label}>How would you like this done?</Text>
        <SegmentedToggle
          style={styles.toggle}
          value={fulfillmentMethod}
          onChange={setFulfillmentMethod}
          options={[
            { value: 'home', label: 'Home' },
            { value: 'facility', label: 'Visit a facility' },
          ]}
        />

        <Input label="Preferred date (optional)" placeholder="e.g. Aug 20" value={preferredDate} onChangeText={setPreferredDate} />

        <Input
          label="Notes for the provider (optional)"
          placeholder="Anything they should know before this visit"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <Button title={`Request ${categoryLabel}`} onPress={handleConfirm} loading={submitting} style={styles.confirmButton} />
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
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  itemName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  itemDescription: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  itemPrice: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  toggle: {
    marginBottom: spacing.lg,
  },
  confirmButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
