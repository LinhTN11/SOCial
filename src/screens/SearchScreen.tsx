import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { colors, spacing } from '../theme';
import { db } from '../firebaseConfig';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { User, Post } from '../types';
import { useNavigation } from '@react-navigation/native';
import { getPosts } from '../services/postService';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const TILE_SIZE = width / NUM_COLUMNS;

export default function SearchScreen() {
    const navigation = useNavigation<any>();
    const [searchText, setSearchText] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [explorePosts, setExplorePosts] = useState<Post[]>([]);
    const searchRef = useRef(''); // Track latest search text

    useEffect(() => {
        loadExplorePosts();
    }, []);

    const loadExplorePosts = async () => {
        try {
            const posts = await getPosts();
            setExplorePosts(posts);
        } catch (error) {
            console.error('Error loading explore posts:', error);
        }
    };

    // Debounced search to prevent race conditions
    useEffect(() => {
        if (searchText.length === 0) {
            setUsers([]);
            return;
        }

        const timeoutId = setTimeout(() => {
            performSearch(searchText);
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchText]);

    const performSearch = async (text: string) => {
        try {
            const q = query(
                collection(db, 'users'),
                limit(100)
            );
            const querySnapshot = await getDocs(q);
            const allUsers = querySnapshot.docs.map(doc => doc.data() as User);

            const searchLower = text.toLowerCase();
            const filtered = allUsers.filter(user =>
                (user.username && user.username.toLowerCase().includes(searchLower)) ||
                (user.email && user.email.toLowerCase().includes(searchLower))
            );

            // Only update if this is still the current search
            if (searchRef.current === text) {
                setUsers(filtered);
            }
        } catch (error) {
            console.error('Error searching users:', error);
            if (searchRef.current === text) {
                setUsers([]);
            }
        }
    };

    const handleSearch = (text: string) => {
        setSearchText(text);
        searchRef.current = text; // Update ref immediately
    };

    const renderUserItem = ({ item }: { item: User }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() => navigation.navigate('UserProfile', { userId: item.uid })}
        >
            <Image
                source={{ uri: item.photoURL || 'https://via.placeholder.com/40' }}
                style={styles.avatar}
            />
            <Text style={styles.username}>{item.username}</Text>
        </TouchableOpacity>
    );

    const renderExploreItem = ({ item }: { item: Post }) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('PostDetail', { postId: item.id, post: item })}
        >
            <Image
                source={{ uri: item.imageUrl }}
                style={{ width: TILE_SIZE, height: TILE_SIZE, borderWidth: 1, borderColor: colors.background }}
            />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search users..."
                    value={searchText}
                    onChangeText={handleSearch}
                    autoCapitalize="none"
                />
            </View>

            {searchText.length > 0 ? (
                <FlatList
                    key="users-list"
                    data={users}
                    keyExtractor={(item, index) => item.uid || `user-${index}`}
                    renderItem={renderUserItem}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No users found</Text>
                    }
                />
            ) : (
                <FlatList
                    key="explore-grid"
                    data={explorePosts}
                    keyExtractor={(item, index) => item.id || `post-${index}`}
                    renderItem={renderExploreItem}
                    numColumns={NUM_COLUMNS}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No posts to explore</Text>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: 50,
    },
    searchContainer: {
        padding: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    searchInput: {
        backgroundColor: colors.gray,
        padding: spacing.s,
        borderRadius: 8,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: spacing.m,
        backgroundColor: colors.gray,
    },
    username: {
        fontWeight: 'bold',
        color: colors.text,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        marginTop: spacing.xl,
    },
});
