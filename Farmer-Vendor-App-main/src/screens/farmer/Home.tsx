import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Animated, TouchableOpacity, Pressable, FlatList, Image, ActivityIndicator } from 'react-native';
import { Searchbar, IconButton, Badge, Surface, Text, Menu, Avatar, Portal, Modal, Button, Title, useTheme } from 'react-native-paper';
import { collection, query, getDocs, doc, getDoc, where, onSnapshot, orderBy, addDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useNavigation, CompositeNavigationProp, NavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../config/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { calculateDistance } from '../../utils/distance';
import { DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';

type RootStackParamList = {
  InitialSelection: undefined;
  FarmerLogin: undefined;
  FarmerSignup: undefined;
  VendorLogin: undefined;
  VendorSignup: undefined;
  FarmerMain: undefined;
  ProductDetails: { productId: string };
};

type TabParamList = {
  HomeTab: undefined;
  CartTab: undefined;
  OrdersTab: undefined;
};

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'HomeTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface ProductData extends DocumentData {
  productName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  description: string;
  category: string;
  brand: string;
  stockStatus: string;
  minimumOrderQuantity: number;
  images: string[];
  vendorId: string;
  createdAt: string;
  status: string;
  averageRating?: number;
}

interface Product extends ProductData {
  id: string;
  distance?: number;
  vendorName?: string;
}

interface VendorData extends DocumentData {
  businessName: string;
  address?: {
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

const SORT_OPTIONS = [
  { id: 'price_high_low', name: 'Price: High to Low', icon: 'arrow-down' },
  { id: 'price_low_high', name: 'Price: Low to High', icon: 'arrow-up' },
  { id: 'newest', name: 'Newest', icon: 'clock' },
  { id: 'distance', name: 'Distance', icon: 'map-marker' },
  { id: 'rating', name: 'Rating', icon: 'star' },
];

const FILTER_CHIPS = [
  { id: 'popular', label: 'Popular' },
  { id: 'recent', label: 'Recent' },
  { id: 'trending', label: 'Trending' },
  { id: 'near_you', label: 'Near You' },
];

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'view-grid' },
  { id: 'fertilizers', name: 'Fertilizers', icon: 'leaf' },
  { id: 'pesticides', name: 'Pesticides', icon: 'spray' },
  { id: 'machinery', name: 'Machinery', icon: 'tractor' },
  { id: 'seeds', name: 'Seeds', icon: 'seed' },
];

const Home = () => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('rating');
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(['popular']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [vendors, setVendors] = useState<{ [key: string]: VendorData }>({});

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    headerIcons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchBar: {
      flex: 1,
      marginRight: 16,
      elevation: 0,
    },
    cartButton: {
      padding: 8,
      marginRight: 8,
    },
    logoutButton: {
      padding: 8,
    },
    cartBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
    },
    categoriesContainer: {
      backgroundColor: '#fff',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 12,
      borderWidth: 1,
      borderColor: '#ddd',
    },
    selectedCategoryChip: {
      backgroundColor: theme.colors.primary,
    },
    categoryText: {
      marginLeft: 8,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    selectedCategoryText: {
      color: '#fff',
    },
    sortContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: 16,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
    },
    sortButtonText: {
      marginLeft: 4,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    productList: {
      padding: 8,
    },
    productCard: {
      flex: 1,
      margin: 8,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: '#fff',
      minHeight: 380,
    },
    productImage: {
      width: '100%',
      height: 200,
    },
    noImage: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
    },
    productInfo: {
      padding: 16,
      gap: 12,
    },
    productName: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      lineHeight: 24,
    },
    productDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingVertical: 4,
    },
    brand: {
      fontSize: 14,
      color: '#666',
    },
    stockContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stockStatus: {
      fontSize: 12,
      marginLeft: 4,
      color: '#666',
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 12,
      paddingVertical: 4,
    },
    price: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    unit: {
      fontSize: 12,
      color: '#666',
      marginLeft: 4,
    },
    quantityInfo: {
      marginTop: 8,
      marginBottom: 12,
      paddingVertical: 4,
    },
    minOrder: {
      fontSize: 12,
      color: '#666',
      marginBottom: 4,
    },
    available: {
      fontSize: 12,
      color: '#666',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      marginTop: 16,
      fontSize: 16,
      color: '#666',
    },
    modalContainer: {
      backgroundColor: 'white',
      padding: 20,
      margin: 20,
      borderRadius: 8,
    },
    modalTitle: {
      marginBottom: 16,
      textAlign: 'center',
    },
    languageButton: {
      marginVertical: 8,
    },
    modalContent: {
      padding: 16,
    },
    sortOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
    },
    sortOptionText: {
      marginLeft: 12,
      fontSize: 16,
    },
    addToCartButton: {
      marginTop: 12,
      borderRadius: 4,
      paddingVertical: 8,
    },
    distance: {
      fontSize: 12,
      color: '#666',
      marginLeft: 8,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    ratingText: {
      marginLeft: 4,
      color: '#666',
    },
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      rootNavigation.reset({
        index: 0,
        routes: [{ name: 'InitialSelection' }],
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      await fetchCurrentUserLocation();
      await fetchProducts();
      setupCartListener();
    };

    console.log('Selected category changed to:', selectedCategory);
    initializeApp();
  }, [selectedCategory, selectedSort]);

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('user-language');
        if (savedLanguage) {
          i18n.changeLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading saved language:', error);
      }
    };
    loadSavedLanguage();
  }, []);

  const setupCartListener = () => {
    if (!auth.currentUser) return;

    const cartRef = collection(db, 'cart');
    const q = query(cartRef, where('userId', '==', auth.currentUser.uid));
    
    return onSnapshot(q, (snapshot) => {
      let totalItems = 0;
      snapshot.docs.forEach(doc => {
        totalItems += doc.data().quantity || 0;
      });
      setCartCount(totalItems);
    });
  };

  const fetchCurrentUserLocation = async () => {
    try {
      if (!auth.currentUser) return;
      
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.address?.coordinates) {
          setCurrentUserLocation(userData.address.coordinates);
        }
      }
    } catch (error) {
      console.error('Error fetching user location:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const vendorsRef = collection(db, 'vendors');
      const snapshot = await getDocs(vendorsRef);
      const vendorsData: { [key: string]: VendorData } = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data() as VendorData;
        if (data.address?.coordinates) {
          vendorsData[doc.id] = data;
        }
      });
      
      setVendors(vendorsData);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const productsRef = collection(db, 'products');
      let q = query(productsRef, where('status', '==', 'active'));

      // Apply category filter
      if (selectedCategory !== 'all') {
        const selectedCategoryData = CATEGORIES.find(cat => cat.id === selectedCategory);
        if (selectedCategoryData) {
          console.log('Filtering by category:', selectedCategoryData.name);
          q = query(q, where('category', '==', selectedCategoryData.name));
        }
      }

      // Get all products
      const snapshot = await getDocs(q);
      let productsList = await Promise.all(snapshot.docs.map(async (docSnapshot: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnapshot.data() as ProductData;
        let vendorName = 'Unknown Vendor';
        let distance = undefined;
        let averageRating = 0;

        // Fetch reviews for this product
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('productId', '==', docSnapshot.id)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviews = reviewsSnapshot.docs.map(doc => doc.data());
        
        // Calculate average rating
        if (reviews.length > 0) {
          averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
        }

        // Fetch vendor details
        if (data.vendorId) {
          try {
            const vendorDocRef = doc(db, 'vendors', data.vendorId);
            const vendorDocSnapshot = await getDoc(vendorDocRef);
            if (vendorDocSnapshot.exists()) {
              const vendorData = vendorDocSnapshot.data() as VendorData;
              vendorName = vendorData.businessName || 'Unknown Vendor';
              
              if (currentUserLocation && vendorData.address?.coordinates) {
                distance = calculateDistance(
                  currentUserLocation,
                  vendorData.address.coordinates
                );
              }
            }
          } catch (error) {
            console.error('Error fetching vendor:', error);
          }
        }

        return {
          id: docSnapshot.id,
          ...data,
          vendorName,
          distance,
          averageRating
        };
      })) as Product[];

      // Sort products
      productsList.sort((a, b) => {
        switch (selectedSort) {
          case 'price_high_low':
            return (b.pricePerUnit || 0) - (a.pricePerUnit || 0);
          case 'price_low_high':
            return (a.pricePerUnit || 0) - (b.pricePerUnit || 0);
          case 'distance':
            if (!a.distance || !b.distance) return 0;
            return a.distance - b.distance;
          case 'rating':
            return (b.averageRating || 0) - (a.averageRating || 0);
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });

      console.log('Filtered products:', productsList.map(p => ({ id: p.id, category: p.category })));
      setProducts(productsList);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleLanguageChange = async (code: string) => {
    try {
      await i18n.changeLanguage(code);
      await AsyncStorage.setItem('user-language', code);
      setShowLanguageModal(false);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const addToCart = async (product: Product) => {
    try {
      if (!auth.currentUser?.uid) {
        Alert.alert('Error', 'Please login to add items to cart');
        return;
      }

      const cartRef = collection(db, 'users', auth.currentUser.uid, 'cart');
      await addDoc(cartRef, {
        productId: product.id,
        name: product.productName,
        quantity: product.minimumOrderQuantity,
        price: product.pricePerUnit,
        vendorId: product.vendorId,
        addedAt: new Date(),
        minimumOrderQuantity: product.minimumOrderQuantity,
        maxQuantity: product.quantity
      });

      Alert.alert('Success', 'Item added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    console.log('Selecting category:', categoryId);
    setSelectedCategory(categoryId);
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <Surface style={styles.productCard}>
      <TouchableOpacity
        onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
      >
        {item.images && item.images.length > 0 ? (
          <Image
            source={{ uri: item.images[0] }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.productImage, styles.noImage]}>
            <Icon name="image-off" size={40} color="#666" />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.productName}
          </Text>
          <View style={styles.productDetails}>
            <Text style={styles.brand}>{item.vendorName}</Text>
            {item.distance !== undefined && (
              <Text style={styles.distance}>
                {item.distance.toFixed(1)} km away
              </Text>
            )}
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{item.pricePerUnit}</Text>
            <Text style={styles.unit}>per {item.unit}</Text>
          </View>
          <View style={styles.quantityInfo}>
            <View>
              <Text style={styles.minOrder}>
                Min Order: {item.minimumOrderQuantity} {item.unit}
              </Text>
              <Text style={styles.available}>
                Available: {item.quantity} {item.unit}
              </Text>
            </View>
          </View>
          {item.averageRating !== undefined && item.averageRating > 0 && (
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>({item.averageRating.toFixed(1)})</Text>
            </View>
          )}
          <Button 
            mode="contained" 
            onPress={() => addToCart(item)}
            style={styles.addToCartButton}
            disabled={item.stockStatus !== 'In Stock'}
          >
            Add to Cart
          </Button>
        </View>
      </TouchableOpacity>
    </Surface>
  );

  const renderCategories = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoriesContainer}
      contentContainerStyle={{ paddingHorizontal: 8 }}
    >
      {CATEGORIES.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryChip,
            selectedCategory === category.id && styles.selectedCategoryChip,
          ]}
          onPress={() => handleCategorySelect(category.id)}
        >
          <Icon
            name={category.icon}
            size={20}
            color={selectedCategory === category.id ? '#fff' : theme.colors.primary}
          />
          <Text
            style={[
              styles.categoryText,
              selectedCategory === category.id && styles.selectedCategoryText,
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderSortButton = () => (
    <View style={styles.sortContainer}>
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setShowSortModal(true)}
      >
        <Icon name="sort" size={20} color={theme.colors.primary} />
        <Text style={styles.sortButtonText}>{t('categories.filters.sortBy')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSortModal = () => (
    <Portal>
      <Modal
        visible={showSortModal}
        onDismiss={() => setShowSortModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={styles.modalContent}>
          <Title style={styles.modalTitle}>{t('categories.filters.sortBy')}</Title>
          <TouchableOpacity
            style={styles.sortOption}
            onPress={() => {
              setSelectedSort('price_high_low');
              setShowSortModal(false);
            }}
          >
            <Icon name="arrow-down" size={24} color={theme.colors.primary} />
            <Text style={styles.sortOptionText}>
              {t('categories.filters.price_high_low')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortOption}
            onPress={() => {
              setSelectedSort('price_low_high');
              setShowSortModal(false);
            }}
          >
            <Icon name="arrow-up" size={24} color={theme.colors.primary} />
            <Text style={styles.sortOptionText}>
              {t('categories.filters.price_low_high')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortOption}
            onPress={() => {
              setSelectedSort('newest');
              setShowSortModal(false);
            }}
          >
            <Icon name="clock" size={24} color={theme.colors.primary} />
            <Text style={styles.sortOptionText}>
              {t('categories.filters.newest')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortOption}
            onPress={() => {
              setSelectedSort('distance');
              setShowSortModal(false);
            }}
          >
            <Icon name="map-marker" size={24} color={theme.colors.primary} />
            <Text style={styles.sortOptionText}>
              {t('categories.filters.distance')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortOption}
            onPress={() => {
              setSelectedSort('rating');
              setShowSortModal(false);
            }}
          >
            <Icon name="star" size={24} color={theme.colors.primary} />
            <Text style={styles.sortOptionText}>
              Popularity
            </Text>
          </TouchableOpacity>
        </Surface>
      </Modal>
    </Portal>
  );

  return (
    <View style={styles.container}>
      <Portal>
        {/* Language Modal */}
        <Modal
          visible={showLanguageModal}
          onDismiss={() => setShowLanguageModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>{t('common.language')}</Title>
          {Object.entries(LANGUAGES).map(([code, { name }]) => (
            <Button
              key={code}
              mode={i18n.language === code ? 'contained' : 'outlined'}
              onPress={() => handleLanguageChange(code)}
              style={styles.languageButton}
            >
              {name}
            </Button>
          ))}
        </Modal>
      </Portal>

      <View style={styles.header}>
        <Searchbar
          placeholder={t('common.search')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <View style={styles.headerIcons}>
          <IconButton
            icon="translate"
            size={24}
            onPress={() => setShowLanguageModal(true)}
            style={styles.languageButton}
          />
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('CartTab')}
          >
            <Icon name="cart" size={24} color={theme.colors.primary} />
            {cartCount > 0 && (
              <Badge style={styles.cartBadge}>{cartCount}</Badge>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <Icon name="logout" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {renderCategories()}

      {renderSortButton()}

      {renderSortModal()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products.filter(product =>
            product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productList}
          numColumns={2}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="package-variant" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default Home;
