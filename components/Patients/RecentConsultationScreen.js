import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const consultationsData = [
  {
    id: '1',
    doctor: 'Dr. Asiimwe Rashied',
    specialty: 'Cardiology',
    date: '2024-07-01',
    time: '08:30',
    summary: 'Follow-up consultation for heart condition',
  },
  {
    id: '2',
    doctor: 'Dr. Kemigisha Ruth',
    specialty: 'Dermatology',
    date: '2024-06-28',
    time: '10:00',
    summary: 'Skin rash evaluation and treatment',
  },
  // Add more consultations as needed
];

const RecentConsultationScreen = () => {
  return (
    <View style={styles.container}>
      <FlatList
        data={consultationsData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.consultationCard}>
            <Text style={styles.doctorName}>{item.doctor}</Text>
            <Text style={styles.specialty}>{item.specialty}</Text>
            <Text style={styles.dateTime}>{item.date} at {item.time}</Text>
            <Text style={styles.summary}>{item.summary}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#e8ecf4',
  },
  consultationCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D2A32',
    marginBottom: 10,
  },
  specialty: {
    fontSize: 16,
    color: '#1D2A32',
  },
  dateTime: {
    fontSize: 16,
    color: '#1D2A32',
  },
  summary: {
    fontSize: 16,
    color: '#757575',
    marginTop: 10,
  },
});

export default RecentConsultationScreen;
