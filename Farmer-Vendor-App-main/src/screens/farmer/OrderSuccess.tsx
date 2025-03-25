import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Title, Button, Text } from 'react-native-paper';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type RootStackParamList = {
  InitialSelection: undefined;
  FarmerLogin: undefined;
  FarmerSignup: undefined;
  VendorLogin: undefined;
  VendorSignup: undefined;
  FarmerRoot: undefined;
  ProductDetails: { productId: string };
  OrderSuccess: undefined;
};

type TabParamList = {
  HomeTab: undefined;
  CartTab: undefined;
  OrdersTab: undefined;
};

type OrderSuccessNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

const OrderSuccess = () => {
  const navigation = useNavigation<OrderSuccessNavigationProp>();

  const handleContinueShopping = () => {
    // Reset navigation stack to HomeTab
    navigation.reset({
      index: 0,
      routes: [
        { 
          name: 'FarmerRoot',
          state: {
            type: 'tab',
            index: 0,
            routes: [{ name: 'HomeTab' }]
          }
        }
      ],
    });
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Order Placed Successfully! 🎉</Title>
      <Text style={styles.message}>
        Your order has been placed successfully and will be delivered in a few days.
      </Text>
      <Button 
        mode="contained" 
        onPress={handleContinueShopping}
        style={styles.button}
      >
        Continue Shopping
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    width: '100%',
  },
});

export default OrderSuccess;
