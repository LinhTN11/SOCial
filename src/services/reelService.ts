import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, query, orderBy, limit, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';

export interface Reel {
    id: string;
    videoUrl: string;
    username: string;
    description: string;
    likes: number;
    comments: number;
    userAvatar?: string;
    userId: string;
    contentMode?: 'contain' | 'cover'; // Aspect ratio preference
}


// Seed data - using more reliable video sources
const SEED_REELS = [
    {
        videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        username: 'bunny_lover',
        description: 'Big Buck Bunny tells the story of a giant rabbit with a heart bigger than himself. 🐰',
        likes: 1200,
        comments: 45,
        userAvatar: 'https://i.pravatar.cc/150?img=1',
        userId: 'seed_user_1'
    },
    {
        videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        username: 'dreamer',
        description: 'The first Blender Open Movie from 2006 🎬',
        likes: 850,
        comments: 20,
        userAvatar: 'https://i.pravatar.cc/150?img=2',
        userId: 'seed_user_2'
    },
    {
        videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        username: 'blaze_runner',
        description: 'HBO GO now works with Chromecast 🔥',
        likes: 2100,
        comments: 120,
        userAvatar: 'https://i.pravatar.cc/150?img=3',
        userId: 'seed_user_3'
    },
];

export const getReels = async (): Promise<Reel[]> => {
    try {
        const q = query(collection(db, 'reels'), limit(20));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log('No reels found, seeding...');
            await seedReels();
            return getReels(); // Retry after seeding
        }

        const allReels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reel));

        // Filter out reels with local file paths (invalid URLs)
        const validReels = allReels.filter(reel => {
            const isValid = reel.videoUrl &&
                !reel.videoUrl.startsWith('file://') &&
                (reel.videoUrl.startsWith('http://') || reel.videoUrl.startsWith('https://'));

            if (!isValid) {
                console.warn('Filtering out invalid reel:', reel.id, 'URL:', reel.videoUrl);
            }

            return isValid;
        });

        console.log(`Loaded ${validReels.length} valid reels out of ${allReels.length} total reels`);

        return validReels;
    } catch (error) {
        console.error('Error fetching reels:', error);
        return [];
    }
};

export const seedReels = async () => {
    try {
        const promises = SEED_REELS.map(reel => addDoc(collection(db, 'reels'), reel));
        await Promise.all(promises);
        console.log('Reels seeded successfully');
    } catch (error) {
        console.error('Error seeding reels:', error);
    }
};

// Debug function to clear all reels
export const clearAllReels = async () => {
    try {
        const snapshot = await getDocs(collection(db, 'reels'));
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log('All reels cleared successfully');
    } catch (error) {
        console.error('Error clearing reels:', error);
    }
};

// Delete only invalid reels (with local file paths)
export const deleteInvalidReels = async () => {
    try {
        const snapshot = await getDocs(collection(db, 'reels'));
        const invalidReels = snapshot.docs.filter(doc => {
            const reel = doc.data();
            return !reel.videoUrl ||
                reel.videoUrl.startsWith('file://') ||
                (!reel.videoUrl.startsWith('http://') && !reel.videoUrl.startsWith('https://'));
        });

        const deletePromises = invalidReels.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log(`Deleted ${invalidReels.length} invalid reels`);
        return invalidReels.length;
    } catch (error) {
        console.error('Error deleting invalid reels:', error);
        return 0;
    }
};

// Cloudinary configuration for video upload
const CLOUDINARY_CLOUD_NAME = 'dvzfqk9it';
const CLOUDINARY_VIDEO_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;
const UPLOAD_PRESET = "SOCial"; // Same preset as images

export const uploadVideoToCloudinary = async (uri: string): Promise<string> => {
    try {
        console.log('Starting video upload to Cloudinary...');
        console.log('Video URI:', uri);

        const formData = new FormData();

        // Different handling for web vs mobile
        if (uri.startsWith('blob:') || uri.startsWith('http')) {
            // Web: convert blob to file
            console.log('Web platform detected, converting blob...');
            const response = await fetch(uri);
            const blob = await response.blob();
            formData.append('file', blob, 'upload.mp4');
        } else {
            // Mobile: use file URI directly
            console.log('Mobile platform detected, using file URI...');
            formData.append('file', {
                uri,
                type: 'video/mp4',
                name: 'upload.mp4',
            } as any);
        }

        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('resource_type', 'video');

        console.log('Uploading to:', CLOUDINARY_VIDEO_URL);

        const uploadResponse = await fetch(CLOUDINARY_VIDEO_URL, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
            },
        });

        console.log('Upload response status:', uploadResponse.status);

        const data = await uploadResponse.json();
        console.log('Upload response data:', JSON.stringify(data));

        if (!uploadResponse.ok) {
            console.error('Cloudinary error:', data);
            throw new Error(data.error?.message || `Upload failed with status ${uploadResponse.status}`);
        }

        if (data.secure_url) {
            console.log('Upload successful! URL:', data.secure_url);
            return data.secure_url;
        } else {
            throw new Error('No URL returned from Cloudinary');
        }
    } catch (error) {
        console.error('Error uploading video:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
        }
        throw error;
    }
};

