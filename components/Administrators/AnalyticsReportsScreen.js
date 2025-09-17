// AnalyticsReportsScreen.js
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const AnalyticsReportsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics and Reports</Text>
      <Button title="View User Activity" onPress={() => {/* Add functionality */}} />
      <Button title="Generate Custom Reports" onPress={() => {/* Add functionality */}} />
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

export default AnalyticsReportsScreen;