import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, PlusSquare, Clapperboard, User } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import ReelsScreen from '../screens/ReelsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme';
import { Image, StyleSheet, View } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
// Reanimated removed for Expo Go compatibility
// import Animated from 'react-native-reanimated';

export type AppTabParamList = {
    Home: undefined;
    Search: undefined;
    Create: undefined;
    Reels: undefined;
    Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

const TabIcon = ({ focused, children }: { focused: boolean; children: React.ReactNode }) => {
    return (
        <View style={{ opacity: focused ? 1 : 0.6 }}>
            {children}
        </View>
    );
};

export default function AppTabs() {
    const { user } = useAuthStore();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: colors.background,
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowOpacity: 0,
                }
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabIcon focused={focused}>
                            <Home color={color} size={size} />
                        </TabIcon>
                    ),
                }}
            />
            <Tab.Screen
                name="Search"
                component={SearchScreen}
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabIcon focused={focused}>
                            <Search color={color} size={size} />
                        </TabIcon>
                    ),
                }}
            />
            <Tab.Screen
                name="Create"
                component={CreatePostScreen}
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabIcon focused={focused}>
                            <PlusSquare color={color} size={size} />
                        </TabIcon>
                    ),
                }}
            />
            <Tab.Screen
                name="Reels"
                component={ReelsScreen}
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabIcon focused={focused}>
                            <Clapperboard color={color} size={size} />
                        </TabIcon>
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabIcon focused={focused}>
                            {user?.photoURL ? (
                                <Image
                                    source={{ uri: user.photoURL }}
                                    style={[styles.avatar, { borderColor: color === colors.primary ? colors.primary : 'transparent' }]}
                                />
                            ) : (
                                <User color={color} size={size} />
                            )}
                        </TabIcon>
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
    }
});
