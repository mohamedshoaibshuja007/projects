import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { TextInput, Button, Avatar, useTheme, Text } from 'react-native-paper';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { signOut } from 'firebase/auth';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface VendorProfile {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  description: string;
  photoURL: string | null;
  businessHours: {
    opening: string;
    closing: string;
  };
  address: {
    line1: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    } | null;
  };
}

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const VendorProfile = () => {
  const theme = useTheme();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<VendorProfile>({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    description: '',
    photoURL: null,
    businessHours: {
      opening: '09:00',
      closing: '18:00'
    },
    address: {
      line1: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      coordinates: null
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = React.useRef<MapView | null>(null);

  useEffect(() => {
    fetchProfile();
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required for map features.');
      return;
    }
  };

  const fetchProfile = async () => {
    if (!auth.currentUser) return;

    const vendorDoc = doc(db, 'vendors', auth.currentUser.uid);
    const docSnap = await getDoc(vendorDoc);

    if (docSnap.exists()) {
      const data = docSnap.data();
      setProfile({
        businessName: data.businessName || '',
        ownerName: data.ownerName || '',
        email: data.email || '',
        phone: data.phone || '',
        description: data.description || '',
        photoURL: data.photoURL || null,
        businessHours: {
          opening: data.businessHours?.opening || '09:00',
          closing: data.businessHours?.closing || '18:00'
        },
        address: {
          line1: data.address?.line1 || '',
          landmark: data.address?.landmark || '',
          city: data.address?.city || '',
          state: data.address?.state || '',
          pincode: data.address?.pincode || '',
          coordinates: data.address?.coordinates || null
        }
      });
      if (data.address?.coordinates) {
        setLocation({
          latitude: data.address.coordinates.latitude,
          longitude: data.address.coordinates.longitude,
        });
      }
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      
      const storageRef = ref(storage, `vendor-photos/${auth.currentUser?.uid}`);
      await uploadBytes(storageRef, blob);
      const photoURL = await getDownloadURL(storageRef);
      
      setProfile({ ...profile, photoURL });
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setProfile({
        ...profile,
        address: {
          ...profile.address,
          coordinates: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        },
      });
      setShowMap(true);
    } catch (error) {
      Alert.alert('Error', 'Could not get current location');
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;

    try {
      const vendorDoc = doc(db, 'vendors', auth.currentUser.uid);
      await updateDoc(vendorDoc, {
        ...profile,
        updatedAt: new Date().toISOString(),
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      rootNavigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'InitialSelection' }],
        })
      );
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert(t('vendor.profile.logoutError'), 'Failed to logout');
    }
  };

  const handleMapReady = () => {
    setIsMapReady(true);
  };

  const handleRegionChange = (region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => {
    if (isEditing) {
      setLocation({
        latitude: region.latitude,
        longitude: region.longitude,
      });
      setProfile({
        ...profile,
        address: {
          ...profile.address,
          coordinates: {
            latitude: region.latitude,
            longitude: region.longitude,
          },
        },
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.photoContainer}>
          {profile.photoURL ? (
            <Avatar.Image
              size={100}
              source={{ uri: profile.photoURL }}
            />
          ) : (
            <Avatar.Icon
              size={100}
              icon="store"
            />
          )}
          {isEditing && (
            <MaterialCommunityIcons.Button
              name="camera"
              size={24}
              onPress={handlePickImage}
              style={styles.editPhotoButton}
            />
          )}
        </View>
        <Button
          mode="contained"
          onPress={() => setIsEditing(!isEditing)}
          style={styles.editButton}
        >
          {isEditing ? 'Cancel Editing' : 'Edit Profile'}
        </Button>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Business Name"
          value={profile.businessName}
          onChangeText={(text) => setProfile({ ...profile, businessName: text })}
          disabled={!isEditing}
          style={styles.input}
        />
        <TextInput
          label="Owner Name"
          value={profile.ownerName}
          onChangeText={(text) => setProfile({ ...profile, ownerName: text })}
          disabled={!isEditing}
          style={styles.input}
        />
        <TextInput
          label="Email"
          value={profile.email}
          onChangeText={(text) => setProfile({ ...profile, email: text })}
          disabled={!isEditing}
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          label="Phone"
          value={profile.phone}
          onChangeText={(text) => setProfile({ ...profile, phone: text })}
          disabled={!isEditing}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          label="Business Description"
          value={profile.description}
          onChangeText={(text) => setProfile({ ...profile, description: text })}
          disabled={!isEditing}
          multiline
          style={styles.input}
        />

        <View style={styles.businessHours}>
          <Text style={styles.sectionTitle}>Business Hours</Text>
          <View style={styles.hoursContainer}>
            <TextInput
              label="Opening Time"
              value={profile.businessHours.opening}
              onChangeText={(text) => setProfile({
                ...profile,
                businessHours: { ...profile.businessHours, opening: text }
              })}
              disabled={!isEditing}
              style={[styles.input, styles.timeInput]}
            />
            <TextInput
              label="Closing Time"
              value={profile.businessHours.closing}
              onChangeText={(text) => setProfile({
                ...profile,
                businessHours: { ...profile.businessHours, closing: text }
              })}
              disabled={!isEditing}
              style={[styles.input, styles.timeInput]}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Address</Text>
        <TextInput
          label="Address Line 1"
          value={profile.address.line1}
          onChangeText={(text) => setProfile({
            ...profile,
            address: { ...profile.address, line1: text }
          })}
          disabled={!isEditing}
          style={styles.input}
        />
        <TextInput
          label="Landmark"
          value={profile.address.landmark}
          onChangeText={(text) => setProfile({
            ...profile,
            address: { ...profile.address, landmark: text }
          })}
          disabled={!isEditing}
          style={styles.input}
        />
        <TextInput
          label="City"
          value={profile.address.city}
          onChangeText={(text) => setProfile({
            ...profile,
            address: { ...profile.address, city: text }
          })}
          disabled={!isEditing}
          style={styles.input}
        />
        <TextInput
          label="State"
          value={profile.address.state}
          onChangeText={(text) => setProfile({
            ...profile,
            address: { ...profile.address, state: text }
          })}
          disabled={!isEditing}
          style={styles.input}
        />
        <TextInput
          label="PIN Code"
          value={profile.address.pincode}
          onChangeText={(text) => setProfile({
            ...profile,
            address: { ...profile.address, pincode: text }
          })}
          disabled={!isEditing}
          keyboardType="number-pad"
          style={styles.input}
        />

        {isEditing && (
          <Button
            mode="contained"
            onPress={getCurrentLocation}
            style={styles.locationButton}
          >
            Get Current Location
          </Button>
        )}

        {location && (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              region={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              onMapReady={handleMapReady}
              scrollEnabled={true}
              zoomEnabled={true}
              onRegionChangeComplete={handleRegionChange}
            >
              {!isEditing && (
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title={profile.businessName}
                  description={profile.address.line1}
                />
              )}
            </MapView>
            {isEditing && (
              <>
                <View style={styles.centerMarker}>
                  <MaterialCommunityIcons name="map-marker" size={40} color={theme.colors.primary} />
                </View>
                <Text style={styles.mapHint}>
                  {t('vendor.profile.moveMapHint')}
                </Text>
              </>
            )}
          </View>
        )}

        {isEditing && (
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
          >
            Save Changes
          </Button>
        )}

        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          Logout
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  photoContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    backgroundColor: '#fff',
  },
  editButton: {
    marginTop: 10,
  },
  form: {
    padding: 20,
  },
  input: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  businessHours: {
    marginVertical: 10,
  },
  hoursContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInput: {
    flex: 0.48,
  },
  mapContainer: {
    height: 200,
    marginVertical: 15,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  locationButton: {
    marginVertical: 10,
  },
  saveButton: {
    marginTop: 20,
  },
  logoutButton: {
    marginTop: 10,
  },
  centerMarker: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -20,
    marginTop: -40,
    zIndex: 1,
  },
  mapHint: {
    textAlign: 'center',
    marginTop: 5,
    fontSize: 12,
    color: '#666',
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 5,
  },
});

export default VendorProfile;
