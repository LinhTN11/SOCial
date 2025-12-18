import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Platform } from 'react-native';
import { colors, spacing } from '../theme';
import { LucideIcon } from 'lucide-react-native';

export interface ActionItem {
    label: string;
    onPress: () => void;
    isDestructive?: boolean;
    icon?: LucideIcon;
}

interface ActionSheetProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    actions: ActionItem[];
}

export default function ActionSheet({ visible, onClose, title, description, actions }: ActionSheetProps) {
    if (!visible) return null;

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <View style={styles.sheetContainer}>
                        <View style={styles.actionGroup}>
                            {(title || description) && (
                                <View style={styles.header}>
                                    {title && <Text style={styles.headerTitle}>{title}</Text>}
                                    {description && <Text style={styles.headerSubtitle}>{description}</Text>}
                                </View>
                            )}

                            {actions.map((action, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.actionButton,
                                        index > 0 && styles.separator,
                                        (index === 0 && !title && !description) && styles.firstButton
                                    ]}
                                    onPress={() => {
                                        onClose();
                                        action.onPress();
                                    }}
                                >
                                    {action.icon && (
                                        <action.icon
                                            size={20}
                                            color={action.isDestructive ? colors.error : colors.text}
                                            style={styles.icon}
                                        />
                                    )}
                                    <Text style={[
                                        styles.actionText,
                                        action.isDestructive && styles.destructiveText
                                    ]}>
                                        {action.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    sheetContainer: {
        padding: spacing.m,
        paddingBottom: Platform.OS === 'ios' ? 34 : spacing.m,
    },
    actionGroup: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Explicitly use semi-transparent white for glass effect
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: spacing.m,
        // Glassmorphism effect simulation
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    header: {
        padding: spacing.m,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly translucent
    },
    headerTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Apple style centers text usually, but icon makes it weird. Let's try standard list item style if icon present
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
    },
    firstButton: {
        // specific style if it's the first item without header (no extra border)
    },
    separator: {
        borderTopWidth: 0.5,
        borderTopColor: colors.border,
    },
    icon: {
        position: 'absolute',
        left: 16,
    },
    actionText: {
        fontSize: 17,
        color: colors.primary,
        fontWeight: '400',
    },
    destructiveText: {
        color: colors.error,
    },
    cancelButton: {
        backgroundColor: colors.white,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        // Shadow for cancel button too
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    cancelText: {
        fontSize: 17,
        fontWeight: '600',
        color: colors.primary, // Or specific cancel color
    },
});
