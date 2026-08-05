import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import SegmentedToggle from '../../components/SegmentedToggle';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing, radii, fontSize, fontWeight } from '../../theme/tokens';

// Demo scaffold only — no live payment gateway is wired up yet (a real
// integration, e.g. Flutterwave or a Mobile Money API, is future work).
export default function PaymentScreen() {
  const [method, setMethod] = useState('mobile_money');
  const [mobileNumber, setMobileNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handleSubmit = () => {
    if (method === 'mobile_money' && !mobileNumber) {
      showAlert('Missing details', 'Please enter your mobile money number.');
      return;
    }
    if (method === 'card' && (!cardNumber || !expiry || !cvv)) {
      showAlert('Missing details', 'Please fill in all card fields.');
      return;
    }
    showAlert('Demo mode', 'This is a preview of the payment flow — no real payment gateway is connected yet.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.banner}>
          <Icon name="information-circle-outline" size={18} color={colors.info} />
          <Text style={styles.bannerText}>Demo only — no live payment gateway is connected yet.</Text>
        </View>

        <SegmentedToggle
          style={styles.toggle}
          value={method}
          onChange={setMethod}
          options={[
            { value: 'mobile_money', label: 'Mobile Money' },
            { value: 'card', label: 'Card' },
          ]}
        />

        {method === 'mobile_money' ? (
          <Input label="Mobile money number" placeholder="e.g. 0772 123 456" keyboardType="phone-pad" value={mobileNumber} onChangeText={setMobileNumber} />
        ) : (
          <>
            <Input label="Card number" keyboardType="numeric" value={cardNumber} onChangeText={setCardNumber} />
            <Input label="Expiry (MM/YY)" keyboardType="numeric" value={expiry} onChangeText={setExpiry} />
            <Input label="CVV" keyboardType="numeric" secureTextEntry value={cvv} onChangeText={setCvv} />
          </>
        )}

        <Button title="Submit payment" onPress={handleSubmit} style={styles.submitButton} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.ink,
    marginLeft: spacing.sm,
  },
  toggle: {
    marginBottom: spacing.lg,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
