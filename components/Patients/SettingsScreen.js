import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';  // Correct import

const SettingsScreen = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');

  const toggleSwitch = () => setNotificationsEnabled(previousState => !previousState);

  const handleFeedback = () => {
    const url = 'market://details?id=https://play.google.com/'; // Replace with your app's URL
    Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.item}>
        <Text style={styles.itemText}>Notifications</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#075eec" }}
          thumbColor={notificationsEnabled ? "#f5dd4b" : "#f4f3f4"}
          onValueChange={toggleSwitch}
          value={notificationsEnabled}
        />
      </View>
      
      <View style={styles.item}>
        <Text style={styles.itemText}>Theme</Text>
        <Picker
          selectedValue={theme}
          style={{ height: 50, width: 150 }}
          onValueChange={(itemValue) => setTheme(itemValue)}
        >
          <Picker.Item label="Light" value="light" />
          <Picker.Item label="Dark" value="dark" />
        </Picker>
      </View>

      <View style={styles.item}>
        <Text style={styles.itemText}>Language</Text>
        <Picker
          selectedValue={language}
          style={{ height: 50, width: 150 }}
          onValueChange={(itemValue) => setLanguage(itemValue)}
        >
          <Picker.Item label="English" value="en" />
          <Picker.Item label="Spanish" value="es" />
          {/* Add more languages as needed */}
        </Picker>
      </View>
      
      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('ContactUs')}>
        <MaterialIcons name="contact-support" size={24} color="#075eec" />
        <Text style={styles.itemText}>Help Center</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.item} onPress={handleFeedback}>
        <MaterialIcons name="rate-review" size={24} color="#075eec" />
        <Text style={styles.itemText}>Provide Feedback</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8ecf4',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  itemText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    color: '#075eec',
  },
});

export default SettingsScreen;
