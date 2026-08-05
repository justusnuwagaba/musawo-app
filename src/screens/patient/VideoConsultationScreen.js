import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, PermissionsAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/Ionicons';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
} from 'react-native-agora';
import { db as firestore, functions } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import Avatar from '../../components/Avatar';
import RadarPulse from '../../components/RadarPulse';
import { showAlert } from '../../components/AppAlert';
import ReportProblemModal from '../../components/ReportProblemModal';
import { colors, spacing, fontSize, fontWeight, fontFamily } from '../../theme/tokens';

const generateAgoraToken = httpsCallable(functions, 'generateAgoraToken');

async function requestCallPermissions(needsCamera) {
  if (Platform.OS !== 'android') return true;
  const permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
  if (needsCamera) permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
  const results = await PermissionsAndroid.requestMultiple(permissions);
  return Object.values(results).every((r) => r === PermissionsAndroid.RESULTS.GRANTED);
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function VideoConsultationScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { channelId, callType = 'video', otherName, appointmentId, queueId } = route.params;
  const isVideo = callType === 'video';
  const { user, profile, isDoctor } = useUserContext();

  const [status, setStatus] = useState('connecting'); // connecting | waiting | connected | ended
  const [remoteUid, setRemoteUid] = useState(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(isVideo);
  const [duration, setDuration] = useState(0);
  const [otherUid, setOtherUid] = useState(null);
  const [reportVisible, setReportVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = appointmentId
          ? await getDoc(doc(firestore, 'appointments', appointmentId))
          : await getDoc(doc(firestore, 'consultationQueue', queueId));
        if (!snap.exists()) return;
        const data = snap.data();
        const patientId = data.patientId;
        const doctorId = data.doctorId || data.matchedDoctorId;
        setOtherUid(user.uid === patientId ? doctorId : patientId);
      } catch (err) {
        console.error('[VideoConsultationScreen] resolve other participant error:', err);
      }
    })();
  }, [appointmentId, queueId, user]);

  const engineRef = useRef(null);
  const localUidRef = useRef(0);
  const durationIntervalRef = useRef(null);

  const endCall = useCallback(
    async (navigateBack = true) => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      try {
        engineRef.current?.leaveChannel();
        engineRef.current?.release();
      } catch (err) {
        console.warn('[VideoConsultationScreen] teardown warning:', err);
      }
      engineRef.current = null;

      try {
        if (appointmentId) {
          await updateDoc(doc(firestore, 'appointments', appointmentId), { status: 'completed', updatedAt: serverTimestamp() });
        } else if (queueId) {
          await updateDoc(doc(firestore, 'consultationQueue', queueId), { status: 'completed' });
        }
      } catch (err) {
        console.error('[VideoConsultationScreen] mark completed error:', err);
      }

      if (navigateBack) navigation.goBack();
    },
    [appointmentId, queueId, navigation]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const granted = await requestCallPermissions(isVideo);
      if (!granted) {
        showAlert(
          t('call.permissionsNeededTitle'),
          t('call.permissionsNeededMessage', { access: isVideo ? t('call.cameraAndMic') : t('call.micOnly') }),
          [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
        );
        return;
      }

      try {
        const { data } = await generateAgoraToken({ channelId, appointmentId, queueId });
        if (cancelled) return;

        const engine = createAgoraRtcEngine();
        engineRef.current = engine;
        engine.initialize({ appId: data.appId, channelProfile: ChannelProfileType.ChannelProfileCommunication });
        engine.enableAudio();
        if (isVideo) engine.enableVideo();

        engine.registerEventHandler({
          onJoinChannelSuccess: (connection) => {
            localUidRef.current = connection.localUid ?? 0;
            setStatus('waiting');
          },
          onUserJoined: (_connection, uid) => {
            setRemoteUid(uid);
            setStatus('connected');
            durationIntervalRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
          },
          onUserOffline: () => {
            setRemoteUid(null);
            showAlert(t('call.callEndedTitle'), t('call.callEndedMessage', { name: otherName }), [
              { text: t('common.ok'), onPress: () => endCall(true) },
            ]);
          },
          onError: (err, msg) => console.error('[Agora] error:', err, msg),
        });

        engine.joinChannel(data.token, data.channelName, data.uid, {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishMicrophoneTrack: true,
          publishCameraTrack: isVideo,
          autoSubscribeAudio: true,
          autoSubscribeVideo: isVideo,
        });
      } catch (err) {
        console.error('[VideoConsultationScreen] join error:', err);
        if (!cancelled) {
          showAlert(t('call.couldNotConnect'), err.message || t('common.tryAgain'), [
            { text: t('common.ok'), onPress: () => navigation.goBack() },
          ]);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      try {
        engineRef.current?.leaveChannel();
        engineRef.current?.release();
      } catch {
        // engine may already be torn down by endCall()
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = () => {
    engineRef.current?.muteLocalAudioStream(!muted);
    setMuted(!muted);
  };

  const toggleCamera = () => {
    engineRef.current?.muteLocalVideoStream(!cameraOff);
    setCameraOff(!cameraOff);
  };

  const toggleSpeaker = () => {
    engineRef.current?.setEnableSpeakerphone(!speakerOn);
    setSpeakerOn(!speakerOn);
  };

  const switchCamera = () => engineRef.current?.switchCamera();

  const statusLabel = {
    connecting: t('call.connecting'),
    waiting: t('call.waitingFor', { name: otherName }),
    connected: formatDuration(duration),
  }[status];

  return (
    <SafeAreaView style={styles.container}>
      {isVideo && status === 'connected' && remoteUid != null ? (
        <RtcSurfaceView style={styles.remoteVideo} canvas={{ uid: remoteUid }} />
      ) : (
        <View style={styles.placeholder}>
          {status === 'connected' ? (
            <Avatar name={otherName} size="lg" />
          ) : (
            <RadarPulse color={colors.primary} size={140} showDot={false}>
              <Avatar name={otherName} size="lg" />
            </RadarPulse>
          )}
          <Text style={styles.otherName}>{otherName}</Text>
          <Text style={styles.statusLabel}>{statusLabel}</Text>
        </View>
      )}

      {isVideo && status !== 'ended' && !cameraOff && (
        <View style={styles.localVideo}>
          <RtcSurfaceView style={StyleSheet.absoluteFill} canvas={{ uid: 0 }} zOrderMediaOverlay />
        </View>
      )}

      <View style={styles.bottomOverlay}>
        {/* Once connected, RtcSurfaceView takes the full screen and the
            centered placeholder (which shows the name while
            connecting/waiting) is gone — this is the only place the other
            party's name stays visible during an active video call. */}
        {status === 'connected' && isVideo && (
          <View style={styles.callInfoRow}>
            <Text style={styles.callInfoName} numberOfLines={1}>{otherName}</Text>
            <Text style={styles.callInfoTimer}>{formatDuration(duration)}</Text>
          </View>
        )}
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.controlButton, muted && styles.controlButtonActive]} onPress={toggleMute}>
            <Icon name={muted ? 'mic-off' : 'mic'} size={22} color={colors.white} />
          </TouchableOpacity>
          {isVideo && (
            <>
              <TouchableOpacity style={[styles.controlButton, cameraOff && styles.controlButtonActive]} onPress={toggleCamera}>
                <Icon name={cameraOff ? 'videocam-off' : 'videocam'} size={22} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
                <Icon name="camera-reverse" size={22} color={colors.white} />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={[styles.controlButton, speakerOn && styles.controlButtonActive]} onPress={toggleSpeaker}>
            <Icon name={speakerOn ? 'volume-high' : 'volume-low'} size={22} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={() => setReportVisible(true)}>
            <Icon name="flag-outline" size={22} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.endButton} onPress={() => endCall(true)}>
            <Icon name="call" size={22} color={colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
        </View>
      </View>

      <ReportProblemModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        reporterId={user.uid}
        reporterName={profile?.displayName}
        reporterRole={isDoctor ? 'doctor' : 'patient'}
        reportedUserId={otherUid}
        reportedUserName={otherName}
        appointmentId={appointmentId || null}
        queueId={queueId || null}
        context="video_call"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: spacing.md,
  },
  statusLabel: {
    fontSize: fontSize.md,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  remoteVideo: {
    flex: 1,
  },
  localVideo: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    width: 100,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.white,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  callInfoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  callInfoName: {
    flexShrink: 1,
    marginRight: spacing.sm,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  // Mono for the duration figure, matching the app's existing convention
  // for time-like data (e.g. DoctorDashboardScreen's queue countdown) —
  // kept neutral/white rather than a brand color, since neither
  // green="self" nor cyan="other party" cleanly describes a call timer.
  callInfoTimer: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    color: colors.white,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
  },
  controlButtonActive: {
    backgroundColor: colors.primary,
  },
  endButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
  },
});
