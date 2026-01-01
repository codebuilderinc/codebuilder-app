import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import * as Notifications from 'expo-notifications';

export default function NotificationsPermissionDemo() {
    const [status, setStatus] = useState<string>('unknown');
    const [lastScheduledId, setLastScheduledId] = useState<string>('');

    const requestPermissions = async () => {
        const settings = await Notifications.requestPermissionsAsync();
        const derivedStatus = settings.status ?? (settings.granted ? 'granted' : 'denied');
        setStatus(derivedStatus);
    };

    const schedule = async () => {
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Permission demo',
                body: 'Local notification demonstrating POST_NOTIFICATIONS / NOTIFICATIONS usage.',
            },
            trigger: { seconds: 2 },
        });
        setLastScheduledId(id);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.copy}>
                Requests NOTIFICATIONS / POST_NOTIFICATIONS and schedules a sample local notification through expo-notifications.
            </Text>
            <Button title="Request notification permission" onPress={requestPermissions} />
            <View style={styles.gap} />
            <Button title="Schedule demo notification" onPress={schedule} />

            <View style={styles.statusBox}>
                <Text style={styles.statusText}>Status: {status}</Text>
                {lastScheduledId ? <Text style={styles.statusText}>Last scheduled id: {lastScheduledId}</Text> : null}
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
