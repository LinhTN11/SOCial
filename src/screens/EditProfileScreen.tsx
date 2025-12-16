import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { updateUserProfile } from '../services/userService';
import { uploadImage } from '../services/postService';
import { ArrowLeft, Camera } from 'lucide-react-native';

export default function EditProfileScreen() {
    const navigation = useNavigation();
    const { user, setUser } = useAuthStore();
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [image, setImage] = useState(user?.photoURL || null);
    const [loading, setLoading] = useState(false);

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
    // ...

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

            Alert.alert('Success', 'Profile updated successfully');
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
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

            <View style={styles.content}>
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
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: spacing.s,
        fontSize: 16,
        color: colors.text,
    },
    bioInput: {
        height: 80,
        textAlignVertical: 'top',
    },
});
