// DrNotificationsScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DrNotificationsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      {/* Display notifications related to appointments and messages */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default DrNotificationsScreen;