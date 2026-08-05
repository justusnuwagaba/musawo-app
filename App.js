import 'react-native-gesture-handler';
import './src/i18n';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, TextInput } from 'react-native';
import { useFonts, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { UserProvider } from './src/context/UserProvider';
import RootNavigator from './src/navigation/RootNavigator';
import AppAlertHost from './src/components/AppAlert';
import LoadingSpinner from './src/components/LoadingSpinner';
import { fontFamily } from './src/theme/tokens';

// Applies the body font app-wide without hand-editing every screen's Text
// style — the standard pragmatic RN pattern for this. Per-screen
// fontWeight/fontSize StyleSheet overrides still win (array-style style
// prop), so this is low-risk.
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [{ fontFamily: fontFamily.body }, Text.defaultProps.style];
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = [{ fontFamily: fontFamily.body }, TextInput.defaultProps.style];

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) return <LoadingSpinner />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <UserProvider>
        <RootNavigator />
        <AppAlertHost />
      </UserProvider>
    </SafeAreaProvider>
  );
}
