import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { subscribe } from '@/services/notifier.service';

export type BannerItem = {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    duration: number;
};

const maxStack = 4;

function useAnimatedEntrance() {
    const translateY = useRef(new Animated.Value(-40)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
    }, [translateY, opacity]);
    return { translateY, opacity };
}

function Banner({ item, onClose }: { item: BannerItem; onClose: (id: string) => void }) {
    const { translateY, opacity } = useAnimatedEntrance();
    const color = item.type === 'success' ? '#1b5e20' : item.type === 'warning' ? '#9a6b00' : item.type === 'info' ? '#0d47a1' : '#7f0000';

    return (
        <Animated.View style={[styles.banner, { backgroundColor: color, transform: [{ translateY }], opacity }]}>
            <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>{item.title}</Text>
                <Text style={styles.bannerText} numberOfLines={3}>
                    {item.message}
                </Text>
            </View>
            <Pressable hitSlop={10} onPress={() => onClose(item.id)}>
                <Text style={styles.close}>×</Text>
            </Pressable>
        </Animated.View>
    );
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<BannerItem[]>([]);
    const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

    useEffect(() => {
        const unsub = subscribe((n) => {
            setItems((prev) => {
                const next = [...prev, n].slice(-maxStack);
                return next;
            });
            // auto-dismiss
            if (timers.current.has(n.id)) clearTimeout(timers.current.get(n.id)!);
            timers.current.set(
                n.id,
                setTimeout(() => {
                    setItems((curr) => curr.filter((x) => x.id !== n.id));
                    timers.current.delete(n.id);
                }, n.duration)
            );
        });
        return () => {
            unsub();
            // clear timers
            timers.current.forEach((t) => clearTimeout(t));
            timers.current.clear();
        };
    }, []);

    const onClose = (id: string) => {
        if (timers.current.has(id)) {
            clearTimeout(timers.current.get(id)!);
            timers.current.delete(id);
        }
        setItems((curr) => curr.filter((x) => x.id !== id));
    };

    const stack = useMemo(
        () => (
            <View pointerEvents="box-none" style={styles.container}>
                <View pointerEvents="box-none" style={styles.stack}>
                    {items.map((it) => (
                        <Banner key={it.id} item={it} onClose={onClose} />
                    ))}
                </View>
            </View>
        ),
        [items]
    );

    return (
        <View style={{ flex: 1 }}>
            {children}
            {stack}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        // allow touches to pass through except on banners
        pointerEvents: 'box-none',
    },
    stack: {
        marginTop: 40,
        paddingHorizontal: 12,
        gap: 8,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    bannerTitle: {
        fontWeight: '700',
        color: 'white',
        marginBottom: 2,
    },
    bannerText: {
        color: 'white',
    },
    close: {
        color: 'white',
        fontSize: 22,
        marginLeft: 10,
        lineHeight: 22,
    },
});
