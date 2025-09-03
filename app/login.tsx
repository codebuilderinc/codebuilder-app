import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView, Image, ScrollView } from 'react-native';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { useAuth } from '@/hooks/useAuth';
import { notify } from '@/services/notifier.service';

export default function LoginScreen() {
    // Add state for tracking rendering and errors
    const [isRendering, setIsRendering] = useState(true);
    const [renderError, setRenderError] = useState<string | null>(null);

    // Set up a basic UI first with minimal dependencies
    useEffect(() => {
        console.log('🔍 LoginScreen mounted');
        setIsRendering(false);

        return () => {
            console.log('🔍 LoginScreen unmounted');
        };
    }, []);

    // If we can't even render this basic UI, there's a serious problem elsewhere
    if (isRendering) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Loading login screen...</Text>
            </SafeAreaView>
        );
    }

    if (renderError) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'red' }}>Error rendering login: {renderError}</Text>
            </SafeAreaView>
        );
    }

    // If we get here, we can try to render the full component
    try {
        return <LoginScreenContent />;
    } catch (err: any) {
        console.error('❌ Error rendering LoginScreenContent:', err?.message || String(err));
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'red' }}>Failed to render login screen</Text>
                <Text>{err?.message || String(err)}</Text>
            </SafeAreaView>
        );
    }
}

