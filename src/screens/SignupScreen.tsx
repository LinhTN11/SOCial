import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
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
        <View style={styles.container}>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing.l,
        backgroundColor: colors.background,
    },
    title: {
        ...typography.header,
        textAlign: 'center',
        marginBottom: spacing.xl,
        color: colors.primary,
        fontSize: 32,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 5,
        padding: spacing.m,
        marginBottom: spacing.m,
        backgroundColor: colors.gray,
    },
    button: {
        backgroundColor: colors.primary,
        padding: spacing.m,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    buttonText: {
        color: colors.white,
        fontWeight: 'bold',
    },
    linkText: {
        color: colors.primary,
        textAlign: 'center',
    },
});
