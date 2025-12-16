import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { colors, spacing } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { uploadReel } from '../services/reelService';
import { ArrowLeft, Upload } from 'lucide-react-native';

export default function CreateReelScreen() {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);

    const pickVideo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setVideoUri(result.assets[0].uri);
        }
    };

    const handleUpload = async () => {
        if (!user || !videoUri) return;

        setUploading(true);
        try {
            // Upload video to Cloudinary and save to Firestore
            console.log('Starting reel upload process...');
            await uploadReel(user.uid, user.username, user.photoURL, videoUri, description);

            Alert.alert("Success", "Reel uploaded successfully!");
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to upload reel. Please check your internet connection and try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Reel</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                {videoUri ? (
                    <View style={styles.previewContainer}>
                        <Video
                            source={{ uri: videoUri }}
                            style={styles.videoPreview}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay
                            isLooping
                            isMuted
                        />
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
            </View>
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
        height: 400,
        marginBottom: spacing.m,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
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
        paddingVertical: spacing.s,
        borderRadius: 20,
    },
    changeButtonText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    inputContainer: {
        marginBottom: spacing.l,
    },
    input: {
        color: colors.text,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: colors.primary,
        padding: spacing.m,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
