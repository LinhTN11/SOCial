import React, { useState, useRef, useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, PanResponder, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../theme';
import * as ImageManipulator from 'expo-image-manipulator';
import { Check, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface ImageCropperProps {
    imageUri: string;
    onCrop: (uri: string) => void;
    onCancel: () => void;
    visible: boolean;
}

export default function ImageCropper({ imageUri, onCrop, onCancel, visible }: ImageCropperProps) {
    const [imageLayout, setImageLayout] = useState<{ width: number; height: number, x: number, y: number } | null>(null);
    const [originalSize, setOriginalSize] = useState<{ width: number; height: number } | null>(null);

    // Crop box state (relative to screen/container)
    const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 200, height: 200 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (imageUri) {
            Image.getSize(imageUri, (w, h) => {
                setOriginalSize({ width: w, height: h });
            });
        }
    }, [imageUri]);

    // Simple pan responder for dragging the whole box
    // Sync ref for access in responders
    const cropBoxRef = useRef(cropBox);
    useEffect(() => { cropBoxRef.current = cropBox; }, [cropBox]);

    // Store initial state when gesture starts
    const startBoxRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

    // Simple pan responder for dragging the whole box
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                startBoxRef.current = { ...cropBoxRef.current };
            },
            onPanResponderMove: (_, gestureState) => {
                setCropBox(prev => ({
                    ...prev,
                    x: startBoxRef.current.x + gestureState.dx,
                    y: startBoxRef.current.y + gestureState.dy
                }));
            },
            onPanResponderRelease: () => { }
        })
    ).current;

    const handleResize = (handle: string, dx: number, dy: number) => {
        const { x, y, width, height } = startBoxRef.current;

        let newX = x;
        let newY = y;
        let newW = width;
        let newH = height;
        const minSize = 50;

        // Delta adjustments
        if (handle.includes('L')) {
            // Dragging Left: x changes, width changes (inverse)
            // But we must check min width
            if (width - dx >= minSize) {
                newX = x + dx;
                newW = width - dx;
            }
        } else if (handle.includes('R')) {
            // Dragging Right: width changes
            if (width + dx >= minSize) {
                newW = width + dx;
            }
        }

        if (handle.includes('T')) {
            // Dragging Top: y changes, height changes (inverse)
            if (height - dy >= minSize) {
                newY = y + dy;
                newH = height - dy;
            }
        } else if (handle.includes('B')) {
            // Dragging Bottom: height changes
            if (height + dy >= minSize) {
                newH = height + dy;
            }
        }

        setCropBox({ x: newX, y: newY, width: newW, height: newH });
    };

    const createResponder = (handle: string) => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
            startBoxRef.current = { ...cropBoxRef.current };
        },
        onPanResponderMove: (_, gestureState) => {
            handleResize(handle, gestureState.dx, gestureState.dy);
        },
        onPanResponderRelease: () => { }
    });

    const responders = useRef({
        TL: createResponder('TL'),
        TR: createResponder('TR'),
        BL: createResponder('BL'),
        BR: createResponder('BR'),
        T: createResponder('T'),
        B: createResponder('B'),
        L: createResponder('L'),
        R: createResponder('R'),
    }).current;

    const handleCrop = async () => {
        if (!imageLayout || !originalSize) return;

        setLoading(true);
        try {
            // Calculate scale
            // Image is usually fitted 'contain' in the view.
            // We need to know EXACTLY where the image is rendered.
            // For simplicity, we assume the CropBox is visually aligned by user.

            // Re-calculate coordinates relative to image frame
            // Box X relative to Image X
            const relativeX = cropBox.x - imageLayout.x;
            const relativeY = cropBox.y - imageLayout.y;

            // Scale factor
            const scaleX = originalSize.width / imageLayout.width;
            const scaleY = originalSize.height / imageLayout.height;

            const cropX = Math.max(0, relativeX * scaleX);
            const cropY = Math.max(0, relativeY * scaleY);
            const cropWidth = Math.min(originalSize.width - cropX, cropBox.width * scaleX);
            const cropHeight = Math.min(originalSize.height - cropY, cropBox.height * scaleY);

            const result = await ImageManipulator.manipulateAsync(
                imageUri,
                [{
                    crop: {
                        originX: cropX,
                        originY: cropY,
                        width: cropWidth,
                        height: cropHeight,
                    }
                }],
                { compress: 1, format: ImageManipulator.SaveFormat.PNG }
            );

            onCrop(result.uri);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <View style={styles.container}>
            <View
                style={styles.imageContainer}
                onLayout={(e) => {
                    // This gives us the container size, but the image is inside.
                    // If resizeMode is contain, we need to calculate rendered size.
                    // Let's assume full width usage or center alignment.
                    const { width: containerW, height: containerH } = e.nativeEvent.layout;

                    if (originalSize) {
                        const aspectRatio = originalSize.width / originalSize.height;
                        const containerRatio = containerW / containerH;

                        let renderW, renderH, renderX, renderY;

                        if (aspectRatio > containerRatio) {
                            // Limited by width
                            renderW = containerW;
                            renderH = containerW / aspectRatio;
                            renderX = 0;
                            renderY = (containerH - renderH) / 2;
                        } else {
                            // Limited by height
                            renderH = containerH;
                            renderW = containerH * aspectRatio;
                            renderY = 0;
                            renderX = (containerW - renderW) / 2;
                        }

                        setImageLayout({ width: renderW, height: renderH, x: renderX, y: renderY });
                        // Center crop box initially
                        setCropBox({
                            x: renderX + renderW / 4,
                            y: renderY + renderH / 4,
                            width: renderW / 2,
                            height: renderH / 2
                        });
                    }
                }}
            >
                {originalSize && (
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                )}

                {/* Crop Overlay */}
                <View
                    style={[
                        styles.cropBox,
                        {
                            left: cropBox.x,
                            top: cropBox.y,
                            width: cropBox.width,
                            height: cropBox.height
                        }
                    ]}
                    {...panResponder.panHandlers}
                >
                    {/* Corners */}
                    <View style={[styles.handle, styles.tlHandle]} {...responders.TL.panHandlers} />
                    <View style={[styles.handle, styles.trHandle]} {...responders.TR.panHandlers} />
                    <View style={[styles.handle, styles.brHandle]} {...responders.BR.panHandlers} />
                    <View style={[styles.handle, styles.blHandle]} {...responders.BL.panHandlers} />

                    {/* Sides */}
                    <View style={[styles.handle, styles.tHandle]} {...responders.T.panHandlers} />
                    <View style={[styles.handle, styles.rHandle]} {...responders.R.panHandlers} />
                    <View style={[styles.handle, styles.bHandle]} {...responders.B.panHandlers} />
                    <View style={[styles.handle, styles.lHandle]} {...responders.L.panHandlers} />
                </View>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity onPress={onCancel} style={styles.button}>
                    <X color={colors.white} />
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCrop} style={[styles.button, styles.confirmButton]}>
                    {loading ? <ActivityIndicator color={colors.white} /> : (
                        <>
                            <Check color={colors.white} />
                            <Text style={styles.buttonText}>Crop</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'black',
        zIndex: 999,
        justifyContent: 'space-between',
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        margin: 20,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    cropBox: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: colors.primary,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    handle: {
        position: 'absolute',
        width: 30,
        height: 30,
        backgroundColor: colors.primary,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tlHandle: {
        top: -15,
        left: -15,
    },
    trHandle: {
        top: -15,
        right: -15,
    },
    brHandle: {
        bottom: -15,
        right: -15,
    },
    blHandle: {
        bottom: -15,
        left: -15,
    },
    tHandle: {
        top: -15,
        left: '50%',
        marginLeft: -15,
    },
    bHandle: {
        bottom: -15,
        left: '50%',
        marginLeft: -15,
    },
    lHandle: {
        left: -15,
        top: '50%',
        marginTop: -15,
    },
    rHandle: {
        right: -15,
        top: '50%',
        marginTop: -15,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing.l,
        backgroundColor: 'black',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
    },
    confirmButton: {
        backgroundColor: colors.primary,
        borderRadius: 8,
    },
    buttonText: {
        color: colors.white,
        marginLeft: spacing.s,
        fontWeight: 'bold',
    },
});
