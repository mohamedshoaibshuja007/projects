import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import Home from '../screens/farmer/Home';
import Profile from '../screens/farmer/Profile';
import Cart from '../screens/farmer/Cart';
import Orders from '../screens/farmer/Orders';
import ProductDetails from '../screens/farmer/ProductDetails';
import ChatList from '../screens/farmer/ChatList';
import Chat from '../screens/farmer/Chat';
import OrderDeliveryScreen from '../screens/OrderDeliveryScreen';
import type { FarmerTabParamList, FarmerStackParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<FarmerTabParamList>();
const Stack = createNativeStackNavigator<FarmerStackParamList>();

const MainTabs = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.outline,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.onBackground,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={Home}
        options={{
          title: t('navigation.home'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={Orders}
        options={{
          title: t('navigation.orders'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="clipboard-list" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={Cart}
        options={{
          title: t('navigation.cart'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="cart" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={ChatList}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="chat" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={Profile}
        options={{
          title: t('navigation.profile'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const FarmerNavigator = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetails}
        options={{
          title: t('navigation.productDetails'),
        }}
      />
      <Stack.Screen
        name="FarmerChat"
        component={Chat}
        options={({ route }) => ({
          title: route.params?.vendorName || t('navigation.chat'),
        })}
      />
      <Stack.Screen
        name="OrderDelivery"
        component={OrderDeliveryScreen}
        options={{
          title: t('Delivery Verification'),
        }}
      />
    </Stack.Navigator>
  );
};

export default FarmerNavigator;
