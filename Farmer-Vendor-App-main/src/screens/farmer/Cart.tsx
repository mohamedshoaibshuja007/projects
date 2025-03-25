import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button, Card, Text, Title, useTheme, RadioButton, IconButton, TextInput } from 'react-native-paper';
import { auth, db } from '../../config/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FarmerStackParamList } from '../../types/navigation';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  vendorId: string;
  addedAt: Date;
  updatedAt?: Date;
  minimumOrderQuantity: number;
  maxQuantity: number;
}

interface Address {
  line1: string;
  landmark: string;
  pincode: string;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
}

type CartScreenNavigationProp = NativeStackNavigationProp<FarmerStackParamList>;

const Cart = () => {
  const theme = useTheme();
  const navigation = useNavigation<CartScreenNavigationProp>();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedAddress, setSavedAddress] = useState<Address | null>(null);
  const [phone, setPhone] = useState('');
  const [useProfileAddress, setUseProfileAddress] = useState(true);
  const [editingQuantity, setEditingQuantity] = useState<{ [key: string]: boolean }>({});
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchCartItems();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCartItems();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    fetchSavedAddress();
  }, []);

  const fetchCartItems = async () => {
    try {
      if (!auth.currentUser?.uid) {
        console.log('No user logged in');
        return;
      }

      console.log('Fetching cart items for user:', auth.currentUser.uid);
      const cartRef = collection(db, 'users', auth.currentUser.uid, 'cart');
      const cartSnapshot = await getDocs(cartRef);
      
      const items: CartItem[] = cartSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CartItem));

      console.log('Found cart items:', items);
      setCartItems(items);
      
      // Initialize quantities state
      const initialQuantities: { [key: string]: number } = {};
      items.forEach(item => {
        initialQuantities[item.id] = item.quantity;
      });
      setQuantities(initialQuantities);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      Alert.alert('Error', 'Failed to load cart items');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      if (!auth.currentUser?.uid) return;

      const cartItemRef = doc(db, 'users', auth.currentUser.uid, 'cart', itemId);
      await deleteDoc(cartItemRef);
      
      setCartItems(prev => prev.filter(item => item.id !== itemId));
      Alert.alert('Success', 'Item removed from cart');
    } catch (error) {
      console.error('Error deleting cart item:', error);
      Alert.alert('Error', 'Failed to remove item from cart');
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      if (!auth.currentUser?.uid) return;

      const item = cartItems.find(i => i.id === itemId);
      if (!item) return;

      if (newQuantity < item.minimumOrderQuantity) {
        Alert.alert('Error', `Minimum order quantity is ${item.minimumOrderQuantity}`);
        return;
      }

      if (newQuantity > item.maxQuantity) {
        Alert.alert('Error', `Maximum available quantity is ${item.maxQuantity}`);
        return;
      }

      const cartItemRef = doc(db, 'users', auth.currentUser.uid, 'cart', itemId);
      await updateDoc(cartItemRef, {
        quantity: newQuantity,
        updatedAt: new Date()
      });

      setCartItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
      setEditingQuantity(prev => ({ ...prev, [itemId]: false }));
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const fetchSavedAddress = async () => {
    try {
      const userDoc = doc(db, 'users', auth.currentUser?.uid || '');
      const docSnap = await getDoc(userDoc);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.address) {
          setSavedAddress(userData.address);
        }
        if (userData.phone) {
          setPhone(userData.phone);
        }
      }
    } catch (error) {
      console.error('Error fetching saved address:', error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!savedAddress || !phone) {
      Alert.alert('Error', 'Please add your address and phone number in your profile');
      return;
    }

    if (!auth.currentUser?.uid) {
      Alert.alert('Error', 'You must be logged in to place an order');
      return;
    }

    try {
      setLoading(true);
      console.log('Starting order placement with items:', cartItems);

      // Group items by vendor
      const itemsByVendor: { [key: string]: CartItem[] } = {};
      cartItems.forEach(item => {
        if (!itemsByVendor[item.vendorId]) {
          itemsByVendor[item.vendorId] = [];
        }
        itemsByVendor[item.vendorId].push(item);
      });

      console.log('Items grouped by vendor:', itemsByVendor);

      // Create an order for each vendor
      for (const vendorId in itemsByVendor) {
        const vendorItems = itemsByVendor[vendorId];
        const orderTotal = vendorItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        console.log('Creating order for vendor:', vendorId, { items: vendorItems, total: orderTotal });
        
        // Transform cart items to order items format
        const orderItems = vendorItems.map(item => ({
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          pricePerUnit: item.price,
          unit: 'unit', // Add appropriate unit if available
          brand: '' // Add brand if available
        }));

        await addDoc(collection(db, 'orders'), {
          farmerId: auth.currentUser.uid,
          vendorId,
          items: orderItems,
          status: 'pending',
          totalAmount: orderTotal, // Consistent field name
          createdAt: Timestamp.fromDate(new Date()),
          shippingAddress: savedAddress,
          phone: phone,
          paymentStatus: 'pending'
        });
      }

      // Clear cart after successful order
      console.log('Clearing cart...');
      const cartRef = collection(db, 'users', auth.currentUser.uid, 'cart');
      const cartSnapshot = await getDocs(cartRef);
      
      // Delete all cart items
      const deletePromises = cartSnapshot.docs.map(doc => {
        console.log('Deleting cart item:', doc.id);
        return deleteDoc(doc.ref);
      });
      
      await Promise.all(deletePromises);
      console.log('Cart cleared successfully');
      
      setCartItems([]);
      Alert.alert('Success', 'Orders placed successfully!');
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = () => {
    navigation.navigate('Main', { 
      screen: 'ProfileTab'
    });
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text>Your cart is empty</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Cart Items</Title>
      {cartItems.map((item) => (
        <Card key={item.id} style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title>{item.name}</Title>
              <IconButton
                icon="delete"
                size={20}
                onPress={() => handleDeleteItem(item.id)}
              />
            </View>
            <View style={styles.quantityContainer}>
              <Text>Quantity: </Text>
              {editingQuantity[item.id] ? (
                <View style={styles.quantityEditContainer}>
                  <TextInput
                    value={quantities[item.id]?.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      setQuantities(prev => ({ ...prev, [item.id]: num }));
                    }}
                    keyboardType="numeric"
                    style={styles.quantityInput}
                  />
                  <IconButton
                    icon="check"
                    size={20}
                    onPress={() => handleUpdateQuantity(item.id, quantities[item.id])}
                  />
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={() => {
                      setEditingQuantity(prev => ({ ...prev, [item.id]: false }));
                      setQuantities(prev => ({ ...prev, [item.id]: item.quantity }));
                    }}
                  />
                </View>
              ) : (
                <View style={styles.quantityDisplayContainer}>
                  <Text>{item.quantity}</Text>
                  <IconButton
                    icon="pencil"
                    size={20}
                    onPress={() => setEditingQuantity(prev => ({ ...prev, [item.id]: true }))}
                  />
                </View>
              )}
            </View>
            <Text>Price per unit: ₹{item.price}</Text>
            <Text>Total: ₹{item.price * item.quantity}</Text>
            <Text style={styles.minQuantityText}>
              Minimum order quantity: {item.minimumOrderQuantity}
            </Text>
          </Card.Content>
        </Card>
      ))}

      <Card style={styles.addressCard}>
        <Card.Content>
          <Title>Shipping Details</Title>
          <View style={styles.addressOptions}>
            <RadioButton.Group
              onValueChange={value => setUseProfileAddress(value === 'profile')}
              value={useProfileAddress ? 'profile' : 'different'}
            >
              <View style={styles.radioOption}>
                <RadioButton.Item
                  label="Use profile address"
                  value="profile"
                  position="leading"
                />
              </View>
            </RadioButton.Group>
          </View>

          {savedAddress ? (
            <View style={styles.addressDetails}>
              <Text>{savedAddress.line1}</Text>
              <Text>Landmark: {savedAddress.landmark}</Text>
              <Text>Pincode: {savedAddress.pincode}</Text>
              <Text>Phone: {phone}</Text>
              <Button
                mode="outlined"
                onPress={handleEditAddress}
                style={styles.editButton}
              >
                Edit Address
              </Button>
            </View>
          ) : (
            <View>
              <Text style={styles.warningText}>Please add your address in profile</Text>
              <Button
                mode="contained"
                onPress={handleEditAddress}
                style={styles.addButton}
              >
                Add Address
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      <View style={styles.totalContainer}>
        <Title>Total: ₹{calculateTotal()}</Title>
        <Button
          mode="contained"
          onPress={handlePlaceOrder}
          loading={loading}
          disabled={loading || !savedAddress}
          style={styles.placeOrderButton}
        >
          Place Order
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  quantityEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityInput: {
    width: 60,
    height: 40,
    marginHorizontal: 8,
  },
  minQuantityText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  addressCard: {
    marginBottom: 16,
  },
  addressOptions: {
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressDetails: {
    marginTop: 8,
  },
  editButton: {
    marginTop: 8,
  },
  warningText: {
    color: 'red',
  },
  addButton: {
    marginTop: 8,
  },
  totalContainer: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  placeOrderButton: {
    marginTop: 8,
  },
});

export default Cart;
