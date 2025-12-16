import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, StyleSheet, Dimensions, ViewToken, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import ReelItem from '../components/ReelItem';
import { getReels, Reel } from '../services/reelService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Camera } from 'lucide-react-native';

const { height } = Dimensions.get('window');

export default function ReelsScreen() {
    const navigation = useNavigation<any>();
    const [reels, setReels] = useState<Reel[]>([]);
    const [activeReelId, setActiveReelId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Reload reels whenever screen is focused
    useFocusEffect(
        React.useCallback(() => {
            loadReels();
        }, [])
    );

    const loadReels = async () => {
        const fetchedReels = await getReels();
        setReels(fetchedReels);
        if (fetchedReels.length > 0) {
            setActiveReelId(fetchedReels[0].id);
        }
        setLoading(false);
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            setActiveReelId(viewableItems[0].item.id);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const handleCommentPress = (reelId: string) => {
        navigation.navigate('Comments', { postId: reelId, isReel: true });
    };

    const handleDelete = async (reelId: string) => {
        try {
            const { deleteReel } = await import('../services/reelService');
            await deleteReel(reelId);
            // Reload reels after delete
            loadReels();
        } catch (error) {
            console.error('Error deleting reel:', error);
            alert('Failed to delete reel. Please try again.');
        }
    };

    const handleClearAllReels = async () => {
        const { Alert } = await import('react-native');
        Alert.alert(
            "Clear All Reels",
            "This will delete all reels and reseed with sample videos. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear & Reseed",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const { clearAllReels, seedReels } = await import('../services/reelService');
                            await clearAllReels();
                            await seedReels();
                            await loadReels();
                            Alert.alert("Success", "Reels cleared and reseeded!");
                        } catch (error) {
                            console.error('Error clearing reels:', error);
                            Alert.alert("Error", "Failed to clear reels");
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteInvalidReels = async () => {
        const { Alert } = await import('react-native');
        try {
            setLoading(true);
            const { deleteInvalidReels } = await import('../services/reelService');
            const deletedCount = await deleteInvalidReels();
            await loadReels();
            Alert.alert("Success", `Deleted ${deletedCount} invalid reel(s)`);
        } catch (error) {
            console.error('Error deleting invalid reels:', error);
            Alert.alert("Error", "Failed to delete invalid reels");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.white} />
            </View>
        );
    }

    return (
        <View style={styles.outerContainer}>
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Reels</Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('CreateReel')}
                        onLongPress={handleDeleteInvalidReels}
                    >
                        <Camera color={colors.white} size={28} />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={reels}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ReelItem
                            item={item}
                            isActive={item.id === activeReelId}
                            onCommentPress={() => handleCommentPress(item.id)}
                            onDelete={handleDelete}
                        />
                    )}
                    pagingEnabled
                    showsVerticalScrollIndicator={false}
                    snapToInterval={height}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                />
            </SafeAreaView>
        </View >
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: colors.background, // White for safe area
    },
    container: {
        flex: 1,
        backgroundColor: 'black', // Black for video content
    },
    header: {
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    headerTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
    },
});
