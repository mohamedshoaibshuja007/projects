import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Surface, Text, Title, Button, IconButton, Menu, Portal, Modal, Snackbar, ActivityIndicator, useTheme } from 'react-native-paper';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Product {
  id: string;
  productName: string;
  brand: string;
  category: string;
  description: string;
  pricePerUnit: number;
  unit: string;
  quantity: number;
  minimumOrderQuantity: number;
  images: string[];
  status: 'active' | 'draft';
  stockStatus: 'In Stock' | 'Out of Stock';
  vendorId: string;
  createdAt: string;
}

const MyProducts = ({ navigation }) => {
  const theme = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'draft'>('all');

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchProducts = () => {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('vendorId', '==', auth.currentUser?.uid));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const productsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        
        setProducts(productsList);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching products:', error);
        setLoading(false);
        setSnackbarMessage('Error loading products');
        setSnackbarVisible(true);
      });

      return unsubscribe;
    };

    const unsubscribe = fetchProducts();
    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      setSnackbarMessage('Product deleted successfully');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error deleting product:', error);
      setSnackbarMessage('Failed to delete product');
      setSnackbarVisible(true);
    }
    setDeleteConfirmVisible(null);
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const newStatus = product.status === 'active' ? 'draft' : 'active';
      await updateDoc(doc(db, 'products', product.id), {
        status: newStatus
      });
      setSnackbarMessage(`Product ${newStatus === 'active' ? 'published' : 'unpublished'}`);
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error updating product status:', error);
      setSnackbarMessage('Failed to update product status');
      setSnackbarVisible(true);
    }
    setMenuVisible(null);
  };

  const filteredProducts = products.filter(product => {
    if (filter === 'all') return true;
    return product.status === filter;
  });

  const renderProduct = (product: Product) => (
    <Surface key={product.id} style={styles.productCard} elevation={2}>
      {product.images && product.images.length > 0 ? (
        <Image 
          source={{ uri: product.images[0] }} 
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Icon name="image-off" size={40} color="#ccc" />
        </View>
      )}
      
      <View style={styles.productInfo}>
        <Title style={styles.productName}>{product.productName}</Title>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.price}>₹{product.pricePerUnit} per {product.unit}</Text>
        <Text style={[
          styles.status,
          { color: product.status === 'active' ? 'green' : 'orange' }
        ]}>
          {product.status === 'active' ? 'Published' : 'Saved as Draft'}
        </Text>
        <Text style={[
          styles.stockStatus,
          { color: product.stockStatus === 'In Stock' ? 'green' : 'red' }
        ]}>
          {product.stockStatus}
        </Text>
      </View>

      <Menu
        visible={menuVisible === product.id}
        onDismiss={() => setMenuVisible(null)}
        anchor={
          <IconButton
            icon="dots-vertical"
            size={24}
            onPress={() => setMenuVisible(product.id)}
          />
        }
      >
        <Menu.Item 
          onPress={() => {
            setMenuVisible(null);
            navigation.navigate('EditProduct', { product });
          }} 
          title={<Text numberOfLines={1}>Edit</Text>}
          leadingIcon="pencil"
        />
        <Menu.Item 
          onPress={() => handleToggleStatus(product)} 
          title={<Text numberOfLines={1}>{product.status === 'active' ? 'Unpublish' : 'Publish'}</Text>}
          leadingIcon={product.status === 'active' ? 'eye-off' : 'eye'}
        />
        <Menu.Item 
          onPress={() => {
            setMenuVisible(null);
            setDeleteConfirmVisible(product.id);
          }} 
          title={<Text numberOfLines={1}>Delete</Text>}
          leadingIcon="delete"
        />
      </Menu>
    </Surface>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <Text style={styles.headerTitle}>My Products</Text>
        <View style={styles.filterButtons}>
          <Button
            mode={filter === 'all' ? 'contained' : 'outlined'}
            onPress={() => setFilter('all')}
            style={styles.filterButton}
          >
            <Text numberOfLines={1}>All</Text>
          </Button>
          <Button
            mode={filter === 'active' ? 'contained' : 'outlined'}
            onPress={() => setFilter('active')}
            style={styles.filterButton}
          >
            <Text numberOfLines={1}>Published</Text>
          </Button>
          <Button
            mode={filter === 'draft' ? 'contained' : 'outlined'}
            onPress={() => setFilter('draft')}
            style={styles.filterButton}
          >
            <Text numberOfLines={1}>Drafts</Text>
          </Button>
        </View>
      </Surface>

      <ScrollView style={styles.content}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="package-variant" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' 
                ? 'Add your first product to start selling'
                : filter === 'active'
                ? 'No published products yet'
                : 'No draft products yet'}
            </Text>
          </View>
        ) : (
          filteredProducts.map(product => renderProduct(product))
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={!!deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(null)}
          contentContainerStyle={styles.modal}
        >
          <Title style={styles.modalTitle}>Delete Product?</Title>
          <Text style={styles.modalText}>
            Are you sure you want to delete this product? This action cannot be undone.
          </Text>
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setDeleteConfirmVisible(null)}
              style={styles.modalButton}
            >
              <Text numberOfLines={1}>Cancel</Text>
            </Button>
            <Button
              mode="contained"
              onPress={() => deleteConfirmVisible && handleDeleteProduct(deleteConfirmVisible)}
              style={[styles.modalButton, styles.deleteButton]}
            >
              <Text numberOfLines={1}>Delete</Text>
            </Button>
          </View>
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>

      <Button
        mode="contained"
        onPress={() => navigation.navigate('AddProduct')}
        style={styles.addButton}
        icon="plus"
      >
        <Text numberOfLines={1}>Add Product</Text>
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  productCard: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  productName: {
    fontSize: 16,
    marginBottom: 4,
  },
  brand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    marginBottom: 4,
  },
  stockStatus: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 32,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  addButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    borderRadius: 28,
  },
});

export default MyProducts;
