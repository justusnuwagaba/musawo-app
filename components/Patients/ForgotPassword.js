import React, { useState } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebaseConfig'; // Import your firebase configuration

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Password Reset Email Sent', 'Please check your email to reset your password.');
      navigation.navigate('Login'); // Navigate back to Login after sending the email
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email to reset your password.</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="email"
          placeholderTextColor="#A020F0"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity onPress={handleResetPassword}>
          <View style={styles.btn}>
            <Text style={styles.btnText}>Send Reset Email</Text>
          </View>
        </TouchableOpacity>
        {/* Add the "Back to log in" link */}
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.backToLoginText}>Back to log in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8ecf4',
    justifyContent: 'center',
    padding: 16,
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  input: {
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C9D3DB',
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
  },
  btn: {
    backgroundColor: '#075eec',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backToLoginText: {
    marginTop: 16,
    fontSize: 16,
    color: '#075eec',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
