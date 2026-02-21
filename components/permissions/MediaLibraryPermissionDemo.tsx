import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

export default function MediaLibraryPermissionDemo() {
    const [status, setStatus] = useState<string>('unknown');
    const [assetSummary, setAssetSummary] = useState<string>('Not loaded');

    const requestPermissions = async () => {
        const permissions = await MediaLibrary.requestPermissionsAsync(true);
        setStatus(permissions.status);
    };

    const loadAssets = async () => {
        const assets = await MediaLibrary.getAssetsAsync({ first: 5, sortBy: MediaLibrary.SortBy.modificationTime });
        setAssetSummary(`Fetched ${assets.assets.length} of ${assets.totalCount} assets`);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Media & Storage</Text>
            <Text style={styles.copy}>
                Requests READ_MEDIA_* / ACCESS_MEDIA_LOCATION style permissions and fetches a small sample of media entries from the
                device library.
            </Text>
            <Button title="Request media/storage permissions" onPress={requestPermissions} />
            <View style={styles.gap} />
            <Button title="Load sample assets" onPress={loadAssets} />

            <View style={styles.statusBox}>
                <Text style={styles.statusText}>Status: {status}</Text>
                <Text style={styles.statusText}>{assetSummary}</Text>
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
    gap: { height: 10 },
});
