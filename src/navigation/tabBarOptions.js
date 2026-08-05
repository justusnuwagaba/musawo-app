import React from 'react';
import Icon from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily, fontSize } from '../theme/tokens';

// Shared bottom-tab look across Patient/Doctor/Admin navigators. A fixed
// tabBarStyle.height opts out of React Navigation's automatic safe-area
// padding, so we add the device's own bottom inset back in — otherwise the
// tab bar sits underneath the phone's gesture-nav bar on Android.
export function useBaseTabScreenOptions() {
  const insets = useSafeAreaInsets();
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.inkFaint,
    tabBarStyle: {
      height: 62 + insets.bottom,
      paddingBottom: 8 + insets.bottom,
      paddingTop: 6,
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
    },
    tabBarLabelStyle: { fontFamily: fontFamily.mono, fontSize: fontSize.xs },
  };
}

// Shared native-stack header look — spread into a Stack.Navigator's
// screenOptions. Not applied where headerShown is false throughout (e.g.
// AuthNavigator).
export const headerScreenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTitleStyle: { fontFamily: fontFamily.heading, color: colors.ink },
  headerTintColor: colors.ink,
};

// Per-screen icon option: pass an Ionicons name (without "-outline"); the
// outline variant renders automatically when the tab isn't focused.
export function tabIcon(iconName) {
  return {
    tabBarIcon: ({ focused, color, size }) => (
      <Icon name={focused ? iconName : `${iconName}-outline`} size={size} color={color} />
    ),
  };
}
