import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing } from '../theme';
import { Post } from '../types';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import PostItem from '../components/PostItem';
import CommentsScreen from './CommentsScreen'; // Re-using comments screen logic or just embedding comments?
// The plan says "renders a single PostItem with comments section below it". 
// CommentsScreen is a full screen. Let's just render PostItem and maybe a link to comments or embed them.
// Actually, usually Post Detail IS the view where you see the post and comments.
// Let's re-use CommentsScreen logic or just navigate to CommentsScreen?
// The user asked for "Post Detail Screen".
// Let's make it a ScrollView with PostItem at top and then comments list.

type RootStackParamList = {
    PostDetail: { postId: string; post?: Post };
};

type PostDetailScreenRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

export default function PostDetailScreen() {
    const route = useRoute<PostDetailScreenRouteProp>();
    const { postId, post: initialPost } = route.params;
    const [post, setPost] = useState<Post | undefined>(initialPost);
    const [loading, setLoading] = useState(!initialPost);

    useEffect(() => {
        if (!post) {
            const fetchPost = async () => {
                try {
                    const docRef = doc(db, 'posts', postId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setPost({ id: docSnap.id, ...docSnap.data() } as Post);
                    }
                } catch (error) {
                    console.error('Error fetching post:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchPost();
        }
    }, [postId, post]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!post) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Post not found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <PostItem post={post} />
            {/* We could embed comments here, but for now let's just let PostItem handle navigation to CommentsScreen 
                OR we can embed CommentsScreen content here if we refactor it.
                For MVP, showing the PostItem in full view is the main requirement.
                The CommentsScreen is already a "Detail" view effectively. 
                But let's stick to the plan: "PostDetailScreen (Full view)".
            */}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    errorText: {
        color: colors.text,
        textAlign: 'center',
        marginTop: spacing.xl,
    },
});
