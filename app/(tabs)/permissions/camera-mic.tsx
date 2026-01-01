import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomHeader from '@/components/CustomHeader';
import CameraMicrophonePermissionDemo from '@/components/permissions/CameraMicrophonePermissionDemo';

export default function CameraMicScreen() {
    return (
        <View style={styles.container}>
            <CustomHeader title="Camera & Microphone" showBackButton />
            <CameraMicrophonePermissionDemo />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
});

