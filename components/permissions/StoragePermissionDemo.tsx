import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, PermissionsAndroid, Platform } from 'react-native';

const REQUESTS = [
    PermissionsAndroid.PERMISSIONS.MANAGE_EXTERNAL_STORAGE,
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
    PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
    PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
];

export default function StoragePermissionDemo() {
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
            <Text style={styles.title}>Storage & File Access</Text>
            <Text style={styles.copy}>
                Requests MANAGE_EXTERNAL_STORAGE plus legacy READ/WRITE_EXTERNAL_STORAGE and modern READ_MEDIA_* runtime permissions to
                illustrate storage access flows.
            </Text>
            <Button title="Request storage permissions" onPress={request} />
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
