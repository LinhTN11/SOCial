import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import { getPosts } from '../services/postService';
import { Post } from '../types';
import PostItem from '../components/PostItem';
import StoryBar from '../components/StoryBar';
import Skeleton from '../components/Skeleton';
import { Heart, MessageCircle, Send } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { getNotifications } from '../services/notificationService';

export default function HomeScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchPosts = async () => {
        try {
            const fetchedPosts = await getPosts();
            setPosts(fetchedPosts);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchUnreadCount();
    }, []);

    // Refresh posts when screen comes back into focus (e.g., after commenting)
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchPosts();
            fetchUnreadCount();
        });
        return unsubscribe;
    }, [navigation]);

    const fetchUnreadCount = async () => {
        if (!user) return;
        try {
            const notifications = await getNotifications(user.uid);
            const unread = notifications.filter(n => !n.read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPosts();
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.logo}>SOCial</Text>
            <View style={styles.headerIcons}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => {
                        navigation.navigate('Activity');
                        setUnreadCount(0); // Clear badge when opening
                    }}
                >
                    <Heart color={colors.text} size={24} />
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('ChatList')}>
                    <MessageCircle color={colors.text} size={24} />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                {renderHeader()}
                <View style={{ padding: spacing.m }}>
                    <Skeleton height={100} style={{ marginBottom: spacing.m }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.m }}>
                        <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: spacing.s }} />
                        <Skeleton width={150} height={20} />
                    </View>
                    <Skeleton height={300} style={{ marginBottom: spacing.m }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.m }}>
                        <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: spacing.s }} />
                        <Skeleton width={150} height={20} />
                    </View>
                    <Skeleton height={300} style={{ marginBottom: spacing.m }} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}
            <FlatList
                ListHeaderComponent={<StoryBar />}
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <PostItem
                        post={item}
                        onDelete={(deletedPostId) => {
                            setPosts(prev => prev.filter(p => p.id !== deletedPostId));
                        }}
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No posts yet</Text>
                        <Text style={styles.emptySubText}>Follow people to see their posts here!</Text>
                    </View>
                }
                contentContainerStyle={posts.length === 0 ? styles.emptyListContent : null}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                windowSize={5}
                removeClippedSubviews={true}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        fontStyle: 'italic',
        color: colors.text,
    },
    headerIcons: {
        flexDirection: 'row',
    },
    iconButton: {
        marginLeft: spacing.m,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: colors.error,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
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
