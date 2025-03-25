import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

const VendorSignup = ({ navigation }) => {
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessAddress: '',
    businessType: '',
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

      // Prepare vendor data
      const vendorData = {
        businessName: formData.businessName,
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        businessAddress: formData.businessAddress,
        businessType: formData.businessType,
        createdAt: new Date().toISOString(),
        role: 'vendor'
      };

      // Create vendor document in vendors collection
      await setDoc(doc(db, 'vendors', user.uid), vendorData);

      // Create user document in users collection
      await setDoc(doc(db, 'users', user.uid), {
        email: formData.email,
        role: 'vendor',
        createdAt: new Date().toISOString()
      });

      console.log('Vendor signup successful - Role stored in both collections');
      
      // Clear form and navigate to login
      setFormData({
        businessName: '',
        ownerName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        businessAddress: '',
        businessType: '',
      });
      
      navigation.navigate('VendorLogin');
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
        Vendor Registration
      </Text>

      <TextInput
        label="Business Name"
        value={formData.businessName}
        onChangeText={(value) => updateFormData('businessName', value)}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Owner Name"
        value={formData.ownerName}
        onChangeText={(value) => updateFormData('ownerName', value)}
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
        label="Business Type"
        value={formData.businessType}
        onChangeText={(value) => updateFormData('businessType', value)}
        mode="outlined"
        style={styles.input}
        placeholder="e.g., Wholesale, Retail, Distribution"
      />

      <TextInput
        label="Business Address"
        value={formData.businessAddress}
        onChangeText={(value) => updateFormData('businessAddress', value)}
        mode="outlined"
        style={styles.input}
        multiline
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
        style={styles.button}
        loading={loading}
        disabled={loading}
        buttonColor="#2196F3"
      >
        Create Account
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('VendorLogin')}
        style={styles.loginLink}
        textColor="#2196F3"
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
  loginLink: {
    marginTop: 16,
    marginBottom: 24,
  },
});

export default VendorSignup;
