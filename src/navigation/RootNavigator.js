import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { useUserContext } from '../context/UserProvider';
import RadarPulse from '../components/RadarPulse';
import AuthNavigator from './AuthNavigator';
import PatientNavigator from './PatientNavigator';
import DoctorNavigator from './DoctorNavigator';
import AdminNavigator from './AdminNavigator';
import VerificationPendingScreen from '../screens/doctor/VerificationPendingScreen';
import { colors } from '../theme/tokens';

// Extends React Navigation's own DarkTheme with our exact tokens, so the
// container background/borders behind and between screens (transition
// flashes, unstyled gaps) match the app rather than RN Navigation's default
// dark gray.
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.ink,
    border: colors.border,
    notification: colors.accent,
  },
};

export default function RootNavigator() {
  const { isAuthenticated, isLoading, role, isVerifiedDoctor, isAdmin } = useUserContext();

  let content;
  if (isLoading) {
    content = (
      <View style={styles.loadingContainer}>
        <RadarPulse color={colors.primary} size={140} />
      </View>
    );
  } else if (!isAuthenticated) {
    content = <AuthNavigator />;
  } else if (isAdmin) {
    content = <AdminNavigator />;
  } else if (role === 'doctor') {
    content = isVerifiedDoctor ? <DoctorNavigator /> : <VerificationPendingScreen />;
  } else {
    content = <PatientNavigator />;
  }

  return <NavigationContainer theme={navigationTheme}>{content}</NavigationContainer>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
