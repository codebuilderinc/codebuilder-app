import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomHeader from '@/components/CustomHeader';
import MediaLibraryPermissionDemo from '@/components/permissions/MediaLibraryPermissionDemo';

export default function MediaStorageScreen() {
    return (
        <View style={styles.container}>
            <CustomHeader title="Media Library" showBackButton />
            <MediaLibraryPermissionDemo />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
});
