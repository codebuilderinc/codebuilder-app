import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomHeader from '@/components/CustomHeader';
import LocationPermissionDemo from '@/components/permissions/LocationPermissionDemo';

export default function LocationScreen() {
    return (
        <View style={styles.container}>
            <CustomHeader title="Location permissions" showBackButton />
            <LocationPermissionDemo />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
});

