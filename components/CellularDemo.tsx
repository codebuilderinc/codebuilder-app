import React from "react";
import { ScrollView, Text, StyleSheet, View, Button } from "react-native";
import { useCeullar } from "@/hooks/useCellular";
import * as Cellular from "expo-cellular";

const CellularDemo = () => {
  const { cellularInfo, refreshCellularInfo, requestPermissionsAsync } =
    useCeullar();

  const [status, requestPermission] = Cellular.usePermissions();

  const handleRequestPermissions = async () => {
    try {
      await requestPermissionsAsync();
      refreshCellularInfo(); // Refresh state to show updated permissions
    } catch (error) {
      console.error("Permission request failed:", error);
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Cellular Info Demo</Text>
      <Text style={styles.text}>
        Allows VoIP:{" "}
        {cellularInfo.allowsVoip !== null
          ? String(cellularInfo.allowsVoip)
          : "N/A"}
      </Text>
      <Text style={styles.text}>Carrier: {cellularInfo.carrier || "N/A"}</Text>
      <Text style={styles.text}>
        Cellular Generation:{" "}
        {Cellular.CellularGeneration[cellularInfo.cellularGeneration] ||
          "UNKNOWN"}
      </Text>
      <Text style={styles.text}>
        ISO Country Code: {cellularInfo.isoCountryCode || "N/A"}
      </Text>
      <Text style={styles.text}>
        Mobile Country Code: {cellularInfo.mobileCountryCode || "N/A"}
      </Text>
      <Text style={styles.text}>
        Mobile Network Code: {cellularInfo.mobileNetworkCode || "N/A"}
      </Text>
      <Text style={styles.text}>
        Permission Status:{" "}
        {cellularInfo.permission ? cellularInfo.permission.status : "N/A"}
      </Text>

      <View style={styles.buttonContainer}>
        <Button
          title="Refresh Info"
          onPress={refreshCellularInfo}
          color="#61dafb"
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Request Permissions"
          onPress={handleRequestPermissions}
          color="#61dafb"
        />
      </View>
    </ScrollView>
  );
};

export default CellularDemo;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#121212",
    alignItems: "flex-start",
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    color: "#ffffff",
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    color: "#ffffff",
  },
  buttonContainer: {
    marginVertical: 10,
    width: "100%",
  },
});
