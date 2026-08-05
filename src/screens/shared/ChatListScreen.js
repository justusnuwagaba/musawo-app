import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

function formatTime(timestamp) {
  if (!timestamp?.toDate) return '';
  const date = timestamp.toDate();
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ChatListScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(firestore, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('[ChatListScreen] snapshot error:', err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const otherUid = item.participants.find((p) => p !== user.uid);
          const otherName = item.participantNames?.[otherUid] || 'Musawo user';
          const unread = item.lastMessageSenderId && item.lastMessageSenderId !== user.uid && !item.lastMessageReadBy?.includes(user.uid);
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('Chat', { appointmentId: item.id, otherName })}
            >
              <Avatar name={otherName} size="md" />
              <View style={styles.info}>
                <Text style={styles.name}>{otherName}</Text>
                <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
                  {item.lastMessage || t('chat.sayHello')}
                </Text>
              </View>
              <View style={styles.meta}>
                <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
                {unread && <View style={styles.unreadDot} />}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon="chatbubbles-outline" title={t('chat.noConversationsTitle')} message={t('chat.noConversationsMessage')} />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  preview: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: 2,
  },
  previewUnread: {
    color: colors.ink,
    fontWeight: fontWeight.semibold,
  },
  meta: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.inkFaint,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: spacing.xs,
  },
});
