import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { createPost, uploadImage } from '../services/postService';
import { useNavigation } from '@react-navigation/native';
import { AppTabParamList } from '../navigation/AppTabs';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Toast from '../components/Toast';

type CreatePostScreenNavigationProp = BottomTabNavigationProp<AppTabParamList, 'Create'>;

export default function CreatePostScreen() {
    const navigation = useNavigation<CreatePostScreenNavigationProp>();
    const { user } = useAuthStore();
    const [image, setImage] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handlePost = async () => {
        if (!image) {
            Alert.alert('Error', 'Please select an image');
            return;
        }
        if (!user) return;

        setLoading(true);
        try {
            const imageUrl = await uploadImage(image);
            await createPost(user.uid, user.username, user.photoURL, imageUrl, caption);
            showToast("Post created successfully!", "success");
            setImage(null);
            setCaption('');
            setTimeout(() => navigation.navigate('Home'), 1500);
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <Text style={styles.cancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Post</Text>
                <TouchableOpacity
                    onPress={handlePost}
                    disabled={loading || !image}
                    style={[styles.shareButton, (!image || loading) && styles.shareButtonDisabled]}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                        <Text style={styles.shareButtonText}>Share</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <TouchableOpacity
                    onPress={pickImage}
                    style={styles.imageSection}
                    activeOpacity={0.9}
                >
                    {image ? (
                        <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />
                    ) : (
                        <View style={styles.emptyState}>
                            <View style={styles.iconCircle}>
                                <Text style={styles.plusIcon}>+</Text>
                            </View>
                            <Text style={styles.emptyText}>Tap to select a photo</Text>
                            <Text style={styles.emptySubtext}>Choose from your gallery</Text>
                        </View>
                    )}
                    {image && (
                        <View style={styles.imageOverlay}>
                            <Text style={styles.changePhotoText}>Tap to change photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.captionSection}>
                    <TextInput
                        style={styles.captionInput}
                        placeholder="Write a caption..."
                        placeholderTextColor={colors.textSecondary}
                        value={caption}
                        onChangeText={setCaption}
                        multiline
                        maxLength={2200}
                    />
                    <Text style={styles.charCount}>{caption.length}/2200</Text>
                </View>
            </ScrollView>

            <Toast
                visible={toastVisible}
                message={toastMessage}
                type={toastType}
                onDismiss={() => setToastVisible(false)}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.m,
        paddingTop: 50,
        paddingBottom: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
    },
    cancelButton: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    shareButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20, // Pill shape
        minWidth: 80,
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    shareButtonDisabled: {
        backgroundColor: colors.gray,
        opacity: 0.5,
        shadowOpacity: 0,
        elevation: 0,
    },
    shareButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    imageSection: {
        flex: 1,
        backgroundColor: colors.gray,
        marginTop: spacing.s,
        marginHorizontal: spacing.m,
        marginBottom: spacing.m,
        borderRadius: 16, // Softer corners
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', // Darker for better text visibility
        padding: spacing.m,
        alignItems: 'center',
    },
    changePhotoText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.m,
        borderWidth: 2,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    plusIcon: {
        fontSize: 40,
        color: colors.textSecondary,
        fontWeight: '300',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.s,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    captionSection: {
        backgroundColor: colors.background,
        paddingHorizontal: spacing.m,
        paddingTop: spacing.m,
        paddingBottom: spacing.l,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    captionInput: {
        fontSize: 16,
        color: colors.text,
        minHeight: 100, // Taller
        textAlignVertical: 'top',
        padding: spacing.m,
        backgroundColor: colors.gray,
        borderRadius: 16, // Softer
        marginBottom: spacing.s,
        borderWidth: 1, // Subtle border
        borderColor: 'transparent', // Default no border
    },
    charCount: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'right',
        marginRight: spacing.s,
    },
});
