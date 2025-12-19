import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthStack';
import { colors, spacing, typography } from '../theme';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { User } from '../types';

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

export default function SignupScreen() {
    const navigation = useNavigation<SignupScreenNavigationProp>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!email || !password || !username) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            // Check username availability first (to avoid creating auth user if username taken)
            // Note: We need to import checkUsernameAvailability from userService
            const { checkUsernameAvailability } = await import('../services/userService');
            const isAvailable = await checkUsernameAvailability(username);

            if (!isAvailable) {
                Alert.alert('Error', 'Username already taken');
                setLoading(false);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const newUser: User = {
                uid: user.uid,
                email: user.email!,
                username: username,
                followers: [],
                following: [],
                createdAt: Date.now(),
            };

            await setDoc(doc(db, 'users', user.uid), newUser);

            // Auth state listener in useAuthStore will handle the rest
        } catch (error: any) {
            Alert.alert('Signup Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Image source={require('../../assets/logo.png')} style={styles.logo} />
                <Text style={styles.title}>Sign Up</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={styles.buttonText}>Sign Up</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.linkText}>Already have an account? Log in</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.l,
    },
    // ...
    logo: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginBottom: spacing.m,
    },
    title: {
        ...typography.header,
        textAlign: 'center',
        marginBottom: spacing.xl,
        color: colors.primary,
        fontSize: 36,
        letterSpacing: 1,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: spacing.m,
        paddingHorizontal: spacing.l,
        marginBottom: spacing.m,
        backgroundColor: colors.gray,
        fontSize: 16,
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.m + 4,
        borderRadius: 25,
        alignItems: 'center',
        marginBottom: spacing.l,
        marginTop: spacing.s,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    linkText: {
        color: colors.textSecondary,
        textAlign: 'center',
        fontSize: 14,
    },
});
