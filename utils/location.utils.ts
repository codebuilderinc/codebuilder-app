import * as LocationLibrary from "expo-location";
import { getFcmToken } from "../hooks/usePushNotifications";

/**
 * Request location permissions.
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  const { status } = await LocationLibrary.getForegroundPermissionsAsync();

  if (status !== "granted") {
    const { status: newStatus } =
      await LocationLibrary.requestForegroundPermissionsAsync();
    return newStatus === "granted";
  }

  return true;
};

/**
 * Get the current location of the device.
 */
export const getCurrentLocation =
  async (): Promise<LocationLibrary.LocationObject | null> => {
    try {
      const location = await LocationLibrary.getCurrentPositionAsync({});
      return location;
    } catch (error) {
      console.error("Failed to get current location:", error);
      return null;
    }
  };

/**
 * Reverse geocode a location to get an address.
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<LocationLibrary.LocationGeocodedAddress | null> => {
  try {
    const geoAddress = await LocationLibrary.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    return geoAddress[0] || null;
  } catch (error) {
    console.error("Failed to reverse geocode:", error);
    return null;
  }
};

/**
 * Save the user's location to the backend API.
 */
export const saveLocation = async (
  location: LocationLibrary.LocationObject,
  geoAddress: LocationLibrary.LocationGeocodedAddress,
  token: string | null
): Promise<void> => {
  if (!token) {
    console.log("No FCM token available; skipping save location.");
    return;
  }

  console.log("Saving location to server...", token);

  try {
    const payload = {
      subscriptionId: token,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    const response = await fetch("https://new.codebuilder.org/api/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.text(); // Always try to read the body, even if it's empty

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}\nResponse Body: ${
          responseBody || "No content"
        }`
      );
    }

    console.log("Location and address saved to server successfully.");
  } catch (error: any) {
    console.error("Error saving location to server:", error?.message || error);
  }
};
