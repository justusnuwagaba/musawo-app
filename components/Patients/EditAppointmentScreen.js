import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Image } from 'react-native';
import { Calendar } from 'react-native-calendars';

const timeSlots = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
const specialties = ['Cardiology', 'Dermatology', 'Neurology'];
const types = ['In Person', 'Audio Call', 'Video Session'];

const EditAppointmentScreen = ({ route, navigation }) => {
  const { appointment } = route.params;
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleConfirm = () => {
    const updatedAppointment = {
      ...appointment,
      date: selectedDate,
      time: selectedTime,
      specialty: selectedSpecialty,
      type: selectedType,
      status: 'Rescheduled',
    };
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      navigation.navigate('MyAppointments', { updatedAppointment });
    }, 2000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: '#075eec' },
        }}
        style={styles.calendar}
      />
      <Text style={styles.subHeading}>Pick a time:</Text>
      <View style={styles.timeSlots}>
        {timeSlots.map((time, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.timeSlot, selectedTime === time && styles.selectedTimeSlot]}
            onPress={() => setSelectedTime(time)}
          >
            <Text style={styles.timeSlotText}>{time}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.subHeading}>Choose a Specialty:</Text>
      <View style={styles.specialties}>
        {specialties.map((specialty, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.specialty, selectedSpecialty === specialty && styles.selectedSpecialty]}
            onPress={() => setSelectedSpecialty(specialty)}
          >
            <Text style={styles.specialtyText}>{specialty}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.subHeading}>Type:</Text>
      <View style={styles.types}>
        {types.map((type, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.type, selectedType === type && styles.selectedType]}
            onPress={() => setSelectedType(type)}
          >
            <Text style={styles.typeText}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>Reschedule</Text>
      </TouchableOpacity>
      <Modal visible={showSuccess} transparent={true} animationType="fade">
        <View style={styles.successContainer}>
          <Image source={require('../../assets/success.png')} style={styles.successImage} />
          <Text style={styles.successText}>Your appointment has successfully been rescheduled!</Text>
          <TouchableOpacity onPress={() => setShowSuccess(false)}>
            <Text style={styles.successButton}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#e8ecf4',
  },
  calendar: {
    marginBottom: 20,
  },
  subHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#075eec',
    marginVertical: 10,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeSlot: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    margin: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedTimeSlot: {
    backgroundColor: '#075eec',
  },
  timeSlotText: {
    color: '#1D2A32',
  },
  specialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialty: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    margin: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedSpecialty: {
    backgroundColor: '#075eec',
  },
  specialtyText: {
    color: '#1D2A32',
  },
  types: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  type: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    margin: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedType: {
    backgroundColor: '#075eec',
  },
  typeText: {
    color: '#1D2A32',
  },
  confirmButton: {
    backgroundColor: '#075eec',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  successImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  successText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
  },
  successButton: {
    fontSize: 18,
    color: '#075eec',
    fontWeight: 'bold',
  },
});

export default EditAppointmentScreen;
