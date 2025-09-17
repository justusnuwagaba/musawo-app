// SystemLogsScreen.js
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const SystemLogsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>System Logs</Text>
      <Button title="View Admin Actions" onPress={() => {/* Add functionality */}} />
      <Button title="View Changes to User Accounts" onPress={() => {/* Add functionality */}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default SystemLogsScreen;