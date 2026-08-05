import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import Input from '../../components/Input';
import Button from '../../components/Button';
import SpecialtyChip from '../../components/SpecialtyChip';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

const TYPES = [
  { value: 'note', label: 'Note', icon: 'document-text-outline' },
  { value: 'diagnosis', label: 'Diagnosis', icon: 'pulse-outline' },
  { value: 'prescription', label: 'Prescription', icon: 'medkit-outline' },
];

export default function DrMedicalRecordsScreen({ route }) {
  const { patientId, patientName, initialType } = route.params;
  const { user } = useUserContext();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState(initialType || 'note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // Prescription-specific structured fields — composed into the same
  // title/content shape at submit time, so storage and MedicalRecordsScreen's
  // existing rendering don't need to change, but authoring a prescription
  // isn't just two blank free-text boxes anymore.
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);

  const isPrescription = type === 'prescription';

  const loadRecords = useCallback(async () => {
    try {
      const q = query(collection(firestore, 'medicalRecords'), where('patientId', '==', patientId), where('doctorId', '==', user.uid));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setRecords(items);
    } catch (err) {
      console.error('[DrMedicalRecordsScreen] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, user]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleAdd = async () => {
    if (isPrescription) {
      if (!title.trim() || !dosage.trim() || !frequency.trim()) {
        showAlert('Missing details', 'Please add the medication name, dosage, and frequency.');
        return;
      }
    } else if (!title.trim() || !content.trim()) {
      showAlert('Missing details', 'Please add a title and details for this record.');
      return;
    }
    setSaving(true);
    try {
      const composedContent = isPrescription
        ? `${frequency.trim()}${duration.trim() ? ` for ${duration.trim()}` : ''}.${content.trim() ? ` ${content.trim()}` : ''}`
        : content.trim();
      await addDoc(collection(firestore, 'medicalRecords'), {
        patientId,
        doctorId: user.uid,
        type,
        title: isPrescription ? `${title.trim()} ${dosage.trim()}`.trim() : title.trim(),
        content: composedContent,
        ...(isPrescription
          ? { medicationName: title.trim(), dosage: dosage.trim(), frequency: frequency.trim(), duration: duration.trim() }
          : {}),
        attachments: [],
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setContent('');
      setDosage('');
      setFrequency('');
      setDuration('');
      await loadRecords();
    } catch (err) {
      console.error('[DrMedicalRecordsScreen] add error:', err);
      showAlert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.form}>
              <Text style={styles.formTitle}>Add a record for {patientName}</Text>
              <View style={styles.chipRow}>
                {TYPES.map((t) => (
                  <SpecialtyChip key={t.value} label={t.label} selected={type === t.value} onPress={() => setType(t.value)} />
                ))}
              </View>
              {isPrescription ? (
                <>
                  <Input placeholder="Medication name" value={title} onChangeText={setTitle} />
                  <Input placeholder="Dosage (e.g. 500mg)" value={dosage} onChangeText={setDosage} />
                  <Input placeholder="Frequency (e.g. Twice daily)" value={frequency} onChangeText={setFrequency} />
                  <Input placeholder="Duration (optional, e.g. 5 days)" value={duration} onChangeText={setDuration} />
                  <Input placeholder="Additional instructions (optional)" value={content} onChangeText={setContent} multiline />
                </>
              ) : (
                <>
                  <Input placeholder="Title" value={title} onChangeText={setTitle} />
                  <Input placeholder="Details" value={content} onChangeText={setContent} multiline />
                </>
              )}
              <Button title={isPrescription ? 'Prescribe' : 'Add record'} onPress={handleAdd} loading={saving} />
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Icon name={TYPES.find((t) => t.value === item.type)?.icon ?? 'document-outline'} size={20} color={colors.primary} />
              <View style={styles.cardBody}>
                <Text style={styles.recordTitle}>{item.title}</Text>
                <Text style={styles.recordContent}>{item.content}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<EmptyState icon="document-text-outline" title="No records yet" message="Records you add for this patient will appear here." />}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  formTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  cardBody: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  recordTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  recordContent: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: 2,
  },
});
