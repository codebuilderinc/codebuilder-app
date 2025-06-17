import React, { Component, ReactNode, ErrorInfo } from "react";
import { View, Text, Button, StyleSheet, ScrollView } from "react-native";
import { reportError } from "@/services/errorReporting.service";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // FIX: Calling reportError with the correct 'options' object.
    reportError(error, { errorInfo });
  }

  handleResetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong.</Text>
          <Text style={styles.subtitle}>
            Our team has been notified. Please try again.
          </Text>
          <ScrollView style={styles.errorContainer}>
            <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
          </ScrollView>
          <Button title="Try Again" onPress={this.handleResetError} />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fefefe",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#555",
  },
  errorContainer: {
    maxHeight: 200,
    width: "100%",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  errorText: {
    color: "#d32f2f",
    fontFamily: "monospace",
  },
});

export default ErrorBoundary;
