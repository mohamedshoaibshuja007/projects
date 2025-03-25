import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

const FarmerSignup = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    farmLocation: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Store user data in Firestore - both in users and farmers collections
      const userData = {
        email: formData.email,
        role: 'farmer',
        createdAt: new Date().toISOString()
      };

      const farmerData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        farmLocation: formData.farmLocation,
        role: 'farmer', 
        createdAt: new Date().toISOString()
      };

      // Create user document in users collection
      await setDoc(doc(db, 'users', user.uid), userData);

      // Create farmer details in farmers collection
      await setDoc(doc(db, 'farmers', user.uid), farmerData);

      console.log('Signup successful - Role stored in both collections');
      
      // Sign out the user since we want them to log in explicitly
      await auth.signOut();
      
      // Show success message and navigate to login
      Alert.alert(
        'Account Created',
        'Your account has been created successfully. Please login with your credentials.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('FarmerLogin')
          }
        ]
      );
    } catch (err) {
      console.error('Signup error:', err);
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Farmer Sign Up
      </Text>

      <TextInput
        label="Full Name"
        value={formData.fullName}
        onChangeText={(value) => updateFormData('fullName', value)}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Email"
        value={formData.email}
        onChangeText={(value) => updateFormData('email', value)}
        mode="outlined"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        label="Phone Number"
        value={formData.phone}
        onChangeText={(value) => updateFormData('phone', value)}
        mode="outlined"
        style={styles.input}
        keyboardType="phone-pad"
      />

      <TextInput
        label="Farm Location"
        value={formData.farmLocation}
        onChangeText={(value) => updateFormData('farmLocation', value)}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Password"
        value={formData.password}
        onChangeText={(value) => updateFormData('password', value)}
        mode="outlined"
        style={styles.input}
        secureTextEntry
      />

      <TextInput
        label="Confirm Password"
        value={formData.confirmPassword}
        onChangeText={(value) => updateFormData('confirmPassword', value)}
        mode="outlined"
        style={styles.input}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        mode="contained"
        onPress={handleSignup}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Sign Up
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('FarmerLogin')}
        style={styles.button}
      >
        Already have an account? Login
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  error: {
    color: '#f44336',
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default FarmerSignup;
