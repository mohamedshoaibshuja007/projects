import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Avatar, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  FarmerChat: {
    vendorId: string;
    vendorName: string;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FarmerChat'>;

interface ChatPreview {
  vendorId: string;
  vendorName: string;
  lastMessage: string;
  timestamp: any;
  unreadCount: number;
}

const ChatList = () => {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const farmerId = auth.currentUser?.uid;
    if (!farmerId) return;

    setLoading(true);

    // Get all messages where the farmer is involved
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('senderId', '==', farmerId),
      orderBy('timestamp', 'desc')
    );

    const q2 = query(
      messagesRef,
      where('receiverId', '==', farmerId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const chatMap = new Map<string, ChatPreview>();
        const vendorIds = new Set<string>();

        // Process messages where farmer is sender
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          vendorIds.add(data.receiverId);
        });

        // Get messages where farmer is receiver
        const receiverSnapshot = await getDocs(q2);
        receiverSnapshot.docs.forEach(doc => {
          const data = doc.data();
          vendorIds.add(data.senderId);
        });

        // Fetch all vendor details at once
        const vendorsRef = collection(db, 'vendors');
        const vendorDetails = new Map<string, string>();
        
        if (vendorIds.size > 0) {
          const vendorSnapshot = await getDocs(vendorsRef);
          vendorSnapshot.docs.forEach(doc => {
            const vendorData = doc.data();
            if (vendorIds.has(doc.id)) {
              vendorDetails.set(doc.id, vendorData.ownerName || 'Unknown Vendor');
            }
          });
        }

        // Process messages to create chat previews
        const processMessage = (doc: any, isSender: boolean) => {
          const data = doc.data();
          const vendorId = isSender ? data.receiverId : data.senderId;
          
          if (!chatMap.has(vendorId) || data.timestamp > chatMap.get(vendorId)!.timestamp) {
            chatMap.set(vendorId, {
              vendorId,
              vendorName: vendorDetails.get(vendorId) || 'Unknown Vendor',
              lastMessage: data.text,
              timestamp: data.timestamp,
              unreadCount: !isSender && !data.read ? 1 : 0,
            });
          }
        };

        // Process both sender and receiver messages
        snapshot.docs.forEach(doc => processMessage(doc, true));
        receiverSnapshot.docs.forEach(doc => processMessage(doc, false));

        setChats(Array.from(chatMap.values()).sort((a, b) => b.timestamp - a.timestamp));
      } catch (error) {
        console.error('Error processing chats:', error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Error in chat subscription:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderChatItem = ({ item }: { item: ChatPreview }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigation.navigate('FarmerChat', {
        vendorId: item.vendorId,
        vendorName: item.vendorName,
      })}
    >
      <Avatar.Text
        size={50}
        label={item.vendorName.substring(0, 2).toUpperCase()}
        style={styles.avatar}
      />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.vendorName}>{item.vendorName}</Text>
          <Text style={styles.timestamp}>
            {item.timestamp?.toDate().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.lastMessageContainer}>
          <Text numberOfLines={1} style={styles.lastMessage}>
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.vendorId}
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    color: '#666',
    fontSize: 14,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default ChatList;
