import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View, Button } from 'react-native';
import { ConsoleView } from 'react-native-console-view';

const LogViewer = () => {
    const [logs, setLogs] = useState<string[]>([]);

    const flushingRef = useRef(false);
    useEffect(() => {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        const enqueue = (level: 'log' | 'error' | 'warn', args: any[]) => {
            // Defer state update to microtask to avoid setState during another component's render
            Promise.resolve().then(() => {
                setLogs((prev) => [...prev, `[${level.toUpperCase()}] ${args.map(String).join(' ')}`]);
            });
        };

        console.log = (...args) => {
            enqueue('log', args);
            originalLog(...args);
        };
        console.error = (...args) => {
            enqueue('error', args);
            originalError(...args);
        };
        console.warn = (...args) => {
            enqueue('warn', args);
            originalWarn(...args);
        };

        return () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, []);

    return (
        <View
            style={{
                flex: 1,
                padding: 10,
                backgroundColor: 'black',
                borderRadius: 15, // Rounded corners
                borderWidth: 2, // Border thickness
                borderColor: 'white', // White border
                margin: 10, // Margin for better visibility
            }}
        >
            <ConsoleView enabled={true} breakpoint={'mobile'} />
            <ScrollView style={{ marginTop: 10 }}>
                {logs.map((log, index) => (
                    <Text key={index} style={{ color: 'white', fontSize: 12 }}>
                        {log}
                    </Text>
                ))}
            </ScrollView>
            <Button title="Clear Logs" onPress={() => setLogs([])} />
        </View>
    );
};

export default LogViewer;
