const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAy3sWZJxXwYF4pKNxD_crTXoTqe6xudac",
  authDomain: "mine-805ba.firebaseapp.com",
  projectId: "mine-805ba",
  storageBucket: "mine-805ba.firebasestorage.app",
  messagingSenderId: "755696512125",
  appId: "1:755696512125:android:7d37a23f28c86b27ae1514"
};

async function migrateMessages() {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    const messagesRef = collection(db, 'messages');
    const snapshot = await getDocs(messagesRef);
    
    let migratedCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Check if participants is a string (old format)
      if (typeof data.participants === 'string') {
        const participantsArray = data.participants.split('_');
        
        // Update the document with the new array format
        await updateDoc(doc.ref, {
          participants: participantsArray
        });
        
        migratedCount++;
        console.log(`Migrated message ${doc.id}`);
      }
    }
    
    console.log(`Migration complete. Migrated ${migratedCount} messages.`);
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

migrateMessages();
