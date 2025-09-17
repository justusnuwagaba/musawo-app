import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function PaymentScreen() {
  const [paymentMethod, setPaymentMethod] = useState('Card'); // Default payment method
  const [cardNumber, setCardNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const handlePayment = () => {
    // Basic validation
    if (paymentMethod === 'Card') {
      if (!cardNumber || !expirationDate || !cvv) {
        Alert.alert('Error', 'Please fill in all card fields');
        return;
      }
      Alert.alert('Payment Successful', `Card Number: ${cardNumber}`);
    } else if (paymentMethod === 'Mobile Money') {
      if (!mobileNumber) {
        Alert.alert('Error', 'Please enter your mobile number');
        return;
      }
      Alert.alert('Payment Successful', `Mobile Number: ${mobileNumber}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Choose the Mode of Payment</Text>

      <Picker
        selectedValue={paymentMethod}
        style={styles.picker}
        onValueChange={(itemValue) => setPaymentMethod(itemValue)}
      >
        <Picker.Item label="Visa Card" value="Card" />
        <Picker.Item label="Mobile Money" value="Mobile Money" />
      </Picker>

      {paymentMethod === 'Card' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Card Number"
            value={cardNumber}
            onChangeText={setCardNumber}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Expiration Date (MM/YY)"
            value={expirationDate}
            onChangeText={setExpirationDate}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="CVV"
            value={cvv}
            onChangeText={setCvv}
            keyboardType="numeric"
            secureTextEntry
          />
        </>
      )}

      {paymentMethod === 'Mobile Money' && (
        <TextInput
          style={styles.input}
          placeholder="Mobile Number"
          value={mobileNumber}
          onChangeText={setMobileNumber}
          keyboardType="phone-pad"
        />
      )}

      <Button title="Submit Payment" onPress={handlePayment} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: '#e8ecf4',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#075eec',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    marginBottom: 15,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
});
