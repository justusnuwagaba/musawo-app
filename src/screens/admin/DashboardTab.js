import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, query, where, getCountFromServer, getDocs } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

const TREND_DAYS = 14;

function StatCard({ icon, label, value, color }) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Icon name={icon} size={22} color={color} />
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

async function getBookingsTrend() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (TREND_DAYS - 1));
  cutoff.setHours(0, 0, 0, 0);

  const buckets = [];
  for (let i = 0; i < TREND_DAYS; i++) {
    const d = new Date(cutoff);
    d.setDate(cutoff.getDate() + i);
    buckets.push({ date: d, count: 0 });
  }

  try {
    const snap = await getDocs(query(collection(firestore, 'appointments'), where('createdAt', '>=', cutoff)));
    snap.docs.forEach((docSnap) => {
      const created = docSnap.data().createdAt?.toDate?.();
      if (!created) return;
      const bucket = buckets.find((b) => b.date.toDateString() === created.toDateString());
      if (bucket) bucket.count += 1;
    });
  } catch (err) {
    console.error('[DashboardTab] trend fetch error:', err);
  }

  return buckets;
}

export default function DashboardTab() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const usersRef = collection(firestore, 'users');
        const [pendingApps, doctors, patients, appointments, bookingsTrend] = await Promise.all([
          getCountFromServer(query(collection(firestore, 'doctorApplications'), where('status', '==', 'pending'))),
          getCountFromServer(query(usersRef, where('role', '==', 'doctor'))),
          getCountFromServer(query(usersRef, where('role', '==', 'patient'))),
          getCountFromServer(collection(firestore, 'appointments')),
          getBookingsTrend(),
        ]);
        setStats({
          pendingApplications: pendingApps.data().count,
          doctors: doctors.data().count,
          patients: patients.data().count,
          appointments: appointments.data().count,
        });
        setTrend(bookingsTrend);
      } catch (err) {
        console.error('[DashboardTab] fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error || !stats) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Couldn't load dashboard stats. {error}</Text>
      </View>
    );
  }

  const trendTotal = trend.reduce((sum, b) => sum + b.count, 0);
  const trendMax = Math.max(1, ...trend.map((b) => b.count));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.grid}>
        <StatCard icon="hourglass-outline" label="Pending applications" value={stats.pendingApplications} color={colors.warning} />
        <StatCard icon="medkit-outline" label="Verified doctors" value={stats.doctors} color={colors.primary} />
        <StatCard icon="people-outline" label="Patients" value={stats.patients} color={colors.info} />
        <StatCard icon="calendar-outline" label="Total appointments" value={stats.appointments} color={colors.success} />
      </View>

      {trend.length > 0 && (
        <View style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendTitle}>Bookings, last {TREND_DAYS} days</Text>
            <Text style={styles.trendTotal}>{trendTotal}</Text>
          </View>
          <View style={styles.trendBars}>
            {trend.map((bucket) => (
              <View key={bucket.date.toDateString()} style={styles.trendBarTrack}>
                <View
                  style={[
                    styles.trendBar,
                    { height: `${Math.max(4, (bucket.count / trendMax) * 100)}%` },
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={styles.trendAxis}>
            <Text style={styles.trendAxisLabel}>{trend[0].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
            <Text style={styles.trendAxisLabel}>{trend[trend.length - 1].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderLeftWidth: 4,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  value: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.danger,
  },
  trendCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    ...shadow.card,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  trendTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.inkMuted,
  },
  trendTotal: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  trendBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
  },
  trendBarTrack: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  trendBar: {
    backgroundColor: colors.primaryMuted,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minHeight: 3,
  },
  trendAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  trendAxisLabel: {
    fontSize: fontSize.xs,
    color: colors.inkFaint,
  },
});
