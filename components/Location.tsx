import React from "react";
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  StyleSheet,
  //useColorScheme,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useLocation } from "../hooks/useLocation";
import { useNavigation } from "@react-navigation/native";

export default function LocationComponent() {
  const { location, address, error, loading, fetchLocation } = useLocation();
  //const colorScheme = useColorScheme(); // Get the current color scheme
  //const textColor = colorScheme === "dark" ? "#ffffff" : "#000000"; // Dynamic text color
  const textColor = "#ffffff";
  console.log("Navigation context:", useNavigation());

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : error ? (
        <Text style={[styles.text, { color: textColor }]}>{error}</Text>
      ) : location && address ? (
        <>
          <Text style={[styles.text, { color: textColor }]}>
            Address: {address.name}, {address.city}, {address.region},{" "}
            {address.country}
          </Text>
          <Text style={[styles.text, { color: textColor }]}>
            {location.coords.latitude} -{location.coords.longitude}
          </Text>

          {/* Native Map */}
          <View style={styles.mapContainer}>
            <MapView
              //provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={
                location
                  ? {
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }
                  : {
                      latitude: 37.7749, // Default to San Francisco
                      longitude: -122.4194,
                      latitudeDelta: 0.05,
                      longitudeDelta: 0.05,
                    }
              }
              showsUserLocation={true} // Show user's current location
              loadingEnabled={true} // Show a loading indicator while the map loads
            >
              {location && (
                <Marker
                  coordinate={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }}
                  title="You are here"
                />
              )}
            </MapView>
          </View>
        </>
      ) : (
        <Text style={[styles.text, { color: textColor }]}>
          Waiting for location...
        </Text>
      )}

      <Button title="Get Location" onPress={fetchLocation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  text: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  mapContainer: {
    width: "100%",
    height: 300, // Ensure a fixed height
    marginTop: 16,
    borderRadius: 10,
    overflow: "hidden",
  },
  map: {
    width: "100%", // Explicit width
    height: "100%", // Explicit height
  },
});
