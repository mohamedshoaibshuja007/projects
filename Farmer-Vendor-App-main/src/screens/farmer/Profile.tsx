import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ScrollView, Platform, Alert } from 'react-native';
import { TextInput, Button, Avatar, useTheme, Portal, Dialog, Text, IconButton } from 'react-native-paper';
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

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  bio: string;
  photoURL: string | null;
  address: {
    line1: string;
    landmark: string;
    pincode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    } | null;
  };
}

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Profile = () => {
  const theme = useTheme();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    photoURL: null,
    address: {
      line1: '',
      landmark: '',
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

    const userDoc = doc(db, 'users', auth.currentUser.uid);
    const docSnap = await getDoc(userDoc);

    if (docSnap.exists()) {
      const data = docSnap.data();
      setProfile({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        bio: data.bio || '',
        photoURL: data.photoURL || null,
        address: {
          line1: data.address?.line1 || '',
          landmark: data.address?.landmark || '',
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
      
      const storageRef = ref(storage, `profile-photos/${auth.currentUser?.uid}`);
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
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDoc, {
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
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { name: 'InitialSelection' },
          ],
        })
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
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
              icon="account"
            />
          )}
          {isEditing && (
            <IconButton
              icon="camera"
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
          label="Full Name"
          value={profile.name}
          onChangeText={name => setProfile({ ...profile, name })}
          disabled={!isEditing}
          style={styles.input}
        />
        <TextInput
          label="Email"
          value={profile.email}
          onChangeText={email => setProfile({ ...profile, email })}
          disabled={!isEditing}
          style={styles.input}
        />
        <TextInput
          label="Phone"
          value={profile.phone}
          onChangeText={phone => setProfile({ ...profile, phone })}
          disabled={!isEditing}
          style={styles.input}
        />
        <TextInput
          label="Bio"
          value={profile.bio}
          onChangeText={bio => setProfile({ ...profile, bio })}
          disabled={!isEditing}
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        <Text variant="titleMedium" style={styles.sectionTitle}>Shipping Address</Text>
        <TextInput
          label="Address Line 1"
          value={profile.address.line1}
          onChangeText={line1 => setProfile({
            ...profile,
            address: { ...profile.address, line1 }
          })}
          disabled={!isEditing}
          style={styles.input}
        />
        <TextInput
          label="Landmark"
          value={profile.address.landmark}
          onChangeText={landmark => setProfile({
            ...profile,
            address: { ...profile.address, landmark }
          })}
          disabled={!isEditing}
          style={styles.input}
        />
        <TextInput
          label="Pincode"
          value={profile.address.pincode}
          onChangeText={pincode => setProfile({
            ...profile,
            address: { ...profile.address, pincode }
          })}
          disabled={!isEditing}
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
              style={styles.map}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
            >
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
              />
            </MapView>
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
          textColor={theme.colors.error}
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
  },
  editPhotoButton: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    backgroundColor: '#fff',
  },
  editButton: {
    marginTop: 10,
  },
  form: {
    padding: 20,
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 16,
  },
  locationButton: {
    marginBottom: 16,
  },
  mapContainer: {
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 16,
  },
  logoutButton: {
    marginBottom: 32,
  },
});

export default Profile;
