import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView, Image, ScrollView, Pressable } from 'react-native';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/providers/SessionProvider';
import { notify } from '@/services/notifier.service';
import { router } from 'expo-router';

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
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <Text>Loading login screen...</Text>
            </SafeAreaView>
        );
    }

    if (renderError) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
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
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <Text style={{ color: 'red' }}>Failed to render login screen</Text>
                <Text>{err?.message || String(err)}</Text>
            </SafeAreaView>
        );
    }
}

// Separate the complex logic into its own component
function LoginScreenContent() {
    const { user, setUser } = useAuth();
    const { updateAfterLogin } = useSession();
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
                // Use different client IDs for debug vs production
                const extra = Constants.expoConfig?.extra;
                const webClientId = __DEV__ ? (extra?.googleWebClientIdDev || extra?.googleWebClientId) : extra?.googleWebClientId;
                console.log("webClientId:", webClientId || 'MISSING');

                if (!webClientId) {
                    console.warn('🟡 Google Web Client ID is missing. Falling back to no offline access.');
                    GoogleSignin.configure({
                        scopes: ['profile', 'email'],
                    });
                    return;
                }

                console.log('🟢 Configuring Google Sign-In with client ID:', webClientId.substring(0, 20) + '...');
                console.log('📱 Build type:', __DEV__ ? 'DEBUG' : 'PRODUCTION');

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
            console.log('📱 Build type:', __DEV__ ? 'DEBUG' : 'PRODUCTION');
            console.log('📦 Package name:', Constants.expoConfig?.android?.package);

            // Check if Google Play Services are available
            console.log('🟢 Checking Google Play Services...');
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            console.log('✅ Google Play Services available');

            // Log current configuration
            console.log('🔧 Current GoogleSignin configuration complete');

            // Enhanced sign-in with better error detection
            console.log('🟢 Initiating Google Sign-In...');
            
            // Check if user has previously signed in
            const hasPreviousSignIn = GoogleSignin.hasPreviousSignIn();
            console.log('� Has previous sign-in:', hasPreviousSignIn);
            
            // Get current user if available
            const currentUser = GoogleSignin.getCurrentUser();
            console.log('👤 Current user:', currentUser ? 'Found' : 'Not found');
            
            // If there's a current user, try to clear session first
            if (currentUser) {
                try {
                    console.log('� Clearing existing Google session...');
                    await GoogleSignin.signOut();
                    console.log('✅ Previous session cleared');
                } catch (clearError: any) {
                    console.log('⚠️ Could not clear session:', clearError?.message);
                }
            }

            // Perform the sign-in
            console.log('🚀 Calling GoogleSignin.signIn()...');
            
            let signInResult;
            try {
                signInResult = await GoogleSignin.signIn();
                console.log('✅ GoogleSignin.signIn() completed successfully');
                console.log('📋 Raw signInResult type:', typeof signInResult);
                console.log('📋 Raw signInResult keys:', signInResult ? Object.keys(signInResult) : 'null/undefined');
            } catch (signInError: any) {
                // Log the specific error from GoogleSignin
                console.error('🔴 GoogleSignin.signIn() threw an error:', {
                    code: signInError?.code,
                    message: signInError?.message,
                    statusCode: signInError?.statusCode,
                    statusCodes: signInError?.statusCodes,
                    error: signInError
                });

                // Handle specific error codes
                if (signInError?.code === 'SIGN_IN_CANCELLED') {
                    console.log('ℹ️ User cancelled sign-in');
                    return; // Don't show error for user cancellation
                } else if (signInError?.code === 'IN_PROGRESS') {
                    console.log('⏳ Sign-in already in progress');
                    return;
                } else if (signInError?.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
                    throw new Error('Google Play Services not available');
                } else {
                    // Re-throw the specific error
                    throw signInError;
                }
            }

            // The structure from Expo's implementation is different - data is nested
            // Expo adds a wrapper with { type: 'success', data: { actual response } }
            console.log('📋 Google Sign-In raw result:', JSON.stringify(signInResult, null, 2));

            // Extract the data based on the structure
            let userData;
            let idToken;

            console.log('🔍 Attempting to extract user data and token...');

            if (signInResult?.type === 'success' && signInResult?.data) {
                // Expo structure
                console.log('📋 Using Expo structure');
                userData = signInResult.data.user;
                idToken = signInResult.data.idToken;
            } else {
                // Regular structure
                console.log('📋 Using regular structure');
                userData = signInResult?.user;
                idToken = signInResult?.idToken;
            }

            console.log('👤 Extracted userData:', userData ? 'Found' : 'Missing');
            console.log('🔑 Extracted idToken:', idToken ? 'Found' : 'Missing');
            console.log('📧 User email:', userData?.email);

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
                updateAfterLogin({
                    idToken,
                    profile: {
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
                        body: JSON.stringify({ 
                            idToken,
                            buildType: __DEV__ ? 'development' : 'production'
                        }),
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
                        updateAfterLogin({
                            idToken,
                            profile: {
                                id: userData.id,
                                name: userData.name,
                                email: userData.email,
                                photo: userData.photo,
                                familyName: userData.familyName,
                                givenName: userData.givenName,
                            },
                            accessToken: responseData.accessToken,
                            refreshToken: responseData.refreshToken,
                        });

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
            // Enhanced error logging
            console.error('🔴 Google sign in error details:', {
                name: e?.name,
                code: e?.code,
                message: e?.message,
                statusCode: e?.statusCode,
                statusCodes: e?.statusCodes,
                stack: e?.stack,
                fullError: e
            });

            // More specific error handling based on common issues
            let userFriendlyMessage = 'Failed to sign in with Google';
            let diagnosticInfo = '';

            if (e?.code === '12500' || e?.statusCode === 12500) {
                // API_NOT_CONNECTED - common with SHA-1 mismatch
                diagnosticInfo = 'API_NOT_CONNECTED: This usually indicates SHA-1 fingerprint mismatch or OAuth client misconfiguration.';
                userFriendlyMessage = 'Google Sign-In configuration error. Please check your OAuth setup.';
            } else if (e?.code === '10' || e?.statusCode === 10) {
                // DEVELOPER_ERROR - wrong configuration
                diagnosticInfo = 'DEVELOPER_ERROR: OAuth client configuration is incorrect.';
                userFriendlyMessage = 'Google Sign-In setup error. Please verify your OAuth client configuration.';
            } else if (e?.code === '12501' || e?.statusCode === 12501) {
                // SIGN_IN_CANCELLED by user
                console.log('ℹ️ User cancelled sign-in');
                return; // Don't show error notification
            } else if (e?.code === '7' || e?.statusCode === 7) {
                // NETWORK_ERROR
                diagnosticInfo = 'NETWORK_ERROR: Check your internet connection.';
                userFriendlyMessage = 'Network error. Please check your internet connection and try again.';
            } else if (e?.message?.includes('SIGN_IN_TIMEOUT')) {
                diagnosticInfo = 'SIGN_IN_TIMEOUT: This usually indicates SHA-1 fingerprint mismatch in production builds.';
                userFriendlyMessage = 'Sign-in timed out. This usually indicates a configuration issue.';
            }

            if (diagnosticInfo) {
                console.error('🔍 DIAGNOSIS:', diagnosticInfo);
            }

            // Log error info for troubleshooting
            const code = e?.code || e?.statusCodes || 'UNKNOWN';
            const message = e?.message || 'No error message available';
            const statusCode = e?.statusCode || 'N/A';

            console.error('🔴 Google sign in error:', '\nError code:', code, '\nStatus code:', statusCode, '\nMessage:', message);

            notify({
                type: 'error',
                title: 'Google Sign-In Failed',
                message: userFriendlyMessage,
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
                <View style={styles.row}>
                    <GoogleSigninButton onPress={signIn} size={GoogleSigninButton.Size.Standard} color={GoogleSigninButton.Color.Dark} style={{ marginBottom: 16 }} />
                    <Pressable style={styles.debugButton} onPress={() => router.push('/debug' as any)} hitSlop={8}>
                        <Text style={styles.debugButtonText}>Debug</Text>
                    </Pressable>
                </View>
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
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#000' },
    title: { fontSize: 24, fontWeight: '600', marginBottom: 16, color: '#fff' },
    row: { flexDirection: 'row', alignItems: 'center' },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 20,
    },
    debugButton: { marginLeft: 12, backgroundColor: '#333', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6, justifyContent: 'center' },
    debugButtonText: { color: '#fff', fontWeight: '600' },
    infoContainer: {
        width: '100%',
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
    },
    label: {
        fontWeight: '600',
        marginBottom: 4,
        color: '#ccc',
    },
    value: {
        marginBottom: 16,
        fontSize: 16,
        color: '#fff',
    },
    statusBadge: {
        color: '#4caf50',
        fontWeight: '600',
    },
    tokenInfo: {
        width: '100%',
        backgroundColor: '#1a2d1a',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
    },
    tokenLabel: {
        fontWeight: '600',
        marginBottom: 4,
        color: '#66bb6a',
    },
    tokenValue: {
        marginBottom: 16,
        fontSize: 14,
        fontFamily: 'monospace',
        color: '#c8e6c9',
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
