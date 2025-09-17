import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Icon from '@expo/vector-icons/Ionicons';
import { db } from './firebaseConfig'; // Ensure you have your Firestore configuration

const DATA = [
  { id: '1', title: 'Vaccination', subtitle: 'Convenience at home.', icon: 'medkit' },
  { id: '2', title: 'Immunization', subtitle: 'Convenience at home.', icon: 'medkit' },
  { id: '3', title: 'Chronic Illness', subtitle: 'Control persistent chronic illnesses.', icon: 'heart' },
  { id: '4', title: 'Health Screening', subtitle: 'Become responsible for your health', icon: 'heart' },
  { id: '5', title: 'Pharmacy', subtitle: 'Get affordable medicine', icon: 'medical' },
  { id: '6', title: 'Insurance', subtitle: 'Get the best insurance', icon: 'shield-checkmark' },
  { id: '7', title: 'Lab', subtitle: 'Order and manage lab tests', icon: 'flask' },
];

const HomeScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [region, setRegion] = useState(null);
  const [userName, setUserName] = useState('Justus Nuwagaba'); // Example logged-in user name
  const [whoNeedsDoctor, setWhoNeedsDoctor] = useState('');
  const [childDetails, setChildDetails] = useState({ firstName: '', lastName: '', dob: '', sex: '' });
  const [isChildDetailsVisible, setIsChildDetailsVisible] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    })();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.suggestionItem} onPress={() => handleNavigation(item.id)}>
      <Icon name={item.icon} size={24} color="#075eec" />
      <Text style={styles.suggestionTitle}>{item.title}</Text>
      {item.subtitle && <Text style={styles.suggestionSubtitle}>{item.subtitle}</Text>}
    </TouchableOpacity>
  );

  const handleNavigation = (id) => {
    switch (id) {
      case '1':
        navigation.navigate('Vaccination');
        break;
      case '2':
        navigation.navigate('Immunization');
        break;
      case '3':
        navigation.navigate('Chronic Illness');
        break;
      case '4':
        navigation.navigate('Health Screening');
        break;
      case '5':
        navigation.navigate('Pharmacy');
        break;
      case '6':
        navigation.navigate('Insurance');
        break;
      case '7':
        navigation.navigate('LabHome');
        break;
      default:
        break;
    }
  };

  const handleGetDoctor = () => {
    setModalVisible(true);
  };

  const handleWhoNeedsDoctor = (option) => {
    setWhoNeedsDoctor(option);
    setModalVisible(false);

    if (option === `Myself: ${userName}`) {
      // Navigate to searching for available doctors
      navigation.navigate('SearchingForDoctor'); // Create this screen
    } else if (option === 'My Child') {
      setIsChildDetailsVisible(true);
    } else if (option === 'Someone Else') {
      navigation.navigate('SignUp'); // Navigate to SignUp screen
    }
  };

  const handleSaveChildDetails = async () => {
    // Save child details to Firestore
    try {
      await db.collection('children').add({
        firstName: childDetails.firstName,
        lastName: childDetails.lastName,
        dob: childDetails.dob,
        sex: childDetails.sex,
      });
      Alert.alert('Success', 'Child details saved successfully.');
      setIsChildDetailsVisible(false);
      // Navigate to searching for available doctors
      navigation.navigate('SearchingForDoctor'); // Create this screen
    } catch (error) {
      Alert.alert('Error', 'Failed to save child details.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TouchableOpacity style={styles.optionButton} onPress={handleGetDoctor}>
          <Text style={styles.optionButtonText}>Get a doctor</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton} onPress={() => navigation.navigate('AppointmentScreen')}>
          <Text style={styles.optionButtonText}>Later</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.currentPlace}>
        <Text style={styles.currentPlaceText}>Home</Text>
        <Text style={styles.currentPlaceSubText}>Executive Apartments</Text>
      </View>
      <Text style={styles.sectionTitle}>Suggestions</Text>
      <FlatList
        data={DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionsContainer}
      />
      <Text style={styles.sectionTitle}>Save everyday</Text>
      <FlatList
        data={DATA.slice(3)}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionsContainer}
      />

      {/* Modal for selecting who needs a doctor */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Who needs a doctor?</Text>
          <TouchableOpacity style={styles.modalOption} onPress={() => handleWhoNeedsDoctor(`Myself: ${userName}`)}>
            <Text style={styles.modalOptionText}>Myself: {userName}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalOption} onPress={() => handleWhoNeedsDoctor('My Child')}>
            <Text style={styles.modalOptionText}>My Child (Must be under 18)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalOption} onPress={() => handleWhoNeedsDoctor('Someone Else')}>
            <Text style={styles.modalOptionText}>Someone Else</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonClose]}
            onPress={() => setModalVisible(!modalVisible)}
          >
            <Text style={styles.textStyle}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Child Details Input Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isChildDetailsVisible}
        onRequestClose={() => {
          setIsChildDetailsVisible(!isChildDetailsVisible);
        }}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Child's Details</Text>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={childDetails.firstName}
            onChangeText={(text) => setChildDetails({ ...childDetails, firstName: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={childDetails.lastName}
            onChangeText={(text) => setChildDetails({ ...childDetails, lastName: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Date of Birth (YYYY-MM-DD)"
            value={childDetails.dob}
            onChangeText={(text) => setChildDetails({ ...childDetails, dob: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Sex"
            value={childDetails.sex}
            onChangeText={(text) => setChildDetails({ ...childDetails, sex: text })}
          />
          <Text style={styles.disclaimer}>
            By entering this information, you confirm that you will make medical decisions for this child.
          </Text>
          <TouchableOpacity style={[styles.button, styles.buttonSave]} onPress={handleSaveChildDetails}>
            <Text style={styles.textStyle}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonClose]}
            onPress={() => setIsChildDetailsVisible(!isChildDetailsVisible)}
          >
            <Text style={styles.textStyle}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  optionButton: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#075eec',
    borderRadius: 20,
  },
  optionButtonText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  currentPlace: {
    marginBottom: 20,
  },
  currentPlaceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#075eec',
  },
  currentPlaceSubText: {
    color: '#777',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#075eec',
  },
  suggestionsContainer: {
    paddingVertical: 10,
  },
  suggestionItem: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8ecf4',
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#075eec',
    textAlign: 'center',
    marginTop: 5,
  },
  suggestionSubtitle: {
    color: '#777',
    textAlign: 'center',
  },
  modalView: {
    flex: 1,
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecf4',
    width: '100%',
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 18,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    width: '100%',
  },
  disclaimer: {
    fontSize: 12,
    color: '#777',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    width: '100%',
  },
  buttonSave: {
    backgroundColor: '#075eec',
    marginBottom: 10,
  },
  buttonClose: {
    backgroundColor: '#ccc',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default HomeScreen;