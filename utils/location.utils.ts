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
  geoAddress: LocationLibrary.LocationGeocodedAddress
): Promise<void> => {
  const token = getFcmToken();

  console.log("Saving location to server...", token);

  try {
    const payload = {
      subscriptionId: token, // Add subscription ID to the payload
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude,
      accuracy: location.coords.accuracy,
      altitudeAccuracy: location.coords.altitudeAccuracy,
      heading: location.coords.heading,
      speed: location.coords.speed,
      mocked: location.mocked,
      timestamp: location.timestamp,
      city: geoAddress.city,
      country: geoAddress.country,
      district: geoAddress.district,
      formattedAddress: geoAddress.formattedAddress,
      isoCountryCode: geoAddress.isoCountryCode,
      name: geoAddress.name,
      postalCode: geoAddress.postalCode,
      region: geoAddress.region,
      street: geoAddress.street,
      streetNumber: geoAddress.streetNumber,
      subregion: geoAddress.subregion,
      timezone: geoAddress.timezone,
    };

    const response = await fetch("https://new.codebuilder.org/api/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error saving location: ${response.statusText}`);
    }

    console.log("Location and address saved to server successfully.");
  } catch (error) {
    console.error("Error saving location to server:", error);
  }
};
