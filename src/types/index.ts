export interface Story {
    id: string;
    userId: string;
    username: string;
    userAvatar?: string;
    imageUrl: string;
    createdAt: number;
    expiresAt: number;
    viewed?: boolean;
}

export interface User {
    uid: string;
    email: string;
    username: string;
    displayName?: string;
    photoURL?: string;
    bio?: string;
    followers: string[];
    following: string[];
    savedPosts?: string[];
    pushToken?: string;
    createdAt: number;
}

export interface Post {
    id: string;
    userId: string;
    username: string;
    userAvatar?: string;
    imageUrl: string;
    caption: string;
    likes: string[]; // Array of user IDs
    commentsCount: number;
    createdAt: number;
}

export interface Comment {
    id: string;
    postId: string;
    userId: string;
    username: string;
    userAvatar?: string;
    text: string;
    createdAt: number;
    parentId?: string;
    replyToUsername?: string;
    replies?: Comment[];
}

export interface ChatRoom {
    id: string;
    participants: string[]; // Array of user IDs
    lastMessage?: string;
    lastMessageTimestamp?: number;
    unreadCount?: Record<string, number>; // Map userId to unread count
}

export interface Message {
    id: string;
    roomId: string;
    senderId: string;
    text: string;
    imageUrl?: string;
    createdAt: number;
    status: 'sent' | 'delivered' | 'seen';
}

export interface Notification {
    id: string;
    receiverId: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    type: 'like' | 'comment' | 'follow' | 'mention';
    postId?: string;
    read: boolean;
    createdAt: number;
}
