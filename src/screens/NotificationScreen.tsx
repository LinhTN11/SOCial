import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { subscribeToNotifications, Notification } from '../services/notificationService';
import { useNavigation } from '@react-navigation/native';

export default function NotificationScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToNotifications(user.uid, (fetchedNotifications: Notification[]) => {
            setNotifications(fetchedNotifications);
        });
        return () => unsubscribe();
    }, [user]);

    const handlePress = (notification: Notification) => {
        if (notification.type === 'follow') {
            navigation.navigate('Profile', { userId: notification.senderId });
        } else if (notification.postId) {
            // Navigate to post details (not implemented yet, maybe just comments)
            navigation.navigate('Comments', { postId: notification.postId });
        }
    };

    const renderItem = ({ item }: { item: Notification }) => {
        let message = '';
        switch (item.type) {
            case 'like':
                message = 'liked your post.';
                break;
            case 'comment':
                message = 'commented on your post.';
                break;
            case 'follow':
                message = 'started following you.';
                break;
        }

        return (
            <TouchableOpacity style={styles.item} onPress={() => handlePress(item)}>
                <Image
                    source={{ uri: item.senderAvatar || 'https://via.placeholder.com/40' }}
                    style={styles.avatar}
                />
                <View style={styles.content}>
                    <Text style={styles.text}>
                        <Text style={styles.username}>{item.senderName}</Text> {message}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: spacing.m,
        backgroundColor: colors.gray,
    },
    content: {
        flex: 1,
    },
    text: {
        color: colors.text,
    },
    username: {
        fontWeight: 'bold',
    },
});
