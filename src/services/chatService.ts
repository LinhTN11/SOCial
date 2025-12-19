import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, orderBy, onSnapshot, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore';
import { Message, ChatRoom } from '../types';

export const createChatRoom = async (currentUserId: string, targetUserId: string) => {
    try {
        // Check if room already exists
        const q = query(
            collection(db, 'chatRooms'),
            where('participants', 'array-contains', currentUserId)
        );
        const querySnapshot = await getDocs(q);
        const existingRoom = querySnapshot.docs.find(doc =>
            doc.data().participants.includes(targetUserId)
        );

        if (existingRoom) {
            return existingRoom.id;
        }

        // Create new room
        const newRoomRef = doc(collection(db, 'chatRooms'));
        await setDoc(newRoomRef, {
            id: newRoomRef.id,
            participants: [currentUserId, targetUserId],
            createdAt: Date.now(),
        });
        return newRoomRef.id;
    } catch (error) {
        console.error('Error creating chat room:', error);
        throw error;
    }
};

export const sendMessage = async (roomId: string, senderId: string, text: string, receiverId?: string, imageUrl?: string) => {
    try {
        const newMessage: any = {
            roomId,
            senderId,
            text,
            createdAt: Date.now(),
            status: 'sent',
        };

        // Only add imageUrl if it exists
        if (imageUrl) {
            newMessage.imageUrl = imageUrl;
        }

        await addDoc(collection(db, 'chatRooms', roomId, 'messages'), newMessage);

        // Update last message in room AND increment unread count for receiver
        const { increment } = await import('firebase/firestore');
        const updateData: any = {
            lastMessage: text,
            lastMessageTimestamp: Date.now(),
        };

        if (receiverId) {
            updateData[`unreadCount.${receiverId}`] = increment(1);
        }

        await updateDoc(doc(db, 'chatRooms', roomId), updateData);

        // Simulate Push Notification by adding to 'notifications' collection
        if (receiverId) {
            await addDoc(collection(db, 'notifications'), {
                userId: receiverId,
                senderId,
                type: 'message',
                body: text,
                roomId,
                createdAt: Date.now(),
                read: false,
            });
        }
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

export const markMessagesAsSeen = async (roomId: string, userId: string) => {
    try {
        // 1. Mark individual messages as seen (Visual for inside chat)
        const q = query(
            collection(db, 'chatRooms', roomId, 'messages'),
            where('senderId', '!=', userId)
        );

        const snapshot = await getDocs(q);

        // Filter out already seen messages client-side
        const unseenDocs = snapshot.docs.filter(doc => doc.data().status !== 'seen');

        const updates = unseenDocs.map(doc =>
            updateDoc(doc.ref, { status: 'seen' })
        );

        await Promise.all(updates);

        // 2. Reset unread count for this user in the Room Document (Visual for Home Screen badge)
        await updateDoc(doc(db, 'chatRooms', roomId), {
            [`unreadCount.${userId}`]: 0
        });

    } catch (error) {
        console.error('Error marking messages as seen:', error);
    }
};

export const subscribeToMessages = (roomId: string, callback: (messages: Message[]) => void) => {
    const q = query(
        collection(db, 'chatRooms', roomId, 'messages'),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        callback(messages);
    });
};

export const subscribeToChatRooms = (userId: string, callback: (rooms: ChatRoom[]) => void) => {
    const q = query(
        collection(db, 'chatRooms'),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTimestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatRoom));
        callback(rooms);
    });
};
