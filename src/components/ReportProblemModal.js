import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../config/firebaseConfig';
import Input from './Input';
import Button from './Button';
import SpecialtyChip from './SpecialtyChip';
import { showAlert } from './AppAlert';
import { colors, spacing, radii, fontSize, fontWeight } from '../theme/tokens';

const CATEGORIES = ['unsafe_behavior', 'inappropriate_content', 'technical_issue', 'no_show', 'other'];

/**
 * Patient/doctor-facing "report a problem" form, tied to a specific
 * appointment (scheduled call/chat) or consultationQueue entry (instant
 * consult) — exactly one of appointmentId/queueId should be passed.
 */
export default function ReportProblemModal({
  visible,
  onClose,
  reporterId,
  reporterName,
  reporterRole,
  reportedUserId,
  reportedUserName,
  appointmentId = null,
  queueId = null,
  context,
}) {
  const { t } = useTranslation();
  const [category, setCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setCategory(null);
    setDescription('');
  };

  const handleSubmit = async () => {
    if (!category) {
      showAlert(t('report.missingCategoryTitle'), t('report.missingCategoryMessage'));
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(firestore, 'safetyReports'), {
        reporterId,
        reporterName: reporterName || '',
        reporterRole,
        reportedUserId,
        reportedUserName: reportedUserName || '',
        appointmentId,
        queueId,
        context,
        category,
        description: description.trim(),
        status: 'open',
        createdAt: serverTimestamp(),
        reviewedBy: null,
        reviewedAt: null,
      });
      reset();
      onClose();
      showAlert(t('report.submittedTitle'), t('report.submittedMessage'));
    } catch (err) {
      console.error('[ReportProblemModal] submit error:', err);
      showAlert(t('report.failedTitle'), t('report.failedMessage'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('report.title')}</Text>

          <Text style={styles.label}>{t('report.categoryLabel')}</Text>
          <View style={styles.chipWrap}>
            {CATEGORIES.map((cat) => (
              <SpecialtyChip key={cat} label={t(`report.categories.${cat}`)} selected={category === cat} onPress={() => setCategory(cat)} />
            ))}
          </View>

          <Input
            label={t('report.descriptionLabel')}
            placeholder={t('report.descriptionPlaceholder')}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View style={styles.actions}>
            <Button title={t('common.cancel')} variant="ghost" onPress={() => { reset(); onClose(); }} style={styles.actionButton} />
            <Button title={t('report.submit')} onPress={handleSubmit} loading={submitting} style={styles.actionButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
});
