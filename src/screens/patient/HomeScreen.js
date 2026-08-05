import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import LoadingSpinner from '../../components/LoadingSpinner';
import Avatar from '../../components/Avatar';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';
import { PATIENT_ROUTES } from '../../navigation/routes';

const FALLBACK_SERVICES = [
  { id: '1', title: 'Vaccination', subtitle: 'Convenience at home.', icon: 'medkit', route: PATIENT_ROUTES.VACCINATION_HOME },
  { id: '2', title: 'Chronic Illness', subtitle: 'Manage long-term conditions.', icon: 'heart', route: PATIENT_ROUTES.CHRONIC_HOME },
  { id: '3', title: 'Health Screening', subtitle: 'Take charge of your health.', icon: 'thermometer', route: PATIENT_ROUTES.SCREENING_HOME },
  { id: '4', title: 'Pharmacy', subtitle: 'Get affordable medicine.', icon: 'medical', route: PATIENT_ROUTES.PHARMACY_HOME },
  { id: '5', title: 'Insurance', subtitle: 'Find the best cover.', icon: 'shield-checkmark', route: PATIENT_ROUTES.INSURANCE_HOME },
  { id: '6', title: 'Lab', subtitle: 'Order and manage lab tests.', icon: 'flask', route: PATIENT_ROUTES.LAB_HOME },
];

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 2;
const ITEM_MARGIN = spacing.md;
const ITEM_SIZE = (width - spacing.lg * 2 - ITEM_MARGIN) / NUM_COLUMNS;

// Cycled by index across the service grid so the icon badges read as a set
// rather than every card looking identical — same three dim/saturated pairs
// used elsewhere in the design system, no new colors.
const ICON_BADGE_BG = [colors.primaryMuted, colors.secondaryMuted, colors.accentLight];
const ICON_BADGE_COLOR = [colors.primary, colors.secondary, colors.accent];

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const { user, profile, isLoading: isUserLoading } = useUserContext();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const displayName = profile?.displayName || user?.displayName || '';

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('home.greetingMorning');
    if (hour >= 12 && hour < 17) return t('home.greetingAfternoon');
    return t('home.greetingEvening');
  }, [t]);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(firestore, 'services'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        setServices(snap.empty ? FALLBACK_SERVICES : snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('[HomeScreen] services fetch error:', err);
        setServices(FALLBACK_SERVICES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const goToAccountScreen = (screen) => navigation.navigate(PATIENT_ROUTES.ACCOUNT_TAB, { screen });

  const handleServicePress = (service) => {
    if (service.route) goToAccountScreen(service.route);
  };

  if (loading || isUserLoading) return <LoadingSpinner label={t('home.loadingDashboard')} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{timeGreeting}{displayName ? `, ${displayName.split(' ')[0]}` : ''}</Text>
            <Text style={styles.subGreeting}>{t('home.subGreeting')}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate(PATIENT_ROUTES.ACCOUNT_TAB)}>
            <Avatar name={displayName} photoURL={profile?.photoURL} size="sm" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => navigation.navigate(PATIENT_ROUTES.FIND_DOCTOR_TAB)}
          activeOpacity={0.9}
        >
          <View style={styles.primaryActionIcon}>
            <Icon name="videocam" size={26} color={colors.onPrimary} />
          </View>
          <View style={styles.primaryActionText}>
            <Text style={styles.primaryActionTitle}>{t('home.consultDoctor')}</Text>
            <Text style={styles.primaryActionSubtitle}>{t('home.consultDoctorSubtitle')}</Text>
          </View>
          <Icon name="chevron-forward" size={22} color={colors.onPrimary} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t('home.servicesTitle')}</Text>

        <FlatList
          data={services}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.serviceCard} onPress={() => handleServicePress(item)}>
              <View style={[styles.serviceIconBadge, { backgroundColor: ICON_BADGE_BG[index % ICON_BADGE_BG.length] }]}>
                <Icon name={item.icon || 'star-outline'} size={20} color={ICON_BADGE_COLOR[index % ICON_BADGE_COLOR.length]} />
              </View>
              <Text style={styles.serviceTitle} numberOfLines={1}>{item.title}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          scrollEnabled={false}
          columnWrapperStyle={styles.columnWrapper}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  subGreeting: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: 2,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.xl,
    ...shadow.raised,
  },
  primaryActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(7, 18, 12, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  primaryActionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.onPrimary,
  },
  primaryActionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.onPrimaryMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: ITEM_MARGIN,
  },
  serviceCard: {
    width: ITEM_SIZE,
    height: 92,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    justifyContent: 'space-between',
    ...shadow.card,
  },
  serviceIconBadge: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
});
