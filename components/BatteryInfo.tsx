import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Animated,
  Easing,
  Button,
  Platform,
  Alert,
} from "react-native";
import { useBattery } from "../hooks/useBattery";
import * as Battery from "expo-battery";
import { NativeModules } from "react-native";
const BatteryInfo = () => {
  const {
    batteryLevel,
    isCharging,
    batteryState,
    powerState,
    lowPowerMode,
    openBatteryOptimizationSettings,
  } = useBattery();

  const batteryPercent = batteryLevel !== null ? batteryLevel * 100 : null;

  const [animatedWidth] = useState(new Animated.Value(0));
  const [pulseOpacity] = useState(new Animated.Value(1));

  useEffect(() => {
    if (batteryLevel !== null) {
      animatedWidth.setValue(batteryLevel * 100);
      Animated.timing(animatedWidth, {
        toValue: batteryLevel * 100,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false, // Can't use native driver for width animations
      }).start();
    }
  }, [batteryLevel]);

  useEffect(() => {
    if (isCharging) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.6,
            duration: 600,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 1,
            duration: 600,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      pulseOpacity.setValue(1); // Reset opacity when not charging
    }
  }, [isCharging]);

  // Get battery bar color based on level
  const getBatteryColor = (level: number) => {
    if (level > 80) return "#00ff00"; // Green
    if (level > 50) return "#ffa500"; // Orange
    if (level > 20) return "#ffff00"; // Yellow
    return "#ff0000"; // Red
  };

  return (
    <View style={styles.container}>
      <View style={styles.batteryContainer}>
        <Text style={styles.batteryText}>
          Battery Level:{" "}
          {batteryLevel !== null
            ? `${(batteryLevel * 100).toFixed(0)}%`
            : "Loading..."}
        </Text>
        <Text style={styles.batteryText}>
          Is Charging:{" "}
          {isCharging !== null ? (isCharging ? "Yes" : "No") : "Loading..."}
        </Text>
        <Text style={styles.batteryText}>
          Battery State:{" "}
          {batteryState !== null
            ? Battery.BatteryState[batteryState]
            : "Loading..."}
        </Text>

        {/* Formatted Power State */}
        <View style={styles.powerStateContainer}>
          <Text style={styles.batteryText}>Power State:</Text>
          {powerState ? (
            Object.entries(powerState).map(([key, value]) => (
              <Text key={key} style={styles.powerStateText}>
                {key}: {String(value)}
              </Text>
            ))
          ) : (
            <Text style={styles.batteryText}>Loading...</Text>
          )}
        </View>

        <Text style={styles.batteryText}>
          Low Power Mode:{" "}
          {lowPowerMode !== null
            ? lowPowerMode
              ? "Enabled"
              : "Disabled"
            : "Loading..."}
        </Text>

        {/* Battery Level Bar */}
        <View style={styles.batteryBarContainer}>
          <Animated.View
            style={[
              styles.batteryBar,
              {
                width: animatedWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["5%", "100%"], // Ensure minimum width for visibility
                }),
                backgroundColor:
                  batteryPercent !== null
                    ? getBatteryColor(batteryPercent)
                    : styles.batteryBarContainer.backgroundColor,
                opacity: pulseOpacity, // Charging animation effect
              },
            ]}
          />
        </View>

        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontSize: 18, marginBottom: 20 }}>
            Disable Battery Optimization
          </Text>
          <Button
            title="Disable Battery Optimization"
            onPress={openBatteryOptimizationSettings}
          />
        </View>
      </View>
    </View>
  );
};

export default BatteryInfo;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#000000",
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    margin: 10,
  },
  batteryContainer: {
    borderRadius: 8,
    padding: 10,
    marginVertical: 12,
    width: "100%",
  },
  batteryText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 4,
  },
  powerStateContainer: {
    marginBottom: 8,
  },
  powerStateText: {
    color: "#AAAAAA",
    fontSize: 14,
  },
  batteryBarContainer: {
    width: "100%",
    height: 20,
    borderRadius: 10,
    backgroundColor: "#444",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    overflow: "hidden",
  },
  batteryBar: {
    height: "100%",
    borderRadius: 10,
  },
});
