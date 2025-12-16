import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import { useAuthStore } from '../store/useAuthStore';
import { colors } from '../theme';
import CommentsScreen from '../screens/CommentsScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import StoryViewerScreen from '../screens/StoryViewerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CreateReelScreen from '../screens/CreateReelScreen';
import UserListScreen from '../screens/UserListScreen';
import ActivityScreen from '../screens/ActivityScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {isAuthenticated ? (
                    <>
                        <Stack.Screen name="App" component={AppTabs} />
                        <Stack.Screen name="Comments" component={CommentsScreen} options={{ headerShown: true, title: 'Comments' }} />
                        <Stack.Screen name="ChatList" component={ChatListScreen} options={{ headerShown: true, title: 'Messages' }} />
                        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ headerShown: true, title: 'Chat' }} />
                        <Stack.Screen name="UserProfile" component={ProfileScreen} options={{ headerShown: false, title: 'Profile' }} />
                        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ headerShown: true, title: 'Post' }} />
                        <Stack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Settings' }} />
                        <Stack.Screen name="CreateReel" component={CreateReelScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="UserList" component={UserListScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Activity" component={ActivityScreen} options={{ headerShown: false }} />
                    </>
                ) : (
                    <Stack.Screen name="Auth" component={AuthStack} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
