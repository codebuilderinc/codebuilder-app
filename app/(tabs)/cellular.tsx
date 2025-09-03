import { View, Text, StyleSheet } from 'react-native';
import CellularDemo from '@/components/CellularDemo';
import CustomHeader from '@/components/CustomHeader';

export default function SimplePage() {
    return (
        <View style={{ flex: 1 }}>
            <CustomHeader title="Cellular" />
            <View style={styles.container}>
                <Text style={styles.header}>My Header</Text>
                <Text style={styles.text}>This is some example text to show a plain page component.</Text>
                <CellularDemo />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#121212',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    text: {
        fontSize: 16,
        color: '#ccc',
        textAlign: 'center',
    },
});
