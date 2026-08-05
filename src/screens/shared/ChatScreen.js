import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/Ionicons';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  writeBatch,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import LoadingSpinner from '../../components/LoadingSpinner';
import ReportProblemModal from '../../components/ReportProblemModal';
import { colors, spacing, radii, fontSize, fontWeight } from '../../theme/tokens';

const TYPING_IDLE_MS = 2000; // stop showing "typing..." after this long without a keystroke
const TYPING_STALE_MS = 8000; // ignore a typing flag older than this (crashed/backgrounded client)

function formatMessageTime(sentAt) {
  if (!sentAt?.toDate) return '';
  return sentAt.toDate().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function ChatScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { appointmentId, otherName } = route.params;
  const { user, profile, isDoctor } = useUserContext();
  const [ready, setReady] = useState(false);
  const [otherUid, setOtherUid] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      title: otherName || 'Chat',
      headerRight: () => (
        <TouchableOpacity onPress={() => setReportVisible(true)} style={styles.headerAction}>
          <Icon name="flag-outline" size={22} color={colors.ink} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherName]);

  // Ensure the parent chat doc exists (first time either party opens this
  // appointment's chat) before any subcollection write is attempted — the
  // messages/typing security rules read participants off this parent doc.
  useEffect(() => {
    (async () => {
      try {
        const chatRef = doc(firestore, 'chats', appointmentId);
        const chatSnap = await getDoc(chatRef);
        if (!chatSnap.exists()) {
          const apptSnap = await getDoc(doc(firestore, 'appointments', appointmentId));
          if (!apptSnap.exists()) return;
          const appt = apptSnap.data();
          const other = user.uid === appt.patientId ? appt.doctorId : appt.patientId;
          setOtherUid(other);
          await setDoc(
            chatRef,
            {
              participants: [appt.patientId, appt.doctorId],
              participantNames: { [appt.patientId]: appt.patientName, [appt.doctorId]: appt.doctorName },
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
        } else {
          const data = chatSnap.data();
          setOtherUid(data.participants.find((p) => p !== user.uid));
        }
      } catch (err) {
        console.error('[ChatScreen] ensure chat doc error:', err);
      } finally {
        setReady(true);
      }
    })();
  }, [appointmentId, user]);

  // Real-time messages.
  useEffect(() => {
    if (!ready) return;
    const q = query(collection(firestore, 'chats', appointmentId, 'messages'), orderBy('sentAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error('[ChatScreen] messages snapshot error:', err));
    return unsubscribe;
  }, [ready, appointmentId]);

  // Typing indicator for the other participant.
  useEffect(() => {
    if (!ready || !otherUid) return;
    const unsubscribe = onSnapshot(doc(firestore, 'chats', appointmentId, 'typing', otherUid), (snap) => {
      const data = snap.data();
      if (!data?.isTyping || !data.updatedAt?.toDate) {
        setOtherTyping(false);
        return;
      }
      const isFresh = Date.now() - data.updatedAt.toDate().getTime() < TYPING_STALE_MS;
      setOtherTyping(isFresh);
    });
    return unsubscribe;
  }, [ready, otherUid, appointmentId]);

  // Mark incoming unread messages as read while this screen is open.
  useEffect(() => {
    if (!ready || messages.length === 0) return;
    const unread = messages.filter((m) => m.senderId !== user.uid && !m.isRead);
    if (unread.length === 0) return;

    const batch = writeBatch(firestore);
    unread.forEach((m) => {
      batch.update(doc(firestore, 'chats', appointmentId, 'messages', m.id), { isRead: true });
    });
    batch.commit().catch((err) => console.error('[ChatScreen] mark read error:', err));

    updateDoc(doc(firestore, 'chats', appointmentId), { lastMessageReadBy: arrayUnion(user.uid) }).catch((err) =>
      console.error('[ChatScreen] mark chat read error:', err)
    );
  }, [ready, messages, appointmentId, user]);

  const setTyping = useCallback(
    (isTyping) => {
      setDoc(doc(firestore, 'chats', appointmentId, 'typing', user.uid), { isTyping, updatedAt: serverTimestamp() }, { merge: true }).catch(
        (err) => console.error('[ChatScreen] typing update error:', err)
      );
    },
    [appointmentId, user]
  );

  const handleChangeText = (value) => {
    setText(value);
    setTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTyping(false), TYPING_IDLE_MS);
  };

  const handleSend = async () => {
    const content = text.trim();
    if (!content) return;
    setSending(true);
    setText('');
    setTyping(false);
    try {
      await addDoc(collection(firestore, 'chats', appointmentId, 'messages'), {
        senderId: user.uid,
        content,
        sentAt: serverTimestamp(),
        isRead: false,
        deletedFor: [],
        deletedForEveryone: false,
      });
      await updateDoc(doc(firestore, 'chats', appointmentId), {
        lastMessage: content,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: user.uid,
        lastMessageReadBy: [user.uid],
      });
    } catch (err) {
      console.error('[ChatScreen] send error:', err);
    } finally {
      setSending(false);
    }
  };

  if (!ready) return <LoadingSpinner />;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
      <SafeAreaView style={styles.container}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isMine = item.senderId === user.uid;
            return (
              <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.content}</Text>
                  <View style={styles.bubbleFooter}>
                    <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>{formatMessageTime(item.sentAt)}</Text>
                    {isMine && <Icon name={item.isRead ? 'checkmark-done' : 'checkmark'} size={14} color={colors.onPrimaryMuted} style={styles.readIcon} />}
                  </View>
                </View>
              </View>
            );
          }}
        />
        {otherTyping && (
          <Text style={styles.typingIndicator}>{t('chat.typing', { name: otherName })}</Text>
        )}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={handleChangeText}
            placeholder={t('chat.inputPlaceholder')}
            placeholderTextColor={colors.inkFaint}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending || !text.trim()}>
            <Icon name="send" size={18} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ReportProblemModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        reporterId={user.uid}
        reporterName={profile?.displayName}
        reporterRole={isDoctor ? 'doctor' : 'patient'}
        reportedUserId={otherUid}
        reportedUserName={otherName}
        appointmentId={appointmentId}
        queueId={null}
        context="chat"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderLeftWidth: 2,
    borderLeftColor: colors.secondary, // the other party's message — cyan accent, matches the app-wide self/other color coding
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: fontSize.md,
    color: colors.ink,
  },
  bubbleTextMine: {
    color: colors.onPrimary,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  bubbleTime: {
    fontSize: fontSize.xs,
    color: colors.inkFaint,
  },
  bubbleTimeMine: {
    color: colors.onPrimaryMuted,
  },
  readIcon: {
    marginLeft: 4,
  },
  typingIndicator: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    fontStyle: 'italic',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.ink,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
