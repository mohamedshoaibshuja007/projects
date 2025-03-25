import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../screens/farmer/Home';
import ProductDetails from '../screens/farmer/ProductDetails';
import Cart from '../screens/farmer/Cart';
import OrderSuccess from '../screens/farmer/OrderSuccess';
import OrderDeliveryScreen from '../screens/OrderDeliveryScreen';

const Stack = createNativeStackNavigator();

const FarmerStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={Home}
        options={{
          title: 'Farmer Marketplace',
        }}
      />
      <Stack.Screen 
        name="ProductDetails" 
        component={ProductDetails}
        options={{
          title: 'Product Details',
        }}
      />
      <Stack.Screen 
        name="Cart" 
        component={Cart}
        options={{
          title: 'Shopping Cart',
        }}
      />
      <Stack.Screen 
        name="OrderSuccess" 
        component={OrderSuccess}
        options={{
          title: 'Order Confirmation',
          headerLeft: () => null, // Prevent going back from success screen
        }}
      />
      <Stack.Screen
        name="OrderDelivery"
        component={OrderDeliveryScreen}
        options={{ title: 'Order Delivery' }}
      />
    </Stack.Navigator>
  );
};

export default FarmerStack;
