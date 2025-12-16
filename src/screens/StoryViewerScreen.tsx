import React, { useEffect, useState, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, Text, SafeAreaView, Animated, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing } from '../theme';
import { Story } from '../types';
import { X, MoreVertical, Trash2 } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000;

type RootStackParamList = {
    StoryViewer: { stories: Story[]; initialIndex: number };
};

type StoryViewerRouteProp = RouteProp<RootStackParamList, 'StoryViewer'>;

export default function StoryViewerScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<StoryViewerRouteProp>();
    const { user } = useAuthStore();
    const { stories, initialIndex } = route.params;
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isPaused, setIsPaused] = useState(false); // Pause state
    const [progressValue, setProgressValue] = useState(0); // Track progress value
    const progress = useRef(new Animated.Value(0)).current;
    const animationRef = useRef<Animated.CompositeAnimation | null>(null);

    const currentStory = stories[currentIndex];
    const isOwnStory = user?.uid === currentStory.userId;

    useEffect(() => {
        if (!isPaused) {
            startAnimation();
        }
        return () => {
            if (animationRef.current) {
                animationRef.current.stop();
            }
        };
    }, [currentIndex, isPaused]);

    const startAnimation = () => {
        const startValue = isPaused ? progressValue : 0;
        progress.setValue(startValue);

        animationRef.current = Animated.timing(progress, {
            toValue: 1,
            duration: STORY_DURATION * (1 - startValue),
            useNativeDriver: false,
        });

        animationRef.current.start(({ finished }) => {
            if (finished && !isPaused) goToNextStory();
        });
    };

    const handlePause = () => {
        if (isPaused) {
            // Resume
            setIsPaused(false);
        } else {
            // Pause
            if (animationRef.current) {
                animationRef.current.stop();
                progress.stopAnimation((value) => {
                    setProgressValue(value);
                });
            }
            setIsPaused(true);
        }
    };

    const goToNextStory = () => {
        setIsPaused(false); // Reset pause when changing story
        setProgressValue(0);
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            navigation.goBack();
        }
    };

    const goToPrevStory = () => {
        setIsPaused(false); // Reset pause when changing story
        setProgressValue(0);
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else {
            startAnimation();
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            "Delete Story",
            "Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { deleteStory } = await import('../services/storyService');
                            await deleteStory(currentStory.id);
                            Alert.alert("Success", "Story deleted");
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete story");
                        }
                    }
                }
            ]
        );
    };

    const handleAddStory = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.8,
        });

        if (!result.canceled && user) {
            try {
                const { uploadStory } = await import('../services/storyService');
                await uploadStory(user.uid, user.username, user.photoURL, result.assets[0].uri);
                Alert.alert("Success", "Story added!");
                navigation.goBack();
            } catch (error) {
                Alert.alert("Error", "Failed to add story");
            }
        }
    };

    const progressWidth = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.headerContainer}>
                <View style={styles.progressBarContainer}>
                    {stories.map((_, index) => (
                        <View key={`progress-${index}`} style={styles.progressBarBackground}>
                            <Animated.View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        width: index === currentIndex ? progressWidth : index < currentIndex ? '100%' : '0%'
                                    }
                                ]}
                            />
                        </View>
                    ))}
                </View>

                <View style={styles.userInfo}>
                    <View style={styles.userInfoLeft}>
                        <Image source={{ uri: currentStory.userAvatar || 'https://via.placeholder.com/40' }} style={styles.avatar} />
                        <View>
                            <Text style={styles.username}>{currentStory.username}</Text>
                            <Text style={styles.timeAgo}>{new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                    </View>
                    <View style={styles.headerButtons}>
                        {isOwnStory && (
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={() => {
                                    Alert.alert(
                                        'Story Options',
                                        'What would you like to do?',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Delete Story',
                                                style: 'destructive',
                                                onPress: handleDelete
                                            }
                                        ]
                                    );
                                }}
                            >
                                <MoreVertical color={colors.white} size={24} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
                            <X color={colors.white} size={24} />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            <Image
                source={{ uri: currentStory.imageUrl || 'https://via.placeholder.com/400x800?text=Story+Not+Available' }}
                style={styles.image}
                resizeMode="cover"
                onError={(error) => {
                    console.error('❌ Story image load error:', error.nativeEvent.error);
                    console.log('❌ Failed imageUrl:', currentStory.imageUrl);
                }}
                onLoad={() => {
                    console.log('✅ Story image loaded:', currentStory.imageUrl);
                }}
            />

            <View style={styles.overlayContainer}>
                <TouchableOpacity style={styles.leftOverlay} onPress={goToPrevStory} />
                <TouchableOpacity style={styles.middleOverlay} onPress={handlePause} />
                <TouchableOpacity style={styles.rightOverlay} onPress={goToNextStory} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    image: {
        width: width,
        height: height,
        position: 'absolute',
    },
    headerContainer: {
        zIndex: 10,
        paddingTop: spacing.xl + 10,
    },
    progressBarContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.m,
        marginBottom: spacing.s,
        height: 3,
    },
    progressBarBackground: {
        flex: 1,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 2,
        borderRadius: 1.5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.white,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.m,
    },
    userInfoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: spacing.s,
    },
    username: {
        color: colors.white,
        fontWeight: 'bold',
    },
    timeAgo: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
    },
    headerButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },

    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
    },
    leftOverlay: {
        flex: 1,
    },
    middleOverlay: {
        flex: 2,
    },
    rightOverlay: {
        flex: 1,
    },
});
