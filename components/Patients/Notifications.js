import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const NOTIFICATIONS_DATA = [
  { id: '1', message: 'Your lab results are ready.' },
  { id: '2', message: 'You have an upcoming appointment.' },
  { id: '3', message: 'Your prescription is ready for pickup.' },
];

const Notifications = () => (
  <View style={styles.wrapper}>
    <Text style={styles.title}>Notifications</Text>
    <FlatList
      data={NOTIFICATIONS_DATA}
      renderItem={({ item }) => (
        <View style={styles.notificationItem}>
          <Text style={styles.notificationText}>{item.message}</Text>
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
  notificationItem: {
    backgroundColor: '#075eec',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  notificationText: {
    fontSize: 16,
    color: '#fff',
  },
});

export default Notifications;
