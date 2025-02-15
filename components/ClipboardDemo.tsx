import React, { useState } from "react";
import {
  Button,
  TextInput,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  AppState,
} from "react-native";
import { useClipboard } from "../hooks/useClipboard";

const ClipboardDemo = () => {
  const {
    clipboardContent,
    hasCopiedText,
    copyToClipboard,
    getLatestClipboard,
    clearClipboard,
    history,
  } = useClipboard();
  const [inputText, setInputText] = useState("");
  const [latestContent, setLatestContent] = useState("");
  const [notification, setNotification] = useState("");

  const showTemporaryMessage = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(""), 2000);
  };

  const handleCopy = async () => {
    if (inputText.trim()) {
      await copyToClipboard(inputText);
      setInputText("");
      showTemporaryMessage("Copied to clipboard!");
    }
  };

  const handleGetLatest = async () => {
    const content = await getLatestClipboard();
    setLatestContent(content);
    showTemporaryMessage("Fetched latest content!");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.note}>
        {Platform.OS === "ios"
          ? "iOS: Clipboard history updates every 1.5 seconds when app is active"
          : "Android: Real-time clipboard updates supported"}
      </Text>
      <TextInput
        style={styles.input}
        value={inputText}
        onChangeText={setInputText}
        placeholder="Enter text to copy"
        placeholderTextColor="#888"
      />

      <Button title="Copy to Clipboard" onPress={handleCopy} color="#4CAF50" />

      <View style={styles.spacer} />

      <Button
        title="Get Latest Content"
        onPress={handleGetLatest}
        color="#2196F3"
      />

      <View style={styles.spacer} />

      <Button
        title="Clear Clipboard"
        onPress={clearClipboard}
        color="#ff4444"
      />

      <ScrollView style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>Clipboard History:</Text>
        {history.map((item, index) => (
          <View key={index} style={styles.historyItem}>
            <Text style={styles.historyText}>{item}</Text>
          </View>
        ))}
        {history.length === 0 && (
          <Text style={styles.placeholderText}>No clipboard history yet</Text>
        )}
      </ScrollView>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Current Content:</Text>
        <Text style={styles.content}>{clipboardContent || "Empty"}</Text>

        <Text style={styles.label}>Clipboard Status:</Text>
        <Text style={styles.status}>
          {hasCopiedText ? "Contains text" : "Empty"}
        </Text>
      </View>

      {notification && (
        <View style={styles.notification}>
          <Text style={styles.notificationText}>{notification}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 1,
    backgroundColor: "#121212",
  },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    padding: 2,
    marginBottom: 15,
    color: "#FFF",
    backgroundColor: "#242424",
    borderRadius: 6,
  },
  spacer: {
    height: 12,
  },
  infoContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#1E1E1E",
    borderRadius: 6,
  },
  label: {
    fontSize: 14,
    color: "#4CAF50",
    marginBottom: 4,
  },
  content: {
    fontSize: 14,
    color: "#FFF",
    marginBottom: 12,
  },
  status: {
    fontSize: 14,
    color: "#2196F3",
  },
  notification: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "rgba(76, 175, 80, 0.9)",
    padding: 12,
    borderRadius: 25,
    elevation: 3,
  },
  notificationText: {
    color: "white",
    fontWeight: "500",
  },
  historyContainer: {
    flex: 1,
    marginTop: 15,
    backgroundColor: "#1E1E1E",
    borderRadius: 6,
    padding: 10,
  },
  sectionTitle: {
    color: "#2196F3",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  historyItem: {
    padding: 10,
    backgroundColor: "#2D2D2D",
    borderRadius: 4,
    marginBottom: 8,
  },
  historyText: {
    color: "#FFF",
    fontSize: 14,
  },
  placeholderText: {
    color: "#888",
    textAlign: "center",
    marginTop: 10,
  },
  note: {
    color: "#888",
    fontSize: 12,
    marginBottom: 10,
    textAlign: "center",
  },
});

export default ClipboardDemo;
