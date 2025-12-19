import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { getStories, uploadStory, getMyStories } from '../services/storyService';
import { Story } from '../types';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Plus } from 'lucide-react-native';
import Toast from './Toast';

export default function StoryBar() {
    const { user } = useAuthStore();
    const navigation = useNavigation<any>();
    const [stories, setStories] = useState<Story[]>([]);
    const [myStory, setMyStory] = useState<Story | null>(null);

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    useEffect(() => {
        if (user) {
            loadStories();
        }
    }, [user]);

    const loadStories = async () => {
        if (!user) return;

        // Fetch user's own stories
        const myStories = await getMyStories(user.uid);
        if (myStories && myStories.length > 0) {
            setMyStory(myStories[0]); // Just take the first one for preview
        } else {
            setMyStory(null);
        }

        // Fetch stories from people user is following
        const followingIds = user.following || [];
        console.log('📱 Current user following:', followingIds);
        console.log('📱 Following count:', followingIds.length);

        if (followingIds.length > 0) {
            const followingStories = await getStories(followingIds);
            console.log('📱 Fetched stories from following:', followingStories.length);

            // Group by user and take first story from each user for display
            const storiesByUser: Record<string, Story[]> = {};
            followingStories.forEach(story => {
                if (!storiesByUser[story.userId]) {
                    storiesByUser[story.userId] = [];
                }
                storiesByUser[story.userId].push(story);
            });

            console.log('📱 Stories grouped by user:', Object.keys(storiesByUser).length, 'users');

            // Flatten for display (one bubble per user)
            const otherStories: Story[] = [];
            Object.keys(storiesByUser).forEach(userId => {
                otherStories.push(storiesByUser[userId][0]);
            });
            setStories(otherStories);
        } else {
            console.log('📱 No following list - cannot see others stories');
            setStories([]);
        }
    };

    const handleAddStory = async () => {
        if (!user) return;

        // Always allow creating new story
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.8,
        });

        if (!result.canceled) {
            try {
                await uploadStory(user.uid, user.username, user.photoURL, result.assets[0].uri);
                showToast("Story added successfully!", "success");
                loadStories();
            } catch (error) {
                showToast("Failed to add story", "error");
            }
        }
    };

    const handleViewMyStories = async () => {
        if (!user) return;
        // Fetch all of user's stories
        const myStories = await getMyStories(user.uid);
        if (myStories && myStories.length > 0) {
            navigation.navigate('StoryViewer', { stories: myStories, initialIndex: 0 });
        }
    };

    const handleViewStory = async (story: Story) => {
        // Fetch all stories from this user
        const userStories = stories.filter(s => s.userId === story.userId);

        // If we only have one story, try to fetch all from that user
        if (userStories.length === 1) {
            const { getMyStories } = await import('../services/storyService');
            const allUserStories = await getMyStories(story.userId);
            if (allUserStories && allUserStories.length > 0) {
                navigation.navigate('StoryViewer', { stories: allUserStories, initialIndex: 0 });
                return;
            }
        }

        // Fallback: just show what we have
        navigation.navigate('StoryViewer', { stories: [story], initialIndex: 0 });
    };

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            paddingVertical: spacing.m,
            backgroundColor: colors.background,
        },
        scrollContent: {
            paddingHorizontal: spacing.m,
        },
        storyItem: {
            position: 'relative' as const,
            alignItems: 'center' as const,
            marginRight: spacing.m,
            width: 72,
        },
        gradientBorder: {
            width: 68,
            height: 68,
            borderRadius: 34,
            borderWidth: 2,
            borderColor: colors.primary,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
            padding: 2,
        },
        avatarContainer: {
            width: 60,
            height: 60,
            borderRadius: 30,
            overflow: 'hidden' as const,
            borderWidth: 2,
            borderColor: colors.background,
        },
        noBorder: {
            width: 70, // Slightly larger to match the outer ring visual weight
            height: 70,
            borderRadius: 35,
            borderWidth: 0,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
        },
        avatar: {
            width: '100%',
            height: '100%',
        },
        addIconContainer: {
            position: 'absolute' as const,
            bottom: 0,
            right: 0,
            backgroundColor: colors.primary,
            width: 20,
            height: 20,
            borderRadius: 10,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
            borderWidth: 2,
            borderColor: colors.background,
        },
        addIconContainerStandalone: {
            position: 'absolute' as const,
            bottom: 16,
            right: 4,
            backgroundColor: colors.primary,
            width: 24,
            height: 24,
            borderRadius: 12,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
            borderWidth: 2,
            borderColor: colors.background,
        },
        addIcon: {
            color: colors.white,
            fontSize: 12,
            fontWeight: 'bold' as const,
        },
        username: {
            fontSize: 11,
            marginTop: 4,
            color: colors.text,
        },
    }), [colors]);

    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* My Story */}
                <View style={styles.storyItem}>
                    <TouchableOpacity
                        style={[styles.avatarContainer, myStory ? styles.gradientBorder : styles.noBorder]}
                        onPress={myStory ? handleViewMyStories : handleAddStory}
                    >
                        <Image
                            source={{ uri: user?.photoURL || 'https://via.placeholder.com/70' }}
                            style={styles.avatar}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addIconContainerStandalone} onPress={handleAddStory}>
                        <Plus color={colors.white} size={14} strokeWidth={3} />
                    </TouchableOpacity>
                    <Text style={styles.username} numberOfLines={1}>Your Story</Text>
                </View>

                {/* Other Stories */}
                {stories.map((story) => (
                    <TouchableOpacity key={story.id} style={styles.storyItem} onPress={() => handleViewStory(story)}>
                        <View style={styles.gradientBorder}>
                            <View style={styles.avatarContainer}>
                                <Image source={{ uri: story.userAvatar || 'https://via.placeholder.com/70' }} style={styles.avatar} />
                            </View>
                        </View>
                        <Text style={styles.username} numberOfLines={1}>{story.username}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <Toast
                visible={toastVisible}
                message={toastMessage}
                type={toastType}
                onDismiss={() => setToastVisible(false)}
                topOffset={10}
            />
        </View>
    );
}
