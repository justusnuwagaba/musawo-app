import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserContext } from '../../context/UserProvider';
import DashboardTab from './DashboardTab';
import DoctorVerificationTab from './DoctorVerificationTab';
import UserManagementTab from './UserManagementTab';
import PricingConfigTab from './PricingConfigTab';
import TransactionsTab from './TransactionsTab';
import SafetyReportsTab from './SafetyReportsTab';
import AuditLogTab from './AuditLogTab';
import { colors, spacing, radii, fontSize, fontWeight } from '../../theme/tokens';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', component: DashboardTab },
  { key: 'verification', label: 'Doctors', component: DoctorVerificationTab },
  { key: 'users', label: 'Users', component: UserManagementTab },
  { key: 'pricing', label: 'Pricing', component: PricingConfigTab },
  { key: 'transactions', label: 'Transactions', component: TransactionsTab },
  { key: 'safety', label: 'Safety Reports', component: SafetyReportsTab },
  { key: 'audit', label: 'Audit Log', component: AuditLogTab, superadminOnly: true },
];

export default function AdminPanelScreen() {
  const { isSuperAdmin } = useUserContext();
  const [activeKey, setActiveKey] = useState('dashboard');

  const visibleTabs = useMemo(() => TABS.filter((t) => !t.superadminOnly || isSuperAdmin), [isSuperAdmin]);
  const ActiveComponent = visibleTabs.find((t) => t.key === activeKey)?.component ?? visibleTabs[0].component;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Admin Console</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabStrip} contentContainerStyle={styles.tabStripContent}>
        {visibleTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeKey === tab.key && styles.tabButtonActive]}
            onPress={() => setActiveKey(tab.key)}
          >
            <Text style={[styles.tabLabel, activeKey === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.content}>
        <ActiveComponent />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  tabStrip: {
    flexGrow: 0,
    paddingVertical: spacing.md,
  },
  tabStripContent: {
    paddingHorizontal: spacing.lg,
  },
  tabButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.inkMuted,
  },
  tabLabelActive: {
    color: colors.onPrimary,
  },
  content: {
    flex: 1,
  },
});
