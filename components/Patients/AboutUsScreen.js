import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons'; // Import necessary icons

const socialMediaLinks = {
  website: 'https://www.musawo.com',
  instagram: 'https://www.instagram.com/musawo',
  twitter: 'https://twitter.com/musawo',
  facebook: 'https://www.facebook.com/musawo',
  tiktok: 'https://www.tiktok.com/@musawo',
};

const handlePress = (url) => {
  Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open link'));
};

const AboutUsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>About Us</Text>
      <Text style={styles.paragraph}>
        Welcome to MusawoApp. We are dedicated to providing you with the best service possible.
        Our mission is to make your life easier by offering seamless and efficient solutions.
      </Text>
      <Text style={styles.paragraph}>
        Our team of experts works tirelessly to ensure that our app meets your needs and exceeds
        your expectations. Thank you for choosing us. We look forward to serving you.
      </Text>
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => handlePress(socialMediaLinks.website)}>
          <FontAwesome name="globe" size={24} color="#3b5998" />
        </TouchableOpacity>
        <Text style={styles.separator}>|</Text>
        <TouchableOpacity onPress={() => handlePress(socialMediaLinks.instagram)}>
          <FontAwesome name="instagram" size={24} color="#E1306C" />
        </TouchableOpacity>
        <Text style={styles.separator}>|</Text>
        <TouchableOpacity onPress={() => handlePress(socialMediaLinks.twitter)}>
          <FontAwesome name="twitter" size={24} color="#1DA1F2" />
        </TouchableOpacity>
        <Text style={styles.separator}>|</Text>
        <TouchableOpacity onPress={() => handlePress(socialMediaLinks.facebook)}>
          <FontAwesome name="facebook" size={24} color="#3b5998" />
        </TouchableOpacity>
        <Text style={styles.separator}>|</Text>
        <TouchableOpacity onPress={() => handlePress(socialMediaLinks.tiktok)}>
          <FontAwesome5 name="tiktok" size={24} color="#000000" />
        </TouchableOpacity>
      </View>
      <Text style={styles.copyright}>© MusawoApp @2024</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 15,
    textAlign: 'justify',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  separator: {
    fontSize: 24,
    color: '#666666',
    marginHorizontal: 8,
  },
  copyright: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default AboutUsScreen;
