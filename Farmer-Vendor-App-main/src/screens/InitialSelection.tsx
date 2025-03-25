import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Button, Text } from 'react-native-paper';

const InitialSelection = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Welcome to FarmConnect
      </Text>
      
      <View style={styles.buttonContainer}>
        <Text style={styles.subtitle}>I am a...</Text>
        
        <Button
          mode="contained"
          onPress={() => navigation.navigate('FarmerLogin')}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor="#4CAF50"
        >
          Farmer
        </Button>

        <Button
          mode="contained"
          onPress={() => navigation.navigate('VendorLogin')}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor="#2196F3"
        >
          Vendor
        </Button>

        {__DEV__ && (
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('InitializeDatabase')}
            style={[styles.button, styles.devButton]}
          >
            Initialize Database (Dev Only)
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    marginBottom: 40,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  button: {
    marginVertical: 10,
    borderRadius: 8,
    elevation: 4,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  devButton: {
    marginTop: 40,
    borderColor: 'orange',
  },
});

export default InitialSelection;
