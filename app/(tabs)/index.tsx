import { View, Button, StyleSheet, Image, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import LogViewer from '@/components/LogViewer';
import BatteryInfo from '@/components/BatteryInfo';
import CustomHeader from '@/components/CustomHeader';
import * as Sentry from '@sentry/react-native';

export default function HomeScreen() {
    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <CustomHeader title="Home" showModalButton={true} />
            <ScrollView contentContainerStyle={styles.scrollContent} style={{ flex: 1 }}>
                <View style={styles.container}>
                    <Image source={require('../../assets/images/icon.png')} style={imgStyles.image} />

                    <LogViewer />

                    {/* Battery information */}
                    <BatteryInfo />

                    {/* Link to Login page */}
                    <View style={{ marginTop: 12 }}>
                        <Link href="/login" asChild>
                            <Button title="Go to Login" />
                        </Link>
                        <Button title='Try!' onPress={ () => { Sentry.captureException(new Error('First error')) }}/>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    container: {
        width: '90%',
        alignItems: 'center',
    },
    batteryContainer: {
        borderRadius: 8,
        padding: 10,
        marginVertical: 12,
        width: '100%',
    },
    batteryText: {
        color: '#FFFFFF',
        fontSize: 16,
        marginBottom: 4,
    },
});

const imgStyles = StyleSheet.create({
    image: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
    },
});
