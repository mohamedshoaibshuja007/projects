import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, Surface, Title, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';

type InitialSelectionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Initial'>;

interface InitialSelectionProps {
  navigation: InitialSelectionNavigationProp;
}

const InitialSelection: React.FC<InitialSelectionProps> = ({ navigation }) => {
  return (
    <Surface style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Icon name="sprout" size={80} color="#4CAF50" />
        </View>
        <Title style={styles.title}>Welcome to Farmer-Vendor</Title>
        <Text style={styles.subtitle}>
          Connect directly with local farmers and vendors
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('FarmerLogin')}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          I'm a Farmer
        </Button>

        <Button
          mode="contained"
          onPress={() => navigation.navigate('VendorLogin')}
          style={[styles.button, styles.vendorButton]}
          contentStyle={styles.buttonContent}
        >
          I'm a Vendor
        </Button>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
    color: '#2E7D32',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  button: {
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  vendorButton: {
    backgroundColor: '#2196F3',
  },
});

export default InitialSelection;
