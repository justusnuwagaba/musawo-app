import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import Input from '../../components/Input';
import Button from '../../components/Button';
import SpecialtyChip from '../../components/SpecialtyChip';
import { showAlert } from '../../components/AppAlert';
import { uploadDocumentToCloudinary } from '../../utils/uploadImage';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

const SPECIALTIES = ['General Practice', 'Pediatrics', 'Cardiology', 'Dermatology', 'Gynecology', 'Psychiatry', 'Dentistry', 'Neurology'];
const LANGUAGES = ['English', 'Luganda', 'Swahili'];

export default function DoctorApplicationScreen({ navigation }) {
  const { user, profile, updateProfile } = useUserContext();
  const [licenseNumber, setLicenseNumber] = useState('');
  const [issuingBody, setIssuingBody] = useState('');
  const [specialty, setSpecialty] = useState(null);
  const [yearsExperience, setYearsExperience] = useState('');
  const [languages, setLanguages] = useState(['English']);
  const [bio, setBio] = useState('');
  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAddDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
    if (result.canceled) return;

    const asset = result.assets[0];
    setUploadingDoc(true);
    try {
      const { url } = await uploadDocumentToCloudinary(asset.uri, asset.mimeType, asset.name);
      setDocuments((prev) => [...prev, { url, fileName: asset.name, mimeType: asset.mimeType, uploadedAt: new Date().toISOString() }]);
    } catch (err) {
      console.error('[DoctorApplicationScreen] document upload error:', err);
      showAlert('Could not upload document', 'Please try again.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRemoveDocument = (index) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleLanguage = (lang) => {
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  };

  const handleSubmit = async () => {
    if (!licenseNumber.trim() || !issuingBody.trim() || !specialty) {
      showAlert('Missing details', 'Please fill in your license number, issuing body, and specialty.');
      return;
    }

    setSubmitting(true);
    try {
      await setDoc(doc(firestore, 'doctorApplications', user.uid), {
        uid: user.uid,
        fullName: profile?.displayName || '',
        licenseNumber: licenseNumber.trim(),
        issuingBody: issuingBody.trim(),
        specialty,
        yearsExperience: Number(yearsExperience) || 0,
        languagesSpoken: languages,
        bio: bio.trim(),
        documents,
        status: 'pending',
        submittedAt: serverTimestamp(),
      });

      // Non-protected profile fields — self-writable regardless of role.
      await updateProfile({
        licenseNumber: licenseNumber.trim(),
        specialty,
        yearsExperience: Number(yearsExperience) || 0,
        languagesSpoken: languages,
        bio: bio.trim(),
      });

      // Protected fields — only this exact patient->doctor(pending) shape is
      // allowed by firestore.rules; full verification is an admin-only step.
      await updateDoc(doc(firestore, 'users', user.uid), {
        role: 'doctor',
        isVerified: false,
        verificationStatus: 'pending',
        updatedAt: serverTimestamp(),
      });
      // RootNavigator reacts to the role change and switches to the
      // verification-pending screen automatically.
    } catch (err) {
      console.error('[DoctorApplicationScreen] submit error:', err);
      showAlert('Could not submit', 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Apply to become a doctor</Text>
        <Text style={styles.subtitle}>
          Your details are reviewed by a Musawo admin against your medical license before you can see patients.
        </Text>

        <Input label="License number" placeholder="e.g. UMB-12345" value={licenseNumber} onChangeText={setLicenseNumber} />
        <Input label="Issuing body" placeholder="e.g. Uganda Medical & Dental Practitioners Council" value={issuingBody} onChangeText={setIssuingBody} />

        <Text style={styles.label}>Specialty</Text>
        <View style={styles.chipWrap}>
          {SPECIALTIES.map((item) => (
            <SpecialtyChip key={item} label={item} selected={specialty === item} onPress={() => setSpecialty(item)} />
          ))}
        </View>

        <Input label="Years of experience" keyboardType="numeric" value={yearsExperience} onChangeText={setYearsExperience} />

        <Text style={styles.label}>Languages spoken</Text>
        <View style={styles.chipWrap}>
          {LANGUAGES.map((lang) => (
            <SpecialtyChip key={lang} label={lang} selected={languages.includes(lang)} onPress={() => toggleLanguage(lang)} />
          ))}
        </View>

        <Input label="Short bio" placeholder="Tell patients about your practice" value={bio} onChangeText={setBio} multiline />

        <Text style={styles.label}>Supporting documents (license, ID)</Text>
        {documents.map((docItem, index) => (
          <View key={docItem.url} style={styles.docRow}>
            <Icon name={docItem.mimeType?.includes('pdf') ? 'document-text-outline' : 'image-outline'} size={20} color={colors.primary} />
            <Text style={styles.docName} numberOfLines={1}>{docItem.fileName}</Text>
            <TouchableOpacity onPress={() => handleRemoveDocument(index)}>
              <Icon name="close-circle" size={20} color={colors.inkFaint} />
            </TouchableOpacity>
          </View>
        ))}
        <Button
          title="Add supporting document"
          variant="outline"
          onPress={handleAddDocument}
          loading={uploadingDoc}
          style={styles.addDocButton}
        />

        <Button title="Submit application" onPress={handleSubmit} loading={submitting} style={styles.submitButton} />
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
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  docName: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.ink,
    marginHorizontal: spacing.sm,
  },
  addDocButton: {
    marginBottom: spacing.lg,
  },
  submitButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
