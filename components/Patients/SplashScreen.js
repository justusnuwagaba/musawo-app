import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000); // 2 seconds delay

    return () => clearTimeout(timer); // Clean up the timer
  }, [navigation]);

  return (
    <View style={styles.container}>

      <Image source={require('../../assets/Musawo.png')} style={styles.logo} />
   
      <Text style={styles.welcome}>Welcome</Text>
      <Text style={styles.to}>to</Text>
      <Text style={styles.appName}>Musawo App</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#075eec', // Change to a color that matches your theme
  },
  logo: {
    width: 100, // Adjust the size as needed
    height: 100, // Adjust the size as needed
    marginBottom: 20,
  },
  welcome: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
  },
  to: {
    fontSize: 25,
    color: '#fff',
  },
  appName: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#fff',
  },
});
