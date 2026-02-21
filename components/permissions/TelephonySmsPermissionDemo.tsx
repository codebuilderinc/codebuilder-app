import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, PermissionsAndroid, Platform } from 'react-native';

const REQUESTS = [
    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
    PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS,
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.SEND_SMS,
    PermissionsAndroid.PERMISSIONS.CALL_PHONE,
    PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS,
    PermissionsAndroid.PERMISSIONS.PROCESS_OUTGOING_CALLS,
];

export default function TelephonySmsPermissionDemo() {
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
            <Text style={styles.title}>Telephony & SMS</Text>
            <Text style={styles.copy}>
                Requests READ_PHONE_STATE, READ_PHONE_NUMBERS, CALL_PHONE, SEND_SMS, ANSWER_PHONE_CALLS, and PROCESS_OUTGOING_CALLS. These
                permissions are sensitive and may require additional Play Store declarations.
            </Text>
            <Button title="Request phone & SMS permissions" onPress={request} />
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
