import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { Story } from '../types';

export const uploadStory = async (userId: string, username: string, userAvatar: string | undefined, localImageUri: string) => {
    try {
        console.log('📸 Uploading story image to cloud...');

        // Upload image to Cloudinary first to get a permanent URL
        const { uploadImage } = await import('./postService_upload_fix');
        const cloudImageUrl = await uploadImage(localImageUri);

        console.log('📸 Story image uploaded:', cloudImageUrl);

        const now = Date.now();
        const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours from now

        const newStory: Omit<Story, 'id'> = {
            userId,
            username,
            userAvatar,
            imageUrl: cloudImageUrl, // Use cloud URL instead of local path
            createdAt: now,
            expiresAt,
            viewed: false,
        };

        await addDoc(collection(db, 'stories'), newStory);
        console.log('✅ Story saved to Firestore');
    } catch (error) {
        console.error('Error uploading story:', error);
        throw error;
    }
};

export const deleteStory = async (storyId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'stories', storyId));
        console.log('Story deleted successfully');
    } catch (error) {
        console.error('Error deleting story:', error);
        throw error;
    }
};

export const getStories = async (followingIds: string[]) => {
    try {
        if (followingIds.length === 0) return [];

        const now = Date.now();
        // Firestore 'in' query supports up to 10 values. For production, we'd need to batch or structure differently.
        // For MVP, we'll just fetch all valid stories and filter client-side or limit followingIds.
        // Let's try to fetch stories where expiresAt > now.

        const q = query(
            collection(db, 'stories'),
            where('expiresAt', '>', now),
            orderBy('expiresAt', 'asc') // Required for inequality filter
        );

        const querySnapshot = await getDocs(q);
        const stories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));

        console.log('🔍 Total active stories in DB:', stories.length);
        console.log('🔍 Following IDs:', followingIds);
        console.log('🔍 Story user IDs:', stories.map(s => s.userId));

        // Filter by followingIds + current user
        // Note: In a real app with many users, this is inefficient. 
        // Better approach: 'Feed' collection or 'StoryFeed' per user.
        const filtered = stories.filter(story => followingIds.includes(story.userId));
        console.log('🔍 Filtered stories count:', filtered.length);

        return filtered;
    } catch (error) {
        console.error('Error fetching stories:', error);
        return [];
    }
};

export const getMyStories = async (userId: string) => {
    try {
        const now = Date.now();
        const q = query(
            collection(db, 'stories'),
            where('userId', '==', userId),
            where('expiresAt', '>', now),
            orderBy('expiresAt', 'asc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
    } catch (error) {
        console.error('Error fetching my stories:', error);
        return [];
    }
};
