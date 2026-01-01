import { Link } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import CustomHeader from '@/components/CustomHeader';

const routes = [
    { href: '/permissions/location', title: 'Location (foreground/background)' },
    { href: '/permissions/camera-mic', title: 'Camera & Microphone' },
    { href: '/permissions/notifications', title: 'Notifications' },
    { href: '/permissions/media-storage', title: 'Media Library' },
    { href: '/permissions/storage', title: 'Storage & File Access' },
    { href: '/permissions/telephony-sms', title: 'Telephony & SMS' },
    { href: '/permissions/connectivity', title: 'Bluetooth & Nearby' },
];

export default function PermissionsHub() {
    return (
        <View style={styles.container}>
            <CustomHeader title="Permissions Hub" />
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.lead}>
                    Explore Android permission demos. Each link opens a focused screen that requests the associated runtime permissions and
                    performs a small capability check.
                </Text>
                {routes.map((route) => (
                    <View style={styles.card} key={route.href}>
                        <Text style={styles.cardTitle}>{route.title}</Text>
                        <Link href={route.href} asChild>
                            <Pressable style={styles.button}>
                                <Text style={styles.buttonText}>Open demo</Text>
                            </Pressable>
                        </Link>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    content: { padding: 16, gap: 12 },
    lead: { color: '#ccc', fontSize: 14, lineHeight: 20, marginBottom: 6 },
    card: {
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: '#222',
    },
    cardTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
    button: {
        backgroundColor: '#1e88e5',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: { color: '#fff', fontWeight: '600' },
});
