import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { colors, spacing } from '../theme';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '../types';
import { ArrowLeft } from 'lucide-react-native';

type RootStackParamList = {
    UserList: { type: 'likes' | 'followers' | 'following'; entityId: string; title?: string };
};

type UserListScreenRouteProp = RouteProp<RootStackParamList, 'UserList'>;

export default function UserListScreen() {
    const route = useRoute<UserListScreenRouteProp>();
    const navigation = useNavigation<any>();
    const { type, entityId, title } = route.params;
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            let userIds: string[] = [];

            if (type === 'likes') {
                const postDoc = await getDoc(doc(db, 'posts', entityId));
                if (postDoc.exists()) {
                    userIds = postDoc.data().likes || [];
                }
            } else if (type === 'followers') {
                const userDoc = await getDoc(doc(db, 'users', entityId));
                if (userDoc.exists()) {
                    userIds = userDoc.data().followers || [];
                }
            } else if (type === 'following') {
                const userDoc = await getDoc(doc(db, 'users', entityId));
                if (userDoc.exists()) {
                    userIds = userDoc.data().following || [];
                }
            }

            if (userIds.length > 0) {
                // Fetch user details for each ID
                // Note: In a real app with many users, we should paginate or use 'in' query with batches of 10
                const userPromises = userIds.map(id => getDoc(doc(db, 'users', id)));
                const userSnapshots = await Promise.all(userPromises);
                const fetchedUsers = userSnapshots
                    .filter(snap => snap.exists())
                    .map(snap => snap.data() as User);
                setUsers(fetchedUsers);
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: User }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() => navigation.push('UserProfile', { userId: item.uid })}
        >
            <Image
                source={{ uri: item.photoURL || 'https://via.placeholder.com/50' }}
                style={styles.avatar}
            />
            <Text style={styles.username}>{item.username}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title || type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.uid}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No users found</Text>
                        </View>
                    }
                />
            )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: spacing.m,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: spacing.m,
        backgroundColor: colors.gray,
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        color: colors.textSecondary,
    },
});
