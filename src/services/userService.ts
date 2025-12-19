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

// Check if username is available (case-insensitive)
export const checkUsernameAvailability = async (username: string, excludeUserId?: string): Promise<boolean> => {
    try {
        // Note: Firestore queries are case-sensitive. For true case-insensitive uniqueness, 
        // we should store a lowercase version of the username. 
        // For this MVP, we will query exactly as is, but in a real app, use a canonical field.
        const q = query(
            collection(db, 'users'),
            where('username', '==', username),
            limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return true;

        // If found, check if it belongs to the current user (for updates)
        if (excludeUserId) {
            const doc = querySnapshot.docs[0];
            return doc.id === excludeUserId;
        }

        return false;
    } catch (error) {
        console.error('Error checking username availability:', error);
        return false;
    }
};

export const updateUserProfile = async (userId: string, data: { username?: string; bio?: string; photoURL?: string }) => {
    try {
        // 1. Check for duplicates if username is changing
        if (data.username) {
            const isAvailable = await checkUsernameAvailability(data.username, userId);
            if (!isAvailable) {
                throw new Error('Username already taken');
            }
        }

        // 1.5 Fetch current user info BEFORE updating (to get old username for tag updates)
        const currentUserDoc = await getDoc(doc(db, 'users', userId));
        const oldUserData = currentUserDoc.exists() ? currentUserDoc.data() as User : null;
        const oldUsername = oldUserData?.username;

        // 2. Update User Profile
        await updateDoc(doc(db, 'users', userId), data);

        // 3. Update all posts by this user if username or avatar changed
        // (This is a write-heavy operation, ideally done via Cloud Functions)
        if (data.username || data.photoURL) {
            const postsQuery = query(
                collection(db, 'posts'),
                where('userId', '==', userId)
            );
            const postsSnapshot = await getDocs(postsQuery);

            const updatePromises = postsSnapshot.docs.map(postDoc => {
                const updateData: any = {};
                if (data.username) updateData.username = data.username;
                if (data.photoURL) updateData.userAvatar = data.photoURL;
                return updateDoc(doc(db, 'posts', postDoc.id), updateData);
            });

            await Promise.all(updatePromises);

            // Helper to run updates safely without breaking the chain
            const runSafe = async (fn: () => Promise<any>, name: string) => {
                try {
                    await fn();
                } catch (error: any) {
                    console.error(`Error updating ${name}:`, error);
                    // Special handling for the index error to notify user
                    if (error.message && error.message.includes('requires an index')) {
                        console.error('\n\n========== ACTION REQUIRED ==========\n');
                        console.error(`To update ${name}, create an index in Firebase:`);
                        console.error(error.message);
                        console.error('\n=====================================\n\n');
                        // We re-throw specifically for index errors if we want to alert the user
                        // But for now, we'll let other updates proceed. 
                        // Ideally, we'd collect errors and show them at the end.
                        throw new Error(`Database setup required for ${name}. Link in console.`);
                    }
                }
            };

            // 4. Update all comments by this user (Collection Group)
            await runSafe(async () => {
                const { collectionGroup } = await import('firebase/firestore');
                const commentsQuery = query(
                    collectionGroup(db, 'comments'),
                    where('userId', '==', userId)
                );
                const commentsSnapshot = await getDocs(commentsQuery);
                const updates = commentsSnapshot.docs.map(doc => {
                    const u: any = {};
                    if (data.username) u.username = data.username;
                    if (data.photoURL) u.userAvatar = data.photoURL;
                    return updateDoc(doc.ref, u);
                });
                await Promise.all(updates);
            }, 'User Comments');

            // 4b. Update comments replying TO this user (replyToUsername)
            if (data.username && oldUsername && data.username !== oldUsername) {
                await runSafe(async () => {
                    const { collectionGroup } = await import('firebase/firestore');
                    const repliesQuery = query(
                        collectionGroup(db, 'comments'),
                        where('replyToUsername', '==', oldUsername)
                    );
                    const repliesSnapshot = await getDocs(repliesQuery);
                    const updates = repliesSnapshot.docs.map(doc => {
                        return updateDoc(doc.ref, {
                            replyToUsername: data.username
                        });
                    });
                    await Promise.all(updates);
                    console.log(`Updated ${updates.length} replies referencing old username: ${oldUsername}`);
                }, 'Reply Tags');
            }

            // 5. Update Reels
            await runSafe(async () => {
                const reelsQuery = query(
                    collection(db, 'reels'),
                    where('userId', '==', userId)
                );
                const reelsSnap = await getDocs(reelsQuery);
                const updates = reelsSnap.docs.map(doc => {
                    const u: any = {};
                    if (data.username) u.username = data.username;
                    if (data.photoURL) u.userAvatar = data.photoURL;
                    return updateDoc(doc.ref, u);
                });
                await Promise.all(updates);
            }, 'Reels');

            // 6. Update Stories
            await runSafe(async () => {
                const storiesQuery = query(
                    collection(db, 'stories'),
                    where('userId', '==', userId)
                );
                const storiesSnap = await getDocs(storiesQuery);
                const updates = storiesSnap.docs.map(doc => {
                    const u: any = {};
                    if (data.username) u.username = data.username;
                    if (data.photoURL) u.userAvatar = data.photoURL;
                    return updateDoc(doc.ref, u);
                });
                await Promise.all(updates);
            }, 'Stories');

            // 7. Update Sent Notifications
            await runSafe(async () => {
                const notifsQuery = query(
                    collection(db, 'notifications'),
                    where('senderId', '==', userId)
                );
                const notifsSnap = await getDocs(notifsQuery);
                const updates = notifsSnap.docs.map(doc => {
                    const u: any = {};
                    if (data.username) u.senderName = data.username;
                    if (data.photoURL) u.senderAvatar = data.photoURL;
                    return updateDoc(doc.ref, u);
                });
                await Promise.all(updates);
            }, 'Notifications');
        }
    } catch (error) {
        // console.error('Error updating user profile:', error); // Removed logging as handled by UI
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
