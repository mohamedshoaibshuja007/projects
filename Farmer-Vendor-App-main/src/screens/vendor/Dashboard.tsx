import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signOut } from 'firebase/auth';

// Define the root stack param list
type RootStackParamList = {
  InitialSelection: undefined;
  FarmerLogin: undefined;
  VendorLogin: undefined;
  FarmerNavigator: undefined;
  VendorNavigator: undefined;
  AddProduct: undefined;
  ProductsTab: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DashboardStats {
  totalProducts: number;
  activeOrders: number;
  totalCustomers: number;
  revenue: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeOrders: 0,
    totalCustomers: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Navigate to InitialSelection screen and reset the navigation stack
      navigation.reset({
        index: 0,
        routes: [{ name: 'InitialSelection' }],
      });
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const vendorId = auth.currentUser?.uid;
      if (!vendorId) return;

      // Fetch total products
      const productsRef = collection(db, 'products');
      const productsQuery = query(productsRef, where('vendorId', '==', vendorId));
      const productsSnapshot = await getDocs(productsQuery);
      const totalProducts = productsSnapshot.size;

      // Fetch active orders
      const ordersRef = collection(db, 'orders');
      const activeOrdersQuery = query(
        ordersRef,
        where('vendorId', '==', vendorId),
        where('status', 'in', ['pending', 'processing'])
      );
      const ordersSnapshot = await getDocs(activeOrdersQuery);
      const activeOrders = ordersSnapshot.size;

      // Calculate revenue and unique customers
      let revenue = 0;
      const customerSet = new Set();
      ordersSnapshot.forEach((doc) => {
        const orderData = doc.data();
        revenue += orderData.total || 0;
        if (orderData.customerId) {
          customerSet.add(orderData.customerId);
        }
      });

      setStats({
        totalProducts,
        activeOrders,
        totalCustomers: customerSet.size,
        revenue,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          {t('dashboard.title')}
        </Text>
        <Button
          mode="outlined"
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          {t('auth.logout')}
        </Button>
      </View>

      <View style={styles.grid}>
        <Card style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]}>
          <Card.Content style={styles.cardContent}>
            <Icon name="package-variant" size={32} color={theme.colors.primary} />
            <Text variant="titleLarge">{stats.totalProducts}</Text>
            <Text variant="bodyMedium">{t('dashboard.totalProducts')}</Text>
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.secondaryContainer }]}>
          <Card.Content style={styles.cardContent}>
            <Icon name="clipboard-list" size={32} color={theme.colors.secondary} />
            <Text variant="titleLarge">{stats.activeOrders}</Text>
            <Text variant="bodyMedium">{t('dashboard.activeOrders')}</Text>
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.tertiaryContainer }]}>
          <Card.Content style={styles.cardContent}>
            <Icon name="account-group" size={32} color={theme.colors.tertiary} />
            <Text variant="titleLarge">{stats.totalCustomers}</Text>
            <Text variant="bodyMedium">{t('dashboard.totalCustomers')}</Text>
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content style={styles.cardContent}>
            <Icon name="currency-inr" size={32} color={theme.colors.primary} />
            <Text variant="titleLarge">₹{stats.revenue}</Text>
            <Text variant="bodyMedium">{t('dashboard.totalRevenue')}</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => navigation.navigate('AddProduct')}
          style={styles.button}
        >
          {t('dashboard.addProduct')}
        </Button>

        <Button
          mode="outlined"
          icon="view-list"
          onPress={() => navigation.navigate('ProductsTab')}
          style={styles.button}
        >
          {t('dashboard.viewProducts')}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    flex: 1,
  },
  logoutButton: {
    marginLeft: 16,
  },
  grid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 16,
  },
  cardContent: {
    alignItems: 'center',
    padding: 16,
  },
  actions: {
    padding: 16,
  },
  button: {
    marginBottom: 12,
  },
});

export default Dashboard;
