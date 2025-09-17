// AppointmentScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { firestore } from './firebaseConfig'; // Adjust the import path as needed
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

const AppointmentScreen = () => {
  const navigation = useNavigation();
  const [specialists, setSpecialists] = useState([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchSpecialists = async () => {
      try {
        const specialistsCollection = collection(firestore, 'specialists');
        const specialistsSnapshot = await getDocs(specialistsCollection);
        const specialistsList = specialistsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSpecialists(specialistsList);
      } catch (error) {
        Alert.alert('Error fetching specialists:', error.message);
      }
    };

    fetchSpecialists();
  }, []);

  const handleSpecialtySelection = async (specialty) => {
    let updatedSelections = [...selectedSpecialties];
    if (selectedSpecialties.includes(specialty)) {
      updatedSelections = updatedSelections.filter((item) => item !== specialty);
    } else {
      updatedSelections.push(specialty);
    }
    setSelectedSpecialties(updatedSelections);

    // Fetch available doctors for the selected specialties
    const doctors = [];
    for (const selectedSpecialty of updatedSelections) {
      const specialtyDoc = doc(firestore, 'specialists', selectedSpecialty);
      const doctorsCollection = collection(specialtyDoc, 'doctors');
      const doctorsSnapshot = await getDocs(doctorsCollection);
      doctors.push(...doctorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    setAvailableDoctors(doctors);
  };

  const handleDoctorSelection = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleBooking = () => {
    if (selectedDoctor) {
      navigation.navigate('BookAppointment', { doctor: selectedDoctor });
      setShowSuccess(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subHeading}>Select Specialties</Text>
      <View style={styles.specialtiesContainer}>
        {specialists.map((specialty) => (
          <TouchableOpacity
            key={specialty.id}
            style={[
              styles.specialtyButton,
              selectedSpecialties.includes(specialty.id) && styles.selectedSpecialtyButton,
            ]}
            onPress={() => handleSpecialtySelection(specialty.id)}
          >
            <Text style={styles.specialtyButtonText}>{specialty.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.subHeading}>Available Doctors</Text>
      <FlatList
        data={availableDoctors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.doctorCard} onPress={() => handleDoctorSelection(item)}>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{item.name}</Text>
              <Text style={styles.rating}>Rating: {item.rating}</Text>
              {selectedDoctor && selectedDoctor.id === item.id && (
                <View style={styles.detailsContainer}>
                  <Text style={styles.detailsText}>{item.details}</Text>
                  <TouchableOpacity style={styles.bookButton} onPress={handleBooking}>
                    <Text style={styles.bookButtonText}>Book</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
      <Modal visible={showSuccess} transparent={true} animationType="fade">
        <View style={styles.successContainer}>
          <Text style={styles.successText}>
            You have successfully booked your appointment with {selectedDoctor && selectedDoctor.name}!
          </Text>
          <TouchableOpacity onPress={() => setShowSuccess(false)}>
            <Text style={styles.successButton}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#e8ecf4',
  },
  subHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#075eec',
    marginVertical: 10,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  specialtyButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    margin: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedSpecialtyButton: {
    backgroundColor: '#075eec',
  },
  specialtyButtonText: {
    color: '#1D2A32',
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rating: {
    fontSize: 16,
    color: '#757575',
  },
  detailsContainer: {
    marginTop: 10,
  },
  detailsText: {
    fontSize: 16,
    color: '#1D2A32',
    marginBottom: 10,
  },
  bookButton: {
    backgroundColor: '#075eec',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  successText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  successButton: {
    fontSize: 18,
    color: '#075eec',
    fontWeight: 'bold',
  },
});

export default AppointmentScreen;