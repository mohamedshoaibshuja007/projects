import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Text, Button, useTheme, Chip, Portal, Dialog } from 'react-native-paper';
import { auth, db } from '../../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import MapView, { Marker } from 'react-native-maps';

interface OrderItem {
  id: string;
  quantity: number;
  name: string;
  price: number;
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

interface Order {
  id: string;
  farmerId: string;
  items: OrderItem[];
  status: 'pending' | 'accepted' | 'rejected' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered';
  total: number;
  createdAt: Timestamp;
  shippingAddress: Address;
  phone: string;
}

const Orders = () => {
  const theme = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('vendorId', '==', auth.currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure createdAt is a proper Timestamp or undefined
          createdAt: data.createdAt ? data.createdAt : undefined
        } as Order;
      });
      
      // Sort orders by creation date (newest first)
      ordersData.sort((a, b) => {
        // If either date is missing, treat it as oldest
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        
        try {
          const dateA = a.createdAt.toDate();
          const dateB = b.createdAt.toDate();
          return dateB.getTime() - dateA.getTime();
        } catch (error) {
          console.error('Error comparing dates:', error);
          return 0;
        }
      });
      
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        status: newStatus,
        updatedAt: Timestamp.fromDate(new Date())
      });
      Alert.alert('Success', 'Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return '#FFA000'; // Orange
      case 'accepted':
        return '#4CAF50'; // Green
      case 'rejected':
        return '#F44336'; // Red
      case 'packed':
        return '#9C27B0'; // Purple
      case 'shipped':
        return '#3F51B5'; // Indigo
      case 'out_for_delivery':
        return '#009688'; // Teal
      case 'delivered':
        return '#2196F3'; // Blue
      default:
        return '#757575'; // Grey
    }
  };

  const formatDate = (timestamp: Timestamp | undefined) => {
    try {
      if (!timestamp || typeof timestamp.toDate !== 'function') {
        return 'Date not available';
      }
      const date = timestamp.toDate();
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date not available';
    }
  };

  const renderOrderItem = (order: Order) => (
    <Card key={order.id} style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Title>Order #{order.id.slice(-6)}</Title>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) }]}
            textStyle={{ color: '#fff' }}
          >
            {order.status.toUpperCase()}
          </Chip>
        </View>
        
        <Text style={styles.date}>Ordered on: {formatDate(order.createdAt)}</Text>
        
        <View style={styles.itemsContainer}>
          <Text style={styles.sectionTitle}>Items:</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.item}>
              <Text>{item.name}</Text>
              <Text>Quantity: {item.quantity}</Text>
              <Text>Price: ₹{item.price}</Text>
            </View>
          ))}
        </View>

        <View style={styles.addressContainer}>
          <Text style={styles.sectionTitle}>Delivery Address:</Text>
          <Text>{order.shippingAddress.line1}</Text>
          <Text>Landmark: {order.shippingAddress.landmark}</Text>
          <Text>Pincode: {order.shippingAddress.pincode}</Text>
          <Text>Phone: {order.phone}</Text>
        </View>

        <Text style={styles.total}>Total Amount: ₹{order.total}</Text>

        {order.status === 'pending' && (
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => handleUpdateStatus(order.id, 'accepted')}
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            >
              Accept
            </Button>
            <Button
              mode="contained"
              onPress={() => handleUpdateStatus(order.id, 'rejected')}
              style={[styles.actionButton, { backgroundColor: '#F44336' }]}
            >
              Reject
            </Button>
          </View>
        )}

        {order.status === 'accepted' && (
          <Button
            mode="contained"
            onPress={() => handleUpdateStatus(order.id, 'packed')}
            style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}
          >
            Mark as Packed
          </Button>
        )}

        {order.status === 'packed' && (
          <Button
            mode="contained"
            onPress={() => handleUpdateStatus(order.id, 'shipped')}
            style={[styles.actionButton, { backgroundColor: '#3F51B5' }]}
          >
            Mark as Shipped
          </Button>
        )}

        {order.status === 'shipped' && (
          <Button
            mode="contained"
            onPress={() => handleUpdateStatus(order.id, 'out_for_delivery')}
            style={[styles.actionButton, { backgroundColor: '#009688' }]}
          >
            Mark as Out for Delivery
          </Button>
        )}

        {order.status === 'out_for_delivery' && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Waiting for farmer to verify and accept the delivery
            </Text>
          </View>
        )}

        {order.shippingAddress.coordinates && (
          <Button
            mode="outlined"
            onPress={() => {
              setSelectedOrder(order);
              setDialogVisible(true);
            }}
            style={styles.mapButton}
          >
            View on Map
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      {orders.map(renderOrderItem)}

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Delivery Location</Dialog.Title>
          <Dialog.Content>
            {selectedOrder?.shippingAddress.coordinates && (
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: selectedOrder.shippingAddress.coordinates.latitude,
                  longitude: selectedOrder.shippingAddress.coordinates.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: selectedOrder.shippingAddress.coordinates.latitude,
                    longitude: selectedOrder.shippingAddress.coordinates.longitude,
                  }}
                  title="Delivery Location"
                  description={selectedOrder.shippingAddress.line1}
                />
              </MapView>
            )}
          </Dialog.Content>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChip: {
    borderRadius: 4,
  },
  date: {
    color: '#666',
    marginBottom: 12,
  },
  itemsContainer: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  item: {
    marginLeft: 8,
    marginBottom: 8,
  },
  addressContainer: {
    marginVertical: 8,
  },
  total: {
    fontWeight: 'bold',
    fontSize: 16,
    marginVertical: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  mapButton: {
    marginTop: 8,
  },
  map: {
    height: 300,
    marginTop: 8,
    borderRadius: 8,
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    color: '#1976D2',
    textAlign: 'center',
  },
});

export default Orders;
