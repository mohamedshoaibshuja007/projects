import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Surface, Text, Title, Button, TextInput, IconButton, Snackbar, useTheme } from 'react-native-paper';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { db, auth, storage } from '../../config/firebase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const EditProduct = ({ route, navigation }) => {
  const { product } = route.params;
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Form state
  const [productName, setProductName] = useState(product.productName);
  const [brand, setBrand] = useState(product.brand);
  const [category, setCategory] = useState(product.category);
  const [description, setDescription] = useState(product.description);
  const [pricePerUnit, setPricePerUnit] = useState(product.pricePerUnit.toString());
  const [unit, setUnit] = useState(product.unit);
  const [quantity, setQuantity] = useState(product.quantity.toString());
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState(product.minimumOrderQuantity.toString());
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(product.images || []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImages([...selectedImages, result.assets[0].uri]);
    }
  };

  const uploadNewImages = async () => {
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

  const handleUpdateProduct = async (asDraft = false) => {
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
      const newImageUrls = await uploadNewImages();
      const allImages = [...existingImages, ...newImageUrls];
      
      const updatedProduct = {
        productName: productName.trim(),
        brand: brand.trim(),
        category: category.trim(),
        description: description.trim(),
        pricePerUnit: parseFloat(pricePerUnit) || 0,
        unit: unit.trim(),
        quantity: parseInt(quantity) || 0,
        minimumOrderQuantity: parseInt(minimumOrderQuantity) || 1,
        images: allImages,
        status: asDraft ? 'draft' : product.status,
        stockStatus: parseInt(quantity) > 0 ? 'In Stock' : 'Out of Stock',
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'products', product.id), updatedProduct);
      
      setSnackbarMessage('Product updated successfully');
      setSnackbarVisible(true);
      
      // Navigate back to MyProducts after a short delay
      setTimeout(() => {
        navigation.navigate('MyProducts');
      }, 1500);
    } catch (error) {
      console.error('Error updating product:', error);
      setSnackbarMessage('Failed to update product. Please try again.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...existingImages];
    newImages.splice(index, 1);
    setExistingImages(newImages);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Surface style={styles.form} elevation={2}>
          <Title style={styles.title}>Edit Product</Title>

          <TextInput
            label="Product Name"
            value={productName}
            onChangeText={setProductName}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Brand"
            value={brand}
            onChangeText={setBrand}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Category"
            value={category}
            onChangeText={setCategory}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
          />

          <TextInput
            label="Price per Unit"
            value={pricePerUnit}
            onChangeText={setPricePerUnit}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
          />

          <TextInput
            label="Unit (e.g., kg, piece)"
            value={unit}
            onChangeText={setUnit}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Quantity Available"
            value={quantity}
            onChangeText={setQuantity}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
          />

          <TextInput
            label="Minimum Order Quantity"
            value={minimumOrderQuantity}
            onChangeText={setMinimumOrderQuantity}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
          />

          <Title style={styles.imagesTitle}>Product Images</Title>
          <ScrollView horizontal style={styles.imageScroll}>
            {existingImages.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.image} />
                <IconButton
                  icon="close"
                  size={20}
                  style={styles.removeImage}
                  onPress={() => removeImage(index)}
                />
              </View>
            ))}
            {selectedImages.map((uri, index) => (
              <View key={`new-${index}`} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.image} />
                <IconButton
                  icon="close"
                  size={20}
                  style={styles.removeImage}
                  onPress={() => {
                    const newImages = [...selectedImages];
                    newImages.splice(index, 1);
                    setSelectedImages(newImages);
                  }}
                />
              </View>
            ))}
            <TouchableOpacity onPress={pickImage} style={styles.addImageButton}>
              <Icon name="plus" size={40} color="#ccc" />
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => handleUpdateProduct(false)}
              style={styles.button}
              loading={loading}
              disabled={loading}
            >
              Update Product
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleUpdateProduct(true)}
              style={styles.button}
              loading={loading}
              disabled={loading}
            >
              Save as Draft
            </Button>
          </View>
        </Surface>
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
  content: {
    flex: 1,
    padding: 16,
  },
  form: {
    padding: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  imagesTitle: {
    fontSize: 18,
    marginTop: 8,
    marginBottom: 16,
  },
  imageScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  imageContainer: {
    marginRight: 8,
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImage: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 0,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    marginTop: 16,
  },
  button: {
    marginBottom: 8,
  },
});

export default EditProduct;
