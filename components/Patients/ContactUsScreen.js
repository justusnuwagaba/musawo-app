import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Ensure you have this dependency installed

const ContactUsScreen = () => {
  const handleWhatsAppPress = () => {
    const url = 'whatsapp://send?phone=+256779552538';
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'WhatsApp is not installed on your device')
    );
  };

  const handleEmailPress = () => {
    const url = 'mailto:support@example.com';
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Unable to open email client')
    );
  };

  const handleCallPress = () => {
    const url = 'tel:+256779552538';
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Unable to make a call')
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subHeader}>We are happy to help</Text>
      <TouchableOpacity style={[styles.contactItem, { backgroundColor: '#e2f7d8' }]} onPress={handleWhatsAppPress}>
        <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
        <View style={styles.contactTextContainer}>
          <Text style={styles.contactTitle}>WhatsApp</Text>
          <Text style={styles.contactSubtitle}>24/7, fastest support</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.contactItem, { backgroundColor: '#fff7e1' }]} onPress={handleEmailPress}>
        <Ionicons name="mail-outline" size={24} color="#FF8C00" />
        <View style={styles.contactTextContainer}>
          <Text style={styles.contactTitle}>Email</Text>
          <Text style={styles.contactSubtitle}>Write to us</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.contactItem, { backgroundColor: '#e6f1f9' }]} onPress={handleCallPress}>
        <Ionicons name="call-outline" size={24} color="#007BFF" />
        <View style={styles.contactTextContainer}>
          <Text style={styles.contactTitle}>Call</Text>
          <Text style={styles.contactSubtitle}>Speak to our agent</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  subHeader: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  contactTextContainer: {
    marginLeft: 10,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#888888',
  },
});

export default ContactUsScreen;
