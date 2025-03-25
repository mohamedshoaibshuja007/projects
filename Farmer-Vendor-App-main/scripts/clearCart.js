const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC6FxqtPQQSGQbXVFEeAVUDHuRNQVRqBYw",
  authDomain: "farmer-vendor-app.firebaseapp.com",
  projectId: "farmer-vendor-app",
  storageBucket: "farmer-vendor-app.appspot.com",
  messagingSenderId: "1070272457897",
  appId: "1:1070272457897:web:f1d9c6e1d3c02e02f1c6e3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function clearCart() {
  try {
    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      // Get all cart items for this user
      const cartRef = collection(db, 'users', userId, 'cart');
      const cartSnapshot = await getDocs(cartRef);
      
      console.log(`Found ${cartSnapshot.size} cart items for user ${userId}`);
      
      // Delete each cart item
      for (const cartDoc of cartSnapshot.docs) {
        await deleteDoc(doc(db, 'users', userId, 'cart', cartDoc.id));
      }
      console.log(`Deleted all cart items for user ${userId}`);
    }
    
    console.log('Successfully cleared all carts!');
  } catch (error) {
    console.error('Error clearing carts:', error);
  }
}

// Run the cleanup
clearCart();
