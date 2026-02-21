import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomHeader from '@/components/CustomHeader';
import StoragePermissionDemo from '@/components/permissions/StoragePermissionDemo';

export default function StorageScreen() {
    return (
        <View style={styles.container}>
            <CustomHeader title="Storage" showBackButton />
            <StoragePermissionDemo />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
});
