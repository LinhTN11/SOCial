import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, SafeAreaView } from 'react-native';
import { colors, spacing } from '../theme';
import { type LucideIcon, CheckCircle, XCircle } from 'lucide-react-native';

interface ToastProps {
    message: string;
    type?: 'success' | 'error';
    visible: boolean;
    onDismiss: () => void;
    duration?: number;
    topOffset?: number;
}

export default function Toast({ message, type = 'success', visible, onDismiss, duration = 3000, topOffset }: ToastProps) {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            const timer = setTimeout(() => {
                hide();
            }, duration);

            return () => clearTimeout(timer);
        } else {
            hide();
        }
    }, [visible]);

    const hide = () => {
        Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            if (visible) onDismiss();
        });
    }

    if (!visible) return null;

    const backgroundColor = type === 'success' ? '#10B981' : '#EF4444'; // Green or Red
    const Icon = type === 'success' ? CheckCircle : XCircle;

    return (
        <SafeAreaView style={[styles.container, topOffset !== undefined && { marginTop: topOffset }]} pointerEvents="none">
            <Animated.View style={[styles.toast, { opacity, backgroundColor }]}>
                <Icon color={colors.white} size={20} />
                <Text style={styles.text}>{message}</Text>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999, // Ensure it's above everything
        marginTop: 60, // Top margin
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        borderRadius: 25, // Pill shape
        gap: spacing.s,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    text: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 14,
    }
});
