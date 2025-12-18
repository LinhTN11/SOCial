import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { subscribeToChatRooms } from '../services/chatService';
import { ChatRoom } from '../types';
import { getUserProfile } from '../services/userService';

// Separate component for chat room item
const ChatRoomItem = ({ room, currentUserId, onPress }: {
    room: ChatRoom;
    currentUserId: string;
    onPress: (title: string) => void
}) => {
    const [otherUser, setOtherUser] = useState<any>(null);
    const otherUserId = room.participants.find(id => id !== currentUserId);

    useEffect(() => {
        if (otherUserId) {
            getUserProfile(otherUserId).then(setOtherUser).catch(console.error);
        }
    }, [otherUserId]);

    return (
        <TouchableOpacity
            style={styles.roomItem}
            onPress={() => onPress(otherUser?.username || 'User')}
        >
            <Image
                source={{ uri: otherUser?.photoURL || 'https://via.placeholder.com/50' }}
                style={styles.avatar}
            />
            <View style={styles.roomInfo}>
                <Text style={styles.username}>{otherUser?.username || 'Loading...'}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {room.lastMessage || 'No messages yet'}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export default function ChatListScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const [rooms, setRooms] = useState<ChatRoom[]>([]);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToChatRooms(user.uid, (fetchedRooms) => {
            setRooms(fetchedRooms);
        });
        return () => unsubscribe();
    }, [user]);

    const renderItem = ({ item }: { item: ChatRoom }) => {
        const otherUserId = item.participants.find(id => id !== user?.uid);
        return (
            <ChatRoomItem
                room={item}
                currentUserId={user?.uid || ''}
                onPress={(title) => navigation.navigate('ChatRoom', {
                    roomId: item.id,
                    otherUserId,
                    title
                })}
            />
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={rooms}
                keyExtractor={(item, index) => item.id || `room-${index}`}
                renderItem={renderItem}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No conversations yet</Text>
                        <Text style={styles.emptySubText}>Find friends and start chatting!</Text>
                    </View>
                }
                contentContainerStyle={rooms.length === 0 ? styles.emptyListContent : null}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    roomItem: {
        flexDirection: 'row',
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    avatar: {
        width: 56, // Larger avatar
        height: 56,
        borderRadius: 28,
        marginRight: spacing.m,
        backgroundColor: colors.gray,
    },
    roomInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    username: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
        color: colors.text,
    },
    lastMessage: {
        color: colors.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        marginTop: spacing.xl * 2,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.s,
    },
    emptySubText: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    emptyListContent: {
        flex: 1,
    },
});
