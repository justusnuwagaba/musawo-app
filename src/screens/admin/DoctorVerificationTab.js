import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Linking, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

// item.submittedAt is already on each application doc (written by
// DoctorApplicationScreen) — no extra query needed, just wasn't rendered.
function formatRelativeTime(timestamp) {
  if (!timestamp?.toDate) return null;
  const diffMin = Math.floor((Date.now() - timestamp.toDate().getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return timestamp.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function DoctorVerificationTab() {
  const { user } = useUserContext();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingId, setSubmittingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const q = query(collection(firestore, 'doctorApplications'), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      setApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('[DoctorVerificationTab] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Direct Firestore writes instead of the reviewDoctorApplication Cloud
  // Function — that Function can't deploy without Blaze (this project is
  // still on the free Spark plan). Nothing in firestore.rules ever checks a
  // 'doctor' custom claim (doctor-scoped rules compare uids directly against
  // a doc's doctorId field instead), so this costs nothing security-wise —
  // only the adminAuditLog entry and a push notification are deferred until
  // Blaze is on and this can move into the real Function.
  const handleApprove = async (application) => {
    setSubmittingId(application.id);
    try {
      const batch = writeBatch(firestore);
      batch.update(doc(firestore, 'doctorApplications', application.id), {
        status: 'approved',
        reviewedBy: user.uid,
        reviewedAt: serverTimestamp(),
      });
      batch.update(doc(firestore, 'users', application.id), {
        isVerified: true,
        verificationStatus: 'approved',
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      setApplications((prev) => prev.filter((a) => a.id !== application.id));
      showAlert('Approved', `${application.fullName} can now see patients.`);
    } catch (err) {
      console.error('[DoctorVerificationTab] approve error:', err);
      showAlert('Could not approve', err.message || 'Please try again.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReject = async (application) => {
    setSubmittingId(application.id);
    try {
      const reason = rejectionReason.trim();
      const batch = writeBatch(firestore);
      batch.update(doc(firestore, 'doctorApplications', application.id), {
        status: 'rejected',
        reviewedBy: user.uid,
        reviewedAt: serverTimestamp(),
        rejectionReason: reason,
      });
      batch.update(doc(firestore, 'users', application.id), {
        isVerified: false,
        verificationStatus: 'rejected',
        rejectionReason: reason,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      setApplications((prev) => prev.filter((a) => a.id !== application.id));
      setRejectingId(null);
      setRejectionReason('');
    } catch (err) {
      console.error('[DoctorVerificationTab] reject error:', err);
      showAlert('Could not reject', err.message || 'Please try again.');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <FlatList
      data={applications}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        applications.length > 0 ? (
          <Text style={styles.pendingCount}>
            {applications.length} pending application{applications.length === 1 ? '' : 's'}
          </Text>
        ) : null
      }
      renderItem={({ item }) => {
        const submittedLabel = formatRelativeTime(item.submittedAt);
        return (
          <View style={styles.card}>
            <View style={styles.topRow}>
              <Avatar name={item.fullName} size="sm" />
              <View style={styles.headerText}>
                <Text style={styles.name}>{item.fullName}</Text>
                <Text style={styles.specialty}>{item.specialty} · {item.yearsExperience || 0} yrs experience</Text>
              </View>
              {!!submittedLabel && <Text style={styles.submittedTime}>{submittedLabel}</Text>}
            </View>
            <Text style={styles.detail}>License {item.licenseNumber} — {item.issuingBody}</Text>
            {!!item.languagesSpoken?.length && <Text style={styles.detail}>Speaks: {item.languagesSpoken.join(', ')}</Text>}
            {!!item.bio && <Text style={styles.bio}>{item.bio}</Text>}

            <Text style={styles.docsHeading}>Documents ({item.documents?.length || 0})</Text>
            {item.documents?.length ? (
              item.documents.map((docItem, index) => (
                <TouchableOpacity key={docItem.url || index} style={styles.docRow} onPress={() => Linking.openURL(docItem.url)}>
                  <Icon name={docItem.mimeType?.includes('pdf') ? 'document-text-outline' : 'image-outline'} size={16} color={colors.primary} />
                  <Text style={styles.docName} numberOfLines={1}>{docItem.fileName || 'Document'}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.docsWarning}>No documents uploaded yet</Text>
            )}

            {rejectingId === item.id ? (
              <View style={styles.rejectForm}>
                <Input placeholder="Reason for rejection (shown to the applicant)" value={rejectionReason} onChangeText={setRejectionReason} multiline />
                <View style={styles.actionsRow}>
                  <Button title="Confirm reject" variant="outline" onPress={() => handleReject(item)} loading={submittingId === item.id} style={styles.actionButton} />
                  <Button title="Cancel" variant="ghost" onPress={() => { setRejectingId(null); setRejectionReason(''); }} style={styles.actionButton} />
                </View>
              </View>
            ) : (
              <View style={styles.actionsRow}>
                <Button title="Approve" onPress={() => handleApprove(item)} loading={submittingId === item.id} style={styles.actionButton} />
                <Button title="Reject" variant="outline" onPress={() => setRejectingId(item.id)} style={styles.actionButton} />
              </View>
            )}
          </View>
        );
      }}
      ListEmptyComponent={
        <EmptyState icon="checkmark-done-outline" title="No pending applications" message="New doctor applications will show up here for review." />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  pendingCount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.inkMuted,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  submittedTime: {
    flexShrink: 0,
    fontSize: fontSize.xs,
    color: colors.inkFaint,
    marginLeft: spacing.sm,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  specialty: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: 2,
  },
  detail: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    marginTop: 4,
  },
  bio: {
    fontSize: fontSize.sm,
    color: colors.ink,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  docsHeading: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.inkMuted,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  docName: {
    fontSize: fontSize.sm,
    color: colors.primary,
    textDecorationLine: 'underline',
    marginLeft: spacing.xs,
  },
  docsWarning: {
    fontSize: fontSize.xs,
    color: colors.warning,
    marginTop: spacing.xs,
  },
  rejectForm: {
    marginTop: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
});
