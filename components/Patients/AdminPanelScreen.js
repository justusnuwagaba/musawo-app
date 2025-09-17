import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 4000); // 4 seconds delay

    return () => clearTimeout(timer); // Clean up the timer
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text>MusawoApp</Text>
      <Text>to the</Text>
      <Text>World</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
