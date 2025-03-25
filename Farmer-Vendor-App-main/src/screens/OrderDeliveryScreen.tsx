import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface OrderDeliveryScreenProps {
  route: {
    params: {
      orderId: string;
      productImages: string[];
    };
  };
  navigation: any;
}

export const OrderDeliveryScreen: React.FC<OrderDeliveryScreenProps> = ({
  route,
  navigation,
}) => {
  const { t } = useTranslation();
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { orderId, productImages } = route.params;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        t('Permission Required'),
        t('Please grant camera roll permissions to upload images')
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const uploadImages = async () => {
    setIsUploading(true);
    try {
      const storage = getStorage();
      const db = getFirestore();
      
      const uploadedUrls = await Promise.all(
        images.map(async (uri) => {
          const response = await fetch(uri);
          const blob = await response.blob();
          const storageRef = ref(storage, `quality-reviews/${orderId}/${Date.now()}`);
          await uploadBytes(storageRef, blob);
          return await getDownloadURL(storageRef);
        })
      );

      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        qualityReviewImages: uploadedUrls,
        hasQualityIssue: true,
        reviewedAt: serverTimestamp(),
      });

      Alert.alert(
        t('Success'),
        t('Your quality review has been submitted successfully'),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(t('Error'), t('Failed to upload images. Please try again.'));
    } finally {
      setIsUploading(false);
    }
  };

  const acceptWithoutReview = async () => {
    try {
      const db = getFirestore();
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'delivered',
        deliveredAt: serverTimestamp(),
      });
      
      Alert.alert(
        t('Success'),
        t('Order marked as delivered successfully'),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(t('Error'), t('Failed to update order status. Please try again.'));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('Original Product Images')}</Text>
        <ScrollView horizontal>
          {productImages.map((url, index) => (
            <Image
              key={`vendor-${index}`}
              source={{ uri: url }}
              style={styles.productImage}
            />
          ))}
        </ScrollView>
      </View>

      {images.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('Your Quality Review Images')}</Text>
          <ScrollView horizontal>
            {images.map((uri, index) => (
              <Image
                key={`review-${index}`}
                source={{ uri }}
                style={styles.productImage}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.uploadButton]}
          onPress={pickImage}
          disabled={isUploading}
        >
          <Text style={styles.buttonText}>
            {t('Add Image')} ({images.length}/4)
          </Text>
        </TouchableOpacity>

        {images.length > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={uploadImages}
            disabled={isUploading}
          >
            <Text style={styles.buttonText}>
              {isUploading ? t('Uploading...') : t('Submit Quality Review')}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={acceptWithoutReview}
          disabled={isUploading}
        >
          <Text style={styles.buttonText}>{t('Accept Without Review')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
  },
  submitButton: {
    backgroundColor: '#2196F3',
  },
  acceptButton: {
    backgroundColor: '#757575',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderDeliveryScreen;