// Separate the complex logic into its own component
function LoginScreenContent() {
    const { user, setUser } = useAuth();
    // Flag to track if we've already configured GoogleSignin
    const hasConfiguredRef = useRef(false);

    useEffect(() => {
        // Create an async function inside useEffect
        const configureGoogleSignIn = async () => {
            // Only configure once to prevent recursion
            if (hasConfiguredRef.current) {
                return;
            }

            hasConfiguredRef.current = true;

            // Simple configuration with minimal logging to prevent recursion
            try {
                const webClientId =
                    Constants.expoConfig?.extra?.googleWebClientId ||
                    // Expo public envs are embedded at bundle-time
                    (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as string | undefined);

                if (!webClientId) {
                    console.warn('🟡 Google Web Client ID is missing. Falling back to no offline access.');
                    GoogleSignin.configure({
                        scopes: ['profile', 'email'],
                    });
                    return;
                }

                console.log('🟢 Configuring Google Sign-In with client ID:', webClientId);

                // Configure Google Sign-In
                GoogleSignin.configure({
                    webClientId,
                    offlineAccess: true,
                    scopes: ['profile', 'email'],
                });
            } catch (error: any) {
                console.error('❌ Error during Google Sign-In setup:', error?.message || String(error));
                notify({
                    type: 'error',
                    title: 'Google Sign-In Setup Error',
                    message: error?.message || 'Failed to configure Google Sign-In',
                });
            }
        };

        // Call the async function
        configureGoogleSignIn();
    }, []);

    const signIn = async () => {
        try {
            console.log('🟢 Starting Google sign in process...');

            // Check if Google Play Services are available
            console.log('🟢 Checking Google Play Services...');
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            console.log('✅ Google Play Services available');

            // Attempt to sign in
            console.log('🟢 Initiating Google Sign-In...');

            // Perform the sign-in
            const signInResult = await GoogleSignin.signIn();

            // The structure from Expo's implementation is different - data is nested
            // Expo adds a wrapper with { type: 'success', data: { actual response } }
            console.log('📋 Google Sign-In raw result:', JSON.stringify(signInResult, null, 2));

            // Extract the data based on the structure
            let userData;
            let idToken;

            if (signInResult?.type === 'success' && signInResult?.data) {
                // Expo structure
                userData = signInResult.data.user;
                idToken = signInResult.data.idToken;
            } else {
                // Regular structure
                userData = signInResult?.user;
                idToken = signInResult?.idToken;
            }

            if (userData && idToken) {
                console.log('✅ Google Sign-In successful:', userData.email);
                console.log('✅ ID Token received, setting user and calling API');

                // Set the initial user in context (we'll update with tokens after API call)
                setUser({
                    idToken,
                    user: {
                        id: userData.id,
                        name: userData.name,
                        email: userData.email,
                        photo: userData.photo,
                        familyName: userData.familyName,
                        givenName: userData.givenName,
                    },
                });

                // Make the API call
                console.log('🟢 Making network request to auth API...');
                try {
                    const response = await fetch('https://api.codebuilder.org/auth/google', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idToken }),
                    });

                    console.log('✅ Auth API response received:', response.status);

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`API error (${response.status}): ${errorText || 'No error details'}`);
                    }

                    let responseData;
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        responseData = await response.json();
                    } else {
                        const text = await response.text();
                        try {
                            // Try to parse text as JSON in case content-type is incorrect
                            responseData = JSON.parse(text);
                        } catch (e) {
                            console.log('✅ Auth API response (text):', text || '(empty response)');
                            throw new Error('API response was not valid JSON');
                        }
                    }

                    console.log('✅ Auth API response processed');

                    if (responseData.accessToken && responseData.refreshToken) {
                        // Update user with tokens
                        setUser((prevUser) => ({
                            ...prevUser!,
                            accessToken: responseData.accessToken,
                            refreshToken: responseData.refreshToken,
                        }));

                        // Show success notification
                        notify({
                            type: 'success',
                            title: 'Sign-In Successful',
                            message: `Welcome, ${userData.name || userData.email}!`,
                        });
                    } else {
                        // Tokens missing from API response
                        throw new Error('API response missing access or refresh tokens');
                    }
                } catch (apiError: any) {
                    console.error('🔴 Auth callback error:', apiError?.message || String(apiError));
                    notify({
                        type: 'error',
                        title: 'Authentication Error',
                        message: apiError?.message || 'Failed to authenticate with server',
                    });
                }
            } else {
                console.warn('🟡 Google sign in did not return expected user data or token.');
                notify({
                    type: 'error',
                    title: 'Sign-In Failed',
                    message: 'Google sign-in did not return expected user data or token',
                });
            }
        } catch (e: any) {
            // Log error info for troubleshooting
            const code = e?.code || e?.statusCodes || 'UNKNOWN';
            const message = e?.message || 'No error message available';
            const statusCode = e?.statusCode || 'N/A';

            console.error('🔴 Google sign in error:', '\nError code:', code, '\nStatus code:', statusCode, '\nMessage:', message);

            notify({
                type: 'error',
                title: 'Google Sign-In Failed',
                message: message || 'Failed to sign in with Google',
            });
        }
    };

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

    // Show different UI based on authentication state
    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Login</Text>
                <GoogleSigninButton onPress={signIn} size={GoogleSigninButton.Size.Wide} color={GoogleSigninButton.Color.Dark} style={{ marginBottom: 16 }} />
            </View>
        );
    }

    // User is logged in
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Account Information</Text>

            {user.user.photo && <Image source={{ uri: user.user.photo }} style={styles.profileImage} />}

            <View style={styles.infoContainer}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>{user.user.name || 'N/A'}</Text>

                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{user.user.email}</Text>

                <Text style={styles.label}>Status:</Text>
                <Text style={[styles.value, styles.statusBadge]}>{user.accessToken ? '✓ Authenticated' : '⚠️ Partial Auth'}</Text>
            </View>

            <View style={styles.tokenInfo}>
                <Text style={styles.tokenLabel}>ID Token:</Text>
                <Text style={styles.tokenValue} numberOfLines={1} ellipsizeMode="middle">
                    {user.idToken.substring(0, 15)}...
                </Text>

                {user.accessToken && (
                    <>
                        <Text style={styles.tokenLabel}>Access Token:</Text>
                        <Text style={styles.tokenValue} numberOfLines={1} ellipsizeMode="middle">
                            {user.accessToken.substring(0, 15)}...
                        </Text>
                    </>
                )}

                {user.refreshToken && (
                    <>
                        <Text style={styles.tokenLabel}>Refresh Token:</Text>
                        <Text style={styles.tokenValue} numberOfLines={1} ellipsizeMode="middle">
                            {user.refreshToken.substring(0, 15)}...
                        </Text>
                    </>
                )}
            </View>

            <View style={styles.buttonContainer}>
                <Text style={styles.signOutButton} onPress={signOut}>
                    Sign Out
                </Text>

                <Text style={styles.revokeButton} onPress={revokeAccess}>
                    Revoke Access
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
    title: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 20,
    },
    infoContainer: {
        width: '100%',
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
    },
    label: {
        fontWeight: '600',
        marginBottom: 4,
        color: '#555',
    },
    value: {
        marginBottom: 16,
        fontSize: 16,
    },
    statusBadge: {
        color: '#2e7d32',
        fontWeight: '600',
    },
    tokenInfo: {
        width: '100%',
        backgroundColor: '#e8f5e9',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
    },
    tokenLabel: {
        fontWeight: '600',
        marginBottom: 4,
        color: '#2e7d32',
    },
    tokenValue: {
        marginBottom: 16,
        fontSize: 14,
        fontFamily: 'monospace',
        color: '#1b5e20',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        marginTop: 8,
    },
    signOutButton: {
        color: '#2196f3',
        marginRight: 16,
        textDecorationLine: 'underline',
        fontSize: 16,
        padding: 8,
    },
    revokeButton: {
        color: '#f44336',
        textDecorationLine: 'underline',
        fontSize: 16,
        padding: 8,
    },
});
