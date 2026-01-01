import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomHeader from '@/components/CustomHeader';
import TelephonySmsPermissionDemo from '@/components/permissions/TelephonySmsPermissionDemo';

export default function TelephonySmsScreen() {
    return (
        <View style={styles.container}>
            <CustomHeader title="Telephony & SMS" showBackButton />
            <TelephonySmsPermissionDemo />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
});

