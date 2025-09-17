import React, { useState } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  Image,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { auth, firestore } from './firebaseConfig'; // Import Firebase config
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, getDocs } from 'firebase/firestore'; // Import Firestore functions
import DateTimePicker from '@react-native-community/datetimepicker'; // Add date picker library
import Icon from 'react-native-vector-icons/FontAwesome'; // Import icon library

export default function SignUp({ navigation }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    dob: new Date(),
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false); // Loading state
  const [showDatePicker, setShowDatePicker] = useState(false); // Date picker state
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State to toggle confirm password visibility

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
    if (value !== '') {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: false,
      }));
    }
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const passwordStrength = (password) => {
    if (password.length < 6) return 'Weak';
    if (password.length < 10) return 'Medium';
    return 'Strong';
  };

  const checkEmailExists = async (email) => {
    const usersCollection = collection(firestore, 'users');
    const querySnapshot = await getDocs(usersCollection);
    return querySnapshot.docs.some(doc => doc.data().email === email);
  };

  const signUp = async () => {
    let valid = true;
    let newErrors = {};
    // Validation checks
    if (!form.name) {
      newErrors.name = 'Name is required';
      valid = false;
    }
    if (!form.email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Invalid email format';
      valid = false;
    } else {
      const emailExists = await checkEmailExists(form.email);
      if (emailExists) {
        newErrors.email = 'Email is already in use';
        valid = false;
      }
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Confirm Password is required';
      valid = false;
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }
    if (!form.phone) {
      newErrors.phone = 'Phone number is required';
      valid = false;
    }
    if (!form.address) {
      newErrors.address = 'Address is required';
      valid = false;
    }
    if (!form.dob) {
      newErrors.dob = 'Date of Birth is required';
      valid = false;
    }
    setErrors(newErrors);
    if (valid) {
      setLoading(true); // Start loading
      try {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        const user = userCredential.user;
        // Prepare user data for Firestore
        const userData = {
          uid: user.uid,
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          dob: form.dob,
          createdAt: new Date(),
          role: "patient", // Set user role if needed
        };
        // Add user data to Firestore
        const usersCollection = collection(firestore, 'users');
        await addDoc(usersCollection, userData);
        Alert.alert('Success', 'Account created successfully!');
        navigation.navigate('Login');
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false); // Stop loading
      }
    } else {
      Alert.alert('Error', 'Please fix the errors and try again.');
    }
  };

  const showDatePickerHandler = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || form.dob;
    setShowDatePicker(false);
    setForm({ ...form, dob: currentDate });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#e8ecf4' }}>
      <View style={styles.container}>
        <KeyboardAwareScrollView>
          <View style={styles.header}>
            <Image
              source={{ uri: 'https://www.example.com/image.png' }} // Update to a valid image URL
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
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                autoCapitalize="words"
                onChangeText={(name) => handleChange('name', name)}
                placeholder="John Doe"
                placeholderTextColor="#A020F0"
                style={[
                  styles.inputControl,
                  errors.name && styles.errorInput,
                ]}
                value={form.name}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Email address</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={(email) => handleChange('email', email)}
                placeholder="nicole@example.com"
                placeholderTextColor="#A020F0"
                style={[
                  styles.inputControl,
                  errors.email && styles.errorInput,
                ]}
                value={form.email}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  secureTextEntry={!showPassword}
                  onChangeText={(password) => handleChange('password', password)}
                  placeholder="********"
                  placeholderTextColor="#A020F0"
                  style={[
                    styles.inputControl,
                    errors.password && styles.errorInput,
                  ]}
                  value={form.password}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon name={showPassword ? 'eye' : 'eye-slash'} size={20} color="#A020F0" />
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordStrength}>{passwordStrength(form.password)}</Text>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  secureTextEntry={!showConfirmPassword}
                  onChangeText={(confirmPassword) => handleChange('confirmPassword', confirmPassword)}
                  placeholder="********"
                  placeholderTextColor="#A020F0"
                  style={[
                    styles.inputControl,
                    errors.confirmPassword && styles.errorInput,
                  ]}
                  value={form.confirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Icon name={showConfirmPassword ? 'eye' : 'eye-slash'} size={20} color="#A020F0" />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                onChangeText={(phone) => handleChange('phone', phone)}
                placeholder="+256-772-789-070"
                placeholderTextColor="#A020F0"
                style={[
                  styles.inputControl,
                  errors.phone && styles.errorInput,
                ]}
                value={form.phone}
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                onChangeText={(address) => handleChange('address', address)}
                placeholder="Bunga, Kampala"
                placeholderTextColor="#A020F0"
                style={[
                  styles.inputControl,
                  errors.address && styles.errorInput,
                ]}
                value={form.address}
              />
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TouchableOpacity onPress={showDatePickerHandler}>
                <TextInput
                  editable={false}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#A020F0"
                  style={[
                    styles.inputControl,
                    errors.dob && styles.errorInput,
                  ]}
                  value={form.dob ? form.dob.toISOString().split('T')[0] : ''}
                />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={form.dob}
                  mode="date"
                  display="spinner" // Use spinner mode for easier selection
                  onChange={onDateChange}
                />
              )}
              {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
            </View>
            <TouchableOpacity onPress={signUp} disabled={loading}>
              <View style={styles.btn}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Sign Up</Text>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={{ marginTop: 'auto' }}
            >
              <Text style={styles.formLink}>
                Already have an account?{' '}
                <Text style={{ textDecorationLine: 'underline' }}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  title: {
    fontSize: 31,
    fontWeight: '700',
    color: '#1D2A32',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#A020F0',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  headerImg: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 18,
  },
  form: {
    marginBottom: 12,
    paddingHorizontal: 24,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  input: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  inputControl: {
    height: 50,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
    borderWidth: 1,
    borderColor: '#C9D3DB',
    borderStyle: 'solid',
  },
  errorInput: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 4,
  },
  passwordStrength: {
    fontSize: 14,
    color: '#A020F0',
    marginTop: 4,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    backgroundColor: '#075eec',
    borderColor: '#075eec',
    marginBottom: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formLink: {
    fontSize: 16,
    fontWeight: '600',
    color: '#075eec',
    textAlign: 'center',
    marginVertical: 20,
  },
});