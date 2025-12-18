import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { updateUserProfile } from '../services/userService';
import { uploadImage } from '../services/postService';
import { ArrowLeft, Camera } from 'lucide-react-native';

import Toast from '../components/Toast';

export default function EditProfileScreen() {
    const navigation = useNavigation();
    const { user, setUser } = useAuthStore();
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [image, setImage] = useState(user?.photoURL || null);
    const [loading, setLoading] = useState(false);

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);

        try {
            let photoURL = user.photoURL;

            if (image && image !== user.photoURL) {
                photoURL = await uploadImage(image);
            }

            const updates = {
                username,
                bio,
                photoURL,
            };

            await updateUserProfile(user.uid, updates);

            // Update local store
            setUser({ ...user, ...updates });

            showToast('Profile updated successfully', 'success');

            // Wait for toast to be visible before going back
            setTimeout(() => {
                navigation.goBack();
            }, 1000);
        } catch (error) {
            console.error(error);
            showToast('Failed to update profile', 'error');
        } finally {
            setLoading(false);
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
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Text style={styles.saveButton}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                        <Image source={{ uri: image || 'https://via.placeholder.com/100' }} style={styles.avatar} />
                        <View style={styles.cameraIcon}>
                            <Camera color={colors.white} size={20} />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.form}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Username"
                        />

                        <Text style={styles.label}>Bio</Text>
                        <TextInput
                            style={[styles.input, styles.bioInput]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Write something about yourself..."
                            multiline
                        />
                    </View>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    saveButton: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    content: {
        padding: spacing.l,
    },
    avatarContainer: {
        alignSelf: 'center',
        marginBottom: spacing.xl,
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.gray,
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: colors.background,
    },
    form: {
        gap: spacing.m,
    },
    label: {
        color: colors.textSecondary,
        marginBottom: spacing.s / 2,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: spacing.m,
        fontSize: 16,
        color: colors.text,
        backgroundColor: colors.gray,
    },
    bioInput: {
        height: 80,
        textAlignVertical: 'top',
    },
});
