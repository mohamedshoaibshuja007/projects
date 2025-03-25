import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { getFirestore, collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type RootStackParamList = {
  AddProductTab: { draftId: string } | undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddProductTab'>;

interface ProductData {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  description: string;
  images: string[];
  status: 'draft' | 'published';
  vendorId: string;
  lastUpdated: string;
  createdAt?: string;
  completedFields?: number;
}

const VendorProducts = () => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [drafts, setDrafts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    if (!auth.currentUser) return;

    // Query for published products
    const productsQuery = query(
      collection(db, 'products'),
      where('vendorId', '==', auth.currentUser.uid),
      where('status', '==', 'published')
    );

    // Query for drafts without sorting in the query
    const draftsQuery = query(
      collection(db, 'products'),
      where('vendorId', '==', auth.currentUser.uid),
      where('status', '==', 'draft')
    );

    // Subscribe to published products
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProductData[];
      setProducts(productList);
      setLoading(false);
    }, (error) => {
      // Only show error if it's not an index-related error
      if (!error.message.includes('index')) {
        console.error('Error loading products:', error);
        Alert.alert('Error', 'Failed to load products. Please try again.');
      }
      setLoading(false);
    });

    // Subscribe to drafts
    const unsubscribeDrafts = onSnapshot(draftsQuery, (snapshot) => {
      try {
        const draftList = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ProductData[];
          
        // Sort by lastUpdated in memory
        draftList.sort((a, b) => {
          const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
          const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
          return dateB - dateA;
        });
        
        setDrafts(draftList);
        setLoading(false);
      } catch (error) {
        console.log('Error processing drafts:', error);
        setLoading(false);
      }
    }, (error) => {
      // Only show error if it's not an index-related error
      if (!error.message.includes('index')) {
        console.error('Error loading drafts:', error);
        Alert.alert('Error', 'Failed to load drafts. Please try again.');
      }
      setLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeDrafts();
    };
  }, [auth.currentUser]);

  const handleDeleteProduct = async (product: ProductData) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete images from storage
              for (const imageUrl of product.images) {
                const imageRef = ref(storage, imageUrl);
                await deleteObject(imageRef);
              }

              // Delete product document
              await deleteDoc(doc(db, 'products', product.id));
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const handleResumeDraft = (draft: ProductData) => {
    navigation.navigate('AddProductTab', { draftId: draft.id });
  };

  const renderDraft = ({ item }: { item: ProductData }) => (
    <View style={styles.productCard}>
      <View style={styles.draftBadge}>
        <Icon name="pencil-outline" size={16} color="white" />
        <Text style={styles.draftBadgeText}>Draft</Text>
      </View>
      
      {item.images && item.images.length > 0 ? (
        <Image
          source={{ uri: item.images[0] }}
          style={styles.productImage}
        />
      ) : (
        <View style={styles.noImageContainer}>
          <Icon name="image-outline" size={40} color="#666" />
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      )}

      <View style={styles.productInfo}>
        <Text style={styles.productName}>
          {item.productName || 'Untitled Product'}
        </Text>
        <Text style={styles.completionStatus}>
          {item.completedFields} of 6 fields completed
        </Text>
        <Text style={styles.lastUpdated}>
          Last updated: {new Date(item.lastUpdated).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.resumeButton}
          onPress={() => handleResumeDraft(item)}
        >
          <Icon name="pencil" size={20} color="white" />
          <Text style={styles.resumeButtonText}>Resume</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteProduct(item)}
        >
          <Icon name="delete" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProduct = ({ item }: { item: ProductData }) => (
    <View style={styles.productCard}>
      <Image
        source={{ uri: item.images[0] }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.productName}</Text>
        <Text style={styles.price}>${item.pricePerUnit} per {item.unit}</Text>
        <Text style={styles.quantity}>Quantity: {item.quantity} {item.unit}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteProduct(item)}
      >
        <Icon name="delete" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Products</Text>

      {drafts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Drafts</Text>
          <FlatList
            data={drafts}
            renderItem={renderDraft}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Published Products</Text>
        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="package-variant" size={48} color="#666" />
            <Text style={styles.emptyStateText}>No published products yet</Text>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    backgroundColor: '#6C63FF',
    color: 'white',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
    color: '#333',
  },
  list: {
    padding: 16,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  draftBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFA500',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  draftBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  noImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#666',
    marginTop: 8,
  },
  productInfo: {
    marginBottom: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  completionStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
  },
  price: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  resumeButton: {
    backgroundColor: '#6C63FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  resumeButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: 8,
    color: '#666',
    fontSize: 16,
  },
});

export default VendorProducts;
