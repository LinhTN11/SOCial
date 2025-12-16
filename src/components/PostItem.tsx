import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react-native';
import { Post } from '../types';
import { colors, spacing, typography } from '../theme';
import { toggleLikePost, deletePost, toggleSavePost } from '../services/postService';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
// Gesture handler removed for Expo Go compatibility
// import { TapGestureHandler, State } from 'react-native-gesture-handler';
// Reanimated removed for Expo Go compatibility
// import Animated from 'react-native-reanimated';
import { Share } from 'react-native';

const { width } = Dimensions.get('window');

interface PostItemProps {
    post: Post;
    onDelete?: (postId: string) => void;
}

export function PostItem({ post, onDelete }: PostItemProps) {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const [isLiked, setIsLiked] = useState(user ? post.likes.includes(user.uid) : false);
    const [likesCount, setLikesCount] = useState(post.likes.length);
    const [isSaved, setIsSaved] = useState(user?.savedPosts?.includes(post.id) || false);
    const [currentUserAvatar, setCurrentUserAvatar] = useState(post.userAvatar);

    // Fetch current user avatar in realtime
    useEffect(() => {
        const fetchUserAvatar = async () => {
            try {
                const { getUserProfile } = await import('../services/userService');
                const userProfile = await getUserProfile(post.userId);
                if (userProfile?.photoURL) {
                    setCurrentUserAvatar(userProfile.photoURL);
                }
            } catch (error) {
                console.error('Error fetching user avatar:', error);
            }
        };
        fetchUserAvatar();
    }, [post.userId]);


    // Update isSaved when user.savedPosts changes
    useEffect(() => {
        if (user?.savedPosts) {
            setIsSaved(user.savedPosts.includes(post.id));
        }
    }, [user?.savedPosts, post.id]);


    // Animation values (disabled for Expo Go compatibility)
    // const scale = useSharedValue(0);
    // const opacity = useSharedValue(0);

    // const rStyle = useAnimatedStyle(() => {
    //     return {
    //         transform: [{ scale: Math.max(scale.value, 0) }],
    //         opacity: opacity.value,
    //     };
    // });

    const onDoubleTap = () => {
        if (!isLiked) {
            handleLike();
        }

        // Heart Animation (disabled for Expo Go)
        // scale.value = withSequence(withSpring(1), withDelay(500, withSpring(0)));
        // opacity.value = withSequence(withSpring(1), withDelay(500, withSpring(0)));
    };


    const handleSave = async () => {
        if (!user) return;
        const newIsSaved = !isSaved;
        setIsSaved(newIsSaved);
        try {
            await toggleSavePost(user.uid, post.id, isSaved);

            // Refresh user data to sync savedPosts
            const { getUserProfile } = await import('../services/userService');
            const updatedUser = await getUserProfile(user.uid);
            if (updatedUser) {
                // Update auth store with fresh user data
                const { setUser } = useAuthStore.getState();
                setUser(updatedUser);
            }
        } catch (error) {
            setIsSaved(!newIsSaved);
            console.error(error);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this post by ${post.username}: ${post.imageUrl}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleLike = async () => {
        if (!user) return;

        // Optimistic update
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

        try {
            await toggleLikePost(post.id, user, isLiked);
        } catch (error) {
            // Revert if failed
            setIsLiked(!newIsLiked);
            setLikesCount(prev => !newIsLiked ? prev + 1 : prev - 1);
            console.error(error);
        }
    };

    const handleOptions = () => {
        if (user?.uid === post.userId) {
            Alert.alert(
                "Options",
                "Manage your post",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                            try {
                                await deletePost(post.id);
                                if (onDelete) onDelete(post.id);
                            } catch (error) {
                                Alert.alert("Error", "Failed to delete post");
                            }
                        }
                    }
                ]
            );
        } else {
            Alert.alert("Options", "Report or hide this post (Not implemented)");
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.userInfo}
                    onPress={() => navigation.navigate('UserProfile', { userId: post.userId })}
                >
                    <Image
                        source={{ uri: currentUserAvatar || 'https://via.placeholder.com/40' }}
                        style={styles.avatar}
                    />
                    <View>
                        <Text style={styles.username}>{post.username}</Text>
                        <Text style={styles.location}>Hanoi, Vietnam</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleOptions}>
                    <MoreHorizontal color={colors.text} size={24} />
                </TouchableOpacity>
            </View>

            {/* Image */}
            <View>
                <Image source={{ uri: post.imageUrl }} style={styles.image} />
                {/* Heart overlay animation disabled for Expo Go
                <Animated.View style={[styles.overlayHeart, rStyle]}>
                    <Heart color={colors.white} fill={colors.white} size={80} />
                </Animated.View>
                */}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <View style={styles.leftActions}>
                    <TouchableOpacity onPress={handleLike}>
                        <Heart
                            color={isLiked ? colors.error : colors.text}
                            fill={isLiked ? colors.error : 'transparent'}
                            size={24}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Comments', { postId: post.id })}>
                        <MessageCircle color={colors.text} size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                        <Send color={colors.text} size={24} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handleSave}>
                    <Bookmark
                        color={colors.text}
                        fill={isSaved ? colors.text : 'transparent'}
                        size={24}
                    />
                </TouchableOpacity>
            </View>

            {/* Likes & Caption */}
            <View style={styles.footer}>
                <TouchableOpacity onPress={() => navigation.navigate('UserList', { type: 'likes', entityId: post.id, title: 'Likes' })}>
                    <Text style={styles.likes}>{likesCount} likes</Text>
                </TouchableOpacity>
                <View style={styles.captionContainer}>
                    <Text style={styles.username}>{post.username}</Text>
                    <Text style={styles.caption}> {post.caption}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Comments', { postId: post.id })}>
                    <Text style={styles.viewComments}>View all {post.commentsCount || 0} comments</Text>
                </TouchableOpacity>
                <Text style={styles.timeAgo}>{new Date(post.createdAt).toLocaleDateString()}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.l,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.s,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: spacing.s,
        backgroundColor: colors.gray,
    },
    username: {
        fontWeight: 'bold',
        color: colors.text,
        fontSize: 14,
    },
    location: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    image: {
        width: width,
        height: width,
        backgroundColor: colors.gray,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing.s,
    },
    leftActions: {
        flexDirection: 'row',
    },
    actionButton: {
        marginLeft: spacing.m,
    },
    footer: {
        paddingHorizontal: spacing.s,
    },
    likes: {
        fontWeight: 'bold',
        marginBottom: spacing.s / 2,
    },
    captionContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: spacing.s / 2,
    },
    caption: {
        color: colors.text,
    },
    viewComments: {
        color: colors.textSecondary,
        marginBottom: spacing.s / 2,
    },
    timeAgo: {
        fontSize: 10,
        color: colors.textSecondary,
    },
    overlayHeart: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -40,
        marginTop: -40,
        zIndex: 10,
    },
});

export default React.memo(PostItem);

