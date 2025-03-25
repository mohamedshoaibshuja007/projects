import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  IconButton,
  useTheme,
  Avatar,
  Surface,
} from 'react-native-paper';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';

interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: any;
  senderType: 'farmer' | 'vendor';
  chatRoomId: string;
}

interface ChatProps {
  route: {
    params: {
      farmerId: string;
      farmerName: string;
    };
  };
}

const Chat = ({ route }: ChatProps) => {
  const { farmerId, farmerName } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const vendorId = auth.currentUser?.uid;
    if (!vendorId || !farmerId) return;

    // Create a unique chat room ID by combining farmer and vendor IDs
    const chatRoomId = [farmerId, vendorId].sort().join('_');

    // Query messages for this specific chat room only
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatRoomId', '==', chatRoomId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        newMessages.push({
          id: doc.id,
          text: data.text,
          senderId: data.senderId,
          receiverId: data.receiverId,
          timestamp: data.timestamp,
          senderType: data.senderType,
          chatRoomId: data.chatRoomId,
        });
      });
      setMessages(newMessages);
      setLoading(false);
      
      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
  }, [farmerId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const vendorId = auth.currentUser?.uid;
    if (!vendorId) return;

    try {
      const messagesRef = collection(db, 'messages');
      const chatRoomId = [farmerId, vendorId].sort().join('_');
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: vendorId,
        receiverId: farmerId,
        timestamp: serverTimestamp(),
        senderType: 'vendor',
        chatRoomId: chatRoomId,
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isSender = item.senderId === auth.currentUser?.uid;

    return (
      <View
        style={[
          styles.messageContainer,
          isSender ? styles.sentMessage : styles.receivedMessage,
        ]}
      >
        <Surface style={[
          styles.messageBubble,
          isSender ? styles.sentBubble : styles.receivedBubble,
          { backgroundColor: isSender ? theme.colors.primary : '#E8E8E8' }
        ]}>
          <Text style={[
            styles.messageText,
            { color: isSender ? 'white' : 'black' }
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.timestamp,
            { color: isSender ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }
          ]}>
            {item.timestamp?.toDate().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </Surface>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Avatar.Text
          size={40}
          label={farmerName.substring(0, 2).toUpperCase()}
          style={styles.avatar}
        />
        <Text style={styles.headerTitle}>{farmerName}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          style={styles.input}
          multiline
          maxLength={500}
          right={
            <TextInput.Icon
              icon="send"
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            />
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 12,
  },
  avatar: {
    marginRight: 8,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    elevation: 1,
  },
  sentBubble: {
    borderTopRightRadius: 4,
  },
  receivedBubble: {
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    maxHeight: 100,
  },
});

export default Chat;
