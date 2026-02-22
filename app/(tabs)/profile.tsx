import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { notify } from '@/services/notifier.service';
import CustomHeader from '@/components/CustomHeader';

export default function ProfileScreen() {
    const { user, setUser } = useAuth();
    const [isReady, setIsReady] = useState(false);

    // Wait for component to mount before checking auth
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsReady(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Redirect to login if not authenticated (only after component is ready)
    useEffect(() => {
        if (isReady && !user) {
            router.replace('/login');
        }
    }, [user, isReady]);

    const signOut = async () => {
        try {
            console.log('🔄 Signing out from Google...');
            await GoogleSignin.signOut();
            console.log('✅ Signed out successfully');
            setUser(null);
            notify({
                type: 'info',
                title: 'Signed Out',
                message: 'You have been successfully signed out',
            });
        } catch (e: any) {
            console.error('❌ Sign out error:', e?.message || String(e));
            notify({
                type: 'error',
                title: 'Sign-Out Error',
                message: e?.message || 'Failed to sign out',
            });
        }
    };

    const revokeAccess = async () => {
        try {
            console.log('⚠️ Revoking Google access...');
            await GoogleSignin.revokeAccess();
            await GoogleSignin.signOut();
            console.log('✅ Access revoked successfully');
            setUser(null);
            notify({
                type: 'info',
                title: 'Access Revoked',
                message: 'Your Google access has been revoked',
            });
        } catch (e: any) {
            console.error('❌ Revoke access error:', e?.message || String(e));
            notify({
                type: 'error',
                title: 'Revoke Access Error',
                message: e?.message || 'Failed to revoke access',
            });
        }
    };

    // Show loading state while checking auth or redirecting
    if (!user) {
        return (
            <View style={{ flex: 1, backgroundColor: '#000' }}>
                <CustomHeader title="Profile" />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Please log in to view your profile</Text>
                    <Pressable style={styles.loginButton} onPress={() => router.push('/login')}>
                        <Text style={styles.loginButtonText}>Go to Login</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <CustomHeader title="Profile" />
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Account Information</Text>

                {user.user.photo && <Image source={{ uri: user.user.photo }} style={styles.profileImage} />}

                <View style={styles.infoContainer}>
                    <Text style={styles.label}>Name:</Text>
                    <Text style={styles.value}>{user.user.name || 'N/A'}</Text>

                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{user.user.email}</Text>

                    <Text style={styles.label}>Given Name:</Text>
                    <Text style={styles.value}>{user.user.givenName || 'N/A'}</Text>

                    <Text style={styles.label}>Family Name:</Text>
                    <Text style={styles.value}>{user.user.familyName || 'N/A'}</Text>

                    <Text style={styles.label}>User ID:</Text>
                    <Text style={[styles.value, styles.mono]}>{user.user.id}</Text>

                    <Text style={styles.label}>Status:</Text>
                    <Text style={[styles.value, styles.statusBadge]}>{user.accessToken ? '✓ Authenticated' : '⚠️ Partial Auth'}</Text>
                </View>

                <View style={styles.tokenInfo}>
                    <Text style={styles.tokenLabel}>ID Token:</Text>
                    <Text style={styles.tokenValue} numberOfLines={1} ellipsizeMode="middle">
                        {user.idToken.substring(0, 20)}...{user.idToken.substring(user.idToken.length - 10)}
                    </Text>

                    {user.accessToken && (
                        <>
                            <Text style={styles.tokenLabel}>Access Token:</Text>
                            <Text style={styles.tokenValue} numberOfLines={1} ellipsizeMode="middle">
                                {user.accessToken.substring(0, 20)}...{user.accessToken.substring(user.accessToken.length - 10)}
                            </Text>
                        </>
                    )}

                    {user.refreshToken && (
                        <>
                            <Text style={styles.tokenLabel}>Refresh Token:</Text>
                            <Text style={styles.tokenValue} numberOfLines={1} ellipsizeMode="middle">
                                {user.refreshToken.substring(0, 20)}...{user.refreshToken.substring(user.refreshToken.length - 10)}
                            </Text>
                        </>
                    )}
                </View>

                <View style={styles.buttonContainer}>
                    <Pressable style={styles.signOutButton} onPress={signOut}>
                        <Text style={styles.signOutButtonText}>Sign Out</Text>
                    </Pressable>

                    <Pressable style={styles.revokeButton} onPress={revokeAccess}>
                        <Text style={styles.revokeButtonText}>Revoke Access</Text>
                    </Pressable>
                </View>

                <Pressable style={styles.debugButton} onPress={() => router.push('/debug' as any)}>
                    <Text style={styles.debugButtonText}>Open Debug Panel</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingText: {
        color: '#888',
        fontSize: 16,
        marginBottom: 16,
    },
    loginButton: {
        backgroundColor: '#2196f3',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    container: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 20,
        color: '#fff',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 20,
        borderWidth: 3,
        borderColor: '#333',
    },
    infoContainer: {
        width: '100%',
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    label: {
        fontWeight: '600',
        marginBottom: 4,
        color: '#888',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    value: {
        marginBottom: 16,
        fontSize: 16,
        color: '#fff',
    },
    mono: {
        fontFamily: 'monospace',
        fontSize: 12,
    },
    statusBadge: {
        color: '#4caf50',
        fontWeight: '600',
    },
    tokenInfo: {
        width: '100%',
        backgroundColor: '#1a2d1a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    tokenLabel: {
        fontWeight: '600',
        marginBottom: 4,
        color: '#66bb6a',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    tokenValue: {
        marginBottom: 16,
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#c8e6c9',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 20,
        gap: 12,
    },
    signOutButton: {
        backgroundColor: '#2196f3',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    signOutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    revokeButton: {
        backgroundColor: '#f44336',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    revokeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    debugButton: {
        backgroundColor: '#333',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    debugButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
