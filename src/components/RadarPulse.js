import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors, radii } from '../theme/tokens';

const RING_DURATION = 1800;

function Ring({ size, color, delay }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: RING_DURATION, easing: Easing.out(Easing.ease) }), -1, false)
    );
    return () => cancelAnimation(progress);
  }, [delay]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ scale: 0.25 + progress.value * 0.85 }],
  }));

  return (
    <Animated.View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2, borderColor: color },
        style,
      ]}
    />
  );
}

/**
 * The app's signature "searching/waiting for a person" loading motif —
 * expanding rings around a center dot. Opt-in only, used at moments where
 * the app is genuinely waiting on another person (a doctor accepting a
 * consult, a call connecting), not generic data-loading (use LoadingSpinner
 * for that).
 *
 * color: pass colors.primary for patient-side "waiting for a doctor"
 * moments, colors.secondary for any future doctor-side waiting moment —
 * matches the app's green=self/cyan=other-party convention.
 * children: if passed (e.g. an Avatar), renders centered in place of the
 * dot — for "waiting for this specific person" moments.
 */
export default function RadarPulse({ size = 120, color = colors.primary, showDot = true, dotColor, children }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Ring size={size} color={color} delay={0} />
      <Ring size={size} color={color} delay={RING_DURATION / 3} />
      <Ring size={size} color={color} delay={(RING_DURATION / 3) * 2} />
      {children ?? (showDot && <View style={[styles.dot, { backgroundColor: dotColor ?? color }]} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: radii.pill,
  },
});
