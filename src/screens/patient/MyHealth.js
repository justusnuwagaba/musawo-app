import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';
import { PATIENT_ROUTES } from '../../navigation/routes';

const HEALTH_ITEMS = [
  { id: '1', title: 'Medical Records', icon: 'document-text-outline', route: PATIENT_ROUTES.MEDICAL_RECORDS },
  { id: '2', title: 'Lab Results', icon: 'flask-outline', route: PATIENT_ROUTES.LAB_RESULTS },
  { id: '3', title: 'Blood Group', icon: 'water-outline', route: PATIENT_ROUTES.BLOOD_GROUP },
  { id: '4', title: 'Vaccination', icon: 'medkit-outline', route: PATIENT_ROUTES.VACCINATION_HOME },
  { id: '5', title: 'Chronic Illness', icon: 'heart-outline', route: PATIENT_ROUTES.CHRONIC_HOME },
  { id: '6', title: 'Health Screening', icon: 'thermometer-outline', route: PATIENT_ROUTES.SCREENING_HOME },
  { id: '7', title: 'Pharmacy', icon: 'medical-outline', route: PATIENT_ROUTES.PHARMACY_HOME },
  { id: '8', title: 'Insurance', icon: 'shield-checkmark-outline', route: PATIENT_ROUTES.INSURANCE_HOME },
];

export default function MyHealth({ navigation }) {
  return (
    <SafeAreaView style={styles.wrapper}>
      <FlatList
        data={HEALTH_ITEMS}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate(item.route)}>
            <Icon name={item.icon} size={26} color={colors.primary} />
            <Text style={styles.itemTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.container}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  item: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    width: '48%',
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
    ...shadow.card,
  },
  itemTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.ink,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
