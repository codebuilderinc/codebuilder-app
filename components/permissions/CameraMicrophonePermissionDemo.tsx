import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { Camera } from 'expo-camera';

export default function CameraMicrophonePermissionDemo() {
    const [cameraStatus, setCameraStatus] = useState<string>('unknown');
    const [micStatus, setMicStatus] = useState<string>('unknown');
    const [availableTypes, setAvailableTypes] = useState<string>('not queried');

    const requestPermissions = async () => {
        const camera = await Camera.requestCameraPermissionsAsync();
        const mic = await Camera.requestMicrophonePermissionsAsync();
        setCameraStatus(camera.status);
        setMicStatus(mic.status);

        if (camera.status === 'granted') {
            const types = await Camera.getAvailableCameraTypesAsync();
            setAvailableTypes(types.join(', ') || 'none reported');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Camera & Microphone</Text>
            <Text style={styles.copy}>
                Requests CAMERA and RECORD_AUDIO plus microphone access via expo-camera. Queries available camera types once granted.
            </Text>
            <Button title="Request camera & mic permissions" onPress={requestPermissions} />
            <View style={styles.statusBox}>
                <Text style={styles.statusText}>Camera: {cameraStatus}</Text>
                <Text style={styles.statusText}>Microphone: {micStatus}</Text>
                <Text style={styles.statusText}>Available cameras: {availableTypes}</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    content: { padding: 16, gap: 12 },
    title: { color: '#fff', fontSize: 18, fontWeight: '700' },
    copy: { color: '#ccc', fontSize: 14, lineHeight: 20 },
    statusBox: { backgroundColor: '#111', padding: 12, borderRadius: 8, marginTop: 12 },
    statusText: { color: '#fff', marginBottom: 4 },
});

