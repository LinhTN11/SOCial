import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove, getDoc, deleteDoc } from 'firebase/firestore';
import { Post, User } from '../types';
import { sendNotification } from './notificationService';

// Cloudinary configuration - you need to create an upload preset in your Cloudinary dashboard
const CLOUDINARY_CLOUD_NAME = 'dvzfqk9it';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const UPLOAD_PRESET = "SOCial"; // Create this in Cloudinary Settings > Upload > Add upload preset

export const uploadImage = async (uri: string): Promise<string> => {
    try {
        console.log('Starting image upload to Cloudinary...');
        console.log('Image URI:', uri);

        const formData = new FormData();

        // Different handling for web vs mobile
        if (uri.startsWith('blob:') || uri.startsWith('http')) {
            // Web: convert blob to file
            console.log('Web platform detected, converting blob...');
            const response = await fetch(uri);
            const blob = await response.blob();
            formData.append('file', blob, 'upload.jpg');
        } else {
            // Mobile: use file URI directly
            console.log('Mobile platform detected, using file URI...');
            formData.append('file', {
                uri,
                type: 'image/jpeg',
                name: 'upload.jpg',
            } as any);
        }

        formData.append('upload_preset', UPLOAD_PRESET);

        console.log('Uploading to:', CLOUDINARY_URL);

        const uploadResponse = await fetch(CLOUDINARY_URL, {
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
        console.error('Error uploading image:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
        }
        throw error;
    }
};

export const createPost = async (userId: string, username: string, userAvatar: string | undefined, imageUrl: string, caption: string) => {
    try {
        const newPost: Omit<Post, 'id'> = {
            userId,
            username,
            userAvatar: userAvatar ?? undefined,
            imageUrl,
            caption,
            likes: [],
            commentsCount: 0,
            createdAt: Date.now(),
        };
        await addDoc(collection(db, 'posts'), newPost);
    } catch (error) {
        console.error('Error creating post:', error);
        throw error;
    }
};

export const getPosts = async (): Promise<Post[]> => {
    try {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post));
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
};

export const toggleLikePost = async (postId: string, currentUser: User, isLiked: boolean) => {
    try {
        const postRef = doc(db, 'posts', postId);
        if (isLiked) {
            await updateDoc(postRef, {
                likes: arrayRemove(currentUser.uid),
            });
        } else {
            await updateDoc(postRef, {
                likes: arrayUnion(currentUser.uid),
            });

            // Send notification
            const postSnap = await getDoc(postRef);
            if (postSnap.exists()) {
                const postData = postSnap.data() as Post;
                await sendNotification(postData.userId, currentUser.uid, currentUser.username, currentUser.photoURL, 'like', postId);
            }
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        throw error;
    }
};

export const addComment = async (postId: string, userId: string, username: string, userAvatar: string | undefined, text: string) => {
    try {
        const newComment = {
            postId,
            userId,
            username,
            userAvatar: userAvatar ?? null,
            text,
            createdAt: Date.now(),
        };
        await addDoc(collection(db, 'posts', postId, 'comments'), newComment);

        // Update comment count
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
            await updateDoc(postRef, {
                commentsCount: (postSnap.data().commentsCount || 0) + 1,
            });

            // Send notification
            const postData = postSnap.data() as Post;
            await sendNotification(postData.userId, userId, username, userAvatar, 'comment', postId);
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
    }
};

export const getComments = async (postId: string) => {
    try {
        const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching comments:', error);
        return [];
    }
};
export const deletePost = async (postId: string) => {
    try {
        await deleteDoc(doc(db, 'posts', postId));
        // Note: Deleting subcollections (comments) is not automatic in Firestore.
        // For a production app, we'd need a Cloud Function or batch delete.
        // For this MVP, we'll accept that comments might be orphaned or delete them client-side if needed.
        // Let's try to delete comments if possible, but for now just deleting the post doc is the main requirement.
    } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
};

export const toggleSavePost = async (userId: string, postId: string, isSaved: boolean) => {
    try {
        const userRef = doc(db, 'users', userId);
        if (isSaved) {
            await updateDoc(userRef, {
                savedPosts: arrayRemove(postId),
            });
        } else {
            await updateDoc(userRef, {
                savedPosts: arrayUnion(postId),
            });
        }
    } catch (error) {
        console.error('Error toggling save post:', error);
        throw error;
    }
};
