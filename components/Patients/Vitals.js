import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const VITALS_DATA = [
  { id: '1', type: 'Heart Rate', value: '72 bpm', date: '2024-07-20' },
  { id: '2', type: 'Blood Pressure', value: '120/80 mmHg', date: '2024-07-19' },
];

const Vitals = () => (
  <View style={styles.wrapper}>
    <Text style={styles.title}>Vitals</Text>
    <FlatList
      data={VITALS_DATA}
      renderItem={({ item }) => (
        <View style={styles.vitalItem}>
          <Text style={styles.vitalText}>Type: {item.type}</Text>
          <Text style={styles.vitalText}>Value: {item.value}</Text>
          <Text style={styles.vitalText}>Date: {item.date}</Text>
        </View>
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
    />
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
  container: {
    paddingBottom: 20,
  },
  vitalItem: {
    backgroundColor: '#075eec',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  vitalText: {
    fontSize: 16,
    color: '#fff',
  },
});

export default Vitals;
