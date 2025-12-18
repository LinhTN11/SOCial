import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions, ActivityIndicator, RefreshControl, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { colors, spacing } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { Post, User } from '../types';
import { followUser, getUserProfile, unfollowUser } from '../services/userService';
import { createChatRoom } from '../services/chatService';
import { ArrowLeft, LogOut, Menu, ChevronDown } from 'lucide-react-native';
import Skeleton from '../components/Skeleton';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const TILE_SIZE = width / NUM_COLUMNS;

type RootStackParamList = {
  Profile: { userId?: string };
};

type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const route = useRoute<ProfileScreenRouteProp>();
  const navigation = useNavigation<any>();
  const { user: currentUser, logout, setUser: setAuthUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const userId = route.params?.userId || currentUser?.uid;
  const isOwnProfile = userId === currentUser?.uid;

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);

    // Fetch User Profile
    if (isOwnProfile) {
      setUser(currentUser);
    } else {
      const fetchedUser = await getUserProfile(userId);
      setUser(fetchedUser);
    }

    // Fetch User Posts
    try {
      const q = query(
        collection(db, 'posts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      setPosts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }

    // Fetch Saved Posts (only for own profile)
    if (isOwnProfile && currentUser?.savedPosts && currentUser.savedPosts.length > 0) {
      try {
        const savedPostsData: Post[] = [];
        for (const postId of currentUser.savedPosts) {
          const postDoc = await getDoc(doc(db, 'posts', postId));
          if (postDoc.exists()) {
            savedPostsData.push({ id: postDoc.id, ...postDoc.data() } as Post);
          }
        }
        setSavedPosts(savedPostsData);
      } catch (error) {
        console.error('Error fetching saved posts:', error);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [userId, currentUser, isOwnProfile]);

  // Refresh when screen comes back into focus (e.g., after saving a post)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    loadData();
  };

  useEffect(() => {
    if (currentUser && user) {
      setIsFollowing(currentUser.following.includes(user.uid));
    }
  }, [currentUser, user]);

  const handleFollowToggle = async () => {
    if (!currentUser || !user) return;

    // Optimistic update
    setIsFollowing(!isFollowing);

    try {
      if (isFollowing) {
        await unfollowUser(currentUser.uid, user.uid);
      } else {
        await followUser(currentUser.uid, user.uid);
      }
    } catch (error) {
      setIsFollowing(isFollowing); // Revert
      console.error(error);
    }
  };

  const handleMessage = async () => {
    if (!currentUser || !user) return;
    try {
      const roomId = await createChatRoom(currentUser.uid, user.uid);
      navigation.navigate('ChatRoom', { roomId, title: user.username });
    } catch (error) {
      console.error('Error creating chat room:', error);
    }
  };

  const handleAccountMenu = () => {
    setShowAccountMenu(true);
  };

  const handleLogout = async () => {
    setShowAccountMenu(false);
    try {
      await signOut(auth);
      setAuthUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.background,
    },
    header: {
      padding: spacing.m,
    },
    backButton: {
      marginBottom: spacing.m,
    },
    logoutButton: {
      position: 'absolute' as const,
      right: spacing.m,
      top: spacing.m,
      zIndex: 1,
    },
    profileInfo: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.l, // More space
    },
    avatar: {
      width: 86, // Slightly larger
      height: 86,
      borderRadius: 43,
      marginRight: spacing.l,
      backgroundColor: colors.gray,
      borderWidth: 1, // Subtle border
      borderColor: colors.border,
    },
    stats: {
      flex: 1,
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
    },
    statItem: {
      alignItems: 'center' as const,
    },
    statValue: {
      fontWeight: 'bold' as const,
      fontSize: 18,
      color: colors.text,
      marginBottom: 2,
    },
    statLabel: {
      color: colors.textSecondary, // Softer label
      fontSize: 13,
    },
    usernameContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 4,
    },
    username: {
      fontWeight: 'bold' as const,
      fontSize: 18,
      color: colors.text,
    },
    bio: {
      color: colors.text,
      marginBottom: spacing.l,
      fontSize: 14,
      lineHeight: 20,
    },
    editButton: {
      backgroundColor: colors.gray, // Use surface/gray background
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8, // Rounded
      paddingVertical: 6,
      width: '100%',
      alignItems: 'center' as const,
      marginBottom: spacing.m,
    },
    editButtonText: {
      fontWeight: '600' as const,
      color: colors.text,
      fontSize: 14,
    },
    actionButtons: {
      flexDirection: 'row' as const,
      gap: spacing.s,
      marginBottom: spacing.m,
    },
    followButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 8,
      alignItems: 'center' as const,
    },
    followingButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    followButtonText: {
      fontWeight: '600' as const,
      color: colors.white,
    },
    followingButtonText: {
      color: colors.text,
    },
    messageButton: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 8,
      alignItems: 'center' as const,
    },
    messageButtonText: {
      fontWeight: '600' as const,
      color: colors.text,
    },
    tabContainer: {
      flexDirection: 'row' as const,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.m,
      alignItems: 'center' as const,
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: colors.text,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.text,
    },
    postsGrid: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    postTile: {
      width: TILE_SIZE,
      height: TILE_SIZE,
      borderWidth: 1,
      borderColor: colors.background,
    },
    postImage: {
      width: '100%',
      height: '100%',
    },
    // Apple-style Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'transparent',
      justifyContent: 'flex-end' as const,
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 34,
      paddingTop: spacing.m,
      paddingHorizontal: spacing.m,
      // Shadow for iOS
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      // Shadow for Android
      elevation: 15,
    },
    modalHeader: {
      paddingVertical: spacing.m,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      alignItems: 'center' as const,
    },
    modalUsername: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.textSecondary,
    },
    logoutOption: {
      paddingVertical: 18,
      alignItems: 'center' as const,
    },
    logoutText: {
      fontSize: 16,
      color: colors.error,
      fontWeight: '400' as const,
    },
    cancelButton: {
      marginTop: 8,
      paddingVertical: 18,
      backgroundColor: colors.lightGray,
      borderRadius: 14,
      alignItems: 'center' as const,
    },
    cancelText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.primary,
    },
  }), [colors]);

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postTile}
      onPress={() => navigation.navigate('PostDetail', { post: item })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
    </TouchableOpacity>
  );

  if (loading && !user) { // Only show full screen loader if user data is missing
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <Skeleton width={80} height={80} borderRadius={40} style={{ marginRight: spacing.l }} />
            <View style={styles.stats}>
              <View style={styles.statItem}><Skeleton width={30} height={20} /><Text style={styles.statLabel}>Posts</Text></View>
              <View style={styles.statItem}><Skeleton width={30} height={20} /><Text style={styles.statLabel}>Followers</Text></View>
              <View style={styles.statItem}><Skeleton width={30} height={20} /><Text style={styles.statLabel}>Following</Text></View>
            </View>
          </View>
          <Skeleton width={150} height={20} style={{ marginBottom: spacing.s }} />
          <Skeleton width={250} height={16} style={{ marginBottom: spacing.m }} />
          <View style={styles.actionButtons}>
            <Skeleton style={{ flex: 1, height: 40, marginRight: spacing.s }} />
            <Skeleton style={{ flex: 1, height: 40 }} />
          </View>
        </View>
        <View style={styles.postsGrid}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} width={TILE_SIZE} height={TILE_SIZE} style={{ borderWidth: 1, borderColor: colors.background }} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {!isOwnProfile && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
        )}
        <View style={styles.profileInfo}>
          <Image
            source={{ uri: (isOwnProfile ? currentUser?.photoURL : user?.photoURL) || 'https://via.placeholder.com/80' }}
            style={styles.avatar}
          />
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('UserList', { type: 'followers', entityId: isOwnProfile ? currentUser?.uid : user?.uid, title: 'Followers' })}>
              <Text style={styles.statValue}>{(isOwnProfile ? currentUser?.followers?.length : user?.followers?.length) || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('UserList', { type: 'following', entityId: isOwnProfile ? currentUser?.uid : user?.uid, title: 'Following' })}>
              <Text style={styles.statValue}>{(isOwnProfile ? currentUser?.following?.length : user?.following?.length) || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isOwnProfile ? (
          <TouchableOpacity onPress={handleAccountMenu} style={styles.usernameContainer}>
            <Text style={styles.username}>{currentUser?.username}</Text>
            <ChevronDown color={colors.text} size={16} strokeWidth={2.5} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ) : (
          <Text style={styles.username}>{user?.username}</Text>
        )}
        <Text style={styles.bio}>{(isOwnProfile ? currentUser?.bio : user?.bio) || 'No bio yet'}</Text>

        {isOwnProfile ? (
          <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={handleFollowToggle}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isOwnProfile && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
            onPress={() => setActiveTab('saved')}
          >
            <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>
              Saved
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={activeTab === 'posts' ? posts : savedPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPostItem}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.postsGrid}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      />

      {/* Apple-style Account Menu Modal */}
      <Modal
        visible={showAccountMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAccountMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAccountMenu(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalUsername}>{user?.username}</Text>
            </View>

            <TouchableOpacity
              style={styles.logoutOption}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAccountMenu(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
