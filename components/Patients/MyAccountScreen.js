import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { firestore, auth } from './firebaseConfig';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';

const MyAccountScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        email: '',
        address: '',
        dob: '',
        role: ''
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const fetchUserDoc = async () => {
        const userId = auth.currentUser?.uid;
        if (!userId) return null;
        const usersCollectionRef = collection(firestore, 'users');
        const userQuery = query(usersCollectionRef, where("uid", "==", userId));
        const querySnapshot = await getDocs(userQuery);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0];
        } else {
            console.log("User document not found.");
            return null;
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userDoc = await fetchUserDoc();
                if (userDoc) {
                    const userData = userDoc.data();
                    const dob = userData.dob ? userData.dob.toDate().toLocaleDateString() : '';
                    setUser(userData);
                    setFormData({
                        name: userData.name || '',
                        phoneNumber: userData.phone || '',
                        email: userData.email || '',
                        address: userData.address || '',
                        dob: dob,
                        role: userData.role || ''
                    });
                } else {
                    Alert.alert('Error', 'No user data found. Please create an account.');
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                Alert.alert('Error', 'Failed to fetch user data.');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [navigation]);

    const handleInputChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleUpdate = async () => {
        setUpdating(true);
        try {
            const userDoc = await fetchUserDoc();
            if (userDoc) {
                await updateDoc(userDoc.ref, {
                    ...formData,
                    dob: new Date(formData.dob)
                });
                Alert.alert('Success', 'Your account information has been updated.');
                setIsEditing(false);
            } else {
                Alert.alert('Error', 'User document not found.');
            }
        } catch (error) {
            console.error("Error updating user data:", error);
            Alert.alert('Error', 'Failed to update user data.');
        } finally {
            setUpdating(false);
        }
    };

    const confirmCancelEdit = () => {
        Alert.alert(
            'Cancel Editing',
            'Are you sure you want to cancel? Unsaved changes will be lost.',
            [
                { text: 'No', style: 'cancel' },
                { text: 'Yes', onPress: () => setIsEditing(false) }
            ]
        );
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#007BFF" style={styles.loadingIndicator} />;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Account</Text>
            {isEditing ? (
                <>
                    {['name', 'phoneNumber', 'email', 'address', 'dob', 'role'].map((field, index) => (
                        <View key={index} style={styles.inputContainer}>
                            <Icon name={getIconName(field)} size={20} color="#007BFF" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                                value={formData[field]}
                                onChangeText={(value) => handleInputChange(field, value)}
                                accessibilityLabel={`${field} input`}
                            />
                        </View>
                    ))}
                    <TouchableOpacity
                        style={[styles.button, updating && styles.disabledButton]}
                        onPress={handleUpdate}
                        disabled={updating}
                        accessibilityLabel="Update account information"
                    >
                        <Text style={styles.buttonText}>{updating ? 'Updating...' : 'Update'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={confirmCancelEdit}
                        accessibilityLabel="Cancel editing"
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    {['name', 'phoneNumber', 'email', 'address', 'dob', 'role'].map((field, index) => (
                        <View key={index} style={styles.infoContainer}>
                            <Icon name={getIconName(field)} size={20} color="#007BFF" style={styles.icon} />
                            <Text style={styles.label}>{`${field.charAt(0).toUpperCase() + field.slice(1)}: ${formData[field]}`}</Text>
                        </View>
                    ))}
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setIsEditing(true)}
                        accessibilityLabel="Edit account information"
                    >
                        <Icon name="pencil" size={20} color="#fff" />
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

const getIconName = (field) => {
    switch (field) {
        case 'name':
            return 'person';
        case 'phoneNumber':
            return 'call';
        case 'email':
            return 'mail';
        case 'address':
            return 'home';
        case 'dob':
            return 'calendar';
        case 'role':
            return 'briefcase';
        default:
            return 'help-circle';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#007BFF',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#007BFF',
        marginBottom: 15,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        padding: 10,
        fontSize: 16,
        color: '#495057',
    },
    button: {
        backgroundColor: '#007BFF',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#f44336',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    label: {
        fontSize: 16,
        marginLeft: 10,
        color: '#495057',
    },
    editButton: {
        backgroundColor: '#28a745',
        padding: 10,
        borderRadius: 5,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
    },
    editButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    disabledButton: {
        backgroundColor: '#9e9e9e',
    },
    loadingIndicator: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default MyAccountScreen;