import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image, Alert, TouchableWithoutFeedback } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { colors, spacing } from '../theme';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';

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
    }, [item.userId]);

    const isFocused = useIsFocused();
    const [hasError, setHasError] = useState(false);
    const [isPaused, setIsPaused] = useState(false); // Manual pause state

    useEffect(() => {
        if (isActive && isFocused && !hasError && !isPaused) {
            console.log('Playing reel:', item.id, 'by user:', item.userId);
            video.current?.playAsync().catch(err => {
                console.error('Error playing video:', err);
                setHasError(true);
            });
        } else {
            video.current?.pauseAsync();
        }
    }, [isActive, isFocused, hasError, isPaused]);

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

    const handleOptions = () => {
        // Check if current user owns this reel
        if (user?.uid === item.userId) {
            Alert.alert(
                "Reel Options",
                "Manage your reel",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
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
                ]
            );
        } else {
            Alert.alert(
                "Reel Options",
                "What would you like to do?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Report", onPress: () => Alert.alert("Report", "This feature is coming soon!") }
                ]
            );
        }
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
                    <Video
                        ref={video}
                        style={styles.video}
                        source={{
                            uri: item.videoUrl,
                        }}
                        useNativeControls={false}
                        resizeMode={ResizeMode.COVER}
                        isLooping
                        shouldPlay={isActive && isFocused}
                        onPlaybackStatusUpdate={status => setStatus(() => status)}
                        onError={handleVideoError}
                    />
                )}


                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.overlay}
                >
                    <View style={styles.content}>
                        <View style={styles.leftContent}>
                            <View style={styles.userInfo}>
                                <Image
                                    source={{ uri: currentUserAvatar || 'https://via.placeholder.com/40' }}
                                    style={styles.avatar}
                                />
                                <Text style={styles.username}>{item.username}</Text>
                                <TouchableOpacity style={styles.followButton}>
                                    <Text style={styles.followText}>Follow</Text>
                                </TouchableOpacity>
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
            </View>
        </TouchableWithoutFeedback>
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
    followText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: 'bold',
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
