import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  Image,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator, // Import ActivityIndicator
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { auth } from './firebaseConfig'; 
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login({ navigation }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
    if (value !== '') {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: false }));
    }
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const signIn = async () => {
    let valid = true;
    let newErrors = {};
    if (!form.email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Invalid email format';
      valid = false;
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
      valid = false;
    }
    setErrors(newErrors);
    if (valid) {
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        navigation.replace('Main'); // Navigate to the main screen after successful Login
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert('Error', 'Please fix the errors and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <KeyboardAwareScrollView>
          <View style={styles.header}>
            <Image
              source={{ uri: 'https://www.example.com/image.png' }} // Update with a valid image URL
              style={styles.headerImg}
              resizeMode="contain"
            />
            <Text style={styles.title}>
              Musawo<Text style={{ color: '#075eec' }}>App</Text>
            </Text>
            <Text style={styles.subtitle}>Your Health, Simplified</Text>
          </View>
          <View style={styles.form}>
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Email address</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={(email) => handleChange('email', email)}
                placeholder="nicole@example.com"
                placeholderTextColor="#A020F0"
                style={[styles.inputControl, errors.email && styles.errorInput]}
                value={form.email}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                secureTextEntry
                onChangeText={(password) => handleChange('password', password)}
                placeholder="********"
                placeholderTextColor="#A020F0"
                style={[styles.inputControl, errors.password && styles.errorInput]}
                value={form.password}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>
            <TouchableOpacity onPress={signIn} disabled={loading}>
              <View style={styles.btn}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Sign in</Text>
                )}
              </View>
            </TouchableOpacity>
            <View style={styles.orContainer}>
              <View style={styles.line}></View>
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line}></View>
            </View>
            {/* Biometrics button removed */}
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              style={{ marginTop: 'auto' }}
            >
              <Text style={styles.formLink}>
                Don't have an account?{' '}
                <Text style={{ fontWeight: 'bold' }}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={{ marginTop: 10 }}
            >
              <Text style={styles.formLink}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8ecf4',
  },
  inner: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerImg: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D2A32',
  },
  subtitle: {
    fontSize: 16,
    color: '#A020F0',
    marginBottom: 16,
  },
  form: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  input: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  inputControl: {
    height: 50,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    borderRadius: 8,
    fontSize: 16,
    color: '#222',
    borderWidth: 1,
    borderColor: '#C9D3DB',
  },
  errorInput: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 4,
  },
  btn: {
    backgroundColor: '#075eec',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#C9D3DB',
  },
  orText: {
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  formLink: {
    fontSize: 16,
    color: '#075eec',
    textAlign: 'center',
    marginVertical: 8,
    fontWeight: 'bold',
  },
});