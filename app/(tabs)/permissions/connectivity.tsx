import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomHeader from '@/components/CustomHeader';
import BluetoothNearbyPermissionDemo from '@/components/permissions/BluetoothNearbyPermissionDemo';

export default function ConnectivityScreen() {
    return (
        <View style={styles.container}>
            <CustomHeader title="Bluetooth & Nearby" showBackButton />
            <BluetoothNearbyPermissionDemo />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
});
