import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomHeader from '@/components/CustomHeader';
import NotificationsPermissionDemo from '@/components/permissions/NotificationsPermissionDemo';

export default function NotificationsScreen() {
    return (
        <View style={styles.container}>
            <CustomHeader title="Notifications" showBackButton />
            <NotificationsPermissionDemo />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
});
