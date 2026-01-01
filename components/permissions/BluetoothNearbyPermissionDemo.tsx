import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, PermissionsAndroid, Platform } from 'react-native';

const REQUESTS = [
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES,
];

export default function BluetoothNearbyPermissionDemo() {
    const [statuses, setStatuses] = useState<Record<string, string>>({});

    const request = async () => {
        if (Platform.OS !== 'android') {
            setStatuses({ platform: 'Only relevant on Android' });
            return;
        }
        const results = await PermissionsAndroid.requestMultiple(REQUESTS);
        setStatuses(results);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Bluetooth & Nearby</Text>
            <Text style={styles.copy}>
                Requests BLUETOOTH_CONNECT / SCAN / ADVERTISE along with NEARBY_WIFI_DEVICES and fine location to showcase nearby device
                discovery prerequisites.
            </Text>
            <Button title="Request nearby permissions" onPress={request} />
            <View style={styles.statusBox}>
                {Object.keys(statuses).length === 0 ? (
                    <Text style={styles.statusText}>No results yet</Text>
                ) : (
                    Object.entries(statuses).map(([key, value]) => (
                        <Text style={styles.statusText} key={key}>
                            {key.split('.').pop()}: {value}
                        </Text>
                    ))
                )}
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

