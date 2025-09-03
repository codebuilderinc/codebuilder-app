import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, Link } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface CustomHeaderProps {
    title: string;
    showBackButton?: boolean;
    showModalButton?: boolean;
}

export default function CustomHeader({ title, showBackButton = false, showModalButton = false }: CustomHeaderProps) {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const textColor = Colors[colorScheme ?? 'light'].text;

    return (
        <View style={styles.container}>
            {showBackButton && (
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <FontAwesome name="arrow-left" size={22} color={textColor} />
                </Pressable>
            )}

            <Text style={[styles.title, { color: textColor }]}>{title}</Text>

            {showModalButton && (
                <Link href="/modal" asChild style={styles.rightButton}>
                    <Pressable>{({ pressed }) => <FontAwesome name="info-circle" size={25} color={textColor} style={{ opacity: pressed ? 0.5 : 1 }} />}</Pressable>
                </Link>
            )}

            {!showModalButton && <View style={styles.placeholderRight} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        backgroundColor: '#121212',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingTop: 5,
        marginBottom: 5,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    rightButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderRight: {
        width: 40,
    },
});
