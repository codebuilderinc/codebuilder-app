import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Platform } from 'react-native';
import * as Location from 'expo-location';

export default function LocationPermissionDemo() {
    const [status, setStatus] = useState<Location.PermissionStatus | null>(null);
    const [backgroundStatus, setBackgroundStatus] = useState<Location.PermissionStatus | null>(null);
    const [coords, setCoords] = useState<string>('');
    const [error, setError] = useState<string>('');

    const requestPermissions = async () => {
        setError('');
        const fg = await Location.requestForegroundPermissionsAsync();
        setStatus(fg.status);

        if (Platform.OS === 'android') {
            const bg = await Location.requestBackgroundPermissionsAsync();
            setBackgroundStatus(bg.status);
        }
    };

    const fetchLocation = async () => {
        try {
            const loc = await Location.getCurrentPositionAsync({});
            setCoords(`${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
        } catch (e) {
            setError((e as Error).message);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Location (foreground & background)</Text>
            <Text style={styles.copy}>
                Requests ACCESS_COARSE_LOCATION, ACCESS_FINE_LOCATION, ACCESS_BACKGROUND_LOCATION and demonstrates fetching a single
                location fix via expo-location.
            </Text>

            <Button title="Request location permissions" onPress={requestPermissions} />
            <View style={styles.gap} />
            <Button title="Fetch current location" onPress={fetchLocation} />

            <View style={styles.statusBox}>
                <Text style={styles.statusText}>Foreground: {status ?? 'unknown'}</Text>
                {Platform.OS === 'android' && <Text style={styles.statusText}>Background: {backgroundStatus ?? 'unknown'}</Text>}
                {coords ? <Text style={styles.statusText}>Last fix: {coords}</Text> : null}
                {error ? <Text style={[styles.statusText, styles.error]}>{error}</Text> : null}
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
    error: { color: '#ff6b6b' },
    gap: { height: 10 },
});

