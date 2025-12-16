import * as Device from 'expo-device';
// import * as Notifications from 'expo-notifications'; // Commented out - not needed for Expo Go
import { Platform } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Notification } from '../types';

// Commented out - push notifications don't work in Expo Go
// Notifications.setNotificationHandler({
//     handleNotification: async () => ({
//         shouldShowAlert: true,
//         shouldPlaySound: true,
//         shouldSetBadge: false,
//         shouldShowBanner: true,
//         shouldShowList: true,
//     }),
// });

// Commented out - push notifications don't work in Expo Go
// export async function registerForPushNotificationsAsync() {
//     let token;

//     if (Platform.OS === 'android') {
//         await Notifications.setNotificationChannelAsync('default', {
//             name: 'default',
//             importance: Notifications.AndroidImportance.MAX,
//             vibrationPattern: [0, 250, 250, 250],
//             lightColor: '#FF231F7C',
//         });
//     }

//     if (Device.isDevice) {
//         const { status: existingStatus } = await Notifications.getPermissionsAsync();
//         let finalStatus = existingStatus;
//         if (existingStatus !== 'granted') {
//             const { status } = await Notifications.requestPermissionsAsync();
//             finalStatus = status;
//         }
//         if (finalStatus !== 'granted') {
//             // alert('Failed to get push token for push notification!');
//             return;
//         }
//         try {
//             token = (await Notifications.getExpoPushTokenAsync({
//                 projectId: 'your-project-id', // In a real app, this should be configured
//             })).data;
//         } catch (e) {
//             console.log("Error getting push token", e);
//         }
//         console.log(token);
//     } else {
//         // alert('Must use physical device for Push Notifications');
//     }

//     return token;
// }

// export async function sendPushNotification(expoPushToken: string, title: string, body: string) {
//     const message = {
//         to: expoPushToken,
//         sound: 'default',
//         title: title,
//         body: body,
//         data: { someData: 'goes here' },
//     };

//     await fetch('https://exp.host/--/api/v2/push/send', {
//         method: 'POST',
//         headers: {
//             Accept: 'application/json',
//             'Accept-encoding': 'gzip, deflate',
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(message),
//     });
// }

// Firestore Notification Logic

export const sendNotification = async (
    receiverId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string | undefined,
    type: 'like' | 'comment' | 'follow',
    postId?: string
) => {
    if (receiverId === senderId) return; // Don't notify self

    try {
        const newNotification: Omit<Notification, 'id'> = {
            receiverId,
            senderId,
            senderName,
            senderAvatar,
            type,
            postId,
            read: false,
            createdAt: Date.now(),
        };
        await addDoc(collection(db, 'users', receiverId, 'notifications'), newNotification);
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};

export const getNotifications = async (userId: string): Promise<Notification[]> => {
    try {
        const q = query(
            collection(db, 'users', userId, 'notifications'),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    } catch (error) {
        console.error('Error getting notifications:', error);
        return [];
    }
};

export const markNotificationAsRead = async (userId: string, notificationId: string) => {
    try {
        const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
        await updateDoc(notifRef, {
            read: true
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

export const markAllNotificationsAsRead = async (userId: string) => {
    try {
        const q = query(collection(db, 'users', userId, 'notifications'));
        const querySnapshot = await getDocs(q);

        const updates = querySnapshot.docs.map(docSnapshot =>
            updateDoc(docSnapshot.ref, { read: true })
        );

        await Promise.all(updates);
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
};

// Subscribe to real-time notifications
export const subscribeToNotifications = (
    userId: string,
    callback: (notifications: Notification[]) => void
): (() => void) => {
    // For now, we'll use polling instead of real-time subscriptions
    // In a production app, you'd use onSnapshot from Firestore
    const fetchNotifications = async () => {
        const notifications = await getNotifications(userId);
        callback(notifications);
    };

    // Initial fetch
    fetchNotifications();

    // Poll every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);

    // Return cleanup function
    return () => clearInterval(interval);
};
