import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BloodGroup = ({ bloodType }) => (
  <View style={styles.wrapper}>
    <Text style={styles.title}>Blood Group</Text>
    <View style={styles.bloodGroupContainer}>
      <Text style={styles.bloodGroup}>{bloodType}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#e8ecf4',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  bloodGroupContainer: {
    backgroundColor: '#075eec',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  bloodGroup: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default BloodGroup;