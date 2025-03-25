import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Surface, Text, Title, Button, TextInput, IconButton, Snackbar, useTheme } from 'react-native-paper';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { db, auth, storage } from '../../config/firebase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AddProduct = ({ navigation }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Form state
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [unit, setUnit] = useState('');
  const [quantity, setQuantity] = useState('');
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageUris, setImageUris] = useState<string[]>([]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImages([...selectedImages, result.assets[0].uri]);
      setImageUris([...imageUris, result.assets[0].uri]);
    }
  };

  const uploadImages = async () => {
    if (selectedImages.length === 0) return [];

    const uploadPromises = selectedImages.map(async (uri) => {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `products/${auth.currentUser?.uid}/${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const imageRef = ref(storage, filename);
      await uploadBytes(imageRef, blob);
      return getDownloadURL(imageRef);
    });

    return Promise.all(uploadPromises);
  };

  const handleAddProduct = async (asDraft = false) => {
    if (!auth.currentUser) return;

    if (!asDraft) {
      // Validate required fields for active products
      if (!productName.trim() || !brand.trim() || !category.trim() || !description.trim() || 
          !pricePerUnit || !unit.trim() || !quantity || !minimumOrderQuantity) {
        setSnackbarMessage('Please fill in all required fields');
        setSnackbarVisible(true);
        return;
      }
    }

    setLoading(true);
    try {
      const imageUrls = await uploadImages();
      
      const newProduct = {
        productName: productName.trim(),
        brand: brand.trim(),
        category: category.trim(),
        description: description.trim(),
        pricePerUnit: parseFloat(pricePerUnit) || 0,
        unit: unit.trim(),
        quantity: parseInt(quantity) || 0,
        minimumOrderQuantity: parseInt(minimumOrderQuantity) || 1,
        images: imageUrls,
        status: asDraft ? 'draft' : 'active',
        stockStatus: parseInt(quantity) > 0 ? 'In Stock' : 'Out of Stock',
        vendorId: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'products'), newProduct);
      
      setSnackbarMessage(asDraft ? 'Product saved as draft' : 'Product added successfully');
      setSnackbarVisible(true);
      
      // Navigate back to MyProducts after a short delay
      setTimeout(() => {
        navigation.navigate('MyProducts');
      }, 1500);
    } catch (error) {
      console.error('Error adding product:', error);
      setSnackbarMessage('Failed to add product. Please try again.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle}>Add Product</Text>
          <View style={styles.headerSpacer} />
        </View>
      </Surface>

      <ScrollView style={styles.content}>
        <TextInput
          label="Product Name"
          value={productName}
          onChangeText={setProductName}
          style={styles.input}
        />
        
        <TextInput
          label="Brand"
          value={brand}
          onChangeText={setBrand}
          style={styles.input}
        />
        
        <TextInput
          label="Category"
          value={category}
          onChangeText={setCategory}
          style={styles.input}
        />
        
        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          multiline
          numberOfLines={3}
        />
        
        <TextInput
          label="Price per Unit"
          value={pricePerUnit}
          onChangeText={setPricePerUnit}
          keyboardType="numeric"
          style={styles.input}
        />
        
        <TextInput
          label="Unit (e.g., kg, piece)"
          value={unit}
          onChangeText={setUnit}
          style={styles.input}
        />
        
        <TextInput
          label="Available Quantity"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          style={styles.input}
        />
        
        <TextInput
          label="Minimum Order Quantity"
          value={minimumOrderQuantity}
          onChangeText={setMinimumOrderQuantity}
          keyboardType="numeric"
          style={styles.input}
        />

        <View style={styles.imagesContainer}>
          <Text style={styles.imagesTitle}>Product Images</Text>
          <ScrollView horizontal style={styles.imagesList}>
            {imageUris.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.uploadedImage} />
                <IconButton
                  icon="close"
                  size={20}
                  style={styles.removeImage}
                  onPress={() => {
                    setSelectedImages(selectedImages.filter((_, i) => i !== index));
                    setImageUris(imageUris.filter((_, i) => i !== index));
                  }}
                />
              </View>
            ))}
            <TouchableOpacity onPress={pickImage} style={styles.addImage}>
              <Icon name="plus" size={40} color="#ccc" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => handleAddProduct(true)}
            style={styles.button}
            disabled={loading}
          >
            <Text>Save as Draft</Text>
          </Button>
          <Button
            mode="contained"
            onPress={() => handleAddProduct(false)}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            <Text>Add Product</Text>
          </Button>
        </View>
      </ScrollView>

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
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  imagesContainer: {
    marginBottom: 16,
  },
  imagesTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  imagesList: {
    flexDirection: 'row',
  },
  imageContainer: {
    marginRight: 8,
    position: 'relative',
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImage: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default AddProduct;
