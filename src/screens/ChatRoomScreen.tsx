import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { colors, spacing } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { sendMessage, subscribeToMessages, markMessagesAsSeen } from '../services/chatService';
import { getUserProfile } from '../services/userService';
import { Message } from '../types';
import { Send, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

type RootStackParamList = {
    ChatRoom: { roomId: string; title: string; otherUserId: string; otherUserAvatar?: string };
};

type ChatRoomScreenRouteProp = RouteProp<RootStackParamList, 'ChatRoom'>;

export default function ChatRoomScreen() {
    const route = useRoute<ChatRoomScreenRouteProp>();
    const navigation = useNavigation();
    const { roomId, title, otherUserId } = route.params;
    const { user } = useAuthStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const [otherUserAvatar, setOtherUserAvatar] = useState<string | undefined>(undefined);
    const flatListRef = useRef<FlatList>(null);

    // Fetch other user's profile for avatar
    useEffect(() => {
        const fetchOtherUser = async () => {
            const profile = await getUserProfile(otherUserId);
            if (profile?.photoURL) {
                setOtherUserAvatar(profile.photoURL);
            }
        };
        fetchOtherUser();
    }, [otherUserId]);

    // Set custom header with avatar
    useEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: -15 }}>
                    {otherUserAvatar && (
                        <Image
                            source={{ uri: otherUserAvatar }}
                            style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10 }}
                        />
                    )}
                    <Text style={{ fontSize: 17, fontWeight: '600', color: '#000' }}>{title}</Text>
                </View>
            ),
            headerTitleAlign: 'left',
        });
    }, [navigation, title, otherUserAvatar]);

    useEffect(() => {
        const unsubscribe = subscribeToMessages(roomId, (fetchedMessages) => {
            setMessages(fetchedMessages);
            if (user) {
                markMessagesAsSeen(roomId, user.uid);
            }
        });
        return () => unsubscribe();
    }, [roomId, user]);

    const handleSend = async () => {
        if ((!text.trim()) || !user) return;
        try {
            await sendMessage(roomId, user.uid, text.trim(), otherUserId);
            setText('');
        } catch (error) {
            console.error(error);
        }
    };

    const handlePickImage = async () => {
        if (!user) return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            try {
                // In a real app, upload to storage first.
                await sendMessage(roomId, user.uid, '', otherUserId, result.assets[0].uri);
            } catch (error) {
                console.error('Error sending image:', error);
            }
        }
    };

    const renderItem = ({ item }: { item: Message }) => {
        const isMe = item.senderId === user?.uid;
        return (
            <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.theirMessageRow]}>
                {item.imageUrl && (
                    <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
                )}
                {item.text ? (
                    <View style={[styles.textBubble, isMe ? styles.myTextBubble : styles.theirTextBubble]}>
                        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                            {item.text}
                        </Text>
                    </View>
                ) : null}
                <View style={styles.messageFooter}>
                    <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.theirTimestamp]}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {isMe && (
                        <Text style={[styles.seenText, styles.myTimestamp]}>
                            {item.status === 'seen' ? ' • Seen' : item.status === 'delivered' ? ' • Delivered' : ' • Sent'}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    inverted
                    contentContainerStyle={styles.listContent}
                />
                <View style={styles.inputContainer}>
                    <TouchableOpacity onPress={handlePickImage} style={styles.iconButton}>
                        <ImageIcon color={colors.textSecondary} size={24} />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder="Message..."
                        placeholderTextColor={colors.textSecondary}
                        value={text}
                        onChangeText={setText}
                        multiline
                    />
                    <TouchableOpacity onPress={handleSend} disabled={!text.trim()}>
                        <Send color={colors.primary} size={24} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
    },
    messageRow: {
        maxWidth: '80%',
        marginBottom: spacing.s,
    },
    myMessageRow: {
        alignSelf: 'flex-end',
    },
    theirMessageRow: {
        alignSelf: 'flex-start',
    },
    textBubble: {
        padding: spacing.m,
        borderRadius: 16,
        marginBottom: 4,
    },
    myTextBubble: {
        backgroundColor: colors.primary,
    },
    theirTextBubble: {
        backgroundColor: colors.gray,
    },
    messageText: {
        fontSize: 16,
    },
    myMessageText: {
        color: colors.white,
    },
    theirMessageText: {
        color: colors.text,
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
        marginBottom: 4,
    },
    messageFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    timestamp: {
        fontSize: 10,
    },
    seenText: {
        fontSize: 10,
        marginLeft: 4,
    },
    myTimestamp: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    theirTimestamp: {
        color: colors.textSecondary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
    },
    iconButton: {
        marginRight: spacing.s,
    },
    input: {
        flex: 1,
        marginRight: spacing.m,
        padding: spacing.s,
        backgroundColor: colors.gray,
        borderRadius: 20,
        color: colors.text,
        maxHeight: 100,
    },
});
