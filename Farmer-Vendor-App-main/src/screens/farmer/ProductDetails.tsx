import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, Image, ActivityIndicator } from 'react-native';
import { Surface, Text, Button, useTheme, Divider, Snackbar, IconButton } from 'react-native-paper';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import RatingStars from '../../components/RatingStars';

interface Product {
  id: string;
  productName: string;
  description: string;
  pricePerUnit: number;
  unit: string;
  minimumOrderQuantity: number;
  images: string[];
  stockStatus: string;
  vendorId: string;
  category: string;
  createdAt: string;
  status: string;
  quantity: number;
  brand: string;
}

interface Review {
  id: string;
  rating: number;
  review: string;
  farmerId: string;
  createdAt: string;
  farmerName?: string;
}

type ProductDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ProductDetails'
>;

const { width } = Dimensions.get('window');

const ProductDetails = ({ route }: any) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<ProductDetailsScreenNavigationProp>();
  const { productId } = route.params;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [vendorDetails, setVendorDetails] = useState<any>(null);
  const [quantity, setQuantity] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchProductAndVendor = async () => {
      try {
        // Fetch product details
        const productDoc = await getDoc(doc(db, 'products', productId));
        if (productDoc.exists()) {
          const productData = { id: productDoc.id, ...productDoc.data() } as Product;
          setProduct(productData);
          setQuantity(productData.minimumOrderQuantity);

          // Fetch vendor details
          const vendorsRef = collection(db, 'vendors');
          const q = query(vendorsRef, where('uid', '==', productData.vendorId));
          const vendorSnapshot = await getDocs(q);
          
          if (!vendorSnapshot.empty) {
            const vendorData = vendorSnapshot.docs[0].data();
            console.log('Vendor data:', vendorData);
            setVendorDetails(vendorData);
          } else {
            console.log('No vendor found for ID:', productData.vendorId);
          }
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndVendor();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('productId', '==', productId)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      const reviewsData = await Promise.all(
        reviewsSnapshot.docs.map(async (reviewDoc) => {
          const data = reviewDoc.data();
          // Fetch farmer name
          const farmerDocRef = doc(db, 'farmers', data.farmerId);
          const farmerDocSnap = await getDoc(farmerDocRef);
          const farmerData = farmerDocSnap.data();
          
          return {
            id: reviewDoc.id,
            ...data,
            farmerName: farmerData?.name || 'Anonymous Farmer',
            createdAt: data.createdAt,
          } as Review;
        })
      );

      setReviews(reviewsData);

      // Calculate average rating
      if (reviewsData.length > 0) {
        const avgRating = reviewsData.reduce((acc, curr) => acc + curr.rating, 0) / reviewsData.length;
        setAverageRating(avgRating);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleQuantityChange = (increment: boolean) => {
    if (!product) return;
    
    let newQuantity = quantity;
    if (increment) {
      if (quantity < product.quantity) {
        newQuantity = quantity + product.minimumOrderQuantity;
      }
    } else {
      if (quantity > product.minimumOrderQuantity) {
        newQuantity = quantity - product.minimumOrderQuantity;
      }
    }
    setQuantity(newQuantity);
  };

  const handleAddToCart = async () => {
    if (!product || !auth.currentUser || !quantity) {
      setSnackbarMessage('Please select a quantity');
      setSnackbarVisible(true);
      return;
    }

    if (quantity > product.quantity) {
      setSnackbarMessage('Selected quantity exceeds available stock');
      setSnackbarVisible(true);
      return;
    }

    setAddingToCart(true);

    try {
      const cartRef = collection(db, 'users', auth.currentUser.uid, 'cart');
      await addDoc(cartRef, {
        productId: product.id,
        name: product.productName,
        quantity: quantity,
        price: product.pricePerUnit,
        vendorId: product.vendorId,
        addedAt: new Date(),
        minimumOrderQuantity: product.minimumOrderQuantity,
        maxQuantity: product.quantity
      });

      setSnackbarMessage('Added to cart successfully');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setSnackbarMessage('Failed to add to cart');
      setSnackbarVisible(true);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleMessage = async () => {
    try {
      if (!product || !auth.currentUser) {
        console.log('Missing required data:', { product, user: auth.currentUser });
        return;
      }

      // Navigate to chat even if vendor details are not available
      navigation.navigate('FarmerChat', {
        vendorId: product.vendorId,
        vendorName: vendorDetails?.ownerName || 'Vendor'
      });
      
    } catch (error) {
      console.error('Error handling message:', error);
      setSnackbarMessage('Failed to open chat. Please try again.');
      setSnackbarVisible(true);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Product not found</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <Surface style={styles.surface}>
          <View style={styles.imageContainer}>
            {product.images && product.images.length > 0 ? (
              <Image
                source={{ uri: product.images[0] }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Icon name="image-off" size={50} color="#666" />
              </View>
            )}
          </View>

          <View style={styles.contentContainer}>
            <Text variant="headlineSmall" style={styles.title}>
              {product.productName}
            </Text>

            <View style={styles.priceContainer}>
              <Text variant="titleLarge" style={styles.price}>
                ₹{product.pricePerUnit}
              </Text>
              <Text style={styles.unit}>per {product.unit}</Text>
            </View>

            <View style={styles.stockStatus}>
              <Text
                style={[
                  styles.statusText,
                  { color: product.stockStatus === 'In Stock' ? '#4CAF50' : '#f44336' },
                ]}
              >
                {product.stockStatus}
              </Text>
            </View>

            <Divider style={styles.divider} />

            {vendorDetails && (
              <View style={styles.vendorInfo}>
                <Text variant="titleMedium" style={styles.vendorTitle}>
                  Vendor Details:
                </Text>
                <Text style={styles.vendorName}>{vendorDetails.ownerName}</Text>
                <Text style={styles.vendorLocation}>{vendorDetails.location}</Text>
              </View>
            )}

            <Text style={styles.description}>{product.description}</Text>

            <View style={styles.ratingContainer}>
              <View style={styles.averageRating}>
                <Text style={styles.ratingTitle}>Average Rating</Text>
                <RatingStars rating={averageRating} readonly size={24} />
                <Text style={styles.ratingText}>
                  {averageRating.toFixed(1)} ({reviews.length} reviews)
                </Text>
              </View>
            </View>

            <View style={styles.reviewsContainer}>
              <Text style={styles.reviewsTitle}>Reviews</Text>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewerName}>{review.farmerName}</Text>
                      <RatingStars rating={review.rating} readonly size={16} />
                    </View>
                    {review.review && (
                      <Text style={styles.reviewText}>{review.review}</Text>
                    )}
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noReviews}>No reviews yet</Text>
              )}
            </View>

            <View style={styles.quantityContainer}>
              <Text variant="titleMedium" style={styles.quantityTitle}>
                Quantity:
              </Text>
              <View style={styles.quantityControls}>
                <IconButton
                  icon="minus"
                  size={20}
                  onPress={() => handleQuantityChange(false)}
                  disabled={quantity <= product.minimumOrderQuantity}
                />
                <Text style={styles.quantityText}>
                  {quantity} {product.unit}
                </Text>
                <IconButton
                  icon="plus"
                  size={20}
                  onPress={() => handleQuantityChange(true)}
                  disabled={quantity >= product.quantity}
                />
              </View>
              <Text style={styles.minOrderText}>
                Minimum Order: {product.minimumOrderQuantity} {product.unit}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={handleAddToCart}
                loading={addingToCart}
                disabled={addingToCart || product.stockStatus !== 'In Stock'}
                style={styles.addToCartButton}
              >
                Add to Cart
              </Button>
              <Button
                mode="outlined"
                onPress={handleMessage}
                style={styles.messageButton}
              >
                Message Vendor
              </Button>
            </View>
          </View>
        </Surface>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  surface: {
    margin: 8,
    borderRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    color: '#2196F3',
    marginRight: 4,
  },
  unit: {
    color: '#666',
  },
  stockStatus: {
    marginBottom: 8,
  },
  statusText: {
    fontWeight: '500',
  },
  divider: {
    marginVertical: 16,
  },
  vendorInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  vendorTitle: {
    marginBottom: 4,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  vendorLocation: {
    color: '#666',
  },
  description: {
    marginBottom: 16,
    lineHeight: 24,
    color: '#666',
  },
  ratingContainer: {
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  averageRating: {
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingText: {
    marginTop: 4,
    color: '#666',
  },
  reviewsContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  reviewCard: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontWeight: 'bold',
  },
  reviewText: {
    marginBottom: 8,
  },
  reviewDate: {
    color: '#666',
    fontSize: 12,
  },
  noReviews: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  quantityContainer: {
    marginVertical: 16,
  },
  quantityTitle: {
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quantityText: {
    fontSize: 18,
    marginHorizontal: 16,
  },
  minOrderText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  actionButtons: {
    marginTop: 16,
    gap: 8,
  },
  addToCartButton: {
    marginBottom: 8,
  },
  messageButton: {
    marginBottom: 8,
  },
  snackbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default ProductDetails;
