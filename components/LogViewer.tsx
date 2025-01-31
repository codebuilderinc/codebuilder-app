import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Button } from "react-native";
import { ConsoleView } from "react-native-console-view";

const LogViewer = () => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const originalLog = console.log;
    console.log = (...args) => {
      setLogs((prevLogs) => [...prevLogs, args.map(String).join(" ")]);
      originalLog(...args);
    };

    return () => {
      console.log = originalLog; // Restore original console.log on unmount
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        padding: 10,
        backgroundColor: "black",
        borderRadius: 15, // Rounded corners
        borderWidth: 2, // Border thickness
        borderColor: "white", // White border
        margin: 10, // Margin for better visibility
      }}
    >
      <ConsoleView enabled={true} breakpoint={"mobile"} />
      <ScrollView style={{ marginTop: 10 }}>
        {logs.map((log, index) => (
          <Text key={index} style={{ color: "white", fontSize: 12 }}>
            {log}
          </Text>
        ))}
      </ScrollView>
      <Button title="Clear Logs" onPress={() => setLogs([])} />
    </View>
  );
};

export default LogViewer;
