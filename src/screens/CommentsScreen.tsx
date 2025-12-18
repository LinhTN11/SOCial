import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image, Alert, Modal, TouchableWithoutFeedback } from 'react-native';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { addComment, getComments, updateComment, deleteComment } from '../services/postService';
import { addReelComment, getReelComments, updateReelComment, deleteReelComment } from '../services/reelService';
import { searchUsers, getUserByUsername } from '../services/userService';
// ... existing imports ...

// ... inside component ...

import { useAuthStore } from '../store/useAuthStore';
import { Send, Edit2, Trash2, X } from 'lucide-react-native';
import { User } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';

type RootStackParamList = {
    Comments: { postId: string; isReel?: boolean };
};

type CommentsScreenRouteProp = RouteProp<RootStackParamList, 'Comments'>;

export default function CommentsScreen() {
    const route = useRoute<CommentsScreenRouteProp>();
    const navigation = useNavigation<any>();
    const { postId, isReel = false } = route.params;
    const { user } = useAuthStore();
    const inputRef = React.useRef<TextInput>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [replyingTo, setReplyingTo] = useState<any | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

    // Action Sheet State
    const [actionSheetVisible, setActionSheetVisible] = useState(false);
    const [selectedCommentForAction, setSelectedCommentForAction] = useState<any | null>(null);

    // Mention states
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentions, setMentions] = useState<{ id: string; username: string }[]>([]);

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

    const handleTextChange = async (inputText: string) => {
        setText(inputText);

        const lastWord = inputText.split(' ').pop();
        if (lastWord && lastWord.startsWith('@')) {
            const query = lastWord.substring(1);
            setMentionQuery(query);
            if (query.length > 0) {
                const users = await searchUsers(query);
                setSuggestions(users.filter(u => u.uid !== user?.uid)); // Exclude self
                setShowSuggestions(users.length > 0);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSelectUser = (selectedUser: User) => {
        const words = text.split(' ');
        words.pop(); // Remove the incomplete @mention
        const newText = `${words.join(' ')} @${selectedUser.username} `;
        setText(newText);
        setSuggestions([]);
        setShowSuggestions(false);

        // Track mentioned user
        if (!mentions.some(m => m.id === selectedUser.uid)) {
            setMentions([...mentions, { id: selectedUser.uid, username: selectedUser.username }]);
        }
    };

    const handleSend = async () => {
        if (!text.trim() || !user) return;
        setLoading(true);
        try {
            if (editingCommentId) {
                // Update existing comment
                if (isReel) {
                    await updateReelComment(postId, editingCommentId, text);
                } else {
                    await updateComment(postId, editingCommentId, text);
                }
                setEditingCommentId(null);
            } else {
                // Create new comment
                const activeMentions = mentions.filter(m => text.includes(`@${m.username}`));
                const mentionIds = activeMentions.map(m => m.id);

                if (isReel) {
                    await addReelComment(postId, user.uid, user.username, user.photoURL, text, replyingTo?.id, replyingTo?.username);
                } else {
                    await addComment(postId, user.uid, user.username, user.photoURL, text, mentionIds, replyingTo?.id, replyingTo?.username);
                }
            }
            setText('');
            setMentions([]);
            setReplyingTo(null);
            fetchComments();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to post comment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLongPress = (comment: any) => {
        if (!user || comment.userId !== user.uid) return;
        setSelectedCommentForAction(comment);
        setActionSheetVisible(true);
    };

    const handleEdit = (comment: any) => {
        setEditingCommentId(comment.id);
        setText(comment.text);
        setReplyingTo(null); // Clear reply if editing
        inputRef.current?.focus();
    };

    const handleDelete = (commentId: string) => {
        Alert.alert(
            'Delete Comment',
            'Are you sure you want to delete this comment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (isReel) {
                                await deleteReelComment(postId, commentId);
                            } else {
                                await deleteComment(postId, commentId);
                            }
                            fetchComments();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to delete comment.');
                        }
                    }
                },
            ]
        );
    };


    const renderActionSheet = () => {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={actionSheetVisible}
                onRequestClose={() => setActionSheetVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setActionSheetVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.actionSheetContainer}>
                            <View style={styles.actionGroup}>
                                <TouchableOpacity
                                    style={[styles.actionButton, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        setActionSheetVisible(false);
                                        if (selectedCommentForAction) handleEdit(selectedCommentForAction);
                                    }}
                                >
                                    <Text style={styles.actionText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => {
                                        setActionSheetVisible(false);
                                        if (selectedCommentForAction) handleDelete(selectedCommentForAction.id);
                                    }}
                                >
                                    <Text style={styles.destructiveText}>Delete</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.cancelGroup}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => setActionSheetVisible(false)}
                                >
                                    <Text style={[styles.actionText, { fontWeight: 'bold' }]}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        );
    };

    const handleTagPress = async (tag: string) => {
        const username = tag.substring(1); // Remove '@'
        const user = await getUserByUsername(username);
        if (user) {
            navigation.navigate('UserProfile', { userId: user.uid });
        } else {
            console.log('User not found');
        }
    };

    const handleProfilePress = (userId: string) => {
        navigation.navigate('UserProfile', { userId });
    };

    const organizeComments = (rawComments: any[]) => {
        const commentMap = new Map();
        const roots: any[] = [];

        // Deep clone to avoid mutating original state directly if needed, 
        // though strictly we are just creating new pointers.
        rawComments.forEach(c => {
            commentMap.set(c.id, { ...c, replies: [] });
        });

        rawComments.forEach(c => {
            if (c.parentId && commentMap.has(c.parentId)) {
                commentMap.get(c.parentId).replies.push(commentMap.get(c.id));
            } else {
                roots.push(commentMap.get(c.id));
            }
        });

        return roots;
    };

    const rootComments = React.useMemo(() => organizeComments(comments), [comments]);

    const toggleExpand = (commentId: string) => {
        const newExpanded = new Set(expandedComments);
        if (newExpanded.has(commentId)) {
            newExpanded.delete(commentId);
        } else {
            newExpanded.add(commentId);
        }
        setExpandedComments(newExpanded);
    };

    const RenderComment = ({ item, depth = 0 }: { item: any, depth?: number }) => {
        const isExpanded = expandedComments.has(item.id);
        const hasReplies = item.replies && item.replies.length > 0;

        return (
            <View>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onLongPress={() => handleLongPress(item)}
                    style={[styles.commentContainer, { marginLeft: depth * 16 }]}
                >
                    <TouchableOpacity onPress={() => handleProfilePress(item.userId)}>
                        <Image
                            source={{ uri: (user && item.userId === user.uid ? user.photoURL : item.userAvatar) || 'https://via.placeholder.com/40' }}
                            style={depth > 0 ? styles.replyAvatar : styles.avatar}
                        />
                    </TouchableOpacity>
                    <View style={styles.commentContent}>
                        <View style={styles.bubble}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                <TouchableOpacity onPress={() => handleProfilePress(item.userId)}>
                                    <Text style={styles.username}>{item.username}</Text>
                                </TouchableOpacity>
                                <Text style={styles.commentText}>
                                    {item.text.split(' ').map((word: string, index: number) => {
                                        if (word.startsWith('@')) {
                                            return (
                                                <Text
                                                    key={index}
                                                    style={{ color: colors.primary, fontWeight: 'bold' }}
                                                    onPress={() => handleTagPress(word)}
                                                >
                                                    {word}{' '}
                                                </Text>
                                            );
                                        }
                                        return <Text key={index}>{word} </Text>;
                                    })}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.actionRow}>
                            <Text style={styles.timeText}>Just now {item.isEdited ? '(edited)' : ''}</Text>
                            <TouchableOpacity onPress={() => {
                                setReplyingTo(item);
                                inputRef.current?.focus();
                            }}>
                                <Text style={styles.replyText}>Reply</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>

                {hasReplies && (
                    <View>
                        {depth === 0 && (
                            <TouchableOpacity onPress={() => toggleExpand(item.id)} style={{ marginLeft: 52, marginBottom: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ height: 1, width: 20, backgroundColor: colors.border, marginRight: 8 }} />
                                    <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                                        {isExpanded ? 'Hide replies' : `View ${item.replies.length} more replies`}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {(isExpanded || depth > 0) && (
                            <View>
                                {item.replies.map((reply: any) => (
                                    <RenderComment key={reply.id} item={reply} depth={depth + 1} />
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <View style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    <View style={{ flex: 1 }}>
                        <FlatList
                            data={rootComments}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => <RenderComment item={item} />}
                            contentContainerStyle={styles.listContent}
                            style={{ flex: 1 }}
                            keyboardShouldPersistTaps="handled"
                        />

                        <View style={styles.footer}>
                            {showSuggestions && (
                                <View style={styles.suggestionsContainer}>
                                    <FlatList
                                        data={suggestions}
                                        keyExtractor={(item) => item.uid}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelectUser(item)}>
                                                <Image source={{ uri: item.photoURL || 'https://via.placeholder.com/30' }} style={styles.suggestionAvatar} />
                                                <View>
                                                    <Text style={styles.suggestionText}>{item.username}</Text>
                                                    <Text style={styles.suggestionSubText}>{item.displayName || 'User'}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        )}
                                        keyboardShouldPersistTaps="handled"
                                        style={styles.suggestionsList}
                                    />
                                </View>
                            )}

                            {(replyingTo || editingCommentId) && (
                                <View style={styles.replyingBar}>
                                    <Text style={{ color: colors.textSecondary }}>
                                        {editingCommentId ? 'Editing comment' : <Text>Replying to <Text style={{ fontWeight: 'bold' }}>{replyingTo?.username}</Text></Text>}
                                    </Text>
                                    <TouchableOpacity onPress={() => {
                                        setReplyingTo(null);
                                        setEditingCommentId(null);
                                        setText('');
                                    }}>
                                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>X</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={styles.inputContainer}>
                                <TextInput
                                    ref={inputRef}
                                    style={styles.input}
                                    placeholder={replyingTo ? `Reply to ${replyingTo.username}...` : "Add a comment... (@ to tag)"}
                                    value={text}
                                    onChangeText={handleTextChange}
                                    placeholderTextColor={colors.gray}
                                />
                                <TouchableOpacity onPress={handleSend} disabled={loading || !text.trim()}>
                                    <Send color={colors.primary} size={24} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
            {renderActionSheet()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    listContent: {
        padding: spacing.m,
        paddingBottom: 20,
    },
    commentContainer: {
        flexDirection: 'row',
        marginBottom: spacing.l,
        alignItems: 'flex-start',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: spacing.m,
        backgroundColor: colors.gray,
    },
    commentContent: {
        flex: 1,
    },
    bubble: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    username: {
        fontWeight: 'bold',
        marginRight: spacing.s,
        fontSize: 14,
        color: colors.text,
    },
    commentText: {
        color: colors.text,
        fontSize: 14,
        lineHeight: 18,
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 4,
        marginLeft: 0,
    },
    timeText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginRight: spacing.m,
        fontWeight: '500',
    },
    replyText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    replyContainer: {
        marginTop: 12,
        marginBottom: 0,
    },
    replyAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: spacing.m,
        backgroundColor: colors.gray,
    },
    footer: {
        backgroundColor: colors.background,
    },
    replyingBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing.s,
        paddingHorizontal: spacing.m,
        backgroundColor: colors.lightGray,
        borderTopWidth: 1,
        borderTopColor: colors.border,
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
        padding: spacing.m, // Increased padding
        backgroundColor: colors.lightGray,
        borderRadius: 24, // Pill shape
        paddingHorizontal: spacing.l,
        fontSize: 15,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    suggestionsContainer: {
        maxHeight: 200,
        backgroundColor: colors.background,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        borderWidth: 1,
        borderColor: colors.border,
        borderBottomWidth: 0,
        // Apple-style shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        marginBottom: -1, // Connect visually with input
    },
    suggestionsList: {
        paddingVertical: spacing.s,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
    },
    suggestionAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: spacing.m,
    },
    suggestionText: {
        fontWeight: '600',
        fontSize: 14,
    },
    suggestionSubText: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    // Action Sheet Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)', // Darker overlay
        justifyContent: 'flex-end',
    },
    actionSheetContainer: {
        padding: spacing.m,
        paddingBottom: Platform.OS === 'ios' ? 40 : spacing.m,
    },
    actionGroup: {
        backgroundColor: 'rgba(255,255,255,0.95)', // Slightly transparent
        borderRadius: 14,
        marginBottom: spacing.m,
        overflow: 'hidden',
    },
    actionHeader: {
        padding: spacing.m,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionHeaderTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 4,
    },
    actionHeaderSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        opacity: 0.8,
    },
    cancelGroup: {
        backgroundColor: 'white',
        borderRadius: 14,
        marginBottom: spacing.s,
    },
    actionButton: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Centered usually looks best for Action Sheets, but icons help
        backgroundColor: 'transparent',
    },
    actionText: {
        fontSize: 17,
        color: colors.text,
        fontWeight: '400',
    },
    destructiveText: {
        fontSize: 17,
        color: colors.error,
        fontWeight: '400',
    },
});
