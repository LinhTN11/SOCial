import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image, Alert, TouchableWithoutFeedback } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { colors, spacing } from '../theme';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Flag, X } from 'lucide-react-native';
import ActionSheet, { ActionItem } from './ActionSheet';
import { useAuthStore } from '../store/useAuthStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
    UserProfile: { userId: string };
    Comments: { postId: string; isReel: boolean };
};

type ReelItemNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');
const SCREEN_HEIGHT = height - 49;

interface ReelItemProps {
    item: {
        id: string;
        videoUrl: string;
        username: string;
        description: string;
        likes: number;
        comments: number;
        userAvatar?: string;
        userId?: string;
        contentMode?: 'contain' | 'cover';
    };
    isActive: boolean;
    onCommentPress?: () => void;
    onDelete?: (reelId: string) => void;
}

export default function ReelItem({ item, isActive, onCommentPress, onDelete }: ReelItemProps) {
    const video = useRef<Video>(null);
    const [status, setStatus] = useState<any>({});
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(item.likes); // Track likes count locally
    const { user } = useAuthStore();
    const [currentUserAvatar, setCurrentUserAvatar] = useState(item.userAvatar);

    // Update likes count when item changes
    useEffect(() => {
        setLikesCount(item.likes);
    }, [item.likes]);

    // Fetch current user avatar in realtime
    useEffect(() => {
        const fetchUserAvatar = async () => {
            if (user && item.userId === user.uid) {
                // If it's the current user's reel, use the live data from store
                setCurrentUserAvatar(user.photoURL);
                return;
            }

            try {
                const { getUserProfile } = await import('../services/userService');
                if (item.userId) {
                    const userProfile = await getUserProfile(item.userId);
                    if (userProfile?.photoURL) {
                        setCurrentUserAvatar(userProfile.photoURL);
                    }
                }
            } catch (error) {
                console.error('Error fetching user avatar:', error);
            }
        };
        fetchUserAvatar();
    }, [item.userId, user?.photoURL]);

    const isFocused = useIsFocused();
    const [hasError, setHasError] = useState(false);
    const [isPaused, setIsPaused] = useState(false); // Manual pause state

    useEffect(() => {
        let isMounted = true;

        if (isActive && isFocused && !hasError && !isPaused) {
            // console.log('Playing reel:', item.id);
            video.current?.playAsync().catch(err => {
                if (isMounted) {
                    console.error('Error playing video:', err);
                    // Don't set error state immediately on play error, it might be a transient loading issue
                    // setHasError(true); 
                }
            });
        } else {
            video.current?.pauseAsync().catch(() => { });
        }

        return () => {
            isMounted = false;
        };
    }, [isActive, isFocused, hasError, isPaused, item.id]);

    // Explicit cleanup on unmount
    useEffect(() => {
        return () => {
            if (video.current) {
                video.current.unloadAsync().catch(() => { });
            }
        };
    }, []);

    const handleTap = () => {
        setIsPaused(!isPaused);
    };

    const toggleLike = async () => {
        try {
            // Import toggleLikeReel function
            const { toggleLikeReel } = await import('../services/reelService');

            // Optimistically update UI
            const newLikedState = !isLiked;
            setIsLiked(newLikedState);
            setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

            // Update in Firestore
            await toggleLikeReel(item.id, isLiked);
        } catch (error) {
            console.error('Error toggling like:', error);
            // Revert on error
            setIsLiked(isLiked);
            setLikesCount(item.likes);
        }
    };

    const navigation = useNavigation<ReelItemNavigationProp>();

    // Check if current user is following the reel author
    useEffect(() => {
        if (user && item.userId) {
            // Check if item.userId is in user.following
            // Note: This relies on user object in store being up to date. 
            // If user.following is not available or outdated, we might need to fetch it.
            // For now, assuming user.following is an array of strings.
            const isFollowingAuthor = (user as any).following?.includes(item.userId);
            setIsFollowing(!!isFollowingAuthor);
        }
    }, [user, item.userId]);

    const [isFollowing, setIsFollowing] = useState(false);

    const handleProfilePress = () => {
        if (item.userId) {
            navigation.navigate('UserProfile', { userId: item.userId });
        }
    };

    const handleFollowPress = async () => {
        if (!user || !item.userId) return;

        // Optimistic update
        const newStatus = !isFollowing;
        setIsFollowing(newStatus);

        try {
            const { followUser, unfollowUser } = await import('../services/userService');
            if (newStatus) {
                await followUser(user.uid, item.userId);
            } else {
                await unfollowUser(user.uid, item.userId);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
            // Revert on error
            setIsFollowing(!newStatus);
            Alert.alert('Error', 'Failed to update follow status');
        }
    };

    const handleShare = async () => {
        try {
            const { Share } = await import('react-native');
            await Share.share({
                message: `Check out this reel by ${item.username}!`,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const [actionSheetVisible, setActionSheetVisible] = useState(false);
    const [actionSheetActions, setActionSheetActions] = useState<ActionItem[]>([]);
    const [actionSheetTitle, setActionSheetTitle] = useState('');

    const handleOptions = () => {
        // Check if current user owns this reel
        if (user?.uid === item.userId) {
            setActionSheetTitle("Manage Reel");
            setActionSheetActions([
                {
                    label: "Delete Reel",
                    isDestructive: true,
                    icon: Trash2,
                    onPress: () => {
                        Alert.alert(
                            "Delete Reel",
                            "Are you sure you want to delete this reel?",
                            [
                                { text: "Cancel", style: "cancel" },
                                {
                                    text: "Delete",
                                    style: "destructive",
                                    onPress: () => {
                                        if (onDelete) {
                                            onDelete(item.id);
                                        }
                                    }
                                }
                            ]
                        );
                    }
                }
            ]);
        } else {
            setActionSheetTitle("Reel Options");
            setActionSheetActions([
                {
                    label: "Report",
                    icon: Flag,
                    onPress: () => Alert.alert("Report", "This feature is coming soon!")
                }
            ]);
        }
        setActionSheetVisible(true);
    };

    const handleVideoError = (error: any) => {
        console.error('Video playback error:', error, 'for reel:', item.id);
        console.error('Video URL:', item.videoUrl);
        setHasError(true);
    };

    return (
        <TouchableWithoutFeedback onPress={handleTap}>
            <View style={styles.container}>
                {hasError ? (
                    <View style={[styles.video, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
                        <Text style={{ color: 'white', textAlign: 'center', padding: 20 }}>
                            Unable to load video{'\n'}
                            {item.username}
                        </Text>
                    </View>
                ) : (
                    isActive ? (
                        <Video
                            ref={video}
                            style={styles.video}
                            source={{
                                uri: item.videoUrl,
                            }}
                            useNativeControls={false}
                            resizeMode={item.contentMode === 'cover' ? ResizeMode.COVER : ResizeMode.CONTAIN}
                            isLooping
                            shouldPlay={isActive && isFocused && !isPaused}
                            onPlaybackStatusUpdate={status => setStatus(() => status)}
                            onError={handleVideoError}
                        />
                    ) : (
                        <View style={[styles.video, { backgroundColor: 'black' }]} />
                    )
                )}


                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.overlay}
                >
                    <View style={styles.content}>
                        <View style={styles.leftContent}>
                            <View style={styles.userInfo}>
                                <TouchableOpacity onPress={handleProfilePress}>
                                    <Image
                                        source={{ uri: currentUserAvatar || 'https://via.placeholder.com/40' }}
                                        style={styles.avatar}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleProfilePress}>
                                    <Text style={styles.username}>{item.username}</Text>
                                </TouchableOpacity>
                                {(user?.uid !== item.userId) && (
                                    <TouchableOpacity
                                        style={[styles.followButton, isFollowing && styles.followingButton]}
                                        onPress={handleFollowPress}
                                    >
                                        <Text style={[styles.followText, isFollowing && styles.followingText]}>
                                            {isFollowing ? 'Following' : 'Follow'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <Text style={styles.description}>{item.description}</Text>
                            <Text style={styles.audio}>♫ Original Audio</Text>
                        </View>

                        <View style={styles.rightActions}>
                            <TouchableOpacity style={styles.actionButton} onPress={toggleLike}>
                                <Heart
                                    color={isLiked ? colors.error : colors.white}
                                    fill={isLiked ? colors.error : 'transparent'}
                                    size={30}
                                />
                                <Text style={styles.actionText}>{likesCount}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={onCommentPress}>
                                <MessageCircle color={colors.white} size={30} />
                                <Text style={styles.actionText}>{item.comments}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                                <Share2 color={colors.white} size={30} />
                                <Text style={styles.actionText}>Share</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={handleOptions}>
                                <MoreHorizontal color={colors.white} size={30} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>
                <ActionSheet
                    visible={actionSheetVisible}
                    onClose={() => setActionSheetVisible(false)}
                    title={actionSheetTitle}
                    actions={actionSheetActions}
                />
            </View>
        </TouchableWithoutFeedback >
    );
}

const styles = StyleSheet.create({
    container: {
        width: width,
        height: height, // Full screen
        backgroundColor: 'black',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
        justifyContent: 'flex-end',
        paddingBottom: 120, // Increased to prevent hiding caption and audio
        paddingHorizontal: spacing.m,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    leftContent: {
        flex: 1,
        marginRight: spacing.xl,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.s,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: spacing.s,
        borderWidth: 1,
        borderColor: colors.white,
    },
    username: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: spacing.s,
    },
    followButton: {
        borderWidth: 1,
        borderColor: colors.white,
        borderRadius: 4,
        paddingHorizontal: spacing.s,
        paddingVertical: 2,
    },
    followingButton: {
        backgroundColor: colors.white,
        borderColor: colors.white,
    },
    followText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    followingText: {
        color: colors.black,
    },
    description: {
        color: colors.white,
        marginBottom: spacing.s,
        fontSize: 14,
    },
    audio: {
        color: colors.white,
        fontSize: 12,
    },
    rightActions: {
        alignItems: 'center',
    },
    actionButton: {
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    actionText: {
        color: colors.white,
        fontSize: 12,
        marginTop: 4,
        fontWeight: 'bold',
    },
});
