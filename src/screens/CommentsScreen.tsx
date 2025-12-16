import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { addComment, getComments } from '../services/postService';
import { addReelComment, getReelComments } from '../services/reelService';
import { useAuthStore } from '../store/useAuthStore';
import { Send } from 'lucide-react-native';

type RootStackParamList = {
    Comments: { postId: string; isReel?: boolean };
};

type CommentsScreenRouteProp = RouteProp<RootStackParamList, 'Comments'>;

export default function CommentsScreen() {
    const route = useRoute<CommentsScreenRouteProp>();
    const { postId, isReel = false } = route.params;
    const { user } = useAuthStore();
    const [comments, setComments] = useState<any[]>([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchComments = async () => {
        if (isReel) {
            const fetchedComments = await getReelComments(postId);
            setComments(fetchedComments);
        } else {
            const fetchedComments = await getComments(postId);
            setComments(fetchedComments);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [postId, isReel]);

    const handleSend = async () => {
        if (!text.trim() || !user) return;
        setLoading(true);
        try {
            if (isReel) {
                await addReelComment(postId, user.uid, user.username, user.photoURL, text);
            } else {
                await addComment(postId, user.uid, user.username, user.photoURL, text);
            }
            setText('');
            fetchComments();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.commentContainer}>
            <Image source={{ uri: item.userAvatar || 'https://via.placeholder.com/40' }} style={styles.avatar} />
            <View style={styles.commentContent}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.commentText}>{item.text}</Text>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior="padding"
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
        >
            <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
            />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Add a comment..."
                    value={text}
                    onChangeText={setText}
                />
                <TouchableOpacity onPress={handleSend} disabled={loading || !text.trim()}>
                    <Send color={colors.primary} size={24} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    listContent: {
        padding: spacing.m,
    },
    commentContainer: {
        flexDirection: 'row',
        marginBottom: spacing.m,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: spacing.s,
        backgroundColor: colors.gray,
    },
    commentContent: {
        flex: 1,
    },
    username: {
        fontWeight: 'bold',
        marginRight: spacing.s,
    },
    commentText: {
        color: colors.text,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
    },
    input: {
        flex: 1,
        marginRight: spacing.m,
        padding: spacing.s,
    },
});
