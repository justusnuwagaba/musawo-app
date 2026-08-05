import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore, functions } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import Avatar from '../../components/Avatar';
import Input from '../../components/Input';
import Button from '../../components/Button';
import SpecialtyChip from '../../components/SpecialtyChip';
import RoleGate from '../../components/RoleGate';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function formatJoined(createdAt) {
  if (!createdAt?.toDate) return null;
  return createdAt.toDate().toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

// setUserRole stays a Cloud Function call (unlike ban below) — it must set
// the 'admin'/'superadmin' custom claim that nearly every other collection's
// rules check via isAdmin(). A plain Firestore write to `role` would make
// someone LOOK like an admin in the UI while every real admin write they
// attempt still gets rejected by rules, which is worse than the current
// clearly-broken state. It stays deployed-but-unreachable until Blaze —
// see scripts/setUserRole.js for the interim, correctly-privileged workaround.
const setUserRole = httpsCallable(functions, 'setUserRole');

const ROLE_FILTERS = ['All', 'patient', 'doctor', 'admin', 'superadmin', 'banned'];
const ROLE_FILTER_LABEL = {
  All: 'All',
  patient: 'Patients',
  doctor: 'Doctors',
  admin: 'Admins',
  superadmin: 'Superadmins',
  banned: 'Banned',
};

export default function UserManagementTab() {
  const { user: currentUser } = useUserContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [busyUid, setBusyUid] = useState(null);

  const load = useCallback(async () => {
    try {
      const snap = await getDocs(collection(firestore, 'users'));
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('[UserManagementTab] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === 'All' || (roleFilter === 'banned' ? u.isBanned : u.role === roleFilter);
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || u.displayName?.toLowerCase().includes(q) || u.phone?.includes(q) || u.contactEmail?.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, search]);

  const handleToggleBan = (targetUser) => {
    const nextBanned = !targetUser.isBanned;
    showAlert(
      nextBanned ? 'Ban user' : 'Unban user',
      `${nextBanned ? 'Ban' : 'Unban'} ${targetUser.displayName || 'this user'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextBanned ? 'Ban' : 'Unban',
          style: nextBanned ? 'destructive' : 'default',
          onPress: async () => {
            setBusyUid(targetUser.id);
            try {
              // Direct write, not a Cloud Function — isBanned isn't checked
              // by any custom claim anywhere in the rules, so this is safe
              // to do without Blaze (unlike role, see setUserRole above).
              await updateDoc(doc(firestore, 'users', targetUser.id), {
                isBanned: nextBanned,
                updatedAt: serverTimestamp(),
              });
              setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, isBanned: nextBanned } : u)));
            } catch (err) {
              console.error('[UserManagementTab] ban error:', err);
              showAlert('Could not update', err.message || 'Please try again.');
            } finally {
              setBusyUid(null);
            }
          },
        },
      ]
    );
  };

  const handleToggleAdmin = (targetUser) => {
    const nextRole = targetUser.role === 'admin' ? 'patient' : 'admin';
    showAlert(
      nextRole === 'admin' ? 'Grant admin access' : 'Remove admin access',
      `${nextRole === 'admin' ? 'Make' : 'Remove'} ${targetUser.displayName || 'this user'} ${nextRole === 'admin' ? 'an admin' : 'as admin'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setBusyUid(targetUser.id);
            try {
              await setUserRole({ uid: targetUser.id, role: nextRole });
              setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, role: nextRole } : u)));
            } catch (err) {
              console.error('[UserManagementTab] role error:', err);
              showAlert(
                'Requires the Blaze upgrade',
                'Granting or removing admin access needs a Cloud Function, which can\'t run until the project is on the Blaze plan. ' +
                  'Until then, run scripts/setUserRole.js from a terminal to do this instead.'
              );
            } finally {
              setBusyUid(null);
            }
          },
        },
      ]
    );
  };

  const handleExportCSV = async () => {
    if (filtered.length === 0) {
      showAlert('Nothing to export', 'The current filter has no results.');
      return;
    }
    const headers = ['UID', 'Name', 'Phone', 'Email', 'Role', 'Banned'];
    const rows = filtered.map((u) =>
      [u.id, u.displayName || '', u.phone || '', u.contactEmail || '', u.role || '', u.isBanned ? 'yes' : 'no']
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    try {
      const fileUri = `${FileSystem.cacheDirectory}musawo_users_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Share user list' });
      }
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (err) {
      console.error('[UserManagementTab] export error:', err);
      showAlert('Export failed', 'Could not prepare the file for sharing.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          <Input placeholder="Search by name, phone, or email" value={search} onChangeText={setSearch} />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={ROLE_FILTERS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <SpecialtyChip label={ROLE_FILTER_LABEL[item] ?? item} selected={item === roleFilter} onPress={() => setRoleFilter(item)} />
            )}
            style={styles.chipRow}
          />
          <Button title={`Export CSV (${filtered.length})`} variant="outline" onPress={handleExportCSV} style={styles.exportButton} />
        </View>
      }
      renderItem={({ item }) => {
        const joined = formatJoined(item.createdAt);
        return (
          <View style={styles.card}>
            <View style={styles.topRow}>
              <Avatar name={item.displayName} photoURL={item.photoURL} size="sm" />
              <View style={styles.headerText}>
                <Text style={styles.name}>{item.displayName || 'Unnamed user'}</Text>
                <Text style={styles.meta}>{capitalize(item.role)}{joined ? ` · joined ${joined}` : ''}</Text>
              </View>
              <View style={[styles.statusPill, item.isBanned && styles.statusPillDanger]}>
                <Text style={[styles.statusPillText, item.isBanned && styles.statusPillTextDanger]}>
                  {item.isBanned ? 'Banned' : 'Active'}
                </Text>
              </View>
            </View>
            <Text style={styles.contact}>{item.phone || item.contactEmail || '—'}</Text>
            {item.id !== currentUser?.uid && (
              <View style={styles.actionsRow}>
                <Button
                  title={item.isBanned ? 'Unban' : 'Ban'}
                  variant="outline"
                  onPress={() => handleToggleBan(item)}
                  loading={busyUid === item.id}
                  style={styles.actionButton}
                />
                <RoleGate allow={['superadmin']}>
                  <Button
                    title={item.role === 'admin' ? 'Remove admin' : 'Make admin'}
                    variant="ghost"
                    onPress={() => handleToggleAdmin(item)}
                    loading={busyUid === item.id}
                    style={styles.actionButton}
                  />
                </RoleGate>
              </View>
            )}
          </View>
        );
      }}
      ListEmptyComponent={<EmptyState icon="people-outline" title="No users found" message="Try a different search or filter." />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  header: {
    marginBottom: spacing.sm,
  },
  chipRow: {
    marginBottom: spacing.sm,
  },
  exportButton: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    flexShrink: 1,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    marginTop: 2,
  },
  statusPill: {
    flexShrink: 0,
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.successLight,
  },
  statusPillDanger: {
    backgroundColor: colors.dangerLight,
  },
  statusPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  statusPillTextDanger: {
    color: colors.danger,
  },
  contact: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
});
