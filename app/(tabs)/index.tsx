import {
  View,
  Text,
  Button,
  ActivityIndicator,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useLocation } from "../../hooks/useLocation";
import LogViewer from "../../components/LogViewer";
import BatteryInfo from "../../components/BatteryInfo";

export default function LocationComponent() {
  const { location, address, error, loading, fetchLocation } = useLocation();

  const textColor = "#ffffff";

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={imgStyles.image}
        />

        <LogViewer />

        {/* Battery information */}
        <BatteryInfo />

        {/* Location / Map */}
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
              {location.coords.latitude} - {location.coords.longitude}
            </Text>

            <View style={styles.mapContainer}>
              <MapView
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
                showsUserLocation={true}
                loadingEnabled={true}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: 20,
    alignItems: "center",
  },
  container: {
    width: "90%",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    marginVertical: 8,
    textAlign: "center",
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
  mapContainer: {
    width: "100%",
    height: 300,
    marginTop: 16,
    borderRadius: 10,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
});

const imgStyles = StyleSheet.create({
  image: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
});
