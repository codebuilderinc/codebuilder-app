import * as LocationLibrary from "expo-location";

const tsLog = (...args: any[]) => {
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log('[location][' + ts + ']', ...args);
};

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
  // Token now solely managed by SessionProvider; do not attempt legacy global fallback
  let effectiveToken = token;

  if (!effectiveToken) {
    tsLog(
      "No FCM token available; skipping save location.",
      { passedTokenNull: !token }
    );
    return;
  }
  tsLog("Saving location to server", { tokenTail: effectiveToken.slice(-8) });

  try {
    const payload = {
      subscriptionId: effectiveToken,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    const response = await fetch("https://api.codebuilder.org/location", {
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

  tsLog("Location saved successfully");
  } catch (error: any) {
  tsLog("Error saving location to server", error?.message || error);
  }
};
