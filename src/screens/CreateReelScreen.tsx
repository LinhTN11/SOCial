import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { colors, spacing } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { uploadReel } from '../services/reelService';
import { ArrowLeft, Upload, Maximize2, Minimize2 } from 'lucide-react-native';
import Toast from '../components/Toast';

export default function CreateReelScreen() {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);

    const pickVideo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true, // Re-enable for system trimming/cropping
            quality: 1,
        });

        if (!result.canceled) {
            setVideoUri(result.assets[0].uri);
        }
    };

    const [contentMode, setContentMode] = useState<'contain' | 'cover'>('contain');

    const toggleContentMode = () => {
        setContentMode(prev => prev === 'contain' ? 'cover' : 'contain');
    };

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    const handleUpload = async () => {
        if (!user || !videoUri) return;

        setUploading(true);
        try {
            // Upload video to Cloudinary and save to Firestore
            console.log('Starting reel upload process...');
            await uploadReel(user.uid, user.username, user.photoURL, videoUri, description, contentMode);

            showToast("Reel uploaded successfully!", "success");
            setTimeout(() => navigation.goBack(), 1500);
        } catch (error) {
            console.error(error);
            showToast("Failed to upload reel. Please check your internet connection.", "error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ArrowLeft color={colors.text} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>New Reel</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {videoUri ? (
                        <View style={styles.previewContainer}>
                            <Video
                                source={{ uri: videoUri }}
                                style={styles.videoPreview}
                                resizeMode={contentMode === 'contain' ? ResizeMode.CONTAIN : ResizeMode.COVER}
                                shouldPlay
                                isLooping
                                isMuted
                            />
                            <TouchableOpacity style={styles.scaleButton} onPress={toggleContentMode}>
                                {contentMode === 'contain' ? (
                                    <Maximize2 color={colors.white} size={20} />
                                ) : (
                                    <Minimize2 color={colors.white} size={20} />
                                )}
                                <Text style={styles.scaleButtonText}>
                                    {contentMode === 'contain' ? 'Fit' : 'Fill'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.changeButton} onPress={pickVideo}>
                                <Text style={styles.changeButtonText}>Change Video</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.uploadPlaceholder} onPress={pickVideo}>
                            <Upload color={colors.textSecondary} size={48} />
                            <Text style={styles.uploadText}>Select Video</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Write a caption..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, (!videoUri || uploading) && styles.disabledButton]}
                        onPress={handleUpload}
                        disabled={!videoUri || uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.submitButtonText}>Share Reel</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
                <Toast
                    visible={toastVisible}
                    message={toastMessage}
                    type={toastType}
                    onDismiss={() => setToastVisible(false)}
                />
            </KeyboardAvoidingView>
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
    content: {
        flex: 1,
        padding: spacing.m,
    },
    uploadPlaceholder: {
        width: '100%',
        height: 300,
        backgroundColor: colors.gray,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    uploadText: {
        color: colors.textSecondary,
        marginTop: spacing.s,
    },
    previewContainer: {
        width: '100%',
        height: 450, // Taller preview
        marginBottom: spacing.m,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: colors.black,
    },
    videoPreview: {
        width: '100%',
        height: '100%',
    },
    changeButton: {
        position: 'absolute',
        bottom: spacing.m,
        right: spacing.m,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: spacing.m,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    scaleButton: {
        position: 'absolute',
        bottom: spacing.m,
        left: spacing.m,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: spacing.m,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    scaleButtonText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: 'bold',
    },
    changeButtonText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: 'bold',
    },
    inputContainer: {
        marginBottom: spacing.l,
        backgroundColor: colors.gray,
        borderRadius: 12,
        padding: spacing.s,
    },
    input: {
        color: colors.text,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
        padding: spacing.s,
    },
    submitButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.m + 4,
        borderRadius: 25, // Pill shape
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.5,
        shadowOpacity: 0,
        elevation: 0,
        backgroundColor: colors.gray,
    },
    submitButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 0.5,
    },
});
