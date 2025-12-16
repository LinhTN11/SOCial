import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { colors, spacing } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { LogOut } from 'lucide-react-native';

export default function SettingsScreen() {
    const { setUser } = useAuthStore();

    const handleLogout = async () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            setUser(null);
                        } catch (error) {
                            console.error('Error logging out:', error);
                            Alert.alert("Error", "Failed to log out");
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <LogOut color={colors.error} size={24} />
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.m,
        marginTop: spacing.xl * 2,
    },
    logoutText: {
        color: colors.error,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: spacing.s,
    },
});