export const uploadReel = async (userId: string, username: string, userAvatar: string | undefined, videoUri: string, description: string, contentMode: 'contain' | 'cover' = 'contain') => {
    try {
        // Upload video to Cloudinary first
        console.log('Uploading video to Cloudinary...');
        const videoUrl = await uploadVideoToCloudinary(videoUri);
        console.log('Video uploaded successfully:', videoUrl);

        const newReel: Omit<Reel, 'id'> = {
            userId,
            username,
            userAvatar,
            videoUrl, // Use the Cloudinary URL, not local URI
            description,
            likes: 0,
            comments: 0,
            contentMode,
        };
        await addDoc(collection(db, 'reels'), newReel);
        console.log('Reel saved to Firestore');
    } catch (error) {
        console.error('Error uploading reel:', error);
        throw error;
    }
};

export const toggleLikeReel = async (reelId: string, isLiked: boolean): Promise<void> => {
    try {
        const reelRef = doc(db, 'reels', reelId);
        const reelSnap = await getDoc(reelRef);

        if (reelSnap.exists()) {
            const currentLikes = reelSnap.data().likes || 0;
            const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;

            await updateDoc(reelRef, {
                likes: Math.max(0, newLikes) // Ensure likes never go below 0
            });

            console.log(`Reel ${reelId} likes updated: ${currentLikes} -> ${newLikes}`);
        }
    } catch (error) {
        console.error('Error toggling like on reel:', error);
        throw error;
    }
};

export const deleteReel = async (reelId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'reels', reelId));
        console.log('Reel deleted successfully');
    } catch (error) {
        console.error('Error deleting reel:', error);
        throw error;
    }
};

// Comment management for reels
export const addReelComment = async (reelId: string, userId: string, username: string, userAvatar: string | undefined, text: string, parentId?: string, replyToUsername?: string) => {
    try {
        const newComment = {
            reelId,
            userId,
            username,
            userAvatar: userAvatar ?? null,
            text,
            createdAt: Date.now(),
            parentId: parentId || null,
            replyToUsername: replyToUsername || null,
        };
        await addDoc(collection(db, 'reels', reelId, 'comments'), newComment);

        // Update comment count
        const reelRef = doc(db, 'reels', reelId);
        const reelSnap = await getDoc(reelRef);
        if (reelSnap.exists()) {
            await updateDoc(reelRef, {
                comments: (reelSnap.data().comments || 0) + 1,
            });
        }
    } catch (error) {
        console.error('Error adding reel comment:', error);
        throw error;
    }
};

// Update a reel comment
export const updateReelComment = async (reelId: string, commentId: string, text: string) => {
    try {
        const commentRef = doc(db, 'reels', reelId, 'comments', commentId);
        await updateDoc(commentRef, {
            text,
            isEdited: true,
        });
    } catch (error) {
        console.error('Error updating reel comment:', error);
        throw error;
    }
};

// Delete a reel comment
export const deleteReelComment = async (reelId: string, commentId: string) => {
    try {
        await deleteDoc(doc(db, 'reels', reelId, 'comments', commentId));

        // Update comment count
        const reelRef = doc(db, 'reels', reelId);
        const reelSnap = await getDoc(reelRef);
        if (reelSnap.exists()) {
            const currentCount = reelSnap.data().comments || 0;
            await updateDoc(reelRef, {
                comments: Math.max(0, currentCount - 1),
            });
        }
    } catch (error) {
        console.error('Error deleting reel comment:', error);
        throw error;
    }
};

export const getReelComments = async (reelId: string) => {
    try {
        const q = query(collection(db, 'reels', reelId, 'comments'), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching reel comments:', error);
        return [];
    }
};

export const getReelCommentCount = async (reelId: string): Promise<number> => {
    try {
        const reelRef = doc(db, 'reels', reelId);
        const reelSnap = await getDoc(reelRef);
        if (reelSnap.exists()) {
            return reelSnap.data().comments || 0;
        }
        return 0;
    } catch (error) {
        console.error('Error getting reel comment count:', error);
        return 0;
    }
};
