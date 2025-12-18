import { db } from '../firebaseConfig';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { User } from '../types';
import { sendNotification } from './notificationService';

export const getUserProfile = async (userId: string): Promise<User | null> => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            return userDoc.data() as User;
        }
        return null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
};

export const followUser = async (currentUserId: string, targetUserId: string) => {
    try {
        // Add targetUserId to currentUser's following
        await updateDoc(doc(db, 'users', currentUserId), {
            following: arrayUnion(targetUserId),
        });

        // Add currentUserId to targetUser's followers
        await updateDoc(doc(db, 'users', targetUserId), {
            followers: arrayUnion(currentUserId),
        });

        // Send notification
        const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
        if (currentUserDoc.exists()) {
            const currentUser = currentUserDoc.data() as User;
            await sendNotification(targetUserId, currentUserId, currentUser.username, currentUser.photoURL, 'follow');
        }
    } catch (error) {
        console.error('Error following user:', error);
        throw error;
    }
};

export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
    try {
        // Remove targetUserId from currentUser's following
        await updateDoc(doc(db, 'users', currentUserId), {
            following: arrayRemove(targetUserId),
        });

        // Remove currentUserId from targetUser's followers
        await updateDoc(doc(db, 'users', targetUserId), {
            followers: arrayRemove(currentUserId),
        });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        throw error;
    }
};

export const updateUserProfile = async (userId: string, data: { username?: string; bio?: string; photoURL?: string }) => {
    try {
        await updateDoc(doc(db, 'users', userId), data);
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
};

export const searchUsers = async (queryText: string): Promise<User[]> => {
    try {
        if (!queryText) return [];
        const q = query(
            collection(db, 'users'),
            where('username', '>=', queryText),
            where('username', '<=', queryText + '\uf8ff')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
    try {
        const q = query(
            collection(db, 'users'),
            where('username', '==', username),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { uid: doc.id, ...doc.data() } as User;
        }
        return null;
    } catch (error) {
        console.error('Error fetching user by username:', error);
        return null;
    }
};
