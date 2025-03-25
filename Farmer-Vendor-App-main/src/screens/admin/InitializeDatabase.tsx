import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { initializeProducts } from '../../utils/initializeData';

const InitializeDatabase = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleInitialize = async () => {
    try {
      setLoading(true);
      setStatus('Initializing database...');
      await initializeProducts();
      setStatus('Database initialized successfully!');
    } catch (error) {
      console.error('Error initializing database:', error);
      setStatus('Error initializing database. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Database Initialization</Text>
      <Text style={styles.warning}>
        Warning: This will add sample products to the database.
        Only use this in development or for testing purposes.
      </Text>
      
      <Button
        mode="contained"
        onPress={handleInitialize}
        loading={loading}
        style={styles.button}
      >
        Initialize Sample Data
      </Button>

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  warning: {
    color: 'orange',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    marginVertical: 20,
  },
  status: {
    textAlign: 'center',
    marginTop: 20,
  },
});

export default InitializeDatabase;
