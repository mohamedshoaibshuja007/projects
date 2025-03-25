import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Surface, Text, Title, useTheme, IconButton } from 'react-native-paper';
import { auth } from '../../config/firebase';
import { getAuth, signOut } from 'firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const VendorHome = ({ navigation }) => {
  const theme = useTheme();

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const menuItems = [
    {
      title: 'Add Product',
      icon: 'plus-circle',
      onPress: () => navigation.navigate('AddProduct'),
      description: 'Add a new product to your store'
    },
    {
      title: 'My Products',
      icon: 'package-variant',
      onPress: () => navigation.navigate('MyProducts'),
      description: 'View and manage your products'
    }
  ];

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcome}>Welcome back,</Text>
            <Title style={styles.name}>{auth.currentUser?.displayName || 'Vendor'}</Title>
          </View>
          <IconButton
            icon="logout"
            size={24}
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </View>
      </Surface>

      <ScrollView style={styles.content}>
        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <Surface key={index} style={styles.card} elevation={2}>
              <TouchableOpacity style={styles.cardContent} onPress={item.onPress}>
                <Icon name={item.icon} size={32} color={theme.colors.primary} />
                <Title style={styles.cardTitle}>{item.title}</Title>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </TouchableOpacity>
            </Surface>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 16,
    color: '#666',
  },
  name: {
    fontSize: 24,
    marginTop: 4,
  },
  logoutButton: {
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  cardContent: {
    padding: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default VendorHome;
