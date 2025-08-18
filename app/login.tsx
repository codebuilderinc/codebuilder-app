import { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
    const { setUser } = useAuth();

    useEffect(() => {
        const webClientId =
            Constants.expoConfig?.extra?.googleWebClientId ||
            // Expo public envs are embedded at bundle-time
            (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as string | undefined);
        if (!webClientId) {
            console.warn(
                'Google Web Client ID is missing. Set GOOGLE_WEB_CLIENT_ID (app.config.js) or EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env/EAS env. Falling back to no offline access.'
            );
            // Configure without offline access to avoid runtime error
            GoogleSignin.configure({});
            return;
        }
        GoogleSignin.configure({
            webClientId,
            // offlineAccess allows getting a refresh token; requires a Server (Web) OAuth client ID
            offlineAccess: true,
        });
    }, []);

    const signIn = async () => {
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const result = await GoogleSignin.signIn();

            // @react-native-google-signin/google-signin returns an object with idToken and user
            if (result?.idToken) {
                setUser({ idToken: result.idToken, user: result.user });
                fetch('https://new.codebuilder.org/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken: result.idToken }),
                }).catch((e) => console.error('Auth callback error:', e));
            } else {
                console.warn('Google sign in did not return an idToken.');
            }
        } catch (e: any) {
            // Log richer error info for troubleshooting (code, description)
            const code = e?.code || e?.statusCodes || 'UNKNOWN';
            console.error('Google sign in error:', code, e?.message || e);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <GoogleSigninButton onPress={signIn} size={GoogleSigninButton.Size.Wide} color={GoogleSigninButton.Color.Dark} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
});
