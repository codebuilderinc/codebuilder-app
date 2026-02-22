import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CustomHeader from '@/components/CustomHeader';

const routes: Array<{ href: string; title: string; icon: string; color: string }> = [
    { href: '/permissions/location', title: 'Location (foreground/background)', icon: '📍', color: '#4CAF50' },
    { href: '/permissions/camera-mic', title: 'Camera & Microphone', icon: '📷', color: '#E91E63' },
    { href: '/permissions/notifications', title: 'Notifications', icon: '🔔', color: '#FF9800' },
    { href: '/permissions/media-storage', title: 'Media Library', icon: '🖼️', color: '#9C27B0' },
    { href: '/permissions/storage', title: 'Storage & File Access', icon: '📁', color: '#00BCD4' },
    { href: '/permissions/telephony-sms', title: 'Telephony & SMS', icon: '📱', color: '#F44336' },
    { href: '/permissions/connectivity', title: 'Bluetooth & Nearby', icon: '📶', color: '#3F51B5' },
];

export default function PermissionsHub() {
    const router = useRouter();

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
                        <Text style={styles.cardTitle}>{route.icon} {route.title}</Text>
                        <Pressable
                            style={[styles.button, { backgroundColor: route.color }]}
                            onPress={() => router.push(route.href as any)}
                        >
                            <Text style={styles.buttonText}>Open demo</Text>
                            <FontAwesome name="chevron-right" size={12} color="#fff" style={styles.buttonArrow} />
                        </Pressable>
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
        paddingHorizontal: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    buttonArrow: { marginLeft: 8, marginTop: 2 },
});
