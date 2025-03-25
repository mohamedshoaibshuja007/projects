import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      await sendPasswordResetEmail(auth, email);
      setMessage({
        type: 'success',
        text: 'Password reset email sent! Check your inbox.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to send reset email. Please verify your email address.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Reset Password
      </Text>

      <Text style={styles.description}>
        Enter your email address and we'll send you instructions to reset your password.
      </Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {message.text ? (
        <Text style={[
          styles.message,
          message.type === 'error' ? styles.error : styles.success
        ]}>
          {message.text}
        </Text>
      ) : null}

      <Button
        mode="contained"
        onPress={handleResetPassword}
        style={styles.button}
        loading={loading}
        disabled={loading}
        buttonColor="#4CAF50"
      >
        Send Reset Instructions
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        textColor="#4CAF50"
      >
        Back to Login
      </Button>
    </View>
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
  description: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  backButton: {
    marginTop: 16,
  },
  message: {
    marginBottom: 16,
    textAlign: 'center',
    padding: 10,
    borderRadius: 4,
  },
  error: {
    color: '#f44336',
    backgroundColor: '#ffebee',
  },
  success: {
    color: '#4caf50',
    backgroundColor: '#e8f5e9',
  },
});

export default ForgotPassword;
