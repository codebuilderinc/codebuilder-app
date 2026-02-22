import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Camera, CameraView, CameraType, FlashMode } from 'expo-camera';

type CameraOption = {
    type: CameraType;
    label: string;
};

export default function CameraMicrophonePermissionDemo() {
    const [cameraStatus, setCameraStatus] = useState<string>('unknown');
    const [micStatus, setMicStatus] = useState<string>('unknown');
    const [availableCameras, setAvailableCameras] = useState<CameraOption[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<CameraType>('back');
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [flashMode, setFlashMode] = useState<FlashMode>('off');
    const [zoom, setZoom] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [photo, setPhoto] = useState<string | null>(null);
    const [video, setVideo] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    
    const cameraRef = useRef<CameraView | null>(null);

    const requestPermissions = async () => {
        const camera = await Camera.requestCameraPermissionsAsync();
        const mic = await Camera.requestMicrophonePermissionsAsync();
        setCameraStatus(camera.status);
        setMicStatus(mic.status);

        if (camera.status === 'granted') {
            await queryAvailableCameras();
            setShowCamera(true);
        }
    };

    const queryAvailableCameras = async () => {
        try {
            const types = await Camera.getAvailableCameraTypesAsync();
            const cameraOptions: CameraOption[] = types.map((type) => ({
                type: type as CameraType,
                label: formatCameraLabel(type),
            }));
            setAvailableCameras(cameraOptions);
            
            // Set default camera to back if available, otherwise first available
            if (types.includes('back')) {
                setSelectedCamera('back');
            } else if (types.length > 0) {
                setSelectedCamera(types[0] as CameraType);
            }
        } catch (error) {
            console.warn('Failed to get available cameras:', error);
            // Fallback to common camera types
            setAvailableCameras([
                { type: 'back', label: 'Back Camera' },
                { type: 'front', label: 'Front Camera' },
            ]);
        }
    };

    const formatCameraLabel = (type: string): string => {
        switch (type) {
            case 'back':
                return 'Back Camera';
            case 'front':
                return 'Front Camera';
            case 'external':
                return 'External Camera';
            default:
                return type.charAt(0).toUpperCase() + type.slice(1) + ' Camera';
        }
    };

    const handleCameraSelect = (cameraType: CameraType) => {
        setSelectedCamera(cameraType);
        setIsCameraReady(false);
    };

    const cycleFlashMode = () => {
        const modes: FlashMode[] = ['off', 'on', 'auto'];
        const currentIndex = modes.indexOf(flashMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        setFlashMode(modes[nextIndex]);
    };

    const getFlashLabel = (): string => {
        switch (flashMode) {
            case 'off': return 'Off';
            case 'on': return 'On';
            case 'auto': return 'Auto';
            default: return 'Unknown';
        }
    };

    const adjustZoom = (value: number) => {
        setZoom(Math.min(Math.max(zoom + value, 0), 1));
    };

    const takePhoto = async () => {
        if (!cameraRef.current || !isCameraReady) return;

        try {
            const result = await cameraRef.current.takePictureAsync({
                quality: 0.7,
                skipProcessing: true,
            });
            if (result) {
                setPhoto(result.uri);
            }
        } catch (error) {
            console.warn('Failed to take photo:', error);
        }
    };

    const startRecording = async () => {
        if (!cameraRef.current || isRecording) return;

        setIsRecording(true);
        try {
            const result = await cameraRef.current.recordAsync({
                maxDuration: 300,
            });
            if (result) {
                setVideo(result.uri);
            }
        } catch (error) {
            console.warn('Failed to record video:', error);
        }
        setIsRecording(false);
    };

    const stopRecording = () => {
        if (!cameraRef.current || !isRecording) return;
        cameraRef.current.stopRecording();
    };

    const handleCameraReady = () => {
        setIsCameraReady(true);
    };

    const clearMedia = () => {
        setPhoto(null);
        setVideo(null);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Camera & Microphone</Text>
            <Text style={styles.copy}>
                Requests CAMERA and RECORD_AUDIO plus microphone access via expo-camera. Select from available cameras to preview.
            </Text>
            
            {!showCamera && (
                <Button title="Request camera & mic permissions" onPress={requestPermissions} />
            )}
            
            <View style={styles.statusBox}>
                <Text style={styles.statusText}>Camera: {cameraStatus}</Text>
                <Text style={styles.statusText}>Microphone: {micStatus}</Text>
                <Text style={styles.statusText}>
                    Available cameras: {availableCameras.length > 0 
                        ? availableCameras.map(c => c.label).join(', ') 
                        : 'not queried'}
                </Text>
            </View>

            {/* Camera Selection */}
            {showCamera && availableCameras.length > 0 && (
                <View style={styles.cameraSelectionContainer}>
                    <Text style={styles.sectionTitle}>Select Camera</Text>
                    <View style={styles.cameraButtonsRow}>
                        {availableCameras.map((camera) => (
                            <TouchableOpacity
                                key={camera.type}
                                style={[
                                    styles.cameraSelectButton,
                                    selectedCamera === camera.type && styles.cameraSelectButtonActive,
                                ]}
                                onPress={() => handleCameraSelect(camera.type)}
                            >
                                <Text style={[
                                    styles.cameraSelectText,
                                    selectedCamera === camera.type && styles.cameraSelectTextActive,
                                ]}>
                                    {camera.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Live Camera View */}
            {showCamera && cameraStatus === 'granted' && (
                <View style={styles.cameraContainer}>
                    <CameraView
                        ref={cameraRef}
                        style={styles.camera}
                        facing={selectedCamera}
                        flash={flashMode}
                        zoom={zoom}
                        onCameraReady={handleCameraReady}
                    >
                        <View style={styles.cameraOverlay}>
                            <Text style={styles.cameraStatusText}>
                                {isCameraReady ? `Using: ${formatCameraLabel(selectedCamera)}` : 'Initializing...'}
                            </Text>
                        </View>
                    </CameraView>

                    {/* Camera Controls */}
                    <View style={styles.controlsContainer}>
                        {/* Flash Control */}
                        <TouchableOpacity style={styles.controlButton} onPress={cycleFlashMode}>
                            <Text style={styles.controlText}>Flash: {getFlashLabel()}</Text>
                        </TouchableOpacity>

                        {/* Zoom Controls */}
                        <View style={styles.zoomControls}>
                            <TouchableOpacity
                                style={styles.controlButton}
                                onPress={() => adjustZoom(-0.1)}
                            >
                                <Text style={styles.controlText}>- Zoom</Text>
                            </TouchableOpacity>
                            <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
                            <TouchableOpacity
                                style={styles.controlButton}
                                onPress={() => adjustZoom(0.1)}
                            >
                                <Text style={styles.controlText}>+ Zoom</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Capture Controls */}
                        <View style={styles.captureRow}>
                            <TouchableOpacity
                                style={[styles.captureButton, isRecording && styles.recording]}
                                onPress={isRecording ? stopRecording : startRecording}
                                disabled={!isCameraReady}
                            >
                                <Text style={styles.captureText}>{isRecording ? 'Stop' : 'Record'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.captureButton} 
                                onPress={takePhoto}
                                disabled={!isCameraReady}
                            >
                                <Text style={styles.captureText}>Photo</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Preview Section */}
                    {(photo || video) && (
                        <View style={styles.previewContainer}>
                            <View style={styles.previewHeader}>
                                <Text style={styles.sectionTitle}>Captured Media</Text>
                                <TouchableOpacity onPress={clearMedia}>
                                    <Text style={styles.clearText}>Clear</Text>
                                </TouchableOpacity>
                            </View>
                            {photo && (
                                <Image source={{ uri: photo }} style={styles.preview} />
                            )}
                            {video && (
                                <Text style={styles.videoText}>Video recorded: {video}</Text>
                            )}
                        </View>
                    )}
                </View>
            )}
        </ScrollView>
    );
}

const { width } = Dimensions.get('window');
const cameraHeight = width * 0.75; // 4:3 aspect ratio

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#000' 
    },
    content: { 
        padding: 16, 
        gap: 12,
        paddingBottom: 40,
    },
    title: { 
        color: '#fff', 
        fontSize: 18, 
        fontWeight: '700' 
    },
    copy: { 
        color: '#ccc', 
        fontSize: 14, 
        lineHeight: 20 
    },
    statusBox: { 
        backgroundColor: '#111', 
        padding: 12, 
        borderRadius: 8, 
        marginTop: 12 
    },
    statusText: { 
        color: '#fff', 
        marginBottom: 4 
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    cameraSelectionContainer: {
        marginTop: 16,
    },
    cameraButtonsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    cameraSelectButton: {
        backgroundColor: '#222',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#444',
    },
    cameraSelectButtonActive: {
        backgroundColor: '#0066cc',
        borderColor: '#0088ff',
    },
    cameraSelectText: {
        color: '#aaa',
        fontSize: 14,
    },
    cameraSelectTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    cameraContainer: {
        marginTop: 16,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#111',
    },
    camera: {
        width: '100%',
        height: cameraHeight,
    },
    cameraOverlay: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
    },
    cameraStatusText: {
        color: '#fff',
        fontSize: 12,
    },
    controlsContainer: {
        padding: 12,
        gap: 12,
    },
    controlButton: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    controlText: {
        color: '#fff',
        fontSize: 14,
    },
    zoomControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    zoomText: {
        color: '#fff',
        fontSize: 14,
        minWidth: 50,
        textAlign: 'center',
    },
    captureRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginTop: 8,
    },
    captureButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 40,
        minWidth: 100,
        alignItems: 'center',
    },
    captureText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    recording: {
        backgroundColor: 'rgba(255,0,0,0.5)',
    },
    previewContainer: {
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    clearText: {
        color: '#0088ff',
        fontSize: 14,
    },
    preview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    videoText: {
        color: '#ccc',
        fontSize: 14,
    },
});
