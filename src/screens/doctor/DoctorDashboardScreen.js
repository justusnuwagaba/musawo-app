import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getAggregateFromServer, sum } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { showAlert } from '../../components/AppAlert';
import { getDoctorRatingSummary } from '../../utils/ratings';
import { colors, spacing, radii, fontSize, fontWeight, shadow, fontFamily } from '../../theme/tokens';
import { DOCTOR_ROUTES } from '../../navigation/routes';

// See §4 of the Phase 11 plan for why 90s, not the ~14s ride-hail pacing:
// matchedDoctorId is fixed at request creation (no patient-side rematch
// yet), so a short timer would strand patients with no safety net.
const CONSULT_REQUEST_TIMEOUT_SEC = 90;

async function getDoctorEarnings(doctorId) {
  const paymentsRef = collection(firestore, 'payments');
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  try {
    const [lifetimeSnap, monthSnap] = await Promise.all([
      getAggregateFromServer(
        query(paymentsRef, where('doctorId', '==', doctorId), where('status', '==', 'completed')),
        { total: sum('doctorEarnings') }
      ),
      getAggregateFromServer(
        query(
          paymentsRef,
          where('doctorId', '==', doctorId),
          where('status', '==', 'completed'),
          where('paidAt', '>=', startOfMonth)
        ),
        { total: sum('doctorEarnings') }
      ),
    ]);
    return { lifetime: lifetimeSnap.data().total ?? 0, thisMonth: monthSnap.data().total ?? 0 };
  } catch (err) {
    console.error('[DoctorDashboardScreen] earnings error:', err);
    return { lifetime: 0, thisMonth: 0 };
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({ icon, label, value, color }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Icon name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DoctorDashboardScreen({ navigation }) {
  const { user, profile, updateProfile } = useUserContext();
  const [appointments, setAppointments] = useState([]);
  const [queueRequests, setQueueRequests] = useState([]);
  const [completedQueueCount, setCompletedQueueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [ratingSummary, setRatingSummary] = useState({ average: null, count: 0 });
  const [earnings, setEarnings] = useState({ lifetime: 0, thisMonth: 0 });
  const [homeVisitRequests, setHomeVisitRequests] = useState([]);
  const [now, setNow] = useState(Date.now());
  const expiringRef = useRef(new Set());

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [summary, earningsTotals] = await Promise.all([getDoctorRatingSummary(user.uid), getDoctorEarnings(user.uid)]);
      setRatingSummary(summary);
      setEarnings(earningsTotals);
    })();
  }, [user]);

  const isOnline = profile?.isOnline === true;

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(
      query(collection(firestore, 'appointments'), where('doctorId', '==', user.uid)),
      (snap) => {
        setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('[DoctorDashboardScreen] appointments error:', err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(
      query(
        collection(firestore, 'consultationQueue'),
        where('matchedDoctorId', '==', user.uid),
        where('status', '==', 'matched')
      ),
      (snap) => setQueueRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error('[DoctorDashboardScreen] queue error:', err)
    );
    return unsubscribe;
  }, [user]);

  // Standing requests where ServiceBookingScreen's nearby matching (see
  // HOME_VISIT_MATCHING_CATEGORIES there) assigned this doctor to a home
  // visit — currently vaccination only. Unlike consultationQueue above,
  // these aren't time-boxed instant-match requests, so no countdown/expiry.
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(
      query(collection(firestore, 'serviceOrders'), where('assignedDoctorId', '==', user.uid), where('status', '==', 'requested')),
      (snap) => setHomeVisitRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error('[DoctorDashboardScreen] home visit requests error:', err)
    );
    return unsubscribe;
  }, [user]);

  // Instant "Consult Now" sessions never get an appointments doc, so the
  // weekly streak below needs this second source alongside appointments —
  // counting only scheduled consultations would understate a doctor's real
  // activity given the app's own instant-matching differentiator.
  useEffect(() => {
    if (!user) return;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const unsubscribe = onSnapshot(
      query(
        collection(firestore, 'consultationQueue'),
        where('matchedDoctorId', '==', user.uid),
        where('status', '==', 'completed')
      ),
      (snap) => {
        const count = snap.docs.filter((d) => {
          const matchedAt = d.data().matchedAt?.toDate?.();
          return matchedAt && matchedAt >= weekAgo;
        }).length;
        setCompletedQueueCount(count);
      },
      (err) => console.error('[DoctorDashboardScreen] completed queue error:', err)
    );
    return unsubscribe;
  }, [user]);

  const handleToggleOnline = async () => {
    setTogglingOnline(true);
    try {
      await updateProfile({ isOnline: !isOnline });
    } catch (err) {
      console.error('[DoctorDashboardScreen] toggle online error:', err);
      showAlert('Could not update status', 'Please try again.');
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleAcceptConsult = useCallback(
    async (request) => {
      try {
        await updateDoc(doc(firestore, 'consultationQueue', request.id), {
          status: 'in_call',
        });
        navigation.navigate(DOCTOR_ROUTES.VIDEO_CONSULTATION, {
          channelId: request.id,
          queueId: request.id,
          callType: 'video',
          otherName: request.patientName,
        });
      } catch (err) {
        console.error('[DoctorDashboardScreen] accept consult error:', err);
        showAlert('Could not connect', 'Please try again.');
      }
    },
    [navigation]
  );

  const handleDeclineConsult = useCallback(async (request) => {
    try {
      await updateDoc(doc(firestore, 'consultationQueue', request.id), {
        status: 'declined',
        declinedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('[DoctorDashboardScreen] decline consult error:', err);
      showAlert('Could not decline', 'Please try again.');
    }
  }, []);

  const handleAcceptHomeVisit = useCallback(async (order) => {
    try {
      await updateDoc(doc(firestore, 'serviceOrders', order.id), { status: 'confirmed', updatedAt: serverTimestamp() });
    } catch (err) {
      console.error('[DoctorDashboardScreen] accept home visit error:', err);
      showAlert('Could not accept', 'Please try again.');
    }
  }, []);

  // Un-assigns rather than cancelling outright — falls back into the
  // unassigned pool so admin can manually reassign via
  // admin/ServiceOrdersTab.js, same manual-fallback spirit as everything
  // else in this app that isn't fully automated yet.
  const handleDeclineHomeVisit = useCallback(async (order) => {
    try {
      await updateDoc(doc(firestore, 'serviceOrders', order.id), {
        assignedDoctorId: null,
        assignedDoctorName: null,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('[DoctorDashboardScreen] decline home visit error:', err);
      showAlert('Could not decline', 'Please try again.');
    }
  }, []);

  const handleExpireConsult = useCallback(async (request) => {
    if (expiringRef.current.has(request.id)) return;
    expiringRef.current.add(request.id);
    try {
      await updateDoc(doc(firestore, 'consultationQueue', request.id), {
        status: 'expired',
        expiredAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('[DoctorDashboardScreen] expire consult error:', err);
      expiringRef.current.delete(request.id); // allow retry on next tick
    }
  }, []);

  // Single shared 1s-tick clock driving every visible request card's
  // countdown, rather than one timer per card.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-expire: timed off the request's own matchedAt server timestamp
  // (not a per-mount local timer), so backgrounding/reopening the app
  // doesn't reset the clock.
  useEffect(() => {
    queueRequests.forEach((request) => {
      const matchedAtMs = request.matchedAt?.toDate?.().getTime() ?? now;
      const remaining = CONSULT_REQUEST_TIMEOUT_SEC - Math.floor((now - matchedAtMs) / 1000);
      if (remaining <= 0) handleExpireConsult(request);
    });
  }, [now, queueRequests, handleExpireConsult]);

  const todayCount = appointments.filter((a) => {
    if (a.status !== 'confirmed' || !a.scheduledAt?.toDate) return false;
    const date = a.scheduledAt.toDate();
    const now = new Date();
    return date.toDateString() === now.toDateString();
  }).length;
  const pendingCount = appointments.filter((a) => a.status === 'requested').length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekApptCount = appointments.filter(
    (a) => a.status === 'completed' && a.scheduledAt?.toDate && a.scheduledAt.toDate() >= weekAgo
  ).length;
  const weeklyTotal = weekApptCount + completedQueueCount;

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{profile?.displayName || 'Doctor'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.statusToggle, isOnline ? styles.online : styles.offline]}
            onPress={handleToggleOnline}
            disabled={togglingOnline}
          >
            <Icon name={isOnline ? 'radio-button-on' : 'radio-button-off'} size={16} color={isOnline ? colors.onPrimary : colors.white} />
            <Text style={[styles.statusText, isOnline && { color: colors.onPrimary }]}>{isOnline ? 'Online' : 'Offline'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="calendar-outline" label="Today" value={todayCount} color={colors.primary} />
          <StatCard icon="hourglass-outline" label="Pending" value={pendingCount} color={colors.warning} />
          <StatCard icon="star-outline" label="Rating" value={ratingSummary.average != null ? ratingSummary.average.toFixed(1) : '—'} color={colors.info} />
        </View>

        <Text style={styles.sectionTitle}>Earnings</Text>
        <View style={styles.statsRow}>
          <StatCard icon="wallet-outline" label="This month" value={`UGX ${earnings.thisMonth.toLocaleString()}`} color={colors.success} />
          <StatCard icon="trending-up-outline" label="Lifetime" value={`UGX ${earnings.lifetime.toLocaleString()}`} color={colors.primary} />
        </View>

        <Text style={styles.sectionTitle}>This week</Text>
        <View style={styles.statsRow}>
          <StatCard icon="flame-outline" label="Consultations" value={weeklyTotal} color={colors.accent} />
        </View>
        {weeklyTotal >= 5 && (
          <View style={styles.streakBanner}>
            <Text style={styles.streakText}>🔥 {weeklyTotal}+ this week — great pace!</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate(DOCTOR_ROUTES.PATIENT_LIST)}>
            <Icon name="people-outline" size={20} color={colors.primary} />
            <Text style={styles.actionText}>View my patients</Text>
            <Icon name="chevron-forward" size={18} color={colors.inkFaint} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate(DOCTOR_ROUTES.APPOINTMENTS_TAB)}>
            <Icon name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.actionText}>Manage appointments</Text>
            <Icon name="chevron-forward" size={18} color={colors.inkFaint} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Consult now requests ({queueRequests.length})</Text>
        {!isOnline ? (
          <EmptyState icon="power-outline" title="You're offline" message="Go online to start receiving instant consultation requests." />
        ) : queueRequests.length === 0 ? (
          <EmptyState icon="checkmark-circle-outline" title="Queue is clear" message="Waiting for new patients to request a consultation." />
        ) : (
          queueRequests.map((request) => {
            const matchedAtMs = request.matchedAt?.toDate?.().getTime() ?? now;
            const remaining = Math.max(0, CONSULT_REQUEST_TIMEOUT_SEC - Math.floor((now - matchedAtMs) / 1000));
            const countdownLabel = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
            return (
              <View key={request.id} style={styles.queueCard}>
                <View style={styles.queueTopRow}>
                  <View style={styles.queueInfo}>
                    <Text style={styles.queuePatient}>{request.patientName}</Text>
                    <Text style={styles.queueSpecialty}>{request.specialty}</Text>
                  </View>
                  <Text style={[styles.queueCountdown, remaining <= 15 && { color: colors.accent }]}>{countdownLabel}</Text>
                </View>
                <View style={styles.queueActionsRow}>
                  <TouchableOpacity style={styles.declineButton} onPress={() => handleDeclineConsult(request)}>
                    <Text style={styles.declineText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptConsult(request)}>
                    <Icon name="videocam" size={18} color={colors.onPrimary} />
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <Text style={styles.sectionTitle}>Home visit requests ({homeVisitRequests.length})</Text>
        {homeVisitRequests.length === 0 ? (
          <EmptyState icon="home-outline" title="No home visit requests" message="Patients matched to you for a home visit (e.g. vaccination) will show up here." />
        ) : (
          homeVisitRequests.map((order) => (
            <View key={order.id} style={styles.queueCard}>
              <View style={styles.queueTopRow}>
                <View style={styles.queueInfo}>
                  <Text style={styles.queuePatient}>{order.patientName}</Text>
                  <Text style={styles.queueSpecialty}>
                    {order.itemName}
                    {order.preferredDate ? ` · ${order.preferredDate}` : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.queueActionsRow}>
                <TouchableOpacity style={styles.declineButton} onPress={() => handleDeclineHomeVisit(order)}>
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptHomeVisit(order)}>
                  <Icon name="checkmark" size={18} color={colors.onPrimary} />
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.md,
    color: colors.inkMuted,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  // Green, not cyan — this is the doctor's own status on the doctor's own
  // screen. Per theme/tokens.js's documented convention, cyan is reserved
  // for the doctor's presence as seen BY THE PATIENT (e.g. a future map
  // pin), not the doctor's own self-facing UI.
  online: {
    backgroundColor: colors.primary,
  },
  offline: {
    backgroundColor: colors.inkFaint,
  },
  statusText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    marginLeft: spacing.xs,
    // Overridden inline to onPrimary while online — see the JSX
    // conditional on the status icon just above the styles.
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    borderLeftWidth: 4,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    ...shadow.card,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  streakBanner: {
    backgroundColor: colors.accentLight,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  streakText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  actionsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionText: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  queueCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  queueTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueInfo: {
    flex: 1,
  },
  queuePatient: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  queueSpecialty: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
  },
  queueCountdown: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.md,
    color: colors.inkMuted,
  },
  queueActionsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  declineButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.danger,
    marginRight: spacing.sm,
  },
  declineText: {
    color: colors.danger,
    fontWeight: fontWeight.bold,
  },
  // Same green-not-cyan reasoning as `online` above — Accept is the
  // doctor's own action on the doctor's own screen.
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  acceptText: {
    color: colors.onPrimary,
    fontWeight: fontWeight.bold,
    marginLeft: spacing.xs,
  },
});
