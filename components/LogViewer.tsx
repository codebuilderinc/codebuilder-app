import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View, Button, StyleSheet } from 'react-native';
import { ConsoleView } from 'react-native-console-view';

// Log level types and styling properties
type LogLevel = 'log' | 'error' | 'warn';

// Emoji indicators for each log level
const emojiForLevel: Record<LogLevel, string> = {
    log: '🟢',
    error: '🔴',
    warn: '🟡',
};

// Colors for each log level
const colorForLevel: Record<LogLevel, string> = {
    log: '#2ecc40', // Green
    error: '#e74c3c', // Red
    warn: '#f1c40f', // Yellow
};

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
}

const LogViewer = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const scrollViewRef = useRef<ScrollView>(null);

    // Flag to prevent recursive logging
    const isLoggingRef = useRef(false);

    useEffect(() => {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        const enqueue = (level: LogLevel, args: any[]) => {
            // Prevent recursive logging
            if (isLoggingRef.current) {
                return;
            }

            try {
                isLoggingRef.current = true;

                // Format timestamp for better readability
                const now = new Date();
                const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now
                    .getSeconds()
                    .toString()
                    .padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

                // Safely convert args to strings
                let messageStr = '';
                try {
                    messageStr = args
                        .map((arg) => {
                            if (typeof arg === 'string') return arg;
                            if (arg instanceof Error) return arg.toString();
                            try {
                                return JSON.stringify(arg);
                            } catch (e) {
                                return String(arg);
                            }
                        })
                        .join(' ');
                } catch (err) {
                    messageStr = 'Error stringifying log message';
                }

                // Defer state update to microtask to avoid setState during another component's render
                Promise.resolve().then(() => {
                    setLogs((prev) => {
                        // Add new log to the beginning (newest first)
                        const newLogs = [
                            {
                                level,
                                message: messageStr,
                                timestamp,
                            },
                            ...prev,
                        ];

                        // Keep only the latest 100 logs to prevent memory issues
                        return newLogs.slice(0, 100);
                    });
                });
            } finally {
                isLoggingRef.current = false;
            }
        };

        console.log = (...args) => {
            originalLog(...args);
            enqueue('log', args);
        };
        console.error = (...args) => {
            originalError(...args);
            enqueue('error', args);
        };
        console.warn = (...args) => {
            originalWarn(...args);
            enqueue('warn', args);
        };

        return () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, []);

    // We don't need auto-scroll since newest logs are at the top
    useEffect(() => {
        if (scrollViewRef.current && logs.length > 0) {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
    }, [logs.length]);

    return (
        <View style={styles.container}>
            <ConsoleView enabled={true} breakpoint={'mobile'} />
            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                scrollEnabled={true}
            >
                {logs.map((log, index) => (
                    <View key={index} style={styles.logItem}>
                        <Text style={[styles.logHeader, { color: colorForLevel[log.level] }]}>
                            {emojiForLevel[log.level]} [{log.timestamp}] [{log.level.toUpperCase()}]
                        </Text>
                        <Text style={styles.logMessage}>{log.message}</Text>
                        {index < logs.length - 1 && <View style={styles.separator} />}
                    </View>
                ))}
            </ScrollView>
            <View style={styles.buttonContainer}>
                <Button title="Clear Logs" color="#3498db" onPress={() => setLogs([])} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        backgroundColor: '#121212',
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#3498db',
        margin: 10,
        height: 400, // Fixed height instead of flex: 1
        overflow: 'hidden', // Prevent content from overflowing
    },
    scrollView: {
        marginTop: 10,
        height: 300, // Fixed height to ensure scrollability
        flexGrow: 0, // Prevent expanding
    },
    scrollContent: {
        paddingBottom: 10,
    },
    logItem: {
        marginBottom: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    logHeader: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    logMessage: {
        color: 'white',
        fontSize: 12,
        marginLeft: 8,
    },
    separator: {
        borderBottomWidth: 1,
        borderBottomColor: '#444',
        marginTop: 8,
        marginBottom: 8,
    },
    buttonContainer: {
        marginTop: 10,
    },
});

export default LogViewer;
