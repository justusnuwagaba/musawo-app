import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

const ICON_BY_TYPE = {
  new_message: 'chatbubble-ellipses-outline',
  appointment_status: 'calendar-outline',
  doctor_approved: 'ribbon-outline',
  reminder: 'alarm-outline',
};

function formatTime(createdAt) {
  if (!createdAt?.toDate) return '';
  const diffMs = Date.now() - createdAt.toDate().getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsScreen() {
  const { user } = useUserContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(firestore, 'notifications', user.uid, 'items'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('[NotificationsScreen] snapshot error:', err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user]);

  const markAsRead = (item) => {
    if (item.isRead) return;
    updateDoc(doc(firestore, 'notifications', user.uid, 'items', item.id), { isRead: true }).catch((err) =>
      console.error('[NotificationsScreen] mark read error:', err)
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, !item.isRead && styles.unreadCard]} onPress={() => markAsRead(item)}>
            <Icon name={ICON_BY_TYPE[item.type] ?? 'notifications-outline'} size={20} color={colors.primary} />
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState icon="notifications-off-outline" title="You're all caught up" message="New messages and appointment updates will show up here." />
        }
      />
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  info: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  body: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: 2,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.inkFaint,
    marginTop: spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
});
