import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Chip, Title, Button } from 'react-native-paper';
import { collection, query, where, onSnapshot, orderBy, Timestamp, DocumentData, doc, getDoc, updateDoc, addDoc, getDoc as getDocOnce, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FarmerStackParamList } from '../../types/navigation';
import ReviewModal from '../../components/ReviewModal';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  unit: string;
}

interface Address {
  line1: string;
  landmark: string;
  pincode: string;
}

interface Order {
  id: string;
  farmerId: string;
  vendorId: string;
  vendorName?: string;
  items: OrderItem[];
  status: 'pending' | 'accepted' | 'rejected' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered';
  totalAmount: number;
  createdAt: Timestamp;
  shippingAddress: Address;
  phone: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  reviewed?: boolean;
  acceptedByFarmer?: boolean;
  deliveredAt?: Timestamp;
}

interface VendorData extends DocumentData {
  ownerName: string;
  email: string;
  phone: string;
}

const Orders = () => {
  const theme = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<FarmerStackParamList>>();

  useEffect(() => {
    let unsubscribe: () => void;

    const setupOrdersListener = () => {
      if (!auth.currentUser) return;

      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('farmerId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(q, async (snapshot) => {
        try {
          const ordersData: Order[] = [];

          for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data();

            // Get vendor details
            const vendorDocRef = doc(db, 'vendors', data.vendorId);
            const vendorDocSnap = await getDoc(vendorDocRef);
            const vendorData = vendorDocSnap.data() as VendorData | undefined;

            ordersData.push({
              id: docSnapshot.id,
              ...data,
              vendorName: vendorData?.ownerName || 'Unknown Vendor',
              totalAmount: data.totalAmount || 0,
            } as Order);
          }

          setOrders(ordersData);
          setLoading(false);
        } catch (error) {
          console.error('Error processing orders:', error);
          setLoading(false);
        }
      }, (error) => {
        console.error('Error setting up orders listener:', error);
        setLoading(false);
      });
    };

    setupOrdersListener();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // The real-time listener will handle the refresh
    setRefreshing(false);
  }, []);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'accepted': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'packed': return '#9C27B0';
      case 'shipped': return '#3F51B5';
      case 'out_for_delivery': return '#009688';
      case 'delivered': return '#2196F3';
      default: return '#757575';
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    try {
      if (!timestamp?.toDate) return 'Date not available';
      const date = timestamp.toDate();
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (error) {
      return 'Date not available';
    }
  };

  const handleReview = async (rating: number, review: string) => {
    if (!selectedOrder) return;

    try {
      // Get the first product from the order items (since we're rating a specific product)
      const productId = selectedOrder.items[0].productId;
      
      if (!productId) {
        throw new Error('Product ID not found');
      }

      // Add the review to the reviews collection
      await addDoc(collection(db, 'reviews'), {
        productId,
        orderId: selectedOrder.id,
        farmerId: auth.currentUser?.uid,
        rating,
        review,
        createdAt: new Date().toISOString(),
      });

      // Update order status to reviewed
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        reviewed: true,
      });

      Alert.alert('Success', 'Thank you for your review!');
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    }
  };

  const handleAcceptDelivery = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'delivered',
        deliveredAt: serverTimestamp(),
        acceptedByFarmer: true
      });
      Alert.alert(t('Success'), t('Order marked as delivered'));
    } catch (error) {
      console.error('Error accepting delivery:', error);
      Alert.alert(t('Error'), t('Failed to update order status'));
    }
  };

  const renderOrderCard = ({ item: order }: { item: Order }) => {
    // Get the first product from order items
    const orderItem = order.items[0];
    
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.orderHeader}>
            <Title>Order #{order.id.slice(-8)}</Title>
            <Chip
              mode="outlined"
              style={[
                styles.statusChip,
                { borderColor: order.status === 'delivered' ? 'green' : 'orange' }
              ]}
            >
              {order.status}
            </Chip>
          </View>

          <View style={styles.orderDetails}>
            <Text style={styles.productName}>{orderItem.productName}</Text>
            <Text>Quantity: {orderItem.quantity} {orderItem.unit}</Text>
            <Text>Price: ₹{orderItem.pricePerUnit} per {orderItem.unit}</Text>
            <Text style={styles.total}>Total: ₹{order.totalAmount}</Text>
          </View>

          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Shipping Address:</Text>
            <Text>{order.shippingAddress.line1}</Text>
            <Text>Landmark: {order.shippingAddress.landmark}</Text>
            <Text>Pincode: {order.shippingAddress.pincode}</Text>
            <Text>Phone: {order.phone}</Text>
          </View>

          {order.status === 'out_for_delivery' && (
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={() => handleAcceptDelivery(order.id)}
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              >
                Accept Delivery
              </Button>
              <Button
                mode="contained"
                onPress={async () => {
                  // Get the product images first
                  const productDoc = await getDocOnce(doc(db, 'products', orderItem.productId));
                  const productData = productDoc.data();
                  const productImages = productData?.images || [];
                  
                  navigation.navigate('OrderDelivery', {
                    orderId: order.id,
                    productImages: productImages
                  });
                }}
                style={[styles.actionButton, { backgroundColor: '#FF5722' }]}
              >
                Report Issue
              </Button>
            </View>
          )}

          {order.status === 'delivered' && !order.reviewed && (
            <Button
              mode="contained"
              onPress={() => {
                setSelectedOrder(order);
                setReviewModalVisible(true);
              }}
              style={styles.reviewButton}
            >
              Rate Product
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />

      <ReviewModal
        visible={reviewModalVisible}
        onDismiss={() => {
          setReviewModalVisible(false);
          setSelectedOrder(null);
        }}
        onSubmit={handleReview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChip: {
    height: 28,
  },
  orderDetails: {
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addressSection: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  reviewButton: {
    marginTop: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});

export default Orders;
