import { Stack } from 'expo-router';

export default function PermissionsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        />
    );
}
