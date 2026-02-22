import React, { useState } from 'react';
 import { View, Text, Button, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLocation } from '@/hooks/useLocation';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function LocationPermissionDemo() {
    const [fgStatus, setFgStatus] = useState<Location.PermissionStatus | null>(null);
    const [backgroundStatus, setBackgroundStatus] = useState<Location.PermissionStatus | null>(null);

    const { fcmToken } = usePushNotifications();
    const { location, address, error, loading, fetchLocation } = useLocation(fcmToken);

    const requestPermissions = async () => {
        const fg = await Location.requestForegroundPermissionsAsync();
        setFgStatus(fg.status);

        if (Platform.OS === 'android') {
            const bg = await Location.requestBackgroundPermissionsAsync();
            setBackgroundStatus(bg.status);
        }
    };

    const handleFetchLocation = () => {
        fetchLocation(fcmToken);
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
            <Button title="Fetch current location" onPress={handleFetchLocation} />

            {/* Permission Status */}
            <View style={styles.statusBox}>
                <Text style={styles.statusText}>Foreground: {fgStatus ?? 'unknown'}</Text>
                {Platform.OS === 'android' && <Text style={styles.statusText}>Background: {backgroundStatus ?? 'unknown'}</Text>}
            </View>

            {/* Location Data & Map */}
            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
            ) : error ? (
                <Text style={[styles.statusText, styles.error]}>{error}</Text>
            ) : location && address ? (
                <>
                    <View style={styles.statusBox}>
                        <Text style={styles.statusText}>
                            Address: {address.name}, {address.city}, {address.region}, {address.country}
                        </Text>
                        <Text style={styles.statusText}>
                            Coordinates: {location.coords.latitude.toFixed(5)}, {location.coords.longitude.toFixed(5)}
                        </Text>
                    </View>

                    <View style={styles.mapContainer}>
                        <MapView
                            style={styles.map}
                            region={{
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            }}
                            showsUserLocation={true}
                            loadingEnabled={true}
                        >
                            <Marker
                                coordinate={{
                                    latitude: location.coords.latitude,
                                    longitude: location.coords.longitude,
                                }}
                                title="You are here"
                            />
                        </MapView>
                    </View>
                </>
            ) : (
                <Text style={styles.statusText}>Press "Fetch current location" to get your location</Text>
            )}
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
    loader: { marginTop: 20 },
    mapContainer: {
        width: '100%',
        height: 300,
        marginTop: 16,
        borderRadius: 10,
        overflow: 'hidden',
    },
    map: {
        width: '100%',
        height: '100%',
    },
});
