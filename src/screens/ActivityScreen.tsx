import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { getNotifications, markNotificationAsRead } from '../services/notificationService';
import { Notification } from '../types';
import { ArrowLeft } from 'lucide-react-native';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function ActivityScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [postImages, setPostImages] = useState<Record<string, string>>({});

    const formatTimeAgo = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        if (!user) return;
        try {
            const data = await getNotifications(user.uid);
            setNotifications(data);

            // Mark all notifications as read to clear badge
            const { markAllNotificationsAsRead } = await import('../services/notificationService');
            await markAllNotificationsAsRead(user.uid);

            // Fetch post images for notifications
            const images: Record<string, string> = {};
            for (const notif of data) {
                if (notif.postId && !images[notif.postId]) {
                    try {
                        const postDoc = await getDoc(doc(db, 'posts', notif.postId));
                        if (postDoc.exists()) {
                            images[notif.postId] = postDoc.data().imageUrl;
                        }
                    } catch (err) {
                        console.error('Error fetching post image:', err);
                    }
                }
            }
            setPostImages(images);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadNotifications();
    };

    const handlePress = async (item: Notification) => {
        if (!item.read && user) {
            await markNotificationAsRead(user.uid, item.id);
            // Optimistically update
            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
        }

        if (item.type === 'follow') {
            navigation.navigate('UserProfile', { userId: item.senderId });
        } else if (item.postId) {
            // Navigate to post details
            // We need to fetch the post first or just pass ID if PostDetail supports fetching
            // Assuming PostDetail needs a Post object, we might need to fetch it.
            // For now, let's assume we can navigate to a screen that fetches by ID or just UserProfile
            // Actually, let's navigate to UserProfile for now as a fallback, or implement PostDetail fetch.
            // Ideally: navigation.navigate('PostDetail', { postId: item.postId });
            // But our PostDetailScreen expects a 'post' object in params.
            // Let's just go to UserProfile for simplicity in this MVP, or try to implement PostDetail fetch.
            navigation.navigate('UserProfile', { userId: item.senderId });
        }
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[styles.itemContainer, !item.read && styles.unreadItem]}
            onPress={() => handlePress(item)}
        >
            <Image
                source={{ uri: item.senderAvatar || 'https://via.placeholder.com/50' }}
                style={styles.avatar}
            />
            <View style={styles.textContainer}>
                <Text style={styles.text}>
                    <Text style={styles.username}>{item.senderName}</Text>
                    {item.type === 'like' && ' liked your post.'}
                    {item.type === 'comment' && ' commented on your post.'}
                    {item.type === 'follow' && ' started following you.'}
                </Text>
                <Text style={styles.time}>{formatTimeAgo(item.createdAt)}</Text>
            </View>
            {item.type !== 'follow' && item.postId && postImages[item.postId] && (
                <Image
                    source={{ uri: postImages[item.postId] }}
                    style={styles.postThumbnail}
                />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Activity</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No notifications yet</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray,
    },
    unreadItem: {
        backgroundColor: colors.lightGray, // Define this or use a subtle highlight
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: spacing.m,
        backgroundColor: colors.gray,
    },
    textContainer: {
        flex: 1,
    },
    text: {
        fontSize: 14,
        color: colors.text,
    },
    username: {
        fontWeight: 'bold',
    },
    time: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        color: colors.textSecondary,
    },
    postThumbnail: {
        width: 40,
        height: 40,
        backgroundColor: colors.gray,
        borderRadius: 4,
    }
});
