import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const { setUser } = useAuth();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: Constants.expoConfig?.extra?.googleWebClientId,
    });
  }, []);

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      if (result.type === 'success') {
        setUser({ idToken: result.data.idToken ?? '', user: result.data.user });
        fetch('https://new.codebuilder.org/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: result.data.idToken }),
        }).catch((e) => console.error('Auth callback error:', e));
      }
    } catch (e) {
      console.error('Google sign in error:', e);
    }
  };

  return (
    <View style={styles.container}>
      <GoogleSigninButton
        onPress={signIn}
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
